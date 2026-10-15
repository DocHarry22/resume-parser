# Sites static-build verification

Verified on 15 October 2026 against the preserved `sites/careerforge/dist` export, served locally at `http://127.0.0.1:4173`. The browser run used a fresh Microsoft Edge context and synthetic QA data. This checks the local build; it does not claim a published Sites deployment.

## Result

**Passed.** `sites-results.json` records 19 check groups, with zero browser runtime exceptions, console errors, failed HTTP responses, or `/api/` network requests.

- The resume builder starts blank and accepts the candidate name and summary. Live preview, browser autosave, and reload preserve those edits.
- Local TXT, genuine OOXML DOCX, and JSON backup downloads contain the synthetic document. The Word file has the correct OOXML package structure. Independent python-docx verification opened its four editable paragraphs, confirmed the exact Unicode name and content marker, then added a paragraph and saved successfully in memory. Text and backup checks also retain the marker and name.
- The PDF action invokes browser Print / Save PDF. This run checks print availability; it does not generate a new styled PDF or establish platform print-driver behavior.
- Non-JSON parsing is explicitly redirected to the primary application's capabilities without losing the browser draft. The editor exposes Open primary workspace, and the shared Sites banner links to the primary application.
- Gallery, dashboard, local job tracker, and the guarded cover-letter page load from the static build. The dashboard discovers the resume saved in this browser.
- Desktop 1440 × 1000 and mobile 390 × 844 layouts fit without horizontal overflow. Mobile editing and preview both fit. Screenshots were visually inspected.
- The static edition issues no backend API requests across these checks. Server-only cover operations show the intentional local guard notice; no full server cover-letter workflow was attempted.

## Evidence and repeatability

- `sites-results.json`: machine-readable result and diagnostics.
- `sites-builder-*.png`, `sites-preview-mobile.png`: resume editing and preview.
- `sites-gallery-*.png`, `sites-dashboard-*.png`, `sites-jobs-*.png`, `sites-cover-fallback-*.png`: desktop/mobile route evidence.
- `sites-resume.txt`, `sites-resume.docx`, `sites-resume.json`: actual local UI downloads.
- `../../scripts/sites-smoke.cjs`: portable browser acceptance script. It uses the shared Playwright loader and accepts `SITES_BASE_URL` and `PLAYWRIGHT_CHANNEL`.
- [Running the checks](RUNNING.md): setup and other QA suites.

The host's configured temporary drive was unavailable during this run. The browser process used `.runtime/playwright-temp` as its process-local TMP/TEMP directory. No system settings, feature source, or static-build files were changed for verification.

The owned Python preview was left running on port 4173 for review. Browser storage and downloads remain local; imports requiring parsing, configured AI, and server-session documents use the primary application.
