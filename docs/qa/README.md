# Verification checkpoint — 15 October 2026

These results verify the repaired branch locally. They do not satisfy every commercial mission requirement or establish a successful Hostinger deployment. See [acceptance and deployment](../DEPLOYMENT_REPORT.md) and [feature parity](../rea-resume-io/parity-matrix.md).

| Check | Final result | Evidence |
|---|---|---|
| Backend regression suite | PASS: 147 passed, 4 explicitly skipped; 6 dependency warnings | backend-report.md |
| Backend compile/dependency consistency | PASS | backend-report.md |
| Installed backend vulnerability audit | PASS: 87 dependencies, zero known advisories | backend-dependency-audit.json |
| Backend Docker image/runtime/restart | PASS on remote CI source6740b2b; model, persistence, exports and isolation verified | container-ci-verification.json |
| Frontend types and primary production build | PASS after guest-session fix | frontend-build.log, primary-assets.json |
| Frontend Node regression tests | PASS: 12 tests, plus career validation/export checks | editor-report.md, backend-report.md, frontend/tests |
| Production dependency audit | PASS: zero known advisories | frontend-runtime-audit.json |
| Full development dependency audit | PARTIAL: 7 high, 2 moderate remain | frontend-dependency-audit.json |
| Editor browser workflow | PASS: 8 groups; no runtime/console/request errors | editor-e2e-results.json |
| Document identity and legacy privacy | PASS: 6 actual UI/API regression groups | editor-session-isolation-results.json |
| Public routes/gallery/responsive checks | PASS: 13 checks | site-smoke-results.json |
| Career dashboard/jobs/letter workflow | PASS: desktop/tablet/mobile; no browser errors | career-e2e-results.json |
| Storage/API failure recovery | PASS: 6 groups | career-error-results.json |
| Actual PDF/DOCX contents | PASS: selectable text, editable Word paragraphs, Unicode and final-page content | independent-export-verification.json |
| Styled print pagination | PASS: 5 pages, all nonblank, final sentinel retained | primary-production-verification.json |
| Sites local static behavior | PASS: 19 checks; zero API calls and zero browser errors | sites-results.json |
| Native Sites publication | PASS: saved version2, owner-private, succeeded | ../../sites/deployment.json |
| Hostinger inspection | PASS within recorded read-only scope | hostinger-inspection.json |
| Source release archives | PASS: exact Git content/CRC/hash/path/size/exclusion verification | ../RELEASE_PACKAGING.md |
| Hostinger upgrade/live-domain acceptance | BLOCKED: Python host and verified backups unresolved | ../DEPLOYMENT_REPORT.md |
| Registered accounts, live AI provider, billing | FAIL/BLOCKED: not implemented or not configured | ../rea-resume-io/parity-matrix.md |
| Remote GitHub Actions | See actual PR checks; local results are not remote CI | ../DEPLOYMENT_REPORT.md |

The final primary artifact has build ID `ZF0WlnsJ74-kmsE6Mk2tD`. Fourteen JS/CSS assets returned 200, the edition banner was absent, and its same-origin API proxy reached the intended local FastAPI fixture on port8001. A final editor rerun and six document-identity/privacy checks followed the last narrow fixes. Career/error-path checks passed on the preceding production build with the same shared API code; remote CI runs the complete suite on the final source. Failure screenshots remain as historical evidence; the final JSON and production-verification file identify passing reruns.

The new guest bootstrap regression reproduces concurrent initial requests with a cookie jar, then proves that initialization is awaited before protected operations. It also covers retry, independent error bodies, privacy deletion reset, optional cross-tab Web Locks and Sites' zero-network guard. Browsers without Web Locks still have a simultaneous first-use cross-tab limitation. Cross-tab deletion should be followed by reload in other open tabs; registered-account recovery remains absent.

Use [RUNNING.md](RUNNING.md) to reproduce checks with isolated synthetic data. The primary API fixture and browser previews are local conveniences; they are not long-lived hosted services.
