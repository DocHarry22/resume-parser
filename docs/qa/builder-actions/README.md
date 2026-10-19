# Compact resume builder — 19 October 2026

The requested top storage banner is removed from `/builder` and `/tools/builder`. Undo, Redo and the main PDF action remain visible. The secondary action row is replaced with one three-dot icon beside PDF. Its submenu retains import/restore, version history, application letter, tailoring, duplicate, JSON/DOCX/TXT, printing, the edition-specific workspace action, and help.

The disclosure supports keyboard navigation, Escape with focus restoration, outside dismissal, closing after selection, and viewport-constrained positioning/scrolling. The in-editor storage explanation remains available below the toolbar and in help. A nonvisual edition marker replaces the removed banner as the static-release validator's input.

## Published artifacts

- Source: `65a2b914bf2f96a33474f4734fb891eafe84ec90` on [PR #2](https://github.com/DocHarry22/resume-parser/pull/2).
- [Hostinger](https://resume.docheng.co.za/builder/): `careerforge-hostinger-static-65a2b914bf2f.zip`, 2,785,026 bytes, 115 files. SHA256 `29e53aee5abd1f05d714ee295f6002164312f6d9df7be0a91ff32a5e1c3d227f`.
- [Private Site](https://docheng-careerforge.thletsholo2.chatgpt.site/builder): version 5, pushed Site source `a09f4cd7bd9a1073b5ec66b8ba1f240443078e05`, saved version `appgprj_6ad0d2b816bc8191b1964e7bc48c2f93~appgver_4cf815371b9081919eba175ecc99fafc`, successful deployment `appgdep_6ad64e4f0e5881919011be6820d16032`. Owner-only access was retained.

## Checks

107 application tests and 7 static-release tests passed. Both production exports compiled, type-checked and generated all 26 pages. All five GitHub checks passed on the published source: [application quality](https://github.com/DocHarry22/resume-parser/actions/runs/39290930986) and [512 MiB profile](https://github.com/DocHarry22/resume-parser/actions/runs/39290930920).

[Sites artifact](sites-artifact/results.json), [Hostinger artifact](hostinger-artifact/results.json), [actual private Site](sites-live/results.json), and [actual Hostinger](hostinger-live/results.json) each passed five browser groups with no page exceptions. Checks cover the removed banner/row, current-document links, keyboard controls and focus restoration, closed/open layouts at 390px and 320px, outside dismissal, the import chooser, a real current-content JSON download, independent duplication, help and actual navigation into the current copy's history. Fresh synthetic browser profiles kept user documents untouched. Local-preview evidence is under `local/`.

Every Hostinger ZIP entry was independently verified against the [manifest](hostinger-manifest.json). Native deployed paths and byte sizes match it exactly; the uploaded archive was consumed. The [comparison](hostinger-inventory-verification.json) and [native inventory](hostinger-native-after.json) record that result.

Only frontend static files were published. Existing backend, DNS, hosting plan, databases and the earlier provider-retained rollback basis remain unchanged.
