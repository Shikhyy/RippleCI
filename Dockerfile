# Multi-stage or slim Python build for RippleCI backend
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies including git for AST repository analysis
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy packaging specifications
COPY pyproject.toml README.md ./
COPY packages/ packages/

# Install rippleci package and dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -e .

# Configure default port and host
ENV PORT=8000
ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Start FastAPI server using uvicorn binding to dynamic Render $PORT
CMD ["sh", "-c", "uvicorn rippleci.api.server:app --host 0.0.0.0 --port ${PORT:-8000}"]
