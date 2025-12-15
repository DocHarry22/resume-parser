"""
Resume Builder Service

CRUD operations for building and managing resumes.
Designed for easy expansion with new operations.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import uuid
from pathlib import Path

from app.models.builder_models import (
    ResumeBuilder, ResumeUpdate, ContactInfo,
    ExperienceEntry, EducationEntry, SkillCategory,
    CertificationEntry, ProjectEntry, SectionType
)
from app.models.resume_models import Resume


class ResumeBuilderService:
    """
    Service for creating, updating, and managing resume builder instances.
    Supports both in-memory and persistent storage.
    """
    
    def __init__(self, storage_path: Optional[Path] = None):
        """
        Initialize the resume builder service.
        
        Args:
            storage_path: Path to store resume JSON files. If None, uses in-memory only.
        """
        self.storage_path = storage_path or Path("data/resumes")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self._in_memory_cache: Dict[str, ResumeBuilder] = {}
    
    def create_resume(
        self,
        title: str = "My Resume",
        initial_data: Optional[Dict[str, Any]] = None
    ) -> ResumeBuilder:
        """
        Create a new resume builder instance.
        
        Args:
            title: Title for the resume
            initial_data: Optional initial data to populate
            
        Returns:
            New ResumeBuilder instance with generated ID
        """
        resume_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        resume_data = {
            "id": resume_id,
            "title": title,
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        
        if initial_data:
            resume_data.update(initial_data)
        
        resume = ResumeBuilder(**resume_data)
        self._in_memory_cache[resume_id] = resume
        
        return resume
    
    def create_from_parsed(self, parsed_resume: Resume) -> ResumeBuilder:
        """
        Create a ResumeBuilder from a parsed Resume.
        Converts parsed data into editable builder format.
        
        Args:
            parsed_resume: Resume object from parsing service
            
        Returns:
            ResumeBuilder instance populated with parsed data
        """
        builder_data = {}
        
        # Contact information
        if parsed_resume.contact:
            builder_data["contact"] = ContactInfo(
                full_name=parsed_resume.contact.get("name", ""),
                email=parsed_resume.contact.get("email", "") or "email@example.com",
                phone=parsed_resume.contact.get("phone"),
                location=parsed_resume.contact.get("location"),
                linkedin=parsed_resume.contact.get("linkedin"),
                github=parsed_resume.contact.get("github")
            )
        
        # Summary
        if parsed_resume.summary:
            builder_data["summary"] = {
                "summary": parsed_resume.summary
            }
        
        # Experience
        if parsed_resume.experience:
            builder_data["experience"] = [
                ExperienceEntry(
                    company=exp.get("company", ""),
                    position=exp.get("position", ""),
                    location=exp.get("location"),
                    start_date=exp.get("start_date", ""),
                    end_date=exp.get("end_date"),
                    current="present" in str(exp.get("end_date", "")).lower(),
                    description=exp.get("description", []),
                    achievements=[]
                )
                for exp in parsed_resume.experience
            ]
        
        # Education
        if parsed_resume.education:
            builder_data["education"] = [
                EducationEntry(
                    institution=edu.get("institution", ""),
                    degree=edu.get("degree", ""),
                    field_of_study=edu.get("field_of_study"),
                    location=edu.get("location"),
                    end_date=edu.get("end_date"),
                    honors=[]
                )
                for edu in parsed_resume.education
            ]
        
        # Skills
        if parsed_resume.skills:
            builder_data["skills"] = [
                SkillCategory(
                    category="Technical Skills",
                    skills=parsed_resume.skills
                )
            ]
        
        # Certifications
        if parsed_resume.certifications:
            builder_data["certifications"] = [
                CertificationEntry(
                    name=cert,
                    issuer="",
                )
                for cert in parsed_resume.certifications
            ]
        
        return self.create_resume(
            title="Imported Resume",
            initial_data=builder_data
        )
    
    def get_resume(self, resume_id: str) -> Optional[ResumeBuilder]:
        """
        Retrieve a resume by ID.
        
        Args:
            resume_id: Resume ID to retrieve
            
        Returns:
            ResumeBuilder if found, None otherwise
        """
        # Check in-memory cache first
        if resume_id in self._in_memory_cache:
            return self._in_memory_cache[resume_id]
        
        # Try loading from disk
        resume_path = self.storage_path / f"{resume_id}.json"
        if resume_path.exists():
            with open(resume_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                resume = ResumeBuilder(**data)
                self._in_memory_cache[resume_id] = resume
                return resume
        
        return None
    
    def update_resume(
        self,
        resume_id: str,
        update_data: ResumeUpdate
    ) -> Optional[ResumeBuilder]:
        """
        Update an existing resume with partial data.
        
        Args:
            resume_id: Resume ID to update
            update_data: Partial update data
            
        Returns:
            Updated ResumeBuilder if successful, None if not found
        """
        resume = self.get_resume(resume_id)
        if not resume:
            return None
        
        # Apply updates
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(resume, key, value)
        
        # Update timestamp
        resume.updated_at = datetime.now().isoformat()
        
        # Update cache
        self._in_memory_cache[resume_id] = resume
        
        return resume
    
    def delete_resume(self, resume_id: str) -> bool:
        """
        Delete a resume.
        
        Args:
            resume_id: Resume ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        # Remove from cache
        if resume_id in self._in_memory_cache:
            del self._in_memory_cache[resume_id]
        
        # Remove from disk
        resume_path = self.storage_path / f"{resume_id}.json"
        if resume_path.exists():
            resume_path.unlink()
            return True
        
        return False
    
    def save_resume(self, resume: ResumeBuilder) -> bool:
        """
        Persist resume to disk.
        
        Args:
            resume: ResumeBuilder to save
            
        Returns:
            True if saved successfully
        """
        if not resume.id:
            return False
        
        try:
            resume_path = self.storage_path / f"{resume.id}.json"
            with open(resume_path, 'w', encoding='utf-8') as f:
                json.dump(resume.model_dump(), f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving resume: {e}")
            return False
    
    def list_resumes(self) -> List[Dict[str, Any]]:
        """
        List all resumes (metadata only).
        
        Returns:
            List of resume metadata (id, title, created_at, updated_at)
        """
        resumes = []
        
        # From in-memory cache
        for resume in self._in_memory_cache.values():
            resumes.append({
                "id": resume.id,
                "title": resume.title,
                "created_at": resume.created_at,
                "updated_at": resume.updated_at
            })
        
        # From disk (if not in cache)
        for resume_file in self.storage_path.glob("*.json"):
            resume_id = resume_file.stem
            if resume_id not in self._in_memory_cache:
                try:
                    with open(resume_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        resumes.append({
                            "id": data.get("id"),
                            "title": data.get("title"),
                            "created_at": data.get("created_at"),
                            "updated_at": data.get("updated_at")
                        })
                except Exception:
                    continue
        
        return resumes
    
    def add_section_entry(
        self,
        resume_id: str,
        section: SectionType,
        entry_data: Dict[str, Any]
    ) -> Optional[ResumeBuilder]:
        """
        Add an entry to a list-based section (experience, education, etc.).
        
        Args:
            resume_id: Resume ID
            section: Section type to add to
            entry_data: Entry data matching the section's model
            
        Returns:
            Updated ResumeBuilder if successful
        """
        resume = self.get_resume(resume_id)
        if not resume:
            return None
        
        try:
            if section == SectionType.EXPERIENCE:
                entry = ExperienceEntry(**entry_data)
                resume.experience.append(entry)
            
            elif section == SectionType.EDUCATION:
                entry = EducationEntry(**entry_data)
                resume.education.append(entry)
            
            elif section == SectionType.SKILLS:
                entry = SkillCategory(**entry_data)
                resume.skills.append(entry)
            
            elif section == SectionType.CERTIFICATIONS:
                entry = CertificationEntry(**entry_data)
                resume.certifications.append(entry)
            
            elif section == SectionType.PROJECTS:
                entry = ProjectEntry(**entry_data)
                resume.projects.append(entry)
            
            else:
                return None
            
            resume.updated_at = datetime.now().isoformat()
            self._in_memory_cache[resume_id] = resume
            
            return resume
            
        except Exception as e:
            print(f"Error adding section entry: {e}")
            return None
    
    def remove_section_entry(
        self,
        resume_id: str,
        section: SectionType,
        entry_index: int
    ) -> Optional[ResumeBuilder]:
        """
        Remove an entry from a list-based section.
        
        Args:
            resume_id: Resume ID
            section: Section type
            entry_index: Index of entry to remove
            
        Returns:
            Updated ResumeBuilder if successful
        """
        resume = self.get_resume(resume_id)
        if not resume:
            return None
        
        try:
            if section == SectionType.EXPERIENCE:
                if 0 <= entry_index < len(resume.experience):
                    resume.experience.pop(entry_index)
            
            elif section == SectionType.EDUCATION:
                if 0 <= entry_index < len(resume.education):
                    resume.education.pop(entry_index)
            
            elif section == SectionType.SKILLS:
                if 0 <= entry_index < len(resume.skills):
                    resume.skills.pop(entry_index)
            
            elif section == SectionType.CERTIFICATIONS:
                if 0 <= entry_index < len(resume.certifications):
                    resume.certifications.pop(entry_index)
            
            elif section == SectionType.PROJECTS:
                if 0 <= entry_index < len(resume.projects):
                    resume.projects.pop(entry_index)
            
            else:
                return None
            
            resume.updated_at = datetime.now().isoformat()
            self._in_memory_cache[resume_id] = resume
            
            return resume
            
        except Exception as e:
            print(f"Error removing section entry: {e}")
            return None
    
    def export_to_text(self, resume: ResumeBuilder) -> str:
        """
        Export resume to plain text format.
        
        Args:
            resume: ResumeBuilder to export
            
        Returns:
            Formatted plain text resume
        """
        lines = []
        
        # Contact
        if resume.contact:
            lines.append(resume.contact.full_name.upper())
            contact_line = []
            if resume.contact.email:
                contact_line.append(resume.contact.email)
            if resume.contact.phone:
                contact_line.append(resume.contact.phone)
            if resume.contact.location:
                contact_line.append(resume.contact.location)
            lines.append(" | ".join(contact_line))
            
            if resume.contact.linkedin:
                lines.append(f"LinkedIn: {resume.contact.linkedin}")
            if resume.contact.github:
                lines.append(f"GitHub: {resume.contact.github}")
            lines.append("")
        
        # Summary
        if resume.summary:
            lines.append("PROFESSIONAL SUMMARY")
            lines.append(resume.summary.summary)
            lines.append("")
        
        # Experience
        if resume.experience:
            lines.append("EXPERIENCE")
            for exp in resume.experience:
                lines.append(f"{exp.position} at {exp.company}")
                date_range = f"{exp.start_date} - {exp.end_date or 'Present'}"
                lines.append(date_range)
                for desc in exp.description:
                    lines.append(f"• {desc}")
                lines.append("")
        
        # Education
        if resume.education:
            lines.append("EDUCATION")
            for edu in resume.education:
                lines.append(f"{edu.degree}, {edu.institution}")
                if edu.end_date:
                    lines.append(edu.end_date)
                lines.append("")
        
        # Skills
        if resume.skills:
            lines.append("SKILLS")
            for skill_cat in resume.skills:
                lines.append(f"{skill_cat.category}: {', '.join(skill_cat.skills)}")
            lines.append("")
        
        # Certifications
        if resume.certifications:
            lines.append("CERTIFICATIONS")
            for cert in resume.certifications:
                lines.append(f"• {cert.name} - {cert.issuer}")
            lines.append("")
        
        return "\n".join(lines)


# Singleton instance
_builder_service: Optional[ResumeBuilderService] = None

def get_builder_service() -> ResumeBuilderService:
    """Get singleton instance of ResumeBuilderService."""
    global _builder_service
    if _builder_service is None:
        _builder_service = ResumeBuilderService()
    return _builder_service
