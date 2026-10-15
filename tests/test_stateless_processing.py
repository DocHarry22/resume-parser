"""Browser-local processing never creates a server document or session."""
import asyncio
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

import fitz
import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings, settings
from app.core.workspaces import ProcessingLimitMiddleware, RequestBodyLimitMiddleware, WorkspaceMiddleware
from app.api.stateless_routes import router


@pytest.fixture
def local_app(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "storage_mode", "local")
    monkeypatch.setattr(settings, "data_dir", str(tmp_path))
    monkeypatch.setattr(settings, "taxonomy_dir", str(Path(__file__).resolve().parent.parent / "data"))
    monkeypatch.setattr(settings, "rate_limit_requests", 1000)
    monkeypatch.setattr(settings, "max_concurrent_processing", 1)
    app = FastAPI()
    app.add_middleware(RequestBodyLimitMiddleware)
    app.add_middleware(WorkspaceMiddleware)
    app.add_middleware(ProcessingLimitMiddleware)
    app.include_router(router, prefix="/api")
    return app


@pytest.mark.parametrize("method,path", [
    ("get", "/api/builder/list/all"), ("post", "/api/builder/create"),
    ("get", "/api/cover-letters"), ("post", "/api/cover-letters"),
    ("get", "/api/workspace/export"), ("delete", "/api/workspace"),
    ("get", "/api/ai/status"), ("post", "/api/ai/rewrite"),
])
def test_record_and_paid_ai_routes_are_disabled_without_writes(local_app, tmp_path, method, path):
    response = getattr(TestClient(local_app), method)(path)
    assert response.status_code == 503
    assert "set-cookie" not in response.headers
    assert response.headers["cache-control"] == "no-store"
    assert list(tmp_path.iterdir()) == []


def test_workspace_status_is_explicitly_device_only(local_app, tmp_path):
    client = TestClient(local_app)
    result = client.get("/api/workspace")
    assert result.json()["mode"] == "local"
    assert result.json()["server_persistence"] is False
    assert not client.cookies and "set-cookie" not in result.headers
    assert list(tmp_path.iterdir()) == []


def test_real_resume_exports_contain_current_content_without_storage(local_app, tmp_path):
    client = TestClient(local_app)
    payload = {"id": "../../not-a-record", "title": "Current résumé", "contact": {"full_name": "Zoë Botha"},
               "summary": {"summary": "CURRENT CONTENT SENTINEL"},
               "custom_sections": {"Registration": "ECSA candidate; supplied by the applicant"}}
    for format in ("pdf", "docx", "txt", "json"):
        result = client.post(f"/api/exports/resume/{format}", json=payload)
        assert result.status_code == 200
        assert result.headers["cache-control"] == "no-store"
        assert "set-cookie" not in result.headers
        if format == "pdf":
            with fitz.open(stream=result.content, filetype="pdf") as document:
                text = "".join(page.get_text() for page in document)
                assert "CURRENT CONTENT SENTINEL" in text and "ECSA candidate" in text
        elif format == "docx":
            with ZipFile(BytesIO(result.content)) as document:
                assert document.testzip() is None
                assert b"CURRENT CONTENT SENTINEL" in document.read("word/document.xml")
        elif format == "txt":
            assert "CURRENT CONTENT SENTINEL" in result.text
        else:
            assert result.json()["summary"]["summary"] == "CURRENT CONTENT SENTINEL"
    assert list(tmp_path.iterdir()) == [] and not client.cookies


def test_import_returns_editable_builder_without_creating_records(local_app, tmp_path):
    client = TestClient(local_app)
    text = b"Alex Morgan\nalex.morgan@example.test\nSUMMARY\nSoftware engineer building Python services.\nSKILLS\nPython, Docker, SQL\n"
    result = client.post("/api/exports/resume/import", files={"file": ("cv.txt", text, "text/plain")})
    assert result.status_code == 200
    assert result.json()["server_persistence"] is False
    resume = result.json()["resume"]
    assert resume["id"] is None and resume["contact"]["email"] == "alex.morgan@example.test"
    resume["summary"] = {"summary": "REVIEWED IMPORT"}
    assert "REVIEWED IMPORT" in client.post("/api/exports/resume/txt", json=resume).text
    assert not client.cookies and list(tmp_path.iterdir()) == []


