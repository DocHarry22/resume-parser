"""Quick test of the PyMuPDF PDF reader."""

from app.utils.pdf_reader import read_pdf

pdf_path = 'tests/resources/sample_resume.pdf'

with open(pdf_path, 'rb') as f:
    result = read_pdf(f.read())

print("✅ PDF Reader Working with PyMuPDF!")
print(f"Pages: {result['page_count']}")
print(f"Blocks: {len(result['blocks'])}")
print(f"\nFirst 300 characters:\n{result['full_text'][:300]}")
print(f"\n... (total {len(result['full_text'])} characters)")
