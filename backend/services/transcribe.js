const Groq = require('groq-sdk')
const fs = require('fs')
const path = require('path')
const os = require('os')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const transcribeAudio = async (audioBuffer, mimeType = 'audio/ogg') => {
  try {
    // Write buffer to temp file — Groq SDK needs a file path
    const ext = mimeType.includes('ogg') ? '.ogg'
      : mimeType.includes('mp4') ? '.mp4'
      : mimeType.includes('mpeg') ? '.mp3'
      : '.ogg'

    const tempPath = path.join(os.tmpdir(), `voice_${Date.now()}${ext}`)
    fs.writeFileSync(tempPath, audioBuffer)

    console.log('Transcribing audio with Groq Whisper...')

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-large-v3',
      language: 'hi',  // Hindi — also auto-detects English
      response_format: 'text'
    })

    // Clean up temp file
    fs.unlinkSync(tempPath)

    console.log('Transcription result:', transcription)
    return { success: true, text: transcription }

  } catch (err) {
    console.error('Transcription error:', err.message)
    return { success: false, text: null, error: err.message }
  }
}

module.exports = { transcribeAudio }