"""
Sample API client for the Resume Parser service.

This script demonstrates how to interact with the API programmatically.
"""

import requests
import json
from pathlib import Path
from typing import Optional


class ResumeParserClient:
    """Client for Resume Parser API."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Initialize the client.
        
        Args:
            base_url: Base URL of the API (default: http://localhost:8000)
        """
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
    
    def health_check(self) -> dict:
        """Check if the API is running."""
        response = requests.get(f"{self.api_url}/health")
        response.raise_for_status()
        return response.json()
    
    def parse_resume(self, file_path: str) -> dict:
        """
        Parse a resume file.
        
        Args:
            file_path: Path to resume file (PDF or DOCX)
            
        Returns:
            Parsed resume data
        """
        with open(file_path, 'rb') as f:
            files = {'file': (Path(file_path).name, f)}
            response = requests.post(f"{self.api_url}/parse-resume", files=files)
            response.raise_for_status()
            return response.json()
    
    def score_resume(self, file_path: str) -> dict:
        """
        Score a resume file.
        
        Args:
            file_path: Path to resume file (PDF or DOCX)
            
        Returns:
            Resume score data
        """
        with open(file_path, 'rb') as f:
            files = {'file': (Path(file_path).name, f)}
            response = requests.post(f"{self.api_url}/score-resume", files=files)
            response.raise_for_status()
            return response.json()
    
    def parse_and_score(self, file_path: str) -> dict:
        """
        Parse and score a resume file in one request.
        
        Args:
            file_path: Path to resume file (PDF or DOCX)
            
        Returns:
            Combined resume and score data
        """
        with open(file_path, 'rb') as f:
            files = {'file': (Path(file_path).name, f)}
            response = requests.post(f"{self.api_url}/parse-and-score", files=files)
            response.raise_for_status()
            return response.json()


def print_resume_summary(data: dict):
    """Print a summary of parsed resume."""
    resume = data.get('resume', data)
    
    print("\n" + "=" * 60)
    print("RESUME SUMMARY")
    print("=" * 60)
    
    print(f"\n📋 Name: {resume.get('name', 'N/A')}")
    
    contact = resume.get('contact', {})
    print(f"📧 Email: {contact.get('email', 'N/A')}")
    print(f"📱 Phone: {contact.get('phone', 'N/A')}")
    print(f"🔗 LinkedIn: {contact.get('linkedin', 'N/A')}")
    
    print(f"\n💼 Experience: {len(resume.get('experience', []))} roles")
    for i, exp in enumerate(resume.get('experience', [])[:3], 1):
        print(f"   {i}. {exp.get('job_title', 'N/A')} at {exp.get('company', 'N/A')}")
    
    print(f"\n🎓 Education: {len(resume.get('education', []))} entries")
    for i, edu in enumerate(resume.get('education', []), 1):
        print(f"   {i}. {edu.get('degree', 'N/A')} - {edu.get('institution', 'N/A')}")
    
    skills = resume.get('skills', [])
    print(f"\n🛠️  Skills: {len(skills)} total")
    if skills:
        skill_names = [s.get('name', s) for s in skills[:10]]
        print(f"   Top 10: {', '.join(skill_names)}")


def print_score_summary(data: dict):
    """Print a summary of resume score."""
    score = data.get('score', data)
    
    print("\n" + "=" * 60)
    print("SCORING RESULTS")
    print("=" * 60)
    
    overall = score.get('overall', 0)
    print(f"\n🎯 Overall Score: {overall}/100")
    
    # Grade the score
    if overall >= 85:
        grade = "A - Excellent"
        emoji = "🌟"
    elif overall >= 70:
        grade = "B - Good"
        emoji = "✅"
    elif overall >= 50:
        grade = "C - Needs Improvement"
        emoji = "⚠️"
    else:
        grade = "D - Significant Issues"
        emoji = "❌"
    
    print(f"{emoji} Grade: {grade}")
    
    # Detailed metrics
    print("\n📊 Detailed Breakdown:")
    
    readability = score.get('readability', {})
    print(f"   • Readability:  {readability.get('readability_score', 0):.1f}/100")
    
    structure = score.get('structure', {})
    print(f"   • Structure:    {structure.get('structure_score', 0):.1f}/100")
    
    experience = score.get('experience', {})
    print(f"   • Experience:   {experience.get('experience_score', 0):.1f}/100")
    
    skills = score.get('skills', {})
    print(f"   • Skills:       {skills.get('skills_score', 0):.1f}/100")
    
    length = score.get('length', {})
    print(f"   • Length:       {length.get('length_score', 0):.1f}/100")
    
    # Comments
    comments = score.get('comments', [])
    if comments:
        print("\n💡 Suggestions for Improvement:")
        for i, comment in enumerate(comments, 1):
            print(f"   {i}. {comment}")


def main():
    """Main function - example usage."""
    import sys
    
    print("Resume Parser API Client")
    print("=" * 60)
    
    # Initialize client
    client = ResumeParserClient()
    
    # Check if API is running
    print("\n🔍 Checking API health...")
    try:
        health = client.health_check()
        print(f"✅ API is running: {health}")
    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to API")
        print("   Make sure the API is running: uvicorn app.main:app --reload")
        return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Check if file path provided
    if len(sys.argv) < 2:
        print("\n⚠️  No resume file provided")
        print("\nUsage:")
        print("  python example_client.py <path-to-resume.pdf>")
        print("\nExample:")
        print("  python example_client.py resume.pdf")
        print("  python example_client.py C:\\Users\\user\\Documents\\resume.docx")
        return
    
    file_path = sys.argv[1]
    
    # Check if file exists
    if not Path(file_path).exists():
        print(f"❌ Error: File not found: {file_path}")
        return
    
    print(f"\n📄 Processing: {file_path}")
    
    try:
        # Parse and score the resume
        print("\n⏳ Parsing and scoring resume...")
        result = client.parse_and_score(file_path)
        
        # Display results
        print_resume_summary(result)
        print_score_summary(result)
        
        # Optional: Save results to JSON
        output_file = Path(file_path).stem + "_analysis.json"
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\n💾 Full results saved to: {output_file}")
        
        print("\n✅ Analysis complete!")
        
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        print(f"   Response: {e.response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()
