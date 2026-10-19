# Resume version history

19 October 2026. Implemented in the active `.mission-work` frontend for the local workspace preview.

Open **Version history** from a resume editor or **Version History** in the sidebar. Select a saved resume, name a checkpoint, and keep editing. Each checkpoint captures content, design, and application target details. The comparison shows the saved checkpoint beside the current saved draft, with added, removed and edited fields and a section filter.

**Restore checkpoint** keeps the document ID and existing tracker references. The current draft becomes a safety checkpoint in the same library write. Restore that safety checkpoint to undo a restore. **Open as new copy** creates an independent document from the selected checkpoint without changing the original. Duplicates and newly tailored copies start with an empty history.

Checkpoints live inside each saved document in `resume_studio_documents_v1`. The limit is 20 checkpoints per resume, including safety checkpoints. Nothing is automatically pruned. At the limit, back up and remove an unwanted checkpoint before restoring, or open the earlier version as a separate copy. History-page backups and editor JSON backups retain checkpoints, and JSON import normalizes them into the imported document's new ID. Snapshots never contain nested histories.

The editor flushes pending changes before navigating to history. Saving from an older editor preserves the latest stored checkpoints. A clean open editor adopts newer saved content from another tab; conflicting unsaved edits remain in their tab with a JSON backup and explicit **Load latest saved version** recovery action. Storage/read failures do not clear the library, and invalid history is rejected rather than dropped. Browser storage is device-specific and can be cleared; keep downloaded backups for long-term retention.

## Verification

- Production build and TypeScript validation passed, including all 21 generated pages.
- `npm test`: 51 tests passed, followed by career-workspace and genuine DOCX export checks. Ten new tests cover snapshots, safety restores, stale saves, limits, backup normalization, corrupt/quota failures, copying/deletion and field comparison.
- `npm run test:history`: six [browser acceptance groups](qa/resume-history/report.json) cover the actual editor/history path, comparison/filtering, confirmation cancellation, restore and undo, unchanged application linkage, JSON download/import, independent copies, checkpoint deletion, multi-tab recovery, quota/invalid-history protection, empty state and 390 px layout.
- [Desktop](qa/resume-history/history-desktop.png) and [mobile](qa/resume-history/history-390.png) screenshots use synthetic data and were visually inspected.
- The existing six-group tailoring browser suite also passed against the history build, checking the shared save/navigation path.

Browser checks use headless Edge, make no application API requests, and set `BASE_URL` to the running preview (default port 3104). The verified build uses `NEXT_DIST_DIR=.next-history` and `NEXT_PUBLIC_STORAGE_MODE=local`. Refresh all already-open preview tabs after switching builds so old bundles load the updated history schema before editing.
