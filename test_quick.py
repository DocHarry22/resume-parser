"""
Quick test script to verify the resume parser is working.

Run this after installation to test the core functionality.
"""

from app.models.resume_models import (
    Resume, ContactInfo, ExperienceItem, 
    EducationItem, SkillItem
)
from app.services.scoring_service import ScoringService


def create_sample_resume() -> Resume:
    """Create a sample resume for testing."""
    
    return Resume(
        name="Jane Smith",
        contact=ContactInfo(
            email="jane.smith@email.com",
            phone="+27 123 456 789",
            linkedin="linkedin.com/in/janesmith",
            location="Johannesburg, South Africa"
        ),
        summary=(
            "Results-driven Senior Software Engineer with 6+ years of experience "
            "in full-stack web development. Specialized in Python, React, and cloud "
            "technologies. Proven track record of delivering scalable solutions for "
            "fintech and e-commerce platforms."
        ),
        experience=[
            ExperienceItem(
                job_title="Senior Software Engineer",
                company="TechCorp Africa",
                location="Johannesburg, SA",
                start_date="Jan 2021",
                end_date=None,
                is_current=True,
                bullets=[
                    "Led development of microservices architecture serving 2M+ users across Africa",
                    "Improved API response time by 45% through caching and optimization",
                    "Mentored team of 6 junior developers, improving code quality by 30%",
                    "Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes",
                    "Architected payment integration supporting mobile money (M-Pesa, Airtel Money)"
                ],
                raw_text="Senior Software Engineer at TechCorp Africa"
            ),
            ExperienceItem(
                job_title="Software Engineer",
                company="Digital Solutions Ltd",
                location="Cape Town, SA",
                start_date="Jun 2018",
                end_date="Dec 2020",
                is_current=False,
                bullets=[
                    "Built RESTful APIs using Python/FastAPI serving 500K+ daily requests",
                    "Developed React-based admin dashboard for e-commerce platform",
                    "Reduced server costs by 35% through AWS optimization",
                    "Implemented real-time inventory system using WebSockets"
                ],
                raw_text="Software Engineer at Digital Solutions"
            ),
            ExperienceItem(
                job_title="Junior Developer",
                company="StartupXYZ",
                location="Durban, SA",
                start_date="Jan 2017",
                end_date="May 2018",
                is_current=False,
                bullets=[
                    "Developed and maintained company website using Django",
                    "Created automated testing suite with 85% code coverage",
                    "Participated in agile sprints and daily stand-ups"
                ],
                raw_text="Junior Developer at StartupXYZ"
            )
        ],
        education=[
            EducationItem(
                degree="BSc",
                field_of_study="Computer Science",
                institution="University of Cape Town",
                graduation_year="2016",
                gpa="3.7",
                honors="Cum Laude",
                raw_text="BSc Computer Science, UCT, 2016"
            )
        ],
        skills=[
            SkillItem(name="Python", category="programming_languages", normalized_name="python"),
            SkillItem(name="JavaScript", category="programming_languages", normalized_name="javascript"),
            SkillItem(name="TypeScript", category="programming_languages", normalized_name="typescript"),
            SkillItem(name="React", category="web_development", normalized_name="react"),
            SkillItem(name="Next.js", category="web_development", normalized_name="next.js"),
            SkillItem(name="FastAPI", category="web_development", normalized_name="fastapi"),
            SkillItem(name="Django", category="web_development", normalized_name="django"),
            SkillItem(name="PostgreSQL", category="databases", normalized_name="postgresql"),
            SkillItem(name="MongoDB", category="databases", normalized_name="mongodb"),
            SkillItem(name="Redis", category="databases", normalized_name="redis"),
            SkillItem(name="AWS", category="cloud_devops", normalized_name="aws"),
            SkillItem(name="Docker", category="cloud_devops", normalized_name="docker"),
            SkillItem(name="Kubernetes", category="cloud_devops", normalized_name="kubernetes"),
            SkillItem(name="Git", category="general_tech", normalized_name="git"),
            SkillItem(name="Agile/Scrum", category="general_tech", normalized_name="agile"),
        ],
        projects=[],
        certifications=[],
        languages=["English", "Afrikaans"],
        raw_text=(
            "Jane Smith. Senior Software Engineer with expertise in Python and React. "
            "Contact: jane.smith@email.com. 6 years of experience in full-stack development."
        )
    )


def test_scoring():
    """Test the scoring engine."""
    print("=" * 60)
    print("RESUME PARSER - QUICK TEST")
    print("=" * 60)
    print()
    
    # Create sample resume
    print("📄 Creating sample resume...")
    resume = create_sample_resume()
    print(f"✓ Resume created for: {resume.name}")
    print(f"  - Experience items: {len(resume.experience)}")
    print(f"  - Education items: {len(resume.education)}")
    print(f"  - Skills: {len(resume.skills)}")
    print()
    
    # Score the resume
    print("🔍 Scoring resume...")
    scoring_service = ScoringService()
    score = scoring_service.score_resume(resume)
    print("✓ Scoring complete!")
    print()
    
    # Display results
    print("=" * 60)
    print("SCORING RESULTS")
    print("=" * 60)
    print()
    print(f"🎯 Overall Score: {score.overall}/100")
    print()
    
    print("📊 Detailed Metrics:")
    print(f"  • Readability:  {score.readability.readability_score}/100")
    print(f"    - Flesch Reading Ease: {score.readability.flesch_reading_ease}")
    print(f"    - Grade Level: {score.readability.flesch_kincaid_grade}")
    print()
    
    print(f"  • Structure:    {score.structure.structure_score}/100")
    print(f"    - Has contact: {score.structure.has_contact}")
    print(f"    - Has experience: {score.structure.has_experience}")
    print(f"    - Has education: {score.structure.has_education}")
    print(f"    - Has skills: {score.structure.has_skills}")
    print()
    
    print(f"  • Experience:   {score.experience.experience_score}/100")
    print(f"    - Total roles: {score.experience.total_roles}")
    print(f"    - Avg bullets/role: {score.experience.avg_bullets_per_role}")
    print(f"    - Quantified achievements: {score.experience.quantified_achievements}")
    print(f"    - Quantification rate: {score.experience.quantification_rate}%")
    print()
    
    print(f"  • Skills:       {score.skills.skills_score}/100")
    print(f"    - Total skills: {score.skills.total_skills}")
    print(f"    - Categorized: {score.skills.categorized_skills}")
    print(f"    - Categories: {score.skills.unique_categories}")
    print()
    
    print(f"  • Length:       {score.length.length_score}/100")
    print(f"    - Word count: {score.length.word_count}")
    print(f"    - Estimated pages: {score.length.estimated_pages}")
    print()
    
    print("💡 Improvement Suggestions:")
    for i, comment in enumerate(score.comments, 1):
        print(f"  {i}. {comment}")
    print()
    
    print("=" * 60)
    print("✅ TEST COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Start the API server: uvicorn app.main:app --reload")
    print("2. Visit http://localhost:8000/docs")
    print("3. Upload a real resume PDF or DOCX file")
    print()


if __name__ == "__main__":
    try:
        test_scoring()
    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("Make sure you have:")
        print("1. Installed all dependencies: pip install -r requirements.txt")
        print("2. Downloaded spaCy model: python -m spacy download en_core_web_md")
        import traceback
        traceback.print_exc()
