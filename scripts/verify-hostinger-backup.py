#!/usr/bin/env python3
"""Inventory a downloaded archive; optionally verify ONLY the observed resume subtree.

No network, Hostinger operation, browser, server restore, or automatic cleanup.
Inventory opens no member payloads. Tar.gz metadata traversal necessarily scans the
compressed stream, but unrelated members are never opened or extracted.
"""
from __future__ import annotations

import argparse
import contextlib
import dataclasses
import datetime as dt
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import re
import stat
import struct
import sys
import tarfile
import unicodedata
import uuid
import zipfile

TARGET_ROOT = "domains/docheng.co.za/public_html/resume"
AUTHORITATIVE_ACCOUNT = "u836398163"
AUTHORITATIVE_ROOTS = (TARGET_ROOT, f"{AUTHORITATIVE_ACCOUNT}/{TARGET_ROOT}", f"home/{AUTHORITATIVE_ACCOUNT}/{TARGET_ROOT}")
CHUNK = 64 * 1024
VERSION = 1


class VerificationError(ValueError):
    pass


@dataclasses.dataclass(frozen=True)
class Limits:
    archive_bytes: int = 1024 * 1024 * 1024
    expanded_bytes: int = 2 * 1024 * 1024 * 1024
    site_bytes: int = 200 * 1024 * 1024
    file_bytes: int = 128 * 1024 * 1024
    entries: int = 20_000
    site_files: int = 5_000
    ratio: int = 200
    central_bytes: int = 16 * 1024 * 1024


@dataclasses.dataclass(frozen=True)
class Entry:
    name: str
    size: int
    directory: bool
    compressed_size: int | None = None


def portable_name(name: str, directory: bool = False) -> str:
    if not isinstance(name, str) or len(name.encode("utf-8")) > 2048:
        raise VerificationError("Archive path exceeds the portable length limit.")
    if "\\" in name or re.search(r"[\x00-\x1f\x7f:]", name) or name.startswith("/"):
        raise VerificationError("Archive contains an absolute, control-character, or ambiguous path.")
    while name.startswith("./"):
        name = name[2:]
    if directory and name in ("", "."):
        return ""
    if directory and name.endswith("/"):
        name = name[:-1]
    parts = name.split("/")
    if any(not part or part in (".", "..") or part.endswith((".", " ")) or re.fullmatch(r"(?i)(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?", part) for part in parts):
        raise VerificationError("Archive contains traversal or a nonportable path.")
    if unicodedata.normalize("NFC", name) != name:
        raise VerificationError("Archive contains a noncanonical Unicode path.")
    return name


def sha_file(filename: Path, limit: int | None = None) -> str:
    digest = hashlib.sha256()
    count = 0
    with filename.open("rb") as stream:
        for chunk in iter(lambda: stream.read(CHUNK), b""):
            count += len(chunk)
            if limit is not None and count > limit:
                raise VerificationError("File grew beyond its bounded read size.")
            digest.update(chunk)
    return digest.hexdigest()


def is_link(filename: Path) -> bool:
    info = filename.lstat()
    return stat.S_ISLNK(info.st_mode) or bool(getattr(info, "st_file_attributes", 0) & 0x400)


def input_archive(filename: Path, limits: Limits) -> Path:
    filename = filename.absolute()
    if not filename.exists() or is_link(filename) or not filename.is_file():
        raise VerificationError("Choose an ordinary local downloaded archive, not a link or directory.")
    if filename.stat().st_size > limits.archive_bytes:
        raise VerificationError("Compressed archive exceeds the 1 GiB input limit; obtain a narrower site archive.")
    return filename.resolve()


