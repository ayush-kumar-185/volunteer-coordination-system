const express = require('express')
const router = express.Router()
const pool = require('../db')
const { extractFieldsFromText } = require('../services/llm')
const { calculateUrgencyScore } = require('../services/scoring')

const checkDuplicate = async (location_text, category, lat, lng) => {
  try {
    console.log('Checking duplicate — location:', location_text, '| category:', category, '| lat:', lat, '| lng:', lng)

    // geom is updated via database trigger

    // Case 1 — coordinates provided on both records, use spatial check
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
             1000
           )
         ORDER BY created_at DESC
         LIMIT 1`,
        [category, lng, lat]
      )

      console.log('Spatial duplicate check result:', result.rows)

      if (result.rows.length > 0) return result.rows[0]
    }

    // Case 2 — no coordinates, use fuzzy text match on location
    if (location_text) {
      // Extract meaningful words (ignore short words like "in", "at", "near")
      const words = location_text
        .split(' ')
        .filter(w => w.length > 3)
        .slice(0, 3)  // take first 3 meaningful words

      if (words.length === 0) return null

      // Build a pattern that checks if ANY of the key words match
      const pattern = `%(${words.join('|')})%`
      console.log('Text duplicate pattern:', pattern)

      const result = await pool.query(
        `SELECT id, report_count FROM needs
         WHERE category = $1
           AND status = 'open'
           AND created_at > NOW() - INTERVAL '24 hours'
           AND location_text ILIKE ANY(ARRAY[$2,$3,$4])
         ORDER BY created_at DESC
         LIMIT 1`,
        [
          category,
          `%${words[0]}%`,
          words[1] ? `%${words[1]}%` : `%${words[0]}%`,
          words[2] ? `%${words[2]}%` : `%${words[0]}%`
        ]
      )

      console.log('Text duplicate check result:', result.rows)

      if (result.rows.length > 0) return result.rows[0]
    }

    return null

  } catch (err) {
    console.error('Duplicate check error:', err.message)
    return null  // on error, don't block ingestion — just save as new record
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

  // Deduplication check
  console.log('Running dedup check for category:', data.category)
  const duplicate = await checkDuplicate(data.location_text, data.category, latitude, longitude)
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
        latitude || null,
        longitude || null,
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