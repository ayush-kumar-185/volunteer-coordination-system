const twilio = require('twilio')

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// const sendSMS = async (to, message) => {
//   try {
//     const result = await client.messages.create({
//       body: message,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: to
//     })
//     console.log(`SMS sent to ${to} — SID: ${result.sid}`)
//     return { success: true, sid: result.sid }
//   } catch (err) {
//     console.error('SMS send error:', err.message)
//     return { success: false, error: err.message }
//   }
// }

const sendDispatchSMS = async (volunteer, need) => {
  const message = 
    `Hello ${volunteer.name}, you have been matched to a community need.\n\n` +
    `Category: ${need.category}\n` +
    `Location: ${need.location_text || 'See coordinator'}\n` +
    `Urgency: ${need.urgency_score}/10\n` +
    `People affected: ${need.people_affected || 'Unknown'}\n\n` +
    `Details: ${need.description}\n\n` +
    `Reply YES to accept or NO to decline.`

  try {
    // Send via WhatsApp instead of SMS — works on Twilio trial
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${volunteer.phone}`
    })

    console.log(`WhatsApp dispatch sent to ${volunteer.phone} — SID: ${result.sid}`)
    return { success: true, sid: result.sid }

  } catch (err) {
    console.error('Dispatch send error:', err.message)
    return { success: false, error: err.message }
  }

  // return sendSMS(volunteer.phone, message)
}

// module.exports = { sendSMS, sendDispatchSMS }
module.exports = { sendDispatchSMS }