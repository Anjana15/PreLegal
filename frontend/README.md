# PreLegal frontend

A Next.js app for creating a Mutual Non-Disclosure Agreement. Users fill in a form, see the
Common Paper Mutual NDA update live with their details, and download it as a PDF.

## Running locally

Requires Node.js 20 or later.

```bash
npm install
npm run dev     # http://localhost:3000
```

Other scripts:

```bash
npm test        # unit tests (Vitest)
npm run lint
npm run build   # production build
```

## How it works

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
