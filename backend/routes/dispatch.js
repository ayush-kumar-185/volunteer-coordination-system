const express = require('express')
const router = express.Router({ mergeParams: true })
const pool = require('../db')
const { sendDispatchSMS } = require('../services/notify')

// POST /api/needs/:id/dispatch — assign a volunteer to a need
router.post('/dispatch', async (req, res) => {
  const { id } = req.params
  const { volunteer_id } = req.body

  if (!volunteer_id) {
    return res.status(400).json({ success: false, error: 'volunteer_id is required' })
  }

  try {
    // Check need exists and is open
    const needCheck = await pool.query(
      'SELECT * FROM needs WHERE id = $1 AND status = $2',
      [id, 'open']
    )

    if (needCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Need not found or already assigned' })
    }

    // Check volunteer exists and is available
    const volCheck = await pool.query(
      'SELECT * FROM volunteers WHERE id = $1 AND is_available = TRUE',
      [volunteer_id]
    )

    if (volCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Volunteer not found or unavailable' })
    }

    // Update need status to assigned
    await pool.query(
      `UPDATE needs
       SET status = 'assigned', assigned_volunteer_id = $1, assigned_at = NOW()
       WHERE id = $2`,
      [volunteer_id, id]
    )

    // Mark volunteer as unavailable
    await pool.query(
      'UPDATE volunteers SET is_available = FALSE WHERE id = $1',
      [volunteer_id]
    )

    const volunteer = volCheck.rows[0]
    const need = needCheck.rows[0]

    const smsResult = await sendDispatchSMS(
      { name: volunteer.name, phone: volunteer.phone },
      { 
        category: need.category,
        location_text: need.location_text,
        urgency_score: need.urgency_score,
        people_affected: need.people_affected,
        description: need.description
      }
    )

    res.json({
      success: true,
      message: `${volunteer.name} has been assigned and notified via SMS`,
      data: {
        need_id: id,
        volunteer_id,
        volunteer_name: volunteer.name,
        volunteer_phone: volunteer.phone,
        need_category: need.category,
        need_location: need.location_text
      }
    })

  } catch (err) {
    console.error('Dispatch error:', err.message)
    res.status(500).json({ success: false, error: 'Dispatch failed' })
  }
})

// POST /api/needs/:id/complete — mark need as resolved
router.post('/complete', async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      `UPDATE needs
       SET status = 'closed', resolved_at = NOW()
       WHERE id = $1 AND status = 'assigned'
       RETURNING *, assigned_volunteer_id`,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Need not found or not yet assigned' })
    }

    // Free up the volunteer
    if (result.rows[0].assigned_volunteer_id) {
      await pool.query(
        'UPDATE volunteers SET is_available = TRUE WHERE id = $1',
        [result.rows[0].assigned_volunteer_id]
      )
    }

    res.json({
      success: true,
      message: 'Need marked as resolved',
      data: result.rows[0]
    })

  } catch (err) {
    console.error('Complete error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to mark complete' })
  }
})

module.exports = router