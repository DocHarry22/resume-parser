"""Tests for scoring engine."""

import pytest
from app.services.scoring_service import ScoringService
from app.models.resume_models import (
    Resume, ContactInfo, ExperienceItem, 
    EducationItem, SkillItem
)


@pytest.fixture
def scoring_service():
    """Create scoring service instance."""
    return ScoringService()


@pytest.fixture
def sample_resume():
    """Create a sample resume for testing."""
    return Resume(
        name="John Doe",
        contact=ContactInfo(
            email="john@example.com",
            phone="+1555123456"
        ),
        summary="Experienced software engineer with 5 years in web development.",
        experience=[
            ExperienceItem(
                job_title="Senior Software Engineer",
                company="TechCorp",
                start_date="Jan 2020",
                end_date="Present",
                is_current=True,
                bullets=[
                    "Led development of microservices architecture serving 1M+ users",
                    "Improved API performance by 40% through optimization",
                    "Mentored team of 5 junior developers"
                ]
            ),
            ExperienceItem(
                job_title="Software Engineer",
                company="StartupXYZ",
                start_date="2018",
                end_date="2020",
                bullets=[
                    "Built RESTful APIs using Python and FastAPI",
                    "Implemented CI/CD pipelines"
                ]
            )
        ],
        education=[
            EducationItem(
                degree="BSc",
                field_of_study="Computer Science",
                institution="University of Technology",
                graduation_year="2018"
            )
        ],
        skills=[
            SkillItem(name="Python", category="programming_languages", normalized_name="python"),
            SkillItem(name="JavaScript", category="programming_languages", normalized_name="javascript"),
            SkillItem(name="React", category="web_development", normalized_name="react"),
            SkillItem(name="Docker", category="cloud_devops", normalized_name="docker"),
            SkillItem(name="AWS", category="cloud_devops", normalized_name="aws"),
        ],
        raw_text="John Doe. Experienced software engineer. Contact: john@example.com"
    )


def test_scoring_service_initialization(scoring_service):
    """Test scoring service can be initialized."""
    assert scoring_service is not None
    assert scoring_service.weights is not None
    # Weights should sum to 1.0
    assert abs(sum(scoring_service.weights.values()) - 1.0) < 0.01


def test_score_resume(scoring_service, sample_resume):
    """Test complete resume scoring."""
    score = scoring_service.score_resume(sample_resume)
    
    assert score is not None
    assert 0 <= score.overall <= 100
    assert score.readability is not None
    assert score.structure is not None
    assert score.experience is not None
    assert score.skills is not None
    assert score.length is not None
    assert len(score.comments) > 0


def test_score_structure(scoring_service, sample_resume):
    """Test structure scoring."""
    structure = scoring_service._score_structure(sample_resume)
    
    assert structure.has_contact == True
    assert structure.has_experience == True
    assert structure.has_education == True
    assert structure.has_skills == True
    assert structure.structure_score > 0


def test_score_experience(scoring_service, sample_resume):
    """Test experience scoring."""
    experience = scoring_service._score_experience(sample_resume)
    
    assert experience.total_roles == 2
    assert experience.avg_bullets_per_role > 0
    assert experience.quantified_achievements > 0
    assert experience.experience_score > 0


def test_score_skills(scoring_service, sample_resume):
    """Test skills scoring."""
    skills = scoring_service._score_skills(sample_resume)
    
    assert skills.total_skills == 5
    assert skills.categorized_skills == 5
    assert skills.unique_categories >= 2
    assert skills.skills_score > 0


def test_contains_quantification(scoring_service):
    """Test quantification detection."""
    # Should detect quantification
    assert scoring_service._contains_quantification("Improved performance by 40%") == True
    assert scoring_service._contains_quantification("Managed $1M budget") == True
    assert scoring_service._contains_quantification("Led team of 5 developers") == True
    assert scoring_service._contains_quantification("Served 10K+ users") == True
    
    # Should not detect quantification
    assert scoring_service._contains_quantification("Developed web applications") == False
    assert scoring_service._contains_quantification("Worked in a team") == False


def test_score_empty_resume(scoring_service):
    """Test scoring an empty resume."""
    empty_resume = Resume(
        name=None,
        contact=ContactInfo(),
        raw_text="Empty resume"
    )
    
    score = scoring_service.score_resume(empty_resume)
    
    # Should still return a valid score (likely low)
    assert 0 <= score.overall <= 100
    assert score.experience.experience_score == 0
    assert score.skills.skills_score == 0
