# Resume Parser Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   cURL   │  │  Python  │  │   React  │  │  JavaScript  │   │
│  │  Client  │  │  Client  │  │    App   │  │     App      │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API LAYER                               │
│                        (FastAPI)                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    app/main.py                            │  │
│  │  • CORS Middleware                                        │  │
│  │  • Request Validation                                     │  │
│  │  • Error Handling                                         │  │
│  │  • OpenAPI Docs                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  app/api/routes.py                        │  │
│  │  • POST /api/parse-resume                                 │  │
│  │  • POST /api/score-resume                                 │  │
│  │  • POST /api/parse-and-score                              │  │
│  │  • GET  /api/health                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                              │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │  Parsing Service    │  │   Scoring Service    │              │
│  │  ─────────────────  │  │  ──────────────────  │              │
│  │  • Load Document    │  │  • Score Readability │              │
│  │  • Detect Sections  │  │  • Score Structure   │              │
│  │  • Extract Contact  │  │  • Score Experience  │              │
│  │  • Extract Name     │  │  • Score Skills      │              │
│  │  • Parse Experience │  │  • Score Length      │              │
│  │  • Parse Education  │  │  • Generate Comments │              │
│  │  • Parse Skills     │  │                      │              │
│  └─────────────────────┘  └─────────────────────┘              │
│            │                         │                           │
│            └────────┬────────────────┘                           │
│                     ▼                                            │
│         ┌───────────────────────┐                               │
│         │    NLP Service        │                               │
│         │  ───────────────────  │                               │
│         │  • spaCy Integration  │                               │
│         │  • NER (PERSON, ORG)  │                               │
│         │  • Tokenization       │                               │
│         │  • Sentence Segmentation │                            │
│         │  • Flesch-Kincaid     │                               │
│         │  • Syllable Counting  │                               │
│         └───────────────────────┘                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UTILITIES LAYER                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐        │
│  │ PDF Reader  │  │ DOCX Reader  │  │  Text Cleaner   │        │
│  │ ──────────  │  │ ───────────  │  │  ────────────   │        │
│  │ • pdfplumber│  │ • python-docx│  │  • Normalize    │        │
│  │ • Layout    │  │ • Style      │  │  • Clean        │        │
│  │   Aware     │  │   Detection  │  │  • Extract      │        │
│  │ • Clean Text│  │ • Tables     │  │    Bullets      │        │
│  └─────────────┘  └──────────────┘  └─────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Data Models (Pydantic)                                   │  │
│  │  • Resume, ContactInfo, ExperienceItem, EducationItem     │  │
│  │  • SkillItem, ProjectItem, CertificationItem              │  │
│  │  • ResumeScore, ReadabilityMetrics, StructureMetrics      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Dictionaries (JSON)                                      │  │
│  │  • section_headings.json - Section synonyms               │  │
│  │  • skills_taxonomy.json - Categorized skills              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Parse Resume Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────┐
│  Upload  │────▶│   Load      │────▶│   Detect     │────▶│ Extract │
│   File   │     │ Document    │     │  Sections    │     │ Entities│
└──────────┘     └─────────────┘     └──────────────┘     └─────────┘
                       │                     │                   │
                       │                     │                   │
                  ┌────▼─────┐         ┌────▼────┐        ┌─────▼────┐
                  │PDF/DOCX  │         │ Section │        │   NER    │
                  │ Reader   │         │ Matching│        │  spaCy   │
                  └──────────┘         └─────────┘        └──────────┘
                                                                 │
                                                                 ▼
                                                          ┌────────────┐
                                                          │   Resume   │
                                                          │   Object   │
                                                          └────────────┘
```

### 2. Score Resume Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────┐
│  Resume  │────▶│  Calculate  │────▶│   Calculate  │────▶│Generate │
│  Object  │     │ Readability │     │  Component   │     │Comments │
└──────────┘     └─────────────┘     │   Scores     │     └─────────┘
                       │              └──────────────┘           │
                       │                     │                   │
                  ┌────▼─────┐         ┌────▼────┐        ┌─────▼────┐
                  │Flesch-   │         │Structure│        │  Score   │
                  │Kincaid   │         │Exp/Skills│       │  Object  │
                  └──────────┘         └─────────┘        └──────────┘
```

## Component Responsibilities