def zip_preflight(filename: Path, limits: Limits) -> None:
    size = filename.stat().st_size
    with filename.open("rb") as stream:
        stream.seek(max(0, size - 65557))
        tail = stream.read(65557)
    offset = tail.rfind(b"PK\x05\x06")
    if offset < 0 or len(tail) - offset < 22:
        raise VerificationError("ZIP directory record is missing.")
    fields = struct.unpack("<4s4H2LH", tail[offset:offset + 22])
    _, disk, directory_disk, disk_count, count, directory_size, directory_offset, comment_length = fields
    if offset + 22 + comment_length != len(tail):
        raise VerificationError("ZIP has an ambiguous or trailing directory record.")
    if disk or directory_disk or disk_count != count or count == 65535 or directory_size == 0xFFFFFFFF or directory_offset == 0xFFFFFFFF:
        raise VerificationError("Multipart and ZIP64 archives are outside this bounded verifier.")
    if count > limits.entries or directory_size > limits.central_bytes:
        raise VerificationError("ZIP metadata exceeds the entry or directory-size limit.")
    if directory_offset + directory_size > size:
        raise VerificationError("ZIP directory points outside the archive.")


class BoundedExpandedReader:
    def __init__(self, stream, compressed_size: int, limits: Limits):
        self.stream, self.limits, self.total = stream, limits, 0
        self.ratio_limit = max(1024 * 1024, compressed_size * limits.ratio)

    def read(self, size=-1):
        if size < 0 or size > CHUNK:
            size = CHUNK
        data = self.stream.read(size)
        self.total += len(data)
        if self.total > self.limits.expanded_bytes or self.total > self.ratio_limit:
            raise VerificationError("Expanded gzip data exceeds the size/compression-ratio bound.")
        return data


def bounded_tar_info(limits: Limits):
    """Bound extended-header allocation before stdlib TAR metadata processing."""
    class BoundedTarInfo(tarfile.TarInfo):
        def _proc_member(self, archive):
            archive._backup_header_count = getattr(archive, "_backup_header_count", 0) + 1
            if archive._backup_header_count > limits.entries:
                raise VerificationError("TAR header count exceeds the limit.")
            metadata = self.type in (tarfile.XHDTYPE, tarfile.XGLTYPE, tarfile.SOLARIS_XHDTYPE, tarfile.GNUTYPE_LONGNAME)
            if self.type not in (tarfile.REGTYPE, tarfile.AREGTYPE, tarfile.DIRTYPE) and not metadata:
                raise VerificationError("TAR links and special entries are refused before processing.")
            if self.size < 0 or self.size > (CHUNK if metadata else limits.file_bytes):
                raise VerificationError("TAR member or extended metadata exceeds its size bound.")
            depth = getattr(archive, "_backup_metadata_depth", 0)
            if metadata and depth >= 32:
                raise VerificationError("Nested TAR extended metadata exceeds the bound.")
            archive._backup_metadata_depth = depth + int(metadata)
            try:
                return super()._proc_member(archive)
            finally:
                archive._backup_metadata_depth = depth

        def _proc_gnusparse_00(self, *args):
            raise VerificationError("Sparse TAR metadata is refused.")

        _proc_gnusparse_01 = _proc_gnusparse_00
        _proc_gnusparse_10 = _proc_gnusparse_00
        _proc_sparse = _proc_gnusparse_00

    return BoundedTarInfo


