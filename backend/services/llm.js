// const { GoogleGenerativeAI } = require('@google/generative-ai')

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
// const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// const EXTRACTION_PROMPT = `You are a data extraction assistant for an NGO platform coordinating community relief work in India.

// Given a raw community need report (may be in English, Hindi, or mixed, may have typos or be very informal), extract the following fields.

// Return ONLY a valid JSON object — no explanation, no markdown code blocks, no extra text whatsoever.

// Fields:
// - location_text: string — location mentioned, translated to English if in Hindi
// - category: exactly one of ["food", "water", "medical", "shelter", "education", "other"]
// - urgency_score: integer 1-10 (10 = life-threatening emergency, 1 = minor issue). Infer from words like "urgent", "emergency", "dying", "kids sick", "days without"
// - people_affected: integer estimate. If unclear, estimate from context clues
// - description: one clean English sentence summarizing the need

// If a field truly cannot be determined, use null.

// Example output format:
// {"location_text":"Dharavi Sector 4","category":"water","urgency_score":9,"people_affected":15,"description":"15 people have had no access to clean drinking water for 4 days."}`

// const extractFieldsFromText = async (rawText) => {
//   try {
//     const prompt = `${EXTRACTION_PROMPT}\n\nExtract fields from this report:\n"${rawText}"`

//     const result = await model.generateContent(prompt)
//     const responseText = result.response.text().trim()

//     let parsed
//     try {
//       parsed = JSON.parse(responseText)
//     } catch {
//       // Strip markdown fences if model adds them despite instructions
//       const cleaned = responseText
//         .replace(/```json/g, '')
//         .replace(/```/g, '')
//         .trim()
//       parsed = JSON.parse(cleaned)
//     }

//     // Sanitize values
//     const validCategories = ['food', 'water', 'medical', 'shelter', 'education', 'other']
//     if (!validCategories.includes(parsed.category)) parsed.category = 'other'
//     if (!parsed.urgency_score || parsed.urgency_score < 1 || parsed.urgency_score > 10) {
//       parsed.urgency_score = 5
//     }
//     if (parsed.people_affected && parsed.people_affected < 0) {
//       parsed.people_affected = null
//     }

//     return { success: true, data: parsed }

//   } catch (err) {
//     console.error('LLM extraction error:', err.message)
//     return { success: false, data: null, error: err.message }
//   }
// }

// module.exports = { extractFieldsFromText }

const { GoogleGenerativeAI } = require('@google/generative-ai')
require('dotenv').config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

const extractFieldsFromText = async (rawText, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Gemini attempt ${attempt}...`)

      const fullPrompt = `You are a data extraction assistant for an NGO in India.

Extract information from this community need report and return ONLY a JSON object, nothing else. No markdown, no explanation, just the raw JSON.

Report: "${rawText}"

Return this exact JSON structure:
{
  "location_text": "location mentioned or null",
  "category": "one of: food, water, medical, shelter, education, other",
  "urgency_score": 7,
  "people_affected": 10,
  "description": "one sentence summary in English"
}`

      const result = await model.generateContent(fullPrompt)
      const responseText = result.response.text().trim()
      console.log('Gemini response:', responseText)

      const cleaned = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      const validCategories = ['food', 'water', 'medical', 'shelter', 'education', 'other']
      if (!validCategories.includes(parsed.category)) parsed.category = 'other'
      if (!parsed.urgency_score || parsed.urgency_score < 1 || parsed.urgency_score > 10) {
        parsed.urgency_score = 5
      }

      return { success: true, data: parsed }

    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err.message)

      // If 503 and retries left — wait and try again
      if (err.message.includes('503') && attempt < retries) {
        const waitTime = attempt * 2000  // 2s, 4s, 6s
        console.log(`503 error — waiting ${waitTime / 1000}s before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }

      return { success: false, data: null, error: err.message }
    }
  }
}

module.exports = { extractFieldsFromText }