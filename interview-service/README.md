# Interview Service

AI-powered mock interview backend — generates questions, evaluates answers with LangChain, and produces session reports.

---

## Tech Stack

| Layer | Tool | Free? |
|---|---|---|
| Web framework | FastAPI + Uvicorn | ✅ |
| ORM | SQLAlchemy 2.0 (async) | ✅ |
| Database | PostgreSQL 16 | ✅ |
| Cache | Redis 7 | ✅ |
| LLM evaluation | LangChain + Groq (llama3-70b) | ✅ Free tier |
| Object storage | MinIO (local) / Cloudflare R2 | ✅ Free |
| Auth | python-jose JWT | ✅ |
| Migrations | Alembic | ✅ |

---

## Quick Start — Docker (Recommended)

> Requires: Docker + Docker Compose

### 1. Clone and configure

```bash
cp .env.example .env
```

Edit `.env` — the only required change is your LLM key:

```env
# FREE option: get a key at https://console.groq.com (no credit card needed)
OPENAI_API_KEY=gsk_your_groq_key_here
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama3-70b-8192
```

### 2. Start all services

```bash
docker compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **MinIO** (local S3) on port 9000, console on 9001
- **Interview API** on port 8000

### 3. Seed the question bank

```bash
# Get a dev token first
TOKEN=$(curl -s -X POST "http://localhost:8000/dev/token" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Seed 40 sample questions
curl -s -X POST "http://localhost:8000/api/interview/questions/seed" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### 4. Open the API docs

```
http://localhost:8000/docs
```

---

## Quick Start — Local (No Docker)

### Prerequisites

- Python 3.11+
- PostgreSQL running locally
- Redis running locally

### 1. Create DB

```sql
CREATE USER interview_user WITH PASSWORD 'interview_pass';
CREATE DATABASE interview_db OWNER interview_user;
```

### 2. Install dependencies

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — set your OPENAI_API_KEY / Groq key
```

### 4. Run migrations

```bash
alembic upgrade head
```

### 5. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

---

## Free LLM Options

### Option A — Groq (Recommended, fastest)

1. Sign up free at https://console.groq.com
2. Create an API key
3. Set in `.env`:

```env
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama3-70b-8192
```

### Option B — Ollama (Fully local, no internet needed)

1. Install from https://ollama.com
2. Pull a model: `ollama pull llama3`
3. Set in `.env`:

```env
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3
```

### Option C — OpenAI (Paid)

```env
OPENAI_API_KEY=sk-...
# Leave OPENAI_BASE_URL unset
LLM_MODEL=gpt-4o-mini
```

---

## API Reference

All endpoints require `Authorization: Bearer <token>`.

### Get a dev token (development only)

```bash
POST /dev/token
# Returns a JWT for testing — disabled in production
```

### Session lifecycle

```bash
# 1. Start a session
POST /api/interview/session/start
{
  "session_type": "technical",   # technical | behavioral | hr
  "num_questions": 5,            # 1-20
  "difficulty": "medium",        # easy | medium | hard (optional)
  "category": "System Design"    # optional filter
}

# 2. Submit answers (one per question)
POST /api/interview/session/{session_id}/answer
{
  "question_id": "uuid",
  "answer_text": "Your answer here..."
}
# → returns score (0-10) + AI feedback immediately

# 3. Upload audio (optional)
POST /api/interview/session/{session_id}/answer/{response_id}/audio
Content-Type: multipart/form-data
file: <audio file>

# 4. End session + get report
POST /api/interview/session/{session_id}/end
# → returns overall_score (0-100) + LLM summary report

# 5. View past sessions
GET /api/interview/session/sessions?skip=0&limit=20

# 6. Get full session with all responses
GET /api/interview/session/{session_id}
```

### Question bank (admin)

```bash
# List questions
GET /api/interview/questions?session_type=technical&difficulty=medium

# Add a question
POST /api/interview/questions
{
  "question_text": "...",
  "category": "System Design",
  "difficulty": "hard",
  "session_type": "technical"
}

# Seed 40 sample questions
POST /api/interview/questions/seed

# Delete a question
DELETE /api/interview/questions/{question_id}
```

---

## Complete Interview Flow Example

```bash
BASE="http://localhost:8000"

# Step 1: Get dev token
TOKEN=$(curl -s -X POST "$BASE/dev/token" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Token: $TOKEN"

# Step 2: Seed questions
curl -s -X POST "$BASE/api/interview/questions/seed" \
  -H "Authorization: Bearer $TOKEN"

# Step 3: Start session
SESSION=$(curl -s -X POST "$BASE/api/interview/session/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_type":"technical","num_questions":2}')
echo $SESSION | python3 -m json.tool

SESSION_ID=$(echo $SESSION | python3 -c "import sys,json; print(json.load(sys.stdin)['session_id'])")
Q1_ID=$(echo $SESSION | python3 -c "import sys,json; print(json.load(sys.stdin)['questions'][0]['question_id'])")
Q2_ID=$(echo $SESSION | python3 -c "import sys,json; print(json.load(sys.stdin)['questions'][1]['question_id'])")

# Step 4: Answer question 1
curl -s -X POST "$BASE/api/interview/session/$SESSION_ID/answer" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"question_id\":\"$Q1_ID\",\"answer_text\":\"A hash map uses a hash function to map keys to array indices. Collisions are handled via chaining (linked lists at each bucket) or open addressing (linear/quadratic probing). Average O(1) lookup, O(n) worst case.\"}" \
  | python3 -m json.tool

# Step 5: Answer question 2
curl -s -X POST "$BASE/api/interview/session/$SESSION_ID/answer" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"question_id\":\"$Q2_ID\",\"answer_text\":\"I would use BFS for shortest path problems in unweighted graphs. DFS is better for detecting cycles, topological sorting, and when memory is a concern since it uses O(h) space vs O(w) for BFS where h is height and w is max width.\"}" \
  | python3 -m json.tool

# Step 6: End session
curl -s -X POST "$BASE/api/interview/session/$SESSION_ID/end" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool
```

---

## Running Tests

```bash
# Install test extras
pip install aiosqlite pytest-asyncio

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_answers.py -v
```

Tests use an **in-memory SQLite** database — no Postgres or Redis needed.

---

## Project Structure

```
interview-service/
├── app/
│   ├── api/
│   │   ├── auth.py          # JWT dependency
│   │   ├── session.py       # Session router
│   │   ├── response.py      # Answer + audio router
│   │   └── question.py      # Question bank router
│   ├── services/
│   │   ├── session_service.py    # Session lifecycle logic
│   │   ├── evaluator_service.py  # Answer eval orchestration
│   │   └── storage_service.py    # S3 audio uploads
│   ├── models/
│   │   └── models.py        # SQLAlchemy ORM models
│   ├── schemas/
│   │   └── schemas.py       # Pydantic DTOs
│   ├── chains/
│   │   └── eval_chain.py    # LangChain rubric scoring
│   ├── seeds/
│   │   └── question_seeds.py # 40 sample questions
│   ├── config/
│   │   ├── settings.py      # Pydantic settings
│   │   ├── database.py      # Async SQLAlchemy engine
│   │   └── redis_client.py  # Redis async client
│   └── main.py              # FastAPI app factory
├── alembic/                 # DB migrations
├── tests/
│   ├── conftest.py          # Fixtures (in-memory SQLite)
│   ├── test_questions.py
│   ├── test_sessions.py
│   └── test_answers.py
├── Dockerfile
├── docker-compose.yml       # Full local stack
├── requirements.txt
├── alembic.ini
└── pytest.ini
```

---

## Scoring Logic

### Per-question scoring (0–10)

| Dimension | Technical | Behavioral | HR |
|---|---|---|---|
| Relevance | ✅ | ✅ | ✅ |
| Depth | ✅ | ✅ | ✅ |
| Clarity | ✅ | ✅ | ✅ |
| STAR format | — | ✅ | — |

### Session score (0–100)

`overall_score = round(mean(score_for_question) * 10)`

---

## Production Checklist

- [ ] Change `SECRET_KEY` in `.env` to a random 32+ char string
- [ ] Set `APP_ENV=production` (disables `/dev/token` endpoint)
- [ ] Use a real S3 bucket or Cloudflare R2 for audio
- [ ] Run `alembic upgrade head` before starting the service
- [ ] Set `CORS_ORIGINS` to your actual frontend domain
- [ ] Add rate limiting (slowapi) to the answer endpoint
- [ ] Set up Prometheus metrics (prometheus-fastapi-instrumentator)
