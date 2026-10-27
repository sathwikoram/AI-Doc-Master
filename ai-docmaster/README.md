# AI DocMaster — Intelligent Legal Assistance & Case Management Platform

An AI-powered platform that bridges citizens and advocates through NLP-based case classification, smart lawyer recommendations, legal section suggestions, and automated advocate replacement.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python FastAPI |
| AI/NLP | spaCy, Transformers, LangChain, Sentence-Transformers |
| LLM | OpenAI GPT / Google Gemini (configurable) |
| Vector Search | FAISS / ChromaDB |
| Database | PostgreSQL + SQLAlchemy |
| Cache | Redis |
| Auth | JWT (python-jose) |
| File Storage | Cloudinary / Local |
| PDF | PyMuPDF |
| OCR | Tesseract |
| Container | Docker + Docker Compose |

## Quick Start

```bash
# 1. Clone & enter project
cd ai-docmaster

# 2. Backend
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # fill in your keys
alembic upgrade head           # run DB migrations
uvicorn app.main:app --reload

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Roles
- **Citizen** — Submit cases, track progress, book appointments, chat with lawyer
- **Advocate** — Manage assigned cases, get AI legal suggestions, upload documents
- **Admin** — Verify lawyers, monitor platform, view analytics

## AI Features
1. NLP Case Classification
2. Lawyer Recommendation Engine
3. Legal Section Recommendation (BNS/IPC/Acts)
4. Previous Judgement RAG Search
5. Document Checklist Generation
6. AI Chat Assistant
7. Automatic Advocate Replacement
8. Hearing Reminders
9. AI Case Summary (PDF)
10. Risk Prediction (complexity/timeline)
