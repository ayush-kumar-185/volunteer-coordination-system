if(process.env.NODE_ENV!='production'){
  require('dotenv').config()
}
const express = require('express')
const cors = require('cors')


const ingestRoutes = require('./routes/ingest')
const ingestPhotoRoutes = require('./routes/ingestPhoto')
const needsRoutes = require('./routes/needs')
const authRoutes = require('./routes/auth')
const matchesRouter = require('./routes/matches')
const ingestWhatsappRoutes=require('./routes/ingestWhatsapp')
const dispatchRouter = require('./routes/dispatch')
const volunteerRouter=require('./routes/volunteers')
const volunteerRespondRoute=require('./routes/volunteerRespond')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/ingest', ingestRoutes)
app.use('/api/ingest/photo', ingestPhotoRoutes)
app.use('/api/ingest/whatsapp', ingestWhatsappRoutes)
app.use('/api/needs/:id/matches', matchesRouter)
app.use('/api/needs/:id', dispatchRouter)
app.use('/api/needs', needsRoutes)
app.use('/api/volunteers', volunteerRouter)
app.use('/api/volunteer/respond', volunteerRespondRoute)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack)
  res.status(500).json({ success: false, error: 'Internal Server Error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})