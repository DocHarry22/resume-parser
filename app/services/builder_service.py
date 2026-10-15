"""
Resume Builder Service

CRUD operations for building and managing resumes.
Designed for easy expansion with new operations.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import HTTPException
import json
import uuid
import os
import tempfile
import time
import logging

logger = logging.getLogger(__name__)
from app.core.workspaces import document_path, current_workspace, workspace_path, enforce_storage_limit
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
            # IDs and timestamps are assigned by the service, never imported.
            resume_data.update({key: value for key, value in initial_data.items()
                                if key not in {"id", "created_at", "updated_at"}})
        
        resume = ResumeBuilder(**resume_data)
        if not self.save_resume(resume):
            raise OSError("Unable to persist resume")
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
            contact = parsed_resume.contact
            builder_data["contact"] = ContactInfo(
                full_name=parsed_resume.name or "",
                email=contact.email or "",
                phone=contact.phone,
                location=contact.location,
                linkedin=contact.linkedin,
                github=contact.github,
                website=contact.website,
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
                    company=exp.company or "",
                    position=exp.job_title or "",
                    location=exp.location,
                    start_date=exp.start_date or "",
                    end_date=exp.end_date,
                    current="present" in str(exp.end_date or "").lower(),
                    description=exp.bullets or [],
                    achievements=[]
                )
                for exp in parsed_resume.experience
            ]
        
        # Education
        if parsed_resume.education:
            builder_data["education"] = [
                EducationEntry(
                    institution=edu.institution or "",
                    degree=edu.degree or "",
                    field_of_study=edu.field_of_study,
                    location=edu.location,
                    end_date=edu.graduation_year,
                    honors=[]
                )
                for edu in parsed_resume.education
            ]
        
        # Skills
        if parsed_resume.skills:
            skill_names = list(dict.fromkeys(skill.name for skill in parsed_resume.skills))
            builder_data["skills"] = [
                SkillCategory(category="Skills" if offset == 0 else "Additional skills",
                              skills=skill_names[offset:offset + 20])
                for offset in range(0, len(skill_names), 20)
            ]
        
        if parsed_resume.projects:
            builder_data["projects"] = [
                ProjectEntry(name=item.title or "", description=item.description or item.raw_text or "",
                             technologies=item.technologies, url=item.url)
                for item in parsed_resume.projects
            ]
        if parsed_resume.languages:
            builder_data["languages"] = [{"language": item, "proficiency": ""} for item in parsed_resume.languages]

        # Certifications
        if parsed_resume.certifications:
            builder_data["certifications"] = [
                CertificationEntry(
                    name=cert.name,
                    issuer=cert.issuer or "",
                    issue_date=cert.date,
                    credential_id=cert.credential_id,
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
        try:
            resume_path = document_path(self.storage_path, resume_id)
        except ValueError:
            return None
        # Check in-memory cache first
        if resume_id in self._in_memory_cache:
            return self._in_memory_cache[resume_id]
        
        # Try loading from disk
        resume_path = document_path(self.storage_path, resume_id)
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
        
        # Revalidate the merged model so nested entries remain typed after PATCH.
        update_dict = update_data.model_dump(exclude_unset=True)
        for key in ("experience", "education", "skills", "certifications", "projects",
                    "achievements", "languages", "volunteer", "publications"):
            if update_dict.get(key, object()) is None:
                update_dict[key] = []
        if update_dict.get("custom_sections", object()) is None:
            update_dict["custom_sections"] = {}
        if update_dict.get("title", object()) is None:
            update_dict["title"] = "My Resume"
        resume = ResumeBuilder.model_validate({**resume.model_dump(), **update_dict})
        
        # Update timestamp
        resume.updated_at = datetime.now().isoformat()
        
        # Update cache
        if not self.save_resume(resume):
            raise OSError("Unable to persist resume")
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
        deleted = False
        
        try:
            document_path(self.storage_path, resume_id)
        except ValueError:
            return False

        # Remove from cache
        if resume_id in self._in_memory_cache:
            del self._in_memory_cache[resume_id]
            deleted = True
        
        # Remove from disk
        resume_path = document_path(self.storage_path, resume_id)
        if resume_path.exists():
            resume_path.unlink()
            deleted = True
        
        return deleted
    
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
        
        temporary = None
        try:
            resume_path = document_path(self.storage_path, resume.id)
            self.storage_path.mkdir(parents=True, exist_ok=True)
            serialized = json.dumps(resume.model_dump(mode="json"), ensure_ascii=False, indent=2)
            enforce_storage_limit(self.storage_path, resume_path, len(serialized.encode("utf-8")))
            with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8",
                                             dir=self.storage_path, suffix=".tmp",
                                             delete=False) as handle:
                temporary = Path(handle.name)
                handle.write(serialized)
                handle.flush()
                os.fsync(handle.fileno())
            # Windows file indexing/synchronisation can briefly hold the target open.
            for attempt in range(5):
                try:
                    os.replace(temporary, resume_path)
                    break
                except PermissionError:
                    if attempt == 4:
                        raise
                    time.sleep(0.03 * (attempt + 1))
            return True
        except (OSError, ValueError, TypeError) as error:
            logger.error("Unable to persist document: %s (OS code %s)",
                         type(error).__name__, getattr(error, "winerror", getattr(error, "errno", None)))
            return False
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)
    
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
        resume = resume.model_copy(deep=True)

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
            if not self.save_resume(resume):
                raise OSError("Unable to persist resume")
            self._in_memory_cache[resume_id] = resume
            return resume
            
        except HTTPException:
            raise
        except (ValueError, TypeError):
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
        resume = resume.model_copy(deep=True)
        if section not in {SectionType.EXPERIENCE, SectionType.EDUCATION, SectionType.SKILLS,
                           SectionType.CERTIFICATIONS, SectionType.PROJECTS}:
            return None
        if not 0 <= entry_index < len(getattr(resume, section.value)):
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
            if not self.save_resume(resume):
                raise OSError("Unable to persist resume")
            self._in_memory_cache[resume_id] = resume
            return resume
            
        except HTTPException:
            raise
        except (ValueError, TypeError):
            return None
    
    def export_to_text(self, resume: ResumeBuilder) -> str:
        """
        Export resume to plain text format.
        
        Args:
            resume: ResumeBuilder to export
            
        Returns:
            Formatted plain text resume
        """
        from app.services.resume_export import resume_blocks
        return "\n".join(text for _, text in resume_blocks(resume))



# Singleton instance
_builder_service: Optional[ResumeBuilderService] = None

def get_builder_service() -> ResumeBuilderService:
    """Get singleton instance of ResumeBuilderService."""
    if current_workspace.get():
        return ResumeBuilderService(workspace_path() / "resumes")
    global _builder_service
    if _builder_service is None:
        _builder_service = ResumeBuilderService()
    return _builder_service
