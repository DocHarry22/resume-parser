# Feature map and public journeys
Evidence labels: OBSERVED = retrieved public interface/text; SOURCE = existing application's source; INFERRED = design requirement; UNKNOWN = not accessible or untested.

## Public competitor feature map
The public template gallery exposes category filters, per-template selection links and file-format labels. It distinguishes layouts that support PDF and DOCX from PDF-only choices. Its public entry also offers resume upload. These are OBSERVED in text retrieval; file download and upload processing are UNKNOWN. Source: https://resume.io/resume-templates.

The public pricing route is reachable through text retrieval. Actual entitlements, regional prices, payment validation, cancellation and authenticated account behavior were not verified, so all are UNKNOWN. Source: https://resume.io/pricing.

The homepage, public navigation and “create resume” entry were attempted in anonymous Playwright; the browser received403. Editor layout, validation, live preview, AI suggestions, saving, importing, formatting, download dialogs and authenticated dashboard are UNKNOWN. Public marketing claims are not substituted for workflow evidence. No JavaScript bundle analysis was possible through the blocked browser boundary.

## User-flow map
### Competitor
Public templates → category → template selection → /app/create-resume?template=london → browser access denied.
Homepage/pricing → browser access denied.
Authenticated editor/account/checkout → UNKNOWN (no login, trial or purchase attempted).

### DoCHEng implementation
Home → /builder?new=1 → blank document → personal/experience/education/skills and optional sections → live preview → browser autosave → return via /dashboard.
Home/gallery → template identity → studio → change template/color without deleting content.
PDF/DOCX/TXT upload → validated FastAPI extraction and parser → separate editable document → review uncertain dates/headings manually → preview → save/export.
Scanner → score/categories/feedback → Edit this resume → normalized editable copy.
Studio → improve summary → provider availability → explicit consent → before/after → edit/accept/reject → original retained until acceptance.
Studio → PDF/DOCX readable export OR browser Print/Save PDF for selected visual design; JSON backup retains design and all hidden content; text export respects order/visibility.
Cover letters → new/existing → sender/job/recipient/content → local draft save → explicit server save → editable DOCX/current-content PDF/TXT.
Job tracker → add/edit → status/filter/follow-up → reload → browser JSON backup → delete.
Privacy → browser export/delete or independent guest-server export/delete.

## UX observations and original design decisions
- Retain observed CareerForge navy and teal, paired with quiet neutral work surfaces.
- Make one resume studio the main editing entry; preserve content across design changes.
- Use real empty states, save status, errors and undo/redo; never present a demo as user work.
- Make desktop editing/preview parallel and mobile editing/preview switchable.
- Put export alternatives in plain language: readable service layout versus selected visual design through print.
- Expose privacy and persistence boundaries before users rely on them.
- Template thumbnails render the same original preview component, rather than stale PDF screenshots.
- Restore access-denied and failure evidence without bypassing the competitor's protections.

## Unobservable journeys
Resume importing internals, rich-text editor behavior, AI request/results, ATS engine accuracy, JD URL fetching, jobs/interviews, career plans, account management, premium gating, transactional billing, export fidelity, back-navigation and failure states all remain UNKNOWN for the competitor. Their implementation requirements come from the user's mission, not inferred proprietary behavior.
