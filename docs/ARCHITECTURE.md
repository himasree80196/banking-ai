# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  React 18 + Vite + TypeScript + Tailwind CSS               │
│  React Query (server state) + React Hook Form               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST (Axios)
┌──────────────────────▼──────────────────────────────────────┐
│                     API LAYER                               │
│  FastAPI + Uvicorn (async Python)                          │
│  JWT Auth ─ Rate Limiting ─ CORS ─ Request Logging        │
│  Routes: /auth /users /chat /loan /admin                   │
└──────┬──────────────────────────────────┬───────────────────┘
       │                                  │
┌──────▼──────┐                  ┌───────▼──────────────────┐
│  DATABASE   │                  │     AI & ML LAYER        │
│  PostgreSQL │                  │  LLM Provider Abstraction │
│  SQLite     │                  │  (OpenAI/Anthropic/Ollama │
│  (Drizzle)  │                  │   /Mock)                  │
│  SQLAlchemy │                  │  scikit-learn Loan Model  │
└─────────────┘                  └──────────────────────────┘
```

## Key Design Decisions

### 1. Provider Abstraction for LLM
The `ai_service.py` uses a strategy pattern — configure `LLM_PROVIDER` in `.env` and swap providers without code changes. Defaults to `mock` for zero-setup local development.

### 2. Async SQLAlchemy
All database operations use SQLAlchemy's async engine with `asyncpg` (PostgreSQL) or `aiosqlite` (SQLite) — no blocking I/O in the event loop.

### 3. ML Fallback Strategy
If `ml/models/loan_model.pkl` is missing, the system falls back to a rule-based scoring algorithm. Run `ml/train.py` once to generate the trained model.

### 4. JWT Token Pair
- Access token (30 min) — used in every request header
- Refresh token (7 days) — used to get new access tokens
- Axios interceptor auto-refreshes on 401

### 5. Role-Based Access
- `UserRole.USER` — standard banking features
- `UserRole.ADMIN` — admin dashboard, user management, audit logs

## Database Schema

```
users           — id, email, username, full_name, hashed_password, role, is_active
chat_sessions   — id, user_id (FK), title, is_active
chat_messages   — id, session_id (FK), role, content, tokens_used
loan_predictions — id, user_id (FK), [13 input features], [prediction results]
audit_logs      — id, user_id (FK), action, resource, ip_address, status_code
```

## Security Layers

1. **Password hashing** — bcrypt via passlib
2. **JWT** — signed with SECRET_KEY using HS256
3. **Input validation** — Pydantic schemas on all endpoints
4. **Rate limiting** — slowapi (60 req/min default)
5. **CORS** — explicit allowed origins
6. **SQL injection** — SQLAlchemy ORM (parameterized queries)
7. **XSS** — React escapes by default; no dangerouslySetInnerHTML
