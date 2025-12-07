# Getting Started Checklist

Use this checklist to set up and verify your Resume Parser installation.

## ✅ Installation Checklist

### 1. Prerequisites
- [ ] Python 3.11 or higher installed
  - Check: `python --version`
- [ ] pip installed
  - Check: `pip --version`
- [ ] Git installed (optional)
  - Check: `git --version`

### 2. Project Setup
- [ ] Navigate to project directory
  ```powershell
  cd C:\Users\game\OneDrive\Desktop\Personal\webapps\resume_parser
  ```
- [ ] Create virtual environment
  ```powershell
  python -m venv venv
  ```
- [ ] Activate virtual environment
  ```powershell
  # PowerShell
  .\venv\Scripts\Activate.ps1
  
  # Command Prompt
  venv\Scripts\activate.bat
  ```
- [ ] Verify activation (should see `(venv)` in prompt)

### 3. Install Dependencies
- [ ] Upgrade pip
  ```powershell
  pip install --upgrade pip
  ```
- [ ] Install requirements
  ```powershell
  pip install -r requirements.txt
  ```
- [ ] Download spaCy model
  ```powershell
  python -m spacy download en_core_web_md
  ```

### 4. Verify Installation
- [ ] Test imports
  ```powershell
  python -c "import fastapi, spacy, pdfplumber, docx; print('✓ All imports successful')"
  ```
- [ ] Verify spaCy model
  ```powershell
  python -c "import spacy; nlp = spacy.load('en_core_web_md'); print('✓ spaCy model loaded')"
  ```
- [ ] Run quick test
  ```powershell
  python test_quick.py
  ```

### 5. Configuration (Optional)
- [ ] Copy environment template
  ```powershell
  copy .env.example .env
  ```
- [ ] Edit `.env` file with your settings
- [ ] Review `app/core/config.py` for available options

---

## ✅ First Run Checklist

### 1. Start the API Server
- [ ] Start in development mode
  ```powershell
  uvicorn app.main:app --reload
  ```
