"""Tests for multi-tier scoring engine."""

import pytest
from app.services.scoring_service import ScoringService, get_scoring_service
from app.models.scoring_models import ScanMode, ResumeScore
from app.models.resume_models import (
    Resume, ContactInfo, ExperienceItem, 
    EducationItem, SkillItem, CertificationItem
)


@pytest.fixture
def scoring_service():
    """Create scoring service instance."""
    return ScoringService()


@pytest.fixture
def sample_resume():
    """Create a well-structured sample resume for testing."""
    return Resume(
        name="John Doe",
        contact=ContactInfo(
            email="john@example.com",
            phone="+1555123456",
            location="San Francisco, CA"
        ),
        summary="Experienced software engineer with 5 years in web development, specializing in Python and cloud technologies.",
        experience=[
            ExperienceItem(
                job_title="Senior Software Engineer",
                company="TechCorp Inc.",
                location="San Francisco, CA",
                start_date="Jan 2020",
                end_date="Present",
                is_current=True,
                bullets=[
                    "Led development of microservices architecture serving 1M+ users",
                    "Improved API performance by 40% through optimization and caching",
                    "Mentored team of 5 junior developers on best practices",
                    "Reduced infrastructure costs by $200K annually"
                ]
            ),
            ExperienceItem(
                job_title="Software Engineer",
                company="StartupXYZ",
                location="New York, NY",
                start_date="Jun 2018",
                end_date="Dec 2019",
                bullets=[
                    "Built RESTful APIs using Python and FastAPI",
                    "Implemented CI/CD pipelines reducing deployment time by 60%",
                    "Managed database migrations for PostgreSQL"
                ]
            ),
            ExperienceItem(
                job_title="Junior Developer",
                company="WebAgency",
                location="Boston, MA",
                start_date="Jan 2017",
                end_date="May 2018",
                bullets=[
                    "Developed frontend components using React",
                    "Collaborated with designers on UI/UX improvements"
                ]
            )
        ],
        education=[
            EducationItem(
                degree="BSc",
                field_of_study="Computer Science",
                institution="University of Technology",
                graduation_year="2017",
                gpa="3.8"
            )
        ],
        skills=[
            SkillItem(name="Python", category="programming_languages", normalized_name="python"),
            SkillItem(name="JavaScript", category="programming_languages", normalized_name="javascript"),
            SkillItem(name="TypeScript", category="programming_languages", normalized_name="typescript"),
            SkillItem(name="React", category="web_development", normalized_name="react"),
            SkillItem(name="Node.js", category="web_development", normalized_name="nodejs"),
            SkillItem(name="Docker", category="cloud_devops", normalized_name="docker"),
            SkillItem(name="AWS", category="cloud_devops", normalized_name="aws"),
            SkillItem(name="PostgreSQL", category="databases", normalized_name="postgresql"),
            SkillItem(name="MongoDB", category="databases", normalized_name="mongodb"),
            SkillItem(name="Git", category="tools", normalized_name="git"),
        ],
        certifications=[
            CertificationItem(
                name="AWS Solutions Architect",
                issuer="Amazon",
                date="2021"
            )
        ],
        raw_text="John Doe. Experienced software engineer with 5 years in web development. Contact: john@example.com, +1555123456. Skills: Python, JavaScript, React, Docker, AWS. Experience at TechCorp, StartupXYZ, WebAgency. BSc Computer Science from University of Technology. Led development of microservices serving 1M+ users. Improved API performance by 40%. Reduced costs by $200K."
    )


@pytest.fixture
def minimal_resume():
    """Create a minimal resume with missing sections."""
    return Resume(
        name="Jane Smith",
        contact=ContactInfo(),  # No contact info
        summary=None,
        experience=[],
        education=[],
        skills=[],
        raw_text="Jane Smith. Looking for a job."
    )


@pytest.fixture
def resume_with_bias_info():
    """Create a resume with bias-inducing personal info."""
    return Resume(
        name="Test Person",
        contact=ContactInfo(email="test@example.com"),
        summary="Experienced professional",
        experience=[
            ExperienceItem(
                job_title="Manager",
                company="Company",
                bullets=["Managed team", "Improved processes"]
            )
        ],
        education=[],
        skills=[SkillItem(name="Management", normalized_name="management")],
        raw_text="Test Person. Date of Birth: 1990-01-01. Gender: Male. Experienced professional. Manager at Company. Managed team. Contact: test@example.com"
    )


