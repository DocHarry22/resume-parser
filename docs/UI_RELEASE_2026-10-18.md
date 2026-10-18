# Theme, workflows and template update

The homepage and shared application pages now use the requested Resume.io-inspired blue and white visual theme, with CareerForge/DoCHEng branding. The homepage includes the full tools, examples, templates, advice, FAQ and footer sections. The builder, templates, resume checker, cover letters and supporting pages share the theme.

Eight resume designs now differ in structure as well as color: sidebar, centered serif, editorial labels, career timeline, portfolio masthead, ivory qualifications panel, executive header and technical numbered sections. Six cover-letter letterheads have distinct arrangements. Gallery thumbnails use the real preview components; template fonts, custom colors and section controls persist with the document.

Workflow repairs cover repeated new/template navigation in the editor, saving immediately before navigation, browser-storage failure recovery, cover-letter draft recovery, file replacement/retry, and invalid or empty uploads. Browser Print / Save PDF preserves the selected resume layout. Processing-service PDF/DOCX exports retain their separate readable layout.

## Verification

- 30 automated frontend tests passed.
- 27 workflow browser groups passed with independently checked current-content downloads; see [workflow evidence](qa/workflow-audit/README.md).
- 13 template browser checks passed, including all eight layouts, all six letterheads, mobile previews, font/color changes and save/reload.
- 11 independently checked resume print cases retained their content without blank pages; all eight short samples fit one page. See [final template evidence](qa/template-designs/final-results.json).
- [Design references](TEMPLATE_DESIGN_REFERENCES.md) record the sources used to develop the template variety.

The separate Sites publication remains the existing owner-private browser-local edition. Its resume editor, templates, browser backups and local exports do not contact the Python document service. Service-based parsing, checking and cover-letter operations retain the existing unavailable-service guard. The local development application supports the independently tested processing workflows. Updating Sites does not update the separate Hostinger domain or the Render backend.

Publication details for this release are recorded separately after the native deployment completes. Earlier deployment reports and QA captures describe their dated revisions.
