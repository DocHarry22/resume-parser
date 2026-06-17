"""Tests for parsing pipeline."""

import pytest
from app.services.parsing_service import ParsingService
from app.models.resume_models import RawDocument, SectionType


@pytest.fixture
def parsing_service():
    """Create parsing service instance."""
    return ParsingService()


def test_parsing_service_initialization(parsing_service):
    """Test parsing service can be initialized."""
    assert parsing_service is not None
    assert parsing_service.section_headings is not None
    assert parsing_service.skills_taxonomy is not None


def test_detect_section_heading(parsing_service):
    """Test section heading detection."""
    # Should detect known headings
    assert parsing_service._detect_section_heading("EXPERIENCE") == SectionType.EXPERIENCE
    assert parsing_service._detect_section_heading("Work Experience") == SectionType.EXPERIENCE
    assert parsing_service._detect_section_heading("Education") == SectionType.EDUCATION
    assert parsing_service._detect_section_heading("Skills:") == SectionType.SKILLS
    
    # Should not detect random text
    assert parsing_service._detect_section_heading("John Doe") is None
    assert parsing_service._detect_section_heading("Software Engineer") is None
    assert parsing_service._detect_section_heading("AchievementsPlus") is None
    assert parsing_service._detect_section_heading("Projects (3)") == SectionType.PROJECTS


def test_extract_contact_info(parsing_service):
    """Test contact information extraction."""
    text = """
    John Doe
    john.doe@example.com
    +1 555-123-4567
    linkedin.com/in/johndoe
    github.com/johndoe
    """
    
    contact = parsing_service._extract_contact_info(text)
    
    assert contact.email == "john.doe@example.com"
    assert contact.phone is not None
    assert "linkedin" in contact.linkedin.lower() if contact.linkedin else False
    assert "github" in contact.github.lower() if contact.github else False


def test_extract_contact_info_with_labels_and_location(parsing_service):
    """Test labeled contact info and location extraction."""
    text = """
    Jane Doe
    Email: jane.doe+cv@example.co.uk
    Mobile: +44 20 1234 5678
    Cape Town, South Africa
    https://janedoe.dev
    """

    contact = parsing_service._extract_contact_info(text)

    assert contact.email == "jane.doe+cv@example.co.uk"
    assert contact.phone is not None
    assert contact.website == "janedoe.dev"
    assert "Cape Town" in contact.location


def test_extract_date_range(parsing_service):
    """Test date range extraction."""
    # Test various date formats
    text1 = "Jan 2021 - Mar 2023"
    dates1 = parsing_service._extract_date_range(text1)
    assert dates1.get('start') is not None
    assert dates1.get('end') is not None
    
    text2 = "2020 - Present"
    dates2 = parsing_service._extract_date_range(text2)
    assert dates2.get('start') is not None
    assert dates2.get('is_current') == True

    text3 = "January 2020 to February 2022"
    dates3 = parsing_service._extract_date_range(text3)
    assert dates3.get('start') is not None
    assert dates3.get('end') is not None


def test_detect_sections(parsing_service):
    """Test section detection in document."""
    document = RawDocument(
        full_text="Test resume",
        blocks=[
            "John Doe",
            "EXPERIENCE",
            "Software Engineer at TechCorp",
            "Developed applications",
            "EDUCATION",
            "BSc Computer Science"
        ]
    )
    
    sections = parsing_service.detect_sections(document)
    
    assert SectionType.EXPERIENCE in sections.sections
    assert SectionType.EDUCATION in sections.sections
    assert len(sections.sections[SectionType.EXPERIENCE]) > 0
    assert len(sections.sections[SectionType.EDUCATION]) > 0


def test_extract_education_graduation_year_and_field(parsing_service):
    """Education extraction should keep full graduation year."""
    document = RawDocument(
        full_text="Education\nBachelor of Science in Computer Science\nUniversity of Cape Town\n2019",
        blocks=[
            "EDUCATION",
            "Bachelor of Science in Computer Science\nUniversity of Cape Town\n2019"
        ]
    )

    resume = parsing_service.parse_resume(document)

    assert len(resume.education) == 1
    assert resume.education[0].graduation_year == "2019"
    assert resume.education[0].field_of_study is not None


def test_extract_skills_matches_taxonomy_aliases(parsing_service):
    """Skill extraction should normalize common JS aliases."""
    document = RawDocument(
        full_text="Skills\nNode.js, React.js, Python",
        blocks=[
            "SKILLS",
            "Node.js, React.js, Python"
        ]
    )

    resume = parsing_service.parse_resume(document)
    normalized_skills = {skill.normalized_name for skill in resume.skills}

    assert "node.js" in normalized_skills
    assert "react.js" in normalized_skills
    assert "python" in normalized_skills
