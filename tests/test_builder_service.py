"""
Tests for Resume Builder Service

Tests for CRUD operations and resume building functionality.
"""

import pytest
from datetime import datetime

from app.services.builder_service import ResumeBuilderService
from app.models.builder_models import (
    ResumeBuilder, ResumeUpdate, ContactInfo,
    ExperienceEntry, EducationEntry, SkillCategory,
    SectionType
)
from app.models.resume_models import (
    Resume, ContactInfo as ParsedContactInfo, 
    ExperienceItem, EducationItem, SkillItem
)


@pytest.fixture
def builder_service():
    """Fixture for builder service."""
    return ResumeBuilderService()


@pytest.fixture
def sample_contact():
    """Sample contact info."""
    return ContactInfo(
        full_name="Jane Doe",
        email="jane@example.com",
        phone="+1-555-0123",
        location="San Francisco, CA"
    )


@pytest.fixture
def sample_experience():
    """Sample experience entry."""
    return ExperienceEntry(
        company="Tech Corp",
        position="Software Engineer",
        location="San Francisco, CA",
        start_date="2020-01",
        end_date="Present",
        current=True,
        description=[
            "Developed scalable web applications",
            "Led team of 5 engineers"
        ],
        achievements=["Increased performance by 40%"]
    )


def test_create_empty_resume(builder_service):
    """Test creating an empty resume."""
    resume = builder_service.create_resume(title="Test Resume")
    
    assert resume.id is not None
    assert resume.title == "Test Resume"
    assert resume.created_at is not None
    assert resume.updated_at is not None
    assert resume.contact is None
    assert len(resume.experience) == 0


def test_create_resume_with_data(builder_service, sample_contact):
    """Test creating a resume with initial data."""
    initial_data = {
        "contact": sample_contact
    }
    
    resume = builder_service.create_resume(
        title="My Resume",
        initial_data=initial_data
    )
    
    assert resume.contact is not None
    assert resume.contact.full_name == "Jane Doe"
    assert resume.contact.email == "jane@example.com"


def test_get_resume(builder_service):
    """Test retrieving a resume by ID."""
    # Create a resume
    resume = builder_service.create_resume(title="Test")
    resume_id = resume.id
    
    # Retrieve it
    retrieved = builder_service.get_resume(resume_id)
    
    assert retrieved is not None
    assert retrieved.id == resume_id
    assert retrieved.title == "Test"


def test_get_nonexistent_resume(builder_service):
    """Test retrieving a non-existent resume."""
    result = builder_service.get_resume("nonexistent-id")
    assert result is None


def test_update_resume(builder_service, sample_contact):
    """Test updating a resume."""
    # Create resume
    resume = builder_service.create_resume(title="Original")
    resume_id = resume.id
    
    # Update it
    update_data = ResumeUpdate(
        title="Updated Title",
        contact=sample_contact
    )
    
    updated = builder_service.update_resume(resume_id, update_data)
    
    assert updated is not None
    assert updated.title == "Updated Title"
    assert updated.contact.full_name == "Jane Doe"


def test_delete_resume(builder_service):
    """Test deleting a resume."""
    # Create resume
    resume = builder_service.create_resume()
    resume_id = resume.id
    
    # Delete it
    success = builder_service.delete_resume(resume_id)
    assert success is True
    
    # Verify it's gone
    retrieved = builder_service.get_resume(resume_id)
    assert retrieved is None


def test_add_experience_entry(builder_service, sample_experience):
    """Test adding an experience entry."""
    # Create resume
    resume = builder_service.create_resume()
    resume_id = resume.id
    
    # Add experience
    updated = builder_service.add_section_entry(
        resume_id,
        SectionType.EXPERIENCE,
        sample_experience.model_dump()
    )
    
    assert updated is not None
    assert len(updated.experience) == 1
    assert updated.experience[0].company == "Tech Corp"
    assert updated.experience[0].position == "Software Engineer"


