"""Synthetic stateless API/profile checks; no external account or hosting mutation.

--container verifies the owned CI fixture's real 512 MiB/no-extra-swap/0.1 CPU
limits and cgroup peak. Without it this is API behavior only, not a Linux memory
claim. --windows-probe measures a separate local process, never the live server.
"""
from __future__ import annotations
import argparse
import base64
import ctypes
import importlib.metadata
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
import zlib

PHRASE = "Alex Morgan builds Python services at Example Limited. "
LARGE_TEXT = PHRASE * 1000  # Exactly 55,000 characters, below the profile's 60k cap.
TYPICAL = """John Smith
john.smith@example.test
SUMMARY
Software engineer building dependable Python services.
EXPERIENCE
Senior Engineer at Microsoft
2021 - Present
- Built reliable Python APIs and improved testing for product releases.
EDUCATION
BSc Computer Science
University of Oxford
2018
SKILLS
Python, SQL, Docker
"""
MARKER = "END_LOW_MEMORY_SENTINEL"
LIMIT = 512 * 1024 * 1024


def docker(*arguments):
    return subprocess.check_output(["docker", *arguments], text=True, timeout=90).strip()


def container_state(name):
    state = json.loads(docker("inspect", name))[0]
    suffix = name.removeprefix("careerforge-low-memory-api-")
    assert state["Config"]["Labels"].get("careerforge-low-memory-run") == suffix, "Container is not this owned CI fixture"
    limits = state["HostConfig"]
    assert limits["Memory"] == LIMIT and limits["MemorySwap"] == LIMIT, "512 MiB with no additional swap required"
    assert limits["NanoCpus"] == 100_000_000, "Exactly 0.1 CPU required"
    assert "SPACY_MODEL=en_core_web_sm" in state["Config"]["Env"]
    assert "STORAGE_MODE=local" in state["Config"]["Env"]
    assert state["State"]["Running"] and not state["State"]["OOMKilled"], "Fixture stopped or was OOM killed"
    return {"memoryBytes": limits["Memory"], "memorySwapBytes": limits["MemorySwap"], "nanoCpus": limits["NanoCpus"], "oomKilled": state["State"]["OOMKilled"]}


def memory_sample(name, stage):
    # A small stdlib-only probe avoids loading a second NLP model in the server's cgroup.
    code = """import json,pathlib,importlib.metadata as m
root=pathlib.Path('/sys/fs/cgroup')
def number(paths):
 for p in paths:
  if p.is_file(): return int(p.read_text().strip())
 raise RuntimeError('No supported cgroup memory counter')
print(json.dumps({'currentBytes':number([root/'memory.current',root/'memory/memory.usage_in_bytes']),'peakBytes':number([root/'memory.peak',root/'memory/memory.max_usage_in_bytes']),'smallModelVersion':m.version('en-core-web-sm'),'privateDataFileCount':sum(p.is_file() for p in pathlib.Path('/var/lib/resume-parser').rglob('*'))}))
"""
    result = json.loads(docker("exec", name, "python", "-c", code))
    assert result["smallModelVersion"] == "3.7.1"
    assert result["privateDataFileCount"] == 0, "Stateless processor wrote private persistent data"
    assert 0 < result["peakBytes"] <= LIMIT, "Memory peak exceeds fixture's hard bound"
    return {"stage": stage, **result}


class Session:
    def __init__(self, base):
        self.base = base
        self.opener = urllib.request.build_opener()

    def request(self, path, *, method="GET", data=None, content_type=None, expected=200):
        headers = {}
        if isinstance(data, dict):
            data, content_type = json.dumps(data).encode(), "application/json"
        if content_type:
            headers["Content-Type"] = content_type
        start = time.monotonic()
        request = urllib.request.Request(self.base + path, data=data, method=method, headers=headers)
        try:
            response = self.opener.open(request, timeout=180)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            body = response.read(5 * 1024 * 1024 + 1)
            assert len(body) <= 5 * 1024 * 1024
            assert response.status == expected, f"{method} {path}: {response.status}, expected {expected}: {body[:200]!r}"
            assert response.headers.get("Set-Cookie") is None, "Stateless profile unexpectedly minted a guest cookie"
            return body, response.headers, round(time.monotonic() - start, 3)

    def json(self, path, **kwargs):
        body, _, duration = self.request(path, **kwargs)
        return json.loads(body), duration

    def file(self, path, content, *, expected=200):
        boundary = "low-memory-fixture-boundary"
        body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="fixture.txt"\r\nContent-Type: text/plain\r\n\r\n' + content + f"\r\n--{boundary}--\r\n").encode()
        return self.json(path, method="POST", data=body, content_type=f"multipart/form-data; boundary={boundary}", expected=expected)