# ============================================
# INITIALIZATION TESTS
# ============================================

def test_scoring_service_initialization(scoring_service):
    """Test scoring service can be initialized."""
    assert scoring_service is not None
    assert scoring_service.nlp_service is not None


def test_get_scoring_service_singleton():
    """Test that get_scoring_service returns a singleton."""
    service1 = get_scoring_service()
    service2 = get_scoring_service()
    assert service1 is service2


# ============================================
# BASIC MODE TESTS
# ============================================

def test_basic_mode_returns_correct_structure(scoring_service, sample_resume):
    """Test BASIC mode returns expected structure."""
    score = scoring_service.score_resume(sample_resume, mode=ScanMode.BASIC)
    
    assert isinstance(score, ResumeScore)
    assert score.mode == ScanMode.BASIC
    assert 0 <= score.overall <= 100
    assert score.ats_compliance is not None
    assert score.readability is not None
    assert score.layout is not None
    
    # BASIC mode should NOT return experience and skills scores
    assert score.experience is None
    assert score.skills is None
    
    # Should have comments
    assert isinstance(score.comments, list)
    
    # Should have flags
    assert isinstance(score.flags, list)


def test_basic_mode_default(scoring_service, sample_resume):
    """Test that BASIC is the default mode."""
    score = scoring_service.score_resume(sample_resume)
    assert score.mode == ScanMode.BASIC


# ============================================
# ATS MODE TESTS
# ============================================

def test_ats_mode_returns_all_metrics(scoring_service, sample_resume):
    """Test ATS mode returns all metrics including experience and skills."""
    score = scoring_service.score_resume(sample_resume, mode=ScanMode.ATS)
    
    assert score.mode == ScanMode.ATS
    assert 0 <= score.overall <= 100
    assert score.ats_compliance is not None
    assert score.readability is not None
    assert score.layout is not None
    
    # ATS mode SHOULD return experience and skills scores
    assert score.experience is not None
    assert score.skills is not None
    assert 0 <= score.experience <= 100
    assert 0 <= score.skills <= 100


def test_ats_mode_scores_higher_for_good_resume(scoring_service, sample_resume, minimal_resume):
    """Test that well-structured resume scores higher than minimal resume."""
    good_score = scoring_service.score_resume(sample_resume, mode=ScanMode.ATS)
    bad_score = scoring_service.score_resume(minimal_resume, mode=ScanMode.ATS)
    
    assert good_score.overall > bad_score.overall
    assert good_score.ats_compliance > bad_score.ats_compliance


# ============================================
# EXPERT MODE TESTS
# ============================================

def test_expert_mode_returns_all_metrics(scoring_service, sample_resume):
    """Test EXPERT mode returns all metrics."""
    score = scoring_service.score_resume(sample_resume, mode=ScanMode.EXPERT)
    
    assert score.mode == ScanMode.EXPERT
    assert 0 <= score.overall <= 100
    assert score.experience is not None
    assert score.skills is not None


def test_expert_mode_flags_bias_content(scoring_service, resume_with_bias_info):
    """Test EXPERT mode detects bias-inducing content."""
    score = scoring_service.score_resume(resume_with_bias_info, mode=ScanMode.EXPERT)
    
    # Should have at least 2 flags for missing sections or bias content
    assert len(score.flags) >= 2
    
    # Check for bias-related flags
    bias_flags = [f for f in score.flags if "bias" in f.lower()]
    assert len(bias_flags) >= 1


def test_expert_mode_rewards_certifications(scoring_service, sample_resume):
    """Test EXPERT mode gives bonus for certifications."""
    # Sample resume has certifications
    score_with_certs = scoring_service.score_resume(sample_resume, mode=ScanMode.EXPERT)
    
    # Create same resume without certifications
    resume_no_certs = sample_resume.model_copy()
    resume_no_certs.certifications = []
    
    score_without_certs = scoring_service.score_resume(resume_no_certs, mode=ScanMode.EXPERT)
    
    # Score with certs should be higher (due to expert bonus)
    assert score_with_certs.overall >= score_without_certs.overall


