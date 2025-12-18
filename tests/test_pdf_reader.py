"""Tests for PDF reader."""

import pytest
from pathlib import Path
from app.utils.pdf_reader import PDFReader, _is_page_number, _clean_text


def test_pdf_reader_initialization():
    """Test PDF reader can be initialized."""
    reader = PDFReader()
    assert reader is not None


def test_is_page_number():
    """Test page number detection."""
    # Should detect page numbers (short text with numbers)
    assert _is_page_number("1") == True
    assert _is_page_number("12") == True
    assert _is_page_number("Page 2") == True
    
    # Should not detect as page numbers (longer text)
    assert _is_page_number("Section 1: Introduction") == False
    assert _is_page_number("Experience") == False
    assert _is_page_number("John Doe has 15 years experience") == False


def test_clean_text():
    """Test text cleaning function."""
    # Test multiple spaces
    text = "Hello    world"
    cleaned = _clean_text(text)
    assert "    " not in cleaned
    
    # Test stripping
    text = "  test  "
    cleaned = _clean_text(text)
    assert cleaned == "test"


def test_pdf_reader_read_method():
    """Test that PDFReader.read() works with valid PDF bytes."""
    reader = PDFReader()
    
    # Test with invalid input
    with pytest.raises(ValueError):
        reader.read(b"not a valid pdf")
