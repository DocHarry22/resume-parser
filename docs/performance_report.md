# Performance Report

## Implemented Performance Improvements
- Removed repeated PDF reopen/fallback passes and now reuse the initial page walk for block and text extraction.
- Added bounded NLP preprocessing through `nlp_max_text_chars` to reduce denial-of-service risk from extremely large inputs.
- Made spaCy model loading deterministic and thread-safe by removing runtime auto-downloads and guarding singleton creation with a lock.
- Added upload signature validation to fail malformed files early before parser work begins.

## Benchmark Method
- Environment: local sandbox run after changes
- Workload:
  - Repository PDF fixture: `tests/resources/sample_resume.pdf`
  - Generated DOCX resume with summary, experience, education, and skills sections
- Flow benchmarked:
  1. Load document
  2. Parse structured resume
  3. Score resume in ATS mode

## Benchmark Results
| Input | Parse avg (ms) | Parse p95 (ms) | Score avg (ms) | Score p95 (ms) |
| --- | ---: | ---: | ---: | ---: |
| Sample PDF | 39.04 | 35.07 | 118.99 | 123.94 |
| Generated DOCX | 38.10 | 41.18 | 65.15 | 66.49 |

## Error-Handling and Security Impact
- CORS now uses explicit configured origins instead of a wildcard.
- spaCy model selection is restricted to approved models.
- Upload handling now rejects content/extension mismatches with a 400 response.
- Scanned PDFs return a clear OCR-related parse failure instead of a generic internal error.

## Follow-Up Opportunities
- Add optional OCR runtime support for scanned PDFs.
- Cache parsed spaCy docs when multiple extractors operate on the same text.
- Add dedicated latency tests for large real-world PDF and DOCX corpora.
