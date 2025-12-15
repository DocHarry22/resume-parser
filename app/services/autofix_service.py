"""
Auto-Fix Service for Resume Recommendations

Handles automated fixes for common resume issues detected by the scoring engine.
Designed for extensibility - easy to add new fix types.
"""

from typing import List, Dict, Any, Optional, Tuple
from enum import Enum
import re
from datetime import datetime

from app.models.resume_models import Resume
from app.models.builder_models import (
    ResumeBuilder, ContactInfo, ProfessionalSummary,
    ExperienceEntry, EducationEntry
)


class FixType(str, Enum):
    """Types of auto-fixes available."""
    LENGTH = "length"  # Resume too long/short
    SUMMARY = "summary"  # Missing professional summary
    READABILITY = "readability"  # Long sentences, complex words
    FORMATTING = "formatting"  # Inconsistent formatting
    QUANTIFICATION = "quantification"  # Missing metrics
    CONTACT = "contact"  # Missing contact info
    DATES = "dates"  # Inconsistent date formats
    BULLETS = "bullets"  # Poor bullet point structure
    KEYWORDS = "keywords"  # Missing industry keywords


class FixAction(str, Enum):
    """Actions that can be taken."""
    ADD = "add"
    REMOVE = "remove"
    MODIFY = "modify"
    REFORMAT = "reformat"
    SUGGEST = "suggest"


class AutoFix:
    """Single auto-fix recommendation with action."""
    
    def __init__(
        self,
        fix_type: FixType,
        action: FixAction,
        section: str,
        description: str,
        original_value: Optional[Any] = None,
        suggested_value: Optional[Any] = None,
        auto_applicable: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.fix_type = fix_type
        self.action = action
        self.section = section
        self.description = description
        self.original_value = original_value
        self.suggested_value = suggested_value
        self.auto_applicable = auto_applicable
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "fix_type": self.fix_type.value,
            "action": self.action.value,
            "section": self.section,
            "description": self.description,
            "original_value": self.original_value,
            "suggested_value": self.suggested_value,
            "auto_applicable": self.auto_applicable,
            "metadata": self.metadata
        }