def test_remove_experience_entry(builder_service, sample_experience):
    """Test removing an experience entry."""
    # Create resume with experience
    resume = builder_service.create_resume()
    resume.experience = [sample_experience]
    builder_service._in_memory_cache[resume.id] = resume
    
    # Remove the experience
    updated = builder_service.remove_section_entry(
        resume.id,
        SectionType.EXPERIENCE,
        0
    )
    
    assert updated is not None
    assert len(updated.experience) == 0


def test_add_skill_category(builder_service):
    """Test adding a skill category."""
    resume = builder_service.create_resume()
    
    skill_data = {
        "category": "Programming Languages",
        "skills": ["Python", "JavaScript", "TypeScript"]
    }
    
    updated = builder_service.add_section_entry(
        resume.id,
        SectionType.SKILLS,
        skill_data
    )
    
    assert updated is not None
    assert len(updated.skills) == 1
    assert updated.skills[0].category == "Programming Languages"
    assert len(updated.skills[0].skills) == 3


def test_export_to_text(builder_service, sample_contact, sample_experience):
    """Test exporting resume to text format."""
    resume = builder_service.create_resume()
    resume.contact = sample_contact
    resume.experience = [sample_experience]
    
    text = builder_service.export_to_text(resume)
    
    assert "JANE DOE" in text
    assert "jane@example.com" in text
    assert "Tech Corp" in text
    assert "Software Engineer" in text
    assert "EXPERIENCE" in text


def test_create_from_parsed_resume(builder_service):
    """Test creating builder from parsed resume."""
    # Create a mock parsed resume using proper Pydantic models
    parsed_resume = Resume(
        raw_text="Sample resume text",
        name="John Smith",
        contact=ParsedContactInfo(
            email="john@example.com",
            phone="+1-555-9999"
        ),
        summary="Experienced developer with over 10 years of expertise in building scalable web applications and leading engineering teams.",
        experience=[
            ExperienceItem(
                company="ABC Inc",
                job_title="Developer",
                start_date="2018-01",
                end_date="2020-12",
                bullets=["Built web apps"]
            )
        ],
        education=[
            EducationItem(
                institution="MIT",
                degree="BS Computer Science"
            )
        ],
        skills=[
            SkillItem(name="Python"),
            SkillItem(name="React"),
            SkillItem(name="AWS")
        ]
    )
    
    resume_builder = builder_service.create_from_parsed(parsed_resume)
    
    assert resume_builder.contact is not None
    assert resume_builder.contact.full_name == "John Smith"
    assert resume_builder.contact.email == "john@example.com"
    assert resume_builder.summary is not None
    assert "Experienced developer" in resume_builder.summary.summary
    assert len(resume_builder.experience) == 1
    assert resume_builder.experience[0].company == "ABC Inc"
    assert len(resume_builder.education) == 1
    assert len(resume_builder.skills) == 1
    assert len(resume_builder.skills[0].skills) == 3


def test_list_resumes(builder_service):
    """Test listing all resumes."""
    # Create multiple resumes
    resume1 = builder_service.create_resume(title="Resume 1")
    resume2 = builder_service.create_resume(title="Resume 2")
    
    resumes = builder_service.list_resumes()
    
    assert len(resumes) >= 2
    titles = [r["title"] for r in resumes]
    assert "Resume 1" in titles
    assert "Resume 2" in titles


def test_save_and_load_resume(builder_service, sample_contact, tmp_path):
    """Test saving and loading resume from disk."""
    # Use temp directory for testing
    builder_service.storage_path = tmp_path
    
    # Create and save resume
    resume = builder_service.create_resume(title="Saved Resume")
    resume.contact = sample_contact
    
    success = builder_service.save_resume(resume)
    assert success is True
    
    # Clear cache and reload
    resume_id = resume.id
    builder_service._in_memory_cache.clear()
    
    loaded = builder_service.get_resume(resume_id)
    assert loaded is not None
    assert loaded.title == "Saved Resume"
    assert loaded.contact.full_name == "Jane Doe"
