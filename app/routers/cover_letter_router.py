"""Cover Letter API endpoints."""

from fastapi import APIRouter, HTTPException, Response
from typing import List, Optional
from datetime import datetime
import uuid
import json
import logging

from app.models.cover_letter_models import (
    CoverLetter,
    CoverLetterCreate,
    CoverLetterUpdate,
    AIContentRequest,
    AIContentResponse,
    CoverLetterTemplate,
    CoverLetterExportRequest,
    CoverLetterTone,
)
from app.services.ai_content_generator import generate_cover_letter_content

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cover-letters", tags=["cover-letters"])

# In-memory storage (replace with database in production)
cover_letters_db: dict = {}


# Available templates
TEMPLATES = [
    CoverLetterTemplate(
        id="professional",
        name="Professional",
        description="Clean and professional design perfect for corporate roles",
        preview_image="/templates/cover-letter/professional.png",
        category="classic",
        color_scheme=["#1a1a2e", "#16213e", "#0f3460"]
    ),
    CoverLetterTemplate(
        id="modern",
        name="Modern",
        description="Contemporary design with a fresh, modern feel",
        preview_image="/templates/cover-letter/modern.png",
        category="modern",
        color_scheme=["#667eea", "#764ba2", "#f093fb"]
    ),
    CoverLetterTemplate(
        id="minimal",
        name="Minimal",
        description="Simple and elegant minimalist design",
        preview_image="/templates/cover-letter/minimal.png",
        category="minimal",
        color_scheme=["#2d3436", "#636e72", "#b2bec3"]
    ),
    CoverLetterTemplate(
        id="creative",
        name="Creative",
        description="Bold design for creative industries",
        preview_image="/templates/cover-letter/creative.png",
        category="creative",
        color_scheme=["#e17055", "#fdcb6e", "#00b894"]
    ),
    CoverLetterTemplate(
        id="executive",
        name="Executive",
        description="Sophisticated design for senior positions",
        preview_image="/templates/cover-letter/executive.png",
        category="classic",
        color_scheme=["#2c3e50", "#34495e", "#7f8c8d"]
    ),
    CoverLetterTemplate(
        id="tech",
        name="Tech",
        description="Modern design tailored for tech industry",
        preview_image="/templates/cover-letter/tech.png",
        category="modern",
        color_scheme=["#00d4ff", "#090979", "#020024"]
    ),
]


@router.get("/templates", response_model=List[CoverLetterTemplate])
async def get_templates():
    """Get all available cover letter templates."""
    return TEMPLATES


@router.get("/templates/{template_id}", response_model=CoverLetterTemplate)
async def get_template(template_id: str):
    """Get a specific template by ID."""
    for template in TEMPLATES:
        if template.id == template_id:
            return template
    raise HTTPException(status_code=404, detail="Template not found")


@router.post("", response_model=CoverLetter)
async def create_cover_letter(request: CoverLetterCreate):
    """Create a new cover letter."""
    cover_letter_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    cover_letter = CoverLetter(
        id=cover_letter_id,
        title=request.title,
        linked_resume_id=request.linked_resume_id,
        created_at=now,
        updated_at=now,
    )
    cover_letter.settings.template = request.template
    
    cover_letters_db[cover_letter_id] = cover_letter
    
    return cover_letter


@router.get("", response_model=List[CoverLetter])
async def list_cover_letters():
    """List all cover letters."""
    return list(cover_letters_db.values())


@router.get("/{cover_letter_id}", response_model=CoverLetter)
async def get_cover_letter(cover_letter_id: str):
    """Get a specific cover letter by ID."""
    if cover_letter_id not in cover_letters_db:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return cover_letters_db[cover_letter_id]


