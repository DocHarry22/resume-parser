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
        
        # Process each page
        for page in doc:
                
                if not text:
                    continue
                
                # Clean the extracted text
                text = self._clean_page_text(text, page_num, page_count)
                
                # Split into blocks (paragraphs separated by blank lines)
                page_blocks = self._split_into_blocks(text)
                blocks.extend(page_blocks)
                full_text_parts.append(text)
        
        full_text = "\n\n".join(full_text_parts)
        
        return {
            "full_text": full_text,
            "blocks": blocks,
            "page_count": page_count
        }
    
    def _clean_page_text(self, text: str, page_num: int, total_pages: int) -> str:
        """
        Clean extracted text from a page.
        
        Removes:
        - Page numbers (at top or bottom)
        - Excessive whitespace
        - Common header/footer patterns
        
        Args:
            text: Raw extracted text
            page_num: Current page number
            total_pages: Total number of pages
            
        Returns:
            Cleaned text
        """
        lines = text.split('\n')
        cleaned_lines = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            
            if not line:
                cleaned_lines.append('')
                continue
            
            # Remove standalone page numbers (e.g., "Page 1", "1 of 3", "- 2 -")
            if self._is_page_number(line, page_num, total_pages):
                continue
            
            # Remove lines that are just repeated characters (decorative)
            if self._is_decorative_line(line):
                continue
            
            cleaned_lines.append(line)
        
        # Join and normalize whitespace
        cleaned = '\n'.join(cleaned_lines)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)  # Max 2 consecutive newlines
        
        return cleaned.strip()
    
    def _is_page_number(self, line: str, page_num: int, total_pages: int) -> bool:
        """Check if a line is likely a page number."""
        line_lower = line.lower()
        
        # Pattern: "Page 1", "Page 1 of 3"
        if re.match(r'^page\s+\d+(\s+of\s+\d+)?$', line_lower):
            return True
        
        # Pattern: Just a number
        if line.isdigit() and int(line) <= total_pages:
            return True
        
        # Pattern: "1 / 3", "1 of 3", "- 2 -"
        if re.match(r'^[-–—]?\s*\d+\s*[/\|of]\s*\d+\s*[-–—]?$', line_lower):
            return True
        
        if re.match(r'^[-–—]\s*\d+\s*[-–—]$', line):
            return True
        
        return False
    
    def _is_decorative_line(self, line: str) -> bool:
        """Check if a line is decorative (repeated characters)."""
        if len(line) < 3:
            return False
        
        # Line of repeated characters: "===", "---", "***"
        unique_chars = set(line.replace(' ', ''))
        if len(unique_chars) == 1 and unique_chars.pop() in '-–—_=*#~':
            return True
        
        return False
    
    def _split_into_blocks(self, text: str) -> list[str]:
        """
        Split text into logical blocks (paragraphs).
        
        A block is separated by one or more blank lines.
        
        Args:
            text: Cleaned page text
            
        Returns:
            List of text blocks
        """
        # Split by blank lines
        blocks = re.split(r'\n\s*\n', text)
        
        # Clean and filter empty blocks
        blocks = [block.strip() for block in blocks if block.strip()]
        
        return blocks
