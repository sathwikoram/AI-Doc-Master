# AI DocMaster — Complete Setup Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| Node.js | 20+ |
| PostgreSQL | 15+ |
| Redis | 7+ (optional — app works without it) |
| Docker + Docker Compose | Latest (optional) |

---

## Option A — Local Development (Recommended for development)

### 1. PostgreSQL Database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE ai_docmaster;"
```

### 2. Backend Setup

```bash
cd ai-docmaster/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Download spaCy model (run once)
python -m spacy download en_core_web_md

# Environment file is already created with defaults
# Edit .env to add your OpenAI/Gemini API key (optional)

# Run database migrations
alembic upgrade head

# Seed sample data
python seed_data.py

# Start backend
uvicorn app.main:app --reload --port 8000
```

Backend will be at: **http://localhost:8000**
API docs at: **http://localhost:8000/api/docs**

### 3. Frontend Setup

```bash
# Open a NEW terminal
cd ai-docmaster/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be at: **http://localhost:5173**

---

## Option B — Docker Compose (One command, full stack)

```bash
cd ai-docmaster

# Build and start all services
docker-compose up --build

# Seed data (run in new terminal after containers are up)
docker-compose exec backend python seed_data.py
```

Services:
- Frontend: **http://localhost:5173**
- Backend: **http://localhost:8000**
- API Docs: **http://localhost:8000/api/docs**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## Login Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aidocmaster.com | admin123! |
| Citizen | rajesh@example.com | citizen123! |
| Citizen | priya@example.com | citizen123! |
| Citizen | anitha@example.com | citizen123! |
| Advocate | suresh.adv@example.com | advocate123! |
| Advocate | meena.adv@example.com | advocate123! |
| Advocate | vikram.adv@example.com | advocate123! |

---

## AI Features Configuration

### Without API Key (demo mode)
All AI features work in mock mode — they return placeholder responses.
All UI flows, dashboards, and case management work perfectly.

### With OpenAI API Key
```env
OPENAI_API_KEY=sk-your-key-here
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini   # Cost-effective model
```

### With Google Gemini API Key (free tier available)
```env
GEMINI_API_KEY=your-gemini-key
LLM_PROVIDER=gemini
```

---

## Project Structure

```
ai-docmaster/
├── backend/
│   ├── app/
│   │   ├── api/          ← All FastAPI route files
│   │   ├── core/         ← Auth, security, dependencies
│   │   ├── models/       ← SQLAlchemy database models
│   │   ├── schemas/      ← Pydantic validation schemas
│   │   ├── services/     ← Business logic + AI services
│   │   ├── config.py     ← App settings
│   │   ├── database.py   ← DB connection
│   │   └── main.py       ← FastAPI app entry point
│   ├── alembic/          ← Database migrations
│   ├── seed_data.py      ← Sample data seeder
│   ├── .env              ← Environment variables
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/shared/  ← Reusable UI components
│   │   ├── layouts/            ← Role-specific layouts (sidebar + topbar)
│   │   ├── lib/
│   │   │   ├── api.js          ← All API client functions
│   │   │   └── utils.js        ← Helpers, formatters, constants
│   │   ├── pages/
│   │   │   ├── auth/           ← Login, Register
│   │   │   ├── citizen/        ← Citizen portal pages
│   │   │   ├── advocate/       ← Advocate portal pages
│   │   │   └── admin/          ← Admin portal pages
│   │   ├── store/
│   │   │   └── authStore.js    ← Zustand auth state
│   │   ├── App.jsx             ← Router + route guards
│   │   └── main.jsx            ← React entry point
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── docker-compose.yml
```

---

## AI Features Summary

| Feature | Endpoint | Service File |
|---------|----------|-------------|
| Case Classification | POST /api/ai/classify | `services/case_classifier.py` |
| Lawyer Recommendation | POST /api/ai/recommend-lawyers | `services/lawyer_recommender.py` |
| Legal Section Suggestion | POST /api/ai/legal-sections | `services/legal_sections.py` |
| Judgement Search (RAG) | POST /api/ai/judgements | `services/judgement_rag.py` |
| Document Checklist | POST /api/ai/document-checklist | `services/document_checklist.py` |
| Case/Doc Summary | POST /api/ai/summarize | `services/summarizer.py` |
| Risk Assessment | POST /api/ai/risk-assessment | `services/risk_assessor.py` |
| AI Chat Assistant | POST /api/ai/chat | `services/chat_service.py` |
| Auto Advocate Replace | POST /api/hearings/{id}/replace-advocate | `services/advocate_replacement.py` |
| Background AI Pipeline | (background task on case submit) | `services/ai_service.py` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| UI Components | Radix UI primitives + Lucide icons |
| State Management | Zustand + TanStack Query |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL + SQLAlchemy (async) |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt |
| AI/NLP | spaCy, Transformers, LangChain |
| LLM | OpenAI GPT / Google Gemini (configurable) |
| Vector Search | ChromaDB + Sentence-Transformers |
| PDF/OCR | PyMuPDF + Tesseract |
| Cache | Redis |
| Charts | Recharts |
| File Storage | Local / Cloudinary |
| Container | Docker + Docker Compose |