@router.put("/{cover_letter_id}", response_model=CoverLetter)
async def update_cover_letter(cover_letter_id: str, updates: CoverLetterUpdate):
    """Update a cover letter."""
    if cover_letter_id not in cover_letters_db:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    
    cover_letter = cover_letters_db[cover_letter_id]
    update_data = updates.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if value is not None:
            setattr(cover_letter, field, value)
    
    cover_letter.updated_at = datetime.utcnow()
    cover_letters_db[cover_letter_id] = cover_letter
    
    return cover_letter


@router.delete("/{cover_letter_id}")
async def delete_cover_letter(cover_letter_id: str):
    """Delete a cover letter."""
    if cover_letter_id not in cover_letters_db:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    
    del cover_letters_db[cover_letter_id]
    return {"message": "Cover letter deleted successfully"}


@router.post("/{cover_letter_id}/duplicate", response_model=CoverLetter)
async def duplicate_cover_letter(cover_letter_id: str):
    """Duplicate an existing cover letter."""
    if cover_letter_id not in cover_letters_db:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    
    original = cover_letters_db[cover_letter_id]
    new_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    # Create a copy with new ID and title
    new_cover_letter = original.model_copy(deep=True)
    new_cover_letter.id = new_id
    new_cover_letter.title = f"{original.title} (Copy)"
    new_cover_letter.created_at = now
    new_cover_letter.updated_at = now
    
    cover_letters_db[new_id] = new_cover_letter
    
    return new_cover_letter


@router.post("/ai/generate", response_model=AIContentResponse)
async def generate_content(request: AIContentRequest):
    """Generate AI-powered content suggestions for a cover letter section."""
    try:
        suggestions = await generate_cover_letter_content(
            section=request.section,
            job_title=request.job_title,
            job_description=request.job_description,
            company_name=request.company_name,
            experience_summary=request.experience_summary,
            skills=request.skills,
            tone=request.tone,
        )
        
        return AIContentResponse(
            suggestions=suggestions["suggestions"],
            section=request.section,
            tips=suggestions.get("tips", []),
            keywords=suggestions.get("keywords", []),
        )
    except Exception as e:
        logger.error(f"Error generating content: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate content")


@router.post("/{cover_letter_id}/export")
async def export_cover_letter(cover_letter_id: str, request: CoverLetterExportRequest):
    """Export cover letter to PDF, DOCX, or TXT format."""
    if cover_letter_id not in cover_letters_db:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    
    cover_letter = cover_letters_db[cover_letter_id]
    
    if request.format == "pdf":
        # Generate PDF
        from app.services.cover_letter_export import generate_pdf
        pdf_bytes = generate_pdf(cover_letter, request)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{cover_letter.title}.pdf"'
            }
        )
    elif request.format == "docx":
        # Generate DOCX
        from app.services.cover_letter_export import generate_docx
        docx_bytes = generate_docx(cover_letter, request)
        
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{cover_letter.title}.docx"'
            }
        )
    elif request.format == "txt":
        # Generate plain text
        from app.services.cover_letter_export import generate_txt
        txt_content = generate_txt(cover_letter)
        
        return Response(
            content=txt_content,
            media_type="text/plain",
            headers={
                "Content-Disposition": f'attachment; filename="{cover_letter.title}.txt"'
            }
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format")


@router.post("/from-resume/{resume_id}", response_model=CoverLetter)
async def create_from_resume(resume_id: str, job_title: str = "", company_name: str = ""):
    """Create a cover letter pre-populated with data from a resume."""
    # This would integrate with the resume storage
    # For now, create a basic cover letter
    cover_letter_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    cover_letter = CoverLetter(
        id=cover_letter_id,
        title=f"Cover Letter for {job_title}" if job_title else "My Cover Letter",
        linked_resume_id=resume_id,
        created_at=now,
        updated_at=now,
    )
    
    # Pre-fill job details if provided
    if job_title:
        cover_letter.job_details.job_title = job_title
    if company_name:
        cover_letter.job_details.company_name = company_name
        cover_letter.recipient.company = company_name
    
    cover_letters_db[cover_letter_id] = cover_letter
    
    return cover_letter
