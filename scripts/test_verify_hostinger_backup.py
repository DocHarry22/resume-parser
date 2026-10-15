"""Synthetic stdlib fixtures only; never reads or changes a hosting account."""
import contextlib
import dataclasses
import gzip
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import stat
import struct
import sys
import tarfile
import tempfile
import unittest
from unittest import mock
import zipfile

SPEC = importlib.util.spec_from_file_location("hostinger_backup_verifier", Path(__file__).with_name("verify-hostinger-backup.py"))
verifier = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = verifier
SPEC.loader.exec_module(verifier)

PREFIX = "home/u836398163/domains/docheng.co.za/public_html/resume"
SITE = {"index.html": b"<!doctype html><title>fixture</title>", ".htaccess": b"RewriteEngine On\n", "_next/static/main.js": b"console.log('fixture');", "templates/example.pdf": b"%PDF-synthetic-fixture"}


class BackupVerifierTests(unittest.TestCase):
    def setUp(self):
        parent = Path(__file__).resolve().parent.parent / ".runtime" / "backup-tests"
        parent.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(prefix="fixture-", dir=parent)
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.workspace = self.base / "workspace"
        self.workspace.mkdir()
        (self.workspace / ".gitignore").write_text(".runtime/\n", encoding="utf-8")

    def zip(self, files=None, *, root=PREFIX, compression=zipfile.ZIP_DEFLATED, extras=None):
        filename = self.base / f"fixture-{len(list(self.base.glob('*.zip')))}.zip"
        with zipfile.ZipFile(filename, "w", compression=compression) as archive:
            for name, payload in (SITE if files is None else files).items():
                archive.writestr(f"{root}/{name}" if root else name, payload)
            for name, payload in (extras or {}).items():
                archive.writestr(name, payload)
        return filename

    def tar(self, *, extra=None):
        filename = self.base / "fixture.tar.gz"
        with tarfile.open(filename, "w:gz", format=tarfile.PAX_FORMAT) as archive:
            for name, payload in SITE.items():
                member = tarfile.TarInfo(f"{PREFIX}/{name}")
                member.size = len(payload)
                if name == "index.html":
                    member.pax_headers = {"comment": "synthetic fixture"}
                archive.addfile(member, io.BytesIO(payload))
            if extra:
                archive.addfile(extra)
        return filename

    def observe(self, filename):
        report, _ = verifier.inventory(filename)
        return report, verifier.record_inventory(report, self.workspace)

    def test_full_host_inventory_is_read_only_and_opens_no_member_payloads(self):
        filename = self.zip(extras={"domains/unrelated.test/public_html/.env": b"UNRELATED_PRIVATE_CONTENT"})
        with mock.patch.object(zipfile.ZipFile, "open", autospec=True) as member_open:
            report, _ = verifier.inventory(filename)
        member_open.assert_not_called()
        self.assertFalse((self.workspace / ".runtime").exists())
        self.assertEqual(report["candidates"][0]["path"], PREFIX)
        self.assertEqual(report["unrelatedEntryCount"], 1)
        self.assertNotIn("unrelated.test", json.dumps(report))
        self.assertNotIn("UNRELATED_PRIVATE_CONTENT", json.dumps(report))

    def test_selected_zip_restore_matches_archive_hashes_and_ignores_other_sites(self):
        filename = self.zip(extras={"domains/unrelated.test/public_html/index.html": b"unrelated"})
        _, recorded = self.observe(filename)
        opened = []
        original = zipfile.ZipFile.open

        def track(archive, member, *args, **kwargs):
            opened.append(member.filename if isinstance(member, zipfile.ZipInfo) else member)
            return original(archive, member, *args, **kwargs)

        with mock.patch.object(zipfile.ZipFile, "open", track):
            result = verifier.verify_selected(filename, recorded, PREFIX, self.workspace)
        self.assertTrue(result["verified"])
        self.assertEqual(result["fileCount"], len(SITE))
        self.assertTrue(all(name.startswith(PREFIX + "/") for name in opened))
        restored = Path(result["restoreDirectory"])
        self.assertTrue(restored.resolve().is_relative_to(self.workspace.resolve() / ".runtime" / "backup-verify"))
        for item in result["files"]:
            self.assertEqual((restored / item["path"]).read_bytes(), SITE[item["path"]])
            self.assertEqual(item["sha256"], hashlib.sha256(SITE[item["path"]]).hexdigest())
        again = verifier.verify_selected(filename, recorded, PREFIX, self.workspace)
        self.assertNotEqual(result["restoreDirectory"], again["restoreDirectory"])

    def test_tar_gzip_pax_paths_restore_without_opening_unrelated_payloads(self):
        filename = self.tar()
        with tarfile.open(filename, "r:gz") as archive:
            self.assertTrue(any(member.pax_headers for member in archive))
        _, recorded = self.observe(filename)
        calls = []
        original = tarfile.TarFile.extractfile

        def track(archive, member, *args, **kwargs):
            calls.append(member.name)
            return original(archive, member, *args, **kwargs)

        with mock.patch.object(tarfile.TarFile, "extractfile", track):
            result = verifier.verify_selected(filename, recorded, PREFIX, self.workspace)
        self.assertTrue(result["verified"])
        self.assertEqual(len(calls), len(SITE))
        self.assertTrue(all(name.startswith(PREFIX + "/") for name in calls))

    def test_subset_requires_separate_observation_and_identity_acknowledgement(self):
        filename = self.zip(root="")
        report, recorded = self.observe(filename)
        self.assertEqual(report["candidates"][0]["identity"], "unproven-site-only-subset")
        with self.assertRaisesRegex(verifier.VerificationError, "acknowledge"):
            verifier.verify_selected(filename, recorded, ".", self.workspace)
        result = verifier.verify_selected(filename, recorded, ".", self.workspace, acknowledge_subset=True)
        self.assertTrue(result["verified"])
        full_other = self.zip(root="", extras={"domains/unrelated.test/public_html/index.html": b"other"})
        self.assertEqual(verifier.inventory(full_other)[0]["candidates"], [])

    def test_only_observed_domain_under_known_account_wrappers_is_authoritative(self):
        for root in verifier.AUTHORITATIVE_ROOTS:
            with self.subTest(valid_root=root):
                self.assertEqual(verifier.inventory(self.zip(root=root))[0]["candidates"][0]["path"], root)
        for root in ("domains/unrelated.example/public_html/" + verifier.TARGET_ROOT, "home/u123/" + verifier.TARGET_ROOT, "unknown-wrapper/" + verifier.TARGET_ROOT):
            with self.subTest(rejected_root=root):
                self.assertEqual(verifier.inventory(self.zip(root=root))[0]["candidates"], [])

    def test_selection_requires_exact_prior_inventory_not_an_arbitrary_site(self):
        filename = self.zip()
        _, recorded = self.observe(filename)
        with self.assertRaisesRegex(verifier.VerificationError, "not observed"):
            verifier.verify_selected(filename, recorded, "domains/unrelated.test/public_html", self.workspace)
        changed = json.loads(recorded.read_text(encoding="utf-8"))
        changed["archive"]["sha256"] = "0" * 64
        recorded.write_text(json.dumps(changed), encoding="utf-8")
        with self.assertRaisesRegex(verifier.VerificationError, "does not match"):
            verifier.verify_selected(filename, recorded, PREFIX, self.workspace)
        errors = io.StringIO()
        with contextlib.redirect_stderr(errors):
            self.assertEqual(verifier.main([str(filename), "--site-root", PREFIX]), 1)
        self.assertIn("inventory first", errors.getvalue())

    def test_required_tree_and_optional_authoritative_manifest(self):
        for missing in ("index.html", ".htaccess", "_next/static/main.js"):
            with self.subTest(missing=missing):
                filename = self.zip({name: content for name, content in SITE.items() if name != missing})
                _, recorded = self.observe(filename)
                with self.assertRaisesRegex(verifier.VerificationError, "missing"):
                    verifier.verify_selected(filename, recorded, PREFIX, self.workspace)
        filename = self.zip()
        _, recorded = self.observe(filename)
        expected = {name: {"bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()} for name, content in SITE.items()}
        self.assertTrue(verifier.verify_selected(filename, recorded, PREFIX, self.workspace, expected=expected)["expectedTreeProvided"])
        with self.assertRaisesRegex(verifier.VerificationError, "file tree differs"):
            verifier.verify_selected(filename, recorded, PREFIX, self.workspace, expected={"index.html": {}})

    def test_unsafe_paths_duplicate_paths_and_file_directory_conflicts(self):
        for bad in ("../escape", "/absolute", "C:/absolute", "folder\\file", "folder/../escape", "folder/NUL.txt"):
            with self.subTest(path=bad):
                archive = self.zip(extras={bad.replace("\\", "X"): b"unsafe"})
                if "\\" in bad:
                    archive.write_bytes(archive.read_bytes().replace(bad.replace("\\", "X").encode(), bad.encode()))
                with self.assertRaises(verifier.VerificationError):
                    verifier.inventory(archive)
        with self.assertRaisesRegex(verifier.VerificationError, "colliding"):
            verifier.inventory(self.zip(extras={PREFIX + "/INDEX.html": b"duplicate"}))
        with self.assertRaisesRegex(verifier.VerificationError, "parent directory"):
            verifier.inventory(self.zip(extras={PREFIX + "/_next": b"file"}))

    def test_embedded_nul_in_zip_raw_names_cannot_spoof_required_files(self):
        filename = self.zip({"index.htmlXsuffix": b"spoof", ".htaccess": SITE[".htaccess"], "_next/static/main.js": SITE["_next/static/main.js"]})
        filename.write_bytes(filename.read_bytes().replace(b"index.htmlXsuffix", b"index.html\x00suffix"))
        with zipfile.ZipFile(filename) as archive:
            self.assertIn("\x00", archive.infolist()[0].orig_filename)
        with self.assertRaisesRegex(verifier.VerificationError, "normalized or truncated"):
            verifier.inventory(filename)

    def test_zip_symlink_and_tar_hardlink_are_rejected_even_outside_target(self):
        filename = self.zip()
        with zipfile.ZipFile(filename, "a") as archive:
            link = zipfile.ZipInfo("domains/unrelated.test/public_html/link")
            link.create_system = 3
            link.external_attr = (stat.S_IFLNK | 0o777) << 16
            archive.writestr(link, "../../secret")
        with self.assertRaisesRegex(verifier.VerificationError, "links"):
            verifier.inventory(filename)
        hardlink = tarfile.TarInfo("domains/unrelated.test/public_html/link")
        hardlink.type, hardlink.linkname = tarfile.LNKTYPE, "../../secret"
        with self.assertRaisesRegex(verifier.VerificationError, "links"):
            verifier.inventory(self.tar(extra=hardlink))

    def test_encryption_compression_bombs_and_size_bounds(self):
        filename = self.zip()
        raw = bytearray(filename.read_bytes())
        for offset in (raw.index(b"PK\x03\x04") + 6, raw.index(b"PK\x01\x02") + 8):
            struct.pack_into("<H", raw, offset, struct.unpack_from("<H", raw, offset)[0] | 1)
        filename.write_bytes(raw)
        with self.assertRaisesRegex(verifier.VerificationError, "Encrypted"):
            verifier.inventory(filename)
        with self.assertRaisesRegex(verifier.VerificationError, "compression ratio"):
            verifier.inventory(self.zip(extras={PREFIX + "/bomb.txt": b"0" * 100_000}))
        normal = self.zip()
        for limits in (dataclasses.replace(verifier.Limits(), archive_bytes=8), dataclasses.replace(verifier.Limits(), entries=2), dataclasses.replace(verifier.Limits(), file_bytes=16), dataclasses.replace(verifier.Limits(), site_bytes=16)):
            with self.subTest(limits=limits), self.assertRaises(verifier.VerificationError):
                verifier.inventory(normal, limits)

    def test_bounded_tar_metadata_and_gzip_crc(self):
        filename = self.base / "oversized-metadata.tar.gz"
        metadata = tarfile.TarInfo("extended")
        metadata.type, metadata.size = tarfile.XHDTYPE, verifier.CHUNK + 1
        filename.write_bytes(gzip.compress(metadata.tobuf() + b"x" * metadata.size + b"\0" * 2048))
        with self.assertRaisesRegex(verifier.VerificationError, "metadata exceeds"):
            verifier.inventory(filename)
        filename = self.tar()
        raw = bytearray(filename.read_bytes())
        raw[-8] ^= 1
        filename.write_bytes(raw)
        with self.assertRaises((OSError, EOFError, verifier.VerificationError)):
            verifier.inventory(filename)

    def test_output_guards_refuse_escape_and_linked_workspace_directories(self):
        with self.assertRaisesRegex(verifier.VerificationError, "must stay inside"):
            verifier.guarded_path(self.workspace, self.base / "outside")
        runtime = self.workspace / ".runtime" / "backup-verify"
        runtime.mkdir(parents=True)
        original = verifier.is_link
        with mock.patch.object(verifier, "is_link", side_effect=lambda filename: filename == runtime or original(filename)):
            with self.assertRaisesRegex(verifier.VerificationError, "symlink or junction"):
                verifier.fresh_directory(self.workspace, "restore")
        self.assertEqual(list(runtime.iterdir()), [])

    def test_corrupt_selected_payload_never_claims_verified_restore(self):
        filename = self.zip(compression=zipfile.ZIP_STORED)
        with zipfile.ZipFile(filename) as archive:
            info = archive.getinfo(PREFIX + "/index.html")
            raw = bytearray(filename.read_bytes())
            name_length, extra_length = struct.unpack_from("<HH", raw, info.header_offset + 26)
            raw[info.header_offset + 30 + name_length + extra_length] ^= 1
        filename.write_bytes(raw)
        _, recorded = self.observe(filename)
        with self.assertRaises(zipfile.BadZipFile):
            verifier.verify_selected(filename, recorded, PREFIX, self.workspace)
        reports = list((self.workspace / ".runtime" / "backup-verify").glob("restore-*/verification.json"))
        self.assertEqual(len(reports), 1)
        self.assertFalse(json.loads(reports[0].read_text(encoding="utf-8"))["verified"])


if __name__ == "__main__":
    unittest.main()
