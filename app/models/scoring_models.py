"""Data models for resume scoring."""

from pydantic import BaseModel, Field
from typing import Optional


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
    """Complete resume quality score."""
    overall: float = Field(..., description="Overall resume score (0-100)")
    readability: ReadabilityMetrics = Field(..., description="Readability analysis")
    structure: StructureMetrics = Field(..., description="Structure completeness")
    experience: ExperienceMetrics = Field(..., description="Experience quality")
    skills: SkillsMetrics = Field(..., description="Skills richness")
    length: LengthMetrics = Field(..., description="Length and layout")
    comments: list[str] = Field(default_factory=list, description="Improvement suggestions")
    
    class Config:
        json_schema_extra = {
            "example": {
                "overall": 78.5,
                "readability": {
                    "flesch_reading_ease": 65.0,
                    "flesch_kincaid_grade": 10.2,
                    "avg_words_per_sentence": 15.3,
                    "avg_syllables_per_word": 1.6,
                    "readability_score": 82.0
                },
                "structure": {
                    "has_contact": True,
                    "has_summary": True,
                    "has_experience": True,
                    "has_education": True,
                    "has_skills": True,
                    "section_count": 6,
                    "structure_score": 95.0
                },
                "experience": {
                    "total_roles": 3,
                    "avg_bullets_per_role": 4.3,
                    "quantified_achievements": 5,
                    "quantification_rate": 38.5,
                    "experience_score": 75.0
                },
                "skills": {
                    "total_skills": 18,
                    "categorized_skills": 15,
                    "unique_categories": 4,
                    "skills_score": 80.0
                },
                "length": {
                    "word_count": 650,
                    "estimated_pages": 1.4,
                    "is_too_short": False,
                    "is_too_long": False,
                    "length_score": 90.0
                },
                "comments": [
                    "Great structure with all key sections present",
                    "Consider adding more quantified achievements (numbers, percentages, KPIs)",
                    "Resume length is appropriate for most roles"
                ]
            }
        }
