# Accuracy Report

## Scope
- Resume parsing audit for PDF and DOCX ingestion
- Section, contact, experience, education, and skill extraction
- OCR/scanned-PDF handling and parser error behavior

## Changes Implemented
- Hardened section heading detection to recognize headings like `Skills:` and `Projects (3)` without false positives such as `AchievementsPlus`.
- Replaced fragile contact extraction with matcher-based email, phone, social profile, website, and location parsing.
- Added name fallback extraction from the top of the resume before NER lookup.
- Improved experience parsing by handling inline `Title at Company` headers, date-first blocks, and bullet fallbacks.
- Fixed education graduation year parsing to return full years and added field-of-study extraction.
- Improved skill extraction with taxonomy-aware matching and alias normalization for common variants like `Node.js`, `React.js`, and `Next.js`.
- Added scanned/image-based PDF detection so OCR-related failures return clear parse errors instead of ambiguous failures.

## Regression Coverage Added
- Section heading edge cases
- Labeled contact extraction with portfolio URL and location
- Date range parsing with `to` separators
- Education year extraction
- Skill alias normalization
- File signature validation for malformed PDF/DOCX uploads

## Validation Results
- Backend test suite: `127 passed, 4 skipped`
- Formats validated:
  - PDF resume fixtures via `tests/test_pdf_reader.py`, `tests/test_pdf_reader_new.py`, and `tests/test_document_loader.py`
  - DOCX resumes via generated DOCX benchmark input and loader validation
  - Invalid/disguised files via upload signature tests

## Residual OCR Limitation
- The platform now identifies scanned/image-based PDFs and returns an explicit OCR-related parsing error.
- Full OCR text recovery is still not enabled because the repository does not currently ship an OCR engine dependency/runtime.
