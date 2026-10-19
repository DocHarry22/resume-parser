# Main-domain UI release — deployed and verified

19 October 2026. **The actual public https://resume.docheng.co.za/ now serves the upgraded application.** The new homepage returns HTTP 200, is 104,363 bytes, has title `CareerForge | DoCHEng Resume Studio`, and includes the expanded theme. All 81 remote file paths and byte sizes match the reviewed release manifest. No DNS or cache-setting change was needed.

The [before observation](live-before.json) records the earlier 70-file application with build identifier `4IJUIZ24iQ_96SFfUlhHk`, a 52,884-byte homepage and the old title. The initial mismatch was an undeployed update rather than a browser cache problem.

## Deployed replacement

- Source: `d64a76351d27ceea8d0decdde1df340d051f1762` on the existing review branch.
- Archive: `.runtime/hostinger-release/d64a76351d27ceea8d0decdde1df340d051f1762/careerforge-hostinger-static-d64a76351d27.zip`.
- ZIP: 2,592,663 bytes, 81 files, with `index.html` at its root.
- SHA256: `3ccc05b51e19c59bf49afad79f448f25cb7ffe3a2529fa5618a757dcbdb35a9b`.
- Includes the full upgraded homepage, shared theme, eight resume layouts, six letterheads, workflow repairs, local fonts and illustrations.
- Uses browser-local libraries and the existing healthy stateless processor at `https://careerforge-resume-api-free.onrender.com`. This is the primary edition, with processing enabled; it does not use Sites mode.
- Build completed compilation, type checking, all 17 generated pages and static export in an isolated copy. The running app and existing Sites package were untouched.

The release verifier was updated to check the primary storage notice on the builder page. The redesigned homepage intentionally explains storage in its footer instead of displaying that notice. Seven release-tool tests pass, including the regression for this distinction and rejection of a Sites-mode export.

## Verification

[Independent archive inspection](archive-verification.json) verifies every ZIP entry against the manifest and exported file hashes and sizes. [Browser results](browser-results.json) record seven passing groups against these local static files at a simulated canonical browser origin. Four synthetic requests reached the real document service: current-content resume PDF, TXT import, resume analysis and current unsaved letter PDF. All used credentials omitted, canonical CORS and no-store responses; no server workspace requests, browser exceptions or missing local files occurred. Saving/reload, upload boundaries and mobile layouts also passed.

Those preparation checks use a local artifact. The separate [actual-domain browser results](live/results.json) now verify seven passing groups on the real deployed HTTPS site, with no intercepted local files. The full homepage, all eight templates and filters, template-to-builder navigation, saving/reload, current JSON/PDF downloads, TXT import, real resume checking, cover-letter persistence and current PDF download passed. All five requested pages fit a 390-pixel viewport. There were no browser exceptions or failed responses; the four real processing requests sent no cookies and returned canonical CORS and no-store responses.

[Independent download inspection](live/download-verification.json) reopened both PDFs downloaded from the live site. Both contain the expected current synthetic content and selectable text on every page, including the letter's Unicode sender name. The [native after inventory](live/native-after.json) records the exact deployed paths and sizes; the archive was uploaded into the verified resume subdomain root and consumed by the native static-deployment operation.

All five GitHub checks passed on the source revision: [application checks](https://github.com/DocHarry22/resume-parser/actions/runs/39214982143), [512 MiB small-model check](https://github.com/DocHarry22/resume-parser/actions/runs/39214982079).

## Rollback basis and scope

The user confirmed that Hostinger's online backups exist and that downloading them locally fails. The [backup runbook](../../BACKUP_RUNBOOK.md) now records the current deployment decision to use those provider-retained backups as the rollback option. The earlier request for a local archive is superseded by that clarification.

The connector cannot inspect or restore these backups. Their freshness, file contents and restorability have not been independently verified; no local archive verification or backup restoration was performed. The native inventory and replacement ZIP are not backups. If recovery becomes necessary, use the provider's folder-level restore for `domains/docheng.co.za/public_html/resume`, preserving other websites and databases.

Only the resume subdomain's static files were replaced. DNS, access settings, hosting plans, databases, other domains and backend deployments were unchanged. The existing private Sites version 3 remains separate and unchanged. The live public site uses the same existing stateless processor; documents remain stored in the visitor's browser.
