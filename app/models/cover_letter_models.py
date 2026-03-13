"""Cover Letter data models for the Cover Letter Builder."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CoverLetterTone(str, Enum):
    """Tone options for cover letter content."""
    PROFESSIONAL = "professional"
    ENTHUSIASTIC = "enthusiastic"
    CONFIDENT = "confident"
    FRIENDLY = "friendly"
    FORMAL = "formal"


class RecipientInfo(BaseModel):
    """Information about the letter recipient."""
    name: str = ""
    title: str = ""
    company: str = ""
    department: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    country: str = ""


class SenderInfo(BaseModel):
    """Sender's contact information."""
    full_name: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    country: str = ""
    linkedin: str = ""
    website: str = ""


class JobDetails(BaseModel):
    """Details about the job being applied for."""
    job_title: str = ""
    company_name: str = ""
    department: str = ""
    job_description: str = ""
    reference_number: str = ""


class CoverLetterContent(BaseModel):
    """The main content sections of the cover letter."""
    salutation: str = "Dear Hiring Manager,"
    opening_paragraph: str = ""
    body_paragraphs: List[str] = Field(default_factory=lambda: [""])
    closing_paragraph: str = ""
    signature: str = "Sincerely"
    ps_line: str = ""


class CoverLetterSettings(BaseModel):
    """Settings for cover letter generation and display."""
    template: str = "professional"
    tone: CoverLetterTone = CoverLetterTone.PROFESSIONAL
    font_family: str = "Arial"
    font_size: int = 11
    line_spacing: float = 1.15
    margin_size: str = "normal"  # narrow, normal, wide
    include_date: bool = True
    date_format: str = "MMMM d, yyyy"  # December 18, 2025


class CoverLetter(BaseModel):
    """Complete cover letter document."""
    id: Optional[str] = None
    title: str = "My Cover Letter"
    
    # Core sections
    sender: SenderInfo = Field(default_factory=SenderInfo)
    recipient: RecipientInfo = Field(default_factory=RecipientInfo)
    job_details: JobDetails = Field(default_factory=JobDetails)
    content: CoverLetterContent = Field(default_factory=CoverLetterContent)
    settings: CoverLetterSettings = Field(default_factory=CoverLetterSettings)
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Link to resume if available
    linked_resume_id: Optional[str] = None


class CoverLetterCreate(BaseModel):
    """Request model for creating a new cover letter."""
    title: str = "My Cover Letter"
    template: str = "professional"
    linked_resume_id: Optional[str] = None


class CoverLetterUpdate(BaseModel):
    """Request model for updating a cover letter."""
    title: Optional[str] = None
    sender: Optional[SenderInfo] = None
    recipient: Optional[RecipientInfo] = None
    job_details: Optional[JobDetails] = None
    content: Optional[CoverLetterContent] = None
    settings: Optional[CoverLetterSettings] = None


class AIContentRequest(BaseModel):
    """Request for AI-generated content suggestions."""
    section: str  # opening, body, closing
    job_title: str
    job_description: str = ""
    company_name: str = ""
    experience_summary: str = ""
    skills: List[str] = Field(default_factory=list)
    tone: CoverLetterTone = CoverLetterTone.PROFESSIONAL


class AIContentResponse(BaseModel):
    """Response with AI-generated content."""
    suggestions: List[str]
    section: str
    tips: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)


class CoverLetterTemplate(BaseModel):
    """Template metadata for cover letter templates."""
    id: str
    name: str
    description: str
    preview_image: str
    category: str  # modern, classic, creative, minimal
    is_premium: bool = False
    color_scheme: List[str] = Field(default_factory=list)


class CoverLetterExportRequest(BaseModel):
    """Request for exporting cover letter."""
    format: str = "pdf"  # pdf, docx, txt
    template: str = "professional"
