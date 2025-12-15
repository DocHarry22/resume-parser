"""
Tests for Auto-Fix Service

Tests for generating and applying resume auto-fixes.
"""

import pytest

from app.services.autofix_service import AutoFixService, FixType, FixAction
from app.models.resume_models import Resume
from app.models.builder_models import ResumeBuilder, ProfessionalSummary


@pytest.fixture
def autofix_service():
    """Fixture for autofix service."""
    return AutoFixService()


@pytest.fixture
def resume_with_issues():
    """Create a resume with common issues."""
    return Resume(
        raw_text=" ".join(["word"] * 1200),  # Too long
        contact={
            "name": "John Doe"
            # Missing email, phone
        },
        summary=None,  # Missing summary
        experience=[
            {
                "company": "ABC Corp",
                "position": "Developer",
                "description": [
                    "Responsible for building applications",  # Weak verb
                    "Worked on various projects"  # No quantification
                ]
            }
        ],
        education=[],
        skills=["Python"]
    )


def test_generate_fixes_for_length(autofix_service):
    """Test generating fix for resume length."""
    resume = Resume(
        raw_text=" ".join(["word"] * 1200),  # ~1200 words (too long)
        contact={"name": "John"},
        experience=[]
    )
    
    fixes = autofix_service.generate_fixes(
        resume=resume,
        flags=["Resume is longer than recommended (2 pages max)"],
        comments=[],
        score=70
    )
    
    length_fixes = [f for f in fixes if f.fix_type == FixType.LENGTH]
    assert len(length_fixes) > 0
    
    fix = length_fixes[0]
    assert fix.action == FixAction.MODIFY
    assert fix.section == "overall"
    assert "word" in fix.original_value.lower()


def test_generate_fixes_for_missing_summary(autofix_service):
    """Test generating fix for missing summary."""
    resume = Resume(
        raw_text="Some text",
        contact={"name": "Jane"},
        summary=None,  # Missing
        experience=[
            {"company": "Tech", "position": "Engineer"}
        ]
    )
    
    fixes = autofix_service.generate_fixes(
        resume=resume,
        flags=[],
        comments=["Missing professional summary"],
        score=65
    )
    
    summary_fixes = [f for f in fixes if f.fix_type == FixType.SUMMARY]
    assert len(summary_fixes) > 0
    
    fix = summary_fixes[0]
    assert fix.action == FixAction.ADD
    assert fix.section == "summary"
    assert fix.suggested_value is not None
    assert "Engineer" in fix.suggested_value  # Should use job title


def test_generate_fixes_for_readability(autofix_service):
    """Test generating fixes for long sentences."""
    long_sentence = " ".join(["word"] * 30)  # 30-word sentence
    resume = Resume(
        raw_text=f"{long_sentence}. Short sentence.",
        contact={"name": "John"}
    )
    
    fixes = autofix_service.generate_fixes(
        resume=resume,
        flags=[],
        comments=["Improve readability by shortening long sentences"],
        score=70
    )
    
    readability_fixes = [f for f in fixes if f.fix_type == FixType.READABILITY]
    assert len(readability_fixes) > 0
    
    fix = readability_fixes[0]
    assert fix.action == FixAction.MODIFY
    assert "word_count" in fix.metadata


def test_generate_fixes_for_missing_contact(autofix_service):
    """Test generating fixes for missing contact info."""
    resume = Resume(
        raw_text="Text",
        contact={
            "name": "John Doe"
            # Missing email, phone, location
        }
    )
    
    fixes = autofix_service.generate_fixes(
        resume=resume,
        flags=["Missing contact information"],
        comments=["Add email address"],
        score=60
    )
    
    contact_fixes = [f for f in fixes if f.fix_type == FixType.CONTACT]
    assert len(contact_fixes) > 0
    
    fix = contact_fixes[0]
    assert fix.action == FixAction.ADD
    assert "missing_fields" in fix.metadata
    assert "email" in fix.metadata["missing_fields"]


def test_generate_fixes_for_quantification(autofix_service):
    """Test generating fixes for missing metrics."""
    resume = Resume(
        raw_text="Text",
        contact={"name": "Jane"},
        experience=[
            {
                "company": "Tech Co",
                "position": "Manager",
                "description": [
                    "Led team and improved processes"  # No numbers
                ]
            }
        ]
    )
    
    fixes = autofix_service.generate_fixes(
        resume=resume,
        flags=[],
        comments=["Add quantifiable achievements with specific metrics"],
        score=68
    )
    
    quant_fixes = [f for f in fixes if f.fix_type == FixType.QUANTIFICATION]
    assert len(quant_fixes) > 0
    
    fix = quant_fixes[0]
    assert fix.action == FixAction.MODIFY
    assert "examples" in fix.metadata