def test_expert_mode_detects_quantified_achievements(scoring_service, sample_resume):
    """Test EXPERT mode detects quantified achievements."""
    score = scoring_service.score_resume(sample_resume, mode=ScanMode.EXPERT)
    
    # Sample resume has many quantified achievements (40%, $200K, 1M+, etc.)
    # Should NOT have the "no achievements quantified" flag
    quantified_flag = [f for f in score.flags if "quantified" in f.lower()]
    assert len(quantified_flag) == 0


def test_expert_mode_flags_missing_quantification(scoring_service):
    """Test EXPERT mode flags resumes without quantified achievements."""
    resume_no_metrics = Resume(
        name="Test User",
        contact=ContactInfo(email="test@test.com"),
        experience=[
            ExperienceItem(
                job_title="Developer",
                company="Company",
                bullets=[
                    "Developed web applications",
                    "Worked in a team environment",
                    "Managed projects"
                ]
            )
        ],
        education=[],
        skills=[SkillItem(name="Python", normalized_name="python")],
        raw_text="Test User. Developer at Company. Developed web applications. Worked in a team. test@test.com"
    )
    
    score = scoring_service.score_resume(resume_no_metrics, mode=ScanMode.EXPERT)
    
    # Should have flag about missing quantification
    quantified_flags = [f for f in score.flags if "quantified" in f.lower() or "metrics" in f.lower()]
    assert len(quantified_flags) >= 1


# ============================================
# JOB MATCH TESTS
# ============================================

def test_job_match_returns_score_when_provided(scoring_service, sample_resume):
    """Test job match score is returned when job description is provided."""
    job_description = """
    We are looking for a Senior Python Developer with experience in:
    - Python, FastAPI, Django
    - AWS, Docker, Kubernetes
    - PostgreSQL, MongoDB
    - CI/CD pipelines
    - Microservices architecture
    """
    
    score = scoring_service.score_resume(
        sample_resume, 
        mode=ScanMode.ATS,
        job_description=job_description
    )
    
    assert score.job_match is not None
    assert 0 <= score.job_match <= 100


def test_job_match_none_when_not_provided(scoring_service, sample_resume):
    """Test job match is None when no job description provided."""
    score = scoring_service.score_resume(sample_resume, mode=ScanMode.ATS)
    assert score.job_match is None


def test_job_match_higher_for_relevant_resume(scoring_service, sample_resume):
    """Test job match is higher for relevant resumes."""
    # Job description matching sample_resume skills
    relevant_job = "Senior Python Developer with AWS, Docker, React experience"
    
    # Job description NOT matching sample_resume
    irrelevant_job = "Registered Nurse with patient care and medical billing experience"
    
    score_relevant = scoring_service.score_resume(
        sample_resume, 
        mode=ScanMode.ATS,
        job_description=relevant_job
    )
    
    score_irrelevant = scoring_service.score_resume(
        sample_resume, 
        mode=ScanMode.ATS,
        job_description=irrelevant_job
    )
    
    assert score_relevant.job_match > score_irrelevant.job_match


# ============================================
# FLAG EXTRACTION TESTS
# ============================================

def test_flags_for_missing_contact(scoring_service, minimal_resume):
    """Test flags are generated for missing contact info."""
    score = scoring_service.score_resume(minimal_resume, mode=ScanMode.BASIC)
    
    # Should have flags for missing email and phone
    email_flag = any("email" in f.lower() for f in score.flags)
    phone_flag = any("phone" in f.lower() for f in score.flags)
    
    assert email_flag or phone_flag


def test_flags_for_complete_resume(scoring_service, sample_resume):
    """Test fewer flags for complete resume."""
    score = scoring_service.score_resume(sample_resume, mode=ScanMode.ATS)
    
    # Well-structured resume should have fewer flags
    # Should NOT have missing contact, missing experience, etc.
    critical_flags = [f for f in score.flags if "Missing" in f]
    assert len(critical_flags) == 0


