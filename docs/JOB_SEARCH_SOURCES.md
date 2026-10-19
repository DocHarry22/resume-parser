# More job sources and saved searches

19 October 2026. Local implementation in `.mission-work`, on `/jobs`.

Job Search now defaults to **All public feeds**, combining Jobicy, Arbeitnow and Remotive. Sources can also be selected separately. Each listing retains its source URL and attribution, and can be saved to the existing tracker without duplicating the same URL or changing an existing job's notes, documents or stage. Public-feed links open the source listing; Auto Apply still requires a direct Greenhouse or Lever posting.

| Source | Loaded selection | Cache |
| --- | --- | --- |
| Jobicy | Up to 200 jobs from its recent remote feed, with its documented three-hour publishing delay | One hour |
| Arbeitnow | First public page, primarily European/German jobs | One hour |
| Remotive | Limited public remote selection, delayed 24 hours | Six hours |
| Greenhouse / Lever | The selected company board or direct posting | 15 minutes |

Filters match the loaded selection. A remote flag alone does not imply worldwide eligibility. Results from available feeds remain visible if another feed fails, with the failed source identified. All-feed failure is explicit. The UI shows at most 100 matches and explains how to narrow results. It does not claim to load the entire job market or follow every provider's pagination.

**Search other sites** builds links to LinkedIn, Indeed South Africa, Pnet, Careerjet South Africa and Google Jobs using the current keywords and location. These open a separate tab; results are displayed by the destination site. Job type and other filters must be selected there. A role found elsewhere can be added through the existing tracker. These are search shortcuts, not scraped or API-integrated results.

**Saved searches** is the next added feature. Users can name, restore, rename by saving the same criteria under a new name, or remove up to 30 searches. A saved search retains source, company board, keywords, location, job type and worldwide inclusion. Restoring filters does not send a request: the user clicks Find jobs or chooses an external site. Searches persist on this device under `resume-studio.saved-job-searches.v1`; unreadable data and quota failures are reported and retained. Changes reread current storage so another tab's additions are preserved. Removal checks the displayed revision time.

No background alerts, email delivery, employer submission or live-site deployment are included in this increment.

## Source evidence

- [Jobicy official API documentation](https://jobicy.com/jobs-rss-feed): public JSON without a key, canonical source URLs, attribution, recent seven-day window and three-hour delay. Avoid polling more than once per hour.
- [Arbeitnow official API introduction](https://www.arbeitnow.com/blog/job-board-api): public keyless jobs in Europe; remote eligibility remains employer-specific.
- [Remotive official API](https://github.com/remotive-com/remote-jobs-api): limited public feed, attribution, delayed listings and infrequent requests.
- [LinkedIn search filters](https://www.linkedin.com/help/linkedin/answer/a507441) and [Pnet search example](https://www.pnet.co.za/jobs/chemical-engineer/in-south-africa).

Jobicy and Arbeitnow each returned HTTP 200 and browser access headers during read-only development probes. Their actual browser checks are recorded separately from fixture tests. No applicant details or documents are sent to search APIs. Requests omit credentials and referrers; external search links contain only the user's search words/location.

## Verification

`npm test` passed 81 tests plus existing career-workspace and DOCX checks. Six added tests cover source normalization and URL validation, partial/all failures, independent cache preservation during parallel requests, region restrictions, saved-search corruption/quota/capacity/concurrency, and literal external search URLs.

The production build/type checks passed for all 24 pages. Six [new browser checks](qa/job-search-sources/report.json) passed: aggregation, source caching, tracker saves, partial outages, saved-filter persistence and two tabs, failure preservation, external links, phone layout and actual public feed reads. Six [existing search-to-review browser checks](qa/job-search-apply/sources-regression.json) also passed against this build. No employer application was submitted.

Run `npm run test:job-sources` with `BASE_URL` pointing to the preview. The report and screenshots are in `docs/qa/job-search-sources/`. `npm run test:jobs` covers the existing search-to-review workflow.

For the new preview, set `NEXT_PUBLIC_STORAGE_MODE=local` and `NEXT_DIST_DIR=.next-search-sources` for both build and start. The verified build is served on the existing port 3103, retaining the user's browser storage origin.
