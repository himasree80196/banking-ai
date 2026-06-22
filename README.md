# AI Smart Banking Assistant with Loan Eligibility Prediction

A production-ready, enterprise-grade banking AI application.

## Features

| Feature | Description |
|---------|-------------|
| 🤖 AI Chat | OpenAI / Claude / Ollama / Mock banking assistant |
| 📊 Loan Predictor | ML-based eligibility with 13 factors |
| 📈 Loan Comparison | Compare up to 5 scenarios with interactive charts |
| 📋 Loan History | Paginated history with bar charts |
| 👤 Admin Dashboard | User management, analytics, audit logs |
| 🌙 Dark/Light Mode | System preference auto-detection |
| 🔐 JWT Auth | Access + refresh tokens with role-based access |

## Quick Start

### Backend (Python)
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY
python seed.py
uvicorn main:app --reload --port 8000
```

### ML Model
```bash
cd ml && pip install -r requirements.txt && python train.py
```

### Frontend (Node.js)
```bash
cd frontend
npm install && cp .env.example .env
npm run dev
```

Open **http://localhost:5173**

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bank.com | Admin@123 |
| User | user@bank.com | User@123 |

## AI Chatbot Setup

Edit `backend/.env`:

```env
# Option 1: OpenAI (recommended)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-your-key-here

# Option 2: Free mock (no key needed)
LLM_PROVIDER=mock
```

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + Recharts
- **Backend:** Python 3.11 + FastAPI + SQLAlchemy (async) + JWT
- **ML:** scikit-learn GradientBoosting with rule-based fallback
- **Database:** SQLite (default) or PostgreSQL
- **Containerization:** Docker + docker-compose

## Full Setup Guide

See `docs/SETUP.md` for step-by-step instructions, Docker setup, and troubleshooting.

## API Docs

Interactive Swagger UI: http://localhost:8000/docs
