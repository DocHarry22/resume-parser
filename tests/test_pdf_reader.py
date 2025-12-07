"""Tests for PDF reader."""

import pytest
from pathlib import Path
from app.utils.pdf_reader import PDFReader


def test_pdf_reader_initialization():
    """Test PDF reader can be initialized."""
    reader = PDFReader()
    assert reader is not None


def test_is_page_number():
    """Test page number detection."""
    reader = PDFReader()
    
    # Should detect page numbers
    assert reader._is_page_number("Page 1", 1, 3) == True
    assert reader._is_page_number("1", 1, 3) == True
    assert reader._is_page_number("1 of 3", 1, 3) == True
    assert reader._is_page_number("- 2 -", 2, 3) == True
    
    # Should not detect as page numbers
    assert reader._is_page_number("Section 1", 1, 3) == False
    assert reader._is_page_number("Experience", 1, 3) == False


def test_is_decorative_line():
    """Test decorative line detection."""
    reader = PDFReader()
    
    # Should detect decorative lines
    assert reader._is_decorative_line("===") == True
    assert reader._is_decorative_line("---") == True
    assert reader._is_decorative_line("***") == True
    assert reader._is_decorative_line("______") == True
    
    # Should not detect as decorative
    assert reader._is_decorative_line("Summary") == False
    assert reader._is_decorative_line("John Doe") == False


def test_split_into_blocks():
    """Test text splitting into blocks."""
    reader = PDFReader()
    
    text = """First paragraph here.

Second paragraph here.


Third paragraph after double newline."""
    
    blocks = reader._split_into_blocks(text)
    
    assert len(blocks) == 3
    assert "First paragraph" in blocks[0]
    assert "Second paragraph" in blocks[1]
    assert "Third paragraph" in blocks[2]
