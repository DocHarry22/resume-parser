# Deployment and acceptance report

Date: 15 October 2026. This is a substantial repair and upgrade of `DocHarry22/resume-parser`, not a completed commercial Resume.io replacement. The full requested acceptance criteria remain unsatisfied. The detailed PASS/PARTIAL/FAIL/BLOCKED checklist is [feature parity](rea-resume-io/parity-matrix.md).

## Source and preservation

- Working branch: `codex/career-platform-upgrade`; base `4c4891037d88af569204a940e733b390328c8776`.
- The original OneDrive checkout contains unreadable placeholders and was preserved. Work uses the same repository/history in its `.mission-work` directory.
- Meaningful implementation commits: `de34c9d` backend/security/exports; `7a394a9` shared modules/navigation/runtime; `10cc308` studio/imports/exports; `b7e5a80` career/letters. Final evidence and publication references are recorded below after completion.
- Final safety repairs: `1e9c2c8` serializes guest-session initialization; `14dce88` prevents restored documents overwriting a previous server copy and includes legacy draft data in privacy controls.
- Production data, DNS, paid integrations and the current Hostinger deployment have not been changed.

## Implemented behavior

The main frontend now provides an original split-screen editor with blank start, live preview, browser save/restore, six templates, design controls, sections, undo/redo, document library, imports, real document exports and provider-aware writing review. The career workspace provides local job tracking and backups plus cover-letter editing, guest saves and current-content exports. API calls use a configurable same-origin proxy and credentialed requests.

The existing FastAPI/spaCy parser and scoring engine remain. Guest documents are isolated by signed HttpOnly cookies and stored atomically in bounded workspace directories. File validation, request/ZIP expansion limits, exact CORS, origin checks, server-only AI configuration, privacy export/delete and genuine selectable PDF/editable DOCX improve the repaired workflows.

Guest storage is not an account system. No registration, email verification, password reset, PostgreSQL ownership migration, billing, live-provider AI integration or cross-device synchronization was completed. There are six original layouts, not thirty. OCR, per-field extraction confidence, a job calendar, interview coaching and several other requested tools remain missing.

## Verification

