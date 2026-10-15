#!/usr/bin/env python3
"""Explicitly scoped live stateless QA using one small synthetic resume.

Run from the project Python environment (PyMuPDF verifies selectable PDF text).
This never configures hosting, calls AI/providers, saves/deletes records, uploads
real documents, or accepts redirects. It contacts only the approved HTTPS API.
The separate low-memory verifier retains its loopback-only restriction.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import io
import json
import re
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import xml.etree.ElementTree as ET
import zipfile

APPROVED_HOST = "careerforge-resume-api-free.onrender.com"
CANONICAL_ORIGIN = "https://resume.docheng.co.za"
SYNTHETIC = """John Smith
john.smith@example.test
SUMMARY
Software engineer building reliable Python services.
EXPERIENCE
Senior Engineer at Microsoft
2021 - Present
- Built reliable Python APIs and improved automated testing.
EDUCATION
BSc Computer Science
University of Oxford
2018
SKILLS
Python, SQL, Docker
"""


def validate_target(base_url, origin):
    target = urllib.parse.urlsplit(base_url)
    if (target.scheme != "https" or target.hostname != APPROVED_HOST or target.port is not None
            or target.username or target.password or target.path not in {"", "/"} or target.query or target.fragment):
        raise ValueError("Use only the explicitly approved HTTPS API origin without credentials, port or path")
    if origin != CANONICAL_ORIGIN:
        raise ValueError("This verifier requires the exact canonical frontend Origin")
    return base_url.rstrip("/")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, file, code, message, headers, new_url):
        return None


class Probe:
    def __init__(self, base_url, origin, expected_revision):
        if not re.fullmatch(r"[a-f0-9]{40}", expected_revision):
            raise ValueError("Supply the exact 40-character live revision verified by native deployment diagnostics")
        self.base_url, self.origin = validate_target(base_url, origin), origin
        self.opener = urllib.request.build_opener(NoRedirect())
        self.last_request = 0.0
        self.result = {"status": "FAIL", "startedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
                       "baseUrl": self.base_url, "canonicalOrigin": origin,
                       "reportedLiveDeploymentRevision": expected_revision,
                       "revisionEvidence": "Parent verified the live Render deployment natively; /api/health does not expose its commit.",
                       "fixture": {"syntheticOnly": True, "utf8Bytes": len(SYNTHETIC.encode()), "realPrivateDataUsed": False},
                       "requests": [], "checks": [], "findings": [], "exports": []}

    def request(self, path, *, method="GET", data=None, headers=None, expected=200, personal=False):
        if not path.startswith("/api/") or len(self.result["requests"]) >= 20:
            raise RuntimeError("Probe request/path bound exceeded")
        time.sleep(max(0.0, 1.5 - (time.monotonic() - self.last_request)))
        request_headers = {"Origin": self.origin, "User-Agent": "CareerForge-Synthetic-Stateless-QA/1"}
        request_headers.update(headers or {})
        if isinstance(data, dict):
            data = json.dumps(data).encode()
            request_headers["Content-Type"] = "application/json"
        self.last_request = time.monotonic()
        start = self.last_request
        request = urllib.request.Request(self.base_url + path, data=data, headers=request_headers, method=method)
        try:
            response = self.opener.open(request, timeout=90)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            body = response.read(2 * 1024 * 1024 + 1)
            if len(body) > 2 * 1024 * 1024:
                raise RuntimeError("Synthetic response unexpectedly exceeds 2 MiB")
            keys = ("Content-Type", "Content-Disposition", "Cache-Control", "Access-Control-Allow-Origin",
                    "Access-Control-Allow-Credentials", "Access-Control-Allow-Methods", "Access-Control-Allow-Headers",
                    "Access-Control-Expose-Headers", "Vary", "CF-Cache-Status")
            record = {"method": method, "path": path, "requestOrigin": request_headers["Origin"],
                      "status": response.status, "seconds": round(time.monotonic() - start, 3),
                      "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest(),
                      "setCookiePresent": response.headers.get("Set-Cookie") is not None,
                      "headers": {key: response.headers[key] for key in keys if key in response.headers}}
            if personal:
                record["explicitNoStore"] = "no-store" in response.headers.get("Cache-Control", "").lower()
                if not record["explicitNoStore"]:
                    self.result["findings"].append({"path": path, "issue": "Personal document response lacks explicit Cache-Control: no-store", "observedCacheControl": response.headers.get("Cache-Control")})
            self.result["requests"].append(record)
            if response.status != expected:
                raise AssertionError(f"{method} {path} returned {response.status}; expected {expected}")
            return body, response.headers

    def check(self, name, action):
        try:
            details = action()
            self.result["checks"].append({"name": name, "passed": True, **({"details": details} if details is not None else {})})
            return details
        except Exception as error:
            self.result["checks"].append({"name": name, "passed": False, "error": str(error)})
            return None

    def multipart(self, path, *, personal=True):
        boundary = "synthetic-resume-probe-boundary"
        data = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="synthetic-resume.txt"\r\nContent-Type: text/plain\r\n\r\n' + SYNTHETIC + f"\r\n--{boundary}--\r\n").encode()
        body, _ = self.request(path, method="POST", data=data, headers={"Content-Type": "multipart/form-data; boundary=" + boundary}, personal=personal)
        return json.loads(body)

    def run(self):
        import pymupdf  # Check this dependency before contacting the live service.
        def health():
            body, _ = self.request("/api/health")
            actual = json.loads(body)
            assert actual["status"] == "healthy" and actual["storage_mode"] == "local"
            assert actual["spacy_model"] == "en_core_web_sm" and actual["server_persistence"] is False
            return actual
        if self.check("live model and stateless health", health) is None:
            raise RuntimeError("Live service identity/mode was not confirmed; no document requests made")
        def preflight():
            _, headers = self.request("/api/exports/resume/pdf", method="OPTIONS", headers={"Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"})
            assert headers["Access-Control-Allow-Origin"] == self.origin
            assert headers["Access-Control-Allow-Credentials"] == "true"
            assert "POST" in headers["Access-Control-Allow-Methods"]
            assert "content-type" in headers["Access-Control-Allow-Headers"].lower()
        self.check("canonical browser CORS preflight", preflight)
        def status():
            body, _ = self.request("/api/workspace")
            value = json.loads(body)
            assert value["mode"] == "local" and value["server_persistence"] is False
            assert value["resume_count"] == value["cover_letter_count"] == 0
            return value
        self.check("workspace status advertises no server persistence", status)
        for route in ("/api/builder/list/all", "/api/cover-letters"):
            self.check("saved-record route unavailable: " + route, lambda route=route: self.request(route, expected=503) and None)
        marker = "CURRENT_LIVE_EXPORT_" + uuid.uuid4().hex
        resume = {"id": None, "title": "Synthetic live QA", "contact": {"full_name": "CURRENT LIVE EXPORT ZOË", "email": "synthetic@example.test"}, "summary": {"summary": marker}}
        def untrusted():
            body, headers = self.request("/api/exports/resume/txt", method="POST", data=resume, headers={"Origin": "https://untrusted.invalid"}, expected=403)
            assert "Untrusted" in json.loads(body)["detail"]
            assert headers.get("Access-Control-Allow-Origin") is None
        self.check("untrusted Origin rejected before export", untrusted)
        def parsed():
            value = self.multipart("/api/parse-resume")
            assert value["name"] == "John Smith" and value["contact"]["email"] == "john.smith@example.test"
            assert "Microsoft" in json.dumps(value)
            return {"realPersonNer": True, "contactPresent": True, "companyPresent": True}
        self.check("actual synthetic TXT parsing and NER", parsed)
        def scored():
            value = self.multipart("/api/score-resume")
            score = value["score"]["overall"]
            assert isinstance(score, (int, float)) and 0 <= score <= 100
            return {"overall": score}
        self.check("actual synthetic scoring", scored)
        def combined():
            value = self.multipart("/api/parse-and-score")
            assert value["resume"]["contact"]["email"] == "john.smith@example.test"
            assert 0 <= value["score"]["overall"] <= 100
            return {"contactPresent": True, "overall": value["score"]["overall"]}
        self.check("actual combined parsing/scoring", combined)
        for route in ("/api/parse-resume", "/api/score-resume", "/api/parse-and-score"):
            def validation_error(route=route):
                body, _ = self.request(route, method="POST", expected=422, personal=True)
                assert json.loads(body)["detail"]
            self.check("JSON validation response: " + route, validation_error)
        def imported():
            value = self.multipart("/api/exports/resume/import")
            assert value["server_persistence"] is False and value["resume"]["id"] is None
            assert value["resume"]["contact"]["full_name"] == "John Smith"
            return {"serverPersistence": False, "serverId": None}
        self.check("memory-only editor import without a saved id", imported)
        for format in ("pdf", "docx", "txt", "json"):
            def exported(format=format):
                body, headers = self.request("/api/exports/resume/" + format, method="POST", data=resume, personal=True)
                assert headers["Access-Control-Allow-Origin"] == self.origin
                assert headers["Access-Control-Allow-Credentials"] == "true"
                assert "Content-Disposition" in headers["Access-Control-Expose-Headers"]
                assert headers["Content-Disposition"].startswith("attachment;")
                record = {"format": format, "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()}
                if format == "pdf":
                    assert headers.get_content_type() == "application/pdf" and body.startswith(b"%PDF-")
                    with pymupdf.open(stream=body, filetype="pdf") as document:
                        text = "\n".join(page.get_text() for page in document)
                        record.update(pages=len(document), selectableTextCharacters=len(text))
                elif format == "docx":
                    assert headers.get_content_type() == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    with zipfile.ZipFile(io.BytesIO(body)) as document:
                        assert document.testzip() is None
                        tree = ET.fromstring(document.read("word/document.xml"))
                        namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                        text = "\n".join("".join(p.itertext()) for p in tree.findall(".//w:p", namespace))
                        record["editableParagraphs"] = len(tree.findall(".//w:p", namespace))
                        assert record["editableParagraphs"] > 0
                elif format == "txt":
                    assert headers.get_content_type() == "text/plain"
                    text = body.decode("utf-8")
                else:
                    value = json.loads(body)
                    assert value["id"] is None
                    text = json.dumps(value, ensure_ascii=False)
                assert marker in text and "CURRENT LIVE EXPORT ZOË" in text
                record.update(currentContentMarker=True, exactUnicodeName=True)
                self.result["exports"].append(record)
            self.check("current-content " + format.upper() + " export", exported)
        self.check("no workspace cookie on any response", lambda: self._no_cookies())
        self.result["requestCount"] = len(self.result["requests"])
        self.result["minimumRequestSpacingSeconds"] = 1.5
        self.result["finishedAt"] = dt.datetime.now(dt.timezone.utc).isoformat()
        self.result["status"] = "PASS" if all(item["passed"] for item in self.result["checks"]) and not self.result["findings"] else "FAIL"
        self.result["limitations"] = ["Only small synthetic API requests were used; no model stress or production load claim.", "No AI/provider invocation, hosting change or server record save/delete was performed.", "The probe did not inspect the live filesystem; no persistence is based on health, disabled record routes, memory-only import and reviewed implementation.", "This does not verify the primary frontend cutover or its deployed static assets."]
        return self.result

    def _no_cookies(self):
        assert not any(item["setCookiePresent"] for item in self.result["requests"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--origin", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--expected-revision", required=True, help="Exact live commit independently verified through native deployment diagnostics; not inferred from /health")
    args = parser.parse_args()
    probe = Probe(args.base_url, args.origin, args.expected_revision)
    try:
        result = probe.run()
    except Exception as error:
        result = probe.result
        result["error"] = str(error)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2, ensure_ascii=False)
        stream.write("\n")
    print(json.dumps({"status": result["status"], "requestCount": len(result["requests"]), "checks": result["checks"], "findings": result["findings"], "report": str(args.output)}, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
