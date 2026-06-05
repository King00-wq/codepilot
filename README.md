# CodePilot

A premium AI-powered coding workspace. Debug, explain, optimize, and interact with code intelligently.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6 |
| Backend | Python 3.12, **FastAPI**, Uvicorn |
| AI | OpenAI GPT-4 API |
| Database | SQLite |
| Auth | JWT (python-jose), bcrypt (passlib) |
| API | REST — auto-documented via FastAPI `/docs` |
| Version Control | Git / GitHub |

---

## Project Structure

```
ai-code-helper/
├── backend/
│   ├── main.py                 # FastAPI app, middleware, lifespan
│   ├── database.py             # SQLite schema + init
│   ├── schemas.py              # Pydantic v2 request/response models
│   ├── dependencies.py         # JWT auth dependency (get_current_user)
│   ├── auth_service.py         # Signup, login, JWT, password reset
│   ├── ai_service.py           # OpenAI GPT-4 integration
│   ├── session_service.py      # Session CRUD
│   ├── user_service.py         # Profile, settings, file upload, analytics
│   ├── routers/
│   │   ├── auth.py             # /api/signup, /login, /logout, /forgot-password, /reset-password
│   │   ├── ai.py               # /api/ai/{action_type}
│   │   ├── sessions.py         # /api/sessions, /api/history
│   │   └── users.py            # /api/profile, /api/settings, /api/upload, /api/analytics
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── App.js
    │   ├── index.js
    │   ├── context/AuthContext.js
    │   ├── components/ProtectedRoute.js
    │   ├── pages/
    │   │   ├── LandingPage.js
    │   │   ├── AuthPage.js
    │   │   ├── DashboardPage.js
    │   │   ├── WorkspacePage.js
    │   │   ├── HistoryPage.js
    │   │   ├── ProfilePage.js
    │   │   └── SettingsPage.js
    │   ├── utils/api.js
    │   └── styles/globals.css
    └── package.json
```

---

## Setup

### 1. Clone

```bash
git clone https://github.com/yourusername/ai-code-helper.git
cd ai-code-helper
```

### 2. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set OPENAI_API_KEY and JWT_SECRET

# Run (auto-initialises DB on startup)
python main.py
# or
uvicorn main:app --reload --port 8000
```

Backend: `http://localhost:8000`
Interactive API docs: `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend: `http://localhost:3000`

---

## Environment Variables (`backend/.env`)

```env
ENV=development
PORT=8000
JWT_SECRET=change-this-to-a-long-random-secret
OPENAI_API_KEY=sk-your-openai-api-key
ALLOWED_ORIGINS=http://localhost:3000
```

**Never commit `.env` to version control.**

---

## API Reference

FastAPI auto-generates interactive docs at `/docs` (Swagger UI) and `/redoc`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/signup | Create account |
| POST | /api/login | Login |
| POST | /api/logout | Logout |
| POST | /api/forgot-password | Request reset link |
| POST | /api/reset-password | Reset password with token |
| GET | /api/auth/me | Get current user |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/ai/explain | Explain code |
| POST | /api/ai/debug | Debug code |
| POST | /api/ai/optimize | Optimize code |
| POST | /api/ai/generate_docs | Generate documentation |
| POST | /api/ai/convert | Convert to another language |

### Sessions
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/sessions | Create session |
| GET | /api/sessions/{id} | Get session + messages |
| PUT | /api/sessions/{id} | Rename session |
| DELETE | /api/sessions/{id} | Delete session |
| GET | /api/history | List sessions (search/filter/sort) |

### User
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/profile | Get profile + stats |
| PUT | /api/profile | Update profile |
| PUT | /api/profile/password | Change password |
| GET | /api/settings | Get settings |
| PUT | /api/settings | Update settings |
| POST | /api/upload | Upload code file |
| GET | /api/analytics | Usage analytics |

---

## Security

- Passwords hashed with **bcrypt** (12 rounds) via passlib — never stored plain text
- **JWT** sessions — signed, expiry-enforced, verified on every protected request
- User data **isolated** at query level — users cannot access each other's sessions
- Sensitive content detection — API keys, tokens, passwords flagged before AI submission
- Input **validation and sanitisation** via Pydantic v2 on all request bodies
- **Rate limiting** via slowapi on auth and AI endpoints
- All secrets in **environment variables** — no hardcoded keys anywhere
- CORS restricted to configured origins

---

## Roadmap

| Version | Features |
|---|---|
| v1 | Full workspace, auth, history, profile, settings |
| v2 | RAG-based project understanding |
| v3 | AI autocomplete in editor |
| Future | Team workspaces, voice commands, advanced analytics |

---

## License

MIT
