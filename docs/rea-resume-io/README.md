# DoCHEng CareerForge investigation and implementation
Observed 15 October 2026. Source: existing DocHarry22/resume-parser repository, base commit 4c4891037d88af569204a940e733b390328c8776. Work continues on branch codex/career-platform-upgrade.

This is an implementation and evidence record, not a claim that the full commercial mission is complete.

- [Initial application audit](initial-audit.md)
- [Feature and user-flow map](feature-map.md)
- [Complete original implementation flows](user-flows.md)
- [UX observations and visual evidence](ux-observations.md)
- [Route inventory](routes.md)
- [Parity and mission checklist](parity-matrix.md)
- [Architecture and remaining work](technical-recommendations.md)
- [Deployment report and rollback](../DEPLOYMENT_REPORT.md)
- Backend and browser verification: ../qa/

## Research evidence and access boundary
Public text retrieval succeeded for the Resume.io template gallery and pricing pages. Anonymous Playwright visits to its homepage, templates, pricing and create-resume route all returned HTTP 403. Desktop (1440×1000), tablet (820×1180) and mobile (390×844) screenshots preserve those responses in evidence/. They are access-denied evidence, not usable editor references. No access controls were bypassed, no competitor account was created and no payment was made.

The current REA skill was read from the official repository. It was absent from the installed skills directories; the active session has no REA MCP tools. REA 6.5.0 doctor reports missing registration. Its supported CLI runs with the existing bundled Node24.19 runtime. A public browser scenario was executed and retained as evidence/rea-public-capture.json with Evidence ID ev_c2d53e8907b8943f5bc4e45e63ade0378052bfb64ce557316a5fd452a6d43733. Its bounds and limitations must accompany any interpretation. No shared Codex registration was modified.

Playwright public observations are retained in evidence/public-browser-observations.json, with URLs, HTTP results, page structure and value-free network metadata. The canonical production homepage returned HTTP200 with CareerForge branding. Its observed appearance supplied the navy/teal design direction. Updated UI uses original code and layouts.

## Sources
- https://resume.io/
- https://resume.io/resume-templates
- https://resume.io/pricing
- https://resume.io/app/create-resume?template=london (reached through the public template-gallery link)
- https://github.com/morluto/rea
- https://github.com/morluto/rea/blob/main/.agents/skills/reverse-engineer-anything/SKILL.md
- https://github.com/morluto/rea/blob/main/docs/browser-scenario-contract.md
- https://learn.chatgpt.com/docs/sites?surface=web

Text retrieval documents public claims; it does not establish authenticated behavior or premium entitlements. No competitor template, code, graphic, trademark or JavaScript bundle was copied.
