"""Tests for DOCX reader."""

import pytest
from app.utils.docx_reader import DOCXReader


def test_docx_reader_initialization():
    """Test DOCX reader can be initialized."""
    reader = DOCXReader()
    assert reader is not None


def test_is_heading_style():
    """Test heading style detection."""
    reader = DOCXReader()
    
    # Should detect heading styles
    assert reader._is_heading_style("Heading 1") == True
    assert reader._is_heading_style("Heading 2") == True
    assert reader._is_heading_style("Title") == True
    assert reader._is_heading_style("Subtitle") == True
    
    # Should not detect as headings
    assert reader._is_heading_style("Normal") == False
    assert reader._is_heading_style("Body Text") == False
