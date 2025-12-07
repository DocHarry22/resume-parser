"""API routes for resume parsing and scoring."""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import logging

from app.models.resume_models import Resume
from app.models.scoring_models import ResumeScore
from app.services.parsing_service import ParsingService
from app.services.scoring_service import ScoringService
from app.utils.document_loader import load_document

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize services
parsing_service = ParsingService()
scoring_service = ScoringService()


@router.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Resume Parser API",
        "version": "1.0.0",
        "endpoints": {
            "parse": "/api/parse-resume",
            "score": "/api/score-resume",
            "parse_and_score": "/api/parse-and-score",
            "docs": "/docs"
        }
    }


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


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
        resume = parsing_service.parse_resume(document)
        
        logger.info(f"Successfully parsed resume: {file.filename}")
        return resume
        
    except HTTPException:
        # Re-raise HTTP exceptions from load_document
        raise
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/score-resume")
async def score_resume(file: UploadFile = File(...)):
    """
    Score a resume and provide quality metrics.
    
    Accepts PDF and DOCX files.
    
    Returns:
        ResumeScore with detailed metrics and minimal resume summary
    """
    try:
        # Load document (validates file type, size, etc.)
        logger.info(f"Scoring resume: {file.filename}")
        document = await load_document(file)
        
        # Parse and score resume
        resume = parsing_service.parse_resume(document)
        score = scoring_service.score_resume(resume)
        
        logger.info(f"Successfully scored resume: {file.filename} (Score: {score.overall})")
        
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
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/parse-and-score")
async def parse_and_score(file: UploadFile = File(...)):
    """
    Parse and score a resume in one request.
    
    Accepts PDF and DOCX files.
    
    Returns:
        Both full Resume object and ResumeScore
    """
    try:
        # Load document (validates file type, size, etc.)
        logger.info(f"Parsing and scoring resume: {file.filename}")
        document = await load_document(file)
        
        # Parse and score resume
        resume = parsing_service.parse_resume(document)
        score = scoring_service.score_resume(resume)
        
        logger.info(f"Successfully processed resume: {file.filename} (Score: {score.overall})")
        
        return {
            "resume": resume,
            "score": score
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions from load_document
        raise
    except Exception as e:
        logger.error(f"Error processing resume: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
