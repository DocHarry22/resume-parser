"""PDF document reader using PyMuPDF (fitz).

PDF extraction is notoriously challenging because PDFs preserve visual layout
rather than logical reading order. Multi-column layouts, headers/footers,
and mixed content (text, tables, images) make it difficult to extract text
in a meaningful sequence.

This module uses PyMuPDF (fitz) for block-based extraction with positional sorting:
- Extract text blocks with coordinates using page.get_text("blocks")
- Sort blocks by vertical (y) then horizontal (x) position
- Filter out page numbers and tiny header/footer text
- Handle multi-column layouts through positional sorting

Reference: https://unstract.com/blog/pdf-data-extraction-challenges/

TODO: Future enhancement - Detect multi-column layouts by analyzing x-coordinate
      clusters and reorder blocks accordingly for better reading flow in
      complex scientific/academic documents.
"""

import fitz  # PyMuPDF
from io import BytesIO
from typing import Union
import re


def read_pdf(file: bytes) -> dict:
    """
    Extract text from PDF with layout-aware block extraction.
    
    Args:
        file: PDF file as bytes
        
    Returns:
        Dictionary with:
            - full_text: Complete text content
            - blocks: List of text blocks (paragraphs)
            - page_count: Number of pages
            
    Raises:
        ValueError: If PDF cannot be read or contains no extractable text
        
    Implementation Notes:
        - Uses block-based extraction via page.get_text("blocks")
        - Each block contains: (x0, y0, x1, y1, "text", block_no, block_type)
        - Sorts blocks by vertical (y0) then horizontal (x0) position
        - Filters out page numbers and tiny header/footer text
        - PDFs don't have logical reading order - this is best-effort extraction
        
    Limitations:
        - Complex multi-column layouts may not maintain perfect reading order
        - Tables and complex formatting may lose structure
        - OCR is not performed on image-based PDFs
    """
    try:
        # Convert bytes to BytesIO
        stream = BytesIO(file)
        
        # Open PDF
        doc = fitz.open(stream=stream, filetype="pdf")
        
        if doc.page_count == 0:
            raise ValueError("PDF contains no pages")
        
        all_blocks = []
        full_text_parts = []
        page_count = doc.page_count
        raw_text_found = False  # Track if we found any text at all
        
        # Process each page
        for page in doc:
            # Get text blocks with position info
            # Block format: (x0, y0, x1, y1, "text", block_no, block_type)
            blocks = page.get_text("blocks")
            
            if not blocks:
                continue
            
            # Sort blocks by position (top-to-bottom, left-to-right)
            # This helps maintain reading order in multi-column layouts
            sorted_blocks = sorted(blocks, key=lambda b: (b[1], b[0]))  # (y0, x0)
            
            page_text_parts = []
            
            for block in sorted_blocks:
                x0, y0, x1, y1, text, block_no, block_type = block
                
                # Skip image blocks (block_type == 1)
                if block_type != 0:
                    continue
                
                # Clean text
                text = text.strip()
                
                if not text:
                    continue
                
                # We found some text
                raw_text_found = True
                
                # Filter out page numbers (standalone numbers) - be lenient
                if _is_page_number(text):
                    continue
                
                # Filter out very tiny text (likely headers/footers) - only if we have other content
                block_height = y1 - y0
                if block_height < 5:  # Very small text (reduced from 8)
                    continue
                
                # Clean the text
                cleaned_text = _clean_text(text)
                
                if cleaned_text:
                    # Add to blocks list
                    all_blocks.append(cleaned_text)
                    page_text_parts.append(cleaned_text)
            
            # Add page text to full text
            if page_text_parts:
                page_text = "\n".join(page_text_parts)
                full_text_parts.append(page_text)
        
        doc.close()
        
        # Build final document
        full_text = "\n\n".join(full_text_parts)
        
        # If block extraction failed but we found raw text, try simple text extraction
        if (not full_text or not all_blocks) and raw_text_found:
            # Reopen and try simple extraction
            stream = BytesIO(file)
            doc = fitz.open(stream=stream, filetype="pdf")
            simple_text_parts = []
            for page in doc:
                text = page.get_text("text")
                if text and text.strip():
                    simple_text_parts.append(text.strip())
            doc.close()
            
            if simple_text_parts:
                full_text = "\n\n".join(simple_text_parts)
                all_blocks = simple_text_parts
        
        # If still no text, try one more fallback without any filtering
        if not full_text or not all_blocks:
            stream = BytesIO(file)
            doc = fitz.open(stream=stream, filetype="pdf")
            fallback_parts = []
            for page in doc:
                text = page.get_text()
                if text and text.strip():
                    fallback_parts.append(text.strip())
            doc.close()
            
            if fallback_parts:
                full_text = "\n\n".join(fallback_parts)
                all_blocks = fallback_parts
        
        if not full_text or not all_blocks:
            raise ValueError("Unable to extract text from PDF. This may be a scanned/image-based PDF that requires OCR.")
        
        return {
            'full_text': full_text,
            'blocks': all_blocks,
            'page_count': page_count
        }
        
    except (fitz.FileDataError, fitz.EmptyFileError) as e:
        raise ValueError(f"Invalid PDF file: {e}")
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        raise ValueError(f"Error reading PDF: {e}")


def _is_page_number(text: str) -> bool:
    """
    Check if text is likely a page number.
    
    Examples: "1", "Page 2", "- 3 -"
    
    Args:
        text: Text to check
        
    Returns:
        True if likely a page number
    """
    # Remove common formatting
    cleaned = re.sub(r'[^\d]', '', text)
    
    # If it's just 1-3 digits, likely a page number
    if cleaned and len(cleaned) <= 3 and cleaned.isdigit():
        # Make sure the original text is mostly this number
        if len(text) <= 10:  # Short text
            return True
    
    return False


def _clean_text(text: str) -> str:
    """
    Clean extracted text by normalizing whitespace.
    
    - Removes multiple spaces
    - Normalizes line breaks
    - Strips leading/trailing whitespace
    
    Args:
        text: Text to clean
        
    Returns:
        Cleaned text
    """
    # Replace multiple spaces with single space
    text = re.sub(r' +', ' ', text)
    
    # Replace 4+ newlines with double newline
    text = re.sub(r'\n{4,}', '\n\n', text)
    
    # Strip each line but preserve empty lines (for paragraph breaks)
    lines = [line.strip() for line in text.split('\n')]
    
    return '\n'.join(lines).strip()


# Backward compatibility wrapper class
class PDFReader:
    """Extract text from PDF files with layout awareness."""
    
    def __init__(self):
        """Initialize PDF reader."""
        pass
    
    def read(self, file_source: Union[bytes, BytesIO]) -> dict:
        """
        Read a PDF file and extract text content.
        
        Args:
            file_source: PDF file as bytes or BytesIO
            
        Returns:
            Dictionary with full_text, blocks, and page_count
        """
        if isinstance(file_source, BytesIO):
            file_source = file_source.getvalue()
        
        return read_pdf(file_source)