class Archive:
    def __init__(self, filename: Path, limits: Limits):
        self.filename, self.limits = filename, limits
        self.stack = contextlib.ExitStack()
        self.expanded = None

    def __enter__(self):
        try:
            with self.filename.open("rb") as stream:
                magic = stream.read(4)
            if magic.startswith(b"PK"):
                zip_preflight(self.filename, self.limits)
                self.kind = "zip"
                self.source = self.stack.enter_context(zipfile.ZipFile(self.filename))
                if len(self.source.infolist()) > self.limits.entries:
                    raise VerificationError("ZIP entry count exceeds the limit.")
            elif magic.startswith(b"\x1f\x8b"):
                self.kind = "tar.gz"
                raw = self.stack.enter_context(self.filename.open("rb"))
                zipped = self.stack.enter_context(gzip.GzipFile(fileobj=raw))
                self.expanded = BoundedExpandedReader(zipped, self.filename.stat().st_size, self.limits)
                self.source = self.stack.enter_context(tarfile.open(fileobj=self.expanded, mode="r|", tarinfo=bounded_tar_info(self.limits)))
            else:
                raise VerificationError("Only ZIP and gzip-compressed TAR archives are accepted.")
            return self
        except BaseException:
            self.stack.close()
            raise

    def __exit__(self, *args):
        self.stack.__exit__(*args)

    def members(self):
        source = self.source.infolist() if self.kind == "zip" else self.source
        for count, item in enumerate(source, 1):
            if count > self.limits.entries:
                raise VerificationError("Archive entry count exceeds the limit.")
            if self.kind == "zip":
                if item.orig_filename != item.filename:
                    raise VerificationError("ZIP filename was normalized or truncated; ambiguous names are refused.")
                mode = item.external_attr >> 16
                file_type = stat.S_IFMT(mode)
                if item.flag_bits & 1 or item.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED):
                    raise VerificationError("Encrypted or unsupported ZIP compression is refused.")
                if file_type not in (0, stat.S_IFREG, stat.S_IFDIR):
                    raise VerificationError("ZIP links and special files are refused.")
                directory = item.is_dir() or file_type == stat.S_IFDIR
                if directory and file_type == stat.S_IFREG:
                    raise VerificationError("ZIP file/directory metadata conflicts.")
                size, compressed, original_name = item.file_size, item.compress_size, item.orig_filename
                if size > max(CHUNK, compressed * self.limits.ratio):
                    raise VerificationError("ZIP member compression ratio exceeds the bound.")
            else:
                if not (item.isfile() or item.isdir()) or item.issparse() or any("sparse" in key.lower() for key in item.pax_headers):
                    raise VerificationError("TAR links, sparse entries, and special files are refused.")
                directory, size, compressed, original_name = item.isdir(), item.size, None, item.name
            name = portable_name(original_name, directory)
            if not name:
                continue
            if size < 0 or (directory and size):
                raise VerificationError("Archive entry has invalid size metadata.")
            if size > self.limits.file_bytes:
                raise VerificationError("An archive member exceeds the 128 MiB file bound.")
            yield Entry(name, size, directory, compressed), item
        if self.expanded:
            # Complete gzip trailer/CRC validation, under the same expansion bound.
            while self.expanded.read(CHUNK):
                pass

    def open_member(self, item):
        if self.kind == "zip":
            return self.source.open(item, "r")
        stream = self.source.extractfile(item)
        if stream is None:
            raise VerificationError("Selected TAR file has no payload.")
        return stream


def validate_entries(entries: list[Entry], limits: Limits) -> None:
    if len(entries) > limits.entries or sum(entry.size for entry in entries) > limits.expanded_bytes:
        raise VerificationError("Archive exceeds total entry/declared-size limits.")
    seen = {}
    for entry in entries:
        folded = entry.name.casefold()
        if folded in seen:
            raise VerificationError("Archive has duplicate or case-colliding paths.")
        seen[folded] = entry
    for entry in entries:
        parts = entry.name.split("/")
        for end in range(1, len(parts)):
            parent = seen.get("/".join(parts[:end]).casefold())
            if parent and not parent.directory:
                raise VerificationError("Archive file is also used as a parent directory.")


def relative_to_root(name: str, root: str) -> str | None:
    if root == ".":
        return name
    return name[len(root) + 1:] if name.startswith(root + "/") else None


def selected_files(entries: list[Entry], root: str, limits: Limits) -> dict[str, Entry]:
    chosen = {}
    for entry in entries:
        relative = relative_to_root(entry.name, root)
        if relative and not entry.directory:
            chosen[relative] = entry
    if len(chosen) > limits.site_files or sum(entry.size for entry in chosen.values()) > limits.site_bytes:
        raise VerificationError("Selected site exceeds 5,000 files or 200 MiB; no restore was attempted.")
    return chosen


def static_tree_check(chosen: dict[str, Entry]) -> None:
    for required in ("index.html", ".htaccess"):
        if required not in chosen or chosen[required].size == 0:
            raise VerificationError(f"Selected site is missing nonempty {required}.")
    if not any(name.startswith("_next/") and name.endswith((".js", ".css")) and entry.size for name, entry in chosen.items()):
        raise VerificationError("Selected site is missing nonempty _next JavaScript/CSS assets.")


