const express = require('express')
const router = express.Router()
const pool = require('../db')
const twilio = require('twilio')
const { sendDispatchSMS } = require('../services/notify')

router.post('/', express.urlencoded({ extended: false }), async (req, res) => {
  const replyText = req.body.Body?.trim().toUpperCase()
  const fromNumber = req.body.From

  console.log(`Volunteer reply from ${fromNumber}: "${replyText}"`)

  const twiml = new twilio.twiml.MessagingResponse()

  const last10 = fromNumber.replace(/\D/g, '').slice(-10);

  // Find the volunteer by phone number
  const volResult = await pool.query(
    `SELECT * FROM volunteers WHERE phone LIKE $1`,
    [`%${last10}`]
  )

  if (volResult.rows.length === 0) {
    twiml.message('Sorry, your number is not registered as a volunteer.')
    return res.type('text/xml').send(twiml.toString())
  }

  const volunteer = volResult.rows[0]

  // Find their currently assigned need
  const needResult = await pool.query(
    `SELECT * FROM needs
     WHERE assigned_volunteer_id = $1
       AND status = 'assigned'
     ORDER BY assigned_at DESC
     LIMIT 1`,
    [volunteer.id]
  )

  if (needResult.rows.length === 0) {
    twiml.message('No active task found for your number.')
    return res.type('text/xml').send(twiml.toString())
  }

  const need = needResult.rows[0]

  if (replyText === 'YES') {
    // Confirm assignment
    await pool.query(
      `UPDATE needs SET status = 'confirmed' WHERE id = $1`,
      [need.id]
    )
    twiml.message(
      `Thank you ${volunteer.name}! Your assignment is confirmed.\n\n` +
      `Location: ${need.location_text}\n` +
      `Please reach out to the coordinator if you need help.`
    )
    console.log(`Volunteer ${volunteer.name} ACCEPTED task ${need.id}`)

  } else if (replyText === 'NO') {
    // Free up volunteer and find next match
    await pool.query(
      `UPDATE needs
       SET status = 'open', assigned_volunteer_id = NULL, assigned_at = NULL
       WHERE id = $1`,
      [need.id]
    )
    await pool.query(
      'UPDATE volunteers SET is_available = TRUE WHERE id = $1',
      [volunteer.id]
    )

    twiml.message(`Understood ${volunteer.name}. We will find another volunteer. Thank you.`)
    console.log(`Volunteer ${volunteer.name} DECLINED task ${need.id} — reopening`)

  } else {
    twiml.message('Please reply YES to accept or NO to decline your assigned task.')
  }

  res.type('text/xml').send(twiml.toString())
})

module.exports = router