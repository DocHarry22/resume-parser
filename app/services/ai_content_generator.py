"""AI Content Generator for Cover Letters."""

from typing import List, Dict
import logging
from app.models.cover_letter_models import CoverLetterTone

logger = logging.getLogger(__name__)


# Template-based content generation (can be enhanced with actual AI/LLM integration)
OPENING_TEMPLATES = {
    CoverLetterTone.PROFESSIONAL: [
        "I am writing to express my strong interest in the {job_title} position at {company}. With my background in {experience_area}, I am confident I can contribute effectively to your team.",
        "I was excited to discover the {job_title} opening at {company}. My {years} years of experience in {experience_area} have prepared me well for this opportunity.",
        "Please accept this letter as my application for the {job_title} role at {company}. I bring a proven track record of {achievement_area} that aligns perfectly with your requirements.",
    ],
    CoverLetterTone.ENTHUSIASTIC: [
        "I am thrilled to apply for the {job_title} position at {company}! The opportunity to bring my {experience_area} expertise to your innovative team is incredibly exciting.",
        "When I saw the {job_title} opening at {company}, I knew immediately that this was the perfect match for my skills and passion. I am eager to contribute to your mission!",
        "I can hardly contain my excitement about the {job_title} opportunity at {company}! My experience in {experience_area} has prepared me to make an immediate impact on your team.",
    ],
    CoverLetterTone.CONFIDENT: [
        "I am the ideal candidate for the {job_title} position at {company}. My extensive experience in {experience_area} and proven track record make me uniquely qualified for this role.",
        "With my strong background in {experience_area}, I am confident I am the right choice for your {job_title} position at {company}.",
        "I am writing to present my qualifications for the {job_title} role at {company}. My demonstrated expertise in {experience_area} positions me to excel in this position.",
    ],
    CoverLetterTone.FRIENDLY: [
        "I hope this letter finds you well! I'm reaching out about the {job_title} position at {company}, and I'd love to share how my background in {experience_area} could benefit your team.",
        "Hi there! I came across the {job_title} opening at {company} and felt compelled to apply. My experience in {experience_area} seems like a great fit for what you're looking for.",
        "I'm excited to connect with you regarding the {job_title} opportunity at {company}. I believe my {experience_area} background would make me a valuable addition to your team.",
    ],
    CoverLetterTone.FORMAL: [
        "Dear Hiring Committee, I respectfully submit my application for the {job_title} position at {company}. My qualifications in {experience_area} align precisely with the requirements outlined in your posting.",
        "I hereby submit my candidacy for the position of {job_title} at {company}. My professional background in {experience_area} has prepared me comprehensively for this role.",
        "It is with great respect that I present my application for the {job_title} vacancy at {company}. My credentials in {experience_area} make me a suitable candidate for your consideration.",
    ],
}

BODY_TEMPLATES = {
    "experience": [
        "In my current role at {previous_company}, I have successfully {achievement}. This experience has equipped me with the skills necessary to {benefit}.",
        "Throughout my career, I have developed expertise in {skill_area}. At {previous_company}, I {achievement}, which demonstrates my ability to {benefit}.",
        "My professional journey has given me extensive experience in {skill_area}. Most recently, I {achievement}, resulting in {result}.",
    ],
    "skills": [
        "I bring strong skills in {skills_list}, which directly align with the requirements for this position. I have applied these skills to {application}.",
        "My technical proficiency includes {skills_list}. I have leveraged these capabilities to {achievement}, and I am eager to bring this expertise to {company}.",
        "Key competencies I offer include {skills_list}. These skills have enabled me to {achievement} and will allow me to contribute immediately to your team.",
    ],
    "value": [
        "What sets me apart is my ability to {unique_value}. I am committed to bringing this same dedication to {company}.",
        "Beyond my technical skills, I offer {unique_value}. I believe this combination makes me an excellent fit for your team culture.",
        "I am particularly drawn to {company} because of {company_value}. My experience with {experience_area} would allow me to contribute to this vision.",
    ],
}

CLOSING_TEMPLATES = {
    CoverLetterTone.PROFESSIONAL: [
        "I would welcome the opportunity to discuss how my background, skills, and enthusiasm would benefit {company}. Thank you for considering my application. I look forward to hearing from you.",
        "Thank you for considering my application. I am excited about the possibility of contributing to {company} and would appreciate the opportunity to discuss my qualifications in more detail.",
        "I am confident that my skills and experience make me a strong candidate for this position. I look forward to the opportunity to discuss how I can contribute to {company}'s continued success.",
    ],
    CoverLetterTone.ENTHUSIASTIC: [
        "I am genuinely excited about the possibility of joining {company}! I would love the chance to discuss how I can bring energy and results to your team. Thank you so much for your consideration!",
        "I cannot wait to bring my passion and skills to {company}! Please don't hesitate to reach out – I'm eager to discuss this exciting opportunity with you!",
        "Thank you for this amazing opportunity! I am thrilled at the prospect of contributing to {company} and look forward to connecting with you soon!",
    ],
    CoverLetterTone.CONFIDENT: [
        "I am ready to bring my proven expertise to {company}. I welcome the opportunity to demonstrate how I can add immediate value to your team. I look forward to our conversation.",
        "I am prepared to make a significant impact at {company}. Please contact me at your earliest convenience to discuss how I can contribute to your success.",
        "I am certain that my qualifications will prove valuable to {company}. I look forward to discussing this opportunity and demonstrating what I can bring to your organization.",
    ],
    CoverLetterTone.FRIENDLY: [
        "I'd really love the chance to chat more about this opportunity and learn more about the team at {company}. Thanks so much for taking the time to read my application!",
        "I hope we get the chance to connect soon! I'm looking forward to learning more about {company} and how I might fit in. Thanks for considering me!",
        "Thanks for reading! I'm really excited about this opportunity and would love to hear from you. Feel free to reach out anytime – I'm happy to chat!",
    ],
    CoverLetterTone.FORMAL: [
        "I respectfully request the opportunity to discuss my qualifications in greater detail. Thank you for your time and consideration. I await your response at your earliest convenience.",
        "I would be honored to further discuss my candidacy for this position. Please find my contact information above. Thank you for your consideration.",
        "I trust that my qualifications merit your consideration. I remain available for an interview at your convenience and thank you for reviewing my application.",
    ],
}

