# Job-specific resume tailoring

19 October 2026. Implemented in the active `.mission-work` frontend. This is a local preview upgrade, not a publication to Hostinger or Sites.

## Workflow

Open **Tailor for a job** from the resume editor, **Tailor resume** from a tracked opportunity, or **Resume Tailoring** in the sidebar. Select an existing resume and either a saved job or a pasted description. Choose or edit the words and phrases to check, then create an independent tailored copy. Adapt its content in the existing builder and return through **Review term coverage**. Use **Use for this application** to explicitly link the saved copy to the selected tracker entry.

The original resume's content and design remain available. Target details save with the copy and survive JSON normalization/backups. Target details are excluded from the resume's published text and wording evidence. Creating a copy and linking it are separate saves, so a tracker failure cannot erase a successfully saved copy. Linking preserves the current job's other fields.

## Comparison boundaries

Coverage checks literal whole tokens and phrases in the selected visible resume sections. It ignores case and separator punctuation while keeping technology spellings such as C++ and C#. Each found term has a section and text excerpt. Hidden sections, contact information, document titles and the target job description do not contribute evidence.

Suggested terms use word frequency and a boilerplate stop list. They are editable suggestions, not inferred employer requirements. Synonyms and semantic equivalence are not inferred. The result is a selected-term fraction, not an ATS score or a hiring prediction. The tool does not generate experience, add missing skills, or submit an application. Comparison and persistence operate in the browser without an AI service or document-processing request.

Targets accept a role up to 150 characters, company up to 150, description up to 30,000 and up to 60 terms of 80 characters each. Resume content/design are kept intact. Legacy documents without target metadata remain compatible. Invalid target metadata in an imported backup is discarded while retaining the underlying resume.

## Data protection

Copy creation uses one resume-library write and leaves stored data intact on quota/read failures. Saving target details rereads the current document, retaining newer resume edits, and rejects a stale target when another tab changed it. The UI asks the user to save changed target details before opening its editor. Removing the original or tracked job does not erase an existing tailored copy.

## Acceptance

- Production build/type validation: passed, including all 20 generated pages.
- Automated suite: 41 tests passed plus existing career/export checks, including eight new substantive tailoring tests.
- [Browser acceptance](qa/resume-tailoring/report.json): all six groups passed with no page errors or API requests. Coverage includes tracked-job and manual starts, immediate editor-save flush, independent copies, application links, editing/reload, conflict detection, quota/corrupt-storage recovery, 390 px layout and section shortcuts.
- [Desktop](qa/resume-tailoring/tailoring-desktop.png) and [mobile](qa/resume-tailoring/tailoring-390.png) screenshots contain synthetic records and were visually inspected.

Run `npm test` and `npm run test:tailoring` from `.mission-work/frontend`; set `BASE_URL` to a running local-mode preview for the browser harness. The verified build uses `NEXT_DIST_DIR=.next-tailoring` and `NEXT_PUBLIC_STORAGE_MODE=local`. Refresh an already-open preview after switching builds so it loads the new document schema before creating tailored versions.
