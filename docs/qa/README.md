# Verification checkpoint — 15 October 2026

These results verify the repaired branch locally. They do not satisfy every commercial mission requirement or establish a successful Hostinger deployment. See [acceptance and deployment](../DEPLOYMENT_REPORT.md) and [feature parity](../rea-resume-io/parity-matrix.md).

| Check | Final result | Evidence |
|---|---|---|
| Backend regression suite | PASS locally after privacy repair: 181 passed, 4 explicitly skipped; 6 dependency warnings | test_document_response_privacy.py, ../DEPLOYMENT_REPORT.md |
| Backend compile/dependency consistency | PASS | backend-report.md |
| Installed backend vulnerability audit | PASS: 87 dependencies, zero known advisories | backend-dependency-audit.json |
| Backend Docker image/runtime/restart | PASS on remote CI source ce44344; model, persistence, exports and isolation verified | [run38793500523](https://github.com/DocHarry22/resume-parser/actions/runs/38793500523) |
| Frontend types and primary production build | PASS after guest-session fix | frontend-build.log, primary-assets.json |
| Frontend Node regression tests | PASS: 29 tests, plus career validation/export checks; serialized BASIC/ATS/EXPERT/partial rendering covered | ../../frontend/tests; ../DEPLOYMENT_REPORT.md |
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
| Declined paid Render proposal | Schema/settings checks passed; user declined, never activated | render-candidate-validation.json |
| Actual Render Free backend | PASS native live368088a and 18HTTPS checks/17requests, all analysis/document responses no-store, real imports/scoring/exports, no cookies | render-free-deployment.json, render-free-live-api.json |
| Local backup verifier | PASS: 14 synthetic ZIP/TAR safety tests and CLI restore; actual production backup still absent | hostinger-backup-verifier-tests.json |
| Free-profile Linux resource limits | PASS on af8b3ca: 512 MiB/no extra swap, 0.1 CPU; peak 310.9 MiB | low-memory-ci-verification.json |
| Low-resource probe backpressure | Nine offline retry tests and deterministic ASGI finalization/recovery checks pass; exact HTTP 429 busy response handling is bounded/visible, production guard unchanged; current follow-up in PR checks | low-memory-ci-backpressure-194.json |
| Browser-local resume/letter profile | PASS: 22 Node tests, TypeScript, eight browser groups and six independently parsed exports | local-mode/README.md |
| Final primary static artifact | PASS source `194f9e8`: isolated build/typecheck, 66-file ZIP/hash verification, seven browser groups, four real API calls and 275 locally marked canonical responses; no public cutover | hostinger-static-artifact.json, hostinger-static/README.md |
| Scanner result and handoff | PASS real sparse BASIC PDF scan/editor handoff in CI on `194f9e8` and final static browser run; optional mode analyses handled without invented counters | ../../frontend/tests/scanner-e2e.cjs, hostinger-static/results.json |
| Source release archives | PASS: exact Git content/CRC/hash/path/size/exclusion verification | ../RELEASE_PACKAGING.md |
| Hostinger upgrade/live-domain acceptance | BLOCKED: real current backup and actual-domain cutover acceptance unresolved | ../DEPLOYMENT_REPORT.md |
| Registered accounts, live AI provider, billing | FAIL/BLOCKED: not implemented or not configured | ../rea-resume-io/parity-matrix.md |
| Remote GitHub Actions | PASS: all five jobs on privacy/upload application revision368088a; backend181/4, frontend24+tooling6, full browser/default container/small-model512MiB checks | release-368088a-ci.json |

The retained default-guest primary fixture has build ID `ZF0WlnsJ74-kmsE6Mk2tD`. Fourteen JS/CSS assets returned 200, the edition banner was absent, and its same-origin API proxy reached the intended local FastAPI fixture on port8001. A final editor rerun and six document-identity/privacy checks followed the last narrow fixes. Career/error-path checks passed on the preceding production build with the same shared API code; remote CI runs the complete suite on the final source. Failure screenshots remain as historical evidence; the final JSON and production-verification file identify passing reruns.

The new guest bootstrap regression reproduces concurrent initial requests with a cookie jar, then proves that initialization is awaited before protected operations. It also covers retry, independent error bodies, privacy deletion reset, optional cross-tab Web Locks and Sites' zero-network guard. Browsers without Web Locks still have a simultaneous first-use cross-tab limitation. Cross-tab deletion should be followed by reload in other open tabs; registered-account recovery remains absent.

Use [RUNNING.md](RUNNING.md) to reproduce checks with isolated synthetic data. The primary API fixture and browser previews are local conveniences; they are not long-lived hosted services.