def pdf_streams(data):
    for match in re.finditer(rb"stream\r?\n(.*?)endstream", data, re.S):
        stream = match.group(1).rstrip(b"\r\n")
        try:
            if stream.endswith(b"~>"):
                stream = base64.a85decode(stream, adobe=True)
            yield zlib.decompress(stream)
        except (ValueError, zlib.error):
            continue


def exports(session, resume, *, large=False):
    results = []
    for format in ("pdf", "docx", "txt", "json"):
        body, headers, duration = session.request("/api/exports/resume/" + format, method="POST", data=resume)
        if format == "pdf":
            assert headers.get_content_type() == "application/pdf" and body.startswith(b"%PDF-") and body.rstrip().endswith(b"%%EOF")
            assert MARKER.encode() in b"\n".join(pdf_streams(body)), "PDF lost the final content marker"
            pages = len(re.findall(rb"/Type\s*/Page\b", body))
            assert pages >= (2 if large else 1)
        elif format == "docx":
            with zipfile.ZipFile(io.BytesIO(body)) as document:
                assert document.testzip() is None
                text = document.read("word/document.xml").decode()
                assert MARKER in text and (not large or PHRASE in text)
        elif format == "txt":
            assert MARKER in body.decode() and (not large or PHRASE in body.decode())
        else:
            assert MARKER in json.dumps(json.loads(body))
        results.append({"format": format, "bytes": len(body), "seconds": duration, **({"pages": pages} if format == "pdf" else {})})
    return results


def api_probe(args):
    session = Session(args.base_url.rstrip("/"))
    result = {"status": "FAIL", "scope": "Synthetic stateless behavior; Linux resource limit verified only when container supplied", "containerResourceLimitVerified": bool(args.container), "memorySamples": [], "checks": []}
    def sample(stage):
        if args.container:
            result["memorySamples"].append(memory_sample(args.container, stage))
    try:
        if args.container:
            result["limits"] = container_state(args.container)
        deadline = time.monotonic() + 240
        while True:
            try:
                health, _ = session.json("/api/health")
                assert health["status"] == "healthy"
                assert health["storage_mode"] == "local" and health["server_persistence"] is False
                assert health["spacy_model"] == "en_core_web_sm"
                result["health"] = health
                break
            except (OSError, ValueError, AssertionError):
                if time.monotonic() >= deadline:
                    raise RuntimeError("Stateless fixture failed to start within 240 seconds")
                time.sleep(2)
        sample("ready")
        status, _ = session.json("/api/workspace")
        assert status["mode"] == "local"
        session.request("/api/builder/create", method="POST", expected=503)
        session.request("/api/cover-letters", expected=503)
        session.request("/api/workspace", method="DELETE", expected=503)
        result["checks"].append("local storage mode rejects server records and never sets guest cookies")
        parsed, seconds = session.file("/api/parse-resume", TYPICAL)
        assert parsed["name"] == "John Smith", "Real PERSON NER extraction failed"
        assert parsed["contact"]["email"] == "john.smith@example.test"
        assert "Microsoft" in json.dumps(parsed)
        result["typicalParseSeconds"] = seconds
        scored, seconds = session.file("/api/score-resume", TYPICAL)
        assert isinstance(scored["score"]["overall"], (int, float)) and 0 <= scored["score"]["overall"] <= 100
        result["typicalScoreSeconds"] = seconds
        imported, seconds = session.file("/api/exports/resume/import", TYPICAL)
        resume = imported["resume"]
        assert imported["server_persistence"] is False and resume["id"] is None
        assert resume["contact"]["full_name"] == "John Smith"
        resume["summary"] = {"summary": "Synthetic resume " + MARKER}
        result["typicalExports"] = exports(session, resume)
        result["checks"].append("typical TXT parsing, NER, scoring, stateless builder import and four genuine exports")
        sample("after typical parse/score/exports")
        large, seconds = session.file("/api/parse-resume", LARGE_TEXT)
        assert LARGE_TEXT.strip() in large["raw_text"]
        result["largeParse"] = {"characters": len(LARGE_TEXT), "seconds": seconds}
        resume["custom_sections"] = {"Synthetic stress fixture": LARGE_TEXT + MARKER}
        result["largeExports"] = exports(session, resume, large=True)
        result["checks"].append("55,000-character TXT parse and multipage PDF/editable DOCX/TXT/JSON retain final marker")
        over = LARGE_TEXT + "x" * (60_001 - len(LARGE_TEXT))
        rejected, _ = session.file("/api/parse-resume", over, expected=422)
        assert "detail" in rejected
        result["checks"].append("document over configured 60,000-character cap rejected")
        sample("after 55k parse/exports")
        if args.container:
            result["limitsAfter"] = container_state(args.container)
            log = docker("logs", args.container)
            assert "Loaded spaCy model: en_core_web_sm" in log
            result["modelProof"] = {"startupLogNamesSmallModel": True, "realPersonNer": True, "secondModelProcessLoaded": False}
        result["status"] = "PASS"
    except BaseException as error:
        result["error"] = str(error)
        raise
    finally:
        if args.container:
            try:
                sample("final diagnostic")
            except Exception as error:
                result["memoryProbeError"] = str(error)
        emit(result, args.output)
    return result


