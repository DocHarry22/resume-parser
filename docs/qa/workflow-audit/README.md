# Homepage and document workflow audit

Completed 18 October 2026 against the production build at http://127.0.0.1:3100 and the real local document service. All browser work used isolated profiles and synthetic documents. Existing user drafts were untouched.

## Results

- 27 browser workflow groups passed: 19 interaction regressions and 8 local storage/export groups.
- 29 automated tests passed, plus the career workspace and genuine DOCX validation.
- Type checking and the production build passed; all 17 static pages generated.
- No browser runtime errors in the passing cases. The final service health check was healthy.
- Real resume and cover letter PDF/DOCX downloads were reopened and checked for current text. Representative PDF pages were rendered and inspected.
- A resume containing all eleven content sections retained its content in PDF and DOCX. Its longer template print export covered four pages, including the last paragraph.

The combined machine-readable outcome is in [final-results.json](final-results.json). [results.json](results.json) records the local-mode scenarios. The repeated-create test was corrected to await the new document URL before typing; [navigation-repeat-rerun.json](navigation-repeat-rerun.json) records its passing production rerun. Application code did not change between those production runs.

## Fixes

- Creating a new resume and choosing a template from an open builder now follow the requested URL action. Existing content is saved before switching, and template selection preserves it.
- Resume edits flush before navigation and when the editor closes, including edits made within the autosave delay. A browser storage failure keeps link navigation in the editor and leaves JSON backup available.
- Cover letter drafts flush when returning to the library or leaving/reloading the page, preserving edits made immediately before navigation.
- The checker's file replacement button can be clicked above the upload input. File validation rejects legacy DOC, unsupported extensions even with a PDF MIME type, and empty files; the same file can be selected again after a failed attempt.
- Font, paper, and paragraph removal controls have clear accessible names. Paragraph removal no longer nests a button in a label.

## Coverage

| Area | Workflows checked |
| --- | --- |
| Homepage | Desktop/mobile menus, internal destinations and anchors, feature tabs, examples, FAQs, gallery filters/arrows, help controls |
| Resume builder | New/existing document navigation, template selection, every content section, photos, undo/redo, design/color controls, section order/visibility, duplication/deletion, rapid navigation, reload, storage failure and backup |
| Templates | Every filter and all six template destinations/previews |
| Checker | Real Basic/ATS/Expert scans, PDF/DOCX, industry and job description, parsed document handoff, invalid/empty files, replacement, service error and retry |
| Cover letters | Wizard steps, required fields, templates/tones, real writing guidance, paragraph addition/removal, previews, draft recovery, save/reload, duplicate/delete, offline editing and downloads |
| Downloads | Current unsaved resume/letter PDF/DOCX/TXT, resume JSON backup/restore, TXT/PDF/DOCX imports, browser data backup, export outage recovery, multipage template printing |

PDF and DOCX download buttons provide the service's readable document layout. **Print / Save PDF** exports the exact selected resume preview design. Imported text still needs the user's review, as the editor explains.

## Repeat the checks

With a browser-local frontend and its local processing service running, run `npm run test:workflows` from `frontend`. It defaults to port 3100, creates its own synthetic PDF/DOCX/JSON fixtures, and uses isolated browser contexts. `BASE_URL` selects another preview; `PLAYWRIGHT_CHANNEL` selects another installed Chromium browser.

Run `node frontend/tests/local-mode-e2e.cjs` from the repository root with `BASE_URL` set to the preview address for the complementary offline/export/privacy suite. `QA_OUTPUT` optionally selects its report directory. On Windows, use an existing writable TEMP directory for browser scratch files.

The app and document service were left running for manual testing.
