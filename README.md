# Resume Parser & Scoring Service

A production-grade **resume parsing and scoring backend service** built with Python, FastAPI, and spaCy. This service extracts structured information from PDF and DOCX resumes and computes comprehensive quality scores based on multiple metrics.

## 🌟 Features

- **Multi-format Support**: Parse PDF and DOCX resumes with layout-aware text extraction
- **Structured Extraction**: Extract contact info, experience, education, skills, projects, and certifications
- **NLP-Powered**: Uses spaCy for named entity recognition, tokenization, and text analysis
- **Quality Scoring**: Comprehensive scoring based on:
  - Readability (Flesch-Kincaid formulas)
  - Structural completeness
  - Experience quality and quantified achievements
  - Skills richness and diversity
  - Length and layout appropriateness
- **REST API**: Clean FastAPI endpoints with OpenAPI documentation
- **Extensible**: Modular architecture designed for easy extension

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Testing](#testing)
- [Configuration](#configuration)
- [Extensibility](#extensibility)
- [Contributing](#contributing)

## 🚀 Installation

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

### Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd resume_parser
```

2. **Create a virtual environment**:
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Download spaCy language model**:
```bash
python -m spacy download en_core_web_md
```

5. **Set up environment variables** (optional):
```bash
cp .env.example .env
# Edit .env with your configuration
```

## 🏃 Quick Start

### Run the API Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Or run directly with Python:

```bash
python -m app.main
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 📡 API Endpoints

### 1. Parse Resume

Extract structured information from a resume.

```http
POST /api/parse-resume
Content-Type: multipart/form-data

file: <resume.pdf or resume.docx>
```

**Response**: Full `Resume` object with extracted data.

### 2. Score Resume

Calculate quality score for a resume.

```http
POST /api/score-resume
Content-Type: multipart/form-data

file: <resume.pdf or resume.docx>
```

**Response**: `ResumeScore` with detailed metrics and minimal resume summary.

### 3. Parse and Score

Parse and score in a single request.

```http
POST /api/parse-and-score
Content-Type: multipart/form-data

file: <resume.pdf or resume.docx>
```

**Response**: Both full `Resume` and `ResumeScore` objects.

### 4. Health Check

```http
GET /api/health
```

## 💡 Usage Examples

### Using cURL

**Parse a resume**:
```bash
curl -X POST "http://localhost:8000/api/parse-resume" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@resume.pdf"
```

**Score a resume**:
```bash
curl -X POST "http://localhost:8000/api/score-resume" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@resume.pdf"
```

### Using Python (requests)

```python
import requests

# Parse resume
with open('resume.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/parse-resume',
        files={'file': f}
    )
    resume = response.json()
    print(f"Name: {resume['name']}")
    print(f"Skills: {len(resume['skills'])}")

# Score resume
with open('resume.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/score-resume',
        files={'file': f}
    )
    result = response.json()
    print(f"Overall Score: {result['score']['overall']}")
    print(f"Comments: {result['score']['comments']}")
```

### Using JavaScript (Fetch API)

```javascript
// Parse and score resume
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8000/api/parse-and-score', {
  method: 'POST',
  body: formData
})
  .then(response => response.json())
  .then(data => {
    console.log('Resume:', data.resume);
    console.log('Score:', data.score.overall);
    console.log('Suggestions:', data.score.comments);
  });
```

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build image
docker build -t resume-parser .

# Run container
docker run -p 8000:8000 resume-parser
```

### Using Docker Compose

```bash
# Start service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down
```

The API will be available at http://localhost:8000

## 📁 Project Structure

```
resume_parser/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py           # API endpoints
│   ├── core/
│   │   └── config.py           # Configuration settings
│   ├── services/
│   │   ├── parsing_service.py  # Resume parsing logic
│   │   ├── nlp_service.py      # spaCy NLP service
│   │   └── scoring_service.py  # Quality scoring engine
│   ├── models/
│   │   ├── resume_models.py    # Resume data models
│   │   └── scoring_models.py   # Scoring data models
│   └── utils/
│       ├── pdf_reader.py       # PDF extraction
│       ├── docx_reader.py      # DOCX extraction
│       └── text_cleaner.py     # Text cleaning utilities
├── data/
│   ├── section_headings.json   # Section heading dictionary
│   └── skills_taxonomy.json    # Skills categorization
├── tests/
│   ├── conftest.py
│   ├── test_pdf_reader.py
│   ├── test_docx_reader.py
│   ├── test_parsing_pipeline.py
│   └── test_scoring_engine.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 🏗️ Architecture

### 1. File Ingestion Layer

**PDF Extraction** (`utils/pdf_reader.py`):
- Uses `pdfplumber` for layout-aware extraction
- Handles multi-column layouts and complex structures
- Removes headers, footers, and page numbers
- **Challenge**: PDFs preserve visual layout, not logical reading order ([Unstract.com](https://unstract.com/blog/pdf-data-extraction-challenges/))

**DOCX Extraction** (`utils/docx_reader.py`):
- Uses `python-docx` for structured parsing
- Captures paragraph styles and headings
- Extracts tables when present

### 2. NLP Pipeline

**spaCy Integration** (`services/nlp_service.py`):
- Production-grade NLP library for text processing ([spacy.io](https://spacy.io))
- Named Entity Recognition (NER) for PERSON, ORG, DATE entities
- Tokenization and sentence segmentation
- Readability calculations (Flesch-Kincaid)

### 3. Section Detection

**Smart Heading Detection** (`services/parsing_service.py`):
- Dictionary-based matching with synonyms
- Normalizes text (lowercase, strip punctuation)
- Groups content under detected sections

### 4. Entity Extraction

Extracts:
- **Contact**: Email, phone, LinkedIn, GitHub (regex-based)
- **Name**: NER from first few lines
- **Experience**: Job title, company, dates, bullet points
- **Education**: Degree, institution, graduation year
- **Skills**: Categorized using taxonomy

### 5. Scoring Engine

**Comprehensive Quality Metrics** (`services/scoring_service.py`):

1. **Readability (15%)**: Flesch-Kincaid formulas ([Wikipedia](https://en.wikipedia.org/wiki/Flesch–Kincaid_readability_tests))
   - Flesch Reading Ease (0-100)
   - Grade level estimation
   - Optimal: 8th-10th grade reading level

2. **Structure (25%)**: Section completeness
   - Critical: contact, experience, education, skills
   - Optional: summary, projects, certifications

3. **Experience (30%)**: Quality indicators
   - Bullet density (3-5 per role ideal)
   - Quantified achievements (numbers, %, KPIs)
   - Multiple roles

4. **Skills (20%)**: Richness and diversity
   - Total skill count
   - Category diversity
   - Recognized skills

5. **Length (10%)**: Appropriate length
   - Optimal: 400-1500 words (1-3 pages)
   - Penalties for too short or too long

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_scoring_engine.py

# Run with verbose output
pytest -v
```

### Test Coverage

- **PDF/DOCX Readers**: Unit tests for text extraction and cleaning
- **Parsing Pipeline**: Section detection, entity extraction
- **Scoring Engine**: All scoring metrics and edge cases
- **API Endpoints**: Integration tests (can be added)

## ⚙️ Configuration

Configuration is managed through environment variables (`.env` file) or `app/core/config.py`:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | Resume Parser API | Application name |
| `DEBUG` | false | Debug mode |
| `HOST` | 0.0.0.0 | Server host |
| `PORT` | 8000 | Server port |
| `MAX_FILE_SIZE_MB` | 10 | Max upload file size |
| `SPACY_MODEL` | en_core_web_md | spaCy model name |
| `LOG_LEVEL` | INFO | Logging level |
| `DATA_DIR` | data | Data directory path |

## 🔧 Extensibility

The architecture is designed for easy extension:

### 1. Add New File Formats

Create a new reader in `utils/` (e.g., `rtf_reader.py`) and register in `parsing_service.py`.

### 2. Add Job Matching

Extend `scoring_service.py` to accept job descriptions and score keyword matches:

```python
def score_job_match(self, resume: Resume, job_description: str) -> float:
    # Extract job keywords
    # Compare with resume skills/experience
    # Return match percentage
    pass
```

### 3. Add Multi-Language Support

- Download additional spaCy models (e.g., `es_core_news_md` for Spanish)
- Detect language in `nlp_service.py`
- Load appropriate model dynamically

### 4. Add African Context Skills

Extend `data/skills_taxonomy.json`:

```json
{
  "african_industries": [
    "agriculture", "mining", "oil and gas", "telecommunications",
    "renewable energy", "microfinance", "mobile money"
  ],
  "local_languages": [
    "swahili", "zulu", "yoruba", "amharic", "hausa"
  ]
}
```

### 5. Add Suggestion Generator

Convert score feedback into natural language:

```python
def generate_suggestions(self, score: ResumeScore) -> List[str]:
    suggestions = []
    if score.experience.quantification_rate < 30:
        suggestions.append(
            "Try adding specific metrics: 'Increased sales by 25%' "
            "instead of 'Increased sales significantly'"
        )
    return suggestions
```

### 6. Add Database Storage

Integrate with PostgreSQL/MongoDB to store parsed resumes:

```python
# In routes.py
@router.post("/parse-resume")
async def parse_resume(file: UploadFile, db: Session = Depends(get_db)):
    resume = parsing_service.parse_resume(document)
    # Save to database
    db_resume = ResumeDB(**resume.dict())
    db.add(db_resume)
    db.commit()
    return resume
```

## 🔮 Future Enhancements

- **Job Matching**: Score resume relevance to job descriptions
- **ATS Optimization**: Check ATS-friendliness (formatting, keywords)
- **Skill Gap Analysis**: Identify missing skills for target roles
- **Industry-Specific Scoring**: Adjust weights by industry
- **Resume Templates**: Generate ATS-friendly templates
- **Batch Processing**: Process multiple resumes via async workers
- **GraphQL API**: Alternative to REST endpoints
- **Frontend Integration**: React/Next.js dashboard

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **spaCy**: Industrial-strength NLP ([spacy.io](https://spacy.io))
- **FastAPI**: Modern Python web framework
- **pdfplumber**: PDF text extraction
- **Flesch-Kincaid**: Readability formulas ([Wikipedia](https://en.wikipedia.org/wiki/Flesch–Kincaid_readability_tests))

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for the African job market and beyond.**