def candidates(entries: list[Entry], limits: Limits) -> list[dict]:
    roots = {root for root in AUTHORITATIVE_ROOTS if any(entry.name == root or entry.name.startswith(root + "/") for entry in entries)}
    looks_like_full_host = False
    for entry in entries:
        parts = tuple(entry.name.split("/"))
        for start in range(len(parts)):
            if start + 2 < len(parts) and parts[start] == "domains" and parts[start + 2] == "public_html":
                looks_like_full_host = True
    result = []
    for root in sorted(roots):
        chosen = selected_files(entries, root, limits)
        result.append({"path": root, "identity": "authoritative-domain-path", "files": len(chosen), "bytes": sum(entry.size for entry in chosen.values())})
    # A site-only export lacks domain provenance. Never infer a subset from a full hosting archive.
    if not result and not looks_like_full_host:
        for root in (".", "resume", "public_html/resume"):
            chosen = selected_files(entries, root, limits)
            if len(chosen) != sum(not entry.directory for entry in entries):
                continue
            try:
                static_tree_check(chosen)
            except VerificationError:
                continue
            result.append({"path": root, "identity": "unproven-site-only-subset", "files": len(chosen), "bytes": sum(entry.size for entry in chosen.values())})
    return result


def inventory(filename: Path, limits: Limits = Limits()) -> tuple[dict, list[Entry]]:
    filename = input_archive(filename, limits)
    archive_hash = sha_file(filename, limits.archive_bytes)
    entries = []
    with Archive(filename, limits) as archive:
        kind = archive.kind
        total = 0
        for entry, _ in archive.members():
            entries.append(entry)
            total += entry.size
            if len(entries) > limits.entries or total > limits.expanded_bytes:
                raise VerificationError("Archive exceeds the total entry or declared-size bound.")
    validate_entries(entries, limits)
    roots = candidates(entries, limits)
    target_members = [dataclasses.asdict(entry) for entry in entries if any(relative_to_root(entry.name, root["path"]) is not None or entry.name == root["path"] for root in roots)]
    report = {
        "backupInventoryVersion": VERSION, "observedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "archive": {"name": filename.name, "bytes": filename.stat().st_size, "sha256": archive_hash, "format": kind},
        "authoritativeSiteRoot": TARGET_ROOT, "authoritativeAccount": AUTHORITATIVE_ACCOUNT, "limits": dataclasses.asdict(limits),
        "entryCount": len(entries), "declaredBytes": sum(entry.size for entry in entries), "candidates": roots,
        "targetMembers": target_members, "unrelatedEntryCount": len(entries) - len(target_members),
        "memberPayloadsOpened": 0,
        "notice": "Inventory is metadata only. Unrelated member contents are not opened, extracted, or verified. No Hostinger backup or server restoration has been performed.",
    }
    return report, entries


def guarded_path(workspace: Path, filename: Path) -> Path:
    workspace = workspace.resolve()
    absolute = filename.absolute()
    if not absolute.is_relative_to(workspace / ".runtime" / "backup-verify"):
        raise VerificationError("Output/report path must stay inside .runtime/backup-verify.")
    current = workspace
    for part in absolute.relative_to(workspace).parts:
        current /= part
        if current.exists() or current.is_symlink():
            if is_link(current):
                raise VerificationError("Output/report path contains a symlink or junction.")
    if not absolute.resolve().is_relative_to(workspace / ".runtime" / "backup-verify"):
        raise VerificationError("Resolved output/report path escapes the workspace.")
    return absolute


def fresh_directory(workspace: Path, prefix: str) -> Path:
    workspace = workspace.resolve()
    ignored = workspace / ".gitignore"
    if not ignored.is_file() or not any(line.strip() in (".runtime/", "/.runtime/") for line in ignored.read_text(encoding="utf-8").splitlines()):
        raise VerificationError("The workspace must ignore .runtime/ before writing verification files.")
    base = guarded_path(workspace, workspace / ".runtime" / "backup-verify")
    base.mkdir(parents=True, exist_ok=True, mode=0o700)
    guarded_path(workspace, base)
    result = guarded_path(workspace, base / f"{prefix}-{dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:12]}")
    result.mkdir(mode=0o700, exist_ok=False)
    return result


def record_inventory(report: dict, workspace: Path) -> Path:
    directory = fresh_directory(workspace, "inventory")
    filename = directory / "inventory.json"
    with filename.open("x", encoding="utf-8") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    return filename


