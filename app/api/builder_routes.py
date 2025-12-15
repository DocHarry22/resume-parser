"""
Resume Builder and Auto-Fix API Routes

RESTful API endpoints for resume building and automated fixes.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from app.models.builder_models import (
    ResumeBuilder, ResumeUpdate, BuilderResponse,
    ContactInfo, ExperienceEntry, EducationEntry,
    SkillCategory, CertificationEntry, ProjectEntry,
    SectionType
)
from app.services.builder_service import get_builder_service
from app.services.autofix_service import get_auto_fix_service
from app.services.parsing_service import get_parsing_service
from app.services.scoring_service import get_scoring_service
from app.models.scoring_models import ScanMode


router = APIRouter(prefix="/builder", tags=["Resume Builder"])


# ==================== Resume CRUD Operations ====================

@router.post("/create", response_model=BuilderResponse)
async def create_resume(
    title: str = Form(default="My Resume"),
):
    """
    Create a new empty resume builder instance.
    
    Args:
        title: Optional title for the resume
        
    Returns:
        BuilderResponse with the new resume
    """
    try:
        builder_service = get_builder_service()
        resume = builder_service.create_resume(title=title)
        
        return BuilderResponse(
            success=True,
            message="Resume created successfully",
            resume=resume
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import", response_model=BuilderResponse)
async def import_resume(
    file: UploadFile = File(...),
):
    """
    Import an existing resume file and convert to builder format.
    
    Args:
        file: Resume file (PDF/DOCX)
        
    Returns:
        BuilderResponse with populated resume builder
    """
    try:
        # Parse the uploaded resume
        parsing_service = get_parsing_service()
        parsed_resume = await parsing_service.parse_resume(file)
        
        # Convert to builder format
        builder_service = get_builder_service()
        resume_builder = builder_service.create_from_parsed(parsed_resume)
        
        return BuilderResponse(
            success=True,
            message="Resume imported successfully",
            resume=resume_builder
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{resume_id}", response_model=BuilderResponse)
async def get_resume(resume_id: str):
    """
    Get a resume by ID.
    
    Args:
        resume_id: Resume ID
        
    Returns:
        BuilderResponse with the resume
    """
    builder_service = get_builder_service()
    resume = builder_service.get_resume(resume_id)
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return BuilderResponse(
        success=True,
        message="Resume retrieved successfully",
        resume=resume
    )


@router.patch("/{resume_id}", response_model=BuilderResponse)
async def update_resume(
    resume_id: str,
    update_data: ResumeUpdate
):
    """
    Update a resume with partial data.
    
    Args:
        resume_id: Resume ID
        update_data: Partial update data
        
    Returns:
        BuilderResponse with updated resume
    """
    builder_service = get_builder_service()
    resume = builder_service.update_resume(resume_id, update_data)
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return BuilderResponse(
        success=True,
        message="Resume updated successfully",
        resume=resume
    )


@router.delete("/{resume_id}")
async def delete_resume(resume_id: str):
    """
    Delete a resume.
    
    Args:
        resume_id: Resume ID
        
    Returns:
        Success response
    """
    builder_service = get_builder_service()
    success = builder_service.delete_resume(resume_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return {"success": True, "message": "Resume deleted successfully"}


@router.post("/{resume_id}/save")
async def save_resume(resume_id: str):
    """
    Persist resume to disk.
    
    Args:
        resume_id: Resume ID
        
    Returns:
        Success response
    """
    builder_service = get_builder_service()
    resume = builder_service.get_resume(resume_id)
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    success = builder_service.save_resume(resume)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save resume")
    
    return {"success": True, "message": "Resume saved successfully"}


@router.get("/list/all")
async def list_resumes():
    """
    List all resumes (metadata only).
    
    Returns:
        List of resume metadata
    """
    builder_service = get_builder_service()
    resumes = builder_service.list_resumes()
    
    return {
        "success": True,
        "count": len(resumes),
        "resumes": resumes
    }


# ==================== Section Management ====================

@router.post("/{resume_id}/section/{section}", response_model=BuilderResponse)
async def add_section_entry(
    resume_id: str,
    section: SectionType,
    entry_data: Dict[str, Any]
):
    """
    Add an entry to a section (experience, education, etc.).
    
    Args:
        resume_id: Resume ID
        section: Section type
        entry_data: Entry data matching section's model
        
    Returns:
        BuilderResponse with updated resume
    """
    builder_service = get_builder_service()
    resume = builder_service.add_section_entry(resume_id, section, entry_data)
    
    if not resume:
        raise HTTPException(
            status_code=400,
            detail="Failed to add section entry. Check data format."
        )
    
    return BuilderResponse(
        success=True,
        message=f"Entry added to {section.value} section",
        resume=resume
    )


@router.delete("/{resume_id}/section/{section}/{entry_index}", response_model=BuilderResponse)
async def remove_section_entry(
    resume_id: str,
    section: SectionType,
    entry_index: int
):
    """
    Remove an entry from a section.
    
    Args:
        resume_id: Resume ID
        section: Section type
        entry_index: Index of entry to remove
        
    Returns:
        BuilderResponse with updated resume
    """
    builder_service = get_builder_service()
    resume = builder_service.remove_section_entry(resume_id, section, entry_index)
    
    if not resume:
        raise HTTPException(
            status_code=400,
            detail="Failed to remove section entry"
        )
    
    return BuilderResponse(
        success=True,
        message=f"Entry removed from {section.value} section",
        resume=resume
    )


@router.get("/{resume_id}/export/text")
async def export_resume_text(resume_id: str):
    """
    Export resume as plain text.
    
    Args:
        resume_id: Resume ID
        
    Returns:
        Plain text resume
    """
    builder_service = get_builder_service()
    resume = builder_service.get_resume(resume_id)
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    text = builder_service.export_to_text(resume)
    
    return JSONResponse(
        content={
            "success": True,
            "text": text
        }
    )


# ==================== Auto-Fix Operations ====================

@router.post("/{resume_id}/analyze")
async def analyze_for_fixes(
    resume_id: str,
    mode: ScanMode = Form(default=ScanMode.EXPERT),
    industry: Optional[str] = Form(default=None)
):
    """
    Analyze a resume and generate auto-fix recommendations.
    
    Args:
        resume_id: Resume ID
        mode: Scan mode (BASIC, ATS, EXPERT)
        industry: Optional industry optimization
        
    Returns:
        List of auto-fix recommendations
    """
    try:
        builder_service = get_builder_service()
        resume_builder = builder_service.get_resume(resume_id)
        
        if not resume_builder:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Export to text and create a Resume object for scoring
        resume_text = builder_service.export_to_text(resume_builder)
        
        # Create a minimal Resume object for scoring
        from app.models.resume_models import Resume
        resume = Resume(
            raw_text=resume_text,
            contact=resume_builder.contact.model_dump() if resume_builder.contact else None,
            summary=resume_builder.summary.summary if resume_builder.summary else None,
            experience=[exp.model_dump() for exp in resume_builder.experience],
            education=[edu.model_dump() for edu in resume_builder.education],
            skills=[skill for skill_cat in resume_builder.skills for skill in skill_cat.skills],
            certifications=[cert.name for cert in resume_builder.certifications]
        )
        
        # Score the resume
        scoring_service = get_scoring_service()
        score = scoring_service.score_resume(
            resume=resume,
            mode=mode,
            industry=industry
        )
        
        # Generate fixes
        autofix_service = get_auto_fix_service()
        fixes = autofix_service.generate_fixes(
            resume=resume,
            flags=score.flags,
            comments=score.comments,
            score=score.overall
        )
        
        # Sort by priority
        fixes.sort(key=lambda f: autofix_service.get_fix_priority(f))
        
        return {
            "success": True,
            "resume_id": resume_id,
            "overall_score": score.overall,
            "fixes_count": len(fixes),
            "fixes": [fix.to_dict() for fix in fixes]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{resume_id}/apply-fix")
async def apply_auto_fix(
    resume_id: str,
    fix_data: Dict[str, Any]
):
    """
    Apply an auto-fix to a resume.
    
    Args:
        resume_id: Resume ID
        fix_data: Fix data from analyze endpoint
        
    Returns:
        BuilderResponse with updated resume
    """
    try:
        builder_service = get_builder_service()
        resume = builder_service.get_resume(resume_id)
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Reconstruct AutoFix from dict
        from app.services.autofix_service import AutoFix, FixType, FixAction
        
        fix = AutoFix(
            fix_type=FixType(fix_data["fix_type"]),
            action=FixAction(fix_data["action"]),
            section=fix_data["section"],
            description=fix_data["description"],
            original_value=fix_data.get("original_value"),
            suggested_value=fix_data.get("suggested_value"),
            auto_applicable=fix_data.get("auto_applicable", True),
            metadata=fix_data.get("metadata", {})
        )
        
        # Apply the fix
        autofix_service = get_auto_fix_service()
        success, message, updated_resume = autofix_service.apply_fix(resume, fix)
        
        if not success:
            return BuilderResponse(
                success=False,
                message=message,
                resume=resume
            )
        
        # Update in storage
        builder_service._in_memory_cache[resume_id] = updated_resume
        
        return BuilderResponse(
            success=True,
            message=message,
            resume=updated_resume
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{resume_id}/apply-all-fixes")
async def apply_all_auto_fixes(
    resume_id: str,
    mode: ScanMode = Form(default=ScanMode.EXPERT),
    industry: Optional[str] = Form(default=None)
):
    """
    Analyze and automatically apply all applicable fixes.
    
    Args:
        resume_id: Resume ID
        mode: Scan mode
        industry: Optional industry optimization
        
    Returns:
        BuilderResponse with results
    """
    try:
        # First analyze
        analysis = await analyze_for_fixes(resume_id, mode, industry)
        fixes = analysis["fixes"]
        
        applied_count = 0
        failed_count = 0
        messages = []
        
        # Apply each auto-applicable fix
        for fix_data in fixes:
            if fix_data.get("auto_applicable", False):
                try:
                    result = await apply_auto_fix(resume_id, fix_data)
                    if result.success:
                        applied_count += 1
                        messages.append(f"✓ {fix_data['description']}")
                    else:
                        failed_count += 1
                        messages.append(f"✗ {fix_data['description']}")
                except Exception as e:
                    failed_count += 1
                    messages.append(f"✗ {fix_data['description']}: {str(e)}")
        
        builder_service = get_builder_service()
        resume = builder_service.get_resume(resume_id)
        
        return BuilderResponse(
            success=True,
            message=f"Applied {applied_count} fixes, {failed_count} failed",
            resume=resume,
            errors={"details": messages} if messages else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
