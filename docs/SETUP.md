# Complete Setup Guide for VS Code

## Prerequisites

1. **Python 3.11+** — https://python.org/downloads
2. **Node.js 18+** — https://nodejs.org

## Step-by-Step Setup

### Step 1: Extract and Open

Extract `banking-ai.tar.gz` and open the folder in VS Code.

**On macOS/Linux:**
```bash
tar xzf banking-ai.tar.gz
code banking-ai
```

**On Windows:** Use 7-Zip to extract, then open in VS Code.

---

### Step 2: Backend Setup

Open a terminal in VS Code (`Ctrl+\``):

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install all dependencies (~2 min)
pip install -r requirements.txt

# Copy environment config
cp .env.example .env
```

**Now edit `backend/.env` and add your OpenAI key:**

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx   ← paste your key here
OPENAI_MODEL=gpt-4o-mini
```

> 💡 If you don't have an OpenAI key, set `LLM_PROVIDER=mock` and the chatbot will use built-in smart responses.

---

### Step 3: Train ML Model (Recommended)

```bash
cd ../ml
pip install -r requirements.txt
python train.py
cd ../backend
```

---

### Step 4: Initialize Database & Seed Data

```bash
# In backend/ with venv active:
python seed.py
```

Expected output:
```
✅ Demo data seeded successfully!
   Admin: admin@bank.com / Admin@123
   User:  user@bank.com  / User@123
```

---

### Step 5: Start Backend

```bash
uvicorn main:app --reload --port 8000
```

✅ API running at http://localhost:8000  
✅ Swagger docs at http://localhost:8000/docs

---

### Step 6: Start Frontend (second terminal)

```bash
cd banking-ai/frontend
npm install
cp .env.example .env
npm run dev
```

✅ App running at http://localhost:5173

---

### Step 7: Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bank.com | Admin@123 |
| User | user@bank.com | User@123 |

---

## LLM Provider Options

| Provider | Setup | Cost |
|----------|-------|------|
| `openai` | Set `OPENAI_API_KEY` | Pay-per-use (~$0.0001/msg) |
| `anthropic` | Set `ANTHROPIC_API_KEY` | Pay-per-use |
| `ollama` | Install from ollama.com | Free (local) |
| `mock` | No key needed | Free |

Change `LLM_PROVIDER` in `backend/.env` then restart the backend.

---

## Features

- **AI Chat** — Banking Q&A powered by OpenAI / mock
- **Loan Predictor** — ML model checks eligibility with 13 factors
- **Loan Comparison** — Side-by-side chart comparison of up to 5 loan scenarios
- **Loan History** — Paginated history with charts
- **Admin Dashboard** — User management, stats, loan analytics
- **Dark/Light Mode** — Toggle in the header

---

## Docker (All-in-One)

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your OPENAI_API_KEY

docker-compose up --build
```

- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | Activate venv: `source venv/bin/activate` |
| Port 8000 in use | Use `--port 8001` |
| Chat not responding | Check `LLM_PROVIDER` and `OPENAI_API_KEY` in `.env` |
| Database errors | Delete `backend/banking.db` and re-run `python seed.py` |
| npm install fails | Delete `node_modules/`, run `npm install` again |
| CORS errors | Add frontend URL to `ALLOWED_ORIGINS` in `.env` |
