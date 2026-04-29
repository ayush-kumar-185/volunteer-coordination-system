# VolunteerConnect 🤝
# Demo Video link - https://youtu.be/1cp1YrcmxkI?si=RwgXJbUfTfLWqMPm

## For Trial Use:
For Admin:     username = piyush@gmail.com   password=piyush@234

For field Worker:    username = ravi@gmail.com          password = ravi@234            

For volunteer:      username = kishore@gmail.com       password = kishore@234
                               
                                        
> An AI-powered volunteer coordination system that connects community needs to the right volunteers — in real time.

[![express](https://img.shields.io/badge/Backend-express-009688?style=flat-square)](https://express.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square)](https://react.dev/)
[![Neon](https://img.shields.io/badge/Database-neon-3ECF8E?style=flat-square)](https://console.neon.tech/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%20API-4285F4?style=flat-square)](https://ai.google.dev/)
[![Twilio](https://img.shields.io/badge/Notifications-Twilio-F22F46?style=flat-square)](https://twilio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## 📌 The Problem

India has over 3 million registered NGOs, yet resource misallocation remains one of the biggest reasons social programs underdeliver. Community need data sits scattered across WhatsApp chats, paper surveys, and spreadsheets — while volunteers go unmatched to urgent needs nearby.

**VolunteerConnect solves this end-to-end:**  
Messy field data → AI processing → smart volunteer dispatch → real-time impact tracking.

---

## 🏗️ Architecture Overview

The system is built on three independent layers:

```
┌─────────────────────────────────────────────────────────┐
│                   LAYER 1 — INGESTION                   │
│             Web Form │ WhatsApp/SMS (Twilio)            |
│                    ↓ /api/ingest                        │
│              nominatim.openstreetmap.org                │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│                  LAYER 2 — INTELLIGENCE                 │
│          Gemini API — free-text field extraction        │
│         PostgreSQL + PostGIS (neon) — storage           │
│   Urgency Scorer │ Volunteer Matcher │ Gap Detector     │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│                    LAYER 3 — ACTION                     │
│   NGO Dashboard (Leaflet heatmap) │ Twilio SMS/WhatsApp │
│          Impact Tracker │ Volunteer Task View           │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Data Ingestion
- **Multi-channel intake** — web form, WhatsApp bot, SMS, and paper survey photo upload
- **AI field extraction** — Gemini API parses free-text in any language into structured JSON
- **Auto geocoding** — Google Maps API converts location strings to lat/lng coordinates
- **Language detection** — handles Hindi, English, and mixed-language inputs

### Intelligence
- **Urgency scoring** — weighted algorithm: `people_affected × severity × time_elapsed`
- **Geospatial volunteer matching** — PostGIS finds top 3 volunteers by proximity + skill + availability
- **Gap detection** — flags needs open for 8+ hours with no volunteer assigned
- **Deduplication** — merges duplicate reports within 500m of the same category

### Action & Dispatch
- **Live heatmap dashboard** — Leaflet.js map with red/amber/green urgency pins
- **Real-time updates** — Supabase websocket subscriptions, no page refresh needed
- **Automated SMS/WhatsApp dispatch** — Twilio sends task details to matched volunteer instantly
- **One-reply accept/decline** — volunteer replies YES/NO, dashboard updates immediately
- **Impact tracker** — live stats: needs submitted, resolved, volunteers deployed, people helped

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Leaflet.js |
| Backend | express |
| Database | PostgreSQL + PostGIS via neon |
| AI / NLP | Google Gemini API |
| Maps | nominatim.openstreetmap.org Geocoding API, leafletjs |
| Notifications | Twilio SMS + WhatsApp Business API |
| Hosting | Vercel (frontend and backend), Neon (DB) |

---

## 📁 Project Structure

```
volunteerconnect/
├── frontend/                  # React + Tailwind app
│   ├── src/
│   │   ├── components/
│   │   │   ├── IntakeForm.jsx        # Multi-channel need submission form
│   │   │   ├── Dashboard.jsx         # NGO admin heatmap dashboard
│   │   │   ├── NeedCard.jsx          # Individual need detail + match panel
│   │   │   ├── VolunteerTaskCard.jsx # Mobile volunteer accept/decline view
│   │   │   └── ImpactTracker.jsx     # Live stats panel
│   │   └── App.jsx
│   └── package.json
│
├── backend/                   # FastAPI Python server
│   ├── main.py                # App entrypoint + route registration
│   ├── routes/
│   │   ├── ingest.py          # POST /api/ingest — all intake channels
│   │   ├── match.py           # GET /api/match — volunteer matching
│   │   ├── dispatch.py        # POST /api/dispatch — Twilio SMS dispatch
│   │   └── stats.py           # GET /api/stats — impact tracker
│   ├── services/
│   │   ├── gemini.py          # Gemini API field extraction
│   │   ├── geocoding.py       # Google Maps Geocoding
│   │   ├── urgency.py         # Urgency scoring algorithm
│   │   ├── matcher.py         # PostGIS geospatial matching
│   │   └── gap_detector.py    # Scheduled gap detection job
│   ├── models/
│   │   ├── need.py            # Need schema + DB model
│   │   └── volunteer.py       # Volunteer schema + DB model
│   └── requirements.txt
│
├── database/
│   └── schema.sql             # PostgreSQL + PostGIS table definitions
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+
- A [Neon](https://console.neon.tech) project with PostGIS enabled
- API keys for: Gemini, leafletjs, Twilio

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/volunteerconnect.git
cd volunteerconnect
```

### 2. Set up the database

Run the schema file in your Supabase SQL editor:

```bash
# In Supabase dashboard → SQL Editor, paste and run:
database/schema.sql
```

This creates the `needs` and `volunteers` tables with PostGIS spatial columns.

### 3. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLOUD_VISION_KEY=your_vision_api_key
GOOGLE_MAPS_API_KEY=your_maps_geocoding_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

Start the backend server:

```bash
uvicorn main:app --reload --port 8000
```

### 4. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `/frontend`:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the frontend:

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## 🔌 API Reference

### `POST /api/ingest`
Accepts a community need from any input channel.

**Request body:**
```json
{
  "source_channel": "form | whatsapp | sms | photo",
  "raw_text": "3 families in Dharavi need clean water, very urgent",
  "image_base64": "optional — for photo uploads only"
}
```

**Response:**
```json
{
  "id": "uuid",
  "location": "Dharavi, Mumbai",
  "latitude": 19.0390,
  "longitude": 72.8516,
  "category": "water",
  "urgency_score": 9,
  "people_affected": 15,
  "description": "3 families lack access to clean water.",
  "status": "open",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### `GET /api/match?need_id={id}`
Returns the top 3 matched volunteers for a given need.

**Response:**
```json
{
  "need_id": "uuid",
  "matches": [
    {
      "volunteer_id": "uuid",
      "name": "Sunita Sharma",
      "distance_km": 1.2,
      "skills": ["medical", "counseling"],
      "available_hours": 10
    }
  ]
}
```

---

### `POST /api/dispatch`
Sends an SMS/WhatsApp notification to a matched volunteer.

**Request body:**
```json
{
  "need_id": "uuid",
  "volunteer_id": "uuid"
}
```

---

### `GET /api/stats`
Returns live impact tracker numbers.

**Response:**
```json
{
  "needs_submitted": 142,
  "needs_resolved": 98,
  "volunteers_deployed": 67,
  "people_helped": 1240
}
```

---

## 🗄️ Database Schema

```sql
-- Needs table
CREATE TABLE needs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_text   TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  geom            GEOGRAPHY(Point, 4326),
  category        TEXT CHECK (category IN ('food','water','medical','shelter','education','other')),
  urgency_score   INTEGER CHECK (urgency_score BETWEEN 1 AND 10),
  people_affected INTEGER,
  description     TEXT,
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','assigned','closed')),
  source_channel  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteers table
CREATE TABLE volunteers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  phone           TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  geom            GEOGRAPHY(Point, 4326),
  skills          TEXT[],
  available_hours INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## 🌐 Deployment

### Frontend — Vercel

```bash
cd frontend
npm run build
# Push to GitHub and connect repo to Vercel
# Add environment variables in Vercel dashboard
```

### Backend — Vercel

1. Connect your GitHub repo to [Render](https://vercel.com)
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all `.env` variables in the vercel environment settings

---

## 🔮 Roadmap

- [ ] **Phase 2** — Predictive needs forecasting using seasonal + weather data
- [ ] **Phase 3** — Multi-NGO collaboration layer (shared needs map)
- [ ] **Phase 4** — Volunteer skill development tracking + training recommendations
- [ ] **Phase 5** — Offline-first PWA for low-connectivity field workers

---

## 👥 Team

| Name | Role |
|---|---|
| Ayush Kumar | Full-stack development, AI integration |
| Aryan Singh | Frontend, data pipeline, deployment |


## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Google Gemini API](https://ai.google.dev/) for AI-powered field extraction
- [neon](https://console.neon.com/) for real-time database and PostGIS support
- [Twilio](https://twilio.com/) for SMS and WhatsApp dispatch
- [Leaflet.js](https://leafletjs.com/) for the open-source mapping layer