def observed_selection(report: dict, report_file: Path, root: str, acknowledge_subset: bool, workspace: Path) -> dict:
    filename = guarded_path(workspace, report_file)
    if not filename.is_file() or filename.stat().st_size > 16 * 1024 * 1024:
        raise VerificationError("Choose a prior bounded inventory report recorded by this tool.")
    recorded = json.loads(filename.read_text(encoding="utf-8"))
    for key in ("backupInventoryVersion", "archive", "authoritativeSiteRoot", "authoritativeAccount", "candidates", "targetMembers"):
        if recorded.get(key) != report.get(key):
            raise VerificationError("Recorded inventory does not match this exact archive and observed target tree.")
    candidate = next((candidate for candidate in report["candidates"] if candidate["path"] == root), None)
    if candidate is None:
        raise VerificationError("Site root was not observed as a permitted candidate. Copy an exact inventory path; do not choose another site.")
    if candidate["identity"] != "authoritative-domain-path" and not acknowledge_subset:
        raise VerificationError("Site-only archive identity is unproven. Review its origin and explicitly use --acknowledge-subset.")
    return candidate


def expected_tree(filename: Path | None) -> dict[str, dict] | None:
    if filename is None:
        return None
    if not filename.is_file() or filename.stat().st_size > 4 * 1024 * 1024:
        raise VerificationError("Expected tree must be a JSON file below 4 MiB.")
    data = json.loads(filename.read_text(encoding="utf-8"))
    files = data.get("files") if isinstance(data, dict) else data
    if not isinstance(files, list) or len(files) > 5000:
        raise VerificationError("Expected tree needs a bounded files array.")
    result = {}
    for item in files:
        item = {"path": item} if isinstance(item, str) else item
        if not isinstance(item, dict) or not isinstance(item.get("path"), str):
            raise VerificationError("Expected tree contains an invalid file entry.")
        name = portable_name(item["path"])
        if name in result:
            raise VerificationError("Expected tree contains duplicate files.")
        size = item.get("bytes", item.get("size"))
        digest = item.get("sha256")
        if size is not None and (type(size) is not int or size < 0):
            raise VerificationError("Expected tree contains an invalid file size.")
        if digest is not None and (not isinstance(digest, str) or not re.fullmatch(r"[a-f0-9]{64}", digest)):
            raise VerificationError("Expected tree contains an invalid SHA256.")
        result[name] = {"bytes": size, "sha256": digest}
    return result


