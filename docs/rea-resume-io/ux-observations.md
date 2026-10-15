# UX observations and visual references

## Reference evidence

`evidence/public-browser-observations.json` records response status and URLs. The twelve Resume.io screenshots cover four routes at 1440×1000, 820×1180 and 390×844. They show access-denied pages; typography, editor proportions, loading transitions and responsive controls behind that boundary are UNKNOWN. Public text retrieval provided only limited product/gallery/pricing descriptions. No proprietary template, graphic or bundle was copied.

The existing canonical app returned HTTP 200 during the initial comparison. `evidence/production-*.png` preserves its original CareerForge/DoCHEng branding and visible claims. This is a baseline observation; it does not verify the new branch on that host.

## Original design decisions

- Retain the navy/teal identity and recognizable CareerForge name. Use system fonts, a restrained type scale, clear focus states and consistent rounded controls.
- Make editing the dominant action: split form/preview on desktop, readable single-column controls on mobile, and a visible document title and save state.
- Start with a blank document. Example wording stays guidance, and no demo identity is silently saved as user content.
- Use actual six-layout thumbnails and filters. Remove unsupported counts, recruiter partnerships and ATS acceptance promises.
- Keep export failures actionable. A failed API request does not download a text file disguised as DOCX or display a successful save.
- Label the scope of persistence: local browser records, guest server workspace, and account identity are different capabilities. Missing account functionality has an explanatory page.
- Protect ongoing work through automatic local recovery, JSON backup, non-destructive import/template changes, and explicit privacy deletion controls.
- Use accessible move controls and keyboard-reachable dialogs. Entry drag-and-drop, rich text and a persisted version timeline remain gaps.

## Validation

Product screenshots, downloaded files and browser result JSON live in `../qa/`. The checks exercise real editing and downloads at mobile/tablet/desktop widths; they are separate from the blocked competitor-reference captures. PDF text and OOXML content were independently parsed. Browser-print pagination was checked with long content and a final sentinel. The exact visual layout of the backend's readable PDF/DOCX differs from the preview; print is the available layout-preserving path.
