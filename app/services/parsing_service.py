"""Resume parsing service for section detection and entity extraction."""

import re
import json
from pathlib import Path
from typing import Optional, List, Dict, Tuple
from fastapi import UploadFile

from app.models.resume_models import (
    RawDocument, ResumeRawSections, SectionType,
    Resume, ContactInfo, ExperienceItem, EducationItem,
    SkillItem, ProjectItem, CertificationItem
)
from app.utils.pdf_reader import PDFReader
from app.utils.docx_reader import DOCXReader
from app.utils.text_cleaner import normalize_whitespace, extract_bullet_points
from app.services.nlp_service import get_nlp_service
from app.core.config import settings


class ParsingService:
    """Service for parsing resumes and extracting structured information."""
    
    def __init__(self):
        """Initialize parsing service."""
        self.pdf_reader = PDFReader()
        self.docx_reader = DOCXReader()
        self.nlp_service = get_nlp_service()
        
        # Load dictionaries
        self._load_dictionaries()
    
    def _load_dictionaries(self):
        """Load section headings and skills taxonomy from JSON files."""
        data_dir = Path(settings.data_dir)
        
        # Load section headings
        headings_file = data_dir / "section_headings.json"
        with open(headings_file, 'r') as f:
            self.section_headings = json.load(f)
        
        # Load skills taxonomy
        skills_file = data_dir / "skills_taxonomy.json"
        with open(skills_file, 'r') as f:
            self.skills_taxonomy = json.load(f)
        
        # Create reverse mapping: skill -> category
        self.skill_to_category = {}
        for category, skills in self.skills_taxonomy.items():
            for skill in skills:
                self.skill_to_category[skill.lower()] = category
    
    async def load_document(self, file: UploadFile) -> RawDocument:
        """
        Load a document from uploaded file.
        
        Args:
            file: Uploaded file (PDF or DOCX)
        
        Returns:
            RawDocument with extracted text
        """
        # Read file content
        content = await file.read()
        
        # Determine file type
        filename = file.filename.lower()
        
        if filename.endswith('.pdf'):
            result = self.pdf_reader.read(content)
        elif filename.endswith('.docx'):
            result = self.docx_reader.read(content)
        else:
            raise ValueError(f"Unsupported file type: {filename}")
        
        return RawDocument(
            full_text=result['full_text'],
            blocks=result['blocks'],
            page_count=result.get('page_count')
        )
    
    def detect_sections(self, document: RawDocument) -> ResumeRawSections:
        """
        Detect sections in the resume.
        
        Args:
            document: Raw document with text blocks
        
        Returns:
            Resume sections organized by type
        """
        sections: Dict[SectionType, List[str]] = {}
        current_section: Optional[SectionType] = None
        
        for block in document.blocks:
            # Check if this block is a section heading
            detected_section = self._detect_section_heading(block)
            
            if detected_section:
                current_section = detected_section
                if current_section not in sections:
                    sections[current_section] = []
            elif current_section:
                # Add block to current section
                sections[current_section].append(block)
        
        return ResumeRawSections(sections=sections)
    
    def _detect_section_heading(self, text: str) -> Optional[SectionType]:
        """
        Detect if a text block is a section heading.
        
        Args:
            text: Text block to check
        
        Returns:
            Section type if detected, None otherwise
        """
        # Normalize text for matching
        normalized = text.lower().strip()
        normalized = re.sub(r'[^\w\s]', '', normalized)  # Remove punctuation
        
        # Check against known headings
        for section_key, synonyms in self.section_headings.items():
            for synonym in synonyms:
                if normalized == synonym or normalized == synonym.replace(' ', ''):
                    # Map to SectionType enum
                    try:
                        return SectionType(section_key)
                    except ValueError:
                        return SectionType.OTHER
        
        return None
    
    def parse_resume(self, document: RawDocument) -> Resume:
        """
        Parse a resume document into structured data.
        
        Args:
            document: Raw document
        
        Returns:
            Structured Resume object
        """
        # Detect sections
        sections = self.detect_sections(document)
        
        # Extract contact info and name
        contact = self._extract_contact_info(document.full_text)
        name = self._extract_name(document.full_text)
        
        # Extract summary
        summary = self._extract_summary(sections)
        
        # Extract experience
        experience = self._extract_experience(sections)
        
        # Extract education
        education = self._extract_education(sections)
        
        # Extract skills
        skills = self._extract_skills(sections)
        
        # Extract projects
        projects = self._extract_projects(sections)
        
        # Extract certifications
        certifications = self._extract_certifications(sections)
        
        # Extract languages
        languages = self._extract_languages(sections)
        
        return Resume(
            name=name,
            contact=contact,
            summary=summary,
            experience=experience,
            education=education,
            skills=skills,
            projects=projects,
            certifications=certifications,
            languages=languages,
            raw_text=document.full_text
        )
    
    def _extract_contact_info(self, text: str) -> ContactInfo:
        """Extract contact information from resume text."""
        # Email regex
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        email = emails[0] if emails else None
        
        # Phone regex (international formats)
        phone_pattern = r'[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}'
        phones = re.findall(phone_pattern, text)
        # Filter out likely false positives (too short)
        phones = [p for p in phones if len(re.sub(r'[^\d]', '', p)) >= 9]
        phone = phones[0] if phones else None
        
        # LinkedIn URL
        linkedin_pattern = r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w-]+'
        linkedin_matches = re.findall(linkedin_pattern, text, re.IGNORECASE)
        linkedin = linkedin_matches[0] if linkedin_matches else None
        
        # GitHub URL
        github_pattern = r'(?:https?://)?(?:www\.)?github\.com/[\w-]+'
        github_matches = re.findall(github_pattern, text, re.IGNORECASE)
        github = github_matches[0] if github_matches else None
        
        # Website URL (generic)
        website_pattern = r'(?:https?://)?(?:www\.)?[\w-]+\.[\w.]+/?\S*'
        website_matches = re.findall(website_pattern, text)
        # Exclude LinkedIn/GitHub from generic website
        website = None
        for url in website_matches:
            if 'linkedin' not in url.lower() and 'github' not in url.lower():
                website = url
                break
        
        return ContactInfo(
            email=email,
            phone=phone,
            linkedin=linkedin,
            github=github,
            website=website
        )
    
    def _extract_name(self, text: str) -> Optional[str]:
        """Extract candidate name from resume."""
        # Use NER to find PERSON entities in the first few lines
        first_lines = '\n'.join(text.split('\n')[:10])
        persons = self.nlp_service.extract_persons(first_lines, limit=5)
        
        if persons:
            # Return the first person name found
            return persons[0]
        
        return None
    
    def _extract_summary(self, sections: ResumeRawSections) -> Optional[str]:
        """Extract professional summary."""
        if SectionType.SUMMARY in sections.sections:
            summary_blocks = sections.sections[SectionType.SUMMARY]
            return '\n\n'.join(summary_blocks) if summary_blocks else None
        return None
    
    def _extract_experience(self, sections: ResumeRawSections) -> List[ExperienceItem]:
        """Extract work experience entries."""
        if SectionType.EXPERIENCE not in sections.sections:
            return []
        
        experience_text = sections.sections[SectionType.EXPERIENCE]
        experience_items = []
        
        # Join blocks and split by double newlines or strong separators
        full_experience = '\n\n'.join(experience_text)
        
        # Split into individual role blocks
        role_blocks = self._split_experience_blocks(full_experience)
        
        for block in role_blocks:
            item = self._parse_experience_block(block)
            if item:
                experience_items.append(item)
        
        return experience_items
    
    def _split_experience_blocks(self, text: str) -> List[str]:
        """Split experience text into individual role blocks."""
        # Split by double newlines
        blocks = re.split(r'\n\s*\n', text)
        
        # Merge blocks that are likely continuations
        merged = []
        current = []
        
        for block in blocks:
            block = block.strip()
            if not block:
                continue
            
            # Check if block starts with a date pattern (likely new role)
            if re.match(r'^\d{4}|^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', block, re.IGNORECASE):
                if current:
                    merged.append('\n\n'.join(current))
                current = [block]
            else:
                current.append(block)
        
        if current:
            merged.append('\n\n'.join(current))
        
        return merged
    
    def _parse_experience_block(self, block: str) -> Optional[ExperienceItem]:
        """Parse a single experience block."""
        lines = [line.strip() for line in block.split('\n') if line.strip()]
        
        if not lines:
            return None
        
        # Extract date range
        dates = self._extract_date_range(block)
        start_date = dates.get('start')
        end_date = dates.get('end')
        is_current = dates.get('is_current', False)
        
        # Extract organization names using NER
        orgs = self.nlp_service.extract_organizations(block, limit=3)
        company = orgs[0] if orgs else None
        
        # Infer job title (usually first line)
        job_title = lines[0] if lines else None
        
        # Extract bullet points
        bullets = extract_bullet_points(block)
        
        return ExperienceItem(
            job_title=job_title,
            company=company,
            start_date=start_date,
            end_date=end_date,
            is_current=is_current,
            bullets=bullets,
            raw_text=block
        )
    
    def _extract_date_range(self, text: str) -> Dict[str, any]:
        """Extract date range from text."""
        # Pattern: "Jan 2021 - Mar 2023", "2020 - Present", "2019-2021"
        date_range_pattern = r'(\w+\s+\d{4}|\d{4})\s*[-–—to]+\s*(\w+\s+\d{4}|\d{4}|Present|Current)'
        
        match = re.search(date_range_pattern, text, re.IGNORECASE)
        
        if match:
            start = match.group(1)
            end = match.group(2)
            is_current = end.lower() in ['present', 'current']
            
            return {
                'start': start,
                'end': end if not is_current else None,
                'is_current': is_current
            }
        
        return {}
    
    def _extract_education(self, sections: ResumeRawSections) -> List[EducationItem]:
        """Extract education entries."""
        if SectionType.EDUCATION not in sections.sections:
            return []
        
        education_text = sections.sections[SectionType.EDUCATION]
        education_items = []
        
        # Join and split into blocks
        full_education = '\n\n'.join(education_text)
        blocks = re.split(r'\n\s*\n', full_education)
        
        for block in blocks:
            item = self._parse_education_block(block)
            if item:
                education_items.append(item)
        
        return education_items
    
    def _parse_education_block(self, block: str) -> Optional[EducationItem]:
        """Parse a single education block."""
        if not block.strip():
            return None
        
        # Extract degree patterns
        degree_patterns = [
            r'\b(BSc|BEng|BA|BS|BE|BTech|Bachelor)\b',
            r'\b(MSc|MEng|MA|MS|ME|MTech|Master)\b',
            r'\b(PhD|Doctorate|Ph\.D\.)\b',
            r'\b(Diploma|Certificate|Associate)\b'
        ]
        
        degree = None
        for pattern in degree_patterns:
            match = re.search(pattern, block, re.IGNORECASE)
            if match:
                degree = match.group(0)
                break
        
        # Extract organizations (universities)
        orgs = self.nlp_service.extract_organizations(block, limit=2)
        institution = orgs[0] if orgs else None
        
        # Extract year (4-digit number)
        year_pattern = r'\b(19|20)\d{2}\b'
        years = re.findall(year_pattern, block)
        graduation_year = years[-1] if years else None  # Take the most recent
        
        # Extract GPA
        gpa_pattern = r'GPA[:\s]*(\d+\.\d+)'
        gpa_match = re.search(gpa_pattern, block, re.IGNORECASE)
        gpa = gpa_match.group(1) if gpa_match else None
        
        return EducationItem(
            degree=degree,
            institution=institution,
            graduation_year=graduation_year,
            gpa=gpa,
            raw_text=block
        )
    
    def _extract_skills(self, sections: ResumeRawSections) -> List[SkillItem]:
        """Extract and categorize skills."""
        if SectionType.SKILLS not in sections.sections:
            return []
        
        skills_text = '\n'.join(sections.sections[SectionType.SKILLS])
        
        # Split by common delimiters
        raw_skills = re.split(r'[,;|\n•·]', skills_text)
        
        skill_items = []
        seen_skills = set()
        
        for skill in raw_skills:
            skill = skill.strip()
            if not skill or len(skill) < 2:
                continue
            
            # Normalize
            normalized = skill.lower()
            
            # Avoid duplicates
            if normalized in seen_skills:
                continue
            seen_skills.add(normalized)
            
            # Find category
            category = self.skill_to_category.get(normalized)
            
            skill_items.append(SkillItem(
                name=skill,
                category=category,
                normalized_name=normalized
            ))
        
        return skill_items
    
    def _extract_projects(self, sections: ResumeRawSections) -> List[ProjectItem]:
        """Extract project entries."""
        if SectionType.PROJECTS not in sections.sections:
            return []
        
        projects_text = sections.sections[SectionType.PROJECTS]
        project_items = []
        
        # Each block is typically a project
        for block in projects_text:
            lines = [l.strip() for l in block.split('\n') if l.strip()]
            if not lines:
                continue
            
            title = lines[0]
            description = '\n'.join(lines[1:]) if len(lines) > 1 else None
            
            project_items.append(ProjectItem(
                title=title,
                description=description,
                raw_text=block
            ))
        
        return project_items
    
    def _extract_certifications(self, sections: ResumeRawSections) -> List[CertificationItem]:
        """Extract certification entries."""
        if SectionType.CERTIFICATIONS not in sections.sections:
            return []
        
        cert_text = '\n'.join(sections.sections[SectionType.CERTIFICATIONS])
        
        # Split by newlines or bullets
        cert_lines = re.split(r'\n|•', cert_text)
        
        cert_items = []
        for line in cert_lines:
            line = line.strip()
            if not line or len(line) < 5:
                continue
            
            # Try to extract issuer (text in parentheses or after dash)
            issuer_match = re.search(r'[-–—]\s*(.+)$', line)
            if issuer_match:
                issuer = issuer_match.group(1).strip()
                name = line[:issuer_match.start()].strip()
            else:
                issuer = None
                name = line
            
            cert_items.append(CertificationItem(
                name=name,
                issuer=issuer,
                raw_text=line
            ))
        
        return cert_items
    
    def _extract_languages(self, sections: ResumeRawSections) -> List[str]:
        """Extract languages."""
        if SectionType.LANGUAGES not in sections.sections:
            return []
        
        lang_text = '\n'.join(sections.sections[SectionType.LANGUAGES])
        
        # Split by common delimiters
        languages = re.split(r'[,;|\n•·]', lang_text)
        
        # Clean and filter
        languages = [lang.strip() for lang in languages if lang.strip()]
        
        return languages
