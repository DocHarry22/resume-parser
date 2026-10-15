"""Before-and-after writing assistance. Changes are never silently applied."""
from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.writing_provider import provider_configured, rewrite_text

router = APIRouter(prefix="/ai", tags=["Writing assistant"])


class RewriteRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=6000)
    action: Literal["improve", "professional", "shorten", "expand", "ats", "tailor"] = "improve"
    context: str = Field(default="", max_length=6000)
    consent: bool = False


@router.get("/status")
async def ai_status():
    return {"configured": provider_configured(), "requires_consent": True}


@router.post("/rewrite")
async def rewrite(request: RewriteRequest):
    if not request.consent:
        raise HTTPException(status_code=422, detail="Confirm that this text may be sent to the writing provider")
    suggestion = await rewrite_text(request.text, request.action, request.context)
    return {"before": request.text, "after": suggestion, "provider": "configured_ai",
            "requires_review": True,
            "notice": "Review facts and wording before accepting. Your document has not been changed."}
