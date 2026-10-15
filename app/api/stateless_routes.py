"""Process the current document without creating a server workspace or record."""
from fastapi import APIRouter, File, HTTPException, Response, UploadFile
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.models.builder_models import ResumeBuilder
from app.models.cover_letter_models import AIContentRequest, CoverLetter
from app.routers.cover_letter_router import TEMPLATES, export_cover_letter_data, generate_content
from app.services.builder_service import ResumeBuilderService
from app.services.parsing_service import ParsingService
from app.services.resume_export import download_headers, export_resume
from app.utils.document_loader import load_document

router = APIRouter(prefix="/exports", tags=["Current-document processing"])


def _bounded_content(value):
    def size(item):
        if isinstance(item, str):
            return len(item)
        if isinstance(item, dict):
            return sum(len(str(key)) + size(child) for key, child in item.items())
        if isinstance(item, (list, tuple)):
            return sum(size(child) for child in item)
        return 0
    if size(value.model_dump(mode="json")) > settings.max_extracted_characters:
        raise HTTPException(status_code=413, detail="Document content is too large for this processor. Shorten it before exporting.")


class _TransientBuilder(ResumeBuilderService):
    """Reuse the tested parser mapping while preventing directory/file writes."""
    def __init__(self):
        self._in_memory_cache = {}

    def save_resume(self, resume):
        return True


@router.post("/resume/import")
async def import_current_resume(file: UploadFile = File(...)):
    document = await load_document(file)
    parsed = await run_in_threadpool(ParsingService().parse_resume, document)
    resume = _TransientBuilder().create_from_parsed(parsed)
    resume.id = None
    return {"resume": resume, "server_persistence": False}


@router.post("/resume/{format}")
def export_current_resume(format: str, resume: ResumeBuilder, page_size: str = "A4"):
    _bounded_content(resume)
    try:
        content, media_type = export_resume(resume, format, page_size)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    return Response(content, media_type=media_type, headers=download_headers(resume.title, format))


@router.get("/cover-letter/templates")
def letter_templates():
    return TEMPLATES


@router.post("/cover-letter/guidance")
async def guided_letter(request: AIContentRequest):
    if request.use_ai:
        raise HTTPException(status_code=503, detail="Paid AI is not enabled for browser-local processing. Use guided suggestions.")
    if len(request.model_dump_json()) > 30_000:
        raise HTTPException(status_code=413, detail="Shorten the job and experience details before generating guidance.")
    return await generate_content(request)


@router.post("/cover-letter/{format}")
async def export_current_letter(format: str, letter: CoverLetter):
    _bounded_content(letter)
    return await export_cover_letter_data(letter, format)