def verify_selected(filename: Path, report_file: Path, root: str, workspace: Path, *, acknowledge_subset=False, expected=None, limits=Limits()) -> dict:
    filename = input_archive(filename, limits)
    report, entries = inventory(filename, limits)
    candidate = observed_selection(report, report_file, root, acknowledge_subset, workspace)
    chosen = selected_files(entries, root, limits)
    static_tree_check(chosen)
    if expected is not None and set(expected) != set(chosen):
        raise VerificationError("Archive site file tree differs from the supplied authoritative expected tree.")
    directory = fresh_directory(workspace, "restore")
    site = guarded_path(workspace, directory / "site")
    site.mkdir(mode=0o700)
    result = {"verified": False, "archive": report["archive"], "siteRoot": root, "identity": candidate["identity"], "restoreDirectory": str(site), "files": []}
    try:
        with Archive(filename, limits) as archive:
            for entry, member in archive.members():
                relative = relative_to_root(entry.name, root)
                if not relative or entry.directory:
                    continue
                if relative not in chosen:
                    raise VerificationError("Archive member tree changed during verification.")
                destination = guarded_path(workspace, site.joinpath(*relative.split("/")))
                if not destination.resolve().is_relative_to(site.resolve()):
                    raise VerificationError("Selected destination escaped the fresh site directory.")
                destination.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
                guarded_path(workspace, destination)
                digest, count = hashlib.sha256(), 0
                flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_BINARY", 0)
                with archive.open_member(member) as source, os.fdopen(os.open(destination, flags, 0o600), "wb") as target:
                    while chunk := source.read(CHUNK):
                        count += len(chunk)
                        if count > entry.size or count > limits.file_bytes:
                            raise VerificationError("Selected payload exceeds declared/bounded size.")
                        digest.update(chunk)
                        target.write(chunk)
                if count != entry.size or destination.stat().st_size != count or sha_file(destination, limits.file_bytes) != digest.hexdigest():
                    raise VerificationError("Restored file size/hash differs from its archive payload.")
                if expected is not None:
                    wanted = expected[relative]
                    if wanted.get("bytes") is not None and wanted["bytes"] != count or wanted.get("sha256") is not None and wanted["sha256"] != digest.hexdigest():
                        raise VerificationError("Restored file differs from the supplied authoritative size/hash.")
                result["files"].append({"path": relative, "bytes": count, "sha256": digest.hexdigest()})
        actual = set()
        for parent, dirs, files in os.walk(site, followlinks=False):
            for name in dirs + files:
                member = Path(parent) / name
                guarded_path(workspace, member)
                if is_link(member):
                    raise VerificationError("Unexpected link appeared in the restored tree.")
            actual.update((Path(parent) / name).relative_to(site).as_posix() for name in files)
        if actual != set(chosen) or len(result["files"]) != len(chosen):
            raise VerificationError("Local restored file tree differs from the selected archive tree.")
        if sha_file(filename, limits.archive_bytes) != report["archive"]["sha256"]:
            raise VerificationError("Archive changed during verification.")
        result.update(verified=True, fileCount=len(actual), totalBytes=sum(item["bytes"] for item in result["files"]), verifiedAt=dt.datetime.now(dt.timezone.utc).isoformat(), expectedTreeProvided=expected is not None)
        result["limitations"] = [
            "Local selected-file restoration only; no Hostinger/server restore or preview was performed.",
            "Does not establish snapshot freshness, live production equality, databases, external storage, or server signing/provider keys.",
            "Unrelated archive member payloads were not opened, extracted, hashed, or verified.",
            "Static files were not executed; application behavior and production rollback readiness need separate checks.",
        ]
    except BaseException as exc:
        result["error"] = str(exc)
        raise
    finally:
        with (directory / "verification.json").open("x", encoding="utf-8") as stream:
            json.dump(result, stream, indent=2)
            stream.write("\n")
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--record-inventory", action="store_true", help="Record metadata in a new ignored workspace directory; default only prints inventory.")
    parser.add_argument("--site-root", help="Exact candidate path from an observed inventory; never a server filesystem destination.")
    parser.add_argument("--inventory-report", type=Path, help="Previously recorded inventory.json bound to this exact archive.")
    parser.add_argument("--restore-selected", action="store_true", help="Verify only the selected site into a fresh local ignored directory.")
    parser.add_argument("--acknowledge-subset", action="store_true", help="Acknowledge that a site-only archive cannot prove its domain identity.")
    parser.add_argument("--expected-tree", type=Path, help="Optional authoritative regular-file path/size/SHA256 JSON list.")
    args = parser.parse_args(argv)
    workspace = Path(__file__).resolve().parent.parent
    try:
        if args.record_inventory and args.site_root:
            raise VerificationError("Record the initial inventory before selecting a site.")
        if args.site_root:
            if not args.inventory_report:
                raise VerificationError("Observe and record inventory first; --site-root requires --inventory-report.")
            root = "." if args.site_root == "." else portable_name(args.site_root, True)
            if args.restore_selected:
                result = verify_selected(args.archive, args.inventory_report, root, workspace, acknowledge_subset=args.acknowledge_subset, expected=expected_tree(args.expected_tree))
            else:
                result, _ = inventory(args.archive)
                result["selected"] = observed_selection(result, args.inventory_report, root, args.acknowledge_subset, workspace)
                result["restored"] = False
        else:
            if args.restore_selected or args.inventory_report or args.expected_tree or args.acknowledge_subset:
                raise VerificationError("Selection/restore options require an observed --site-root.")
            result, _ = inventory(args.archive)
        if args.record_inventory:
            result["inventoryReport"] = str(record_inventory(result, workspace))
        print(json.dumps(result, indent=2))
        return 0
    except (VerificationError, OSError, EOFError, UnicodeError, OverflowError, RecursionError, zipfile.BadZipFile, tarfile.TarError, json.JSONDecodeError, struct.error) as exc:
        print(f"Backup verification stopped: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