def test_letter_exports_and_guidance_do_not_use_saved_records_or_provider(local_app, tmp_path, monkeypatch):
    async def forbidden_provider(*args, **kwargs):
        raise AssertionError("No paid provider may be called")
    monkeypatch.setattr("app.services.writing_provider.rewrite_text", forbidden_provider)
    client = TestClient(local_app)
    letter = {"title": "Current letter", "sender": {"full_name": "Alex Morgan"},
              "content": {"opening_paragraph": "LETTER CURRENT SENTINEL", "body_paragraphs": ["My supplied experience."]}}
    for format in ("pdf", "docx", "txt"):
        result = client.post(f"/api/exports/cover-letter/{format}", json=letter)
        assert result.status_code == 200 and result.headers["cache-control"] == "no-store"
        if format == "pdf":
            with fitz.open(stream=result.content, filetype="pdf") as document:
                assert "LETTER CURRENT SENTINEL" in "".join(page.get_text() for page in document)
        elif format == "docx":
            with ZipFile(BytesIO(result.content)) as document:
                assert b"LETTER CURRENT SENTINEL" in document.read("word/document.xml")
        else:
            assert "LETTER CURRENT SENTINEL" in result.text
    guidance = {"section": "opening", "job_title": "Engineer", "experience_summary": "I build Python services.", "use_ai": False}
    result = client.post("/api/exports/cover-letter/guidance", json=guidance)
    assert result.status_code == 200 and result.json()["provider"] == "guided"
    assert client.post("/api/exports/cover-letter/guidance", json={**guidance, "use_ai": True}).status_code == 503
    assert client.get("/api/exports/cover-letter/templates").status_code == 200
    assert not client.cookies and list(tmp_path.iterdir()) == []


def test_processing_rejects_bad_origin_unsupported_format_and_oversized_content(local_app, monkeypatch):
    client = TestClient(local_app)
    assert client.post("/api/exports/resume/txt", json={}, headers={"Origin": "https://evil.invalid"}).status_code == 403
    assert client.post("/api/exports/resume/exe", json={}).status_code == 422
    assert client.post("/api/exports/resume/pdf?page_size=bad", json={}).status_code == 422
    monkeypatch.setattr(settings, "max_extracted_characters", 1000)
    assert client.post("/api/exports/resume/pdf", json={"summary": {"summary": "a" * 1001}}).status_code == 413
    assert client.post("/api/exports/resume/txt", content=b"x" * (256 * 1024 + 1), headers={"Content-Type": "application/json"}).status_code == 413


def test_import_constraints_apply_before_nlp(local_app, monkeypatch):
    import app.utils.document_loader as loader
    monkeypatch.setattr(loader, "MAX_EXTRACTED_CHARACTERS", 1000)
    client = TestClient(local_app)
    result = client.post("/api/exports/resume/import", files={"file": ("long.txt", b"x" * 1001, "text/plain")})
    assert result.status_code == 422
    assert "too much text" in result.text
    assert client.post("/api/exports/resume/import", files={"file": ("fake.pdf", b"not a pdf", "application/pdf")}).status_code == 422


