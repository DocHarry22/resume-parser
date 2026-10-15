# Backend audit and verification — 15 October 2026

Scope: the existing FastAPI application from the verified GitHub repository, repaired in the clean mission working clone. The original OneDrive checkout could list files but stalled reading source and Git objects; it was preserved. This report does not claim that production or a database service was deployed.

## Initial findings

| Area | Finding before repair |
|---|---|
| Parsing/scoring | Existing PyMuPDF, python-docx, spaCy and scoring modules were present and reused. |
| CORS | Wildcard origin with credentials enabled. |
| Resume access | All callers shared a singleton cache and unowned JSON directory; list/read/update/delete had no owner isolation. |
| Cover letters | Global in-memory dictionary, no persistence or user isolation. |
| Resume saving | Explicit save was required; create/import/update/section edits could disappear after restart. |
| Nested updates | PATCH converted experience, skills, summary and other nested values into plain dictionaries; later export/analysis expected model attributes. |
| Import | Whole-file read preceded size checking; extension-only validation; unsupported legacy DOC advertised; TXT missing. Partial imports could fail or insert an invented email address. |
| Export | Resume backend offered text only; existing cover PDF/DOCX engines were present. PDF markup and download filenames accepted raw user content. |
| Analysis | Certification conversion referenced nonexistent cert.date instead of issue_date; HTTP client errors could become generic 500 responses. |
| Writing | Cover draft templates inserted fabricated 5+ years and unsupported accomplishments, and treated job keywords as experience. Placeholder summary fixes were automatically applicable. |
| Runtime | Original Pydantic 2.5 could not import the spaCy stack under Python 3.12.14 because of a ForwardRef API change. NLP startup attempted an uncontrolled runtime package download using a different python executable. Retired pdf_reader_old.py was syntactically invalid. |
| Dependencies | Initial installed-environment audit reported 47 advisory entries across six packages; some advisory IDs appeared more than once. Affected packages included FastAPI, Starlette, AnyIO, multipart, pytest and pip. |

A complete original test baseline under this runtime was blocked by the validation dependency mismatch. The historical “15 of 24” result is not a current verification result.

## Implemented and verified

- Signed, HttpOnly guest workspace cookie. A browser receives its own unpredictable workspace; resume and cover-letter files are scoped to that workspace. A different browser cannot list, read, update, export or delete its documents by guessing IDs.
- Exact configurable credentialed CORS origins; origin validation on cookie-backed mutations; Secure cookies by default. SameSite=None requires Secure. Private responses use Cache-Control: no-store.
- Atomic automatic persistence for resume creation, import, PATCH and section operations. Nested models are revalidated after updates. Rejected updates preserve previously saved data. Short Windows file-lock interruptions are retried before reporting save failure.
- Durable cover letters with typed nested updates, duplication, actual linked-resume prefill and deletion.
- Safe document IDs with path traversal and symlink checks. Imported IDs/timestamps cannot replace server-assigned metadata.
- Bounded actual HTTP body buffering, including chunked requests without Content-Length: 1MB for editor JSON and upload limit plus 1MB multipart allowance for known import/scan endpoints.
- Upload bytes read in bounded chunks; 25MB default file limit; PDF signature validation; PDF maximum 100 pages; DOCX package structure, entry count, decompressed size, encryption and compression-ratio checks; UTF-8 TXT support; 250,000-character extraction cap. Legacy binary DOC is rejected.
- Saved document maximum 1MB; workspace total 20MB; maximum 100 documents per document type. In-process rate limiting defaults to 60 mutations/minute/IP and 10 writing requests/minute/IP. Rate buckets are capped at 10,000 IP/group keys.
- Resume PDF export uses selectable text and pagination, DOCX remains editable, and TXT/JSON backups are available. Optional/custom sections are included. A4 and US Letter are supported for resume exports. PDF exports reject unsupported font characters rather than silently dropping them.
- Cover-letter PDF export escapes user text before ReportLab parsing. Download filenames remove control characters and use a UTF-8 filename parameter. Unsaved editor content can be exported directly.
- Guided writing drafts now use supplied facts and explicitly identify their source. Placeholder auto-summary suggestions require manual review.
- Optional server-side writing provider: HTTPS configured base URL, server-only key and explicit model, consent, connection/request timeout, no redirects, bounded output and rejection of newly introduced numeric metrics. It returns a before/after suggestion for manual acceptance, not a silent document update.
- Model installation is a deployment step; application startup does not download packages. The old PDF reader import delegates to the maintained reader.

