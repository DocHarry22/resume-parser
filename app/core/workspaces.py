"""Signed guest workspaces and safe per-workspace document paths.

This is durable guest access, not a registration/login system. A workspace is
accessible only while its signed browser cookie is available.
"""
import hashlib
import hmac
import os
import re
import secrets
import time
from contextvars import ContextVar
from collections import OrderedDict, deque
from pathlib import Path

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings

current_workspace: ContextVar[str | None] = ContextVar("workspace", default=None)
COOKIE_NAME = "docheng_workspace"
WORKSPACE_TTL = 365 * 24 * 60 * 60
_ID = re.compile(r"^[a-zA-Z0-9_-]{32,64}$")
_DOCUMENT_ID = re.compile(r"^[a-zA-Z0-9_-]{1,100}$")


def document_path(directory: Path, document_id: str) -> Path:
    """Never interpret an untrusted document ID as a filesystem path."""
    if not _DOCUMENT_ID.fullmatch(document_id):
        raise ValueError("Invalid document ID")
    directory = directory.resolve()
    path = directory / f"{document_id}.json"
    if path.is_symlink() or path.resolve().parent != directory:
        raise ValueError("Invalid document path")
    return path


def workspace_path() -> Path:
    workspace = current_workspace.get()
    if not workspace or not _ID.fullmatch(workspace):
        raise HTTPException(status_code=401, detail="Workspace session required")
    return Path(settings.data_dir) / "workspaces" / workspace


def _secret() -> bytes:
    if settings.workspace_secret:
        if len(settings.workspace_secret) < 32:
            raise RuntimeError("WORKSPACE_SECRET must contain at least 32 characters")
        return settings.workspace_secret.encode()
    # Persist an installation-specific random secret across server restarts.
    path = Path(settings.data_dir) / ".workspace-key"
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        key = path.read_bytes()
        if len(key) < 32:
            raise RuntimeError("Workspace signing key is incomplete or invalid")
        return key
    else:
        key = secrets.token_bytes(48)
        with os.fdopen(fd, "wb") as handle:
            handle.write(key)
        return key


