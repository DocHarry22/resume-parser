"""API routes for resume parsing and scoring with multi-tier scan modes."""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Form
from fastapi.responses import JSONResponse
from typing import Optional
import logging

from app.models.resume_models import Resume
from app.models.scoring_models import ResumeScore, ScanMode
from app.services.parsing_service import ParsingService
from app.services.scoring_service import ScoringService, get_scoring_service
from app.utils.document_loader import load_document
from app.core.config import settings
from starlette.concurrency import run_in_threadpool

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize services
parsing_service = ParsingService()


def _validate_job_description(text: Optional[str]):
    if text and len(text) > settings.max_extracted_characters:
        raise HTTPException(status_code=413, detail="The job description is too long. Use a shorter advertisement.")


async def _parse_document(document):
    if settings.storage_mode == "local":
        return await run_in_threadpool(parsing_service.parse_resume, document)
    return parsing_service.parse_resume(document)


async def _score_document(**kwargs):
    service = get_scoring_service()
    if settings.storage_mode == "local":
        return await run_in_threadpool(service.score_resume, **kwargs)
    return service.score_resume(**kwargs)


@router.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Resume Parser API",
        "version": "2.0.0",
        "endpoints": {
            "parse": "/api/parse-resume",
            "score": "/api/score-resume",
            "parse_and_score": "/api/parse-and-score",
            "docs": "/docs"
        },
        "scan_modes": {
            "basic": "Format check + key sections (fastest)",
            "ats": "Keywords + readability + ATS simulation",
            "expert": "Full analysis + achievement scoring + recruiter insights"
        },
        "industries": {
            "default": "All Industries (no specific optimization)",
            "engineering": "Engineering (CAD, design, testing, certifications)",
            "it-software": "IT/Software (Python, Java, cloud, DevOps)",
            "finance": "Finance (financial modeling, CPA, CFA, compliance)",
            "healthcare": "Healthcare (patient care, EMR, clinical certifications)"
        }
    }


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "storage_mode": settings.storage_mode,
            "spacy_model": settings.spacy_model, "server_persistence": settings.storage_mode == "guest"}


