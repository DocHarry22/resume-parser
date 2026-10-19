"""Validated, bounded PDF, DOCX and UTF-8 TXT imports."""
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile, BadZipFile
import logging

from fastapi import UploadFile, HTTPException
from starlette.concurrency import run_in_threadpool
from app.core.config import settings
from app.utils.pdf_reader import read_pdf
from app.utils.docx_reader import DOCXReader
from app.models.resume_models import RawDocument

logger = logging.getLogger(__name__)
MAX_FILE_SIZE = settings.max_file_size_mb * 1024 * 1024
MAX_EXTRACTED_CHARACTERS = settings.max_extracted_characters
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def _extract(data: bytes, extension: str) -> RawDocument:
    if extension == ".pdf":
        if not data[:1024].lstrip().startswith(b"%PDF-"):
            raise ValueError("The file is not a valid PDF")
        result = read_pdf(data)
    elif extension == ".docx":
        try:
            with ZipFile(BytesIO(data)) as archive:
                entries = archive.infolist()
                names = set(archive.namelist())
                if not {"[Content_Types].xml", "word/document.xml"} <= names:
                    raise ValueError("The file is not a Word DOCX document")
                if len(entries) > 2000 or sum(item.file_size for item in entries) > settings.max_docx_expanded_mb * 1024 * 1024:
                    raise ValueError("The DOCX archive is too large to extract safely")
                if any(item.file_size > 30 * 1024 * 1024 or item.flag_bits & 1 or
                       (item.file_size > 1024 * 1024 and item.file_size > 1000 * max(item.compress_size, 1))
                       for item in entries):
                    raise ValueError("The DOCX archive contains unsafe entries")
        except BadZipFile:
            raise ValueError("The file is not a valid DOCX archive")
        result = DOCXReader().read(data)
    elif extension == ".txt":
        try:
            text = data.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise ValueError("Save text files with UTF-8 encoding before importing")
        if "\x00" in text:
            raise ValueError("The text file contains binary data")
        result = {"full_text": text, "blocks": [line.strip() for line in text.splitlines() if line.strip()]}
    else:
        raise ValueError("Unsupported file type")
    if not result.get("full_text", "").strip():
        raise ValueError("No readable text found. Scanned PDFs require OCR before importing.")
    if len(result["full_text"]) > MAX_EXTRACTED_CHARACTERS:
        raise ValueError("The document contains too much text. Import a shorter resume.")
    return RawDocument(full_text=result["full_text"], blocks=result["blocks"],
                       page_count=result.get("page_count"))


async def load_document(upload_file: UploadFile) -> RawDocument:
    if not upload_file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    extension = Path(upload_file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, DOCX or TXT.")
    data = bytearray()
    try:
        while True:
            chunk = await upload_file.read(min(64 * 1024, MAX_FILE_SIZE + 1 - len(data)))
            if not chunk:
                break
            data.extend(chunk)
            if len(data) > MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail=f"File too large. Maximum size: {settings.max_file_size_mb}MB")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Error reading file")
    if not data:
        raise HTTPException(status_code=400, detail="File is empty")
    try:
        if settings.storage_mode == "local":
            return await run_in_threadpool(_extract, bytes(data), extension)
        return _extract(bytes(data), extension)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    except Exception:
        logger.exception("Unable to parse uploaded document")
        raise HTTPException(status_code=422, detail="Unable to read this document. Try a new PDF or DOCX export.")


def load_document_from_path(file_path: str) -> RawDocument:
    path = Path(file_path)
    if not path.exists():
        raise ValueError(f"File not found: {file_path}")
    extension = path.suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {extension}")
    with path.open("rb") as handle:
        data = handle.read(MAX_FILE_SIZE + 1)
    if len(data) > MAX_FILE_SIZE:
        raise ValueError("File too large")
    if not data:
        raise ValueError("File is empty")
    return _extract(data, extension)
