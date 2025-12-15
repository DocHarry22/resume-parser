"""Main FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.routes import router
from app.api.builder_routes import router as builder_router
from app.services.nlp_service import get_nlp_service


# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("Starting Resume Parser API...")
    
    # Pre-load spaCy model
    try:
        nlp_service = get_nlp_service()
        logger.info("✓ NLP service initialized")
    except Exception as e:
        logger.error(f"✗ Failed to initialize NLP service: {e}")
        raise
    
    logger.info(f"✓ API server ready on http://{settings.host}:{settings.port}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Resume Parser API...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    **Resume Parser and Scoring API**
    
    A production-grade resume parsing and scoring service that:
    
    * Extracts structured data from PDF and DOCX resumes
    * Uses spaCy for NLP (named entity recognition, tokenization, etc.)
    * Computes quality scores based on:
        - Readability (Flesch-Kincaid formulas)
        - Structural completeness
        - Experience quality
        - Skills richness
        - Length and layout
    
    ## Endpoints
    
    * `POST /api/parse-resume` - Parse resume and extract structured data
    * `POST /api/score-resume` - Score resume quality
    * `POST /api/parse-and-score` - Parse and score in one request
    
    ## Supported File Types
    
    * PDF (`.pdf`)
    * Microsoft Word (`.docx`)
    
    ## Tech Stack
    
    * FastAPI for REST API
    * spaCy for NLP
    * pdfplumber for PDF extraction
    * python-docx for DOCX extraction
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware (adjust origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api", tags=["Resume Processing"])
app.include_router(builder_router, prefix="/api", tags=["Resume Builder"])

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
