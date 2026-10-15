# Career workspace browser QA

Final verification on 15 October 2026 used headless Microsoft Edge against the local production-mode Next build at http://127.0.0.1:3000 (build rYD9MrTkQVWxltNKSGC7j) and the isolated project API on port 8001. Test documents and job records use synthetic QA data.

## Passed workflows

- Job tracker: create, edit, change stage, reload with persistence, search, export JSON, delete, and restore JSON backup.
- Dashboard: read local resume/job counts, show due follow-ups, and render real empty states.
- Cover letters: create, save, update the same document without duplicates, reload, reopen, and preserve text.
- Export the current unsaved cover-letter content as PDF, genuine OOXML DOCX, and TXT. Independent parsing confirmed a one-page Letter PDF with selectable text and an editable Word document; both retain the exact Unicode name and unsaved-content marker.
- Dashboard, tracker, job dialog, cover editor, and cover list fit 390 × 844, 820 × 1180, and 1440 × 1000 viewports without horizontal overflow. Screenshots were visually inspected.
- Storage quota failures retain the job form and text without claiming a save. Escape closes the job dialog and restores focus.
- Simulated API failures show list retry, save, and PDF export errors while preserving cover text. Local DOCX export still works with the API unavailable.

## Fixes found during QA

- Added fixed-navigation clearance so breadcrumbs, headings, and the cover-letter return button remain visible and clickable.
- Prevented cover creation before the initial mounted load to avoid losing an early click during hydration.
- Added accessible names to legacy cover-letter fields and the job dialog, and adjusted mobile form spacing.

## Evidence

- `career-e2e-results.json` and `career-e2e.cjs`: successful workflow checks and responsive screenshots.
- `career-error-results.json` and `career-errors.cjs`: isolated failure-handling checks.
- `cover-current.pdf`, `cover-current.docx`, `cover-current.txt`: current unsaved content exports. `independent-export-verification.json` records independent PDF text/page and Word editability checks.
- `job-backup.json`: tracker export subsequently restored by the test.
- `../../frontend/scripts/test-career.cjs`: job schema, URL safety, and DOCX package checks.

The final production-mode workflow and failure-handling suites both exited successfully. The workflow recorded zero browser runtime exceptions and zero console errors. Earlier development-mode navigation and hydration issues were fixed before this final run.

## Product scope

Jobs and resumes are stored in the current browser/device. JSON backup/export is available; there is no account or cloud synchronization. Saved cover letters use the current browser's server workspace. PDF and Word exports use document-service/Word layouts rather than promising pixel-identical browser previews. See `backend-report.md` for PDF font, page-size, provider, and deployment limitations.