def sign_workspace(workspace: str, secret: bytes, now: int | None = None) -> str:
    payload = f"{workspace}.{int(time.time() if now is None else now)}"
    signature = hmac.new(secret, payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"


def verify_workspace(cookie: str, secret: bytes, now: int | None = None) -> str | None:
    try:
        workspace, issued, signature = cookie.split(".")
        current = int(time.time() if now is None else now)
        if not _ID.fullmatch(workspace) or not 0 <= current - int(issued) <= WORKSPACE_TTL:
            return None
        payload = f"{workspace}.{issued}"
        expected = hmac.new(secret, payload.encode(), hashlib.sha256).hexdigest()
        return workspace if hmac.compare_digest(signature, expected) else None
    except (ValueError, TypeError):
        return None


class WorkspaceMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._requests = OrderedDict()

    def _rate_limited(self, request):
        now = time.monotonic()
        group = "ai" if "/ai/" in request.url.path else "api"
        limit = settings.ai_requests_per_minute if group == "ai" else settings.rate_limit_requests
        host = request.client.host if request.client else "unknown"
        key = (host, group)
        timestamps = self._requests.setdefault(key, deque())
        while timestamps and timestamps[0] <= now - 60:
            timestamps.popleft()
        self._requests.move_to_end(key)
        while len(self._requests) > 10000:
            self._requests.popitem(last=False)
        if len(timestamps) >= limit:
            return True
        timestamps.append(now)
        return False

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/") and request.method not in {"GET", "HEAD", "OPTIONS"}:
            if self._rate_limited(request):
                return JSONResponse({"detail": "Too many requests. Please try again in a minute."},
                                    status_code=429, headers={"Retry-After": "60"})
            try:
                if int(request.headers.get("content-length", "0")) > (settings.max_file_size_mb + 1) * 1024 * 1024:
                    return JSONResponse({"detail": "Request too large"}, status_code=413)
            except ValueError:
                return JSONResponse({"detail": "Invalid content length"}, status_code=400)
        if request.url.path.startswith("/api/exports/"):
            origin = request.headers.get("origin")
            if origin and origin not in settings.cors_origins:
                return JSONResponse({"detail": "Untrusted request origin"}, status_code=403)
            response = await call_next(request)
            response.headers["Cache-Control"] = "no-store"
            return response
        if settings.storage_mode == "local":
            if request.url.path == "/api/workspace" and request.method in {"GET", "HEAD"}:
                return JSONResponse({"mode": "local", "resume_count": 0,
                                     "cover_letter_count": 0, "server_persistence": False,
                                     "notice": "Documents stay in your browser. This API does not save them."},
                                    headers={"Cache-Control": "no-store"})
            if any(request.url.path.startswith(prefix) for prefix in
                   ("/api/builder", "/api/cover-letters", "/api/workspace", "/api/ai")):
                return JSONResponse({"detail": "Server document storage and paid AI are unavailable in browser-local mode."},
                                    status_code=503, headers={"Cache-Control": "no-store"})
        protected = any(
            request.url.path.startswith(prefix)
            for prefix in ("/api/builder", "/api/cover-letters", "/api/workspace", "/api/ai")
        )
        if not protected or request.method == "OPTIONS":
            return await call_next(request)

        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            origin = request.headers.get("origin")
            if origin and origin.rstrip("/") not in settings.cors_origins:
                return JSONResponse({"detail": "Untrusted request origin"}, status_code=403)

        secret = _secret()
        cookie = request.cookies.get(COOKIE_NAME, "")
        workspace = verify_workspace(cookie, secret)
        fresh = workspace is None
        if fresh:
            workspace = secrets.token_urlsafe(32)
        token = current_workspace.set(workspace)
        try:
            response = await call_next(request)
        finally:
            current_workspace.reset(token)
        if fresh:
            response.set_cookie(
                COOKIE_NAME, sign_workspace(workspace, secret), max_age=WORKSPACE_TTL,
                httponly=True, secure=settings.cookie_secure,
                samesite=settings.cookie_samesite, path="/api",
            )
        response.headers["Cache-Control"] = "no-store"
        return response


def enforce_storage_limit(directory: Path, destination: Path, content_size: int):
    """Bound local guest storage. A deployment gateway must also enforce abuse quotas."""
    files = [path for path in directory.glob("*.json") if path != destination]
    if content_size > 1024 * 1024:
        raise HTTPException(status_code=413, detail="Document is too large. Maximum saved size is 1MB.")
    if len(files) >= 100:
        raise HTTPException(status_code=413, detail="This workspace has reached its document limit.")
    scope = directory.parent if current_workspace.get() else directory
    candidates = scope.glob("*/*.json") if current_workspace.get() else scope.glob("*.json")
    stored = sum(path.stat().st_size for path in candidates if path != destination and not path.is_symlink())
    if stored + content_size > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="This workspace has reached its 20MB storage limit.")


class RequestBodyLimitMiddleware:
    """Enforce an actual body limit, including chunked requests without Content-Length."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] in {"GET", "HEAD", "OPTIONS"}:
            return await self.app(scope, receive, send)
        upload_paths = {"/api/parse-resume", "/api/score-resume", "/api/parse-and-score", "/api/builder/import", "/api/exports/resume/import"}
        limit = ((settings.max_file_size_mb + 1) * 1024 * 1024
                 if scope["path"] in upload_paths else (256 * 1024 if settings.storage_mode == "local" else 1024 * 1024))
        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            if len(body) + len(chunk) > limit:
                response = JSONResponse({"detail": "Request body is too large"}, status_code=413,
                                        headers={"Connection": "close"})
                return await response(scope, receive, send)
            body.extend(chunk)
            if not message.get("more_body", False):
                break
        sent = False
        async def replay():
            nonlocal sent
            if not sent:
                sent = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()
        return await self.app(scope, replay, send)


class ProcessingLimitMiddleware:
    """Reject excess work immediately, avoiding a memory-heavy upload queue."""
    def __init__(self, app):
        self.app = app
        self.active = 0

    async def __call__(self, scope, receive, send):
        limited = (scope["type"] == "http" and scope["method"] == "POST"
                   and scope["path"].startswith("/api/") and settings.max_concurrent_processing)
        if not limited:
            return await self.app(scope, receive, send)
        # The ASGI event loop has no await between this check and increment.
        if self.active >= settings.max_concurrent_processing:
            response = JSONResponse({"detail": "The processor is busy. Please try again shortly."},
                                    status_code=429, headers={"Retry-After": "10", "Cache-Control": "no-store"})
            return await response(scope, receive, send)
        self.active += 1
        try:
            return await self.app(scope, receive, send)
        finally:
            self.active -= 1
