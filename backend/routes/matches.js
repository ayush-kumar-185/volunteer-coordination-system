const express = require('express')
const router = express.Router({ mergeParams: true })
const { findMatchingVolunteers } = require('../services/matching')

router.get('/', async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ success: false, error: 'Need ID is required' })
  }

  const result = await findMatchingVolunteers(id)

  if (!result.success) {
    return res.status(404).json({ success: false, error: result.error })
  }

  res.json({ success: true, data: result })
})

module.exports = router