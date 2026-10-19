"""Document-derived JSON is never cacheable in guest or browser-local mode."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from app.api.routes import router, parsing_service
from app.core.config import settings
from app.core.workspaces import DocumentResponsePrivacyMiddleware, WorkspaceMiddleware
from app.main import app

PATHS = ('/api/parse-resume', '/api/score-resume', '/api/parse-and-score')
RESUME = b'John Smith\njohn.smith@example.test\nSUMMARY\nSoftware engineer building reliable Python services.\nSKILLS\nPython, SQL, Docker\n'


@pytest.fixture(params=('guest', 'local'))
def profile(request, monkeypatch, tmp_path):
    monkeypatch.setattr(settings, 'storage_mode', request.param)
    monkeypatch.setattr(settings, 'data_dir', str(tmp_path))
    monkeypatch.setattr(settings, 'taxonomy_dir', str(Path(__file__).resolve().parent.parent / 'data'))
    monkeypatch.setattr(settings, 'rate_limit_requests', 1000)
    monkeypatch.setattr(settings, 'max_concurrent_processing', 0)
    return request.param


@pytest.mark.parametrize('path', PATHS)
def test_real_document_routes_and_json_errors_are_no_store(profile, path, monkeypatch, tmp_path):
    client = TestClient(app)
    success = client.post(path, files={'file': ('synthetic.txt', RESUME, 'text/plain')})
    assert success.status_code == 200
    assert success.headers['cache-control'] == 'no-store'
    assert success.headers['content-type'].startswith('application/json')
    assert 'set-cookie' not in success.headers
    assert success.json()

    missing = client.post(path)
    malformed = client.post(path, files={'file': ('invalid.txt', b'\xff\xfe', 'text/plain')})
    for result in (missing, malformed):
        assert result.status_code == 422
        assert result.headers['cache-control'] == 'no-store'
        assert result.json()['detail']

    def unavailable(*args, **kwargs):
        raise RuntimeError('Synthetic parser failure')
    monkeypatch.setattr(parsing_service, 'parse_resume', unavailable)
    failed = client.post(path, files={'file': ('synthetic.txt', RESUME, 'text/plain')})
    assert failed.status_code == 500
    assert failed.headers['cache-control'] == 'no-store'
    assert failed.json()['detail'] == 'Unable to process resume'
    assert list(tmp_path.iterdir()) == []


def test_early_body_rejection_is_no_store_for_each_document_route(profile, monkeypatch):
    monkeypatch.setattr(settings, 'max_file_size_mb', 0)
    client = TestClient(app)
    for path in PATHS:
        rejected = client.post(path, content=b'x' * (1024 * 1024 + 1))
        assert rejected.status_code == 413
        assert rejected.headers['cache-control'] == 'no-store'
        assert rejected.json()['detail']


def test_early_rate_rejection_is_no_store_for_each_document_route(profile, monkeypatch):
    monkeypatch.setattr(settings, 'rate_limit_requests', 1)
    for path in PATHS:
        isolated = FastAPI()
        isolated.include_router(router, prefix='/api')
        isolated.add_middleware(WorkspaceMiddleware)
        isolated.add_middleware(DocumentResponsePrivacyMiddleware)
        client = TestClient(isolated)
        first = client.post(path)
        assert first.status_code == 422 and first.headers['cache-control'] == 'no-store'
        rejected = client.post(path)
        assert rejected.status_code == 429
        assert rejected.headers['cache-control'] == 'no-store'
        assert rejected.json()['detail']


def test_health_and_public_metadata_headers_stay_unchanged(profile):
    client = TestClient(app)
    for path in ('/api/health', '/api/'):
        response = client.get(path)
        assert 'cache-control' not in response.headers
