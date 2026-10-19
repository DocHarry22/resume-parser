# Device-only storage verification

Verified 2026-10-15 with synthetic documents in fresh Edge browser contexts. No hosting or production changes were made.

The frontend snapshot ran from a separate physical copy in ignored `.runtime/local-mode-qa-1792095322742/frontend` on `127.0.0.1:3011`, using `NEXT_PUBLIC_STORAGE_MODE=local` and the task-owned stateless, small-model API on `127.0.0.1:8013`. This development check did not replace the primary frontend build or Sites export.

## Results

- `results.json`: eight passing browser checks, six observed requests, all to `/api/exports/*`; no workspace cookie or browser page errors.
- Resume: blank start, local save/reload, current-content PDF/DOCX, local TXT/JSON, stateless import without a server ID, and print availability.
- Cover letters: browser library save/reload, offline save, independent duplicate/delete, separate browser isolation, and current unsaved content in PDF/DOCX requests.
- A controlled export 503 preserved edits and left local TXT export working. Development screenshots consequently include Next's issue indicator for that deliberately generated console error.
- Legacy builder redirect retained its template selection. Privacy backup included the new letter library; deletion removed app keys while retaining an unrelated fixture key. No server controls appeared.
- Screenshots at 390 and 1440 pixels passed horizontal-overflow assertions and visual inspection.

`resume-current.*`, `letter-current.*`, `browser-data.json`, and all screenshots contain synthetic fixtures only. Downloads test readable document exports, not exact preview-layout fidelity. Browser persistence remains limited to this origin and browser profile; clearing browser data removes it.

## Reproduce

Use an isolated frontend with `NEXT_PUBLIC_STORAGE_MODE=local` set **before** starting/building it, and a backend with `STORAGE_MODE=local`. Configure its API proxy and exact allowed browser origin. Do not run against a production site.

From `frontend` with its dependencies installed:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node --test tests/api-config.test.cjs tests/local-cover-letters.test.cjs
$env:BASE_URL='http://127.0.0.1:3011'
$env:PLAYWRIGHT_CHANNEL='msedge'
node tests/local-mode-e2e.cjs
```

The targeted Node suite passed 17 tests, including default workspace behavior, Sites precedence, no local-mode bootstrap/network for persisted operations, offline letter CRUD, corrupt/quota storage, current unsaved export input, and processing guidance routing. The full frontend Node suite passed 22 tests plus career validation/DOCX checks. TypeScript checking passed after the final frontend changes.

Browser source: `frontend/tests/local-mode-e2e.cjs`. Default behavior remains selected when `NEXT_PUBLIC_STORAGE_MODE` is unset; Sites keeps its network guard when `NEXT_PUBLIC_SITE_MODE=1`.
