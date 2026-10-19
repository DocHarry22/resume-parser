# 90-day career plans

19 October 2026. Local implementation at `/career-plan` in the active `.mission-work` frontend, accessible from the workspace sidebar.

Users can create a blank plan, a job-search plan, or a first-90-days-in-a-role plan. Starters contain editable suggestions, with four tasks in each 30-day phase. The user chooses the title, goal, start date, optional saved opportunity and three milestone outcomes. Linking an opportunity does not modify its stage, dates, notes or documents.

Tasks have a title, notes, due day (1–90) and status (to do, in progress, completed). Due dates are calculated from the plan start date; day 1 is the start, day 90 is start plus 89 days. Dates are calculated using UTC calendar days to avoid timezone/DST shifts. Changing the start date shifts task dates while preserving their day offsets, notes and completion. A finished plan period does not automatically mark tasks completed.

The workspace shows actual completion, due-now counts, the current plan day and 30/60/90 milestones. Selecting a phase or status filters the task list. Users can add, edit, complete, reopen or remove individual tasks, and remove an entire plan through a confirmation dialog. There are limits of 10 plans and 100 tasks per plan; reaching a limit never silently prunes work.

## Local persistence and backup

Plans persist under `resume-studio.career-plans.v1`. Mutations reread current storage. Unique revisions protect edits/removal of the same task and plan details. Task revisions are independent from details revisions, allowing changes to different tasks and metadata to preserve each other in ordinary two-tab workflows. These are optimistic checks on browser storage, not a server transaction or account-sync system.

JSON exports preserve the plan details and all task statuses/notes. Normal imports validate the entire backup before writing independent copies with new IDs and revisions. A corrupt library remains intact until the user selects a valid backup and explicitly confirms replacement. Recovery checks the original raw stored value so a later change in another tab is not silently overwritten. Users can download stored data before recovery. Quota failures retain the original stored library and unsaved editor values. Other document/job libraries are not changed.

Text downloads provide a readable plan with milestone outcomes, real task dates, status markers and notes. No plan content is sent to an external service. Due dates are displayed in the workspace; email, notifications, background reminders and calendar sync are not enabled.

## Verification

`npm test` passed all 106 tests plus the existing career-workspace and genuine DOCX checks. Thirteen new tests cover inclusive/leap-year date arithmetic, templates, progress, date shifts, independent and stale edits, removals, invalid input, JSON copies, atomic import failure, corruption/recovery, limits and text export. The captured test log is in `docs/qa/career-plans/unit-test.log`.

`npm run test:plans` exercises the running preview through Edge with synthetic data. It covers the guided and blank journeys, saved-job context, progress, date changes, filters, transient invalid input, JSON/text exports and recovery, concurrent task/metadata work, quota preservation, stale deletion, mobile dialogs and keyboard focus. Reports and screenshots are kept in `docs/qa/career-plans/`.

The isolated build uses `NEXT_PUBLIC_STORAGE_MODE=local` and `NEXT_DIST_DIR=.next-career-plan`. This increment is local and has not been published to the live website.

The production build and TypeScript checks passed for all 26 pages. Six [browser checks](qa/career-plans/report.json) passed against the production build, including 1440 px and 390 px layouts, no external plan requests, actual progress/date behavior, backup/recovery and concurrent edits. Screenshots were inspected visually. The verified build is served on the existing local port 3103, preserving the user's browser storage origin.
