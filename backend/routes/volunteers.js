const express = require('express')
const router = express.Router()
const pool = require('../db')
const { geocodeLocation } = require('../services/geocoding')

// POST /api/volunteers — register new volunteer
router.post('/', async (req, res) => {
  const { name, phone, skills, available_hours, latitude, longitude, location_text } = req.body

  if (!name || !phone || !skills) {
    return res.status(400).json({
      success: false,
      error: 'name, phone and skills are required'
    })
  }

  try {
    let finalLat = latitude || null
    let finalLng = longitude || null

    // Auto-geocode if location text provided but no coordinates
    if (!finalLat && location_text) {
      const geo = await geocodeLocation(location_text)
      finalLat = geo.lat
      finalLng = geo.lng
    }

    const geom = finalLat && finalLng
      ? `ST_MakePoint(${finalLng}, ${finalLat})::geography`
      : null

    const result = await pool.query(
      `INSERT INTO volunteers
        (name, phone, skills, available_hours, latitude, longitude, geom)
       VALUES ($1,$2,$3,$4,$5,$6,${geom ? `ST_MakePoint($6, $5)::geography` : 'NULL'})
       RETURNING id, name, phone, skills, available_hours, latitude, longitude, is_available`,
      [name, phone, skills, available_hours || 8, finalLat, finalLng]
    )

    res.status(201).json({ success: true, data: result.rows[0] })

  } catch (err) {
    console.error('Volunteer register error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to register volunteer' })
  }
})

// GET /api/volunteers — list all volunteers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, phone, skills, available_hours,
              is_available, latitude, longitude, created_at
       FROM volunteers
       ORDER BY is_available DESC, created_at DESC`
    )
    res.json({ success: true, count: result.rows.length, data: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/volunteers/:id/tasks — task history
router.get('/:id/tasks', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, category, urgency_score, location_text, description,
              status, assigned_at, resolved_at, people_affected
       FROM needs
       WHERE assigned_volunteer_id = $1
       ORDER BY assigned_at DESC`,
      [req.params.id]
    )
    res.json({ success: true, count: result.rows.length, data: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/volunteers/:id/availability — toggle availability
router.patch('/:id/availability', async (req, res) => {
  const { is_available } = req.body

  if (typeof is_available !== 'boolean') {
    return res.status(400).json({ success: false, error: 'is_available must be true or false' })
  }

  try {
    const result = await pool.query(
      `UPDATE volunteers
       SET is_available = $1
       WHERE id = $2
       RETURNING id, name, is_available`,
      [is_available, req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' })
    }

    res.json({ success: true, data: result.rows[0] })

  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router