- Backend: 147 tests passed, 4 skipped; compile check and dependency consistency passed. Installed backend dependency audit found zero known advisories in 87 packages. See [backend report](qa/backend-report.md).
- Frontend: type checks, normalization/local-export/job tests and production builds have been exercised. The production dependency audit found zero known advisories; the full development dependency audit still reports nine (seven high, two moderate), primarily requiring a separate tooling migration.
- Editor, career, error-path, responsive and Sites browser checks are documented with JSON, screenshots and actual downloads in [QA instructions](qa/RUNNING.md). Final production-mode rerun status is recorded in the QA summary.
- PDF/DOCX files were independently parsed for selectable text, editable paragraphs, Unicode and complete multipage content. [Export verification](qa/independent-export-verification.json).
- A static Sites build originally overwrote the primary Next intermediate output. That artifact collision caused browser failures. `scripts/build-sites.cjs` now builds in a separate physical directory; the main build was rebuilt for final reruns. Do not interpret the initial failed runs as a passing release check.
- GitHub Actions configuration is included. Local checks do not imply a green remote Actions run. Current checks are linked from [PR2](https://github.com/DocHarry22/resume-parser/pull/2).
- Remote Docker verification **passed** on source `6740b2ba1a935e85627c6b5b444a274cbb223479`, run `38792993537`: image build, statistical model vectors/NER, non-root runtime, an isolated writable volume, guest separation, real parsing/exports, deletion and restart persistence. The backend/browser setup jobs initially failed because spaCy's model downloader constructed an invalid URL; their workflow and setup documentation now use the pinned/checksummed wheel that passed in Docker. Consult the PR for the rerun status.
- The corrected [remote run `38793500523`](https://github.com/DocHarry22/resume-parser/actions/runs/38793500523) on `ce44344cfcb43a7a3b9c3709f5949dcd3925e9e7` completed successfully: backend, frontend, browser and container jobs all passed. The native PR checks were read again on 15 October 2026. Subsequent proposal/tooling commits require their own checks; this result refers to that exact application revision.

## Hostinger: inspected; deployment BLOCKED, live site unchanged

Canonical public URL remains https://resume.docheng.co.za/. Initial browser capture returned HTTP 200 and normal HTTPS. Hostinger management tools became available later in this session, and read-only native calls verified the following:

- The existing enabled subdomain belongs to an active `cloud_economy_v3` plan. It is classified as `other`, and its document root contains an exported static Next frontend with `.htaccess`, route HTML and `_next` assets.
- There are no linked website Git repositories. Git automatic-deployment settings are all null. There is no Node build history or configured Node environment-variable list. The stored Node build-settings endpoint returns HTTP 404.
- The full document-root inventory returned 90 entries, including static assets and six old large sample PDFs. The rewrite file serves exported route directories and falls back to the homepage; it contains no API reverse proxy.
- Publicly deployed cover-letter JavaScript references `https://your-backend-domain.com`. This is an unusable placeholder, not a verified Python API. No working production Python host or persistent backend data store has been identified.
- Supported operation discovery did not return a regular-hosting backup/export operation. The existing website/data backup and restore are not verified. Resource limits, any backend outside this root, and database ownership remain unknown.
- Native Hostinger VPS listing is empty. With the user's explicit workspace selection, Render service inspection returned two unrelated Node services and no service for this repository. Existing services were left untouched. The user subsequently requested a new host. A concrete Render service-plus-disk candidate is prepared in [backend hosting](BACKEND_HOSTING.md): one Frankfurt `1c-2g` service with a 1 GB disk, estimated US$25.25/month before tax, usage and any workspace charges. No paid resource was activated.
- Native DNS read confirms `resume` is an ALIAS to `resume.docheng.co.za.cdn.hstgr.net.` with TTL300. The zone was not edited. HTTPS browser capture succeeded; certificate renewal/expiry operations were not inspected or changed.

These are production-configuration observations, not a successful deployment. Hostinger's Node capability must not be assumed to host Python/spaCy. No hosting writes, DNS edits, paid activations or database changes have occurred.

The user confirmed there is no verified current backup. The available Hostinger connector cannot create or download a complete regular-hosting backup, and Render's connected service-creation tool cannot attach a disk or create a Blueprint. These capability gaps require the documented Dashboard steps; a diskless paid service would not satisfy this deployment. [Backup instructions and local verification](BACKUP_RUNBOOK.md) keep restoration tests separate from production. The production cutover remains blocked until an actual backup and storage/API checks succeed.

The Render candidate passed the current official schema, invalid-plan/zero-disk negative controls and actual application-setting checks; [validation record](qa/render-candidate-validation.json). The local backup verifier passed 14 synthetic ZIP/TAR tests on Python 3.12 and 3.13 and a separate CLI inventory/selected-restore smoke check. A focused independent review found and verified fixes for nested-site provenance and truncated ZIP filenames. The scoped live Hostinger metadata inventory returned all 90 entries, including 70 regular files totaling 67,455,572 bytes; [path/size baseline](qa/hostinger-static-tree.json). This is metadata and synthetic-tool verification, not an actual backup or provider deployment.

The native website settings show no automatic Git deployment, but other external CI hooks have not been ruled out. The reviewed work remains on a branch/draft PR while backend deployment, backups and remaining acceptance gates are unresolved. No new production-domain success or production login/import/export result is claimed.

### Concrete release procedure after access is restored

1. Inspect the existing Hostinger app, connected repo/branch, build/start commands, SSL, API host and data paths. Back up its configuration and durable document data; test restoration to a separate location. Preserve old shared documents until ownership is mapped.
2. Confirm a Python 3.12 host with sufficient memory for `en_core_web_md`, DejaVu fonts, persistent disk and an HTTPS reverse proxy. The included non-root `Dockerfile`/`docker-compose.yml` describes a single-service backend with a named data volume. Its image and disposable Docker runtime passed remote CI; a Compose deployment and provider-specific volume permissions still need verification on the chosen host.
3. Set a stable private `WORKSPACE_SECRET`, durable `DATA_DIR`, exact `CORS_ORIGINS` and `COOKIE_SECURE=true`. Configure AI variables only for an approved provider. Review `.env.example`; do not place secrets in browser variables or Git.
4. Build frontend dependencies from the lockfile. Set `API_PROXY_TARGET` to the verified private backend **before** `next build`; this rewrite is compiled into the build. Run the frontend with the supported Node runtime and verify proxy cookies/HTTPS. The local QA build points at `127.0.0.1:8001` and is not an artifact to upload blindly to Hostinger.
5. Run the documented suites with isolated fixtures, review the PR/remote checks, merge only after deployment behavior and rollback are confirmed, then deploy using the verified existing mechanism.
6. Verify the actual domain: assets, redirects, upload→review→edit, save/restore, scoring, cover letter, PDF/DOCX contents, workspace separation and deletion. Account flows remain a release blocker for an account-based product. Inspect production logs/resource use with authorized tools.

Rollback: retain the previous source revision/build configuration and an independently verified data backup. Roll back frontend and backend together if proxy/schema changes are incompatible. Do not restore old globally accessible document routes merely to make legacy records visible. No destructive migration has run in this work.

## Sites: independently hosted local edition

Existing saved project identity: `appgprj_6ad0d2b816bc8191b1964e7bc48c2f93`, under `sites/careerforge/.openai/hosting.json`. The supported Sites plugin is used to push source, save a version, then publish privately. The deployment URL/version/status are added only from the native tool response.

The same frontend supplies the branding, six templates and resume schema. Browser editing, recovery, JSON/TXT/editable DOCX, printing and local job tracking work. Sites' documented JavaScript/Workers runtime cannot execute this Python/spaCy server. Import/AI/server workspace actions are visibly guarded pending a verified canonical API. Shared account/document/scoring results are BLOCKED. No unverified cross-origin personal API is enabled.

## External-service evaluation

Supabase Auth/PostgreSQL was evaluated as a future canonical ownership layer; no project or database was provisioned. Payment integration remains disabled: merchant ownership, approved ZAR prices, VAT treatment and sandbox verification are absent. Paystack's official subscription documentation was reviewed as one possible provider; this is not evidence of eligibility for every South African business or a completed recurring payment integration. No transactions or paid activations occurred.

## Outstanding severity

- P0 before public release: verified hosting/backups/API routing, account ownership if accounts are offered, deployment secrets/durable disk, actual-domain security/workflow checks.
- P1 product gaps: thirty distinct templates, OCR/confidence, rich text, persisted versions, exact-style service exports, live AI verification and remaining development advisories.
- P2 expansion: synchronized jobs/calendar, job URL/file ingestion, interview tools, privacy-controlled sharing and verified localization.
- P3 monetization: approved products/pricing, tested provider webhooks/cancellation/reconciliation and consent-based team features.

## Confirmed Sites publication

Version 1 was saved before deployment and published privately through the supported Sites plugin. Native deployment status: **succeeded**. URL: https://docheng-careerforge.thletsholo2.chatgpt.site.

- Project: `appgprj_6ad0d2b816bc8191b1964e7bc48c2f93`.
- Version: `appgprj_6ad0d2b816bc8191b1964e7bc48c2f93~appgver_f2a76045ad6c8191b006b56ad938fa1a`.
- Deployment: `appgdep_6ad12019cfe88191927ffd91f45d4b5a`.
- Pushed Sites source: `037498a8f181c695036e0e8dde858cb429318c62`.
- Archive content hash: `sha256:8e8e57d03f22461d584f255c0ff6d62df390f0d5785210a934a0ef750d74f08c`.

The source helper initially encountered Windows/WSL path and GNU tar drive-letter handling errors. It succeeded with the installed Git Bash on PATH, a valid process-local temporary directory, `TAR_OPTIONS=--force-local`, and a forward-slash absolute archive path. No plugin files or credentials were written to source.

Version2 is now the current private publication. It includes the final guest bootstrap, import-pointer and privacy fixes from primary source `14dce884309c0f9dfc83d01471bedec7778f91c9`, built in an isolated physical directory. All19 Sites browser checks passed with zero API calls or runtime errors. Primary BUILD_ID `ZF0WlnsJ74-kmsE6Mk2tD` and all17 checked primary asset hashes/statuses remained unchanged throughout the Sites build.

- Saved version2: `appgprj_6ad0d2b816bc8191b1964e7bc48c2f93~appgver_a9c82ecb50388191a02017eaefc46d70`.
- Deployment: `appgdep_6ad1266496808191955c920fff57e5d5`, native status **succeeded**.
- Pushed Sites source: `a907baefc954f86b9b3b95877d3df8cfaac7fd25`.
- Archive content hash: `sha256:0e3d501fc7be1ab22ec1bf96042f74349d2f2ca2c6fb1706e37bdc89deec1430`.
- Published URL remains https://docheng-careerforge.thletsholo2.chatgpt.site.

## GitHub review and source packages

Pushed branch: `codex/career-platform-upgrade`. [Draft PR2](https://github.com/DocHarry22/resume-parser/pull/2) is attached to this Codex chat. It remains unmerged while deployment and acceptance gates are unresolved. Use that PR's Checks tab for current remote CI results; the evidence above records exact completed runs.

Verified source packages were generated from `6740b2ba1a935e85627c6b5b444a274cbb223479`, before the final workflow/documentation-only follow-up. Later report changes do not alter these frozen archive contents.

| Archive | Size | SHA256 |
|---|---|---|
| `careerforge-frontend-source-6740b2ba1a93.zip` | 255,015 bytes; 82 files | `b50df15db8fd95d2dd75d0a937c2e411f700b2b0d1f0b679b58a1a3e109530cb` |
| `careerforge-backend-source-6740b2ba1a93.zip` | 77,538 bytes; 41 files | `615a993d11b6a24ca6c1f76c41a4f4f2376a5e10ae00e4d4afc5cb525dcca92d` |

Local delivery directory: `.runtime/release/6740b2ba1a935e85627c6b5b444a274cbb223479/`. It contains the archives, full per-file manifest, SHA256SUMS and independent `verification.json`. Every ZIP entry matched its committed Git blob, passed CRC/hash verification and required-path checks, and excluded real environment files, private documents, build/dependency folders and old sample PDFs. Both raw and compressed sizes meet the hosting archive bound. These are source artifacts; the target host must build them with verified configuration. [Exact packaging and deployment instructions](RELEASE_PACKAGING.md).
