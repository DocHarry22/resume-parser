"""Resume scoring engine with quality metrics.

This module implements a comprehensive scoring system based on:
- Readability (Flesch-Kincaid formulas)
- Structural completeness
- Experience quality
- Skills richness
- Length and layout appropriateness
"""

import re
from typing import List, Tuple

from app.models.resume_models import Resume
from app.models.scoring_models import (
    ResumeScore, ReadabilityMetrics, StructureMetrics,
    ExperienceMetrics, SkillsMetrics, LengthMetrics
)
from app.services.nlp_service import get_nlp_service


class ScoringService:
    """Service for scoring resume quality."""
    
    def __init__(self):
        """Initialize scoring service."""
        self.nlp_service = get_nlp_service()
        
        # Scoring weights (must sum to 1.0)
        self.weights = {
            'readability': 0.15,
            'structure': 0.25,
            'experience': 0.30,
            'skills': 0.20,
            'length': 0.10
        }
    
    def score_resume(self, resume: Resume) -> ResumeScore:
        """
        Calculate comprehensive quality score for a resume.
        
        Args:
            resume: Parsed resume object
        
        Returns:
            ResumeScore with detailed metrics
        """
        # Calculate individual metrics
        readability = self._score_readability(resume)
        structure = self._score_structure(resume)
        experience = self._score_experience(resume)
        skills = self._score_skills(resume)
        length = self._score_length(resume)
        
        # Calculate overall weighted score
        overall = (
            readability.readability_score * self.weights['readability'] +
            structure.structure_score * self.weights['structure'] +
            experience.experience_score * self.weights['experience'] +
            skills.skills_score * self.weights['skills'] +
            length.length_score * self.weights['length']
        )
        
        # Generate improvement comments
        comments = self._generate_comments(
            overall, readability, structure, experience, skills, length
        )
        
        return ResumeScore(
            overall=round(overall, 1),
            readability=readability,
            structure=structure,
            experience=experience,
            skills=skills,
            length=length,
            comments=comments
        )
    
    def _score_readability(self, resume: Resume) -> ReadabilityMetrics:
        """
        Score resume readability using Flesch-Kincaid formulas.
        
        The Flesch-Kincaid readability tests are widely used to estimate
        reading difficulty based on sentence length and syllable complexity.
        
        Reference: https://en.wikipedia.org/wiki/Flesch–Kincaid_readability_tests
        """
        text = resume.raw_text
        
        # Calculate Flesch Reading Ease
        fre_score, metrics = self.nlp_service.calculate_flesch_reading_ease(text)
        
        # Calculate Flesch-Kincaid Grade Level
        fk_grade = self.nlp_service.calculate_flesch_kincaid_grade(text)
        
        # Convert to 0-100 score
        # Optimal range for professional documents: 60-70 (standard/fairly easy)
        # This corresponds to 8th-10th grade reading level
        readability_score = self._calculate_readability_score(fre_score, fk_grade)
        
        return ReadabilityMetrics(
            flesch_reading_ease=fre_score,
            flesch_kincaid_grade=fk_grade,
            avg_words_per_sentence=metrics['avg_words_per_sentence'],
            avg_syllables_per_word=metrics['avg_syllables_per_word'],
            readability_score=readability_score
        )
    
    def _calculate_readability_score(self, fre: float, fk_grade: float) -> float:
        """
        Calculate normalized readability score (0-100).
        
        Optimal range:
        - FRE: 60-70 (standard/fairly easy)
        - FK Grade: 8-10 (8th-10th grade)
        
        Score penalties for:
        - Too difficult (FRE < 50, FK > 12)
        - Too simple (FRE > 80, FK < 6)
        """
        score = 100.0
        
        # Penalize if too difficult
        if fre < 50:
            penalty = (50 - fre) * 0.5
            score -= penalty
        
        # Penalize if too simple
        if fre > 80:
            penalty = (fre - 80) * 0.3
            score -= penalty
        
        # Penalize if grade level too high
        if fk_grade > 12:
            penalty = (fk_grade - 12) * 5
            score -= penalty
        
        # Penalize if grade level too low
        if fk_grade < 6:
            penalty = (6 - fk_grade) * 3
            score -= penalty
        
        return round(max(0.0, min(100.0, score)), 1)
    
    def _score_structure(self, resume: Resume) -> StructureMetrics:
        """Score resume structural completeness."""
        has_contact = bool(resume.contact.email or resume.contact.phone)
        has_summary = bool(resume.summary)
        has_experience = len(resume.experience) > 0
        has_education = len(resume.education) > 0
        has_skills = len(resume.skills) > 0
        
        # Count sections
        section_count = sum([
            has_contact,
            has_summary,
            has_experience,
            has_education,
            has_skills,
            len(resume.projects) > 0,
            len(resume.certifications) > 0,
            len(resume.languages) > 0
        ])
        
        # Calculate score
        # Critical sections (must have): contact, experience, education, skills
        critical_score = sum([has_contact, has_experience, has_education, has_skills]) * 25
        
        # Bonus for optional sections
        optional_bonus = min(20, (section_count - 4) * 5) if section_count > 4 else 0
        
        # Bonus for summary
        summary_bonus = 10 if has_summary else 0
        
        structure_score = critical_score + optional_bonus + summary_bonus
        structure_score = min(100.0, structure_score)
        
        return StructureMetrics(
            has_contact=has_contact,
            has_summary=has_summary,
            has_experience=has_experience,
            has_education=has_education,
            has_skills=has_skills,
            section_count=section_count,
            structure_score=round(structure_score, 1)
        )
    
    def _score_experience(self, resume: Resume) -> ExperienceMetrics:
        """Score work experience quality."""
        total_roles = len(resume.experience)
        
        if total_roles == 0:
            return ExperienceMetrics(
                total_roles=0,
                avg_bullets_per_role=0.0,
                quantified_achievements=0,
                quantification_rate=0.0,
                experience_score=0.0
            )
        
        # Count bullets and quantified achievements
        total_bullets = 0
        quantified_achievements = 0
        
        for exp in resume.experience:
            bullet_count = len(exp.bullets)
            total_bullets += bullet_count
            
            # Check for quantified achievements (contains numbers)
            for bullet in exp.bullets:
                if self._contains_quantification(bullet):
                    quantified_achievements += 1
        
        avg_bullets_per_role = total_bullets / total_roles if total_roles > 0 else 0
        quantification_rate = (quantified_achievements / total_bullets * 100) if total_bullets > 0 else 0
        
        # Calculate score
        score = 0.0
        
        # Points for having multiple roles
        if total_roles >= 3:
            score += 30
        elif total_roles == 2:
            score += 20
        elif total_roles == 1:
            score += 10
        
        # Points for bullet density
        if avg_bullets_per_role >= 4:
            score += 30
        elif avg_bullets_per_role >= 3:
            score += 20
        elif avg_bullets_per_role >= 2:
            score += 10
        
        # Points for quantification
        if quantification_rate >= 40:
            score += 40
        elif quantification_rate >= 25:
            score += 30
        elif quantification_rate >= 15:
            score += 20
        elif quantification_rate > 0:
            score += 10
        
        return ExperienceMetrics(
            total_roles=total_roles,
            avg_bullets_per_role=round(avg_bullets_per_role, 1),
            quantified_achievements=quantified_achievements,
            quantification_rate=round(quantification_rate, 1),
            experience_score=round(min(100.0, score), 1)
        )
    
    def _contains_quantification(self, text: str) -> bool:
        """Check if text contains quantified metrics."""
        # Look for numbers, percentages, currency
        patterns = [
            r'\d+%',  # Percentages
            r'\$\d+',  # Dollar amounts
            r'R\s?\d+',  # Rand amounts
            r'\d+[KMB]',  # 10K, 5M, 2B
            r'\d+\s*(million|billion|thousand)',
            r'\d+\+',  # 100+
            r'\d{1,3}(,\d{3})*',  # 1,000
        ]
        
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        
        return False
    
    def _score_skills(self, resume: Resume) -> SkillsMetrics:
        """Score skills richness and diversity."""
        total_skills = len(resume.skills)
        
        if total_skills == 0:
            return SkillsMetrics(
                total_skills=0,
                categorized_skills=0,
                unique_categories=0,
                skills_score=0.0
            )
        
        # Count categorized skills and unique categories
        categorized_skills = sum(1 for skill in resume.skills if skill.category)
        categories = set(skill.category for skill in resume.skills if skill.category)
        unique_categories = len(categories)
        
        # Calculate score
        score = 0.0
        
        # Points for skill count
        if total_skills >= 15:
            score += 40
        elif total_skills >= 10:
            score += 30
        elif total_skills >= 5:
            score += 20
        elif total_skills > 0:
            score += 10
        
        # Points for categorization (recognized skills)
        categorization_rate = (categorized_skills / total_skills * 100)
        if categorization_rate >= 70:
            score += 30
        elif categorization_rate >= 50:
            score += 20
        elif categorization_rate >= 30:
            score += 10
        
        # Points for diversity across categories
        if unique_categories >= 5:
            score += 30
        elif unique_categories >= 3:
            score += 20
        elif unique_categories >= 2:
            score += 10
        
        return SkillsMetrics(
            total_skills=total_skills,
            categorized_skills=categorized_skills,
            unique_categories=unique_categories,
            skills_score=round(min(100.0, score), 1)
        )
    
    def _score_length(self, resume: Resume) -> LengthMetrics:
        """Score resume length and layout appropriateness."""
        # Count words
        words = self.nlp_service.tokenize_words(resume.raw_text)
        word_count = len(words)
        
        # Estimate pages (450 words per page)
        estimated_pages = word_count / 450
        
        # Check thresholds
        is_too_short = word_count < 150
        is_too_long = word_count > 2000
        
        # Calculate score
        score = 100.0
        
        if is_too_short:
            # Severe penalty for very short resumes
            penalty = (150 - word_count) * 0.3
            score -= penalty
        elif is_too_long:
            # Penalty for very long resumes
            penalty = (word_count - 2000) * 0.02
            score -= penalty
        else:
            # Optimal range: 400-1500 words (roughly 1-3 pages)
            if 400 <= word_count <= 1500:
                score = 100.0
            elif 200 <= word_count < 400:
                # Slightly short
                score = 80.0
            elif 1500 < word_count <= 2000:
                # Slightly long
                score = 85.0
        
        return LengthMetrics(
            word_count=word_count,
            estimated_pages=round(estimated_pages, 1),
            is_too_short=is_too_short,
            is_too_long=is_too_long,
            length_score=round(max(0.0, min(100.0, score)), 1)
        )
    
    def _generate_comments(
        self,
        overall: float,
        readability: ReadabilityMetrics,
        structure: StructureMetrics,
        experience: ExperienceMetrics,
        skills: SkillsMetrics,
        length: LengthMetrics
    ) -> List[str]:
        """Generate human-friendly improvement suggestions."""
        comments = []
        
        # Overall assessment
        if overall >= 85:
            comments.append("✓ Excellent resume with strong overall quality")
        elif overall >= 70:
            comments.append("✓ Good resume with room for minor improvements")
        elif overall >= 50:
            comments.append("⚠ Decent resume but needs improvements in key areas")
        else:
            comments.append("⚠ Resume needs significant improvements")
        
        # Structure feedback
        if structure.structure_score >= 90:
            comments.append("✓ Great structure with all key sections present")
        else:
            if not structure.has_contact:
                comments.append("✗ Add contact information (email and phone)")
            if not structure.has_experience:
                comments.append("✗ Add work experience section")
            if not structure.has_education:
                comments.append("✗ Add education section")
            if not structure.has_skills:
                comments.append("✗ Add skills section")
            if not structure.has_summary:
                comments.append("→ Consider adding a professional summary at the top")
        
        # Experience feedback
        if experience.experience_score < 60:
            if experience.total_roles < 2:
                comments.append("→ Include more work experience entries if available")
            if experience.avg_bullets_per_role < 3:
                comments.append("→ Add more detail to your experience (aim for 3-5 bullet points per role)")
            if experience.quantification_rate < 20:
                comments.append("→ Add more quantified achievements (numbers, percentages, KPIs)")
        elif experience.quantification_rate < 30:
            comments.append("→ Consider adding more quantified results to strengthen impact")
        
        # Skills feedback
        if skills.skills_score < 60:
            if skills.total_skills < 8:
                comments.append("→ Add more relevant skills (aim for at least 10-15)")
            if skills.unique_categories < 3:
                comments.append("→ Diversify your skills across different categories")
        
        # Length feedback
        if length.is_too_short:
            comments.append("⚠ Resume is too short - add more detail to your experience and skills")
        elif length.is_too_long:
            comments.append("⚠ Resume is too long - consider condensing to 1-2 pages")
        elif length.estimated_pages <= 1.5:
            comments.append("✓ Resume length is appropriate")
        
        # Readability feedback
        if readability.flesch_kincaid_grade > 12:
            comments.append("→ Simplify language - some sentences are too complex")
        elif readability.flesch_kincaid_grade < 7:
            comments.append("→ Use more professional language where appropriate")
        
        if readability.avg_words_per_sentence > 20:
            comments.append("→ Break down long sentences for better readability")
        
        return comments
