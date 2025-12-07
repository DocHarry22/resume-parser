"""
Quick API test script using the sample PDF.
Tests the /parse-and-score endpoint.
"""

import requests
from pathlib import Path

# API endpoint
API_URL = "http://127.0.0.1:8000/api/parse-and-score"

# Sample PDF path
PDF_PATH = "tests/resources/sample_resume.pdf"

def test_api():
    """Test the API with sample PDF."""
    
    if not Path(PDF_PATH).exists():
        print(f"❌ Sample PDF not found: {PDF_PATH}")
        return
    
    print(f"📤 Uploading resume to API...")
    print(f"   File: {PDF_PATH}")
    print(f"   Endpoint: {API_URL}\n")
    
    # Open and upload file
    with open(PDF_PATH, 'rb') as f:
        files = {'file': ('sample_resume.pdf', f, 'application/pdf')}
        
        try:
            response = requests.post(API_URL, files=files, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                print("✅ API Request Successful!\n")
                print("=" * 60)
                print("RESUME DATA")
                print("=" * 60)
                
                resume = data.get('resume', {})
                print(f"Name: {resume.get('name', 'N/A')}")
                
                contact = resume.get('contact', {})
                if contact:
                    print(f"Email: {contact.get('email', 'N/A')}")
                    print(f"Phone: {contact.get('phone', 'N/A')}")
                
                print(f"\nExperience Items: {len(resume.get('experience', []))}")
                print(f"Education Items: {len(resume.get('education', []))}")
                print(f"Skills: {len(resume.get('skills', []))}")
                
                if resume.get('skills'):
                    skill_names = [s['name'] for s in resume['skills'][:10]]
                    print(f"Top Skills: {', '.join(skill_names)}")
                
                print("\n" + "=" * 60)
                print("QUALITY SCORE")
                print("=" * 60)
                
                score = data.get('score', {})
                print(f"\n🎯 Overall Score: {score.get('overall', 0):.1f}/100\n")
                
                print(f"📊 Detailed Scores:")
                readability = score.get('readability', {})
                structure = score.get('structure', {})
                experience = score.get('experience', {})
                skills_data = score.get('skills', {})
                length = score.get('length', {})
                
                print(f"  • Readability:  {readability.get('readability_score', 0):.1f}/100")
                print(f"  • Structure:    {structure.get('structure_score', 0):.1f}/100")
                print(f"  • Experience:   {experience.get('experience_score', 0):.1f}/100")
                print(f"  • Skills:       {skills_data.get('skills_score', 0):.1f}/100")
                print(f"  • Length:       {length.get('length_score', 0):.1f}/100")
                
                comments = score.get('comments', [])
                if comments:
                    print(f"\n💡 Improvement Suggestions ({len(comments)}):")
                    for i, comment in enumerate(comments, 1):
                        print(f"  {i}. {comment}")
                
                print("\n" + "=" * 60)
                print("✅ END-TO-END TEST PASSED!")
                print("=" * 60)
                
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection Error: Is the API server running?")
            print("   Start it with: python -m uvicorn app.main:app --reload")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api()
