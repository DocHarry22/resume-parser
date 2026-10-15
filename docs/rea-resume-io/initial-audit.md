# Existing application audit
Evidence boundary: source inspection of the existing GitHub default branch and anonymous production browsing. The original local checkout could not be safely audited: OneDrive source placeholders timed out and git status failed with “mmap failed: Invalid argument”. A clean clone of the same repository, preserving history, was created at .mission-work. The original source was not overwritten.

## Findings before repairs
| Area | Observed initial condition | Severity / status |
|---|---|---|
| Fresh frontend build | Entire frontend/lib absent from GitHub because generic lib/ ignore rule excluded source | Critical build blocker |
| API addressing | next.config.js forced localhost8000; cover-letter edit hardcoded localhost8000 | High; production connectivity unverified |
| CORS | Wildcard origins with credentials enabled | High |
| Stored documents | Builder IDs could be requested without user authorization; cover letters global in-memory dictionary | Critical privacy / durability limitation |
| Nested updates | Builder model_copy applied raw nested dictionaries, later code expected typed objects | High functional failure |
| Saving | Builder cached new/changed documents until explicit disk save; active editor simulated save; no reliable restore | High data-loss risk |
| Imports | Scanner “edit” action unfinished; active builder not connected to parsing | High |
| Default resume | Active editor started with an invented named professional profile | High trust/data-integrity issue |
| PDF | Active editor rasterized one fixed-size page; content could be truncated | High |
| DOCX | Active resume studio had no dependable editable DOCX download | High |
| Cover letters | Global in-memory persistence; nested update types unsafe; UI error paths hid failure | High |
| AI | Guided templates presented as AI; fixed years/skills/results could fabricate qualifications | High |
| Navigation | Homepage import did nothing; builder/templates query routes mostly placeholder; login/signup absent | Medium |
| Templates | Six renderer identities; homepage claimed 50+; large static PDF previews did not establish live-template parity | Medium |
| Marketing | Unverified hiring/customer/review counts and universal ATS accuracy claims | Medium |
| Jobs/dashboard | No complete user workspace or application tracker route | Missing |
| Accounts | No real registration, verification, login/reset or cross-device identity | Missing |
| Tests | Previous documentation's 15/24 count is historical, not current; initial dependencies prevented meaningful baseline execution | Blocked baseline; current results recorded separately |
| Dependencies | Old frontend/backend HTTP/PDF packages contained reported advisories | High; see current QA and dependency reports |

## Preserved functionality
FastAPI parsing, spaCy NLP, text extraction, scoring tiers, industry scoring, builder section models, auto-fix architecture, cover-letter forms, and original CareerForge navy/teal branding were extended. Legacy builder components remain in source where useful; primary entry points now use the connected studio. No production data was migrated or deleted.

## Working path after implementation
The studio starts blank; saves drafts to browser storage with real status/failure feedback; restores them; provides history, independent copies, custom sections, section visibility/order, typography, paper size, and live preview. Scanner output normalizes into editable fields. Server imports/exports and saves use one configured API and signed guest workspace. Cover letters persist on that workspace, with local draft recovery. The application tracker stores real local records and clearly explains its device scope. No full account system is claimed.

## Important limits
Guest cookie authorization is not an account or recovery mechanism. Disk persistence requires a durable mounted volume and stable signing secret. Legacy shared files are intentionally not auto-exposed to new guests; migration requires verified ownership. Full accounts, cross-device sync, OCR, 30 templates, billing and business/recruiter features remain open. The canonical hosted site has not been changed merely by editing this checkout.