class AutoFixService:
    """
    Service for generating and applying auto-fixes to resumes.
    Extensible design - add new fix methods easily.
    """
    
    def __init__(self):
        """Initialize the auto-fix service."""
        self.fix_handlers = {
            FixType.LENGTH: self._fix_length,
            FixType.SUMMARY: self._fix_summary,
            FixType.READABILITY: self._fix_readability,
            FixType.CONTACT: self._fix_contact,
            FixType.QUANTIFICATION: self._fix_quantification,
            FixType.BULLETS: self._fix_bullets,
        }
    
    def generate_fixes(
        self,
        resume: Resume,
        flags: List[str],
        comments: List[str],
        score: float
    ) -> List[AutoFix]:
        """
        Generate auto-fix recommendations based on scoring feedback.
        
        Args:
            resume: Parsed resume data
            flags: Warning flags from scoring
            comments: Improvement suggestions from scoring
            score: Overall resume score
            
        Returns:
            List of AutoFix objects with recommendations
        """
        fixes = []
        
        # Parse flags and comments to determine needed fixes
        all_feedback = flags + comments
        
        for feedback in all_feedback:
            feedback_lower = feedback.lower()
            
            # Length issues
            if "too long" in feedback_lower or "2 pages" in feedback_lower:
                fix = self._fix_length(resume, feedback)
                if fix:
                    fixes.append(fix)
            
            # Missing summary
            elif "summary" in feedback_lower and "missing" in feedback_lower:
                fix = self._fix_summary(resume, feedback)
                if fix:
                    fixes.append(fix)
            
            # Readability issues
            elif "readability" in feedback_lower or "long sentences" in feedback_lower:
                fix = self._fix_readability(resume, feedback)
                if fix:
                    fixes.extend(fix) if isinstance(fix, list) else fixes.append(fix)
            
            # Contact info
            elif "contact" in feedback_lower or "email" in feedback_lower or "phone" in feedback_lower:
                fix = self._fix_contact(resume, feedback)
                if fix:
                    fixes.append(fix)
            
            # Quantification
            elif "quantif" in feedback_lower or "metric" in feedback_lower or "number" in feedback_lower:
                fix = self._fix_quantification(resume, feedback)
                if fix:
                    fixes.extend(fix) if isinstance(fix, list) else fixes.append(fix)
            
            # Bullet points
            elif "bullet" in feedback_lower or "action verb" in feedback_lower:
                fix = self._fix_bullets(resume, feedback)
                if fix:
                    fixes.extend(fix) if isinstance(fix, list) else fixes.append(fix)
        
        return fixes
    
    def _fix_length(self, resume: Resume, feedback: str) -> Optional[AutoFix]:
        """Fix resume length issues."""
        raw_text = resume.raw_text or ""
        word_count = len(raw_text.split())
        
        if word_count > 1000:  # Roughly 2 pages
            return AutoFix(
                fix_type=FixType.LENGTH,
                action=FixAction.MODIFY,
                section="overall",
                description="Resume exceeds 2 pages. Condense experience descriptions.",
                original_value=f"{word_count} words",
                suggested_value="~500-800 words (1-2 pages)",
                auto_applicable=False,
                metadata={
                    "current_words": word_count,
                    "target_words": 750,
                    "reduction_needed": word_count - 750
                }
            )
        return None
    
    def _fix_summary(self, resume: Resume, feedback: str) -> Optional[AutoFix]:
        """Generate professional summary suggestion."""
        # Extract job title from experience if available
        job_title = "Professional"
        if resume.experience and len(resume.experience) > 0:
            job_title = resume.experience[0].get("position", "Professional")
        
        # Generate template summary
        suggested_summary = (
            f"Experienced {job_title} with proven track record in [key achievement]. "
            f"Skilled in [top 3 skills] with expertise in [domain]. "
            f"Passionate about [value proposition] and driving [business outcome]."
        )
        
        return AutoFix(
            fix_type=FixType.SUMMARY,
            action=FixAction.ADD,
            section="summary",
            description="Add a professional summary to introduce your qualifications",
            original_value=None,
            suggested_value=suggested_summary,
            auto_applicable=True,
            metadata={
                "template": True,
                "customization_needed": True,
                "position": "top"
            }
        )
    
    def _fix_readability(self, resume: Resume, feedback: str) -> List[AutoFix]:
        """Fix readability issues by shortening long sentences."""
        fixes = []
        raw_text = resume.raw_text or ""
        
        # Find long sentences (>25 words)
        sentences = re.split(r'[.!?]+', raw_text)
        for i, sentence in enumerate(sentences):
            words = sentence.strip().split()
            if len(words) > 25:
                fixes.append(AutoFix(
                    fix_type=FixType.READABILITY,
                    action=FixAction.MODIFY,
                    section="content",
                    description=f"Shorten sentence {i+1} (currently {len(words)} words)",
                    original_value=sentence.strip()[:100] + "...",
                    suggested_value="Break into 2-3 shorter sentences",
                    auto_applicable=False,
                    metadata={
                        "word_count": len(words),
                        "target_words": 20,
                        "sentence_index": i
                    }
                ))
        
        return fixes[:3]  # Limit to top 3 issues
    
    def _fix_contact(self, resume: Resume, feedback: str) -> Optional[AutoFix]:
        """Fix missing contact information."""
        contact = resume.contact or {}
        missing = []
        
        if not contact.get("email"):
            missing.append("email")
        if not contact.get("phone"):
            missing.append("phone")
        if not contact.get("location"):
            missing.append("location")
        
        if missing:
            return AutoFix(
                fix_type=FixType.CONTACT,
                action=FixAction.ADD,
                section="contact",
                description=f"Add missing contact information: {', '.join(missing)}",
                original_value=contact,
                suggested_value={
                    "email": "your.email@example.com",
                    "phone": "+1-XXX-XXX-XXXX",
                    "location": "City, State"
                },
                auto_applicable=False,
                metadata={
                    "missing_fields": missing,
                    "priority": "high"
                }
            )
        return None
    
    def _fix_quantification(self, resume: Resume, feedback: str) -> List[AutoFix]:
        """Suggest adding quantifiable achievements."""
        fixes = []
        
        # Check experience entries for missing metrics
        for i, exp in enumerate(resume.experience or []):
            description = " ".join(exp.get("description", []))
            
            # Look for statements without numbers
            if not re.search(r'\d+[%$]?|\$\d+|[0-9,]+', description):
                fixes.append(AutoFix(
                    fix_type=FixType.QUANTIFICATION,
                    action=FixAction.MODIFY,
                    section=f"experience[{i}]",
                    description=f"Add metrics to {exp.get('position', 'position')} at {exp.get('company', 'company')}",
                    original_value=description[:100] + "...",
                    suggested_value="Add specific numbers: % improved, $ saved, # managed, etc.",
                    auto_applicable=False,
                    metadata={
                        "company": exp.get("company"),
                        "position": exp.get("position"),
                        "examples": [
                            "Increased sales by 25%",
                            "Managed team of 8 developers",
                            "Reduced costs by $50K annually"
                        ]
                    }
                ))
        
        return fixes[:3]  # Top 3 experiences
    
    def _fix_bullets(self, resume: Resume, feedback: str) -> List[AutoFix]:
        """Fix bullet point structure and action verbs."""
        fixes = []
        
        weak_verbs = ["responsible for", "worked on", "helped with", "did", "made"]
        strong_verbs = ["Led", "Developed", "Implemented", "Optimized", "Achieved", "Designed"]
        
        for i, exp in enumerate(resume.experience or []):
            for j, bullet in enumerate(exp.get("description", [])):
                # Check for weak action verbs
                if any(weak in bullet.lower() for weak in weak_verbs):
                    fixes.append(AutoFix(
                        fix_type=FixType.BULLETS,
                        action=FixAction.MODIFY,
                        section=f"experience[{i}].description[{j}]",
                        description="Replace weak verb with strong action verb",
                        original_value=bullet,
                        suggested_value=f"Start with: {', '.join(strong_verbs[:3])}...",
                        auto_applicable=False,
                        metadata={
                            "weak_verb_found": True,
                            "suggested_verbs": strong_verbs,
                            "company": exp.get("company")
                        }
                    ))
        
        return fixes[:5]  # Top 5 bullet issues
    
    def apply_fix(
        self,
        resume_builder: ResumeBuilder,
        fix: AutoFix
    ) -> Tuple[bool, str, Optional[ResumeBuilder]]:
        """
        Apply an auto-fix to a resume builder instance.
        
        Args:
            resume_builder: ResumeBuilder instance to modify
            fix: AutoFix to apply
            
        Returns:
            Tuple of (success, message, updated_resume_builder)
        """
        if not fix.auto_applicable:
            return False, "This fix requires manual intervention", None
        
        try:
            if fix.fix_type == FixType.SUMMARY and fix.action == FixAction.ADD:
                # Add professional summary
                if not resume_builder.summary:
                    resume_builder.summary = ProfessionalSummary(
                        summary=str(fix.suggested_value)
                    )
                    return True, "Professional summary added successfully", resume_builder
            
            # Add more auto-applicable fixes here as needed
            
            return False, f"Auto-fix for {fix.fix_type.value} not yet implemented", None
            
        except Exception as e:
            return False, f"Error applying fix: {str(e)}", None
    
    def get_fix_priority(self, fix: AutoFix) -> int:
        """
        Determine priority of a fix (1=highest, 5=lowest).
        Used for sorting recommendations.
        """
        priority_map = {
            FixType.CONTACT: 1,
            FixType.SUMMARY: 2,
            FixType.LENGTH: 2,
            FixType.QUANTIFICATION: 3,
            FixType.BULLETS: 3,
            FixType.READABILITY: 4,
        }
        return priority_map.get(fix.fix_type, 5)


# Singleton instance
_auto_fix_service: Optional[AutoFixService] = None

def get_auto_fix_service() -> AutoFixService:
    """Get singleton instance of AutoFixService."""
    global _auto_fix_service
    if _auto_fix_service is None:
        _auto_fix_service = AutoFixService()
    return _auto_fix_service