### API additions

| Endpoint | Contract |
|---|---|
| POST /api/builder/export/{pdf,docx,txt,json} | ResumeBuilder JSON body; optional page_size=A4 or Letter. |
| GET /api/builder/{id}/export/{pdf,docx,txt,json} | Export a document in the current guest workspace. Existing text endpoint remains compatible. |
| POST /api/cover-letters/export-data?format=pdf | Current CoverLetter JSON body; pdf, docx and txt accepted. |
| GET /api/workspace | Guest mode, counts and access notice. |
| GET /api/workspace/export | JSON export of all current guest documents. |
| DELETE /api/workspace | Delete current guest documents and expire the workspace cookie. |
| GET /api/ai/status | Configuration/consent status, never credentials. |
| POST /api/ai/rewrite | text, action, optional factual context, consent:true; returns before/after and review notice. |
| POST /api/cover-letters/ai/generate | Guided drafts by default; use_ai:true explicitly requests the configured provider. Response provider identifies guided versus configured_ai. |

The writing provider follows the official [Chat Completions API contract](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create). No provider key or model was configured; live paid generation has not been tested or enabled. Mocked provider success, consent errors, absent configuration and unsupported metrics were tested.

## Automated verification

**Final full suite after container/taxonomy changes: 147 passed, 4 skipped, 6 warnings in 25.72 seconds.**

Command (from the working clone):

```text
.backend-venv/Scripts/python.exe -m pytest tests -q -ra --basetemp=.runtime/pytest-final-container-config
```

A focused builder/auto-fix/security run also passed (48 tests before the two new write-lock regressions were appended). One intermediate run encountered a transient OneDrive/Windows save error; bounded atomic-replace retries and tests for transient/permanent write locks were added. The final full suite above includes both regressions and passes. No failed requirement was hidden by marking it skipped.

Four pre-existing PDF layout tests remain explicitly skipped because their fixtures do not exist:

1. Multi-column test PDF.
2. PDF with headers and footers.
3. PDF with page numbers.
4. PDF with known layout.

Six warnings come from dependencies: five spaCy/Typer/Weasel uses of deprecated Click APIs, and Starlette's TestClient httpx deprecation. There are no remaining application datetime deprecation warnings.

Regression coverage includes independent browser-cookie ownership checks, unowned legacy-file isolation, restart-style reload, nested updates, atomic write failures, guest data export/deletion, markup/header handling, selectable multipage PDF, editable DOCX, custom section preservation, unsafe DOCX archives, TXT import, oversized chunked requests, origin checks, throttling, storage quotas and writing-provider safeguards.

Additional checks:

- Python compilation of app: PASS.
- pip check: no broken requirements.
- Post-update pip-audit: 87 installed dependencies checked, zero reported advisory entries. This checks known advisories, not all possible vulnerabilities.
- Local API started at http://127.0.0.1:8001 and /api/health returned {"status":"healthy"}. Port 8000 belonged to an unrelated service and was preserved.
- Browser and downloaded-file checks are reported separately by the frontend QA agents.

### Tested pinned dependencies

| Package | Version |
|---|---|
| Python | 3.12.14 |
| FastAPI / Starlette | 0.143.1 / 1.8.0 |
| Uvicorn | 0.54.0 |
| Pydantic / settings | 2.14.1 / 2.16.0 |
| python-multipart / AnyIO | 0.0.32 / 4.15.1 |
| spaCy / English model | 3.7.2 / en_core_web_md 3.7.1 |
| PyMuPDF / python-docx | 1.28.2 / 1.1.0 |
| ReportLab | 4.5.1 |
| httpx | 0.28.1 |
| pytest / pytest-asyncio | 9.1.1 / 1.4.0 |

