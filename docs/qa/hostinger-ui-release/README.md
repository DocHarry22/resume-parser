# Main-domain UI release — ready, not deployed

19 October 2026. The actual public `https://resume.docheng.co.za/` still serves the previous static application. A native Hostinger inventory confirms the original 70 regular files (67,455,572 bytes), with the old build identifier `4IJUIZ24iQ_96SFfUlhHk`. The HTTP homepage is 52,884 bytes, has title `Resume Scanner - AI-Powered Resume Analysis`, and lacks the upgraded homepage copy. This is an undeployed update, not evidence of a browser cache problem.

## Prepared replacement

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

These are local-artifact checks, not a claim that Hostinger was updated. All five GitHub checks passed on the source revision: [application checks](https://github.com/DocHarry22/resume-parser/actions/runs/39214982143), [512 MiB small-model check](https://github.com/DocHarry22/resume-parser/actions/runs/39214982079).

## Remaining dependency

The [existing backup runbook](../../BACKUP_RUNBOOK.md) requires verified rollback evidence before replacing the website. The connected regular-hosting tools expose file metadata and bounded text reads, but no operation to create/download a complete files backup. Windows browser automation is unavailable in this session. No matching backup archive was found in Downloads, and no current real backup has been supplied or verified. A partial file listing is not a backup.

A request for the current backup archive's full local path is pending. Once supplied, inventory and verify only the selected resume subtree against the current native observation before uploading or replacing any live files. Do not restore or alter other domains. The newly prepared ZIP is a replacement release, not a backup of the old live website.

No Hostinger files, DNS, access settings, hosting plans, databases or backend deployments were changed. The existing private Sites version 3 remains separate and unchanged.