def windows_probe(args):
    if sys.platform != "win32":
        raise RuntimeError("Windows evidence probe requires Windows; use real cgroup CI for Linux")
    from ctypes import wintypes
    class Memory(ctypes.Structure):
        _fields_ = [("cb", wintypes.DWORD), ("PageFaultCount", wintypes.DWORD)] + [(name, ctypes.c_size_t) for name in ("PeakWorkingSetSize", "WorkingSetSize", "QuotaPeakPagedPoolUsage", "QuotaPagedPoolUsage", "QuotaPeakNonPagedPoolUsage", "QuotaNonPagedPoolUsage", "PagefileUsage", "PeakPagefileUsage", "PrivateUsage")]
    ctypes.windll.kernel32.GetCurrentProcess.restype = wintypes.HANDLE
    ctypes.windll.psapi.GetProcessMemoryInfo.argtypes = [wintypes.HANDLE, ctypes.POINTER(Memory), wintypes.DWORD]
    samples = []
    def sample(stage):
        memory = Memory(); memory.cb = ctypes.sizeof(memory)
        assert ctypes.windll.psapi.GetProcessMemoryInfo(ctypes.windll.kernel32.GetCurrentProcess(), ctypes.byref(memory), memory.cb)
        samples.append({"stage": stage, "rssMiB": round(memory.WorkingSetSize / 1048576, 1), "peakRssMiB": round(memory.PeakWorkingSetSize / 1048576, 1), "privateCommitMiB": round(memory.PrivateUsage / 1048576, 1)})
    sample("fresh script process")
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    import app.main
    from app.services.nlp_service import get_nlp_service
    nlp = get_nlp_service().nlp
    sample("app imports and model loaded")
    nlp(PHRASE * 200)
    sample("after 11,000-character synthetic text")
    nlp(LARGE_TEXT)
    sample("after 55,000-character synthetic text")
    result = {"scope": "Windows local process only; not a Linux container limit or throughput test", "command": sys.executable + " scripts/low-memory-smoke.py --windows-probe", "sourceRevision": subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip(), "sourceFilesSha256": {name: hashlib.sha256((Path(__file__).resolve().parent.parent / name).read_bytes()).hexdigest() for name in ("scripts/low-memory-smoke.py", "app/main.py", "app/core/config.py", "app/services/nlp_service.py", "app/services/parsing_service.py", "app/services/scoring_service.py", "requirements.txt")}, "environment": {key: os.environ.get(key) for key in ("SPACY_MODEL", "STORAGE_MODE", "OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS")}, "model": nlp.meta["name"], "modelVersion": nlp.meta["version"], "modelVectorsShape": list(nlp.vocab.vectors.data.shape), "samples": samples, "fixture": {"phrase": PHRASE, "repetitions": 1000, "largeCharacters": len(LARGE_TEXT), "privateDataUsed": False}}
    emit(result, args.output)
    return result


def emit(result, output):
    text = json.dumps(result, indent=2) + "\n"
    if output:
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("x", encoding="utf-8") as stream:
            stream.write(text)
    print(text)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:18002")
    parser.add_argument("--container")
    parser.add_argument("--windows-probe", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.windows_probe:
        windows_probe(args)
        return
    target = urllib.parse.urlsplit(args.base_url)
    if target.scheme != "http" or target.hostname not in {"127.0.0.1", "localhost", "::1"} or target.username or target.password or target.path not in {"", "/"} or target.query or target.fragment:
        parser.error("Only loopback HTTP fixture origins are allowed")
    if args.container and not re.fullmatch(r"careerforge-low-memory-api-[0-9]+-[0-9]+", args.container):
        parser.error("Only the owned disposable low-memory CI naming convention is accepted")
    api_probe(args)


if __name__ == "__main__":
    main()