### API Layer (`app/main.py`, `app/api/routes.py`)
- **Input**: HTTP requests with file uploads
- **Processing**: Request validation, routing, error handling
- **Output**: JSON responses with Resume/Score data
- **Dependencies**: FastAPI, Pydantic

### Parsing Service (`app/services/parsing_service.py`)
- **Input**: RawDocument (from file readers)
- **Processing**: Section detection, entity extraction, structuring
- **Output**: Resume object (structured data)
- **Dependencies**: NLP Service, dictionaries

### NLP Service (`app/services/nlp_service.py`)
- **Input**: Raw text
- **Processing**: NER, tokenization, readability calculations
- **Output**: Entities, tokens, metrics
- **Dependencies**: spaCy (en_core_web_md)

### Scoring Service (`app/services/scoring_service.py`)
- **Input**: Resume object
- **Processing**: Multi-dimensional quality analysis
- **Output**: ResumeScore object with metrics
- **Dependencies**: NLP Service

### File Readers (`app/utils/`)
- **PDF Reader**: Layout-aware extraction, cleaning
- **DOCX Reader**: Style-aware parsing, table extraction
- **Text Cleaner**: Normalization, bullet extraction

## Technology Stack

```
┌──────────────────────────────────────────────┐
│           Application Layer                   │
│  • Python 3.11+ (Type Hints)                 │
│  • FastAPI (Web Framework)                   │
│  • Uvicorn (ASGI Server)                     │
│  • Pydantic (Data Validation)                │
└──────────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────────┐
│           NLP & Processing                    │
│  • spaCy 3.7 (NLP Engine)                    │
│  • en_core_web_md (Language Model)           │
│  • Custom Algorithms (Flesch-Kincaid)        │
└──────────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────────┐
│         Document Processing                   │
│  • pdfplumber (PDF Extraction)               │
│  • PyMuPDF (Fallback PDF)                    │
│  • python-docx (DOCX Parsing)                │
└──────────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────────┐
│         Infrastructure                        │
│  • Docker (Containerization)                 │
│  • pytest (Testing)                          │
│  • uvicorn (Production Server)               │
└──────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                           │
│                    (nginx/traefik)                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Worker 1    │  │   Worker 2    │  │   Worker 3    │
│  (Uvicorn)    │  │  (Uvicorn)    │  │  (Uvicorn)    │
│   Container   │  │   Container   │  │   Container   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Shared Volume  │
                  │  (data/, logs/) │
                  └─────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
- Run multiple Uvicorn workers
- Deploy multiple containers with Docker
- Use load balancer for distribution

### Caching Layer (Future)
```
┌─────────┐     ┌───────┐     ┌──────────────┐
│ Client  │────▶│ Redis │────▶│  API Server  │
└─────────┘     │ Cache │     └──────────────┘
                └───────┘
```

### Database Layer (Future)
```
┌──────────────┐     ┌──────────────┐
│  API Server  │────▶│  PostgreSQL  │
└──────────────┘     │   (Resumes)  │
                     └──────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────┐
│  1. Input Validation (Pydantic)         │
│     • File type checking                │
│     • File size limits                  │
│     • MIME type validation              │
├─────────────────────────────────────────┤
│  2. Authentication (Future)             │
│     • API Keys                          │
│     • JWT Tokens                        │
│     • OAuth 2.0                         │
├─────────────────────────────────────────┤
│  3. Rate Limiting (Future)              │
│     • Per IP                            │
│     • Per API Key                       │
├─────────────────────────────────────────┤
│  4. CORS Configuration                  │
│     • Allowed origins                   │
│     • Allowed methods                   │
└─────────────────────────────────────────┘
```

## Extension Points

The architecture is designed with extension in mind:

1. **New File Formats**: Add reader in `app/utils/`
2. **New Scoring Metrics**: Extend `ScoringService`
3. **Job Matching**: New service in `app/services/`
4. **Database Storage**: Add models and ORM layer
5. **Batch Processing**: Add async queue (Celery/RQ)
6. **Multi-language**: Add language detection + spaCy models

---

This architecture provides:
- **Modularity**: Each component has clear responsibilities
- **Testability**: Services can be tested independently
- **Scalability**: Can scale horizontally with workers
- **Maintainability**: Clean separation of concerns
- **Extensibility**: Easy to add new features
