"""
Resume/CV Builder Models

Modular data models for building and editing resumes.
Designed for easy expansion with new fields and sections.
"""

from typing import Optional, List, Dict, Any
from datetime import date
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class SectionType(str, Enum):
    """Types of resume sections that can be built/edited."""
    CONTACT = "contact"
    SUMMARY = "summary"
    EXPERIENCE = "experience"
    EDUCATION = "education"
    SKILLS = "skills"
    CERTIFICATIONS = "certifications"
    PROJECTS = "projects"
    ACHIEVEMENTS = "achievements"
    LANGUAGES = "languages"
    VOLUNTEER = "volunteer"
    PUBLICATIONS = "publications"
    REFERENCES = "references"


class ContactInfo(BaseModel):
    """Contact information section."""
    full_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    phone: Optional[str] = Field(None, max_length=20)
    location: Optional[str] = Field(None, max_length=100)
    linkedin: Optional[str] = Field(None, max_length=200)
    github: Optional[str] = Field(None, max_length=200)
    website: Optional[str] = Field(None, max_length=200)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "full_name": "John Doe",
                "email": "john.doe@email.com",
                "phone": "+1-555-0123",
                "location": "San Francisco, CA",
                "linkedin": "linkedin.com/in/johndoe",
                "github": "github.com/johndoe"
            }
        }
    )


class ProfessionalSummary(BaseModel):
    """Professional summary/objective section."""
    summary: str = Field(..., min_length=50, max_length=500)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "summary": "Experienced software engineer with 5+ years building scalable web applications. Expert in Python, React, and cloud technologies."
            }
        }
    )


class ExperienceEntry(BaseModel):
    """Single work experience entry."""
    company: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    start_date: str = Field(..., description="Format: YYYY-MM or 'Present'")
    end_date: Optional[str] = Field(None, description="Format: YYYY-MM or 'Present'")
    current: bool = Field(default=False)
    description: List[str] = Field(default_factory=list, max_length=10)
    achievements: List[str] = Field(default_factory=list, max_length=5)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "company": "Tech Corp",
                "position": "Senior Software Engineer",
                "location": "San Francisco, CA",
                "start_date": "2020-01",
                "end_date": "Present",
                "current": True,
                "description": [
                    "Led development of microservices architecture",
                    "Mentored team of 5 junior developers"
                ],
                "achievements": [
                    "Reduced API latency by 40%",
                    "Increased test coverage to 95%"
                ]
            }
        }
    )


class EducationEntry(BaseModel):
    """Single education entry."""
    institution: str = Field(..., min_length=1, max_length=100)
    degree: str = Field(..., min_length=1, max_length=100)
    field_of_study: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    start_date: Optional[str] = Field(None, description="Format: YYYY-MM")
    end_date: Optional[str] = Field(None, description="Format: YYYY-MM or 'Present'")
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    honors: List[str] = Field(default_factory=list)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "institution": "Stanford University",
                "degree": "Bachelor of Science",
                "field_of_study": "Computer Science",
                "location": "Stanford, CA",
                "end_date": "2018-06",
                "gpa": 3.8,
                "honors": ["Cum Laude", "Dean's List"]
            }
        }
    )


class SkillCategory(BaseModel):
    """Categorized skills."""
    category: str = Field(..., min_length=1, max_length=50)
    skills: List[str] = Field(..., min_length=1, max_length=20)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "Programming Languages",
                "skills": ["Python", "JavaScript", "TypeScript", "Go"]
            }
        }
    )


class CertificationEntry(BaseModel):
    """Single certification entry."""
    name: str = Field(..., min_length=1, max_length=100)
    issuer: str = Field(..., min_length=1, max_length=100)
    issue_date: Optional[str] = Field(None, description="Format: YYYY-MM")
    expiry_date: Optional[str] = Field(None, description="Format: YYYY-MM")
    credential_id: Optional[str] = Field(None, max_length=100)
    credential_url: Optional[str] = Field(None, max_length=200)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "AWS Certified Solutions Architect",
                "issuer": "Amazon Web Services",
                "issue_date": "2023-06",
                "expiry_date": "2026-06",
                "credential_id": "AWS-12345"
            }
        }
    )


class ProjectEntry(BaseModel):
    """Single project entry."""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=10, max_length=300)
    technologies: List[str] = Field(default_factory=list, max_length=10)
    url: Optional[str] = Field(None, max_length=200)
    github: Optional[str] = Field(None, max_length=200)
    start_date: Optional[str] = Field(None, description="Format: YYYY-MM")
    end_date: Optional[str] = Field(None, description="Format: YYYY-MM")
    highlights: List[str] = Field(default_factory=list, max_length=5)
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "E-commerce Platform",
                "description": "Built scalable e-commerce platform serving 100K+ users",
                "technologies": ["React", "Node.js", "PostgreSQL", "AWS"],
                "github": "github.com/user/project",
                "highlights": [
                    "Processed $1M+ in transactions",
                    "Achieved 99.9% uptime"
                ]
            }
        }
    )


class ResumeBuilder(BaseModel):
    """
    Complete resume builder model.
    All sections are optional to allow incremental building.
    """
    # Metadata
    id: Optional[str] = Field(None, description="Resume ID for saving/loading")
    title: str = Field(default="My Resume", max_length=100)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    # Core sections
    contact: Optional[ContactInfo] = None
    summary: Optional[ProfessionalSummary] = None
    
    # List-based sections (multiple entries)
    experience: List[ExperienceEntry] = Field(default_factory=list)
    education: List[EducationEntry] = Field(default_factory=list)
    skills: List[SkillCategory] = Field(default_factory=list)
    certifications: List[CertificationEntry] = Field(default_factory=list)
    projects: List[ProjectEntry] = Field(default_factory=list)
    
    # Optional sections
    achievements: List[str] = Field(default_factory=list, max_length=10)
    languages: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Format: [{'language': 'English', 'proficiency': 'Native'}]"
    )
    volunteer: List[Dict[str, Any]] = Field(default_factory=list)
    publications: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Custom sections for extensibility
    custom_sections: Dict[str, Any] = Field(
        default_factory=dict,
        description="Allows adding custom sections not predefined"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Software Engineer Resume",
                "contact": {
                    "full_name": "Jane Smith",
                    "email": "jane@email.com",
                    "phone": "+1-555-0123"
                },
                "summary": {
                    "summary": "Full-stack developer with 7 years experience..."
                },
                "experience": [],
                "education": [],
                "skills": []
            }
        }
    )


class ResumeUpdate(BaseModel):
    """
    Partial update model for resume builder.
    All fields optional to support PATCH operations.
    """
    title: Optional[str] = Field(None, max_length=100)
    contact: Optional[ContactInfo] = None
    summary: Optional[ProfessionalSummary] = None
    experience: Optional[List[ExperienceEntry]] = None
    education: Optional[List[EducationEntry]] = None
    skills: Optional[List[SkillCategory]] = None
    certifications: Optional[List[CertificationEntry]] = None
    projects: Optional[List[ProjectEntry]] = None
    achievements: Optional[List[str]] = None
    languages: Optional[List[Dict[str, str]]] = None
    volunteer: Optional[List[Dict[str, Any]]] = None
    publications: Optional[List[Dict[str, Any]]] = None
    custom_sections: Optional[Dict[str, Any]] = None


class BuilderResponse(BaseModel):
    """Response model for builder operations."""
    success: bool
    message: str
    resume: Optional[ResumeBuilder] = None
    errors: Optional[Dict[str, List[str]]] = None
