# Career workspace upgrade

Later local increments add [resume version history](RESUME_HISTORY.md) and a [cover-letter application workspace](APPLICATION_LETTERS.md). Their own acceptance records describe the additional routes and checks.

[Job search and review-first Auto Apply](JOB_SEARCH_AUTO_APPLY.md) adds public feeds, direct company boards, application preparation, and a Greenhouse/Lever browser helper with user-controlled final submission.

[More sources and saved searches](JOB_SEARCH_SOURCES.md) expands discovery with Jobicy and Arbeitnow, five external search shortcuts, and up to 30 named sets of search filters.

[Salary Analyzer](SALARY_ANALYZER.md) compares user-entered pay scenarios, bonuses, deductions and work costs, with saved-job context and an optional sourced South African 2026/27 take-home estimate.

[90-day career plans](CAREER_PLANS.md) add editable milestones, tasks, due dates, completion, saved-opportunity links, JSON backup/recovery and readable text downloads.

Follow-on feature: [job-specific resume tailoring](RESUME_TAILORING.md) adds tracked-job/manual targets, independent resume versions, explainable term coverage, editor shortcuts and explicit application linking. Its latest acceptance is 41 automated tests and six browser groups; the initial dashboard/tracker acceptance below remains a separate record.

19 October 2026. Source changes are in the active `.mission-work` checkout on `codex/career-platform-upgrade`. This document describes the local implementation, not a publication to the existing website.

## Implemented

- `/dashboard`: responsive blue/cyan sidebar, personalized greeting, four keyboard-accessible goal tabs, section completion from the latest saved resume, useful next action, real document/application counts, recent document previews, and due follow-ups.
- `/documents`: resumes and cover letters in one searchable library with grid/list views, resume rename/independent duplication/deletion, individual JSON backups, and links to the existing editors and import flow.
- `/job-tracker`: board/list/calendar views, drag between stages with keyboard/touch stage selectors, column counts, search and filtering, job details and notes, location/salary/description, associated saved resumes and letters, application/follow-up dates, follow-up completion/rescheduling, and JSON/CSV export/import.
- `/interview-prep`: six practical question prompts, STAR structure, instantly saved personal notes, rehearsal timer, and text download. This is local self-guided practice; it does not call an interview AI or record audio.

The existing builder, templates, scanner, cover letters and public navigation remain available. The workspace retains CareerForge/DoCHEng identity. The screenshot informs layout, colors and workflow; no competitor source code or proprietary assets were imported.

## Evidence and limits

See [dashboard research](rea-resume-io/dashboard-research.md) for the screenshot observations, official Resume.io feature documentation, and REA failure. The live anonymous REA browser scenario failed at its provider and returned no evidence ID; authenticated competitor behavior has not been exercised.

Section completion checks contact name/email, summary, a named role/company, education institution/degree, and at least one skill. It is not an ATS score. Application counts and follow-ups come from actual saved tracker records; empty workspaces show zero.

Libraries use existing browser keys and preserve old job stages. Optional tracker metadata is backwards compatible. Writes report quota/storage errors; unreadable libraries remain intact, and tracker recovery requires an explicit validated-backup replacement. Drafts remain device/browser specific. Registration, cloud sync, job sourcing, Chrome extension integration, automatic application submission, recruiter distribution, salary benchmarking, paid coaching and course integrations are outside this local implementation.

## Verification and local preview

From `.mission-work/frontend`:

```powershell
npm run check
npm test
$env:NEXT_PUBLIC_STORAGE_MODE='local'
npm run dev -- --hostname 127.0.0.1 --port 3100
# In another terminal:
$env:BASE_URL='http://127.0.0.1:3100'
npm run test:workspace
npm run test:tracker
```

The browser harness uses temporary synthetic data, not the user's saved profile. Windows may require the browser and preview to run outside the sandbox. A production preview can set `NEXT_DIST_DIR=.next-workspace` for both `next build` and `next start`; this keeps its artifacts separate from the normal development build. The documented test results and screenshots are in `docs/qa/workspace-upgrade` and `docs/qa/tracker-upgrade`.

Final local acceptance: production build/type checks passed for all 19 generated routes; all 33 Node tests and the existing career workspace/export checks passed. Seven workspace browser groups and eight tracker checkpoints passed with no browser page errors, at 1440 px and 390 px. The final interview-specific browser rerun verifies that editing different questions in two tabs preserves both answers, quota failures retain unsaved answers across question changes, and invalid storage is kept unchanged. A focused independent code review found and verified the repair for the original two-tab overwrite case. See [workspace evidence](qa/workspace-upgrade/README.md) and [tracker evidence](qa/tracker-upgrade/report.json).
