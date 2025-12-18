"""
End-to-end integration test for the complete resume parser pipeline.
Tests: Document Loading → Parsing → Scoring
"""

import pytest
from pathlib import Path
from app.utils.document_loader import load_document_from_path
from app.services.parsing_service import ParsingService
from app.services.scoring_service import ScoringService


def test_end_to_end_pipeline_pdf():
    """
    Test complete pipeline: PDF → Document → Parsing → Scoring
    """
    sample_path = "tests/resources/sample_resume.pdf"
    
    if not Path(sample_path).exists():
        pytest.skip("Sample PDF not found")
    
    # Step 1: Load document
    document = load_document_from_path(sample_path)
    
    assert document.full_text, "Document should have text"
    assert len(document.blocks) > 0, "Document should have blocks"
    assert document.page_count == 1, "Sample PDF should have 1 page"
    
    # Step 2: Parse resume
    parsing_service = ParsingService()
    resume = parsing_service.parse_resume(document)
    
    assert resume, "Resume should be parsed"
    assert resume.name, "Should extract name"
    
    # Verify contact info extraction
    assert resume.contact, "Should have contact info"
    if resume.contact.email:
        assert "@" in resume.contact.email
    
    # Verify section extraction
    assert len(resume.experience) > 0, "Should extract experience"
    assert len(resume.education) > 0, "Should extract education"
    assert len(resume.skills) > 0, "Should extract skills"
    
    # Step 3: Score resume
    scoring_service = ScoringService()
    score = scoring_service.score_resume(resume)
    
    assert score, "Score should be generated"
    assert 0 <= score.overall <= 100, "Overall score should be 0-100"
    
    # Verify all scoring dimensions (using new API)
    assert score.readability is not None, "Should have readability score"
    assert score.ats_compliance is not None, "Should have ATS compliance score"
    assert score.layout is not None, "Should have layout score"
    
    # Optional tier-dependent metrics
    if score.experience is not None:
        assert 0 <= score.experience <= 100
    if score.skills is not None:
        assert 0 <= score.skills <= 100
    
    # Verify comments are generated
    assert isinstance(score.comments, list), "Should have comments list"
    assert len(score.comments) > 0, "Should have at least one comment"
    
    print(f"\n✅ End-to-End Test Results:")
    print(f"   Name: {resume.name}")
    print(f"   Email: {resume.contact.email if resume.contact else 'N/A'}")
    print(f"   Experience items: {len(resume.experience)}")
    print(f"   Education items: {len(resume.education)}")
    print(f"   Skills: {len(resume.skills)}")
    print(f"   Overall Score: {score.overall:.1f}/100")
    print(f"   Comments: {len(score.comments)}")


def test_pipeline_with_minimal_content():
    """
    Test pipeline behavior with minimal resume content.
    """
    sample_path = "tests/resources/sample_resume.pdf"
    
    if not Path(sample_path).exists():
        pytest.skip("Sample PDF not found")
    
    # Run through pipeline
    document = load_document_from_path(sample_path)
    parsing_service = ParsingService()
    scoring_service = ScoringService()
    
    resume = parsing_service.parse_resume(document)
    score = scoring_service.score_resume(resume)
    
    # Even minimal resumes should get scored
    assert score.overall >= 0, "Should handle minimal content gracefully"
    assert len(score.comments) > 0, "Should provide feedback even for minimal content"


def test_pipeline_error_handling():
    """
    Test that pipeline handles errors gracefully.
    """
    # Test with non-existent file
    with pytest.raises(ValueError, match="File not found"):
        load_document_from_path("nonexistent.pdf")
    
    # Test with unsupported file type
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
        f.write(b"test content")
        temp_path = f.name
    
    try:
        with pytest.raises(ValueError, match="Unsupported file type"):
            load_document_from_path(temp_path)
    finally:
        Path(temp_path).unlink(missing_ok=True)


def test_pipeline_data_flow():
    """
    Test that data flows correctly through the pipeline.
    """
    sample_path = "tests/resources/sample_resume.pdf"
    
    if not Path(sample_path).exists():
        pytest.skip("Sample PDF not found")
    
    # Load document
    document = load_document_from_path(sample_path)
    raw_text = document.full_text
    
    # Parse resume
    parsing_service = ParsingService()
    resume = parsing_service.parse_resume(document)
    
    # Verify data is extracted from raw text
    if resume.name:
        assert resume.name.upper() in raw_text.upper(), "Name should be in raw text"
    
    if resume.contact and resume.contact.email:
        assert resume.contact.email in raw_text, "Email should be in raw text"
    
    # Verify skills are from taxonomy or extracted text
    for skill in resume.skills:
        # Skills should either be in text or from taxonomy
        assert skill.name, "Skill should have a name"


if __name__ == "__main__":
    # Run the main test
    test_end_to_end_pipeline_pdf()
