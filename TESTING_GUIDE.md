# How to Test the Resume Parser

This guide walks you through testing the Resume Parser step-by-step.

## 🚀 Method 1: Quick Test (No API Server Required)

This tests the core functionality without starting the API server.

```powershell
# Make sure you're in the project directory and venv is activated
cd C:\Users\game\OneDrive\Desktop\Personal\webapps\resume_parser
.\venv\Scripts\Activate.ps1

# Run the quick test script
python test_quick.py
```

**Expected Output:**
```
============================================================
RESUME PARSER - QUICK TEST
============================================================

📄 Creating sample resume...
✓ Resume created for: Jane Smith
  - Experience items: 3
  - Education items: 1
  - Skills: 15

🔍 Scoring resume...
✓ Scoring complete!

============================================================
SCORING RESULTS
============================================================

🎯 Overall Score: 78.5/100

📊 Detailed Metrics:
  • Readability:  82.0/100
    - Flesch Reading Ease: 65.0
    - Grade Level: 10.2

  • Structure:    95.0/100
    - Has contact: True
    - Has experience: True
    - Has education: True
    - Has skills: True

  • Experience:   75.0/100
    - Total roles: 3
    - Avg bullets/role: 4.0
    - Quantified achievements: 9
    - Quantification rate: 75.0%

  • Skills:       80.0/100
    - Total skills: 15
    - Categorized: 15
    - Categories: 5

  • Length:       90.0/100
    - Word count: 650
    - Estimated pages: 1.4

💡 Improvement Suggestions:
  1. ✓ Good resume with room for minor improvements
  2. ✓ Great structure with all key sections present
  ...

✅ TEST COMPLETED SUCCESSFULLY!
```

---

## 🧪 Method 2: Run Unit Tests

Test all components individually:

```powershell
# Install pytest if not already installed
pip install pytest pytest-asyncio

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test files
pytest tests/test_pdf_reader.py -v
pytest tests/test_docx_reader.py -v
pytest tests/test_parsing_pipeline.py -v
pytest tests/test_scoring_engine.py -v

# Run with coverage report
pip install pytest-cov
pytest --cov=app tests/
```

**Expected Output:**
```
======================== test session starts ========================
collected 15 items

tests/test_pdf_reader.py::test_pdf_reader_initialization PASSED
tests/test_pdf_reader.py::test_is_page_number PASSED
tests/test_pdf_reader.py::test_is_decorative_line PASSED
tests/test_pdf_reader.py::test_split_into_blocks PASSED
tests/test_docx_reader.py::test_docx_reader_initialization PASSED
tests/test_docx_reader.py::test_is_heading_style PASSED
tests/test_parsing_pipeline.py::test_parsing_service_initialization PASSED
tests/test_parsing_pipeline.py::test_detect_section_heading PASSED
tests/test_parsing_pipeline.py::test_extract_contact_info PASSED
tests/test_parsing_pipeline.py::test_extract_date_range PASSED
tests/test_parsing_pipeline.py::test_detect_sections PASSED
tests/test_scoring_engine.py::test_scoring_service_initialization PASSED
tests/test_scoring_engine.py::test_score_resume PASSED
tests/test_scoring_engine.py::test_contains_quantification PASSED
tests/test_scoring_engine.py::test_score_empty_resume PASSED

======================== 15 passed in 2.5s =========================
```

---

## 🌐 Method 3: Test the API Server

### Step 1: Start the API Server

```powershell
# In terminal 1 - Start the server
uvicorn app.main:app --reload
```

