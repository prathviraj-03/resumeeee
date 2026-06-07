# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Minimal build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt


# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Node.js + Chromium for Puppeteer PDF generation (HTML → PDF)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium (skip its own download)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy Node.js dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY app/ ./app/
COPY templates/ ./templates/
COPY alembic/ ./alembic/
COPY alembic.ini ./alembic.ini

# Non-root user
RUN useradd -m -u 1001 appuser \
    && mkdir -p /tmp/ai_resume_storage/resumes /tmp/ai_resume_storage/output \
    && chown -R appuser:appuser /app /tmp/ai_resume_storage

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
