# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

**Current status (KAN-4):** the V1 technical foundation is in place: FastAPI backend, SQLite users table, sign up / sign in, Docker, and start/stop scripts. The only product feature is the Mutual NDA creator (form, live preview, PDF download), which sits behind sign-in. AI chat, the other document types, and document persistence are not built yet.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

Branches are `feature/KAN-<n>-<slug>`, and commits are prefixed `KAN-<n>:`. `git push` over HTTPS has no credentials on this machine, so ask the user to push.

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root. `backend/app/llm.py` already provides `complete_structured(messages, ResponseModel)`, which follows this pattern. Nothing calls it yet.

## Technical design

One Docker container serves everything at http://localhost:8000.
- The multi-stage `Dockerfile` builds the frontend with Node, then runs the backend with uv.
- `docker-compose.yml` reads `.env`, which is optional (see `.env.example`), and has a health check.

```bash
scripts/start-mac.sh | start-linux.sh | start-windows.ps1   # docker compose up --build --wait
scripts/stop-mac.sh  | stop-linux.sh  | stop-windows.ps1    # docker compose down
```

**Backend** (`backend/`, a uv project, FastAPI, Python 3.12):
- `app/main.py` holds `create_app(settings)`. Routes match in registration order: the `/api` routes come first, then a JSON 404 for any unknown `/api/*` path, then `StaticFiles(html=True)`, which serves the exported frontend.
- `app/config.py` holds pydantic-settings, read from env or the root `.env`: `DATABASE_PATH`, `STATIC_DIR`, `JWT_SECRET`, `COOKIE_SECURE`, `OPENROUTER_API_KEY`. If `JWT_SECRET` is unset, a random one is generated on each start.
- `app/db.py` holds the SQLModel models (`User`) and the per-request `get_session`. The database file is deleted and recreated on every app start.
- `app/auth.py` has `POST /api/auth/signup`, `signin` and `signout`, and `GET /api/auth/me`. The session is a JWT in the httpOnly `prelegal_session` cookie. New routes that need a signed-in user use the `CurrentUser` dependency.
- `app/security.py` holds password hashing (pwdlib/argon2) and the JWT helpers.

**Frontend** (`frontend/`, Next.js 16, Tailwind v4):
- It is built with `output: "export"` to `out/`, and FastAPI serves that folder. Read `frontend/AGENTS.md` before writing Next code. Don't use features that static export doesn't support (server actions, route handlers, cookies/headers, dynamic routes without `generateStaticParams`).
- `trailingSlash` is on only for production builds, which emit `signin/index.html`. In dev it would redirect `/api/x` to `/api/x/` and break the proxy.
- Under `next dev`, `next.config.ts` proxies `/api` to `localhost:8000`, so API calls use same-origin relative paths everywhere. `lib/api.ts` is the typed client.
- `components/AuthGate.tsx` checks `/api/auth/me` in the browser and redirects to `/signin`. `components/AuthForm.tsx` backs both `/signin` and `/signup`.
- `app/page.tsx` reads `../templates/Mutual-NDA.md` at build time, so `templates/` must sit next to `frontend/`, including in the Docker build.
- NDA logic lives in `lib/nda.ts` and `lib/standardTerms.ts`. `NdaPreview` renders it as HTML and `NdaPdf` renders it as a PDF, both from the same content model.

**Dev and tests:**
```bash
cd backend && uv run uvicorn app.main:app --reload   # :8000
cd frontend && npm run dev                           # :3000, open this
cd backend && uv run pytest                          # temp DB per test; mocks LiteLLM
cd frontend && npm test && npm run lint && npm run build
```

## Color Scheme
The colours are defined as Tailwind tokens in `frontend/app/globals.css` (`brand-yellow`, `brand-blue`, `brand-purple`, `brand-navy`, `brand-gray`). They are used on the auth pages and the app header; the NDA creator still uses `stone-*`.
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`