# ============================================
# COMMENT GENERATION TESTS
# ============================================

def test_comments_are_actionable(scoring_service, minimal_resume):
    """Test that comments are actionable suggestions."""
    score = scoring_service.score_resume(minimal_resume, mode=ScanMode.ATS)
    
    # Should have comments
    assert len(score.comments) > 0
    
    # Comments should be strings
    for comment in score.comments:
        assert isinstance(comment, str)
        assert len(comment) > 10  # Not too short


def test_comments_limited_to_six(scoring_service, minimal_resume):
    """Test that comments are limited to 6 max."""
    score = scoring_service.score_resume(minimal_resume, mode=ScanMode.EXPERT)
    assert len(score.comments) <= 6


# ============================================
# QUANTIFICATION DETECTION TESTS
# ============================================

def test_contains_quantification_percentages(scoring_service):
    """Test quantification detection for percentages."""
    assert scoring_service._contains_quantification("Improved performance by 40%") == True
    assert scoring_service._contains_quantification("Increased revenue 25%") == True


def test_contains_quantification_currency(scoring_service):
    """Test quantification detection for currency."""
    assert scoring_service._contains_quantification("Managed $1M budget") == True
    assert scoring_service._contains_quantification("Saved R50000 in costs") == True
    assert scoring_service._contains_quantification("£100000 revenue") == True


def test_contains_quantification_large_numbers(scoring_service):
    """Test quantification detection for large numbers."""
    assert scoring_service._contains_quantification("Served 10K+ users") == True
    assert scoring_service._contains_quantification("Processed 1M transactions") == True
    assert scoring_service._contains_quantification("1,000,000 records") == True


def test_contains_quantification_negative(scoring_service):
    """Test quantification detection returns False for plain text."""
    assert scoring_service._contains_quantification("Developed web applications") == False
    assert scoring_service._contains_quantification("Worked in a team") == False
    assert scoring_service._contains_quantification("Excellent communication skills") == False


# ============================================
# DETAILED METRICS TESTS
# ============================================

def test_detailed_metrics_included(scoring_service, sample_resume):
    """Test that detailed metrics are included in response."""
    score = scoring_service.score_resume(sample_resume, mode=ScanMode.ATS)
    
    assert score.detailed_metrics is not None
    assert 'readability' in score.detailed_metrics
    assert 'layout' in score.detailed_metrics
    assert 'structure' in score.detailed_metrics
    assert 'experience' in score.detailed_metrics
    assert 'skills' in score.detailed_metrics


def test_detailed_metrics_readability(scoring_service, sample_resume):
    """Test readability metrics are correct."""
    score = scoring_service.score_resume(sample_resume, mode=ScanMode.ATS)
    
    readability = score.detailed_metrics['readability']
    assert 'flesch_reading_ease' in readability
    assert 'flesch_kincaid_grade' in readability
    assert 0 <= readability['flesch_reading_ease'] <= 100


def test_detailed_metrics_experience(scoring_service, sample_resume):
    """Test experience metrics are correct."""
    score = scoring_service.score_resume(sample_resume, mode=ScanMode.ATS)
    
    experience = score.detailed_metrics['experience']
    assert experience['total_roles'] == 3
    assert experience['quantified_achievements'] > 0


# ============================================
# EMPTY/EDGE CASE TESTS
# ============================================

def test_score_empty_resume(scoring_service):
    """Test scoring an empty resume doesn't crash."""
    empty_resume = Resume(
        name=None,
        contact=ContactInfo(),
        raw_text="Empty"
    )
    
    score = scoring_service.score_resume(empty_resume, mode=ScanMode.BASIC)
    
    assert 0 <= score.overall <= 100
    assert score.mode == ScanMode.BASIC


def test_score_very_short_resume(scoring_service):
    """Test scoring a very short resume (potential image-only PDF)."""
    short_resume = Resume(
        name="Test",
        contact=ContactInfo(),
        raw_text="Short text"  # Very short, might trigger image-only flag
    )
    
    score = scoring_service.score_resume(short_resume, mode=ScanMode.BASIC)
    
    # Should handle gracefully
    assert 0 <= score.overall <= 100
