# Mission checklist and feature parity
PASS means verified by the specific current checks in docs/qa, not deployed production completion. PARTIAL means implemented capability has stated gaps. BLOCKED means an external integration/access requirement prevents verification. FAIL means missing required functionality. Consult the final QA report for checks performed after the most recent edits.

| Requirement | Status | Evidence / remaining gap |
|---|---|---|
| Preserve existing project/history/brand | PASS | Existing repo cloned; original checkout untouched; CareerForge/DoCHEng navy-teal retained |
| Initial audit | PASS | initial-audit.md with observed boundaries |
| REA initialization/research | PARTIAL | Official skill + CLI doctor/scenario retained; MCP absent; competitor browser403 |
| Full competitor user journeys | BLOCKED | Access-denied browser responses; authenticated flows UNKNOWN |
| Split-screen live resume editing | PASS | Studio components + browser QA |
| Blank start, restore, real save status | PASS | Browser-library tests, error paths |
| Undo/redo, rename, duplicate, delete | PASS | Studio + browser tests |
| Browser persistence beyond session | PASS | Local storage roundtrip tests; not cross-device |
| Server document persistence/isolation | PASS | Workspace regression tests; durable disk required in production |
| Every requested named section | PARTIAL | Core sections + optional presets/custom sections; not all have specialized forms |
| Section visibility/order/restore | PASS | Studio and export helpers |
| Entry reordering | PARTIAL | Accessible move controls; no drag-and-drop in the primary studio |
| Rich text, grammar/spelling service | PARTIAL | Plain text/bullets + browser spellcheck; no full rich-text grammar engine |
| Version history | PASS (local) | 20 named checkpoints, comparisons, safety restores and JSON roundtrip; see RESUME_HISTORY.md |
| 30 distinct templates | FAIL | Eight distinct layouts currently implemented; 22 more needed to reach30 |
| Colors/fonts/size/spacing/paper | PARTIAL | Implemented; arbitrary margins/photo support remain limited |
| Multi-page PDF/selectable text | PASS | Service PDF text/content/page regression checks |
| Exact design in downloaded PDF | PARTIAL | Browser print preserves preview; service export uses readable layout |
| Genuine editable DOCX | PASS | XML package validation and backend document-content tests |
| TXT and JSON backups | PASS | Local export/normalization tests |
| PDF/DOCX/TXT parsing | PASS | Bounded signature checks and parser tests; manual verification still essential |
| Scanned OCR/multi-column assurance | FAIL | No OCR service; no universal multi-column guarantee |
| Import review/uncertainty UI | PARTIAL | Editable separate copy + guidance; no per-field confidence values |
| Real AI assistance | PARTIAL | Optional server provider + consent/accept/reject; live provider credentials absent |
| No fabricated credentials/metrics | PARTIAL | Guided defaults repaired; provider rejects unsupported metrics; human review still necessary |
| Explainable ATS/JD text analysis | PARTIAL | Existing scoring retained; no universal employer ATS claim |
| Job URL/ad upload/tailored version automation | PARTIAL | Greenhouse/Lever URLs and public boards, independent tailored copies and term checks; arbitrary job-ad upload and universal URL extraction remain |
| Public job search | PASS (local) | Jobicy, Arbeitnow and Remotive feeds; selected Greenhouse/Lever boards; local filters and duplicate-safe tracker saves. LinkedIn, Indeed, Pnet, Careerjet and Google Jobs open as search shortcuts |
| Saved job searches | PASS (local) | Up to 30 named searches retain source and filters, survive reload, synchronize across tabs, and restore on demand; no background alerts |
| Salary Analyzer | PARTIAL (local) | Saved personal scenarios, pay-period normalization, same-currency comparisons, manual deductions, optional SARS 2026/27 tax/UIF estimate and CSV; market benchmarks and exchange conversion remain |
| Review-first Auto Apply | PASS (local, selected scope) | Installed Greenhouse/Lever helper fills recognized contact/document fields and stops for user review/final submission; custom questions remain manual. See JOB_SEARCH_AUTO_APPLY.md |
| Cover-letter editor/preview/storage/export | PARTIAL | Implemented and tested; matching designs not pixel-identical to all resume layouts |
| Dashboard/job tracker | PARTIAL | Local dashboard plus board/list/calendar, follow-ups, documents and backups; account sync remains |
| Interview/STAR/90-day/pathway/share tools | PARTIAL | Local question prompts, STAR notes and rehearsal timer; editable 90-day plans with milestones, tasks, due dates and backups; advanced feedback, pathways and sharing remain |
| South African application contexts | PARTIAL | Guidance + custom qualifications/registration fields; no verified localization/public-sector service |
| Secure registration/login/reset/verification | FAIL | Guest workflow only |
| PostgreSQL/account row-level authorization | FAIL | Guest isolation implemented; account database not provisioned |
| Privacy/export/delete/upload/CORS controls | PARTIAL | Regression tested; deployment edge controls/retention operations remain |
| Billing/subscriptions/ZAR VAT/cancellation | BLOCKED | No selected merchant account, approved pricing, sandbox payment flow or activation |
| Frontend/backend tests | PASS | Actual latest reports in docs/qa; not a claim all mission tests exist |
| Current dependency advisories | PARTIAL | Backend clean installed audit; frontend remediation/results in QA |
| Existing GitHub updated | PARTIAL | Branch/PR references belong in final deployment report |
| Verified Hostinger deployment | BLOCKED | Render Free Python processor is live; existing static files still use placeholder backend. Real backup and actual-domain cutover checks remain unresolved |
| Sites edition | PARTIAL | Privately published version2; local-editing subset verified, Python/shared-account capabilities unavailable |
| Shared cross-origin accounts/documents | BLOCKED | No verified canonical backend/account integration |

## Phases
A audit: complete within documented evidence boundary. B competitor: partial/blocked. C architecture: documented. D repairs: implemented and tested within recorded scope. E editor/templates: partial. F imports/exports: partial. G AI/ATS: partial. H letters/dashboard: partial. I accounts/storage: guest storage complete, accounts incomplete. J responsive/security: local verification only. K Sites: prepared from same frontend. L integration: local tests, production pending. M merge: pending production deployment safety prerequisites. N Hostinger: blocked. O Sites: see actual native deployment status.

The full final acceptance criteria are NOT satisfied until the primary domain runs verified account/storage/API workflows and the missing product requirements are implemented. A passing repaired-subsystem test suite is not full commercial feature parity.
