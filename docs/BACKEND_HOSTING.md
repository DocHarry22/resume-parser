# Free backend proposal — not deployed

Updated 15 October 2026. **The user declined the US$25.25/month paid proposal and does not want Supabase. No new backend, disk, database, paid AI service, DNS change or production cutover has been created.** The canonical website remains `https://resume.docheng.co.za`.

## Proposed experience

Resumes, cover letters and job tracking save in the user's browser. The Python service processes an uploaded document, checks resume text or produces a requested download, then returns the result. This profile must not keep a server document library or promise cloud synchronization. Clearing browser data or moving to another device can lose local documents; download private JSON backups regularly.

The reviewed draft is [deploy/render.free-proposal.yaml](../deploy/render.free-proposal.yaml). It is **not active** and is deliberately outside the root `render.yaml` path. The free Linux container and local browser checks passed; the latest defensive-limit changes are undergoing their final regression and CI checks. The private Sites edition remains independent and must not start calling this service.

## Proposed free configuration

| Setting | Proposal |
| --- | --- |
| Workspace | My Workspace (`tea-cspuvgrtq21c739a8r9g`) |
| New service only | `careerforge-resume-api-free` |
| Repository / branch | `DocHarry22/resume-parser` / `codex/career-platform-upgrade` |
| Dockerfile / context | `deploy/Dockerfile.free` / repository root |
| Compute / region | Render `free`, 0.1 CPU, 512 MB RAM, Frankfurt |
| Port / health | `0.0.0.0:8000` / `/api/health` |
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

## Cost and availability

Render advertises the free compute plan at **US$0/month**, with 512 MB RAM and 0.1 CPU. A free web service has no persistent disk, sleeps after 15 minutes without incoming traffic, and can take about a minute to wake. Its filesystem can disappear on sleep, restart or redeployment; that is why this profile retains documents in the browser. The workspace receives 750 shared free-instance hours each month, after which free services are suspended until the following month. These are hobby limits, not an uptime guarantee. [Official compute plans](https://render.com/docs/compute-plans), [free-service limits](https://render.com/docs/free).

**The free compute plan has no fixed monthly compute fee; it does not guarantee zero usage charges.** Render documents supplementary bandwidth and build charges when a payment method exists; without one it instead suspends free services or disables builds at those limits. This proposal selects only the free service and does not authorize a paid upgrade, disk, database or AI subscription. Workspace billing settings have not been inspected or changed, and existing unrelated Node services remain untouched. These documented usage conditions are not an additional approval requirement; creation follows verification of the free runtime profile. [Render usage and billing limits](https://render.com/docs/free).

No artificial keep-alive traffic is proposed. Cold starts, quota exhaustion or unavailable processing must produce a clear retry/unavailable message while preserving browser documents. Local editing and supported browser downloads should continue to work independently.

## Verification and remaining deployment work

The [free-proposal validation record](qa/render-free-proposal-validation.json) separates configuration checks, the tested Linux container and browser behavior, and work that is not yet deployed. Schema validation and the actual application settings parser pass for this proposal. No account billing settings have been inspected or changed; this record does not promise zero usage charges.

The [Linux low-memory CI evidence](qa/low-memory-ci-verification.json) passed on source `af8b3caf8d920d885d1985a1decbb0247120e3f1`, [run 38801198972](https://github.com/DocHarry22/resume-parser/actions/runs/38801198972). The container had a 512 MiB hard memory limit, no additional swap and 0.1 CPU. Its observed peak was **310.9 MiB**, with no OOM kill and no saved private data files. It loaded the real small model, parsed/scored a typical resume, and retained the final marker from a 55,000-character document across genuine PDF, editable DOCX, TXT and JSON exports. This is synthetic test evidence, not an actual Render deployment or a guarantee for every possible document.

The [browser-local checks](qa/local-mode/results.json) passed all eight groups on the working source: reload persistence, current-content exports, independent imports and letters, processing outages, separate browser profiles, the legacy builder redirect, privacy export/deletion, and absence of workspace cookies, saved-record API calls and page errors. The newer backend review fixes add a job-description bound, scalar/container-node export limits, a complete-upload deadline, offloading of local processing and incremental PDF text limits; the exact numeric-list and job-description reproductions now reject safely, and a lightweight timeout probe confirmed HTTP 408 followed by a successful next request. The final full regression and CI run for those changes is tracked separately by the release work.

1. Complete the final regression/CI checks for the reviewed defensive-limit changes and record their exact source revision. Keep the earlier Linux and browser evidence tied to the versions actually tested.
2. The connected Render tool can then create exactly the new service on `plan: free`, using the reviewed Dockerfile path and environment. Keep automatic deploys and previews off. No disk, external database, paid AI, paid upgrade, existing-service modification, or billing-policy change is part of this proposal. No creation has happened.
3. After creation, verify the actual deployed commit, small-model health response, request limits, processing/export results, absent cookies, no saved records and safe unavailable-service behavior on the real HTTPS URL before connecting the primary website.
4. Keep the separate Sites edition's existing API guard. Hostinger deployment still requires a real verified backup first.

## Connecting the existing website later

Backend creation would not itself connect the canonical website. In this stateless profile, API calls use `credentials: 'omit'`: no session cookie or server record is needed. The existing Hostinger static frontend can therefore call the verified Render HTTPS API URL directly with exact CORS. A new API subdomain, DNS change or Node proxy is not required for this profile.

Build the primary static frontend with `STATIC_EXPORT=1`, `NEXT_PUBLIC_STORAGE_MODE=local`, and `NEXT_PUBLIC_API_BASE_URL` set to the **actual verified Render HTTPS URL**. Leave `NEXT_PUBLIC_SITE_MODE` unset. Test the deployed API's health, allowed-origin CORS, imports, scoring and downloads from `https://resume.docheng.co.za`; confirm requests omit credentials, no response sets a guest cookie, no workspace initialization occurs, and document responses are not cached. No API URL is invented here and no Hostinger files have been changed.

The private Sites build keeps its separate `NEXT_PUBLIC_SITE_MODE=1` guard, which blocks server operations. Do not change its API URL or connect it to the new backend as a side effect.

Follow the [backup runbook](BACKUP_RUNBOOK.md) before replacing the current Hostinger files. No actual server backup has yet been created or verified for this release. Browser document backups remain the user's private files; this stateless proposal supplies no cloud document backup.

## Declined paid proposal: reference only

The unchanged paid configuration is archived at [deploy/render.paid-proposal.yaml](../deploy/render.paid-proposal.yaml), with its [original validation record](qa/render-candidate-validation.json). It proposed 1 CPU / 2 GB RAM and a 1 GB disk, an estimated US$25.25/month before taxes and usage. **The user declined it; it must not be activated.** There is no root `render.yaml`, active deployment shortcut, new paid resource, or approval to change the two existing Node services.
