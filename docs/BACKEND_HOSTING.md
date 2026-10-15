# Free backend — deployed; website cutover pending

Updated 15 October 2026. **The user declined the US$25.25/month paid proposal and Supabase. A new Render Free Python service is now live at [careerforge-resume-api-free.onrender.com](https://careerforge-resume-api-free.onrender.com/api/health).** No paid resource, disk, database, AI provider or DNS change was activated. The canonical website remains `https://resume.docheng.co.za`, with its existing files unchanged pending a verified backup.

## Browser-local experience

Resumes, cover letters and job tracking save in the user's browser. The Python service processes an uploaded document, checks resume text or produces a requested download, then returns the result. This profile must not keep a server document library or promise cloud synchronization. Clearing browser data or moving to another device can lose local documents; download private JSON backups regularly.

The reviewed configuration is [deploy/render.free-proposal.yaml](../deploy/render.free-proposal.yaml), deliberately outside the root `render.yaml` path. The native Render tool created the new service with its explicit free plan, Dockerfile and reviewed environment; this was not a Blueprint application. Automatic deployment and previews are off. [Native deployment record](qa/render-free-deployment.json). The private Sites edition remains independent and must not start calling this service.

## Actual free configuration

| Setting | Configuration |
| --- | --- |
| Workspace | My Workspace (`tea-cspuvgrtq21c739a8r9g`) |
| New service only | `careerforge-resume-api-free` |
| Repository / branch | `DocHarry22/resume-parser` / `codex/career-platform-upgrade` |
| Dockerfile / context | `deploy/Dockerfile.free` / repository root |
| Compute / region | Render `free`, 0.1 CPU, 512 MB RAM, Frankfurt |
| Port / health | `0.0.0.0:8000`; explicit HTTPS `/api/health` verification; provider TCP startup check |
| Document storage | `STORAGE_MODE=local`; browser documents, no server records |
| Server storage | No persistent disk, Supabase or other external database |
| Temporary path / taxonomies | `/tmp/resume-parser` / `/app/data` |
| NLP model | `en_core_web_sm` 3.7.1, pinned download and checksum in Dockerfile |
| File / extracted text limits | 2 MB / 60,000 characters |
| PDF / expanded DOCX limits | 20 pages / 8 MB |
| Simultaneous processing | 1 request |
| Export structure | At most 2,000 scalar/container nodes |
| Upload body deadline | 30 seconds for the complete request body |
| Numerical-library threads | `OMP_NUM_THREADS`, `OPENBLAS_NUM_THREADS`, `MKL_NUM_THREADS`, `NUMEXPR_NUM_THREADS`: each `1` |
| Logging | WARNING; avoid informational upload-filename logs |
| CORS | Only `https://resume.docheng.co.za` |
| Cookie settings | Secure, SameSite=Lax; no guest-cookie bootstrap needed in local mode |
| Automatic deploys / previews | Off |
| AI | No provider key or paid model configured |

The free Dockerfile is a standalone, reviewable file because the connected Render creation tool cannot pass Docker build arguments. It matches the primary Dockerfile except for the default small-model argument; the backend CI checks this equivalence and builds that exact file. The ordinary medium-model image remains available for the existing guest-workspace profile. The small model saves memory but has no static word vectors; matching results must be labelled and tested for that difference rather than claiming identical semantic quality.

Service ID: `srv-db8jiqe7bikc739aca2g`. Initial deployment `dep-db8jiqu7bikc739acc7g` used source `93d0f41`. The current verified native deployment is `dep-db8jpheq1p3s738vlu9g`, source `368088a3313a8263d8a94f1dbfa31c59ed24a011`, live since 20:52 UTC. The connected creation tool has no HTTP health-check-path field, so the actual provider setting is empty and uses its default TCP check. This difference from the proposed `/api/health` setting is recorded explicitly; successful provider startup alone is not functional verification.

## Cost and availability

Render advertises the free compute plan at **US$0/month**, with 512 MB RAM and 0.1 CPU. A free web service has no persistent disk, sleeps after 15 minutes without incoming traffic, and can take about a minute to wake. Its filesystem can disappear on sleep, restart or redeployment; that is why this profile retains documents in the browser. The workspace receives 750 shared free-instance hours each month, after which free services are suspended until the following month. These are hobby limits, not an uptime guarantee. [Official compute plans](https://render.com/docs/compute-plans), [free-service limits](https://render.com/docs/free).

**The free compute plan has no fixed monthly compute fee; it does not guarantee zero usage charges.** Render documents supplementary bandwidth and build charges when a payment method exists; without one it instead suspends free services or disables builds at those limits. This proposal selects only the free service and does not authorize a paid upgrade, disk, database or AI subscription. Workspace billing settings have not been inspected or changed, and existing unrelated Node services remain untouched. These documented usage conditions are not an additional approval requirement. [Render usage and billing limits](https://render.com/docs/free).

No artificial keep-alive traffic is proposed. Cold starts, quota exhaustion or unavailable processing must produce a clear retry/unavailable message while preserving browser documents. Local editing and supported browser downloads should continue to work independently.

## Verification and remaining deployment work

The [free-proposal validation record](qa/render-free-proposal-validation.json) separates configuration checks, the tested Linux container and browser behavior, and work that is not yet deployed. Schema validation and the actual application settings parser pass for this proposal. No account billing settings have been inspected or changed; this record does not promise zero usage charges.

The [Linux low-memory CI evidence](qa/low-memory-ci-verification.json) passed on source `af8b3caf8d920d885d1985a1decbb0247120e3f1`, [run 38801198972](https://github.com/DocHarry22/resume-parser/actions/runs/38801198972). The container had a 512 MiB hard memory limit, no additional swap and 0.1 CPU. Its observed peak was **310.9 MiB**, with no OOM kill and no saved private data files. It loaded the real small model, parsed/scored a typical resume, and retained the final marker from a 55,000-character document across genuine PDF, editable DOCX, TXT and JSON exports. This is synthetic test evidence, not an actual Render deployment or a guarantee for every possible document.

The [browser-local checks](qa/local-mode/results.json) passed all eight groups on the working source: reload persistence, current-content exports, independent imports and letters, processing outages, separate browser profiles, the legacy builder redirect, privacy export/deletion, and absence of workspace cookies, saved-record API calls and page errors. Backend review added a job-description bound, scalar/container-node export limits, a complete-upload deadline, offloading of local processing and incremental PDF text limits. All five checks passed on the current application revision `368088a`: backend **181 passed / 4 skipped**, frontend **24 tests** plus career checks and **6 static-tooling tests**, browser, default container and small-model Linux memory check. The latter observed a **314.8 MiB** cgroup peak with the same 512 MiB/no-extra-swap/0.1 CPU constraints. [Exact revision and evidence](qa/release-368088a-ci.json).

The [final actual HTTPS probe](qa/render-free-live-api.json) **passed all 18 checks across 17 requests** on deployed source `368088a`. Parsing, scoring and combined-analysis successes and validation errors explicitly prevent caching; import and all four current-content exports do too. Exact canonical CORS/preflight, untrusted-origin rejection, disabled saved-record reads and absence of cookies passed. PDF text is selectable, DOCX paragraphs editable, and all formats retained the current Unicode name and unique marker. This is separate from the container benchmark and does not inspect the live filesystem or establish public-frontend acceptance. The [initial probe](qa/render-free-initial-live-api.json) preserves the missing-header failure on `93d0f41` that prompted the repair.

Keep the separate Sites edition's existing API guard. Hostinger deployment still requires a real verified backup first. The free service provides no account storage and no cloud document backups.

## Connecting the existing website later

Backend creation does not itself connect the canonical website. In this stateless profile, API calls use `credentials: 'omit'`: no session cookie or server record is needed. The existing Hostinger static frontend can therefore call the verified Render HTTPS API URL directly with exact CORS. A new API subdomain, DNS change or Node proxy is not required for this profile.

The primary static frontend has been built from frontend source `194f9e8` (backend inputs unchanged from deployed `368088a`) with `STATIC_EXPORT=1`, `NEXT_PUBLIC_STORAGE_MODE=local`, and `NEXT_PUBLIC_API_BASE_URL=https://careerforge-resume-api-free.onrender.com`. `NEXT_PUBLIC_SITE_MODE` is unset. The isolated build passed compilation, lint/typecheck and static generation; independent ZIP/dist/manifest checks passed. [Artifact record](qa/hostinger-static-artifact.json). All seven browser groups passed against the live API using local artifact files at a simulated canonical origin: four processing calls, 275 locally marked responses, correct BASIC scanner rendering, local reload/letters, current exports and five mobile layouts. Both downloaded PDFs passed independent content checks. These are not actual Hostinger deployment results. After cutover, repeat the real-domain asset, CORS, import, analysis, download and local-save checks. No Hostinger files have been changed.

The private Sites build keeps its separate `NEXT_PUBLIC_SITE_MODE=1` guard, which blocks server operations. Do not change its API URL or connect it to the new backend as a side effect.

Follow the [backup runbook](BACKUP_RUNBOOK.md) before replacing the current Hostinger files. No actual server backup has yet been created or verified for this release. Browser document backups remain the user's private files; this stateless proposal supplies no cloud document backup.

## Declined paid proposal: reference only

The unchanged paid configuration is archived at [deploy/render.paid-proposal.yaml](../deploy/render.paid-proposal.yaml), with its [original validation record](qa/render-candidate-validation.json). It proposed 1 CPU / 2 GB RAM and a 1 GB disk, an estimated US$25.25/month before taxes and usage. **The user declined it; it must not be activated.** There is no root `render.yaml`, active deployment shortcut, new paid resource, or approval to change the two existing Node services.
