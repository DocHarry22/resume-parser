"""Data models for resume parsing."""

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import date
from enum import Enum


class SectionType(str, Enum):
    """Types of resume sections."""
    SUMMARY = "summary"
    EXPERIENCE = "experience"
    EDUCATION = "education"
    SKILLS = "skills"
    PROJECTS = "projects"
    CERTIFICATIONS = "certifications"
    ACHIEVEMENTS = "achievements"
    LANGUAGES = "languages"
    REFERENCES = "references"
    OTHER = "other"


class RawDocument(BaseModel):
    """Raw document extracted from PDF or DOCX."""
    full_text: str = Field(..., description="Complete document text")
    blocks: list[str] = Field(default_factory=list, description="Text blocks (paragraphs)")
    page_count: Optional[int] = Field(None, description="Number of pages (PDF only)")


class ResumeRawSections(BaseModel):
    """Resume sections detected from raw text."""
    sections: dict[SectionType, list[str]] = Field(
        default_factory=dict,
        description="Map of section type to text blocks"
    )


class ContactInfo(BaseModel):
    """Contact information extracted from resume."""
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    linkedin: Optional[str] = Field(None, description="LinkedIn URL")
    github: Optional[str] = Field(None, description="GitHub URL")
    website: Optional[str] = Field(None, description="Personal website")
    location: Optional[str] = Field(None, description="Location (city, country)")


class ExperienceItem(BaseModel):
    """Work experience entry."""
    job_title: Optional[str] = Field(None, description="Job title/role")
    company: Optional[str] = Field(None, description="Company name")
    location: Optional[str] = Field(None, description="Job location")
    start_date: Optional[str] = Field(None, description="Start date (parsed as string)")
    end_date: Optional[str] = Field(None, description="End date (parsed as string)")
    is_current: bool = Field(False, description="Is this a current position")
    bullets: list[str] = Field(default_factory=list, description="Responsibilities/achievements")
    raw_text: str = Field("", description="Original text block")


class EducationItem(BaseModel):
    """Education entry."""
    degree: Optional[str] = Field(None, description="Degree type (BSc, MEng, etc.)")
    field_of_study: Optional[str] = Field(None, description="Field/major")
    institution: Optional[str] = Field(None, description="School/university name")
    location: Optional[str] = Field(None, description="Institution location")
    graduation_year: Optional[str] = Field(None, description="Graduation year")
    gpa: Optional[str] = Field(None, description="GPA if mentioned")
    honors: Optional[str] = Field(None, description="Honors/awards")
    raw_text: str = Field("", description="Original text block")


class SkillItem(BaseModel):
    """Skill entry with categorization."""
    name: str = Field(..., description="Skill name")
    category: Optional[str] = Field(None, description="Skill category from taxonomy")
    normalized_name: str = Field("", description="Normalized skill name (lowercase)")


class ProjectItem(BaseModel):
    """Project entry."""
    title: Optional[str] = Field(None, description="Project title")
    description: Optional[str] = Field(None, description="Project description")
    technologies: list[str] = Field(default_factory=list, description="Technologies used")
    date: Optional[str] = Field(None, description="Project date/period")
    url: Optional[str] = Field(None, description="Project URL if mentioned")
    raw_text: str = Field("", description="Original text block")


class CertificationItem(BaseModel):
    """Certification entry."""
    name: str = Field(..., description="Certification name")
    issuer: Optional[str] = Field(None, description="Issuing organization")
    date: Optional[str] = Field(None, description="Issue/expiry date")
    credential_id: Optional[str] = Field(None, description="Credential ID")
    raw_text: str = Field("", description="Original text block")


class Resume(BaseModel):
    """Complete parsed resume."""
    name: Optional[str] = Field(None, description="Candidate name")
    contact: ContactInfo = Field(default_factory=ContactInfo, description="Contact information")
    summary: Optional[str] = Field(None, description="Professional summary/objective")
    experience: list[ExperienceItem] = Field(default_factory=list, description="Work experience")
    education: list[EducationItem] = Field(default_factory=list, description="Education history")
    skills: list[SkillItem] = Field(default_factory=list, description="Skills")
    projects: list[ProjectItem] = Field(default_factory=list, description="Projects")
    certifications: list[CertificationItem] = Field(default_factory=list, description="Certifications")
    languages: list[str] = Field(default_factory=list, description="Languages spoken")
    raw_text: str = Field("", description="Original resume text")
    
    model_config = ConfigDict(use_enum_values=True)
