# Resume.io dashboard and application tracking research

Research date: 19 October 2026. Scope: the user-provided dashboard screenshot, public Resume.io product documentation, and one anonymous REA browser scenario. No account, subscription, employer application, or external service was created.

## Evidence and confidence

- **SCREENSHOT-USER-2026-10-19 — observed:** dashboard image supplied in the current request. This establishes its visible desktop composition and labels, not behavior after clicking.
- **DOC-TRACKER — documented:** [Resume.io job tracking help](https://help.resume.io/en/articles/3786112) describes tracker stages and operations. Its described authenticated behavior was not independently exercised.
- **DOC-START — documented:** [Getting started](https://help.resume.io/en/articles/3785920) describes the document builders and wider career tools.
- **DOC-CAREER — documented:** [Resume.io career suite update](https://updates.resume.io/resume-io-users-can-now-access-all-career-io-features%21-276048) describes interview preparation, salary comparison, job strategy, and tracker access.
- **DOC-AUTO — documented:** [Auto Apply and Resume Distribution](https://updates.resume.io/auto-apply-and-resume-distribution-services-available-for-all-regions%21-310790) describes employer submissions and recruiter distribution as services. The local app has no equivalent integration.
- **REA runtime:** an anonymous Microsoft Edge scenario for `https://resume.io/job-tracker` was attempted with empty storage, a 1.2 second wait action, a light 1440 by 1000 viewport, and final URL/accessibility capture. The provider `rea-playwright-browser-scenario` returned a non-retryable `execution_failure` after launch; no retained evidence ID or captured page was returned. This is a runtime-provider failure, not proof Resume.io itself rejected that request. Earlier captures in `evidence/` returned access-denied pages, so those images do not establish authenticated design or workflows. Independent web retrieval also could not open the public tracker URL; the official help page was readable.

## Visible theme and dashboard

The supplied image shows a white desktop shell with a roughly 240 px left sidebar, compact identity block, muted blue-gray navigation icons, and a very pale cyan active item with blue text. The content area uses generous white space, dark charcoal headings, blue links and accents, thin pale borders, rounded cards, and subtle shadows. These are visual estimates rather than extracted design tokens.

The dashboard greets the user, asks for a current goal, and offers four pill controls: resume building, job search, interview preparation, and learning. Beneath them, a progress card lists resume building, tailoring, distribution, and letter crafting. A neighboring cyan-to-cream action card pairs one improvement action with a resume thumbnail and score badge. A floating AI-coach input appears at the bottom. Its actual response behavior is unknown.

Navigation visible in the image includes dashboard, documents, jobs, tracker, auto apply, interview preparation, salary analysis, distribution, learning, job strategy, coaching, and other tools. Membership and learning controls are visible in the header. Their presence establishes navigation labels, not an implementation requirement to reproduce commercial subscriptions.

## Tracker requirements from official documentation

The tracker uses horizontal stages: Recommended, Shortlist, Applied, Interview, Offer, and Rejected. Users can add an entry directly in a stage, open an entry to add job details and notes, associate application documents, move it between stages, and delete it. A browser extension can save job postings to the account tracker.

For this application, useful fields are company, role, location, salary, source URL, description, notes, stage, application date, next follow-up, and references to a saved resume and cover letter. Board/list switches, search, stage filters, real counts, local persistence, and JSON/CSV backups make the feature usable without accounts. Keep a normal status selector alongside any drag operation for keyboard and touch access.

## Practical integration with CareerForge

The current app already has a browser-backed dashboard, document library, cover letters, and job tracker. Extend those shared stores rather than introduce separate demo records. Preserve existing application stages when migrating stored records, and treat any new field as optional for older entries.

Recommended next steps:

1. Put the existing tools inside a persistent, responsive workspace sidebar matching the reference's proportions and blue/cyan emphasis while retaining CareerForge identity.
2. Derive resume completion and the next suggested edit from actual saved fields; label this as profile completeness. An ATS score requires the scanner's actual result and must not be substituted with a decorative percentage.
3. Make the goal pills reveal useful content or navigate to real tools. Use saved resumes and letters for document previews and recent activity.
4. Expand the tracker with richer job details, document associations, stage counts, search, and accessible board movement. Preserve pending form edits and confirm destructive deletion.
5. Add practical interview preparation from saved role descriptions, editable STAR notes, question practice, and an explicit local-only persistence boundary.
6. Implement automated applying, recruiter distribution, salary benchmarking, coaching, and course catalogs only after their data/services are connected. The supplied screenshot and public marketing do not establish available APIs or user authorization to submit applications externally.

## Limits

No authenticated competitor dashboard or editor was accessed. The source screenshot is the strongest visual evidence for this request. Product help supports intended workflows but does not verify current regional access, export fidelity, recommendation quality, account synchronization, notifications, pricing, or backend implementation. No proprietary assets, templates, JavaScript bundles, or branding were copied.
