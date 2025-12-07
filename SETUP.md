# Installation and Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+**: [Download Python](https://www.python.org/downloads/)
- **pip**: Usually comes with Python
- **Git** (optional): For cloning the repository

## Step-by-Step Installation

### 1. Set Up Project Directory

```powershell
# Navigate to your desired directory
cd C:\Users\game\OneDrive\Desktop\Personal\webapps\resume_parser

# Or clone if from git
# git clone <repository-url>
# cd resume_parser
```

### 2. Create Virtual Environment

**Windows (PowerShell)**:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1

# If you get execution policy error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt)**:
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

**macOS/Linux**:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

This will install:
- FastAPI (web framework)
- Uvicorn (ASGI server)
- spaCy (NLP library)
- pdfplumber (PDF extraction)
- PyMuPDF (alternative PDF library)
- python-docx (DOCX extraction)
- Pydantic (data validation)
- pytest (testing framework)

### 4. Download spaCy Language Model

```powershell
python -m spacy download en_core_web_md
```

This downloads the English medium model (~40MB). For better accuracy, you can use the large model:
```powershell
python -m spacy download en_core_web_lg
```

Then update `SPACY_MODEL=en_core_web_lg` in your `.env` file.

### 5. Set Up Environment Variables (Optional)

```powershell
# Copy example environment file
copy .env.example .env

# Edit .env with your preferred settings (use notepad or any editor)
notepad .env
```

### 6. Verify Installation

```powershell
# Test that imports work
python -c "import fastapi, spacy, pdfplumber, docx; print('✓ All dependencies installed')"

# Check spaCy model
python -c "import spacy; nlp = spacy.load('en_core_web_md'); print('✓ spaCy model loaded')"
```

## Running the Application

### Development Mode (with auto-reload)

```powershell
uvicorn app.main:app --reload
```

Or:

```powershell
python -m uvicorn app.main:app --reload
```

### Production Mode

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Direct Python Execution

```powershell
python -m app.main
```

## Accessing the API

Once running, access:

- **API Base**: http://localhost:8000
- **Interactive Docs (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/health

## Testing the API

### Using the Browser

1. Open http://localhost:8000/docs
2. Click on any endpoint (e.g., `/api/parse-resume`)
3. Click "Try it out"
4. Upload a resume file
5. Click "Execute"

### Using cURL (PowerShell)

```powershell
# Parse a resume
curl.exe -X POST "http://localhost:8000/api/parse-resume" `
  -H "accept: application/json" `
  -H "Content-Type: multipart/form-data" `
  -F "file=@path\to\resume.pdf"

# Score a resume
curl.exe -X POST "http://localhost:8000/api/score-resume" `
  -H "accept: application/json" `
  -H "Content-Type: multipart/form-data" `
  -F "file=@path\to\resume.pdf"
```

### Using Python Script

Create a test script `test_api.py`:

```python
import requests

url = "http://localhost:8000/api/parse-and-score"
file_path = "path/to/your/resume.pdf"

with open(file_path, "rb") as f:
    files = {"file": f}
    response = requests.post(url, files=files)
    
if response.status_code == 200:
    result = response.json()
    print(f"Name: {result['resume']['name']}")
    print(f"Overall Score: {result['score']['overall']}")
    print(f"\nComments:")
    for comment in result['score']['comments']:
        print(f"  - {comment}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
```

Run it:
```powershell
python test_api.py
```

## Running Tests

```powershell
# Install pytest if not already installed
pip install pytest pytest-asyncio

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_scoring_engine.py

# Run with coverage
pip install pytest-cov
pytest --cov=app tests/
```

## Docker Deployment

### Using Docker

```powershell
# Build the image
docker build -t resume-parser .

# Run the container
docker run -d -p 8000:8000 --name resume-parser resume-parser

# View logs
docker logs -f resume-parser

# Stop the container
docker stop resume-parser

# Remove the container
docker rm resume-parser
```

### Using Docker Compose

```powershell
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

## Troubleshooting

### Issue: ModuleNotFoundError

**Solution**: Make sure you're in the virtual environment and all dependencies are installed.

```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: spaCy model not found

**Solution**: Download the model explicitly.

```powershell
python -m spacy download en_core_web_md
```

### Issue: Port already in use

**Solution**: Either stop the process using port 8000 or use a different port.

```powershell
# Use different port
uvicorn app.main:app --port 8001

# Or find and kill the process on Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Issue: PDF extraction fails

**Solution**: Some PDFs are scanned images. Consider adding OCR support with `pytesseract`.

### Issue: Memory issues with large files

**Solution**: Adjust the `MAX_FILE_SIZE_MB` in settings and consider streaming for large files.

## Next Steps

1. **Test with your resumes**: Upload various resume formats
2. **Customize skills taxonomy**: Edit `data/skills_taxonomy.json` for your domain
3. **Add more sections**: Extend `data/section_headings.json`
4. **Integrate with frontend**: Use the API endpoints in your React/Next.js app
5. **Deploy to production**: Use services like Render, Fly.io, or AWS

## Getting Help

- Check the main [README.md](README.md) for architecture details
- Review the interactive API docs at `/docs`
- Check test files for usage examples
- Open an issue on GitHub for bugs or questions

## Performance Tips

1. **Use the medium spaCy model** (`en_core_web_md`) for good balance of speed and accuracy
2. **Enable caching** for frequently parsed resumes
3. **Use async/await** for concurrent processing
4. **Deploy with multiple workers** for production: `--workers 4`
5. **Add Redis** for caching parsed results
6. **Use CDN** for static assets if adding a frontend

---

**You're all set! Start parsing resumes. 🚀**