@router.post("/parse-resume", response_model=Resume)
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse a resume and extract structured information.
    
    Accepts PDF and DOCX files.
    
    Returns:
        Resume object with extracted information
    """
    try:
        # Load document (validates file type, size, etc.)
        logger.info(f"Parsing resume: {file.filename}")
        document = await load_document(file)
        
        # Parse resume
        resume = await _parse_document(document)
        
        logger.info(f"Successfully parsed resume: {file.filename}")
        return resume
        
    except HTTPException:
        # Re-raise HTTP exceptions from load_document
        raise
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Unable to process resume")


@router.post("/score-resume")
async def score_resume(
    file: UploadFile = File(...),
    mode: ScanMode = Query(default=ScanMode.BASIC, description="Scan mode: basic, ats, or expert"),
    job_description: Optional[str] = Form(default=None, description="Optional job description for match scoring"),
    industry: Optional[str] = Form(default=None, description="Optional industry for targeted optimization (engineering, it-software, finance, healthcare)")
):
    """
    Score a resume and provide quality metrics.
    
    Accepts PDF and DOCX files.
    
    Query Parameters:
        - mode: Scan mode (basic, ats, expert). Default: basic
        
    Form Data:
        - job_description: Optional job description for match scoring
        - industry: Optional industry for targeted keyword optimization
          Options: engineering, it-software, finance, healthcare
    
    Scan Modes:
        - BASIC: ATS compliance (50%), layout (30%), readability (20%)
        - ATS: ATS compliance (25%), experience (25%), skills (20%), readability (15%), layout (15%)
        - EXPERT: Same as ATS + advanced recruiter scoring rules
    
    Returns:
        ResumeScore with detailed metrics and minimal resume summary
    """
    try:
        # Load document (validates file type, size, etc.)
        _validate_job_description(job_description)
        logger.info(f"Scoring resume: {file.filename} (mode: {mode.value})")
        document = await load_document(file)
        
        # Parse resume
        resume = await _parse_document(document)
        
        # Score with specified mode
        scoring_service = get_scoring_service()
        score = await _score_document(
            resume=resume,
            mode=mode,
            job_description=job_description,
            industry=industry
        )
        
        logger.info(f"Successfully scored resume: {file.filename} (Score: {score.overall}, Mode: {mode.value})")
        
        # Return score with minimal resume info
        return {
            "score": score,
            "resume_summary": {
                "name": resume.name,
                "contact": resume.contact,
                "total_experience": len(resume.experience),
                "total_education": len(resume.education),
                "total_skills": len(resume.skills)
            }
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions from load_document
        raise
    except Exception as e:
        logger.error(f"Error scoring resume: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Unable to process resume")


@router.post("/parse-and-score")
async def parse_and_score(
    file: UploadFile = File(...),
    mode: ScanMode = Query(default=ScanMode.BASIC, description="Scan mode: basic, ats, or expert"),
    job_description: Optional[str] = Form(default=None, description="Optional job description for match scoring"),
    industry: Optional[str] = Form(default=None, description="Optional industry for targeted optimization (engineering, it-software, finance, healthcare)")
):
    """
    Parse and score a resume in one request.
    
    Accepts PDF and DOCX files.
    
    Query Parameters:
        - mode: Scan mode (basic, ats, expert). Default: basic
        
    Form Data:
        - job_description: Optional job description for match scoring
        - industry: Optional industry for targeted keyword optimization
          Options: engineering, it-software, finance, healthcare
    
    Scan Modes:
        - BASIC: ATS compliance (50%), layout (30%), readability (20%)
          - Fastest scan, skips experience and skills analysis
          - Returns experience=None, skills=None
          
        - ATS: ATS compliance (25%), experience (25%), skills (20%), readability (15%), layout (15%)
          - Full ATS simulation with keyword analysis
          - All metrics returned
          
        - EXPERT: Same as ATS + advanced recruiter scoring rules
          - Quantified achievement detection
          - Section ordering analysis
          - Certification/award bonuses
          - Bias risk penalties (photo, DOB, gender)
          - Industry-specific keyword optimization (if industry specified)
    
    Returns:
        Both full Resume object and ResumeScore
    """
    try:
        # Load document (validates file type, size, etc.)
        _validate_job_description(job_description)
        logger.info(f"Parsing and scoring resume: {file.filename} (mode: {mode.value})")
        document = await load_document(file)
        
        # Parse resume
        resume = await _parse_document(document)
        
        # Score with specified mode
        # TODO: Consider async scoring for performance at scale
        scoring_service = get_scoring_service()
        score = await _score_document(
            resume=resume,
            mode=mode,
            job_description=job_description,
            industry=industry
        )
        
        logger.info(f"Successfully processed resume: {file.filename} (Score: {score.overall}, Mode: {mode.value})")
        
        return {
            "resume": resume,
            "score": score
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions from load_document
        raise
    except Exception as e:
        logger.error(f"Error processing resume: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Unable to process resume")


@router.get("/scan-modes")
async def get_scan_modes():
    """
    Get available scan modes and their descriptions.
    
    Returns:
        List of scan modes with weights and features
    """
    return {
        "modes": [
            {
                "id": "basic",
                "name": "Basic Scan",
                "description": "Format check + key sections",
                "weights": {
                    "ats_compliance": "50%",
                    "layout": "30%",
                    "readability": "20%"
                },
                "features": [
                    "ATS compliance check",
                    "Layout validation",
                    "Readability analysis"
                ],
                "skipped": ["experience analysis", "skills analysis"]
            },
            {
                "id": "ats",
                "name": "ATS Pro Scan",
                "description": "Keywords + readability + ATS simulation",
                "weights": {
                    "ats_compliance": "25%",
                    "experience": "25%",
                    "skills": "20%",
                    "readability": "15%",
                    "layout": "15%"
                },
                "features": [
                    "ATS compliance check",
                    "Experience quality scoring",
                    "Skills analysis",
                    "Readability analysis",
                    "Layout validation",
                    "Quantification detection"
                ],
                "skipped": []
            },
            {
                "id": "expert",
                "name": "Expert Recruiter Scan",
                "description": "Full analysis + achievement scoring + recruiter insights",
                "weights": {
                    "ats_compliance": "25%",
                    "experience": "25%",
                    "skills": "20%",
                    "readability": "15%",
                    "layout": "15%"
                },
                "features": [
                    "All ATS Pro features",
                    "Quantified impact detection",
                    "Section ordering analysis",
                    "Certification bonuses",
                    "Award detection",
                    "Bias risk analysis",
                    "Recruiter insights"
                ],
                "skipped": []
            }
        ]
    }
