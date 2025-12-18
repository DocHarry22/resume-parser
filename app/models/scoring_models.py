"""Data models for resume scoring with multi-tier scan modes."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from enum import Enum


class ScanMode(str, Enum):
    """Scan mode tiers with different analysis depth."""
    BASIC = "basic"
    ATS = "ats"
    EXPERT = "expert"


class ReadabilityMetrics(BaseModel):
    """Readability analysis metrics."""
    flesch_reading_ease: float = Field(..., description="Flesch Reading Ease score (0-100)")
    flesch_kincaid_grade: float = Field(..., description="Flesch-Kincaid Grade Level")
    avg_words_per_sentence: float = Field(..., description="Average words per sentence")
    avg_syllables_per_word: float = Field(..., description="Average syllables per word")
    readability_score: float = Field(..., description="Normalized readability score (0-100)")


class StructureMetrics(BaseModel):
    """Resume structure completeness metrics."""
    has_contact: bool = Field(..., description="Has contact information")
    has_summary: bool = Field(..., description="Has professional summary")
    has_experience: bool = Field(..., description="Has work experience")
    has_education: bool = Field(..., description="Has education section")
    has_skills: bool = Field(..., description="Has skills section")
    section_count: int = Field(..., description="Total number of identified sections")
    structure_score: float = Field(..., description="Structure completeness score (0-100)")


class ExperienceMetrics(BaseModel):
    """Work experience quality metrics."""
    total_roles: int = Field(..., description="Total number of roles")
    avg_bullets_per_role: float = Field(..., description="Average bullet points per role")
    quantified_achievements: int = Field(..., description="Number of quantified achievements")
    quantification_rate: float = Field(..., description="% of bullets with numbers")
    experience_score: float = Field(..., description="Experience quality score (0-100)")


class SkillsMetrics(BaseModel):
    """Skills analysis metrics."""
    total_skills: int = Field(..., description="Total number of skills")
    categorized_skills: int = Field(..., description="Number of categorized skills")
    unique_categories: int = Field(..., description="Number of skill categories")
    skills_score: float = Field(..., description="Skills richness score (0-100)")


class LengthMetrics(BaseModel):
    """Resume length and layout metrics."""
    word_count: int = Field(..., description="Total word count")
    estimated_pages: float = Field(..., description="Estimated page count")
    is_too_short: bool = Field(..., description="Is resume too short (<150 words)")
    is_too_long: bool = Field(..., description="Is resume too long (>2000 words)")
    length_score: float = Field(..., description="Length appropriateness score (0-100)")


class ResumeScore(BaseModel):
    """Complete resume quality score with multi-tier analysis."""
    overall: float = Field(..., description="Overall resume score (0-100)")
    
    # Primary metrics (always present)
    ats_compliance: float = Field(..., description="ATS compatibility score (0-100)")
    readability: float = Field(..., description="Readability score (0-100)")
    layout: float = Field(..., description="Layout and formatting score (0-100)")
    
    # Tier-dependent metrics (None for BASIC mode)
    experience: Optional[float] = Field(None, description="Experience quality score (0-100)")
    skills: Optional[float] = Field(None, description="Skills relevance score (0-100)")
    
    # Job match (only if job description provided)
    job_match: Optional[float] = Field(None, description="Job match score (0-100)")
    
    # Feedback
    comments: List[str] = Field(default_factory=list, description="Improvement suggestions")
    flags: List[str] = Field(default_factory=list, description="Warning flags and issues")
    
    # Mode and industry info
    mode: ScanMode = Field(default=ScanMode.BASIC, description="Scan mode used")
    industry: Optional[str] = Field(None, description="Industry optimization applied (engineering, it-software, finance, healthcare)")
    
    # Detailed metrics (for internal use / advanced display)
    detailed_metrics: Optional[dict] = Field(None, description="Detailed breakdown metrics")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "overall": 78.5,
            "ats_compliance": 85.0,
            "readability": 72.0,
            "layout": 88.0,
            "experience": 75.0,
            "skills": 80.0,
            "job_match": None,
            "comments": [
                "Add metrics to show real impact (e.g., 'Increased efficiency by 20%')",
                "Improve readability by shortening long sentences"
            ],
            "flags": [
                "⚠️ No achievements quantified",
                "⚠️ Missing professional summary"
            ],
            "mode": "ats",
            "detailed_metrics": {
                "readability_metrics": {
                    "flesch_reading_ease": 65.0,
                    "flesch_kincaid_grade": 10.2
                }
            }
        }
    })


# Legacy models for backward compatibility
class LegacyReadabilityMetrics(BaseModel):
    """Readability analysis metrics (legacy)."""
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    avg_words_per_sentence: float
    avg_syllables_per_word: float
    readability_score: float


class LegacyStructureMetrics(BaseModel):
    """Resume structure completeness metrics (legacy)."""
    has_contact: bool
    has_summary: bool
    has_experience: bool
    has_education: bool
    has_skills: bool
    section_count: int
    structure_score: float


class LegacyExperienceMetrics(BaseModel):
    """Work experience quality metrics (legacy)."""
    total_roles: int
    avg_bullets_per_role: float
    quantified_achievements: int
    quantification_rate: float
    experience_score: float


class LegacySkillsMetrics(BaseModel):
    """Skills analysis metrics (legacy)."""
    total_skills: int
    categorized_skills: int
    unique_categories: int
    skills_score: float


class LegacyLengthMetrics(BaseModel):
    """Resume length and layout metrics (legacy)."""
    word_count: int
    estimated_pages: float
    is_too_short: bool
    is_too_long: bool
    length_score: float


class LegacyResumeScore(BaseModel):
    """Complete resume quality score (legacy format for backward compatibility)."""
    overall: float
    readability: LegacyReadabilityMetrics
    structure: LegacyStructureMetrics
    experience: LegacyExperienceMetrics
    skills: LegacySkillsMetrics
    length: LegacyLengthMetrics
    comments: List[str] = Field(default_factory=list)
