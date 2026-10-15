# Hostinger backup and local verification

**No real Hostinger backup has been created, downloaded, or restored by this work.** The verifier has been checked using synthetic archives only. Creating a backup in hPanel, downloading it, and verifying a local selected-site restore are separate steps; none establishes a successful production restoration.

Scope: `resume.docheng.co.za`, whose authoritative site root is `domains/docheng.co.za/public_html/resume`. The account wrapper, when present in the archive, must be exactly `u836398163/` or `home/u836398163/`. Other websites and hosting accounts are outside this task.

## 1. Create a current backup in hPanel

Open **Websites → Dashboard** for the hosting account serving the resume site. Find **Backups** in the sidebar. Under **Create backup**, choose **Select**, then **Continue**. Wait for preparation to complete and note its timestamp. Hostinger says preparation may take minutes to hours; manual creation is generally available once per 24 hours when the plan includes it. If the option is unavailable, record that limitation; do not purchase an upgrade or restore anything as a workaround. These steps follow [Hostinger: How to create backups](https://www.hostinger.com/support/2298928-how-to-create-backups-at-hostinger/), checked 15 October 2026.

## 2. Download the files archive

In **Backups → Restore and download → Files backups**, choose the date just created and click **Download files**. Wait for preparation, then click **Download**. This downloads `.tar.gz`; keep the original archive unchanged in a private local folder. **Do not click Restore.** Hostinger's files backup may include every website in the hosting plan, so do not publish the archive or add it to Git. Database downloads are separate `.sql.gz` files; this verifier does not process them. These instructions follow [Hostinger: How to download backups](https://www.hostinger.com/support/5981435-how-to-download-backups-at-hostinger/), checked 15 October 2026.

## 3. Inventory first; do not extract the hosting account

Run from this repository root using Python 3.12 or 3.13; no third-party package is needed. Replace the example with the actual downloaded archive path:

```powershell
$backup = 'C:\path\to\downloaded-backup.tar.gz'
python scripts/verify-hostinger-backup.py $backup
```

The default prints a bounded metadata inventory and changes no files. It identifies only the exact permitted resume roots. Unrelated site names/payloads are not included in the report. ZIP member payloads are not opened. TAR metadata traversal necessarily scans the compressed stream to skip files, but unrelated members are not opened, inspected, or extracted.

To record that observation for the separate selection step:

```powershell
$inventory = python scripts/verify-hostinger-backup.py $backup --record-inventory | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Inventory failed; no restore is authorised by this result.' }
$inventory.candidates | Format-Table path, identity, files, bytes
$observed = $inventory.inventoryReport
```

The recorded `inventory.json` is in a fresh ignored `.runtime/backup-verify/inventory-.../` directory. It is bound to the archive's SHA256 and exact observed target metadata. If there is no authoritative candidate, stop and review the archive origin/layout; do not guess a website or flatten another domain's files.

## 4. Verify only the observed resume subtree locally

After reviewing the inventory, copy its exact candidate path into `--site-root`. The command below applies when the candidate has no account wrapper; otherwise use the exact permitted wrapper emitted by the inventory:

```powershell
python scripts/verify-hostinger-backup.py $backup --inventory-report $observed --site-root 'domains/docheng.co.za/public_html/resume' --expected-tree docs/qa/hostinger-static-tree.json --restore-selected
```

The current native Hostinger observation is [hostinger-static-tree.json](qa/hostinger-static-tree.json): 90 entries, including **70 regular files totaling 67,455,572 bytes**. It contains file paths and sizes, not payloads or server hashes. `--expected-tree` checks the exact regular-file set and byte sizes against that observation. Refresh it through an authorised scoped inventory if legitimate production changes occur; a mismatch is a stop condition, not a reason to bypass the check.

The verifier requires nonempty `index.html`, `.htaccess`, and `_next` JS/CSS assets. It writes only the selected resume files into a new `.runtime/backup-verify/restore-.../site/`, never into original archive/server paths. Every restored file's tree position, size, and SHA256 must match the selected archive payload. The archive SHA256 must remain unchanged. `verification.json` records the outcome; a failed verification remains explicitly `verified: false`, and partial local files are retained for diagnosis. No recursive cleanup or production overwrite is performed.

A genuine site-only ZIP may have `.` or `resume` as its observed root. Because that structure cannot establish its domain, it requires `--acknowledge-subset` after reviewing its origin. Do not use this flag to bypass an unknown full-hosting wrapper. Full hosting archives with unrelated domains never gain a site-only fallback.

## Limits and what this proves

Bounds allow the observed roughly 64 MiB static site: 1 GiB compressed archive, 2 GiB total expansion/declared contents, 20,000 entries, 128 MiB per file, and 200 MiB/5,000 files for the selected site. Compression ratios and extended TAR metadata are bounded. Unsafe/truncated paths, links/junctions, special/sparse entries, encryption, duplicate/case-colliding paths, and oversized archives are refused. ZIP64 and multipart ZIPs are intentionally unsupported. Obtain a narrower authorised archive if a full-plan archive exceeds the bounds.

Successful local verification establishes selected archive-to-disk file integrity. It does **not** establish snapshot freshness, equality with current live file contents, database/external-storage completeness, server signing/provider keys, a working application, or successful server restoration. Previewing the restored site is a separate verification step; this tool starts no server/browser and makes no hosting/API calls. Keep the download, inventory and verification reports private. Do not replace the existing deployment until the required rollback evidence and any separately applicable data backups are available.

## Test the verifier itself

```powershell
python -m unittest discover -s scripts -p test_verify_hostinger_backup.py -v
```

Tests use synthetic ZIP/TAR fixtures under ignored `.runtime/backup-tests`. They cover target-only restore, unrelated-site isolation, site-only acknowledgement, exact account scope, raw ZIP NUL/backslash names, traversal, links, encryption, bombs/size bounds, TAR metadata, corruption, required files, hashes and output guards. See [the sanitized test record](qa/hostinger-backup-verifier-tests.json). Passing these tests is not evidence that a real hosting backup exists.
