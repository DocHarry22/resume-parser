"""
Unified document loader that detects file type and delegates to appropriate reader.
Provides a single interface for FastAPI UploadFile handling with validation.
"""

from fastapi import UploadFile, HTTPException
from pathlib import Path
import logging

from app.utils.pdf_reader import read_pdf
from app.utils.docx_reader import DOCXReader
from app.models.resume_models import RawDocument
from app.core.config import settings

logger = logging.getLogger(__name__)

# Maximum file size
MAX_FILE_SIZE = settings.max_file_size_mb * 1024 * 1024
ALLOWED_EXTENSIONS = set(settings.allowed_extensions)


def _has_valid_signature(data: bytes, ext: str) -> bool:
    """Validate basic file signatures to reject disguised uploads."""
    if ext == ".pdf":
        return data.startswith(b"%PDF")
    if ext == ".docx":
        return data.startswith(b"PK")
    return False


async def load_document(upload_file: UploadFile) -> RawDocument:
    """
    Read an UploadFile and extract text based on file type.
    
    Detects file type by extension and delegates to appropriate reader:
    - .pdf → PyMuPDF (fitz) reader
    - .docx/.doc → python-docx reader
    
    Args:
        upload_file: FastAPI UploadFile object
        
    Returns:
        RawDocument with extracted text and blocks
        
    Raises:
        HTTPException: If file type is unsupported or file is too large
        
    Example:
        ```python
        @router.post("/upload")
        async def upload_resume(file: UploadFile = File(...)):
            doc = await load_document(file)
            return {"text_length": len(doc.full_text)}
        ```
    """
    # Validate filename
    if not upload_file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    filename = upload_file.filename.lower()
    
    # Check file extension
    ext = None
    for allowed_ext in ALLOWED_EXTENSIONS:
        if filename.endswith(allowed_ext):
            ext = allowed_ext
            break
    
    if not ext:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    try:
        data = await upload_file.read()
    except Exception as e:
        logger.error(f"Error reading uploaded file: {e}")
        raise HTTPException(status_code=400, detail="Error reading file")
    
    # Check file size
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    if not _has_valid_signature(data, ext):
        raise HTTPException(
            status_code=400,
            detail=f"File content does not match {ext} format"
        )

    # Parse based on extension
    try:
        if ext == ".pdf":
            result = read_pdf(data)
            return RawDocument(
                full_text=result['full_text'],
                blocks=result['blocks'],
                page_count=result.get('page_count')
            )
        elif ext == ".docx":
            docx_reader = DOCXReader()
            result = docx_reader.read(data)
            return RawDocument(
                full_text=result['full_text'],
                blocks=result['blocks'],
                page_count=None  # DOCX doesn't have page concept
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type"            )
    except HTTPException:
            raise
    except ValueError as e:
            logger.warning("Document parsing failed for %s: %s", upload_file.filename, e)
            raise HTTPException(
                status_code=422,
                detail=f"Could not parse document: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error parsing document: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal error parsing document: {str(e)}"
        )


def load_document_from_path(file_path: str) -> RawDocument:
    """
    Load a document from a file path (for testing/CLI usage).
    
    Args:
        file_path: Path to PDF or DOCX file
        
    Returns:
        RawDocument with extracted text and blocks
        
    Raises:
        ValueError: If file type is unsupported or parsing fails
    """
    path = Path(file_path)
    
    if not path.exists():
        raise ValueError(f"File not found: {file_path}")
    
    ext = path.suffix.lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {ext}. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}")
    
    with open(path, 'rb') as f:
        data = f.read()
    
    if len(data) == 0:
        raise ValueError("File is empty")

    if not _has_valid_signature(data, ext):
        raise ValueError(f"File content does not match {ext} format")

    if ext == ".pdf":
        result = read_pdf(data)
        return RawDocument(
            full_text=result['full_text'],
            blocks=result['blocks'],
            page_count=result.get('page_count')
        )
    elif ext == ".docx":
        docx_reader = DOCXReader()
        result = docx_reader.read(data)
        return RawDocument(
            full_text=result['full_text'],
            blocks=result['blocks'],
            page_count=None
        )
    else:
        raise ValueError(f"Unsupported file type: {ext}")
