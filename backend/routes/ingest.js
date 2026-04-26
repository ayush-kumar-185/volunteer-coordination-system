const express = require('express')
const router = express.Router()
const pool = require('../db')
const { extractFieldsFromText } = require('../services/llm')
const { calculateUrgencyScore } = require('../services/scoring')
const { geocodeLocation } = require('../services/geocoding')

const checkDuplicate = async (location_text, category, lat, lng) => {
  try {
    console.log('Dedup check — location:', location_text, '| category:', category)

    // Fix missing geom values first
    await pool.query(`
      UPDATE needs
      SET geom = ST_MakePoint(longitude, latitude)::geography
      WHERE geom IS NULL
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `)

    // Case 1 — both records have coordinates
    // Same category + within 500 meters + last 24 hours = duplicate
    if (lat && lng) {
      const result = await pool.query(
        `SELECT id, report_count FROM needs
         WHERE category = $1
           AND status = 'open'
           AND created_at > NOW() - INTERVAL '24 hours'
           AND latitude IS NOT NULL
           AND ST_DWithin(
             ST_MakePoint(longitude, latitude)::geography,
             ST_MakePoint($2, $3)::geography,
             500
           )
         ORDER BY created_at DESC
         LIMIT 1`,
        [category, lng, lat]
      )

      console.log('Spatial dedup result:', result.rows)
      if (result.rows.length > 0) return result.rows[0]
    }

    // Case 2 — no coordinates, use strict text match
    // Must match BOTH location AND category
    // Use multiple key words for stricter matching
    if (location_text && location_text.trim().length > 0) {
      // Extract words longer than 4 chars — skip filler words
      const words = location_text
        .toLowerCase()
        .split(' ')
        .filter(w => w.length > 4)
        .slice(0, 2)  // take max 2 significant words

      if (words.length === 0) return null

      // Both words must match — AND logic, not OR
      // This prevents "Dharavi water" matching "Dharavi food"
      // because category is also checked
      let query, params

      if (words.length >= 2) {
        // Strict — both significant words must appear in location_text
        query = `
          SELECT id, report_count FROM needs
          WHERE category = $1
            AND status = 'open'
            AND created_at > NOW() - INTERVAL '24 hours'
            AND LOWER(location_text) LIKE $2
            AND LOWER(location_text) LIKE $3
          ORDER BY created_at DESC
          LIMIT 1`
        params = [category, `%${words[0]}%`, `%${words[1]}%`]
      } else {
        // Only one significant word — use it alone
        query = `
          SELECT id, report_count FROM needs
          WHERE category = $1
            AND status = 'open'
            AND created_at > NOW() - INTERVAL '24 hours'
            AND LOWER(location_text) LIKE $2
          ORDER BY created_at DESC
          LIMIT 1`
        params = [category, `%${words[0]}%`]
      }

      const result = await pool.query(query, params)
      console.log('Text dedup result:', result.rows)
      if (result.rows.length > 0) return result.rows[0]
    }

    return null

  } catch (err) {
    console.error('Dedup check error:', err.message)
    return null
  }
}



router.post('/', async (req, res) => {
  console.log('Ingest body received:', req.body)

  const { raw_text, source_channel, latitude, longitude } = req.body

  if (!raw_text) {
    return res.status(400).json({ success: false, error: 'raw_text is required' })
  }

  // LLM extraction
  const extracted = await extractFieldsFromText(raw_text)
  if (!extracted.success) {
    return res.status(422).json({ success: false, error: 'Could not extract fields from text' })
  }

  const data = extracted.data

  // Auto-geocode if no coordinates provided
  let finalLat = latitude || null
  let finalLng = longitude || null

  if (!finalLat && !finalLng && data.location_text) {
    console.log('No coordinates provided — auto-geocoding:', data.location_text)
    const geo = await geocodeLocation(data.location_text)
    finalLat = geo.lat
    finalLng = geo.lng
  }

  // Deduplication check
  console.log('Running dedup check for category:', data.category)
  const duplicate = await checkDuplicate(data.location_text, data.category, finalLat, finalLng)
  console.log('Duplicate found:', duplicate)

  // Urgency scoring
  const finalUrgency = calculateUrgencyScore({
    urgency_score: data.urgency_score,
    people_affected: data.people_affected,
    category: data.category,
    created_at: new Date()
  })

  if (duplicate) {
    await pool.query(
      `UPDATE needs
        SET report_count = report_count + 1,
            urgency_score = GREATEST(urgency_score, $1)
        WHERE id = $2`,
      [finalUrgency, duplicate.id]
    )
    return res.status(200).json({
      success: true,
      merged: true,
      message: 'Merged with existing report',
      data: { id: duplicate.id, report_count: duplicate.report_count + 1 }
    })
  }

  try {
    const result = await pool.query(
      `INSERT INTO needs
        (location_text, latitude, longitude, category, urgency_score,
         people_affected, description, source_channel)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        data.location_text,
        finalLat || null,
        finalLng || null,
        data.category,
        finalUrgency,
        data.people_affected,
        data.description,
        source_channel || 'form'
      ]
    )

    res.status(201).json({ success: true, data: result.rows[0] })

  } catch (err) {
    console.error('Ingest DB error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to save record' })
  }
})

module.exports = router