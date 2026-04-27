const express = require('express')
const router = express.Router()
const pool = require('../db')
const { calculateUrgencyScore } = require('../services/scoring')

router.get('/', async (req, res) => {
  const { status } = req.query

  try {
    let query = 'SELECT * FROM needs'
    const params = []

    if (status) {
      query += ' WHERE status = $1'
      params.push(status)
    }

    query += ' ORDER BY urgency_score DESC, created_at DESC'

    const result = await pool.query(query, params)

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    })

  } catch (err) {
    console.error('Needs fetch error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch needs' })
  }
})



// GET /api/needs/gaps — needs open 6+ hours with no volunteer assigned
router.get('/gaps', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         *,
         EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_open
       FROM needs
       WHERE status = 'open'
         AND created_at < NOW() - INTERVAL '6 hours'
       ORDER BY urgency_score DESC, created_at ASC`
    )

    res.json({
      success: true,
      count: result.rows.length,
      message: result.rows.length > 0
        ? `${result.rows.length} needs have been open for 6+ hours with no volunteer`
        : 'No critical gaps right now',
      data: result.rows
    })

  } catch (err) {
    console.error('Gap detection error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch gaps' })
  }
})

// GET /api/needs/stats — impact numbers for the dashboard
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open') AS open_needs,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_needs,
        COUNT(*) FILTER (WHERE status = 'closed') AS resolved_needs,
        COUNT(*) AS total_needs,
        COALESCE(SUM(people_affected) FILTER (WHERE status = 'closed'), 0) AS people_helped,
        COALESCE(SUM(report_count), 0) AS total_reports_received
      FROM needs
    `)

    const volunteerResult = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE is_available = FALSE) AS deployed FROM volunteers`
    )

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        volunteers_deployed: volunteerResult.rows[0].deployed
      }
    })

  } catch (err) {
    console.error('Stats error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

module.exports = router