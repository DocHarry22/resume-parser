# Resume studio implementation and QA

Verified locally on 15 October 2026 with the frontend on `127.0.0.1:3000` and the project's API on `127.0.0.1:8001`. Test data is synthetic and isolated in a fresh browser context.

Final local production build: **`ZF0WlnsJ74-kmsE6Mk2tD`**, incorporating application fix commit **`14dce88`**. The production build completed successfully, including TypeScript checks and all 17 generated pages. All **14** inspected live JavaScript/CSS assets returned HTTP 200. The final editor suite passed all eight groups with no runtime errors, console warnings/errors, or failed requests.

The final release review found and fixed two concrete issues: importing a JSON backup after a server-parsed resume could reuse the earlier server document ID, and legacy `resume_duplicate` browser data was omitted from privacy export/deletion. Accepted imports now receive their own correct server association, document switches are guarded during in-flight operations, and legacy duplicate data is covered by the privacy controls.

## What changed

- `/builder` now uses a shared document studio instead of an invented candidate resume and simulated save indicators. Existing direct component imports continue through compatibility exports.
- Browser drafts actually save and restore, including document title, template, colors, typography, paper size, section order, hidden sections, and custom content. Storage failures are reported; malformed saved data is not silently overwritten. JSON backups restore content and design.
- Separate document copies, deletion scoped to the current document, coalesced undo/redo, and save/undo/redo keyboard shortcuts work. The dashboard can read the shared `resume_studio_documents_v1` library through `resumeDocument.ts`.
- PDF/DOCX/TXT parsing fills editable fields. The scanner has a working **Edit this resume** handoff. Schema normalization preserves parser job titles, bullets, current roles, year-only dates, project titles, skills, and string languages.
- Six original resume styles render all content without array or text truncation. Modern uses a genuine contact sidebar. Users can change colors, fonts, sizes, line spacing, section spacing, A4/Letter paper, section order/visibility, and entry order.
- Optional custom sections include licences, memberships, awards, references, internships, objective, courses, and interests. Achievements, volunteering, and publications also remain editable.
- A real optional summary writing assistant checks provider availability and requires explicit consent before sending content. Suggestions show before/after text, permit editing, and require acceptance before changing the resume. Unconfigured AI has a clear unavailable state.
- Accessible field labels, keyboard entry expansion, hidden collapsed forms, dialog focus trapping, Escape dismissal, and responsive edit/preview controls were added. Preview scale automatically fits available space and remains manually adjustable.
- API PDF/DOCX downloads contain real text. Print / Save PDF preserves the selected preview style and paginates the complete document. TXT and JSON download locally. In the Sites edition, real editable OOXML DOCX also downloads locally and PDF uses browser printing; parsing, AI, and server-session actions point to the primary site instead of exposing an unverified personal-data API.

## Verification

`node --test tests/resume-document.test.cjs tests/local-export.test.cjs` in `frontend`: **5 passed, 0 failed**.

The unit checks cover parser-to-editor mapping, independent browser copies, content/design restore, corrupted storage protection, invalid backup rejection, and genuine local DOCX packaging. They verify Unicode/XML escaping, page size, section reading order, and exclusion of hidden content.

`node tests/editor-e2e.cjs` in `frontend`: **8 browser check groups passed**:

1. Blank initial document, editable title, undo and redo.
2. Live contact/summary updates and persistence after reload.
3. Template changes preserve content.
4. Typography, paper size, optional sections and independent duplication.
5. Mobile (390 px) and tablet (768 px) edit/preview fit without horizontal page overflow.
6. Real PDF, DOCX, TXT and JSON downloads.
7. Selected preview design prints over multiple pages without a one-page crop.
8. TXT parsing populates editable fields, retains the earlier saved document, and survives reload.

Final browser diagnostics: **0 runtime errors, 0 console errors/warnings, 0 failed HTTP responses**. See `editor-e2e-results.json`.

`node frontend/tests/editor-session-isolation.cjs` against the final production build: **6 additional checks passed**. The actual UI/API regression verifies that TXT document A followed by JSON backup B saves B separately while leaving A byte-for-byte unchanged; duplication is disabled during an in-flight server save; duplicate and delete/new transitions receive separate server IDs; failed restore retains the current association; and privacy export/deletion includes legacy duplicate data while preserving unrelated browser preferences. The test uses the portable Playwright loader, `BASE_URL`, and browser-channel configuration and runs in CI immediately after the standard editor suite. See `editor-session-isolation-results.json`.

Downloaded API PDF was independently opened with PyMuPDF: selectable name, summary, and licence text were present. Downloaded API DOCX opened with python-docx and contained editable paragraphs. Locally generated DOCX also opened independently and preserved Unicode, XML characters, section order and hidden-section exclusion.

The styled `editor-print-design.pdf` contains **5 pages**, includes the final `FINAL MULTIPAGE CONTENT SENTINEL`, and excludes navigation and editor controls. This specifically checks that content after the first page is retained.

## Evidence

- `editor-desktop.png`, `editor-mobile.png`, `editor-tablet.png`: final viewport screenshots.
- `editor-e2e-results.json`: final automated browser result and diagnostics.
- `editor-export.pdf`, `editor-export.docx`, `editor-export.txt`: actual UI downloads.
- `editor-backup.json`: complete backup produced by the UI.
- `editor-print-design.pdf`: complete styled multipage browser PDF.
- `local-editor-export.docx`, `local-editor-export.txt`: local exporter evidence, including Unicode and hidden-section checks.
- `independent-export-verification.json`: separate backend-agent verification of selectable PDF text, nonblank printed pages, and editable DOCX paragraphs.
- `primary-assets.json`, `primary-production-verification.json`: final build identity, 14 successful asset responses, and final editor/regression/document verification.
- `editor-session-isolation-results.json`, `editor-session-isolation.log`, `editor-privacy-legacy-backup.json`: six final data-isolation/privacy checks and their synthetic legacy backup evidence.

## Practical limits

- There are six implemented template styles, not thirty. No additional nonexistent templates are advertised by the studio.
- API PDF/DOCX use a readable document layout; the exact chosen visual style is exported through Print / Save PDF. Server document exports use the API's canonical section order. Local TXT and Sites DOCX honor the studio's chosen order.
- Browser persistence is local to this browser. The optional server copy belongs to the current guest session, not an authenticated multi-device account. JSON backup is the portable recovery mechanism.
- Automatic parsing requires the Python API and a text-bearing source document. This work does not add OCR. In the static Sites edition, JSON restore works locally; PDF/DOCX/TXT parsing uses the primary site.
- AI availability depends on server configuration and a provider. The configured-provider success path was not exercised with paid credentials; the unavailable state and ordinary manual editing remain usable.
- These checks establish local implementation behavior. They do not assert that the primary production domain or secondary Sites deployment has been published or validated.
