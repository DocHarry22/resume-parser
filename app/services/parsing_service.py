"""Resume parsing service for section detection and entity extraction."""

import re
import json
from pathlib import Path
from typing import Optional, List, Dict, Tuple, Any
from fastapi import UploadFile

from app.models.resume_models import (
    RawDocument, ResumeRawSections, SectionType,
    Resume, ContactInfo, ExperienceItem, EducationItem,
    SkillItem, ProjectItem, CertificationItem
)
from app.utils.pdf_reader import PDFReader
from app.utils.docx_reader import DOCXReader
from app.utils.text_cleaner import extract_bullet_points
from app.utils.pattern_matchers import (
    DateRangeMatcher,
    EmailMatcher,
    LocationMatcher,
    NameMatcher,
    PhoneMatcher,
    URLMatcher,
)
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
        self.skill_aliases = {
            "nodejs": "node.js",
            "reactjs": "react.js",
            "vuejs": "vue.js",
            "nextjs": "next.js",
            "cplusplus": "c++",
            "csharp": "c#",
            "dotnet": ".net",
        }
        for category, skills in self.skills_taxonomy.items():
            for skill in skills:
                self.skill_to_category[self._normalize_skill_token(skill)] = category

    def _normalize_skill_token(self, skill: str) -> str:
        """Normalize skill names for taxonomy matching."""
        normalized = re.sub(r'[^a-z0-9#+.]', '', skill.lower())
        return self.skill_aliases.get(normalized, normalized)

    @staticmethod
    def _is_heading_candidate(text: str) -> bool:
        """Check whether a block looks like a section heading."""
        stripped = text.strip()
        if not stripped or len(stripped) > 60:
            return False
        if "\n" in stripped:
            return False
        word_count = len(stripped.split())
        return 1 <= word_count <= 4

    @staticmethod
    def _looks_like_date_line(text: str) -> bool:
        """Detect lines that primarily contain a date or date range."""
        return DateRangeMatcher.extract(text) is not None

    @staticmethod
    def _looks_like_company_name(text: str) -> bool:
        """Heuristic for organization/institution lines."""
        keywords = (
            "inc", "llc", "ltd", "corp", "company", "technologies", "solutions",
            "university", "college", "school", "institute", "academy"
        )
        lowered = text.lower()
        return any(keyword in lowered for keyword in keywords)
    
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
            block = block.strip()
            if not block:
                continue

            # Check if this block is a section heading
            detected_section = self._detect_section_heading(block) if self._is_heading_candidate(block) else None
            
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
        normalized = re.sub(r'\s+', ' ', normalized)
        normalized = re.sub(r'\s*\(\d+\)?\s*$', '', normalized)
        normalized = re.sub(r'^[\W_]+|[\W_]+$', '', normalized)
        normalized_compact = re.sub(r'[\W_]+', '', normalized)
        
        # Check against known headings
        for section_key, synonyms in self.section_headings.items():
            for synonym in synonyms:
                synonym_normalized = synonym.lower().strip()
                synonym_compact = re.sub(r'[\W_]+', '', synonym_normalized)
                if (
                    normalized == synonym_normalized
                    or normalized_compact == synonym_compact
                    or re.fullmatch(
                        rf"{re.escape(synonym_normalized)}(?:\s*[:\-–—]\s*|\s*\(\d+\)\s*)?",
                        normalized
                    )
                ):
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
        top_text = '\n'.join(text.splitlines()[:8])
        email = EmailMatcher.extract(top_text) or EmailMatcher.extract(text)
        phone = PhoneMatcher.extract(top_text) or PhoneMatcher.extract(text)
        linkedin = URLMatcher.extract_linkedin(top_text) or URLMatcher.extract_linkedin(text)
        github = URLMatcher.extract_github(top_text) or URLMatcher.extract_github(text)

        website = None
        portfolio_match = re.search(
            r'(?<![@\w])(?:https?://)?(?:www\.)?([a-zA-Z0-9\-]+\.(?:com|io|dev|me|co)(?:/\S*)?)',
            text,
            re.IGNORECASE
        )
        if portfolio_match:
            candidate = portfolio_match.group(1)
            if 'linkedin.com' not in candidate.lower() and 'github.com' not in candidate.lower():
                website = candidate

        return ContactInfo(
            email=email,
            phone=phone,
            linkedin=linkedin,
            github=github,
            website=website,
            location=LocationMatcher.extract(top_text)
        )
    
    def _extract_name(self, text: str) -> Optional[str]:
        """Extract candidate name from resume."""
        heuristic_name = NameMatcher.extract_from_top(text)
        if heuristic_name:
            return heuristic_name

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
            
            lines = [line.strip() for line in block.split('\n') if line.strip()]
            starts_new_role = (
                any(self._looks_like_date_line(line) for line in lines[:2])
                or any(' at ' in line.lower() for line in lines[:1])
                or (len(lines) >= 2 and self._looks_like_company_name(lines[1]))
            )

            if starts_new_role:
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

        header_lines = lines[:3]
        if header_lines and self._looks_like_date_line(header_lines[0]) and len(header_lines) > 1:
            header_lines = header_lines[1:]

        job_title = header_lines[0] if header_lines else None
        if job_title and ' at ' in job_title.lower():
            title_part, company_part = re.split(r'\bat\b', job_title, maxsplit=1, flags=re.IGNORECASE)
            job_title = title_part.strip(" ,-–—")
            company = company or company_part.strip(" ,-–—")
        elif len(header_lines) > 1 and not self._looks_like_date_line(header_lines[1]):
            company = company or header_lines[1]
        
        # Extract bullet points
        bullets = extract_bullet_points(block)
        if not bullets and len(lines) > 2:
            bullets = [line for line in lines[2:] if not self._looks_like_date_line(line)]
        
        return ExperienceItem(
            job_title=job_title,
            company=company,
            start_date=start_date,
            end_date=end_date,
            is_current=is_current,
            bullets=bullets,
            raw_text=block
        )
    
    def _extract_date_range(self, text: str) -> Dict[str, Any]:
        """Extract date range from text."""
        extracted = DateRangeMatcher.extract(text)
        if extracted:
            start, end = extracted
            is_current = bool(end and end.lower() == "present")
            return {
                'start': start,
                'end': None if is_current else end,
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

        lines = [line.strip() for line in block.split('\n') if line.strip()]
        
        # Extract degree patterns
        degree_patterns = [
            r'\b(BSc|B\.Sc|BEng|BA|BS|BE|BTech|Bachelor(?: of [A-Za-z& ]+)?)\b',
            r'\b(MSc|M\.Sc|MEng|MA|MS|ME|MTech|Master(?: of [A-Za-z& ]+)?)\b',
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
        institution = next((line for line in lines if self._looks_like_company_name(line)), None)
        institution = institution or (orgs[0] if orgs else None)
        
        # Extract year (4-digit number)
        year_pattern = r'\b(?:19|20)\d{2}\b'
        years = re.findall(year_pattern, block)
        graduation_year = years[-1] if years else None  # Take the most recent
        
        # Extract GPA
        gpa_pattern = r'GPA[:\s]*(\d+(?:\.\d+)?)'
        gpa_match = re.search(gpa_pattern, block, re.IGNORECASE)
        gpa = gpa_match.group(1) if gpa_match else None

        field_match = re.search(r'\b(?:in|of)\s+([A-Z][A-Za-z&/\- ]+)', block)
        field_of_study = field_match.group(1).strip() if field_match else None
        
        return EducationItem(
            degree=degree,
            field_of_study=field_of_study,
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
        normalized_skills_text = skills_text.lower()
        
        # Split by common delimiters
        raw_skills = re.split(r'[,;|\n•·]', skills_text)
        
        skill_items = []
        seen_skills = set()

        for category, skills in self.skills_taxonomy.items():
            for skill_name in skills:
                pattern = rf'(?<![a-z0-9]){re.escape(skill_name.lower())}(?![a-z0-9])'
                if re.search(pattern, normalized_skills_text):
                    normalized = self._normalize_skill_token(skill_name)
                    if normalized in seen_skills:
                        continue
                    seen_skills.add(normalized)
                    skill_items.append(SkillItem(
                        name=skill_name,
                        category=category,
                        normalized_name=normalized
                    ))
        
        for skill in raw_skills:
            skill = skill.strip()
            if not skill or len(skill) < 2:
                continue
            
            # Normalize
            normalized = self._normalize_skill_token(skill)
            
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
