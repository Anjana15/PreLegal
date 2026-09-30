# PreLegal
A platform for drafting common legal agreements

## Status

🚧 **This project is currently in progress.** It is expected to be completed within 1 week (target: October 1, 2026).

## Running PreLegal

Requires Docker. Copy `.env.example` to `.env` and set `OPENROUTER_API_KEY`, then:

```bash
scripts/start-mac.sh        # or scripts/start-linux.sh, or scripts/start-windows.ps1
scripts/stop-mac.sh         # or scripts/stop-linux.sh,  or scripts/stop-windows.ps1
```

The app is served at http://localhost:8000. Sign up to reach the Mutual NDA creator.
The SQLite database is recreated each time the app starts, so accounts don't survive a restart.

## Contents

- `templates/`: Common Paper legal agreement templates (CC BY 4.0), listed in `catalog.json`.
- `frontend/`: Next.js app, built to static files. See [frontend/README.md](frontend/README.md).
- `backend/`: FastAPI app (a uv project). It serves the API under `/api` and the built frontend.
- `scripts/`: start and stop scripts, which run the app with Docker Compose.

## Developing

Run the backend and the frontend dev server in two terminals:

```bash
cd backend && uv run uvicorn app.main:app --reload    # API on http://localhost:8000
cd frontend && npm install && npm run dev             # app on http://localhost:3000
```

The frontend dev server proxies `/api` to the backend, so open http://localhost:3000.

Tests:

```bash
cd backend && uv run pytest
cd frontend && npm test
```