def test_generate_fixes_for_weak_bullets(autofix_service):
    """Test generating fixes for weak action verbs."""
    resume = Resume(
        raw_text="Text",
        contact={"name": "John"},
        experience=[
            {
                "company": "ABC",
                "position": "Developer",
                "description": [
                    "Responsible for building features",  # Weak
                    "Helped with testing"  # Weak
                ]
            }
        ]
    )
    
    fixes = autofix_service.generate_fixes(
        resume=resume,
        flags=[],
        comments=["Use strong action verbs"],
        score=65
    )
    
    bullet_fixes = [f for f in fixes if f.fix_type == FixType.BULLETS]
    assert len(bullet_fixes) > 0
    
    fix = bullet_fixes[0]
    assert fix.action == FixAction.MODIFY
    assert "suggested_verbs" in fix.metadata


def test_apply_summary_fix(autofix_service):
    """Test applying summary fix to resume builder."""
    resume_builder = ResumeBuilder(
        id="test-123",
        title="My Resume"
    )
    
    from app.services.autofix_service import AutoFix
    
    fix = AutoFix(
        fix_type=FixType.SUMMARY,
        action=FixAction.ADD,
        section="summary",
        description="Add professional summary",
        suggested_value="Experienced software engineer with 5 years...",
        auto_applicable=True
    )
    
    success, message, updated = autofix_service.apply_fix(resume_builder, fix)
    
    assert success is True
    assert updated is not None
    assert updated.summary is not None
    assert "software engineer" in updated.summary.summary.lower()


def test_apply_non_applicable_fix(autofix_service):
    """Test applying a non-auto-applicable fix."""
    resume_builder = ResumeBuilder(id="test", title="Test")
    
    from app.services.autofix_service import AutoFix
    
    fix = AutoFix(
        fix_type=FixType.LENGTH,
        action=FixAction.MODIFY,
        section="overall",
        description="Shorten resume",
        auto_applicable=False  # Not auto-applicable
    )
    
    success, message, updated = autofix_service.apply_fix(resume_builder, fix)
    
    assert success is False
    assert "manual intervention" in message.lower()
    assert updated is None


def test_get_fix_priority(autofix_service):
    """Test fix priority ranking."""
    from app.services.autofix_service import AutoFix
    
    contact_fix = AutoFix(
        fix_type=FixType.CONTACT,
        action=FixAction.ADD,
        section="contact",
        description="Add contact"
    )
    
    readability_fix = AutoFix(
        fix_type=FixType.READABILITY,
        action=FixAction.MODIFY,
        section="content",
        description="Fix readability"
    )
    
    contact_priority = autofix_service.get_fix_priority(contact_fix)
    readability_priority = autofix_service.get_fix_priority(readability_fix)
    
    # Contact should be higher priority (lower number)
    assert contact_priority < readability_priority


def test_fix_to_dict(autofix_service):
    """Test converting fix to dictionary."""
    from app.services.autofix_service import AutoFix
    
    fix = AutoFix(
        fix_type=FixType.SUMMARY,
        action=FixAction.ADD,
        section="summary",
        description="Add summary",
        original_value=None,
        suggested_value="Sample summary",
        auto_applicable=True,
        metadata={"priority": "high"}
    )
    
    fix_dict = fix.to_dict()
    
    assert fix_dict["fix_type"] == "summary"
    assert fix_dict["action"] == "add"
    assert fix_dict["section"] == "summary"
    assert fix_dict["description"] == "Add summary"
    assert fix_dict["suggested_value"] == "Sample summary"
    assert fix_dict["auto_applicable"] is True
    assert fix_dict["metadata"]["priority"] == "high"


def test_multiple_fixes_generated(autofix_service, resume_with_issues):
    """Test that multiple fixes are generated for a problematic resume."""
    fixes = autofix_service.generate_fixes(
        resume=resume_with_issues,
        flags=[
            "Resume is longer than recommended",
            "Missing contact information"
        ],
        comments=[
            "Missing professional summary",
            "Add quantifiable achievements",
            "Use strong action verbs"
        ],
        score=55
    )
    
    # Should have multiple types of fixes
    fix_types = {fix.fix_type for fix in fixes}
    assert len(fix_types) >= 3  # At least 3 different fix types
    
    # Check we have key fixes
    assert FixType.SUMMARY in fix_types
    assert any(f.fix_type in [FixType.CONTACT, FixType.BULLETS, FixType.QUANTIFICATION] for f in fixes)
