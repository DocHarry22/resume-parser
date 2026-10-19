# Career workspace release — 19 October 2026

The updated career workspace is published on [Hostinger](https://resume.docheng.co.za/dashboard/) and the existing [owner-private Site](https://docheng-careerforge.thletsholo2.chatgpt.site/dashboard/). GitHub source is on the existing `codex/career-platform-upgrade` branch and [draft PR #2](https://github.com/DocHarry22/resume-parser/pull/2).

The release adds the shared workspace/dashboard, document library, application tracker, interview practice, resume tailoring and checkpoints, linked letters, public job feeds and saved searches, external job-search shortcuts, review-first Greenhouse/Lever application packets/helper, salary scenarios, and editable 90-day plans. See the individual feature documents in `docs/` for behavior and limits.

## Exact published artifacts

- Primary source: `a8b47b6653fa21cdbc64407e00278d8449b93c65`.
- Hostinger ZIP: `careerforge-hostinger-static-a8b47b6653fa.zip`, 2,783,778 bytes, 115 files. SHA256: `bc32658bc982500c3698045a9bdd9e4c9144ec1cd24153e404fb2f00752506fb`.
- Sites version 4: source `3db2fcfdeb84e8cffe5af183a8d2d32ff44a5fa1`; saved version `appgprj_6ad0d2b816bc8191b1964e7bc48c2f93~appgver_f246cfa8746c819192512f715807ef57`; deployment `appgdep_6ad644a6602081919ea8e56e53a2ffbd` returned **succeeded**. The source helper pushed this exact state before packaging and publication.
- Helper 1.0.1: 9,617 bytes; SHA256 `93ec795cd91a543494e50747e5e160298784a123e0e750b9b8e6f345175d36d6`. Its ZIP entries match the committed extension source and explicitly recognize both hosted application origins.

Both isolated Next exports completed compilation, type checking and generation of 26 pages. The running primary build was not overwritten. Hostinger uses browser-local storage with the existing stateless Render processor; Sites uses its browser-only edition. No backend deployment, hosting-plan, database, DNS or audience change was made.

## Verification

- 107 application tests plus career validation and genuine DOCX checks passed; 11 release-tool tests passed.
- [Sites artifact](sites-artifact/results.json), [Hostinger artifact](hostinger-artifact/results.json), [actual private Site](sites-live/results.json), and [actual Hostinger website](hostinger-live/results.json) each passed five browser groups. Each run visited all eleven career routes at desktop and 390-pixel mobile widths, checked plan/task and salary persistence across reload, reopened the downloaded DOCX, and verified the helper download. All reported no browser exceptions or failed responses.
- The two primary-edition runs each made one real, credential-free DOCX processing request using synthetic content. The two Sites runs made zero processing requests. Private Site checks used the existing native review credential in an origin-scoped header; no credential was saved in these files or source.
- The full Hostinger ZIP was independently reopened and every entry matched the [manifest](hostinger-manifest.json). [Native file evidence](hostinger-native-after.json) and [comparison](hostinger-inventory-verification.json) establish that every deployed path and byte size matches the release. The deployment consumed the uploaded archive.
- [Tracker CI regression](tracker-ci-regression.json) covers create/edit, stage transitions, reload, search, JSON export, three responsive widths, deletion and restoration. Legacy CI selectors were updated for the tracker cards, current empty state and quota-error wording. The full remote CI suite runs on the follow-up commit; this report does not substitute earlier CI results for that run.

Application-helper form filling retains the earlier controlled Greenhouse/Lever verification under `../job-search-apply/`. Submission remains manual. Public feed availability depends on providers; external search shortcuts open those sites. Salary comparison uses supplied figures, with no connected market benchmark. Libraries stay in each browser origin and require explicit backups for transfer.

## Rollback basis

The earlier user-approved decision to rely on Hostinger's retained online backups still applies; local backup downloading was reported to fail. Backup freshness and restorability have not been independently verified. The replacement package and file inventory are not backups. Follow [the existing runbook](../../BACKUP_RUNBOOK.md) for folder-level recovery of the resume subdomain. Other websites and databases remain outside this release.
