"""Exercise disposable local backend fixtures using only the Python standard library.

CI passes --restart-container to verify persistence across a real process restart.
Without that flag this verifies API behavior only, not a container or its image.
Only loopback HTTP targets are accepted; every created guest workspace is cleaned up.
"""
import argparse
import http.cookiejar
import io
import json
import re
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile


class Session:
    def __init__(self, base_url):
        self.base_url = base_url
        self.cookies = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))

    def request(self, path, method="GET", data=None, content_type=None, expected=200, headers=None):
        request_headers = dict(headers or {})
        if isinstance(data, dict):
            data = json.dumps(data).encode("utf-8")
            content_type = "application/json"
        if content_type:
            request_headers["Content-Type"] = content_type
        request = urllib.request.Request(self.base_url + path, data=data, method=method, headers=request_headers)
        try:
            response = self.opener.open(request, timeout=30)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            body = response.read(5 * 1024 * 1024 + 1)
            assert len(body) <= 5 * 1024 * 1024, "Unexpectedly large fixture response"
            assert response.status == expected, f"{method} {path}: expected {expected}, got {response.status}: {body[:300]!r}"
            return body, response.headers

    def json(self, path, **kwargs):
        return json.loads(self.request(path, **kwargs)[0])


def wait_for_health(session):
    deadline = time.monotonic() + 150
    while True:
        try:
            assert session.json("/api/health")["status"] == "healthy"
            return
        except (OSError, AssertionError, ValueError) as error:
            if time.monotonic() >= deadline:
                raise RuntimeError("Backend did not become healthy within 150 seconds") from error
            time.sleep(1)


def check_exports(session, resume_id, marker):
    prefix = f"/api/builder/{resume_id}/export/"
    pdf, headers = session.request(prefix + "pdf")
    assert headers.get_content_type() == "application/pdf"
    assert pdf.startswith(b"%PDF-") and pdf.rstrip().endswith(b"%%EOF") and len(pdf) > 1000
    docx, headers = session.request(prefix + "docx")
    assert headers.get_content_type() == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    with zipfile.ZipFile(io.BytesIO(docx)) as document:
        assert document.testzip() is None
        assert marker in document.read("word/document.xml").decode("utf-8")
    text, headers = session.request(prefix + "txt")
    assert headers.get_content_type() == "text/plain" and marker in text.decode("utf-8")
    assert marker == session.json(prefix + "json")["summary"]["summary"]


def run(base_url, container):
    first, second = Session(base_url), Session(base_url)
    checks = []
    marker = "CONTAINER SMOKE " + uuid.uuid4().hex
    try:
        wait_for_health(first)
        checks.append("health")
        for guest in (first, second):
            assert guest.json("/api/workspace")["resume_count"] == 0
            cookie = next(cookie for cookie in guest.cookies if cookie.name == "docheng_workspace")
            assert cookie.path == "/api" and cookie.has_nonstandard_attr("HttpOnly")
            assert not cookie.secure, "Loopback CI fixture must use COOKIE_SECURE=false"
        assert list(first.cookies)[0].value != list(second.cookies)[0].value
        checks.append("separate signed HttpOnly guest cookies")

        # Parsing exercises the preloaded NLP model and the packaged taxonomy files.
        boundary = "fixture" + uuid.uuid4().hex
        resume_text = "Alex Morgan\nalex.morgan@example.test\nSUMMARY\nSoftware engineer building Python services.\nSKILLS\nPython, Docker, SQL\nEXPERIENCE\nEngineer at Example Ltd\n2020 - Present\nBuilt reliable APIs.\n"
        multipart = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="fixture.txt"\r\nContent-Type: text/plain\r\n\r\n' + resume_text + f"\r\n--{boundary}--\r\n").encode()
        parsed = first.json("/api/parse-resume", method="POST", data=multipart, content_type=f"multipart/form-data; boundary={boundary}")
        assert parsed["contact"]["email"] == "alex.morgan@example.test"
        assert "Python" in json.dumps(parsed)
        checks.append("real TXT parsing with packaged NLP and taxonomies")

        created = first.json("/api/builder/create", method="POST", data=b"title=Container+fixture", content_type="application/x-www-form-urlencoded")["resume"]
        resume_id = created["id"]
        path = "/api/builder/" + urllib.parse.quote(resume_id, safe="")
        update = {"contact": {"full_name": "Container Candidate", "email": "fixture@example.test"}, "summary": {"summary": marker}}
        assert first.json(path, method="PATCH", data=update)["resume"]["summary"]["summary"] == marker
        first.json(path + "/save", method="POST")
        assert first.json("/api/workspace")["resume_count"] == 1
        checks.append("create, edit, save and list")

        second.request(path, expected=404)
        second.request(path, method="PATCH", data=update, expected=404)
        second.request(path + "/export/pdf", expected=404)
        second.request(path, method="DELETE", expected=404)
        assert second.json("/api/builder/list/all")["count"] == 0
        first.request(path, method="PATCH", data=update, headers={"Origin": "https://untrusted.invalid"}, expected=403)
        checks.append("cross-cookie read/write/export/delete isolation and Origin rejection")
        check_exports(first, resume_id, marker)
        assert first.json("/api/workspace/export")["resumes"][0]["summary"]["summary"] == marker
        checks.append("PDF, editable OOXML DOCX, TXT, JSON and workspace exports")

        # Keep cookie jars in this process while restarting the entire server process.
        if container:
            subprocess.run(["docker", "restart", container], check=True, stdout=subprocess.DEVNULL, timeout=90)
            wait_for_health(first)
            assert first.json(path)["resume"]["summary"]["summary"] == marker
            second.request(path, expected=404)
            check_exports(first, resume_id, marker)
            checks.append("document and signing key survive container restart; isolation retained")

        second_id = second.json("/api/builder/create", method="POST")["resume"]["id"]
        first.json("/api/workspace", method="DELETE")
        assert not any(cookie.name == "docheng_workspace" for cookie in first.cookies)
        assert first.json("/api/workspace")["resume_count"] == 0
        first.request(path, expected=404)
        assert second.json("/api/builder/" + second_id)["resume"]["id"] == second_id
        second.json("/api/builder/" + second_id, method="DELETE")
        assert second.json("/api/workspace")["resume_count"] == 0
        checks.append("workspace deletion expires cookie and preserves the other guest; document deletion")
        print(json.dumps({"status": "PASS", "container_restart_verified": bool(container), "checks": checks}, indent=2))
    finally:
        for guest in (first, second):
            if any(cookie.name == "docheng_workspace" for cookie in guest.cookies):
                try:
                    guest.json("/api/workspace", method="DELETE")
                except Exception as error:
                    print("Fixture cleanup failed: " + type(error).__name__)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:18001")
    parser.add_argument("--restart-container")
    args = parser.parse_args()
    target = urllib.parse.urlsplit(args.base_url)
    if target.scheme != "http" or target.hostname not in {"127.0.0.1", "localhost", "::1"} or target.username or target.password or target.path not in {"", "/"} or target.query or target.fragment:
        parser.error("Only a loopback HTTP API origin is allowed")
    if args.restart_container and not re.fullmatch(r"careerforge-ci-api-[0-9]+-[0-9]+", args.restart_container):
        parser.error("Restart is restricted to the disposable CI container naming convention")
    run(args.base_url.rstrip("/"), args.restart_container)


if __name__ == "__main__":
    main()
