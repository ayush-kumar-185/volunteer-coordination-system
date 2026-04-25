const express = require('express')
const router = express.Router()
const pool = require('../db')
const { extractFieldsFromText } = require('../services/llm')
const { calculateUrgencyScore } = require('../services/scoring')
const { geocodeLocation } = require('../services/geocoding')
const { transcribeAudio } = require('../services/transcribe')
const twilio = require('twilio')
const axios = require('axios')

router.post('/', express.urlencoded({ extended: false }), async (req, res) => {
  const fromNumber = req.body.From
  const numMedia = parseInt(req.body.NumMedia) || 0
  const mediaContentType = req.body.MediaContentType0 || ''
  const bodyText = req.body.Body?.trim().toUpperCase()

  console.log(`Incoming from ${fromNumber} | Body: "${bodyText}" | NumMedia: ${numMedia}`)

  const twiml = new twilio.twiml.MessagingResponse()

  // ─── Step 1: Check if this is a volunteer YES/NO response ───
  if ((bodyText === 'YES' || bodyText === 'NO') && numMedia === 0) {
    const cleanNumber = fromNumber.replace('whatsapp:', '')
    console.log('Checking volunteer response for number:', cleanNumber)

    const volResult = await pool.query(
      'SELECT * FROM volunteers WHERE phone = $1',
      [cleanNumber]
    )

    if (volResult.rows.length > 0) {
      const volunteer = volResult.rows[0]
      console.log('Volunteer found:', volunteer.name)

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

      if (bodyText === 'YES') {
        await pool.query(
          `UPDATE needs SET status = 'confirmed' WHERE id = $1`,
          [need.id]
        )
        twiml.message(
          `Thank you ${volunteer.name}! Your assignment is confirmed.\n\n` +
          `Task: ${need.description}\n` +
          `Location: ${need.location_text || 'Check with coordinator'}\n` +
          `Category: ${need.category}\n\n` +
          `Please reach out if you need help.`
        )
        console.log(`Volunteer ${volunteer.name} ACCEPTED task ${need.id}`)

      } else {
        await pool.query(
          `UPDATE needs
           SET status = 'open',
               assigned_volunteer_id = NULL,
               assigned_at = NULL
           WHERE id = $1`,
          [need.id]
        )
        await pool.query(
          'UPDATE volunteers SET is_available = TRUE WHERE id = $1',
          [volunteer.id]
        )
        twiml.message(
          `Understood ${volunteer.name}. We will find another volunteer. Thank you.`
        )
        console.log(`Volunteer ${volunteer.name} DECLINED task ${need.id}`)
      }

      return res.type('text/xml').send(twiml.toString())
    }

    // Number not in volunteers table — fall through to treat as a report
    console.log('Number not in volunteers — treating as field worker report')
  }

  // ─── Step 2: Handle audio / voice note ───
  let rawText = ''
  let sourceChannel = 'whatsapp'

  if (numMedia > 0 && mediaContentType.includes('audio')) {
    console.log('Audio message — downloading and transcribing...')
    const mediaUrl = req.body.MediaUrl0

    try {
      const audioResponse = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        auth: {
          username: process.env.TWILIO_ACCOUNT_SID,
          password: process.env.TWILIO_AUTH_TOKEN
        }
      })

      const audioBuffer = Buffer.from(audioResponse.data)
      const transcribed = await transcribeAudio(audioBuffer, mediaContentType)

      if (!transcribed.success) {
        twiml.message('Could not transcribe your voice note. Please send a text message.')
        return res.type('text/xml').send(twiml.toString())
      }

      rawText = transcribed.text
      sourceChannel = 'voice'
      console.log('Transcribed:', rawText)

    } catch (err) {
      console.error('Audio error:', err.message)
      twiml.message('Could not process voice note. Please try again.')
      return res.type('text/xml').send(twiml.toString())
    }

  } else {
    // ─── Step 3: Regular text message ───
    rawText = req.body.Body

    if (!rawText) {
      twiml.message('Please send a message describing the community need.')
      return res.type('text/xml').send(twiml.toString())
    }
  }

  // ─── Step 4: LLM extraction ───
  const extracted = await extractFieldsFromText(rawText)

  if (!extracted.success) {
    twiml.message(
      'Could not process your report. Please include location, what is needed, and how many people are affected.'
    )
    return res.type('text/xml').send(twiml.toString())
  }

  const data = extracted.data

  // ─── Step 5: Auto geocode ───
  let finalLat = null
  let finalLng = null

  if (data.location_text) {
    const geo = await geocodeLocation(data.location_text)
    finalLat = geo.lat
    finalLng = geo.lng
  }

  // ─── Step 6: Urgency scoring ───
  const finalUrgency = calculateUrgencyScore({
    urgency_score: data.urgency_score,
    people_affected: data.people_affected,
    category: data.category,
    created_at: new Date()
  })

  // ─── Step 7: Save to DB ───
  try {
    await pool.query(
      `INSERT INTO needs
        (location_text, latitude, longitude, category, urgency_score,
         people_affected, description, source_channel)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        data.location_text,
        finalLat,
        finalLng,
        data.category,
        finalUrgency,
        data.people_affected,
        data.description,
        sourceChannel
      ]
    )

    console.log(`Saved ${sourceChannel} need — category: ${data.category}, urgency: ${finalUrgency}`)

    twiml.message(
      `Report received ✓\n` +
      `Category: ${data.category}\n` +
      `Urgency: ${finalUrgency}/10\n` +
      `Location: ${data.location_text || 'not specified'}\n\n` +
      `Our team has been notified. Thank you.`
    )
    res.type('text/xml').send(twiml.toString())

  } catch (err) {
    console.error('WhatsApp DB error:', err.message)
    twiml.message('Report received but could not be saved. Please try again.')
    res.type('text/xml').send(twiml.toString())
  }
})

module.exports = router