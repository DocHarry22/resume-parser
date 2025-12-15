# Resume Builder & Auto-Fix System

## Overview

The Resume Builder and Auto-Fix system provides a comprehensive solution for creating, editing, and automatically improving resumes based on scoring feedback.

## Architecture

### Modular Design
The system is built with extensibility in mind, making it easy to add new features:

```
app/
├── models/
│   └── builder_models.py      # Pydantic models for resume building
├── services/
│   ├── builder_service.py     # CRUD operations for resumes
│   └── autofix_service.py     # Auto-fix recommendations & application
└── api/
    └── builder_routes.py       # REST API endpoints
```

## Features

### 1. Resume Builder (`builder_models.py`)

**Modular Section Types:**
- Contact Information
- Professional Summary
- Work Experience
- Education
- Skills (categorized)
- Certifications
- Projects
- Achievements
- Languages
- Volunteer Work
- Publications
- Custom Sections (extensible)

**Key Models:**
- `ResumeBuilder`: Main resume model with all sections
- `ContactInfo`: Contact details with validation
- `ExperienceEntry`: Work experience with achievements
- `EducationEntry`: Education with honors
- `SkillCategory`: Categorized skills
- `CertificationEntry`: Certifications with credentials
- `ProjectEntry`: Projects with technologies

### 2. Builder Service (`builder_service.py`)

**CRUD Operations:**
```python
# Create
resume = builder_service.create_resume(title="My Resume")

# Read
resume = builder_service.get_resume(resume_id)

# Update
updated = builder_service.update_resume(resume_id, update_data)

# Delete
success = builder_service.delete_resume(resume_id)
```

**Advanced Features:**
- Import from parsed resume (PDF/DOCX)
- Add/remove section entries
- Export to plain text
- Persistent storage (JSON files)
- In-memory caching

### 3. Auto-Fix Service (`autofix_service.py`)

**Fix Types:**
- `LENGTH`: Resume too long/short
- `SUMMARY`: Missing professional summary
- `READABILITY`: Long sentences, complex words
- `CONTACT`: Missing contact information
- `QUANTIFICATION`: Missing metrics and numbers
- `BULLETS`: Weak action verbs

**Workflow:**
```python
# 1. Analyze resume and generate fixes
fixes = autofix_service.generate_fixes(
    resume=resume,
    flags=score.flags,
    comments=score.comments,
    score=score.overall
)

# 2. Apply auto-applicable fixes
success, message, updated = autofix_service.apply_fix(resume_builder, fix)
```

**Fix Priority System:**
1. Contact information (highest)
2. Professional summary
3. Quantification & bullets
4. Readability (lowest)

## API Endpoints

### Resume CRUD

```http
POST /api/builder/create
POST /api/builder/import
GET /api/builder/{resume_id}
PATCH /api/builder/{resume_id}
DELETE /api/builder/{resume_id}
POST /api/builder/{resume_id}/save
GET /api/builder/list/all
```

### Section Management

```http
POST /api/builder/{resume_id}/section/{section}
DELETE /api/builder/{resume_id}/section/{section}/{index}
GET /api/builder/{resume_id}/export/text
```

### Auto-Fix Operations

```http
POST /api/builder/{resume_id}/analyze
POST /api/builder/{resume_id}/apply-fix
POST /api/builder/{resume_id}/apply-all-fixes
```

## Usage Examples

### 1. Create Resume from Scratch

```python
# Create empty resume
resume = builder_service.create_resume(title="Software Engineer Resume")

# Add contact info
resume.contact = ContactInfo(
    full_name="John Doe",
    email="john@example.com",
    phone="+1-555-0123"
)

# Add experience
exp = ExperienceEntry(
    company="Tech Corp",
    position="Senior Engineer",
    start_date="2020-01",
    end_date="Present",
    current=True,
    description=[
        "Led development of microservices",
        "Increased performance by 40%"
    ]
)
resume.experience.append(exp)
```

### 2. Import & Auto-Fix

```python
# Import existing resume
resume_builder = builder_service.create_from_parsed(parsed_resume)

# Score it
score = scoring_service.score_resume(resume)

# Generate fixes
fixes = autofix_service.generate_fixes(
    resume=parsed_resume,
    flags=score.flags,
    comments=score.comments,
    score=score.overall
)

# Apply auto-fixes
for fix in fixes:
    if fix.auto_applicable:
        success, msg, updated = autofix_service.apply_fix(resume_builder, fix)
```

### 3. Complete Workflow via API

```bash
# 1. Upload and import resume
curl -X POST http://localhost:8000/api/builder/import \
  -F "file=@resume.pdf"

# Response: { "resume": { "id": "abc-123", ... } }

# 2. Analyze for fixes
curl -X POST http://localhost:8000/api/builder/abc-123/analyze \
  -F "mode=EXPERT" \
  -F "industry=it-software"

# Response: { "fixes": [ ... ] }

# 3. Apply all auto-fixes
curl -X POST http://localhost:8000/api/builder/abc-123/apply-all-fixes \
  -F "mode=EXPERT"

# 4. Export improved resume
curl http://localhost:8000/api/builder/abc-123/export/text
```

## Extending the System

### Add New Fix Type

1. **Add enum to `FixType`:**
```python
class FixType(str, Enum):
    ...
    NEW_FIX = "new_fix"
```

2. **Create fix handler:**
```python
def _fix_new_issue(self, resume: Resume, feedback: str) -> AutoFix:
    return AutoFix(
        fix_type=FixType.NEW_FIX,
        action=FixAction.MODIFY,
        section="section_name",
        description="Fix description",
        suggested_value="suggestion"
    )
```

3. **Add to `generate_fixes` method:**
```python
if "keyword" in feedback_lower:
    fix = self._fix_new_issue(resume, feedback)
    if fix:
        fixes.append(fix)
```

### Add New Section Type

1. **Define model in `builder_models.py`:**
```python
class NewSectionEntry(BaseModel):
    field1: str
    field2: Optional[str]
```

2. **Add to `ResumeBuilder`:**
```python
class ResumeBuilder(BaseModel):
    ...
    new_section: List[NewSectionEntry] = Field(default_factory=list)
```

3. **Update `add_section_entry` in `builder_service.py`:**
```python
elif section == SectionType.NEW_SECTION:
    entry = NewSectionEntry(**entry_data)
    resume.new_section.append(entry)
```

## Testing

Run builder tests:
```bash
pytest tests/test_builder_service.py -v
pytest tests/test_autofix_service.py -v
```

## Storage

Resumes are stored in:
- **In-memory**: Fast access during session
- **Disk**: `data/resumes/{id}.json` for persistence

## Future Enhancements

- [ ] PDF export with templates
- [ ] DOCX export
- [ ] More auto-fix types (grammar, keywords, formatting)
- [ ] AI-powered suggestions
- [ ] Version history
- [ ] Collaborative editing
- [ ] Template library
- [ ] ATS optimization hints

## Integration with Scoring

The builder system integrates seamlessly with the existing scoring engine:

1. **Import** → Parse existing resume
2. **Score** → Analyze with scoring engine
3. **Fix** → Generate auto-fix recommendations
4. **Apply** → Automatically improve resume
5. **Export** → Download improved version

This creates a complete resume improvement workflow!
