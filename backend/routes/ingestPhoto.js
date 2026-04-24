const express = require('express')
const router = express.Router()
const multer = require('multer')
const Tesseract = require('tesseract.js')
const pool = require('../db')
const { extractFieldsFromText } = require('../services/llm')
const { calculateUrgencyScore } = require('../services/scoring')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'))
    }
  }
})

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Image file is required. Send as form-data with key "image"' })
  }

  try {
    // Step 1 — OCR with Tesseract
    console.log('Running OCR on uploaded image...')
    const { data: { text, confidence } } = await Tesseract.recognize(
      req.file.buffer,
      'eng+hin',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            process.stdout.write(`\rOCR progress: ${Math.floor(m.progress * 100)}%`)
          }
        }
      }
    )
    console.log(`\nOCR complete — confidence: ${confidence.toFixed(1)}%`)

    if (!text || text.trim().length < 5) {
      return res.status(422).json({
        success: false,
        error: 'No readable text found in image. Try a clearer photo.'
      })
    }

    const rawText = text.trim()
    console.log('Extracted text:', rawText)

    // Step 2 — LLM extraction
    const extracted = await extractFieldsFromText(rawText)
    if (!extracted.success) {
      return res.status(422).json({
        success: false,
        error: 'Could not extract fields from the text in this image',
        raw_text: rawText
      })
    }

    const data = extracted.data

    // Step 3 — Urgency scoring
    const finalUrgency = calculateUrgencyScore({
      urgency_score: data.urgency_score,
      people_affected: data.people_affected,
      category: data.category,
      created_at: new Date()
    })

    // Step 4 — Save to DB
    const result = await pool.query(
      `INSERT INTO needs
        (location_text, category, urgency_score, people_affected, description, source_channel)
       VALUES ($1,$2,$3,$4,$5,'photo')
       RETURNING *`,
      [
        data.location_text,
        data.category,
        finalUrgency,
        data.people_affected,
        data.description
      ]
    )

    res.status(201).json({
      success: true,
      data: result.rows[0],
      ocr_confidence: confidence.toFixed(1),
      raw_text: rawText
    })

  } catch (err) {
    console.error('Photo ingest error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router