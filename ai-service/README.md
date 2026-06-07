# AI Resume Service

This folder contains the AI Resume Service backend, a FastAPI-based application for resume optimization, ATS scoring, job and download management, and PDF generation.

## Overview

The AI Resume Service is designed to:

- Accept resume/profile data
- Optimize resumes using LLM prompts
- Score resumes against ATS rules
- Generate polished resume output
- Store results locally or in Cloudinary
- Run long-running optimization tasks asynchronously via Celery

It supports two LLM providers:

- `openai` via OpenAI API
- `ollama` via local Ollama server

## Key Technologies Used

- Python 3.11
- FastAPI
- Uvicorn
- SQLAlchemy 2.0 (async)
- PostgreSQL / asyncpg
- Alembic migrations
- Celery + Redis
- OpenAI / Ollama LLM integration
- Jinja2 templates
- Cloudinary storage support
- Node.js + Puppeteer + Chromium for HTML → PDF generation
- Pydantic / pydantic-settings
- python-dotenv
- structlog logging
- pytest for tests

## Folder Structure

- `ai-service/`
  - `app/`
    - `main.py` — FastAPI application factory and lifecycle hooks
    - `api/` — API route definitions
    - `config/` — settings and environment configuration
    - `models/` — SQLAlchemy ORM models and base metadata
    - `schemas/` — Pydantic request/response schemas
    - `services/` — business logic for ATS scoring, PDF generation, and AI services
    - `utils/` — helpers, database connection, LLM client, logger, storage
    - `workers/` — Celery task configuration
  - `templates/` — resume templates and HTML output templates
  - `alembic/` — database migration scripts and Alembic config
  - `storage/` — local storage for generated output and resumes
  - `tests/` — unit/integration tests
  - `Dockerfile` — service container image build
  - `docker-compose.yml` — full stack compose orchestration
  - `Makefile` — shortcuts for setup, test, and container orchestration
  - `requirements.txt` — Python dependencies
  - `package.json` — Node dependency list for Puppeteer
  - `.env.example` — example environment variables

## Supported Runtime Modes

### Local development (Python virtualenv)

1. Install dependencies and create virtual environment:

```powershell
cd "d:\PROJECT\RESUME-FORGE-X\SERVICRES\AI - service\ai-service"
make setup
```

2. Activate the virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

3. Run the app:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Containerized deployment

Bring up the entire stack with Docker Compose:

```powershell
docker compose up --build -d
```

This starts:

- `postgres` — PostgreSQL database
- `redis` — Redis broker/result backend
- `migrate` — Alembic migration runner
- `api` — FastAPI service
- `worker` — Celery background worker
- `flower` — Celery monitoring UI on port `5555`

Shutdown:

```powershell
docker compose down
```

## Environment Variables

Copy `.env.example` to `.env` and update values.

Important settings:

- `APP_NAME`
- `APP_VERSION`
- `DEBUG`
- `SECRET_KEY`
- `PORT`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `LLM_PROVIDER` — `openai` or `ollama`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `PROFILE_SERVICE_URL`
- `STORAGE_BACKEND` — `local` or `cloudinary`
- `LOCAL_STORAGE_PATH`
- `CLOUDINARY_*`

## LLM Provider Options

The service can run with either:

- `LLM_PROVIDER=openai`
- `LLM_PROVIDER=ollama`

If `ollama` is selected, the service will route OpenAI-compatible calls to the local Ollama endpoint.

## PDF Generation

HTML-to-PDF generation is powered by a Node.js Puppeteer worker:

- `app/utils/pdf_worker.js`
- `package.json` includes `puppeteer`
- The Docker image installs Node.js, npm, and Chromium so PDF generation works in containers.

## Docker Compose Services

- `postgres` — PostgreSQL database
- `redis` — Redis broker/result backend
- `migrate` — runs Alembic migrations once
- `api` — FastAPI application server
- `worker` — Celery worker for background resume optimization tasks
- `flower` — Celery monitoring dashboard

## API Endpoints

Base path: `/api/v1`

- `GET /api/v1/health` — health check
- `POST /api/v1/optimize` — submit a resume optimization request
- `GET /api/v1/optimize/{job_id}` — check optimization job status
- `GET /api/v1/download/{job_id}` — download generated resume output
- `GET /api/v1/jobs` — list jobs
- `DELETE /api/v1/jobs/{job_id}` — delete a job record
- `POST /api/v1/ats/score` — request ATS scoring
- `POST /api/v1/skills` — skill extraction endpoint (if available)

Root endpoint `/` returns service metadata and available endpoints.

## Database and Migrations

The service uses asynchronous SQLAlchemy with PostgreSQL.

- `app/models/base.py` defines the ORM base metadata
- `alembic/` contains migration scripts
- `docker-compose.yml` includes a one-shot `migrate` service

In local dev, setting `DEBUG=true` will auto-create tables on startup.

## Running Tests

Run the Python test suite with:

```powershell
.\.venv\Scripts\Activate.ps1
.\.venv\Scripts\pytest tests -v
```

## Notes

- The service is designed to be LLM-agnostic via `app/utils/llm_client.py`.
- PDF generation depends on Puppeteer and Chromium, so the Docker runtime includes Node.js.
- Storage can be switched between `local` and `cloudinary` using the `STORAGE_BACKEND` setting.
- The application logs with `structlog` and supports request validation error handling.

## Quick Start

1. Copy environment example:

```powershell
copy .env.example .env
```

2. Edit `.env`
3. Run `make setup`
4. Start the service:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

5. Visit `http://localhost:8000/docs`

## Contact

If you need help understanding the AI Resume Service internals, inspect:

- `app/main.py`
- `app/config/settings.py`
- `app/utils/llm_client.py`
- `app/api/v1/`
- `Dockerfile`
- `docker-compose.yml`
