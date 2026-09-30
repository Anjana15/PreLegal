# PreLegal frontend

A Next.js app for creating a Mutual Non-Disclosure Agreement. Users sign in, fill in a form, see
the Common Paper Mutual NDA update live with their details, and download it as a PDF.

The app is exported as static files (`out/`) and served by the FastAPI backend; see the
[root README](../README.md) for running the whole app.

## Running locally

Requires Node.js 20 or later.

```bash
npm install
npm run dev     # http://localhost:3000, with /api proxied to the backend on :8000
```

Start the backend too (`cd ../backend && uv run uvicorn app.main:app --reload`); without it,
sign-in and the auth check on `/` fail.

Other scripts:

```bash
npm test        # unit tests (Vitest)
npm run lint
npm run build   # static export to out/
```

## How it works

- Sign-in state lives in an httpOnly session cookie set by the backend. Because the pages are
  static, `components/AuthGate.tsx` checks `/api/auth/me` in the browser and sends signed-out
  users to `/signin`. `lib/api.ts` is the typed client for the backend.
- `app/page.tsx` reads the NDA Standard Terms from `../templates/Mutual-NDA.md` at build time,
  so the repo's `templates/` folder stays the single source of the legal text. Run the app from
  inside `frontend/` so that relative path resolves.
- `lib/standardTerms.ts` parses that markdown into clauses; `lib/nda.ts` holds the form values,
  validation and the filled-in Cover Page wording.
- `components/NdaPreview.tsx` renders the agreement as HTML; `components/NdaPdf.tsx` renders the
  same content with `@react-pdf/renderer`, which is only loaded when the user clicks
  **Download PDF**.

The NDA text is the Common Paper Mutual NDA Version 1.0, used under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
