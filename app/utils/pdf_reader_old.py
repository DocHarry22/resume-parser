"""Compatibility import for the retired PDF reader.

The previous unused implementation was syntactically incomplete. Keep its import
path working through the maintained reader rather than duplicate parsing code.
"""
from app.utils.pdf_reader import read_pdf, PDFReader

__all__ = ["read_pdf", "PDFReader"]
