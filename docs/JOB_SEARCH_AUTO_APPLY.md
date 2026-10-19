# Job search and review-first Auto Apply

19 October 2026. Implemented in the active `.mission-work` frontend. The user selected **Greenhouse and Lever** and **stop for review before every final submission**. The latest local preview adds `/jobs` and `/auto-apply`, with sidebar/dashboard/tracker entry points.

## Job search

The follow-up [more sources and saved searches](JOB_SEARCH_SOURCES.md) increment adds Jobicy and Arbeitnow, search shortcuts for five other engines, and named saved filters. The original Remotive and employer-board behavior below remains available.

The remote-jobs view loads the public Remotive feed using a credential-free browser GET. Role/skill/company, location, worldwide inclusion and job-type filters then run locally over the returned listings. Each result credits and links to Remotive. Its public feed is a limited selection, delayed by 24 hours; the loaded catalog is cached for six hours in the tab rather than repeatedly fetched for each filter. Remotive listings link to the source; they do not imply a directly supported ATS application URL.

The company-board view accepts direct public Greenhouse and Lever board or job URLs. It derives only known HTTPS API endpoints, including Lever EU, strips tracking parameters from application URLs, converts provider HTML to plain text, and rejects credentials, custom ports and other hosts. Company-board catalogs are cached for 15 minutes. Responses are bounded to 8 MiB, requests time out, and provider failures retain saved user libraries. Filters describe the returned catalog, rather than claiming to search every employer or infer work eligibility.

Saving a listing rereads the tracker, deduplicates canonical posting URLs, and retains existing notes, document selections and stages. A supported listing can open Auto Apply with its saved opportunity selected. Other existing tracker entries can also enter Auto Apply after adding a direct supported URL.

## Preparing an application

Select the saved resume and optional cover letter, add the opportunity to the queue, check the name split and contact fields, and explicitly review the job and documents. The app generates real DOCX files locally from those selected documents. A browser-helper action fills the employer's form; a private JSON packet offers the same preparation when the workspace and helper run in different browsers. Packets expire after 30 minutes and contain only the selected application details/documents, rather than the full document library or version history.

Queue metadata lives inside the existing tracker record. Preparation and tracker changes therefore use one validated library write. The app rejects duplicate posting preparations across tracker IDs, progressed/applied jobs, missing documents, stale revisions, changed targets and edits that occur during document generation. Quota failures leave the stored application intact.

The phases are **queued**, **prepared**, **review on employer site**, and **submission confirmed**. Creating files, downloading a packet, opening a page or filling fields never sets Applied. The user must explicitly confirm that they submitted on the employer site; that action sets the application date and moves Saved to Applied while preserving later stages and the latest other job details.

## Browser helper

Download `/application-helper/careerforge-auto-apply.zip` from Auto Apply, extract it, open Chrome or Edge's Extensions page, enable Developer mode, and use **Load unpacked** on the extracted folder. The installed extension uses only the storage permission and content scripts restricted to the CareerForge preview/live origins and supported ATS hosts. No account, employer API token or paid service is needed for this hosted-form workflow.

Open the workspace in the same browser and check the connection. Alternatively, download a reviewed packet from the workspace and import it through the helper popup. The latter supports using the app's browser for preparation and Chrome/Edge for the hosted application.

The helper validates review-only packets, expiry, file signatures, URL identity and tab binding. It recognizes a supported application form before filling its common contact fields. It attaches matching DOCX/PDF files only to recognized resume/cover-letter inputs. It preserves existing answers, skips hidden non-file fields, passwords, radio buttons, checkboxes, selects, structured location controls and unknown questions. It never clicks submit or programmatically submits the form. A review note reports filled fields, attachments and remaining required questions. Unsupported/custom widgets still need the user's attention, as do PDF-only upload requirements.

Documents are held in extension session memory during a pending preparation, removed after filling reports back, when pending data is explicitly cleared, when its tab closes, or when the browser session ends. Expired packets cannot be filled. Status messages retain progress metadata without document bytes or contact details. Downloaded packet files remain under the user's own file management.

## Provider and platform evidence

- [Remotive public API and display/rate requirements](https://github.com/remotive-com/remote-jobs-api): source attribution, source links, 24-hour delay and infrequent catalog requests.
- [Greenhouse Job Board API](https://developers.greenhouse.io/job-board.html): public read endpoints; direct application POST requires an employer API key.
- [Lever Postings API](https://github.com/lever/postings-api): global/EU read endpoints, hosted apply links and employer-key requirements for direct POST. Browser access can depend on the provider's CORS behavior; a source failure is shown explicitly.
- [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) and [session storage](https://developer.chrome.com/docs/extensions/reference/api/storage): extension messaging, scoped page access and memory-only temporary storage.

No employer submission was made during development. Public-feed probes used GET only. Helper application tests used synthetic documents and controlled employer-form content; they verify the installed extension, not universal compatibility with every live customized form.

## Verification

- Production build/type validation passed for all 24 pages. A fresh output directory avoided a Windows EPERM in the previously used build directory.
- `npm test`: 75 tests plus career-workspace and genuine DOCX checks. Fifteen new tests cover provider parsing, HTML-to-text conversion, filters, credential-free caching, provider failures, deduplication, queue protection, real document packets, stale/invalid/quota paths, backup normalization, helper packet validation and explicit-only Applied transitions.
- Six [app browser groups](qa/job-search-apply/report.json) passed, including a real public Greenhouse read, source links, search/filter/save, packet DOCX content, explicit confirmation, two tabs, failure preservation, helper ZIP and 390 px layout.
- Four [installed-helper checks](qa/job-search-apply/helper-report.json) passed in a temporary Edge profile: Greenhouse and Lever form filling/file attachments, existing-answer preservation, remaining eligibility/consent questions, approved-origin bridge handshake, and no application submission.
- Eight [tracker regression checks](qa/job-search-apply/tracker-regression/report.json) passed, covering document links, stages, follow-ups, calendar, exports, recovery, concurrent edits and phone layouts.
- The final build also passed a [fresh 390 px layout and helper-download check](qa/job-search-apply/mobile-review.json).
- [Public feed probe](qa/job-search-apply/live-read.json) records the actual read-only check without storing full external job descriptions. Desktop and phone screenshots use synthetic records.

Run `npm run test:jobs` with `BASE_URL` set to the running local preview, and `npm run test:apply-helper` for the installed-extension fixtures. `node scripts/build-apply-helper.cjs` regenerates the ZIP; `npm run build` runs that packaging step automatically. The verified preview uses `NEXT_PUBLIC_STORAGE_MODE=local` and `NEXT_DIST_DIR=.next-jobs-release`. These increments have not been published to the live website.
