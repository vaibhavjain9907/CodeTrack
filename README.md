# CodeTrack

**CodeTrack** is a competitive programming analytics platform. Users connect
their LeetCode and Codeforces accounts to view unified progress analytics —
problem-solving stats, contest ratings, activity heatmaps, and goal tracking —
in a single dashboard.

## Tech Stack

**Frontend:** React, TypeScript, Vite, TailwindCSS, React Router, React Query, Axios, Recharts, React Hook Form, Zod

**Backend:** FastAPI, SQLAlchemy, PostgreSQL, JWT Authentication, Alembic, Celery, Redis

**Infrastructure:** Docker, Docker Compose

## Project Structure

```
codetrack/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/v1/          # Versioned API routes
│   │   ├── core/            # Config, security, celery app
│   │   ├── db/              # SQLAlchemy session & base
│   │   ├── models/          # ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   └── utils/           # Shared helpers
│   ├── alembic/              # DB migrations
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React application
│   ├── src/
│   │   ├── api/             # Axios client & API calls
│   │   ├── components/      # Shared/reusable UI components
│   │   ├── features/        # Feature-sliced modules (auth, dashboard, etc.)
│   │   ├── hooks/           # Shared custom hooks
│   │   ├── lib/             # Third-party client configs (e.g. React Query)
│   │   ├── pages/           # Route-level page components
│   │   ├── routes/          # Router configuration
│   │   ├── store/           # Global client state
│   │   └── types/           # Shared TypeScript types
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 22+ (only needed if running frontend outside Docker)
- Python 3.12+ (only needed if running backend outside Docker)

### 1. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and set a real `SECRET_KEY`:

```bash
openssl rand -hex 32
```

### 2. Start core services (database, cache, API, web)

```bash
docker compose up db redis backend frontend
```

> Note: `celery_worker` and `celery_beat` are scaffolded in `docker-compose.yml`
> for the upcoming background-sync module but are not yet functional — leave
> them out of `up` until that module is implemented.

### 3. Access the application

| Service       | URL                                    |
|---------------|-----------------------------------------|
| Frontend      | http://localhost:5173                  |
| Backend API   | http://localhost:8000                  |
| API Docs      | http://localhost:8000/api/v1/docs      |
| Health check  | http://localhost:8000/health           |

### Running database migrations

```bash
docker compose exec backend alembic upgrade head
```

## Running Without Docker (optional)

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## License

Proprietary — built as a personal portfolio project.
