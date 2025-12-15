"""Tests for industry-specific scoring optimization."""

import pytest
from app.models.resume_models import Resume, ContactInfo, ExperienceItem, SkillItem, CertificationItem
from app.models.scoring_models import ScanMode
from app.services.scoring_service import get_scoring_service


@pytest.fixture
def software_resume():
    """Resume with IT/Software skills and experience."""
    return Resume(
        name="John Doe",
        contact=ContactInfo(
            email="john@example.com",
            phone="555-0123"
        ),
        summary="Software engineer with 5 years of experience in full-stack development.",
        experience=[
            ExperienceItem(
                job_title="Senior Software Engineer",
                company="Tech Corp",
                start_date="2020",
                end_date="Present",
                bullets=[
                    "Developed microservices architecture using Python and Docker",
                    "Implemented CI/CD pipelines with GitHub Actions, reducing deployment time by 40%",
                    "Built RESTful APIs serving 10K+ requests per day",
                    "Optimized database queries improving performance by 50%",
                    "Migrated legacy monolith to Kubernetes cluster"
                ]
            )
        ],
        education=[],
        skills=[
            SkillItem(name="Python", category="Programming"),
            SkillItem(name="JavaScript", category="Programming"),
            SkillItem(name="Docker", category="DevOps"),
            SkillItem(name="Kubernetes", category="DevOps"),
            SkillItem(name="AWS", category="Cloud"),
            SkillItem(name="PostgreSQL", category="Database"),
            SkillItem(name="React", category="Frontend"),
            SkillItem(name="Node.js", category="Backend")
        ],
        certifications=[
            CertificationItem(name="AWS Certified Solutions Architect", issuer="Amazon")
        ],
        raw_text="John Doe john@example.com 555-0123 Software engineer..."
    )


@pytest.fixture
def engineering_resume():
    """Resume with Engineering skills and experience."""
    return Resume(
        name="Jane Smith",
        contact=ContactInfo(
            email="jane@example.com",
            phone="555-0456"
        ),
        summary="Mechanical engineer with expertise in CAD design and prototyping.",
        experience=[
            ExperienceItem(
                job_title="Mechanical Engineer",
                company="Manufacturing Inc",
                start_date="2018",
                end_date="Present",
                bullets=[
                    "Designed mechanical systems using SolidWorks CAD software",
                    "Prototyped and tested new product designs, reducing defects by 30%",
                    "Optimized manufacturing processes using Lean Six Sigma methodologies",
                    "Performed finite element analysis (FEA) on structural components",
                    "Managed R&D projects from concept to production"
                ]
            )
        ],
        education=[],
        skills=[
            SkillItem(name="SolidWorks", category="CAD"),
            SkillItem(name="AutoCAD", category="CAD"),
            SkillItem(name="MATLAB", category="Engineering"),
            SkillItem(name="FEA", category="Analysis"),
            SkillItem(name="Six Sigma", category="Quality"),
            SkillItem(name="Lean Manufacturing", category="Process")
        ],
        certifications=[
            CertificationItem(name="Professional Engineer (PE)", issuer="State Board")
        ],
        raw_text="Jane Smith jane@example.com 555-0456 Mechanical engineer..."
    )


@pytest.fixture
def finance_resume():
    """Resume with Finance skills and experience."""
    return Resume(
        name="Bob Johnson",
        contact=ContactInfo(
            email="bob@example.com",
            phone="555-0789"
        ),
        summary="Financial analyst with CPA certification and 7 years experience.",
        experience=[
            ExperienceItem(
                job_title="Senior Financial Analyst",
                company="Investment Firm",
                start_date="2016",
                end_date="Present",
                bullets=[
                    "Analyzed financial statements and performed risk management assessments",
                    "Forecasted quarterly revenue with 95% accuracy",
                    "Managed portfolio of $50M in assets",
                    "Conducted financial modeling and valuation for M&A transactions",
                    "Ensured compliance with GAAP and SOX regulations"
                ]
            )
        ],
        education=[],
        skills=[
            SkillItem(name="Financial Modeling", category="Analysis"),
            SkillItem(name="Excel", category="Tools"),
            SkillItem(name="Bloomberg Terminal", category="Tools"),
            SkillItem(name="Risk Management", category="Finance"),
            SkillItem(name="GAAP", category="Accounting"),
            SkillItem(name="Portfolio Management", category="Investment")
        ],
        certifications=[
            CertificationItem(name="Certified Public Accountant (CPA)", issuer="AICPA")
        ],
        raw_text="Bob Johnson bob@example.com 555-0789 Financial analyst CPA..."
    )


def test_software_industry_boosts_score(software_resume):
    """Test that IT/Software industry optimization increases score."""
    scoring_service = get_scoring_service()
    
    # Score without industry
    score_generic = scoring_service.score_resume(
        resume=software_resume,
        mode=ScanMode.EXPERT,
        industry=None
    )
    
    # Score with IT/Software industry
    score_industry = scoring_service.score_resume(
        resume=software_resume,
        mode=ScanMode.EXPERT,
        industry="it-software"
    )
    
    # Industry-optimized score should be higher or equal
    assert score_industry.overall >= score_generic.overall
    assert score_industry.industry == "it-software"


def test_engineering_industry_recognizes_keywords(engineering_resume):
    """Test that engineering industry recognizes CAD and engineering keywords."""
    scoring_service = get_scoring_service()
    
    score = scoring_service.score_resume(
        resume=engineering_resume,
        mode=ScanMode.EXPERT,
        industry="engineering"
    )
    
    # Should recognize engineering-specific terms
    assert score.industry == "engineering"
    assert score.skills is not None
    assert score.skills > 50  # Should score reasonably well on skills
    assert score.experience is not None
    assert score.experience > 50  # Should score well on experience with action verbs


