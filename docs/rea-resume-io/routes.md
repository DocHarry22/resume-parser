# Route inventory
## DoCHEng frontend
| Route | Intended current behavior |
|---|---|
| / | Original CareerForge landing page with working actions |
| /builder | Connected resume studio; query new=1, id=, template=, import= |
| /tools/builder | Compatibility entry for the connected studio |
| /tools?view=builder or cv-builder | Connected studio |
| /tools?view=templates or cv-templates | Live template gallery |
| /tools?view=scanner | Existing multi-tier scanner |
| /tools | Working tool chooser |
| /resume-scanner | Scanner plus genuine import-to-editor action |
| /cover-letter | Server-workspace letters with local draft recovery |
| /dashboard | Device resumes, server letters, local application summary |
| /job-tracker | Browser-persistent application workspace |
| /privacy | Browser and server data controls |
| /resources/guides | Practical CV guidance including local application contexts |
| /templates | Compatibility entry for the same six-template gallery |
| /login, /signup | Honest guest-workflow availability page; no account authentication |

Legacy /login, /signup and /templates were not implemented in the baseline. Their compatibility pages now explain the available guest workflow or open the gallery. These pages do not implement accounts. Unsupported marketing resource links were removed from navigation.

## Backend
- GET /api/health; upload-based POST /api/parse-resume, /score-resume, /parse-and-score.
- /api/builder/create, /import, /list/all, /{id}, /{id}/save, section CRUD, analysis and safe fixes.
- POST /api/builder/export/{pdf|docx|txt|json}; GET /api/builder/{id}/export/{format}; page_size=A4|Letter.
- /api/cover-letters templates/CRUD/duplicate/from-resume; POST /export-data?format=pdf|docx|txt with current letter; guided/provider writing.
- GET /api/ai/status; POST /api/ai/rewrite.
- GET /api/workspace; GET /api/workspace/export; DELETE /api/workspace.

Stored-document requests use a signed HttpOnly guest cookie and exact-origin checks. These routes do not expose global personal documents anonymously. There is no production account API, billing API or public resume share endpoint.

## Competitor public routes checked
/, /resume-templates, /pricing and /app/create-resume?template=london. Text retrieval succeeded for the gallery/pricing; direct anonymous browser attempts returned403. All authenticated routes and behavior remain UNKNOWN; none were guessed or bypassed.
