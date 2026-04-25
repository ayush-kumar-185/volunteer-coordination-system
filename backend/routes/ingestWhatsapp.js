const express = require('express')
const router = express.Router()
const pool = require('../db')
const { extractFieldsFromText } = require('../services/llm')
const { calculateUrgencyScore } = require('../services/scoring')
const twilio = require('twilio')

router.post('/', express.urlencoded({ extended: false }), async (req, res) => {
  // Validate the request actually came from Twilio
  // const twilioSignature = req.headers['x-twilio-signature']
  // const authToken = process.env.TWILIO_AUTH_TOKEN
  // const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`

  // const isValid = twilio.validateRequest(authToken, twilioSignature, url, req.body)
  // if (!isValid) {
  //   console.warn('Invalid Twilio signature — request rejected')
  //   return res.status(403).send('Forbidden')
  // }

  const incomingMsg = req.body.Body
  const fromNumber = req.body.From

  if (!incomingMsg) {
    return res.status(400).send('No message body')
  }

  console.log(`WhatsApp message from ${fromNumber}: "${incomingMsg}"`)

  const twiml = new twilio.twiml.MessagingResponse()

  // Step 1 — LLM extraction
  const extracted = await extractFieldsFromText(incomingMsg)

  if (!extracted.success) {
    twiml.message(
      'Sorry, we could not process your report. Please include details like location, what is needed, and how many people are affected.'
    )
    return res.type('text/xml').send(twiml.toString())
  }

  const data = extracted.data

  // Step 2 — Urgency scoring
  const finalUrgency = calculateUrgencyScore({
    urgency_score: data.urgency_score,
    people_affected: data.people_affected,
    category: data.category,
    created_at: new Date()
  })

  // Step 3 — Save to DB
  try {
    await pool.query(
      `INSERT INTO needs
        (location_text, category, urgency_score, people_affected, description, source_channel)
       VALUES ($1,$2,$3,$4,$5,'whatsapp')`,
      [
        data.location_text,
        data.category,
        finalUrgency,
        data.people_affected,
        data.description
      ]
    )

    console.log(`Saved WhatsApp need — category: ${data.category}, urgency: ${finalUrgency}`)

    // Send confirmation back to the sender
    twiml.message(
      `Report received ✓\nCategory: ${data.category}\nUrgency: ${finalUrgency}/10\nLocation: ${data.location_text || 'not specified'}\n\nOur team has been notified. Thank you.`
    )
    res.type('text/xml').send(twiml.toString())

  } catch (err) {
    console.error('WhatsApp DB error:', err.message)
    twiml.message('Report received but could not be saved. Please try again.')
    res.type('text/xml').send(twiml.toString())
  }
})

module.exports = router