requirements.txt pins the tested direct packages and security-sensitive transitive HTTP dependencies. The NLP model must be installed separately.

## Guest security model and remaining limitations

Guest access is not registration, email verification, password reset or cross-device account access. The signed browser cookie is a bearer credential. Anyone who obtains it can access that guest workspace. It expires after 365 days; deleting it, rotating the signing key or losing the browser profile loses guest access. There is no account recovery mechanism. SameSite and Origin checks restrict browser-origin abuse; a valid stolen cookie still grants access.

No per-user account identity, PostgreSQL/Supabase integration, database row-level security, team permissions, paid usage credits or full version history were added. Filesystem owner isolation supplies guest document boundaries only. Do not describe this implementation as the completed persistent account system.

Local JSON writes are atomic but provide last-writer-wins editing rather than transactional multi-device conflict resolution. Use one backend instance and a durable private volume. A database plus authenticated ownership and audited migration is still needed before scaling to independent replicas.

Old data/resumes documents were not assigned to arbitrary new visitors. They remain untouched and inaccessible through guest API routes. Migration requires a backup, verified owner assignment and deliberate import into the correct authenticated/guest scope. Do not copy all old files into a shared public workspace.

The cookie secret is loaded from WORKSPACE_SECRET or generated in DATA_DIR/.workspace-key. That key and workspace files are excluded from Git. A short/incomplete signing key fails closed. Back up the private key and documents securely; retain neither in public frontend assets. Automatic deletion of abandoned/expired workspaces and backup retention are not implemented and require an explicit retention policy.

Rate limiting is bounded in-process protection, not a distributed abuse service. Reverse proxies must provide request, timeout and connection limits, trusted client-IP forwarding, and global storage/AI-cost controls. Guest storage quotas do not prevent a distributed attacker creating many guest workspaces. Before exposing a paid writing key publicly, complete authenticated entitlements/credits and provider budget limits. Numeric safeguards and prompts do not guarantee factual accuracy; suggestions require human review.

Scanned-image OCR is not implemented. Complex multi-column ordering remains best effort. General Unicode coverage depends on installed fonts; resume PDF export reports unsupported characters. Existing cover PDFs retain their simpler built-in font and Letter layout. Server exports preserve content but do not reproduce all frontend template, typography, color or rich-text choices.

## Production requirements

1. Use HTTPS at the frontend and API/proxy. Keep COOKIE_SECURE=true; use false only for local HTTP QA.
2. Set exact CORS_ORIGINS for the canonical frontend and any explicitly authorized Sites origin. Use a same-origin API proxy where possible. Browser third-party cookie policies can restrict a cross-site Sites frontend.
3. Persist DATA_DIR on a private durable volume; protect it from static hosting and public downloads. Configure a stable random WORKSPACE_SECRET of at least 32 characters or persist the generated key on that volume.
4. Install requirements.txt and en_core_web_md 3.7.1 during the build. Startup intentionally fails if the configured NLP model is unavailable.
5. Run one backend instance while using this local persistence model. Add private backups, tested restore and retention procedures.
6. Keep AI_API_KEY server-only. AI_BASE_URL must be HTTPS and AI_MODEL explicit. No key is placed in NEXT_PUBLIC variables. No paid provider was activated during this mission.
7. Back up production configuration and documents, verify ownership migration, run staging/browser checks, then deploy through the verified hosting mechanism. This report is preparation evidence, not production verification.

## Prepared container runbook (not executed here)

The backend Dockerfile now uses Python 3.12, installs the tested dependencies and checksum-pinned en_core_web_md 3.7.1 model at build time, and runs as UID 10001. Immutable taxonomies remain in /app/data through TAXONOMY_DIR; private guest documents and the signing key use /var/lib/resume-parser. The default non-container taxonomy lookup remains DATA_DIR for compatibility.

