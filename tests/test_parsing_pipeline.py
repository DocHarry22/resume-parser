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
