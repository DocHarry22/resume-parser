"""
Unit tests for document loader.
"""

import pytest
from pathlib import Path
from fastapi import UploadFile, HTTPException
from io import BytesIO

from app.utils.document_loader import load_document, load_document_from_path, ALLOWED_EXTENSIONS, MAX_FILE_SIZE
from app.models.resume_models import RawDocument


class MockUploadFile:
    """Mock UploadFile for testing."""
    
    def __init__(self, filename: str, content: bytes):
        self.filename = filename
        self.content = content
    
    async def read(self):
        return self.content


@pytest.mark.asyncio
async def test_load_document_no_filename():
    """Test error when filename is missing."""
    mock_file = MockUploadFile("", b"content")
    
    with pytest.raises(HTTPException) as exc_info:
        await load_document(mock_file)
    
    assert exc_info.value.status_code == 400
    assert "No filename provided" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_load_document_unsupported_type():
    """Test error for unsupported file type."""
    mock_file = MockUploadFile("document.txt", b"text content")
    
    with pytest.raises(HTTPException) as exc_info:
        await load_document(mock_file)
    
    assert exc_info.value.status_code == 400
    assert "Unsupported file type" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_load_document_empty_file():
    """Test error for empty file."""
    mock_file = MockUploadFile("resume.pdf", b"")
    
    with pytest.raises(HTTPException) as exc_info:
        await load_document(mock_file)
    
    assert exc_info.value.status_code == 400
    assert "empty" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_load_document_file_too_large():
    """Test error for file exceeding size limit."""
    large_content = b"x" * (MAX_FILE_SIZE + 1)
    mock_file = MockUploadFile("resume.pdf", large_content)
    
    with pytest.raises(HTTPException) as exc_info:
        await load_document(mock_file)
    
    assert exc_info.value.status_code == 400
    assert "too large" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_load_document_pdf():
    """Test loading a valid PDF file."""
    sample_path = Path("tests/resources/sample_resume.pdf")
    
    if not sample_path.exists():
        pytest.skip("Sample PDF not found")
    
    with open(sample_path, 'rb') as f:
        content = f.read()
    
    mock_file = MockUploadFile("resume.pdf", content)
    
    result = await load_document(mock_file)
    
    assert isinstance(result, RawDocument)
    assert result.full_text
    assert len(result.blocks) > 0
    assert result.page_count >= 1


@pytest.mark.asyncio
async def test_load_document_invalid_pdf():
    """Test error handling for invalid PDF content."""
    mock_file = MockUploadFile("resume.pdf", b"not a real pdf")
    
    with pytest.raises(HTTPException) as exc_info:
        await load_document(mock_file)
    
    # Should be 422 (parsing error) or 500 (internal error)
    assert exc_info.value.status_code in (422, 500)


def test_load_document_from_path_pdf():
    """Test loading PDF from file path."""
    sample_path = "tests/resources/sample_resume.pdf"
    
    if not Path(sample_path).exists():
        pytest.skip("Sample PDF not found")
    
    result = load_document_from_path(sample_path)
    
    assert isinstance(result, RawDocument)
    assert result.full_text
    assert len(result.blocks) > 0
    assert result.page_count >= 1


def test_load_document_from_path_not_found():
    """Test error for non-existent file."""
    with pytest.raises(ValueError, match="File not found"):
        load_document_from_path("nonexistent.pdf")


def test_load_document_from_path_unsupported():
    """Test error for unsupported file type."""
    # Create a temp file with unsupported extension
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
        f.write(b"test content")
        temp_path = f.name
    
    try:
        with pytest.raises(ValueError, match="Unsupported file type"):
            load_document_from_path(temp_path)
    finally:
        Path(temp_path).unlink(missing_ok=True)


def test_allowed_extensions():
    """Test that allowed extensions are properly defined."""
    assert ".pdf" in ALLOWED_EXTENSIONS
    assert ".docx" in ALLOWED_EXTENSIONS
    assert ".doc" in ALLOWED_EXTENSIONS


def test_max_file_size():
    """Test that max file size is reasonable."""
    assert MAX_FILE_SIZE == 10 * 1024 * 1024  # 10MB
    assert MAX_FILE_SIZE > 0