- [ ] Wait for "Application startup complete" message
- [ ] Note the URL (default: http://127.0.0.1:8000)

### 2. Verify API is Running
- [ ] Open browser to http://localhost:8000
- [ ] Should see JSON response with API info
- [ ] Open http://localhost:8000/docs
- [ ] Should see Swagger UI interface
- [ ] Test health endpoint: http://localhost:8000/api/health

### 3. Test with Sample Resume
- [ ] Prepare a test resume (PDF or DOCX)
- [ ] Navigate to http://localhost:8000/docs
- [ ] Click on `POST /api/parse-and-score`
- [ ] Click "Try it out"
- [ ] Upload your resume file
- [ ] Click "Execute"
- [ ] Verify you get a 200 response with parsed data

### 4. Test with Example Client
- [ ] Open new terminal (keep API running)
- [ ] Run example client
  ```powershell
  python example_client.py path\to\your\resume.pdf
  ```
- [ ] Verify output shows parsed resume and score

---

## ✅ Testing Checklist

### 1. Run Unit Tests
- [ ] Run all tests
  ```powershell
  pytest
  ```
- [ ] Run with verbose output
  ```powershell
  pytest -v
  ```
- [ ] Verify all tests pass

### 2. Run Individual Test Suites
- [ ] Test PDF reader
  ```powershell
  pytest tests/test_pdf_reader.py -v
  ```
- [ ] Test DOCX reader
  ```powershell
  pytest tests/test_docx_reader.py -v
  ```
- [ ] Test parsing pipeline
  ```powershell
  pytest tests/test_parsing_pipeline.py -v
  ```
- [ ] Test scoring engine
  ```powershell
  pytest tests/test_scoring_engine.py -v
  ```

### 3. Test with Various Resumes
- [ ] Test with single-column PDF
- [ ] Test with multi-column PDF
- [ ] Test with DOCX resume
- [ ] Test with minimal resume (few sections)
- [ ] Test with comprehensive resume (all sections)

---

## ✅ Docker Deployment Checklist

### 1. Docker Setup
- [ ] Docker installed
  - Check: `docker --version`
- [ ] Docker daemon running
- [ ] Docker Compose installed (optional)
  - Check: `docker-compose --version`

### 2. Build and Run
- [ ] Build Docker image
  ```powershell
  docker build -t resume-parser .
  ```
- [ ] Run container
  ```powershell
  docker run -d -p 8000:8000 --name resume-parser resume-parser
  ```
- [ ] Verify container is running
  ```powershell
  docker ps
  ```
- [ ] Check logs
  ```powershell
  docker logs resume-parser
  ```

### 3. Test Docker Deployment
- [ ] Access API at http://localhost:8000
- [ ] Test endpoints via http://localhost:8000/docs
- [ ] Upload and parse a test resume

### 4. Docker Compose (Alternative)
- [ ] Start with Docker Compose
  ```powershell
  docker-compose up -d
  ```
- [ ] Check status
  ```powershell
  docker-compose ps
  ```
- [ ] View logs
  ```powershell
  docker-compose logs -f
  ```

---

## ✅ Customization Checklist

### 1. Skills Taxonomy
- [ ] Review `data/skills_taxonomy.json`
- [ ] Add your industry-specific skills
- [ ] Add local/regional skills
- [ ] Test that new skills are recognized

### 2. Section Headings
- [ ] Review `data/section_headings.json`
- [ ] Add synonyms for your region/language
- [ ] Add custom section types if needed
- [ ] Test section detection with custom headings

### 3. Scoring Weights
- [ ] Review weights in `app/services/scoring_service.py`
- [ ] Adjust weights based on your priorities
  - Default: readability=15%, structure=25%, experience=30%, skills=20%, length=10%
- [ ] Test scoring with adjusted weights

### 4. Configuration
- [ ] Review `app/core/config.py`
- [ ] Adjust file size limits if needed
- [ ] Configure logging level
- [ ] Set appropriate host/port for deployment

---

## ✅ Integration Checklist

### 1. Frontend Integration
- [ ] Document API endpoints for frontend team
- [ ] Share OpenAPI spec from `/docs`
- [ ] Provide example requests/responses
- [ ] Set up CORS for frontend domain
- [ ] Test CORS with actual frontend

### 2. Production Deployment
- [ ] Choose hosting platform (Render, Fly.io, AWS, etc.)
- [ ] Set up environment variables
- [ ] Configure production database (if needed)
- [ ] Set up logging/monitoring
- [ ] Configure HTTPS/SSL
- [ ] Set up domain name
- [ ] Configure firewall/security groups
- [ ] Enable rate limiting
- [ ] Add authentication (API keys/JWT)

### 3. Monitoring Setup
- [ ] Set up application logging
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up performance monitoring
- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring

---

## ✅ Documentation Review

### Before Going Live
- [ ] Read `README.md` thoroughly
- [ ] Review `SETUP.md` for installation details
- [ ] Check `API.md` for endpoint documentation
- [ ] Review `ARCHITECTURE.md` for system design
- [ ] Read `PROJECT_SUMMARY.md` for overview
- [ ] Understand scoring methodology
- [ ] Review example code in `example_client.py`
- [ ] Run through quick test with `test_quick.py`

---

## ✅ Common Issues Checklist

### If API won't start:
- [ ] Virtual environment activated?
- [ ] All dependencies installed? (`pip install -r requirements.txt`)
- [ ] spaCy model downloaded? (`python -m spacy download en_core_web_md`)
- [ ] Port 8000 already in use?
- [ ] Check logs for error messages

### If parsing fails:
- [ ] File type supported? (PDF or DOCX only)
- [ ] File readable and not corrupted?
- [ ] File size within limits? (default 10MB)
- [ ] File contains actual text? (not scanned image)

### If tests fail:
- [ ] In correct directory?
- [ ] Virtual environment activated?
- [ ] All dependencies installed?
- [ ] pytest installed? (`pip install pytest`)

### If Docker fails:
- [ ] Docker daemon running?
- [ ] Port 8000 available?
- [ ] Enough disk space?
- [ ] Correct Dockerfile syntax?

---

## ✅ Success Indicators

You know everything is working when:
- [ ] ✅ API starts without errors
- [ ] ✅ http://localhost:8000/docs loads successfully
- [ ] ✅ Health check returns `{"status": "healthy"}`
- [ ] ✅ Can upload and parse a PDF resume
- [ ] ✅ Can upload and parse a DOCX resume
- [ ] ✅ Parsed resume contains expected fields (name, contact, experience)
- [ ] ✅ Scoring returns values between 0-100
- [ ] ✅ Scoring includes actionable comments
- [ ] ✅ All unit tests pass
- [ ] ✅ Example client works with test resumes

---

## 🎯 Next Steps After Setup

Once everything is checked off:

1. **Test with Real Resumes**
   - Upload various resume formats
   - Note any parsing issues
   - Iterate on dictionaries and logic

2. **Customize for Your Use Case**
   - Add industry-specific skills
   - Adjust scoring weights
   - Add custom section types

3. **Integrate with Your Application**
   - Build frontend interface
   - Connect to your database
   - Add authentication

4. **Deploy to Production**
   - Choose hosting provider
   - Set up CI/CD pipeline
   - Configure monitoring

5. **Monitor and Improve**
   - Track API usage
   - Collect user feedback
   - Continuously improve parsing accuracy

---

## 📞 Getting Help

If you're stuck:
1. ✅ Check the documentation files
2. ✅ Review the test files for examples
3. ✅ Check the interactive API docs at `/docs`
4. ✅ Review error messages carefully
5. ✅ Search for similar issues in the code

**You're ready to start parsing resumes! 🚀**