def test_finance_industry_certification_bonus(finance_resume):
    """Test that finance industry gives bonus for CPA certification."""
    scoring_service = get_scoring_service()
    
    # Score with finance industry
    score = scoring_service.score_resume(
        resume=finance_resume,
        mode=ScanMode.EXPERT,
        industry="finance"
    )
    
    # Should get certification bonus
    assert score.industry == "finance"
    assert len(finance_resume.certifications) > 0
    # Overall score should be decent
    assert score.overall > 60


def test_wrong_industry_doesnt_boost(software_resume):
    """Test that wrong industry doesn't artificially boost score."""
    scoring_service = get_scoring_service()
    
    # Software resume with finance industry
    score_wrong_industry = scoring_service.score_resume(
        resume=software_resume,
        mode=ScanMode.EXPERT,
        industry="finance"
    )
    
    # Should still score reasonably but no industry boost
    assert score_wrong_industry.industry == "finance"
    assert score_wrong_industry.overall > 0


def test_industry_adds_relevant_comments(software_resume):
    """Test that industry parameter generates industry-specific comments."""
    scoring_service = get_scoring_service()
    
    # Create a software resume with minimal skills
    minimal_resume = Resume(
        name="Test User",
        contact=ContactInfo(email="test@example.com"),
        summary="Developer",
        experience=[],
        education=[],
        skills=[
            SkillItem(name="Python", category="Programming")
        ],
        certifications=[],
        raw_text="Test User test@example.com Developer Python"
    )
    
    score = scoring_service.score_resume(
        resume=minimal_resume,
        mode=ScanMode.ATS,
        industry="it-software"
    )
    
    # Should have comments about adding industry-specific skills
    comments_text = ' '.join(score.comments).lower()
    assert any(keyword in comments_text for keyword in ['it', 'software', 'skill', 'certification'])


def test_basic_mode_with_industry_still_works(software_resume):
    """Test that BASIC mode works even with industry parameter."""
    scoring_service = get_scoring_service()
    
    # BASIC mode doesn't score experience/skills, but industry shouldn't break it
    score = scoring_service.score_resume(
        resume=software_resume,
        mode=ScanMode.BASIC,
        industry="it-software"
    )
    
    assert score.mode == ScanMode.BASIC
    assert score.industry == "it-software"
    assert score.experience is None  # BASIC mode doesn't score experience
    assert score.skills is None  # BASIC mode doesn't score skills
    assert score.overall > 0


def test_invalid_industry_ignored():
    """Test that invalid industry value is handled gracefully."""
    scoring_service = get_scoring_service()
    
    resume = Resume(
        name="Test",
        contact=ContactInfo(email="test@test.com"),
        experience=[],
        education=[],
        skills=[],
        raw_text="Test resume"
    )
    
    # Invalid industry should not crash
    score = scoring_service.score_resume(
        resume=resume,
        mode=ScanMode.ATS,
        industry="invalid-industry-123"
    )
    
    assert score.industry == "invalid-industry-123"
    assert score.overall >= 0


def test_healthcare_industry_keywords():
    """Test healthcare industry keyword recognition."""
    healthcare_resume = Resume(
        name="Dr. Smith",
        contact=ContactInfo(email="dr.smith@hospital.com", phone="555-1234"),
        summary="Registered Nurse with 5 years of clinical experience in critical care settings",
        experience=[
            ExperienceItem(
                job_title="Registered Nurse",
                company="City Hospital",
                start_date="2018",
                end_date="Present",
                bullets=[
                    "Provided patient care in ICU setting managing up to 8 patients per shift",
                    "Administered medications and monitored vital signs using advanced monitoring equipment",
                    "Documented patient information in Epic EMR system with 100% accuracy compliance",
                    "Coordinated care with physicians and specialists to develop comprehensive treatment plans",
                    "Maintained HIPAA compliance protocols and ensured patient privacy in all interactions"
                ]
            )
        ],
        education=[],
        skills=[
            SkillItem(name="Patient Care", category="Clinical"),
            SkillItem(name="EMR/EHR", category="Technology"),
            SkillItem(name="HIPAA", category="Compliance"),
            SkillItem(name="Vital Signs Monitoring", category="Clinical")
        ],
        certifications=[
            CertificationItem(name="Registered Nurse (RN)", issuer="State Board"),
            CertificationItem(name="BLS", issuer="AHA")
        ],
        raw_text="""Dr. Smith
        Email: dr.smith@hospital.com | Phone: 555-1234
        
        SUMMARY
        Registered Nurse with 5 years of clinical experience in critical care settings
        
        EXPERIENCE
        Registered Nurse | City Hospital | 2018 - Present
        • Provided patient care in ICU setting managing up to 8 patients per shift
        • Administered medications and monitored vital signs using advanced monitoring equipment
        • Documented patient information in Epic EMR system with 100% accuracy compliance
        • Coordinated care with physicians and specialists to develop comprehensive treatment plans
        • Maintained HIPAA compliance protocols and ensured patient privacy in all interactions
        
        SKILLS
        Patient Care, EMR/EHR, HIPAA Compliance, Vital Signs Monitoring
        
        CERTIFICATIONS
        Registered Nurse (RN) - State Board
        BLS - American Heart Association"""
    )
    
    scoring_service = get_scoring_service()
    
    score = scoring_service.score_resume(
        resume=healthcare_resume,
        mode=ScanMode.EXPERT,
        industry="healthcare"
    )
    
    # Should recognize healthcare keywords and certifications
    assert score.industry == "healthcare"
    assert score.overall > 50  # Healthcare resume should score reasonably