def test_pdf_pages_and_docx_expansion_are_bounded_before_parsing(local_app, monkeypatch):
    client = TestClient(local_app)
    monkeypatch.setattr(settings, "max_pdf_pages", 2)
    with fitz.open() as document:
        for _ in range(3):
            document.new_page()
        result = client.post("/api/exports/resume/import", files={"file": ("long.pdf", document.tobytes(), "application/pdf")})
    assert result.status_code == 422 and "2 pages" in result.text
    monkeypatch.setattr(settings, "max_docx_expanded_mb", 1)
    stream = BytesIO()
    with ZipFile(stream, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", "fixture")
        archive.writestr("word/document.xml", b"x" * (1024 * 1024 + 1))
    result = client.post("/api/exports/resume/import", files={"file": ("large.docx", stream.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})
    assert result.status_code == 422 and "too large to extract" in result.text


def test_job_description_cannot_bypass_text_limit_before_nlp(local_app, monkeypatch):
    from app.api import routes
    local_app.include_router(routes.router, prefix="/api")
    monkeypatch.setattr(settings, "max_extracted_characters", 1000)
    def forbidden_parse(*args, **kwargs):
        raise AssertionError("Oversized job description reached NLP")
    monkeypatch.setattr(routes.parsing_service, "parse_resume", forbidden_parse)
    client = TestClient(local_app)
    for path in ("score-resume", "parse-and-score"):
        result = client.post(f"/api/{path}", files={"file": ("cv.txt", b"Alex Morgan\nPython engineer", "text/plain")},
                             data={"job_description": "x" * 1001})
        assert result.status_code == 413 and "job description is too long" in result.text


def test_numeric_custom_entries_cannot_bypass_export_allocation_bounds(local_app, monkeypatch):
    def forbidden_export(*args, **kwargs):
        raise AssertionError("Unbounded structure reached the rendering engine")
    monkeypatch.setattr("app.api.stateless_routes.export_resume", forbidden_export)
    client = TestClient(local_app)
    for values in ([0] * 100_000, [True] * 2001, [""] * 2001):
        response = client.post("/api/exports/resume/pdf", json={"custom_sections": {"values": values}})
        assert response.status_code == 413


def test_pdf_text_limit_applies_before_nlp(local_app, monkeypatch):
    monkeypatch.setattr(settings, "max_extracted_characters", 1000)
    def forbidden_parse(*args, **kwargs):
        raise AssertionError("Overlong PDF reached NLP")
    monkeypatch.setattr("app.services.parsing_service.ParsingService.parse_resume", forbidden_parse)
    with fitz.open() as document:
        page = document.new_page()
        page.insert_textbox(fitz.Rect(10, 10, 580, 820), "Resume content " * 120, fontsize=6)
        response = TestClient(local_app).post("/api/exports/resume/import", files={"file": ("long.pdf", document.tobytes(), "application/pdf")})
    assert response.status_code == 422 and "too much text" in response.text


def test_stateless_routes_require_the_explicit_local_profile(local_app, monkeypatch):
    monkeypatch.setattr(settings, "storage_mode", "guest")
    def forbidden_export(*args, **kwargs):
        raise AssertionError("Local-only processing exposed on the guest profile")
    monkeypatch.setattr("app.api.stateless_routes.export_resume", forbidden_export)
    response = TestClient(local_app).post("/api/exports/resume/pdf", json={})
    assert response.status_code == 503 and "set-cookie" not in response.headers


@pytest.mark.asyncio
async def test_incomplete_upload_times_out_and_releases_processing_slot(monkeypatch):
    monkeypatch.setattr(settings, "max_concurrent_processing", 1)
    monkeypatch.setattr(settings, "request_body_timeout_seconds", 0.02)
    app = FastAPI()
    app.add_middleware(RequestBodyLimitMiddleware)
    app.add_middleware(ProcessingLimitMiddleware)
    @app.post("/api/job")
    async def job():
        return {"complete": True}
    async def slow_body():
        await asyncio.sleep(0.2)
        yield b"{}"
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/job", content=slow_body())
        assert response.status_code == 408
        assert (await client.post("/api/job", json={})).status_code == 200


@pytest.mark.asyncio
async def test_busy_processor_rejects_second_job_but_allows_health_and_recovers(monkeypatch):
    monkeypatch.setattr(settings, "max_concurrent_processing", 1)
    app = FastAPI()
    app.add_middleware(ProcessingLimitMiddleware)
    started, release = asyncio.Event(), asyncio.Event()

    @app.post("/api/job")
    async def job():
        started.set()
        await release.wait()
        return {"complete": True}

    @app.get("/api/health")
    async def health():
        return {"status": "healthy"}

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        first = asyncio.create_task(client.post("/api/job"))
        await asyncio.wait_for(started.wait(), timeout=2)
        try:
            second = await client.post("/api/job")
            assert second.status_code == 429 and second.headers["retry-after"] == "10"
            assert (await client.get("/api/health")).status_code == 200
        finally:
            release.set()
            assert (await first).status_code == 200
        assert (await client.post("/api/job")).status_code == 200


@pytest.mark.asyncio
async def test_processing_slot_remains_held_after_response_body_until_asgi_finalization(monkeypatch):
    monkeypatch.setattr(settings, "max_concurrent_processing", 1)
    delivered, finalize = asyncio.Event(), asyncio.Event()

    async def inner(scope, receive, send):
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": b"complete", "more_body": False})
        delivered.set()
        await finalize.wait()  # Models upload/middleware cleanup after delivery.

    guard = ProcessingLimitMiddleware(inner)
    scope = {"type": "http", "method": "POST", "path": "/api/exports/resume/pdf"}
    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}
    messages = []
    async def send(message):
        messages.append(message)
    first = asyncio.create_task(guard(scope, receive, send))
    await asyncio.wait_for(delivered.wait(), timeout=2)
    try:
        assert guard.active == 1 and not first.done()
        messages.clear()
        await guard(scope, receive, send)
        assert messages[0]["status"] == 429
        assert (b"retry-after", b"10") in messages[0]["headers"]
        assert guard.active == 1
    finally:
        finalize.set()
        await first
    assert guard.active == 0
    messages.clear()
    await guard(scope, receive, send)
    assert messages[0]["status"] == 200 and guard.active == 0


def test_local_processing_settings_are_bounded():
    for field, value in (("storage_mode", "unknown"), ("max_extracted_characters", 999_999), ("max_pdf_pages", 101),
                         ("max_docx_expanded_mb", 101), ("max_concurrent_processing", -1)):
        with pytest.raises(ValueError):
            Settings(_env_file=None, **{field: value})
