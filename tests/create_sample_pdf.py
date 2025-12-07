"""
Helper script to create a sample resume PDF for testing.
Run this to generate tests/resources/sample_resume.pdf

Usage:
    python tests/create_sample_pdf.py
"""

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import inch
except ImportError:
    print("❌ reportlab not installed. Install it with: pip install reportlab")
    exit(1)

import os
from pathlib import Path


def create_sample_resume_pdf():
    """Create a simple sample resume PDF for testing."""
    
    # Ensure resources directory exists
    resources_dir = Path(__file__).parent / "resources"
    resources_dir.mkdir(exist_ok=True)
    
    output_path = resources_dir / "sample_resume.pdf"
    
    # Create PDF
    c = canvas.Canvas(str(output_path), pagesize=letter)
    width, height = letter
    
    # Title
    c.setFont("Helvetica-Bold", 20)
    c.drawString(1*inch, height - 1*inch, "JOHN DOE")
    
    # Contact Info
    c.setFont("Helvetica", 10)
    c.drawString(1*inch, height - 1.3*inch, "Email: john.doe@example.com | Phone: +1-555-123-4567")
    c.drawString(1*inch, height - 1.5*inch, "LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe")
    
    # Section: Professional Summary
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1*inch, height - 2*inch, "PROFESSIONAL SUMMARY")
    c.setFont("Helvetica", 10)
    summary = "Experienced software engineer with 5+ years in full-stack development."
    c.drawString(1*inch, height - 2.3*inch, summary)
    
    # Section: Experience
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1*inch, height - 3*inch, "WORK EXPERIENCE")
    
    c.setFont("Helvetica-Bold", 11)
    c.drawString(1*inch, height - 3.3*inch, "Senior Software Engineer | TechCorp Inc.")
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(1*inch, height - 3.5*inch, "Jan 2020 - Present | San Francisco, CA")
    c.setFont("Helvetica", 10)
    c.drawString(1.2*inch, height - 3.8*inch, "• Led development of microservices architecture serving 1M+ users")
    c.drawString(1.2*inch, height - 4.0*inch, "• Improved system performance by 40% through optimization")
    c.drawString(1.2*inch, height - 4.2*inch, "• Mentored team of 5 junior engineers")
    
    c.setFont("Helvetica-Bold", 11)
    c.drawString(1*inch, height - 4.8*inch, "Software Engineer | StartupXYZ")
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(1*inch, height - 5.0*inch, "Jun 2018 - Dec 2019 | Remote")
    c.setFont("Helvetica", 10)
    c.drawString(1.2*inch, height - 5.3*inch, "• Built RESTful APIs with Python and FastAPI")
    c.drawString(1.2*inch, height - 5.5*inch, "• Implemented CI/CD pipeline reducing deployment time by 60%")
    
    # Section: Education
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1*inch, height - 6.2*inch, "EDUCATION")
    c.setFont("Helvetica-Bold", 11)
    c.drawString(1*inch, height - 6.5*inch, "Bachelor of Science in Computer Science")
    c.setFont("Helvetica", 10)
    c.drawString(1*inch, height - 6.7*inch, "University of Technology | Graduated: May 2018 | GPA: 3.8/4.0")
    
    # Section: Skills
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1*inch, height - 7.4*inch, "TECHNICAL SKILLS")
    c.setFont("Helvetica", 10)
    c.drawString(1*inch, height - 7.7*inch, "Languages: Python, JavaScript, TypeScript, Java, SQL")
    c.drawString(1*inch, height - 7.9*inch, "Frameworks: React, FastAPI, Django, Node.js, Express")
    c.drawString(1*inch, height - 8.1*inch, "Tools: Docker, Kubernetes, AWS, PostgreSQL, Redis, Git")
    
    # Section: Projects
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1*inch, height - 8.8*inch, "PROJECTS")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(1*inch, height - 9.1*inch, "Resume Parser API")
    c.setFont("Helvetica", 10)
    c.drawString(1.2*inch, height - 9.3*inch, "• Built automated resume parsing system with NLP")
    c.drawString(1.2*inch, height - 9.5*inch, "• Achieved 95% accuracy in extracting structured data")
    
    # Page number (for testing filtering)
    c.setFont("Helvetica", 8)
    c.drawCentredString(width/2, 0.5*inch, "1")
    
    c.save()
    
    print(f"✅ Created sample resume PDF: {output_path}")
    print(f"   File size: {output_path.stat().st_size} bytes")
    print(f"\n📝 You can now run: pytest tests/test_pdf_reader.py -v")


if __name__ == "__main__":
    create_sample_resume_pdf()