TIPS = {
    "opening": [
        "Start with a strong hook that grabs attention",
        "Mention the specific job title and company name",
        "Show you've researched the company",
        "Keep it concise - 2-3 sentences maximum",
    ],
    "body": [
        "Focus on your most relevant experience",
        "Use specific numbers and achievements",
        "Connect your experience to the job requirements",
        "Highlight key skills that match the job description",
        "Provide concrete examples of using these skills",
        "Demonstrate results and impact",
    ],
    "closing": [
        "Include a clear call to action",
        "Express enthusiasm for the opportunity",
        "Thank them for their time",
        "Keep it brief - 2-3 sentences",
    ],
}


async def generate_cover_letter_content(
    section: str,
    job_title: str,
    job_description: str = "",
    company_name: str = "",
    experience_summary: str = "",
    skills: List[str] = None,
    tone: CoverLetterTone = CoverLetterTone.PROFESSIONAL,
) -> Dict:
    """
    Generate AI-powered content suggestions for cover letter sections.
    
    This uses template-based generation. For production, integrate with
    OpenAI, Claude, or other LLM APIs for more personalized content.
    """
    skills = skills or []
    suggestions = []
    
    # Prepare template variables
    template_vars = {
        "job_title": job_title or "this position",
        "company": company_name or "your company",
        "experience_area": experience_summary or "my field",
        "skills_list": ", ".join(skills[:3]) if skills else "relevant technical skills",
        "years": "5+",  # Could be extracted from resume
        "achievement": "delivered impactful results",
        "achievement_area": "driving results",
        "benefit": "drive similar success for your team",
        "result": "measurable improvements",
        "previous_company": "my previous role",
        "skill_area": experience_summary or "my domain",
        "unique_value": "combining technical expertise with strong communication",
        "application": "deliver successful projects",
        "company_value": "your commitment to innovation",
    }
    
    # Extract keywords from job description for more relevant suggestions
    keywords = []
    if job_description:
        # Simple keyword extraction
        keywords = extract_keywords(job_description)
        if keywords:
            template_vars["experience_area"] = keywords[0] if keywords else template_vars["experience_area"]
            template_vars["skill_area"] = keywords[0] if len(keywords) > 0 else template_vars["skill_area"]
    
    # Generate suggestions based on section
    if section == "opening":
        templates = OPENING_TEMPLATES.get(tone, OPENING_TEMPLATES[CoverLetterTone.PROFESSIONAL])
        for template in templates:
            try:
                suggestion = template.format(**template_vars)
                suggestions.append(suggestion)
            except KeyError:
                suggestions.append(template)
                
    elif section == "body":
        # Combine body templates for the body section
        all_body_templates = (
            BODY_TEMPLATES["experience"] + 
            BODY_TEMPLATES["skills"] + 
            BODY_TEMPLATES["value"]
        )
        for template in all_body_templates:
            try:
                suggestion = template.format(**template_vars)
                suggestions.append(suggestion)
            except KeyError:
                suggestions.append(template)
                
    elif section == "closing":
        templates = CLOSING_TEMPLATES.get(tone, CLOSING_TEMPLATES[CoverLetterTone.PROFESSIONAL])
        for template in templates:
            try:
                suggestion = template.format(**template_vars)
                suggestions.append(suggestion)
            except KeyError:
                suggestions.append(template)
    
    # Get tips for this section
    tips = TIPS.get(section, [])
    
    return {
        "suggestions": suggestions,
        "tips": tips,
        "keywords": keywords,
    }


def extract_keywords(text: str) -> List[str]:
    """Extract relevant keywords from job description."""
    # Simple keyword extraction - in production, use NLP
    common_words = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
        "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "must", "shall", "can", "need", "dare", "ought",
        "used", "we", "you", "they", "he", "she", "it", "i", "who", "which", "that",
        "this", "these", "those", "am", "being", "having", "our", "your", "their",
    }
    
    words = text.lower().split()
    keywords = []
    
    for word in words:
        # Clean the word
        clean_word = ''.join(c for c in word if c.isalnum())
        if clean_word and len(clean_word) > 3 and clean_word not in common_words:
            if clean_word not in keywords:
                keywords.append(clean_word)
                if len(keywords) >= 10:
                    break
    
    return keywords
