# API Documentation

Complete API reference for the Resume Parser and Scoring Service.

## Base URL

```
http://localhost:8000
```

For production deployments, replace with your actual domain.

## Authentication

Currently, the API does not require authentication. For production use, consider adding:
- API keys
- JWT tokens
- OAuth 2.0

## Rate Limiting

Not currently implemented. Recommended for production:
- 100 requests per minute per IP
- 1000 requests per day per API key

## Endpoints

### 1. Root

Get API information.

```http
GET /
```

**Response 200 OK**:
```json
{
  "name": "Resume Parser API",
  "version": "1.0.0",
  "status": "running",
  "docs": "/docs",
  "health": "/api/health"
}
```

---

### 2. Health Check

Check if the API is healthy and responsive.

```http
GET /api/health
```

**Response 200 OK**:
```json
{
  "status": "healthy"
}
```

---

### 3. Parse Resume

Extract structured information from a resume.

```http
POST /api/parse-resume
Content-Type: multipart/form-data
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| file | File | Yes | Resume file (PDF or DOCX) |

**Response 200 OK**:
```json
{
  "name": "John Doe",
  "contact": {
    "email": "john.doe@example.com",
    "phone": "+1 555-123-4567",
    "linkedin": "linkedin.com/in/johndoe",
    "github": "github.com/johndoe",
    "website": null,
    "location": null
  },
  "summary": "Experienced software engineer with 5+ years...",
  "experience": [
    {
      "job_title": "Senior Software Engineer",
      "company": "TechCorp",
      "location": null,
      "start_date": "Jan 2021",
      "end_date": null,
      "is_current": true,
      "bullets": [
        "Led development of microservices architecture",
        "Improved API performance by 40%",
        "Mentored team of 5 developers"
      ],
      "raw_text": "..."
    }
  ],
  "education": [
    {
      "degree": "BSc",
      "field_of_study": null,
      "institution": "University of Technology",
      "location": null,
      "graduation_year": "2020",
      "gpa": null,
      "honors": null,
      "raw_text": "..."
    }
  ],
  "skills": [
    {
      "name": "Python",
      "category": "programming_languages",
      "normalized_name": "python"
    }
  ],
  "projects": [],
  "certifications": [],
  "languages": ["English"],
  "raw_text": "..."
}
```

**Error Responses**:

- **400 Bad Request**: Invalid file type or missing file
- **500 Internal Server Error**: Processing error

---

### 4. Score Resume

Calculate quality score for a resume.

```http
POST /api/score-resume
Content-Type: multipart/form-data
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| file | File | Yes | Resume file (PDF or DOCX) |

**Response 200 OK**:
```json
{
  "score": {
    "overall": 78.5,
    "readability": {
      "flesch_reading_ease": 65.0,
      "flesch_kincaid_grade": 10.2,
      "avg_words_per_sentence": 15.3,
      "avg_syllables_per_word": 1.6,
      "readability_score": 82.0
    },
    "structure": {
      "has_contact": true,
      "has_summary": true,
      "has_experience": true,
      "has_education": true,
      "has_skills": true,
      "section_count": 6,
      "structure_score": 95.0
    },
    "experience": {
      "total_roles": 3,
      "avg_bullets_per_role": 4.3,
      "quantified_achievements": 5,
      "quantification_rate": 38.5,
      "experience_score": 75.0
    },
    "skills": {
      "total_skills": 18,
      "categorized_skills": 15,
      "unique_categories": 4,
      "skills_score": 80.0
    },
    "length": {
      "word_count": 650,
      "estimated_pages": 1.4,
      "is_too_short": false,
      "is_too_long": false,
      "length_score": 90.0
    },
    "comments": [
      "✓ Good resume with room for minor improvements",
      "✓ Great structure with all key sections present",
      "→ Consider adding more quantified achievements",
      "✓ Resume length is appropriate"
    ]
  },
  "resume_summary": {
    "name": "John Doe",
    "contact": { ... },
    "total_experience": 3,
    "total_education": 1,
    "total_skills": 18
  }
}
```

---

### 5. Parse and Score

Parse and score a resume in one request.

```http
POST /api/parse-and-score
Content-Type: multipart/form-data
```

**Parameters**:

| Name | Type | Required | Description |
|------|------|----------|-------------|
| file | File | Yes | Resume file (PDF or DOCX) |

**Response 200 OK**:
```json
{
  "resume": { 
    // Full Resume object (see Parse Resume response)
  },
  "score": {
    // Full ResumeScore object (see Score Resume response)
  }
}
```

---

## Data Models

### Resume

Complete parsed resume structure.

```typescript
interface Resume {
  name: string | null;
  contact: ContactInfo;
  summary: string | null;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages: string[];
  raw_text: string;
}
```

### ContactInfo

```typescript
interface ContactInfo {
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  website: string | null;
  location: string | null;
}
```

### ExperienceItem

```typescript
interface ExperienceItem {
  job_title: string | null;
  company: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  bullets: string[];
  raw_text: string;
}
```

