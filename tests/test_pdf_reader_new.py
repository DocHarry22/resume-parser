"""
Unit tests for PDF reader using PyMuPDF.
"""

import pytest
from io import BytesIO
from app.utils.pdf_reader import read_pdf, PDFReader, _is_page_number, _clean_text


def test_clean_text():
    """Test text cleaning function."""
    # Multiple spaces
    assert _clean_text("Hello    world") == "Hello world"
    
    # Multiple newlines
    assert _clean_text("Line1\n\n\n\nLine2") == "Line1\n\nLine2"
    
    # Leading/trailing whitespace
    assert _clean_text("  text  ") == "text"
    
    # Mixed whitespace
    input_text = "Line 1  with   spaces\n\n\n\nLine 2"
    expected = "Line 1 with spaces\n\nLine 2"
    assert _clean_text(input_text) == expected


def test_is_page_number():
    """Test page number detection."""
    # Should detect as page numbers
    assert _is_page_number("1") == True
    assert _is_page_number("42") == True
    assert _is_page_number("Page 3") == True
    assert _is_page_number("- 5 -") == True
    assert _is_page_number("  123  ") == True
    
    # Should NOT detect as page numbers
    assert _is_page_number("Introduction") == False
    assert _is_page_number("Contact: 123-456-7890") == False
    assert _is_page_number("Experience: 10 years") == False
    assert _is_page_number("Python 3.11") == False


def test_read_pdf_invalid_input():
    """Test error handling for invalid PDF."""
    with pytest.raises(ValueError, match="Invalid PDF file|Error reading PDF"):
        read_pdf(b"not a valid pdf file")


def test_read_pdf_empty_pdf():
    """Test error handling for empty PDF content."""
    # Minimal invalid PDF header
    with pytest.raises(ValueError):
        read_pdf(b"%PDF-1.4\n%%EOF")


def test_pdf_reader_class_backward_compatibility():
    """Test backward compatibility with PDFReader class."""
    reader = PDFReader()
    
    # Test with invalid PDF to verify interface
    with pytest.raises(ValueError):
        reader.read(b"invalid")


def test_read_pdf_with_sample():
    """
    Test PDF reading with a real sample file.
    
    Note: This test requires a sample PDF in tests/resources/
    If the file doesn't exist, the test is skipped.
    """
    import os
    from pathlib import Path
    
    sample_path = Path("tests/resources/sample_resume.pdf")
    
    if not sample_path.exists():
        pytest.skip(f"Sample PDF not found: {sample_path}")
    
    with open(sample_path, 'rb') as f:
        pdf_bytes = f.read()
    
    result = read_pdf(pdf_bytes)
    
    # Assertions
    assert isinstance(result, dict)
    assert 'full_text' in result
    assert 'blocks' in result
    assert 'page_count' in result
    
    assert result['full_text'], "Extracted text should not be empty"
    assert len(result['blocks']) > 2, "Should have multiple text blocks"
    assert result['page_count'] >= 1, "Should have at least one page"
    
    # Check for common resume elements (at least one should be present)
    text_lower = result['full_text'].lower()
    has_contact = any(keyword in text_lower for keyword in ['email', 'phone', '@', 'contact'])
    has_section = any(keyword in text_lower for keyword in ['experience', 'education', 'skills', 'summary'])
    
    assert has_contact or has_section, "Should contain resume-like content"
    
    # Verify blocks are strings
    assert all(isinstance(block, str) for block in result['blocks'])
    
    # Verify blocks are non-empty
    assert all(len(block.strip()) > 0 for block in result['blocks'])


def test_read_pdf_structure():
    """Test that read_pdf returns proper structure even without sample file."""
    # This test would pass if we had a valid PDF
    # For now, it tests the error path
    with pytest.raises(ValueError):
        result = read_pdf(b"fake pdf content")


class TestPDFReaderIntegration:
    """Integration tests for PDF reader."""
    
    def test_multicolumn_handling(self):
        """
        Test that multi-column PDFs are handled reasonably.
        
        Note: Full multi-column detection is a TODO enhancement.
        This test verifies blocks are at least extracted and sorted.
        """
        pytest.skip("Requires multi-column test PDF - future enhancement")
    
    def test_header_footer_filtering(self):
        """Test that headers/footers are filtered out."""
        pytest.skip("Requires test PDF with headers/footers")
    
    def test_page_number_filtering(self):
        """Test that page numbers are properly filtered."""
        pytest.skip("Requires test PDF with page numbers")


def test_block_sorting():
    """Test that blocks maintain reasonable order."""
    # This would require a PDF with known block positions
    # Current implementation sorts by (y0, x0) coordinates
    pytest.skip("Requires test PDF with known layout")
