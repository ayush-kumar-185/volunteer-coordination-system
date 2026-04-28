// const Tesseract = require('tesseract.js')

// const extractTextFromImage = async (imageBuffer) => {
//   try {
//     const { data: { text, confidence } } = await Tesseract.recognize(
//       imageBuffer,
//       'eng+hin',  // supports English + Hindi
//       {
//         logger: m => {
//           if (m.status === 'recognizing text') {
//             process.stdout.write(`\rOCR progress: ${Math.floor(m.progress * 100)}%`)
//           }
//         }
//       }
//     )

//     console.log(`\nOCR complete — confidence: ${confidence.toFixed(1)}%`)

//     if (!text || text.trim().length < 5) {
//       return { success: false, text: null, error: 'No readable text found in image' }
//     }

//     if (confidence < 30) {
//       return {
//         success: true,
//         text: text.trim(),
//         warning: 'Low confidence — image may be blurry or handwriting unclear'
//       }
//     }

//     return { success: true, text: text.trim(), confidence }

//   } catch (err) {
//     console.error('OCR error:', err.message)
//     return { success: false, text: null, error: err.message }
//   }
// }

// module.exports = { extractTextFromImage }