### EducationItem

```typescript
interface EducationItem {
  degree: string | null;
  field_of_study: string | null;
  institution: string | null;
  location: string | null;
  graduation_year: string | null;
  gpa: string | null;
  honors: string | null;
  raw_text: string;
}
```

### SkillItem

```typescript
interface SkillItem {
  name: string;
  category: string | null;
  normalized_name: string;
}
```

### ResumeScore

```typescript
interface ResumeScore {
  overall: number;  // 0-100
  readability: ReadabilityMetrics;
  structure: StructureMetrics;
  experience: ExperienceMetrics;
  skills: SkillsMetrics;
  length: LengthMetrics;
  comments: string[];
}
```

## Scoring Methodology

### Overall Score Calculation

The overall score is a weighted average of five components:

| Component | Weight | Description |
|-----------|--------|-------------|
| Readability | 15% | Flesch-Kincaid readability metrics |
| Structure | 25% | Presence and completeness of key sections |
| Experience | 30% | Quality and detail of work experience |
| Skills | 20% | Richness and diversity of skills |
| Length | 10% | Appropriate resume length |

### Readability Score (0-100)

Based on Flesch-Kincaid formulas:

**Flesch Reading Ease**: `206.835 - 1.015 × (words/sentences) - 84.6 × (syllables/words)`

**Grade Level**: `0.39 × (words/sentences) + 11.8 × (syllables/words) - 15.59`

**Optimal Range**:
- Reading Ease: 60-70 (standard/fairly easy)
- Grade Level: 8-10 (8th-10th grade)

### Structure Score (0-100)

- **Critical sections** (25 points each): Contact, Experience, Education, Skills
- **Optional sections** (5 points each): Summary, Projects, Certifications, Languages
- **Maximum**: 100 points

### Experience Score (0-100)

Points awarded for:
- **Number of roles**: 1 role (10), 2 roles (20), 3+ roles (30)
- **Bullet density**: 2+ bullets (10), 3+ bullets (20), 4+ bullets (30)
- **Quantification**: >0% (10), >15% (20), >25% (30), >40% (40)

### Skills Score (0-100)

Points awarded for:
- **Skill count**: 1+ (10), 5+ (20), 10+ (30), 15+ (40)
- **Categorization**: >30% (10), >50% (20), >70% (30)
- **Diversity**: 2+ categories (10), 3+ (20), 5+ (30)

### Length Score (0-100)

- **Too short** (<150 words): Penalty
- **Optimal** (400-1500 words): 100 points
- **Too long** (>2000 words): Penalty

## Error Handling

### Error Response Format

```json
{
  "detail": "Error message description"
}
```

### Common Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid file type or missing parameters |
| 404 | Not Found - Endpoint does not exist |
| 413 | Payload Too Large - File exceeds size limit |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Processing error |

## File Requirements

### Supported Formats

- **PDF** (`.pdf`) - Recommended for best compatibility
- **DOCX** (`.docx`) - Microsoft Word documents

### File Size Limits

- Default: 10 MB
- Configurable via `MAX_FILE_SIZE_MB` environment variable

### Best Practices

1. **Use text-based PDFs**, not scanned images (OCR not yet supported)
2. **Avoid complex layouts** with excessive graphics
3. **Use standard fonts** for better text extraction
4. **Keep file size reasonable** (<5 MB ideal)

## Examples

### cURL Examples

```bash
# Parse resume
curl -X POST "http://localhost:8000/api/parse-resume" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@resume.pdf"

# Score resume
curl -X POST "http://localhost:8000/api/score-resume" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@resume.pdf"

# Parse and score
curl -X POST "http://localhost:8000/api/parse-and-score" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@resume.pdf"
```

### Python Example

```python
import requests

url = "http://localhost:8000/api/parse-and-score"

with open("resume.pdf", "rb") as f:
    files = {"file": ("resume.pdf", f, "application/pdf")}
    response = requests.post(url, files=files)

if response.status_code == 200:
    data = response.json()
    print(f"Overall Score: {data['score']['overall']}")
else:
    print(f"Error: {response.text}")
```

### JavaScript Example

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8000/api/parse-and-score', {
  method: 'POST',
  body: formData
})
  .then(response => response.json())
  .then(data => {
    console.log('Score:', data.score.overall);
    console.log('Name:', data.resume.name);
  })
  .catch(error => console.error('Error:', error));
```

## Interactive Documentation

The API provides interactive documentation via Swagger UI and ReDoc:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These interfaces allow you to:
- Browse all endpoints
- See request/response schemas
- Try out endpoints directly in the browser
- Download OpenAPI specification

## Versioning

Current version: **1.0.0**

Future versions will maintain backward compatibility. Breaking changes will be released as major version updates (2.0.0, etc.).

## Support

For questions or issues:
1. Check the interactive docs at `/docs`
2. Review the main README.md
3. Check test files for examples
4. Open an issue on GitHub

---

**Last Updated**: December 2025
