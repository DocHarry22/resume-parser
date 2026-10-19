# User flows and evidence boundaries

Observed on 15 October 2026. Public browser capture of Resume.io returned HTTP 403 for the homepage, gallery, pricing and builder at desktop, tablet and mobile sizes. Those screenshots document the access restriction, not the competitor's editor behavior. No access controls were bypassed. Authenticated competitor flows, network mutations, exports, account behavior and premium boundaries remain UNKNOWN.

The following original implementation flows combine the existing application architecture with publicly described product capabilities. They are not claims of observed competitor internals.

| Flow | Entry and input | State and feedback | Recovery and output |
|---|---|---|---|
| Create resume | Home/gallery → builder; blank personal details and sections | Live preview; browser save status; explicit template and design settings | Undo/redo, local library, duplicate/rename/delete, JSON backup |
| Import resume | Scanner or editor → PDF/DOCX/TXT upload | FastAPI signature/size checks; parser analysis; editable normalized copy | Visible API errors; original document preserved; user verifies extraction |
| Change template | Gallery or editor → one of six original layouts | Content stays intact; preview changes immediately | Select another layout or undo; no advertised thirty-template claim |
| Export | Editor → PDF/DOCX/TXT/JSON or print | Primary PDF/DOCX service requests use current data; local formats available | Explicit request errors; print for current visual design; genuine editable DOCX |
| Writing help | Summary → action → explicit provider consent | Server availability, before/after comparison, editable suggestion | Accept/reject; unchanged source on failure; no configured live provider success claimed |
| Resume analysis | Scanner → resume and optional job-description text | Explainable existing scoring and recommendations | Inspect/edit rather than treating score as employer acceptance probability |
| Cover letter | Career navigation → letter editor | Current editable content, live preview, local recovery and guest server save | Update existing saved letter, API error/retry, current-content exports |
| Job tracking | Dashboard/jobs → add application | Browser-local stages, dates, contacts, notes, safe links | Edit/delete, backup/restore, storage failure retains entered form |
| Privacy | Privacy page → export or delete | Separate browser and guest-server controls | Confirmation/status; local document keys and legacy builder state included |
| Sites edition | Same navigation and schema → local editor/jobs | Local save status and export/print; edition notice | Server-only operations clearly point to canonical main app; no shared-account claim |

Browser verification and concrete limitations are in `../qa/` and `parity-matrix.md`. Account registration/login/logout is not an implemented journey. Guest cookies and browser libraries do not provide cross-device account recovery.