The build context is an allowlist. Only app source, requirements and the two public taxonomy JSON files enter the backend image. Local .env files, signing keys, private resumes, frontend bundles and virtual environments stay outside it. Compose supplies a named resume-data volume, a read-only root filesystem, a writable bounded /tmp, dropped capabilities, resource bounds and a Python health check. The API binds to host loopback by default.

Docker is not installed in this execution environment. YAML parsing and source/config review passed; container build/start, Linux native-library loading and volume ownership must still be checked on a Docker-capable staging host.

Prepare private environment values on that host using .env.example. Keep COOKIE_SECURE=true, set exact production CORS_ORIGINS and a stable random WORKSPACE_SECRET, and leave paid AI variables unset unless the service is authorized and account/credit protections are ready. API_PORT defaults to 8000; change it if the host already uses that port. Do not replace a production data location with a new empty volume without a verified backup and ownership migration plan.

```sh
docker compose config --quiet
docker compose build resume-parser-api
docker compose up -d resume-parser-api
docker compose ps
docker compose exec -T resume-parser-api python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=5).read().decode())"
```

These are run instructions, not evidence that the commands ran here. Do not use docker compose down -v on a volume containing real documents. Back up and restore the named volume and signing key together using the host's private backup procedure.

Configure the Next.js API_PROXY_TARGET to the reachable verified backend. A Next process on the same host can use http://127.0.0.1:<API_PORT>; a frontend in another container needs its service-network address, and a frontend on another hosting provider needs the authorized backend HTTPS origin. Loopback always refers to the machine/container running Next.js. Keep NEXT_PUBLIC_API_BASE_URL empty when using the same-origin proxy.

For local Windows development only:

```powershell
$env:COOKIE_SECURE='false'
$env:PYTHONIOENCODING='utf-8'
.backend-venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Set the local Next.js API_PROXY_TARGET to http://127.0.0.1:8001 before building/starting it. Production uses HTTPS and secure cookies.

## Independent browser-download verification

The backend reviewer independently opened the browser-generated evidence with PyMuPDF and python-docx. Results are recorded in independent-export-verification.json:

- editor-export.pdf: one Letter page, 297 selectable characters, candidate and licence content present.
- editor-export.docx: six editable paragraphs; local-editor-export.docx: eleven editable paragraphs; both could be edited and resaved.
- editor-print-design.pdf: five nonblank pages, 10,003 selectable characters and the final multipage content sentinel preserved.
- cover-current.pdf: one Letter page, 332 selectable characters, exact Zoë Naïdø and UNSAVED EXPORT MARKER preserved.
- cover-current.docx: eighteen editable paragraphs, exact Unicode name and unsaved content marker retained; editing/resaving succeeded.

## Guest first-use concurrency follow-up

The final frontend helper now establishes the HttpOnly guest cookie with one shared raw GET /api/workspace before dispatching protected builder, cover-letter, workspace or writing requests. Initial list/template/status GETs also wait, so their Set-Cookie responses cannot replace a workspace created by a simultaneous save. Failed bootstrap HTTP/network requests permit retry. Successful workspace deletion resets the bootstrap because the server expires its cookie. Static Sites returns its unsupported-operation response before any network or lock operation.

Where available, same-origin tabs coordinate first use using Web Locks; each tab checks the workspace under the shared lock before sending its protected calls. Browsers without Web Locks are protected within an individual tab but simultaneous first use across tabs is not guaranteed. After deleting the workspace or manually clearing cookies, reload other already-open tabs before further server saves. Non-frontend API clients should establish and retain their workspace cookie before sending concurrent document operations.

Seven new API-helper regressions simulate a shared browser cookie jar, delayed Set-Cookie responses, simultaneous lists/saves, independent tabs, HTTP/network failures, deletion, Sites isolation and unchanged request bodies/options. All seven pass; the combined frontend Node suite has twelve passing tests plus the existing career/DOCX checks. The backend authorization/session model is unchanged by this client fix.
