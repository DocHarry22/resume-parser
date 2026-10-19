# Template design references

The layouts are original implementations informed by the following primary collections, reviewed on 18 October 2026:

- [Microsoft Word resume templates](https://word.cloud.microsoft/create/en/resume-templates/): bold nameplates, restrained professional documents, graphic headers, and different treatments for technical, management and creative roles.
- [Resume.io resume templates](https://resume.io/resume-templates): traditional full-width documents, career timelines, contrasting columns, editorial headers and separated qualifications panels.

The references informed hierarchy and layout patterns. Their template assets, sample resumes and branding were not imported into the app.

| Resume | Structure |
| --- | --- |
| Modern | Dark left sidebar contains contact details, skills, languages and certifications. Career history occupies the wider right column. |
| Classic | Centered serif nameplate, double rule and traditional full-width chronological sections. |
| Minimal | Left-aligned nameplate and a dedicated margin column for section labels. |
| Professional | Career timeline with dates in the left margin, milestone dots and shaded section titles. |
| Creative | Oversized masthead, personal monogram, highlighted introduction and open portfolio columns. |
| Elegant | Serif headings with a soft ivory qualifications panel on the right. |
| Executive | Full-width navy nameplate and a separate credentials column. |
| Technical | Monospace outline with numbered headings, a vertical accent and compact skill tags. |

Existing resume template IDs remain valid; Executive and Technical also survive browser storage and JSON backup restoration. In column layouts, user section order is retained within each column and hidden sections remain hidden. The gallery and builder selector use the actual document renderer. Gallery links carry their displayed accent color into the editor. Selecting a template applies its default typeface; the font control also allows an explicit sans, serif or monospace override.

The six cover letter choices now use different letterheads: traditional centered rules, a vertical blue accent, a minimal split header, a warm monogram masthead, a navy executive header, and a framed monospace contact block. Selector thumbnails and the editor share the same letterhead component.

The resume's **Print / Save PDF** option preserves the selected visual layout. Service PDF and Word downloads retain their existing readable document format.

Visual screenshots, print samples and browser results are in [docs/qa/template-designs](qa/template-designs/). Run `node frontend/tests/template-design-e2e.cjs` against the local preview to repeat the design checks. The tests use isolated profiles and synthetic details.
