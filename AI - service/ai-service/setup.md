# AI Resume Service — Complete Setup Guide

> **Stack:** Python 3.11 · FastAPI · LangChain · spaCy · sentence-transformers · PyMuPDF · ReportLab · Redis · Celery · PostgreSQL

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Setup](#2-project-setup)
3. [PostgreSQL Setup](#3-postgresql-setup)
4. [Redis Setup](#4-redis-setup)
5. [Ollama Setup (Free Local LLM)](#5-ollama-setup-free-local-llm)
6. [LangChain Integration with Ollama](#6-langchain-integration-with-ollama)
7. [NLP Models Setup](#7-nlp-models-setup)
8. [Environment Configuration](#8-environment-configuration)
9. [Database Migrations](#9-database-migrations)
10. [Running the Service](#10-running-the-service)
11. [Running Celery Workers](#11-running-celery-workers)
12. [Docker Setup (Full Stack)](#12-docker-setup-full-stack)
13. [API Testing Guide](#13-api-testing-guide)
14. [Fallback LLM Strategy](#14-fallback-llm-strategy)
15. [Performance & Scaling Notes](#15-performance--scaling-notes)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Prerequisites

### System Requirements

| Component   | Minimum         | Recommended     |
|-------------|-----------------|-----------------|
| CPU         | 4 cores         | 8 cores         |
| RAM         | 8 GB            | 16 GB           |
| Disk        | 10 GB free      | 20 GB free      |
| OS          | Ubuntu 22.04+   | Ubuntu 22.04+   |
| Python      | 3.11            | 3.11            |

### Install System Dependencies

**Ubuntu / Debian:**
```bash
sudo apt-get update && sudo apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libcairo2 \
    libharfbuzz0b \
    libfontconfig1 \
    fonts-liberation \
    postgresql \
    postgresql-contrib \
    redis-server \
    curl \
    git
```

**macOS (Homebrew):**
```bash
brew install python@3.11 postgresql redis cairo pango gdk-pixbuf libffi
```

---

## 2. Project Setup

We use a simple `Makefile` to manage the project lifecycle.

### Setup Environment and Dependencies

Run the `setup` target to automatically create a virtual environment, upgrade pip, install all Python dependencies from `requirements.txt`, and download the required spaCy machine learning models:

```bash
make setup
```

> ⏱ This takes 3-8 minutes — it downloads spaCy, sentence-transformers, PyMuPDF, ReportLab and all ML dependencies.

---

## 3. PostgreSQL Setup

### Option A: Local PostgreSQL

```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE ai_resume OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE ai_resume TO postgres;
\q
EOF

# Verify connection
psql -U postgres -d ai_resume -c "SELECT version();"
```

### Option B: Docker PostgreSQL (Quickest)

```bash
docker run -d \
  --name ai-resume-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_resume \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# Verify it's running
docker exec ai-resume-postgres pg_isready -U postgres
```

### Test Connection

```bash
psql postgresql://postgres:postgres@localhost:5432/ai_resume -c "SELECT 1;"
# Expected: returns 1
```

---

## 4. Redis Setup

### Option A: Local Redis

```bash
# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
# Expected: PONG
```

### Option B: Docker Redis

```bash
docker run -d \
  --name ai-resume-redis \
  -p 6379:6379 \
  redis:7-alpine redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru

# Verify
docker exec ai-resume-redis redis-cli ping
# Expected: PONG
```

---

## 5. Ollama Setup (Free Local LLM)

Ollama runs open-source LLMs (Llama 3, Mistral, Phi-3) **completely free** on your local machine.

### Install Ollama

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**macOS:**
```bash
brew install ollama
```

**Windows:**
Download the installer from https://ollama.com/download/windows

### Start Ollama Server

```bash
# Start in background (Linux/macOS)
ollama serve &

# OR as a systemd service (Linux)
sudo systemctl start ollama
sudo systemctl enable ollama

# Verify Ollama is running
curl http://localhost:11434/api/tags
# Expected: {"models": [...]}
```

### Pull an LLM Model

```bash
# Recommended: Llama 3 (4.7 GB) — best quality
ollama pull llama3

# Lightweight alternative: Phi-3 Mini (2.3 GB)
ollama pull phi3

# Another option: Mistral 7B (4.1 GB)
ollama pull mistral

# List installed models
ollama list
```

> **RAM Requirements:**
> - phi3: ~3 GB RAM
> - llama3 / mistral: ~6-8 GB RAM
> - llama3:70b: ~40 GB RAM (not recommended for development)

### Test Ollama

```bash
# Quick test
ollama run llama3 "Summarize this in one sentence: Python is a high-level programming language."

# API test
curl http://localhost:11434/api/generate -d '{
  "model": "llama3",
  "prompt": "Say hello in JSON format",
  "stream": false
}'
```

---

## 6. LangChain Integration with Ollama

The service uses **langchain-ollama** to connect to the local Ollama server. Here's how the chain works:

### How It's Wired

In `app/chains/llm_factory.py`, the factory tries providers in this order:
1. **Ollama** (local, zero cost)
2. **HuggingFace Hub** (free API tier)
3. **OpenAI** (paid, last resort)

### Manual Test of the Chain

```python
# Run from project root with .venv activated
python3 << 'EOF'
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = OllamaLLM(model="llama3", base_url="http://localhost:11434")
prompt = PromptTemplate.from_template("Write a one-line professional summary for a {role}.")
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"role": "Senior Python Engineer"})
print(result)
EOF
```

### Switching Models at Runtime

Edit `.env`:
```env
OLLAMA_MODEL=phi3        # lighter, faster
OLLAMA_MODEL=llama3      # better quality
OLLAMA_MODEL=mistral     # good balance
```

---

## 7. NLP Models Setup

### spaCy Model

```bash
# Large model (recommended — better NER)
python -m spacy download en_core_web_lg

# Small model (fallback, faster)
python -m spacy download en_core_web_sm

# Verify
python -c "import spacy; nlp = spacy.load('en_core_web_lg'); print('spaCy OK')"
```

### Sentence Transformers

The model downloads automatically on first use, but you can pre-download it:

```python
# Pre-cache the model (saves startup time later)
python3 -c "
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
print('Model cached at:', model._model_card_vars.get('model_id'))
print('Sentence Transformers OK')
"
```

---

## 8. Environment Configuration

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env    # or: vim .env / code .env
```

### Minimal Working .env (local development)

```env
DEBUG=true
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_resume
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
STORAGE_BACKEND=local
LOCAL_STORAGE_PATH=/tmp/ai_resume_storage
SECRET_KEY=dev-secret-key-replace-in-production
```

### Cloudinary Storage

To use Cloudinary for resume uploads, set `STORAGE_BACKEND=cloudinary` and add these values to your `.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=ai_resumes
```

### Verify Configuration Loads

```bash
python3 -c "
from app.config import get_settings
s = get_settings()
print('DB:', s.DATABASE_URL[:40])
print('Redis:', s.REDIS_URL)
print('LLM:', s.LLM_PROVIDER, '/', s.OLLAMA_MODEL)
print('Config OK ✓')
"
```

---

## 9. Database Migrations

```bash
# Run all migrations (creates tables)
alembic upgrade head

# Check current migration version
alembic current

# View migration history
alembic history --verbose

# Generate a new migration (after model changes)
alembic revision --autogenerate -m "add_new_column"

# Rollback last migration
alembic downgrade -1
```

### Verify Tables Were Created

```bash
psql postgresql://postgres:postgres@localhost:5432/ai_resume -c "\dt"
# Expected tables: resumes, ats_scores, optimization_jobs
```

---

## 10. Running the Service

### Development Mode

```bash
# Activate venv
source .venv/bin/activate

# Start FastAPI with hot reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Expected output:
# INFO:     Started server process
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Production Mode

```bash
# Multiple workers (use CPU count)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# OR with gunicorn process manager
pip install gunicorn
gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

### Verify Service is Running

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Expected response:
# {"status": "healthy", "checks": {"redis": "ok", "database": "ok"}, "latency_ms": 12.5}

# API docs
open http://localhost:8000/docs
```

---

## 11. Running Celery Workers

Open a **new terminal** (keep API running in the first):

```bash
source .venv/bin/activate

# Start the optimization worker
celery -A app.workers.celery_app worker \
  --loglevel=info \
  --queues=optimization \
  --concurrency=2

# Expected output:
#  -------------- celery@hostname v5.x.x
# --- ***** -----
# - *** --- * --- Linux ...
#   - ** ---------- [config]
#   - ** ---------- .> app:         ai_resume
#   - ** ---------- .> transport:   redis://localhost:6379/1
#   - ** ---------- .> results:     redis://localhost:6379/2
#   - *** --- * --- .> concurrency: 2 (prefork)
```

### Monitor with Flower (Optional)

```bash
# In a third terminal
celery -A app.workers.celery_app flower --port=5555

# Open dashboard
open http://localhost:5555
```

---

## 12. Docker Setup (Full Stack)

This runs **everything** with a single command: API + Celery + Redis + PostgreSQL.

### Prerequisites

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose v2
sudo apt-get install docker-compose-plugin
docker compose version  # should be 2.x
```

### Start Full Stack

```bash
# Build and start all services via Makefile
make up

# Follow logs (optional)
docker compose logs -f api worker
```

### Service URLs (Docker)

| Service      | URL                          |
|--------------|------------------------------|
| API          | http://localhost:8000        |
| API Docs     | http://localhost:8000/docs   |
| Flower       | http://localhost:5555        |

### Using External Ollama with Docker

Since Ollama runs on your host machine, point Docker services to it:

```bash
# Linux: use host.docker.internal or host gateway IP
export OLLAMA_BASE_URL=http://host.docker.internal:11434
docker compose up --build -d
```

### Useful Docker Commands

```bash
# View all running services
docker compose ps

# Run a one-off migration
docker compose run --rm migrate

# Shell into API container
docker compose exec api bash

# Check API health
curl http://localhost:8000/api/v1/health

# Stop all services
make down

# Stop and remove volumes (DELETES ALL DATA)
docker compose down -v
```

---

## 13. API Testing Guide

### Complete Workflow: Upload → Score → Optimize → Download

#### Step 1: Upload and Parse Resume

```bash
curl -X POST http://localhost:8000/api/v1/parse-resume \
  -F "file=@/path/to/your_resume.pdf;type=application/pdf" \
  -F "user_id=user-001"
```

**Response:**
```json
{
  "resume_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "your_resume.pdf",
  "status": "parsed",
  "parsed_data": {
    "contact": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1-555-0100",
      "linkedin": "linkedin.com/in/janedoe"
    },
    "summary": "Senior software engineer...",
    "experience": [...],
    "education": [...],
    "skills": ["Python", "FastAPI", "Redis", ...]
  },
  "message": "Resume parsed successfully."
}
```

> Save the `resume_id` — you need it for the next steps.

---

#### Step 2: Get ATS Score

```bash
curl -X POST http://localhost:8000/api/v1/ats-score \
  -H "Content-Type: application/json" \
  -d '{
    "resume_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-001",
    "job_description": "We are seeking a Senior Python Engineer with 5+ years of experience in FastAPI, microservices architecture, Redis caching, PostgreSQL, Docker, and Kubernetes. You will design and build scalable REST APIs, mentor junior developers, and drive CI/CD pipeline improvements. Strong communication skills and AWS experience required."
  }'
```

**Response:**
```json
{
  "resume_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-001",
  "composite_score": 74.3,
  "keyword_score": 82.0,
  "semantic_score": 68.4,
  "format_score": 73.3,
  "keyword_matches": ["python", "fastapi", "redis", "postgresql", "docker"],
  "keyword_gaps": ["kubernetes", "ci/cd", "aws", "microservices"],
  "section_analysis": {
    "experience": "present",
    "education": "present",
    "skills": "present",
    "summary": "present"
  },
  "cached": false,
  "score_id": "abc-123"
}
```

---

#### Step 3: Enqueue Optimization

```bash
curl -X POST http://localhost:8000/api/v1/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "resume_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-001",
    "job_description": "We are seeking a Senior Python Engineer with 5+ years of experience in FastAPI, microservices architecture, Redis caching, PostgreSQL, Docker, and Kubernetes. You will design and build scalable REST APIs, mentor junior developers, and drive CI/CD pipeline improvements. Strong communication skills and AWS experience required."
  }'
```

**Response (202 Accepted):**
```json
{
  "job_id": "opt-job-789",
  "status": "pending",
  "progress": 0,
  "poll_url": "http://localhost:8000/api/v1/optimize/opt-job-789"
}
```

---

#### Step 4: Poll Optimization Status

```bash
# Poll every 5 seconds until status = "completed"
curl http://localhost:8000/api/v1/optimize/opt-job-789
```

**Response (while processing):**
```json
{
  "job_id": "opt-job-789",
  "status": "processing",
  "progress": 40,
  "optimized_data": null,
  "download_url": null
}
```

**Response (when completed):**
```json
{
  "job_id": "opt-job-789",
  "status": "completed",
  "progress": 100,
  "optimized_data": {
    "summary": "Results-driven Senior Python Engineer with 7+ years of experience...",
    "experience": [
      {
        "title": "Senior Software Engineer",
        "company": "TechCorp",
        "duration": "2020-2024",
        "description": [
          "Architected microservices platform using FastAPI and Docker, reducing time-to-deploy by 60%",
          "Implemented Redis caching strategy, cutting API latency by 40% across 50+ endpoints",
          "Led Kubernetes migration on AWS EKS, supporting 10M+ requests/day"
        ]
      }
    ],
    "skills": ["Python", "FastAPI", "Redis", "PostgreSQL", "Docker", "Kubernetes", "AWS", "CI/CD"],
    "suggestions": [
      "Add specific Kubernetes deployment metrics to your experience section",
      "Highlight AWS certifications if you have any",
      "Quantify team size you mentored"
    ]
  },
  "download_url": "/api/v1/download/opt-job-789"
}
```

---

#### Step 5: Download PDF

```bash
curl -O -J http://localhost:8000/api/v1/download/opt-job-789
# Saves: optimized_resume_opt-job-7.pdf

# OR open directly in browser:
open http://localhost:8000/api/v1/download/opt-job-789
```

---

### Quick Polling Script

```bash
#!/bin/bash
JOB_ID="opt-job-789"
MAX_WAIT=120  # seconds
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
  RESPONSE=$(curl -s http://localhost:8000/api/v1/optimize/$JOB_ID)
  STATUS=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
  PROGRESS=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['progress'])")

  echo "[$ELAPSED s] Status: $STATUS | Progress: $PROGRESS%"

  if [ "$STATUS" = "completed" ]; then
    echo "✅ Done! Downloading PDF..."
    curl -O -J http://localhost:8000/api/v1/download/$JOB_ID
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "❌ Job failed"
    echo $RESPONSE
    break
  fi

  sleep 5
  ELAPSED=$((ELAPSED + 5))
done
```

---

### Running Tests

```bash
# Run all tests using the Makefile
make test
```

---

## 14. Fallback LLM Strategy

The service uses a tiered fallback system for LLM access:

### Tier 1: Ollama (Default — Free, Local)

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

Best for: Development, privacy-sensitive data, zero API cost.

### Tier 2: HuggingFace Hub (Free API — Remote)

Get a free token at https://huggingface.co/settings/tokens

```env
LLM_PROVIDER=huggingface
HF_MODEL_ID=mistralai/Mistral-7B-Instruct-v0.2
HF_API_TOKEN=hf_your_token_here
```

Limits: ~1,000 requests/day on free tier.

### Tier 3: OpenAI (Paid — Optional)

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-3.5-turbo
```

Cost: ~$0.001 per optimization (~500 tokens).

### Automatic Fallback

If `LLM_PROVIDER=ollama` but Ollama is unreachable, the service automatically falls back:
1. Tries HuggingFace (if `HF_API_TOKEN` is set)
2. Tries OpenAI (if `OPENAI_API_KEY` is set)
3. Returns a rule-based optimization (no LLM) as last resort

---

## 15. Performance & Scaling Notes

### Caching Strategy

| Cache Key Pattern                        | TTL    | Purpose                         |
|------------------------------------------|--------|---------------------------------|
| `ats:{userId}:{resumeId}:{jdHash}`       | 24 hrs | ATS score (recompute expensive) |
| `optimize:{userId}:{resumeId}:{jdHash}`  | 1 hr   | LLM output (most expensive)     |

The `jdHash` is a 16-char SHA-256 prefix of the job description, so identical JDs always hit cache.

### Worker Scaling

```bash
# Scale to 4 concurrent optimization workers
celery -A app.workers.celery_app worker --concurrency=4 --queues=optimization

# Multiple worker processes (Docker)
docker compose up --scale worker=3
```

### Database Connection Pooling

In `.env`, tune for your server:
```env
DATABASE_POOL_SIZE=20     # concurrent DB connections
DATABASE_MAX_OVERFLOW=40  # burst connections
```

### Embedding Performance

The sentence-transformer model (`all-MiniLM-L6-v2`) is 80 MB and cached in RAM after first load. It processes embeddings in ~50ms on CPU. For high-throughput scenarios:

```python
# Enable GPU acceleration (if CUDA available)
# In app/services/ats_scorer.py:
model = SentenceTransformer('all-MiniLM-L6-v2', device='cuda')
```

### Cost Optimization

- **Use Ollama** — eliminates all LLM API costs
- **Cache aggressively** — same resume + JD never hits LLM twice (1 hr TTL)
- **Batch ATS scoring** — spaCy processes up to 50,000 chars efficiently
- **Use phi3 model** — 3x faster than llama3, ~85% quality for resume tasks

---

## 16. Troubleshooting

### "spaCy model not found"
```bash
python -m spacy download en_core_web_lg
# OR fall back to small model:
python -m spacy download en_core_web_sm
# Then set in .env: SPACY_MODEL=en_core_web_sm
```

### "Connection refused" on PostgreSQL
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
# Check pg_hba.conf allows local connections
```

### "Connection refused" on Redis
```bash
sudo systemctl status redis-server
sudo systemctl start redis-server
redis-cli ping   # should return PONG
```

### Ollama "model not found"
```bash
ollama list          # see installed models
ollama pull llama3   # install if missing
ollama serve         # ensure server is running
```

### Celery tasks stuck in "pending"
```bash
# Check worker is running and connected to correct broker
celery -A app.workers.celery_app inspect active
celery -A app.workers.celery_app inspect registered

# Purge stuck tasks
celery -A app.workers.celery_app purge
```

### "asyncpg: SSL connection required"
```bash
# For local dev, add ?ssl=disable to DATABASE_URL:
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ai_resume?ssl=disable
```

### Out of Memory with Llama3
```bash
# Switch to lighter model
OLLAMA_MODEL=phi3
# OR
OLLAMA_MODEL=llama3:8b-instruct-q4_0   # quantized, uses ~4GB RAM
```
