"""Guest document privacy controls; these are not account-management endpoints."""
from fastapi import APIRouter, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.core.workspaces import COOKIE_NAME
from app.services.builder_service import get_builder_service
from app.services.document_store import CoverLetterStore
from app.services.resume_export import download_headers

router = APIRouter(prefix="/workspace", tags=["Guest workspace"])


@router.get("")
async def workspace_status():
    return {"mode": "guest", "resume_count": len(get_builder_service().list_resumes()),
            "cover_letter_count": len(CoverLetterStore()),
            "notice": "Keep this browser cookie to return to your documents. Guest access is not an account."}


@router.get("/export")
async def export_workspace():
    service = get_builder_service()
    resumes = [service.get_resume(item["id"]) for item in service.list_resumes()]
    return JSONResponse(content=jsonable_encoder({
        "mode": "guest", "resumes": resumes, "cover_letters": list(CoverLetterStore().values())
    }), headers=download_headers("my-workspace", "json"))


@router.delete("")
async def delete_workspace():
    service = get_builder_service()
    for resume in service.list_resumes():
        service.delete_resume(resume["id"])
    store = CoverLetterStore()
    for letter_id in list(store):
        del store[letter_id]
    response = JSONResponse({"success": True, "message": "Guest documents deleted"})
    response.delete_cookie(COOKIE_NAME, path="/api")
    return response