**Expected Output:**
```
INFO:     Will watch for changes in these directories: ['C:\\Users\\game\\OneDrive\\Desktop\\Personal\\webapps\\resume_parser']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [67890]
INFO:     Waiting for application startup.
Starting Resume Parser API...
✓ NLP service initialized
✓ API server ready on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Step 2: Test with Browser (Swagger UI)

1. **Open your browser**
2. **Navigate to**: http://localhost:8000/docs
3. **You should see** the Swagger UI interface with all endpoints

#### Test the `/api/parse-resume` endpoint:

1. Click on **`POST /api/parse-resume`**
2. Click **"Try it out"** button
3. Click **"Choose File"** and select a resume (PDF or DOCX)
4. Click **"Execute"**
5. Scroll down to see the response

**Expected Response:**
```json
{
  "name": "John Doe",
  "contact": {
    "email": "john.doe@email.com",
    "phone": "+1 555-123-4567",
    "linkedin": "linkedin.com/in/johndoe",
    "github": null,
    "website": null,
    "location": null
  },
  "summary": "Experienced software engineer...",
  "experience": [
    {
      "job_title": "Senior Software Engineer",
      "company": "TechCorp",
      "location": null,
      "start_date": "Jan 2021",
      "end_date": null,
      "is_current": true,
      "bullets": [
        "Led development of microservices...",
        "Improved performance by 40%..."
      ]
    }
  ],
  "education": [...],
  "skills": [...],
  ...
}
```

#### Test the `/api/score-resume` endpoint:

1. Click on **`POST /api/score-resume`**
2. Click **"Try it out"**
3. Upload the same resume
4. Click **"Execute"**

**Expected Response:**
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
      "→ Consider adding more quantified achievements"
    ]
  },
  "resume_summary": {
    "name": "John Doe",
    "contact": {...},
    "total_experience": 3,
    "total_education": 1,
    "total_skills": 18
  }
}
```

### Step 3: Test with cURL

```powershell
# Test health endpoint
curl.exe http://localhost:8000/api/health

# Parse a resume (replace with your file path)
curl.exe -X POST "http://localhost:8000/api/parse-resume" `
  -H "accept: application/json" `
  -H "Content-Type: multipart/form-data" `
  -F "file=@C:\path\to\your\resume.pdf"

# Score a resume
curl.exe -X POST "http://localhost:8000/api/score-resume" `
  -H "accept: application/json" `
  -H "Content-Type: multipart/form-data" `
  -F "file=@C:\path\to\your\resume.pdf"

# Parse and score in one request
curl.exe -X POST "http://localhost:8000/api/parse-and-score" `
  -H "accept: application/json" `
  -H "Content-Type: multipart/form-data" `
  -F "file=@C:\path\to\your\resume.pdf"
```

### Step 4: Test with Python Client

```powershell
# In a new terminal (keep API server running in terminal 1)
# In terminal 2:
.\venv\Scripts\Activate.ps1

# Test with example client (replace with your resume path)
python example_client.py C:\path\to\your\resume.pdf
```

**Expected Output:**
```
Resume Parser API Client
============================================================

🔍 Checking API health...
✅ API is running: {'status': 'healthy'}

📄 Processing: C:\path\to\your\resume.pdf

⏳ Parsing and scoring resume...

============================================================
RESUME SUMMARY
============================================================

📋 Name: John Doe
📧 Email: john.doe@email.com
📱 Phone: +1 555-123-4567
🔗 LinkedIn: linkedin.com/in/johndoe

💼 Experience: 3 roles
   1. Senior Software Engineer at TechCorp
   2. Software Engineer at StartupXYZ
   3. Junior Developer at CompanyABC

🎓 Education: 1 entries
   1. BSc - University of Technology

🛠️  Skills: 18 total
   Top 10: Python, JavaScript, React, Docker, AWS, ...

============================================================
SCORING RESULTS
============================================================

🎯 Overall Score: 78.5/100
✅ Grade: B - Good

📊 Detailed Breakdown:
   • Readability:  82.0/100
   • Structure:    95.0/100
   • Experience:   75.0/100
   • Skills:       80.0/100
   • Length:       90.0/100

💡 Suggestions for Improvement:
   1. ✓ Good resume with room for minor improvements
   2. ✓ Great structure with all key sections present
   3. → Consider adding more quantified achievements
   4. ✓ Resume length is appropriate

💾 Full results saved to: resume_analysis.json

✅ Analysis complete!
```

---

## 🐳 Method 4: Test with Docker

### Build and run with Docker:

```powershell
# Build the Docker image
docker build -t resume-parser .

# Run the container
docker run -d -p 8000:8000 --name resume-parser resume-parser

