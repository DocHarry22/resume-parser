# Deployment and acceptance report

Updated 15 October 2026. This is a substantial repair of `DocHarry22/resume-parser`, with a working free Python processing service and a browser-local website edition. **The full commercial Resume.io replacement mission is not complete. The canonical Hostinger website has not been replaced.** See the [feature checklist](rea-resume-io/parity-matrix.md) for missing product requirements.

## Current outcome and user decisions

The user declined the proposed US$25.25/month Render service and explicitly declined Supabase. The active route uses Render's **Free** compute plan with no disk, database, AI subscription or DNS change. Documents save in the user's browser; Python processes a requested import, analysis or download without saving a document library.

- Backend: [actual HTTPS health endpoint](https://careerforge-resume-api-free.onrender.com/api/health), service `srv-db8jiqe7bikc739aca2g` in the selected **My Workspace**. Native Render status is live. Automatic deploys and previews are off.
- Canonical frontend: [resume.docheng.co.za](https://resume.docheng.co.za/), existing files unchanged. Replacement requires a verified current backup.
- Separate Sites edition: [private publication](https://docheng-careerforge.thletsholo2.chatgpt.site), saved version2; its existing zero-API guard is retained.
- Review: [draft PR2](https://github.com/DocHarry22/resume-parser/pull/2), branch `codex/career-platform-upgrade`, unmerged. Base `4c4891037d88af569204a940e733b390328c8776`.
- The original OneDrive checkout was preserved. Work uses the same repository/history in `.mission-work`.

The paid configuration is archived at `deploy/render.paid-proposal.yaml` and must not be activated. No root `render.yaml` exists. Supabase was evaluated read-only before the user's refusal; no project, schema, keys or database were created. Unrelated existing hosting services and databases remain untouched.

## Implemented experience

The original navy/teal CareerForge/DoCHEng frontend now has a split-screen editor, blank start, browser recovery, six original layouts, design controls, section editing, undo/redo, document library, rename/duplicate/delete, imports, real downloads, local jobs and cover letters. Service PDF contains selectable text; DOCX has editable paragraphs. Browser print preserves the preview's design; service exports use a readable layout and are not a promise of pixel-identical template rendering.

The default FastAPI/spaCy guest profile remains available: signed HttpOnly guest cookies, isolated atomic per-workspace storage, quotas, upload/archive bounds, exact CORS, origin checks, privacy export/delete and optional server-side AI configuration. Its durable-storage guarantees require a suitable persistent host and do not apply to the free profile.

The selected free profile uses `NEXT_PUBLIC_STORAGE_MODE=local` and backend `STORAGE_MODE=local`. It omits credentials, never initializes a guest workspace, blocks server library/AI operations, and sends the current document only to stateless processing routes. Imports return a separate browser document with no server ID. Resume, letter and job libraries remain local; supported browser downloads and editing continue during a processing outage. Clearing browser data or changing devices can lose local documents, so users should retain private JSON backups.

The free image uses pinned/checksummed `en_core_web_sm` 3.7.1. The original default image retains `en_core_web_md`; the small model changes extraction behavior and has no static word vectors. The free limits are 2 MiB uploads, 60,000 extracted characters, 20 PDF pages, 8 MiB expanded DOCX, 2,000 export nodes, one processing request and a 30-second complete-body deadline. The UI rejects oversized processing files before sending them. Browser-only JSON restoration retains its separate 10 MiB limit.

[Backend configuration and availability](BACKEND_HOSTING.md) records idle sleep, shared free-hour limits and possible provider usage charges. The plan has no fixed monthly compute fee; no claim of guaranteed zero usage charges or production uptime is made. No artificial keep-alive is configured.

## Verification

| Scope | Result and evidence |
| --- | --- |
| Latest local backend regression | PASS: **181 passed, 4 skipped**, 6 dependency warnings after the no-store repair |
| New privacy regression | PASS: 12 tests cover real parsing/scoring, validation/parser errors, early body/rate rejection and both storage profiles |
| Frontend regression | PASS: **29 Node tests** plus career checks and TypeScript validation of 74 source files; oversized-upload rejection, exact boundary, credentials omitted, Sites precedence and real React rendering for BASIC/ATS/EXPERT/partial metrics |
| Initial deployed revision `93d0f41` | All five remote jobs passed: backend, frontend, browser, default container and Linux small-model memory check; [exact CI evidence](qa/deployed-revision-ci.json) |
| Linux free-profile resources | The initial deployed revision passed 512 MiB/no extra swap/0.1 CPU with a 316.9 MiB cgroup peak, real NER, parsing/scoring, current-content exports, 55,000 characters and a complete 13-page PDF; zero private files and no OOM |
| Actual Render deployment | [Native service/deploy record](qa/render-free-deployment.json); native provider status and source are distinct from HTTP behavior |
| First actual HTTPS probe | [Recorded initial failure](qa/render-free-initial-live-api.json): functional/security/content checks passed, but explicit no-store headers were missing on two analysis responses; the narrow repair is committed in `368088a` |
| Final actual HTTPS probe | PASS on deployed `368088a`: **18 checks / 17 requests**, findings empty; analysis success/errors and all document responses no-store, exact CORS, no cookies, disabled server libraries, real imports/scoring and independently parsed four-format current Unicode exports; [report](qa/render-free-live-api.json) |
| Deployed backend revision `368088a` | All five remote jobs passed; 181 backend tests passed / 4 skipped, 24 frontend tests plus career checks and 6 static-tooling tests, production build/types, browser, default container and small-model Linux peak 314.8 MiB; [exact evidence](qa/release-368088a-ci.json) |
| Scanner frontend revision `194f9e8` | Remote frontend, browser, backend and default-container jobs passed, including the new real sparse-PDF scanner/editor regression. Backend/Docker inputs are unchanged from deployed `368088a`. The Linux benchmark's immediate next request received a valid HTTP 429 busy response; [preserved diagnostic](qa/low-memory-admission-failure.json). The verifier's bounded Retry-After handling is tested separately; current remote status belongs to the PR checks |
| Browser-local behavior | PASS: eight browser groups at 390/1440 pixels, offline letters, failures/recovery, separate profiles, privacy and six independently parsed exports; [evidence](qa/local-mode/README.md) |
| Primary default guest/editor behavior | Prior production/browser and isolation checks are preserved in [QA](qa/README.md); they do not establish actual Hostinger acceptance |
| Dependency audits | Installed backend and frontend production dependencies had zero known advisories; frontend development audit remains **7 high, 2 moderate**, requiring a separate tooling migration |
| Backup verifier | PASS: 14 synthetic ZIP/TAR safety tests plus independent CLI/selected-restore probes on Python3.12/3.13; **no real hosting archive verified** |
| Final Hostinger static artifact | PASS build/types and independent ZIP/dist/manifest inspection: 66 files, 475,906-byte ZIP; source `194f9e8`. All seven browser groups passed with four live API calls, 275 verified local responses and no errors/violations; [artifact record](qa/hostinger-static-artifact.json), [browser evidence](qa/hostinger-static/README.md) |
| Actual current browser PDF downloads | PASS: independent selectable-text/current-content/Unicode/nonblank-page checks for resume and unsaved letter; [verification](qa/hostinger-static/independent-export-verification.json) |

The earlier Linux memory run on `af8b3ca` observed 310.9 MiB; [that frozen record](qa/low-memory-ci-verification.json) remains tied to its own revision. These measurements are synthetic CI evidence, not a guarantee for every uploaded document or a measurement of Render's live filesystem/memory.

The low-resource verifier now handles the server's explicit temporary admission response with bounded, visible retries. It retries only allowlisted memory-only POSTs and the exact HTTP 429 busy response body, honors a valid numeric `Retry-After`, and stops after two retries or 30 seconds of waiting per request. Rate-limit errors, cookies, unexpected statuses, missing/invalid delays and persistent contention still fail. Nine offline tests and a deterministic ASGI-finalization/recovery test cover this behavior; the production concurrency guard and all resource/content assertions are unchanged. [Original native failure and diagnosis](qa/low-memory-ci-backpressure-194.json). Current follow-up results are in the [PR checks](https://github.com/DocHarry22/resume-parser/pull/2/checks).

## Hostinger inspection and backup gate

Read-only native inspection identified active `cloud_economy_v3` hosting, account `u836398163`, canonical document root `/home/u836398163/domains/docheng.co.za/public_html/resume`. It is an existing static Next export, with no API reverse proxy, linked Git deployment, configured Node build settings or Node environment. Deployed cover-letter JavaScript still contains the unusable placeholder `https://your-backend-domain.com`. The newly created Python host does not change those files by itself.

The complete scoped metadata inventory returned **90 entries, including 70 regular files totaling 67,455,572 bytes**, including six old large sample PDFs. [Path/size baseline](qa/hostinger-static-tree.json). Native DNS remains `resume` ALIAS to `resume.docheng.co.za.cdn.hstgr.net.`, TTL300. The initial public HTTPS capture returned 200. No files, DNS, certificates or account databases were modified.

The user confirmed there is **no verified current backup**. The connected regular-hosting tools cannot create/download a complete files backup; the file-reading endpoint cannot supply a complete binary/large-file archive. A partial metadata/text copy must not be called a backup. [The runbook](BACKUP_RUNBOOK.md) explains creating/downloading the current archive in hPanel and then verifying only the selected site into a fresh private local directory. The verifier checks archive integrity, exact file set/size baseline and restored hashes; it does not establish separately hosted backend/database completeness or successful server restoration.

A text-input request for the downloaded archive's full local path is pending. The current Hostinger site remains untouched while this required rollback evidence is absent.

## Concrete cutover procedure

1. Obtain the current hPanel archive; inventory it, verify the exact resume subtree locally and retain the original archive and reports privately. Resolve any relevant external backend/database data before replacement.
2. Retain the verified backend revision and HTTPS probe. Use the primary static artifact from clean committed frontend source `194f9e8`, built with `scripts/build-hostinger.cjs`, the exact verified Render URL, local storage mode and Sites mode unset. Review its ZIP/manifest/hashes and browser evidence. Builds occur in physical copies and leave primary/Sites intermediate output untouched.
3. Upload only the verified static build output, with `index.html` at archive root, through the scoped Hostinger upload/deploy mechanism for `resume.docheng.co.za` on `u836398163`. The archive deployment overwrites existing files; the verified rollback archive is a prerequisite. No Node/Python execution on Hostinger, DNS change or paid upgrade is required for this profile.
4. Verify the actual public domain after deployment: assets/redirects, blank editor, local save/reload, import/review, analysis, letters, PDF/DOCX contents, omitted credentials, exact CORS, no cookies/server library calls and unavailable-service recovery. A browser serving local artifact files at a simulated canonical origin is useful preparation, but must not be reported as a deployed-domain test.
5. Keep the draft PR unmerged until applicable deployment/rollback checks and release acceptance are resolved. Retain the prior files and matching backend/frontend revisions; use the verified selected-site backup for a scoped rollback if necessary.

## Sites publication retained

The supported Sites plugin saved and privately published version2 successfully. It is an independent local-editing subset; no new API host is connected as a side effect.

- Project: `appgprj_6ad0d2b816bc8191b1964e7bc48c2f93`.
- Saved version: `appgprj_6ad0d2b816bc8191b1964e7bc48c2f93~appgver_a9c82ecb50388191a02017eaefc46d70`.
- Deployment: `appgdep_6ad1266496808191955c920fff57e5d5`, native status **succeeded**.
- Pushed source: `a907baefc954f86b9b3b95877d3df8cfaac7fd25`.
- Archive SHA256: `0e3d501fc7be1ab22ec1bf96042f74349d2f2ca2c6fb1706e37bdc89deec1430`.
- All19 Sites checks passed with zero API calls/runtime errors; primary build ID `ZF0WlnsJ74-kmsE6Mk2tD` and checked primary assets were preserved.

## Product gaps and source delivery

Accounts/login/reset/verification, account authorization and cross-device sync are not implemented. There are six templates, not thirty. OCR, per-field extraction confidence, rich-text editing, persisted version history, a job calendar, interview tools, live-provider AI verification, billing, sharing and parts of localization remain incomplete. The UI must not offer these as working services. The full commercial mission acceptance remains unsatisfied.

Older source ZIPs from `6740b2ba1a935e85627c6b5b444a274cbb223479` remain frozen historical artifacts under `.runtime/release`, with [packaging evidence](RELEASE_PACKAGING.md). They predate the free-profile changes and are not the current Hostinger deployment package. The branch/PR contains current source; the new static release has a separate commit-bound manifest and ZIP. No private data, environment files, credentials or original resume PDFs belong in a release artifact.
