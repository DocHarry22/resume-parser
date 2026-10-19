# Cover-letter application workspace

19 October 2026. The local workspace adds `/letters`, available from the sidebar, dashboard, document library, **Write cover letter** in the resume editor, and **Prepare letter** on tracked opportunities. The existing cover-letter editor and its exports are reused.

Choose a tracked opportunity or enter a role, company and description. A starting resume is optional. New letters copy supplied contact details, use the selected letter style, and begin with a simple application opening. The optional starting paragraph is the user's existing resume summary verbatim. The rest remains editable in the existing writing wizard. No experience or achievements are generated.

Creation saves an independent letter without changing its resume or application. **Use for this application** attaches it explicitly, preserving the latest resume selection, notes, stage, salary and dates. Replacing or removing an attachment opens a dialog and rechecks the original attachment selection before saving. Other tabs can continue updating while the dialog is open. Saved letters remain in the library when attachments are replaced or removed. A deleted letter's application still offers **Prepare letter** to choose a replacement.

The library supports previews in all six existing letter styles, search, duplication, deletion, individual JSON backup and a combined JSON backup. Import validates every record before one write, restores independent editable copies with fresh IDs, and retains existing letters and application attachments. The letter editor also offers a JSON backup of current content, including unsaved edits. TXT remains a browser download; existing PDF and DOCX export actions use the processing service.

Browser references are stored as optional `workspace_context` metadata in the existing letter library; server document references keep their original meaning. The local workspace does not attach copies or imported letters automatically. Invalid libraries and quota failures retain existing storage, and a failed job attachment leaves the saved letter available. The new connection workflow is enabled in the local storage profile; other profiles can open their existing cover-letter builder.

## Validation

- Production build and TypeScript validation passed for all 22 generated pages.
- `npm test`: 60 tests plus career-workspace and genuine DOCX export checks. Nine new tests cover exact starter content, manual/summary opt-out, invalid/removed sources, preservation of current application fields, stale attachment selection, failed attachment persistence, atomic backup import, and context through editing/duplication.
- All seven [browser acceptance groups](qa/application-letters/report.json) passed without page errors or application API requests. The harness uses synthetic data and checks tracked and manual starts, editor save/reload, immediate resume-editor flush, attachment replacement/removal, JSON download/import, failure recovery and 390 px layout with all six styles. The [desktop](qa/application-letters/letters-desktop.png) and [phone](qa/application-letters/letters-390.png) screenshots were visually inspected.
- All six version-history browser groups also passed against this build, checking the shared resume editor and its additional shortcut.

Use `npm run test:letters` against a running local-mode preview, setting `BASE_URL` when its port differs from the harness default of 3104. The production preview is built with `NEXT_PUBLIC_STORAGE_MODE=local` and `NEXT_DIST_DIR=.next-letters`. Saved documents remain at the original browser origin; refresh open preview tabs after a build switch.