# Check if it's running
docker ps

# View logs
docker logs resume-parser

# Test the API
curl.exe http://localhost:8000/api/health

# Stop and remove container
docker stop resume-parser
docker rm resume-parser
```

### Or use Docker Compose:

```powershell
# Start the service
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Test the API
start http://localhost:8000/docs

# Stop the service
docker-compose down
```

---

## 📝 Method 5: Create Your Own Test Script

Create a file `test_my_resume.py`:

```python
import requests

# Start by making sure the API is running
API_URL = "http://localhost:8000/api"

def test_with_my_resume(file_path):
    """Test with your own resume."""
    
    # Check API health
    print("Checking API...")
    health = requests.get(f"{API_URL}/health")
    print(f"✓ API Status: {health.json()}\n")
    
    # Parse and score the resume
    print(f"Processing: {file_path}")
    with open(file_path, 'rb') as f:
        response = requests.post(
            f"{API_URL}/parse-and-score",
            files={'file': f}
        )
    
    if response.status_code == 200:
        result = response.json()
        
        # Display results
        print(f"\n✓ Name: {result['resume']['name']}")
        print(f"✓ Email: {result['resume']['contact']['email']}")
        print(f"✓ Experience roles: {len(result['resume']['experience'])}")
        print(f"✓ Skills: {len(result['resume']['skills'])}")
        print(f"\n🎯 Overall Score: {result['score']['overall']}/100")
        
        print("\n💡 Suggestions:")
        for comment in result['score']['comments']:
            print(f"  - {comment}")
    else:
        print(f"✗ Error: {response.status_code}")
        print(response.text)

# Run the test
test_with_my_resume("path/to/your/resume.pdf")
```

Run it:
```powershell
python test_my_resume.py
```

---

## 🎯 Quick Testing Checklist

Here's the fastest way to verify everything works:

```powershell
# 1. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 2. Quick functionality test (no server needed)
python test_quick.py

# 3. Run unit tests
pytest -v

# 4. Start API server
uvicorn app.main:app --reload

# 5. In browser, test endpoints
# Visit: http://localhost:8000/docs

# 6. In another terminal, test with client
python example_client.py path/to/resume.pdf
```

---

## 🐛 Troubleshooting Tests

### If `test_quick.py` fails:

```powershell
# Check if spaCy model is installed
python -c "import spacy; nlp = spacy.load('en_core_web_md'); print('✓ Model loaded')"

# If not, download it
python -m spacy download en_core_web_md
```

### If API won't start:

```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# If in use, use a different port
uvicorn app.main:app --reload --port 8001

# Or kill the process using port 8000
taskkill /PID <PID> /F
```

### If pytest fails:

```powershell
# Install pytest
pip install pytest pytest-asyncio

# Make sure you're in the project root
cd C:\Users\game\OneDrive\Desktop\Personal\webapps\resume_parser

# Run tests with verbose output to see which failed
pytest -v
```

### If file upload fails:

- Check file size (must be < 10MB by default)
- Check file type (only .pdf and .docx supported)
- Make sure file is not corrupted
- Check file permissions

---

## ✅ Expected Results Summary

| Test Type | Expected Result |
|-----------|----------------|
| `test_quick.py` | Score output with 5 metrics (0-100 each) |
| Unit tests | All tests pass (green) |
| API health | `{"status": "healthy"}` |
| Parse resume | JSON with name, contact, experience, etc. |
| Score resume | JSON with overall score + 5 detailed metrics |
| Browser UI | Interactive Swagger docs load properly |
| Example client | Formatted output with resume summary + score |

---

## 🎓 What to Test With

**Good test resumes should have:**
- ✅ Clear contact information (email, phone)
- ✅ Multiple sections (Experience, Education, Skills)
- ✅ Work experience with bullet points
- ✅ Education history
- ✅ Skills list

**Try different formats:**
- Single-column PDF
- Multi-column PDF
- DOCX with tables
- Minimal resume (few sections)
- Comprehensive resume (all sections)

---

**You're ready to test! Start with `python test_quick.py` for the fastest verification.** 🚀
