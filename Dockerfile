# syntax=docker/dockerfile:1

# 1. Build the Next.js frontend to static files. templates/ must sit beside frontend/,
#    because the build reads ../templates/Mutual-NDA.md.
FROM node:22-slim AS frontend
WORKDIR /repo/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY templates/ /repo/templates/
COPY frontend/ ./
RUN npm run build

# 2. Run the FastAPI backend, which serves the API and the static frontend on port 8000.
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock backend/.python-version ./
RUN uv sync --frozen --no-dev --no-install-project
COPY backend/app ./app
COPY --from=frontend /repo/frontend/out ./static

ENV PATH="/app/.venv/bin:$PATH" \
    STATIC_DIR=/app/static \
    DATABASE_PATH=/app/data/prelegal.db
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
