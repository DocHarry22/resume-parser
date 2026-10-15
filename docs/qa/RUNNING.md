# Run the local checks

Run these commands from the repository root. Browser checks use synthetic records in a fresh, nonpersistent browser context. Point them at a local API with a dedicated data directory: do not use a production URL or an unrelated service already listening on the chosen port. Successful cover-letter tests leave synthetic documents in that local test workspace; screenshots and downloads overwrite the corresponding files in `docs/qa/`.

## Prerequisites

Use a supported Node.js 22 or 24 release, npm, and Python 3.12. The commands below use Windows PowerShell. If the project dependencies are already installed, skip their installation commands.

```powershell
npm --prefix frontend ci
Push-Location frontend
npx playwright install chromium
Pop-Location

py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pip install "https://github.com/explosion/spacy-models/releases/download/en_core_web_md-3.7.1/en_core_web_md-3.7.1-py3-none-any.whl#sha256=6a0f857a2b4d219c6fa17d455f82430b365bf53171a2d919b9376e5dc9be032e"
```

The browser scripts resolve the project's pinned Playwright package from `frontend/node_modules` first. The original Codex bundled runtime is a fallback for the development workstation. `PLAYWRIGHT_MODULE` can explicitly select another installed Playwright module. The default browser channel is Microsoft Edge (`msedge`); set `PLAYWRIGHT_CHANNEL=chromium` to use the browser installed above.

## Start isolated local services

In one terminal, start this project's API on a verified free port. The separate taxonomy directory keeps parsing resources available while document data stays in the QA fixture directory.

```powershell
$env:DATA_DIR = Join-Path (Get-Location) '.runtime/qa-data'
$env:TAXONOMY_DIR = Join-Path (Get-Location) 'data'
$env:COOKIE_SECURE = 'false'
$env:WORKSPACE_SECRET = 'local-qa-fixture-only-change-before-deployment-2026'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

The insecure-cookie setting and example signing key are only for this disposable HTTP fixture. Use deployment configuration and a private signing key for hosted environments.

In a second terminal, start the frontend with its API proxy pointed at that fixture:

```powershell
$env:API_PROXY_TARGET = 'http://127.0.0.1:8001'
node frontend/node_modules/next/dist/bin/next dev frontend --hostname 127.0.0.1 --port 3000
```

Wait until both services are ready. `GET http://127.0.0.1:8001/api/health` should identify the resume API. The preview uses the same-origin `/api` proxy, so saved-document cookies stay in the test browser workspace.

## Run browser checks

In a third terminal:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chromium'
$env:BASE_URL = 'http://127.0.0.1:3000'
node scripts/site-smoke.cjs
node docs/qa/career-e2e.cjs
node docs/qa/career-errors.cjs
$env:EDITOR_URL = $env:BASE_URL + '/builder?new=1'
node frontend/tests/editor-e2e.cjs
```

`BASE_URL` defaults to `http://localhost:3000`. The editor suite uses its existing `EDITOR_URL` setting. The site suite checks public routes and template filtering; the career suite checks dashboard, job CRUD/backup, cover-letter CRUD, and actual downloads. The error suite simulates API failures and browser-storage limits without writing to the server. The editor suite checks resume editing, persistence, import, exports, and multipage printing. Viewport screenshots and JSON results are written to `docs/qa/`.

## Run type and unit checks

```powershell
npm --prefix frontend run check
npm --prefix frontend test
node --test frontend/tests/local-export.test.cjs
.\.venv\Scripts\python.exe -m pytest tests -q -ra --basetemp=.runtime/pytest-qa
```

The backend suite manages its own temporary fixtures. Browser tests do not establish production deployment, configured-provider AI success, or authenticated account synchronization.

## Repeat the public reference capture

This separate script observes the fixed public Resume.io reference URLs and the original application domain. It does not log in, submit forms, purchase, or bypass access restrictions. Public-network access is required. Access-denied responses are recorded as access-denied evidence, not as a usable editor reference.

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chromium'
node scripts/research-public.cjs
```

Optionally set `REFERENCE_APP_URL` to change the application comparison URL; its default is `https://resume.docheng.co.za/`. The Resume.io source URLs stay unchanged. Research screenshots and observations are written to `docs/rea-resume-io/evidence/`, separate from product acceptance evidence.

## Check an exported Sites build

With a preserved static export at `sites/careerforge/dist`, start a separate local static server:

```powershell
$siteRoot = Join-Path (Get-Location) 'sites/careerforge/dist'
python -m http.server 4173 --bind 127.0.0.1 --directory $siteRoot
```

In another terminal:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chromium'
$env:SITES_BASE_URL = 'http://127.0.0.1:4173'
node scripts/sites-smoke.cjs
```

This suite checks local editing/persistence/downloads, print availability, route access and responsive layouts. It confirms that the static edition does not issue backend API network requests. Server-only operations intentionally show a primary-app notice; do not point this suite at a production document service. Results, screenshots, and downloads are saved in `docs/qa/`. See [Sites verification](sites-report.md) for the completed run and its limits.

If the host's configured temporary directory is missing, create a local test directory and set process-local `TEMP`/`TMP` before launching the browser:

```powershell
$env:TEMP = Join-Path (Get-Location) '.runtime/playwright-temp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Path $env:TEMP -Force | Out-Null
```

## Reports and evidence sources

- [Career workspace QA](career-report.md): `career-e2e-results.json`, `career-error-results.json`, breakpoint screenshots, backup and actual cover-letter downloads.
- [Resume editor QA](editor-report.md): `editor-e2e-results.json`, imported fixture/backup, document downloads, and multipage print evidence.
- [Backend verification](backend-report.md): regression results, request/storage boundaries, deployment and document-export limitations.
- `independent-export-verification.json`: separate parsing of the PDF text/pages and editable Word files.
- `site-smoke-results.json`: public-route and responsive-layout checks.
- [Research and access boundaries](../rea-resume-io/README.md): source URLs, methods, observed access restrictions, and dated reference evidence.

The dated reports describe completed runs. Re-running scripts replaces machine-generated evidence; it does not automatically update the narrative reports or their historical claims.
