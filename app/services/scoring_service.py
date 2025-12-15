"""Multi-tier resume scoring engine with ATS compliance analysis.

This module implements a comprehensive, multi-tier scoring system based on:
- Scan Mode: BASIC, ATS, or EXPERT
- ATS Compliance (formatting, parsability)
- Readability (Flesch-Kincaid formulas)
- Layout & Formatting
- Experience Quality (ATS/EXPERT modes only)
- Skills Analysis (ATS/EXPERT modes only)
- Expert recruiter rules (EXPERT mode only)

Weights by Scan Mode:
    BASIC:  ats_compliance=50%, layout=30%, readability=20%
    ATS:    ats_compliance=25%, experience=25%, skills=20%, readability=15%, layout=10%
    EXPERT: Same as ATS + advanced recruiter scoring rules

TODO: Future ML model integration for semantic skill matching
TODO: Async scoring pipeline for performance at scale
"""

import re
from typing import List, Tuple, Optional, Dict, Any
from dataclasses import dataclass

from app.models.resume_models import Resume
from app.models.scoring_models import (
    ResumeScore, ScanMode,
    ReadabilityMetrics, StructureMetrics, 
    ExperienceMetrics, SkillsMetrics, LengthMetrics
)
from app.services.nlp_service import get_nlp_service


# ============================================
# SCORING WEIGHTS BY MODE
# ============================================

WEIGHTS = {
    ScanMode.BASIC: {
        'ats_compliance': 0.50,
        'layout': 0.30,
        'readability': 0.20,
        # experience and skills are NOT scored in BASIC
    },
    ScanMode.ATS: {
        'ats_compliance': 0.25,
        'experience': 0.25,
        'skills': 0.20,
        'readability': 0.15,
        'layout': 0.15,
    },
    ScanMode.EXPERT: {
        'ats_compliance': 0.25,
        'experience': 0.25,
        'skills': 0.20,
        'readability': 0.15,
        'layout': 0.15,
        # Plus expert bonuses/penalties applied separately
    }
}

# ============================================
# INDUSTRY-SPECIFIC KEYWORDS & SCORING
# ============================================

INDUSTRY_KEYWORDS = {
    'engineering': {
        'technical_skills': [
            'cad', 'solidworks', 'autocad', 'matlab', 'finite element', 'fea',
            'design', 'prototype', 'testing', 'quality assurance', 'iso',
            'lean manufacturing', 'six sigma', 'process improvement', 'r&d',
            'mechanical', 'electrical', 'civil', 'chemical', 'industrial'
        ],
        'certifications': [
            'pe', 'professional engineer', 'eit', 'pmp', 'six sigma',
            'leed', 'autocad certification', 'solidworks certification'
        ],
        'action_verbs': [
            'designed', 'engineered', 'optimized', 'analyzed', 'tested',
            'prototyped', 'developed', 'improved', 'automated'
        ]
    },
    'it-software': {
        'technical_skills': [
            'python', 'java', 'javascript', 'react', 'node', 'angular', 'vue',
            'sql', 'mongodb', 'postgresql', 'aws', 'azure', 'gcp', 'docker',
            'kubernetes', 'ci/cd', 'git', 'agile', 'scrum', 'devops',
            'machine learning', 'ai', 'data science', 'api', 'microservices'
        ],
        'certifications': [
            'aws certified', 'azure certified', 'gcp certified', 'cissp',
            'comptia', 'certified scrum', 'pmp', 'ckad', 'cka'
        ],
        'action_verbs': [
            'developed', 'built', 'deployed', 'architected', 'implemented',
            'optimized', 'automated', 'integrated', 'migrated', 'scaled'
        ]
    },
    'finance': {
        'technical_skills': [
            'financial modeling', 'excel', 'bloomberg', 'financial analysis',
            'budgeting', 'forecasting', 'valuation', 'risk management',
            'portfolio management', 'gaap', 'ifrs', 'sox', 'compliance',
            'audit', 'tax', 'accounting', 'quickbooks', 'sap', 'oracle'
        ],
        'certifications': [
            'cpa', 'cfa', 'frm', 'cma', 'cia', 'cfp', 'series 7',
            'series 63', 'series 65', 'prm'
        ],
        'action_verbs': [
            'analyzed', 'forecasted', 'budgeted', 'audited', 'reconciled',
            'managed', 'optimized', 'evaluated', 'assessed', 'reported'
        ]
    },
    'healthcare': {
        'technical_skills': [
            'patient care', 'clinical', 'diagnosis', 'treatment', 'emr', 'ehr',
            'epic', 'cerner', 'meditech', 'hipaa', 'medical coding', 'icd-10',
            'cpt', 'nursing', 'pharmacy', 'laboratory', 'radiology',
            'case management', 'quality improvement', 'infection control'
        ],
        'certifications': [
            'rn', 'lpn', 'md', 'do', 'np', 'pa', 'cna', 'cma', 'rrt',
            'bls', 'acls', 'pals', 'ccrn', 'cnor', 'rnfa', 'cnp'
        ],
        'action_verbs': [
            'treated', 'diagnosed', 'assessed', 'administered', 'monitored',
            'coordinated', 'educated', 'documented', 'evaluated', 'managed'
        ]
    }
}


# ============================================
# STRUCTURE FLAGS
# ============================================

@dataclass
class StructureFlags:
    """Flags for resume structure issues detected during parsing."""
    has_tables: bool = False
    has_images: bool = False
    has_columns: bool = False
    has_headers_footers: bool = False
    is_image_only_pdf: bool = False
    page_count: int = 1


class ScoringService:
    """Multi-tier scoring service for resume quality analysis."""
    
    def __init__(self):
        """Initialize scoring service."""
        self.nlp_service = get_nlp_service()
    
    # ============================================
    # MAIN SCORING ENTRY POINT
    # ============================================
    
    def score_resume(
        self, 
        resume: Resume, 
        mode: ScanMode = ScanMode.BASIC,
        job_description: Optional[str] = None,
        industry: Optional[str] = None
    ) -> ResumeScore:
        """
        Calculate comprehensive quality score for a resume.
        
        Args:
            resume: Parsed resume object
            mode: Scan mode (BASIC, ATS, EXPERT)
            job_description: Optional job description for match scoring
            industry: Optional industry for targeted keyword optimization
                     (engineering, it-software, finance, healthcare)
        
        Returns:
            ResumeScore with metrics based on scan mode
        """
        # Extract structure flags from raw text analysis
        structure_flags = self._detect_structure_flags(resume.raw_text)
        
        # Calculate individual component scores
        ats_score = self._ats_compliance_score(resume, structure_flags)
        readability_score, readability_metrics = self._readability_score(resume)
        layout_score, layout_metrics = self._layout_score(resume, structure_flags)
        
        # Mode-dependent scoring
        experience_score = None
        skills_score = None
        experience_metrics = None
        skills_metrics = None
        
        if mode in (ScanMode.ATS, ScanMode.EXPERT):
            experience_score, experience_metrics = self._experience_score(resume, industry)
            skills_score, skills_metrics = self._skills_score(resume, industry)
        
        # Calculate weighted overall score
        weights = WEIGHTS[mode]
        overall = self._calculate_weighted_score(
            mode=mode,
            ats_score=ats_score,
            readability_score=readability_score,
            layout_score=layout_score,
            experience_score=experience_score,
            skills_score=skills_score,
            weights=weights
        )
        
        # Expert mode adjustments
        expert_bonus = 0.0
        if mode == ScanMode.EXPERT:
            expert_bonus = self._apply_expert_rules(resume, industry)
            overall = min(100.0, max(0.0, overall + expert_bonus))
        
        # Job match scoring
        job_match_score = None
        if job_description:
            job_match_score = self._job_match_score(resume, job_description)
        
        # Generate flags and comments
        flags = self._extract_flags(resume, structure_flags, mode)
        comments = self._generate_comments(
            mode=mode,
            ats_score=ats_score,
            readability_score=readability_score,
            layout_score=layout_score,
            experience_score=experience_score,
            skills_score=skills_score,
            flags=flags,
            resume=resume,
            industry=industry
        )
        
        # Build detailed metrics dict
        detailed_metrics = {
            'readability': {
                'flesch_reading_ease': readability_metrics.flesch_reading_ease,
                'flesch_kincaid_grade': readability_metrics.flesch_kincaid_grade,
                'avg_words_per_sentence': readability_metrics.avg_words_per_sentence,
            },
            'layout': {
                'word_count': layout_metrics.word_count,
                'estimated_pages': layout_metrics.estimated_pages,
            },
            'structure': {
                'has_contact': bool(resume.contact.email or resume.contact.phone),
                'has_summary': bool(resume.summary),
                'has_experience': len(resume.experience) > 0,
                'has_education': len(resume.education) > 0,
                'has_skills': len(resume.skills) > 0,
            }
        }
        
        if experience_metrics:
            detailed_metrics['experience'] = {
                'total_roles': experience_metrics.total_roles,
                'avg_bullets_per_role': experience_metrics.avg_bullets_per_role,
                'quantified_achievements': experience_metrics.quantified_achievements,
                'quantification_rate': experience_metrics.quantification_rate,
            }
        
        if skills_metrics:
            detailed_metrics['skills'] = {
                'total_skills': skills_metrics.total_skills,
                'categorized_skills': skills_metrics.categorized_skills,
                'unique_categories': skills_metrics.unique_categories,
            }
        
        return ResumeScore(
            overall=round(overall, 1),
            ats_compliance=round(ats_score, 1),
            readability=round(readability_score, 1),
            layout=round(layout_score, 1),
            experience=round(experience_score, 1) if experience_score is not None else None,
            skills=round(skills_score, 1) if skills_score is not None else None,
            job_match=round(job_match_score, 1) if job_match_score is not None else None,
            comments=comments,
            flags=flags,
            mode=mode,
            industry=industry,
            detailed_metrics=detailed_metrics
        )
    
    # ============================================
    # ATS COMPLIANCE SCORING
    # ============================================
    
    def _ats_compliance_score(self, resume: Resume, flags: StructureFlags) -> float:
        """
        Calculate ATS compliance score.
        
        Factors:
        - Contact information presence
        - Parsability (no image-only PDFs)
        - No tables or complex formatting
        - Standard section detection
        
        Args:
            resume: Parsed resume
            flags: Structure flags from text analysis
            
        Returns:
            ATS compliance score (0-100)
        """
        score = 100.0
        
        # Critical: Image-only PDF (cannot be parsed)
        if flags.is_image_only_pdf:
            return 10.0  # Severe penalty
        
        # Contact info penalties
        if not resume.contact.email:
            score -= 15
        if not resume.contact.phone:
            score -= 10
        
        # Formatting penalties
        if flags.has_tables:
            score -= 15
        if flags.has_images:
            score -= 10
        if flags.has_columns:
            score -= 8
        
        # Section penalties
        if not resume.summary:
            score -= 5
        if len(resume.experience) == 0:
            score -= 20
        if len(resume.education) == 0:
            score -= 10
        if len(resume.skills) == 0:
            score -= 10
        
        # Page count (ATS prefers 1-2 pages)
        if flags.page_count > 3:
            score -= 10
        
        return max(0.0, min(100.0, score))
    
    # ============================================
    # READABILITY SCORING
    # ============================================
    
    def _readability_score(self, resume: Resume) -> Tuple[float, ReadabilityMetrics]:
        """
        Score resume readability using Flesch-Kincaid formulas.
        
        Optimal range for professional documents: 60-70 FRE
        Corresponds to 8th-10th grade reading level
        
        Returns:
            Tuple of (normalized score 0-100, ReadabilityMetrics)
        """
        text = resume.raw_text
        
        # Calculate Flesch Reading Ease
        fre_score, metrics = self.nlp_service.calculate_flesch_reading_ease(text)
        
        # Calculate Flesch-Kincaid Grade Level
        fk_grade = self.nlp_service.calculate_flesch_kincaid_grade(text)
        
        # Normalize to 0-100 score
        score = 100.0
        
        # Penalize if too difficult (FRE < 50)
        if fre_score < 50:
            penalty = (50 - fre_score) * 0.5
            score -= penalty
        
        # Penalize if too simple (FRE > 80)
        if fre_score > 80:
            penalty = (fre_score - 80) * 0.3
            score -= penalty
        
        # Penalize if grade level too high (> 12)
        if fk_grade > 12:
            penalty = (fk_grade - 12) * 5
            score -= penalty
        
        # Penalize if grade level too low (< 6)
        if fk_grade < 6:
            penalty = (6 - fk_grade) * 3
            score -= penalty
        
        score = max(0.0, min(100.0, score))
        
        readability_metrics = ReadabilityMetrics(
            flesch_reading_ease=round(fre_score, 1),
            flesch_kincaid_grade=round(fk_grade, 1),
            avg_words_per_sentence=round(metrics['avg_words_per_sentence'], 1),
            avg_syllables_per_word=round(metrics['avg_syllables_per_word'], 2),
            readability_score=round(score, 1)
        )
        
        return score, readability_metrics
    
    # ============================================
    # LAYOUT SCORING
    # ============================================
    
    def _layout_score(self, resume: Resume, flags: StructureFlags) -> Tuple[float, LengthMetrics]:
        """
        Score resume layout and formatting.
        
        Factors:
        - Word count (ideal 400-1500)
        - Page estimation
        - Column/formatting complexity
        
        Returns:
            Tuple of (layout score 0-100, LengthMetrics)
        """
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
            penalty = (150 - word_count) * 0.4
            score -= penalty
        elif is_too_long:
            # Penalty for very long resumes
            penalty = (word_count - 2000) * 0.03
            score -= penalty
        else:
            # Optimal range: 400-1500 words
            if 400 <= word_count <= 1500:
                score = 100.0
            elif 200 <= word_count < 400:
                score = 80.0
            elif 1500 < word_count <= 2000:
                score = 85.0
        
        # Formatting penalties
        if flags.has_columns:
            score -= 5
        if flags.has_headers_footers:
            score -= 3
        
        score = max(0.0, min(100.0, score))
        
        length_metrics = LengthMetrics(
            word_count=word_count,
            estimated_pages=round(estimated_pages, 1),
            is_too_short=is_too_short,
            is_too_long=is_too_long,
            length_score=round(score, 1)
        )
        
        return score, length_metrics
    
    # ============================================
    # EXPERIENCE SCORING (ATS/EXPERT modes)
    # ============================================
    
    def _experience_score(self, resume: Resume, industry: Optional[str] = None) -> Tuple[float, ExperienceMetrics]:
        """
        Score work experience quality.
        
        Factors:
        - Number of roles
        - Bullet density (ideal 3-5 per role)
        - Quantified achievements (%, $, numbers)
        - Career progression indicators
        - Industry-specific action verbs (if industry specified)
        
        Returns:
            Tuple of (experience score 0-100, ExperienceMetrics)
        """
        total_roles = len(resume.experience)
        
        if total_roles == 0:
            metrics = ExperienceMetrics(
                total_roles=0,
                avg_bullets_per_role=0.0,
                quantified_achievements=0,
                quantification_rate=0.0,
                experience_score=0.0
            )
            return 0.0, metrics
        
        # Count bullets and quantified achievements
        total_bullets = 0
        quantified_achievements = 0
        
        for exp in resume.experience:
            bullet_count = len(exp.bullets)
            total_bullets += bullet_count
            
            for bullet in exp.bullets:
                if self._contains_quantification(bullet):
                    quantified_achievements += 1
        
        avg_bullets_per_role = total_bullets / total_roles if total_roles > 0 else 0
        quantification_rate = (quantified_achievements / total_bullets * 100) if total_bullets > 0 else 0
        
        # Calculate score
        score = 0.0
        
        # Points for having multiple roles (up to 30)
        if total_roles >= 3:
            score += 30
        elif total_roles == 2:
            score += 20
        elif total_roles == 1:
            score += 10
        
        # Points for bullet density (ideal 3-5, up to 30)
        if 3 <= avg_bullets_per_role <= 5:
            score += 30
        elif avg_bullets_per_role > 5:
            score += 25  # Slightly less optimal
        elif avg_bullets_per_role >= 2:
            score += 15
        elif avg_bullets_per_role >= 1:
            score += 5
        
        # Points for quantification (up to 40)
        if quantification_rate >= 40:
            score += 40
        elif quantification_rate >= 25:
            score += 30
        elif quantification_rate >= 15:
            score += 20
        elif quantification_rate > 0:
            score += 10
        
        # Industry-specific bonus for relevant action verbs
        if industry and industry in INDUSTRY_KEYWORDS:
            action_verbs = INDUSTRY_KEYWORDS[industry]['action_verbs']
            verb_matches = 0
            for exp in resume.experience:
                for bullet in exp.bullets:
                    bullet_lower = bullet.lower()
                    for verb in action_verbs:
                        if verb in bullet_lower:
                            verb_matches += 1
                            break  # Count once per bullet
            
            # Bonus up to 10 points for industry-relevant language
            if verb_matches >= 5:
                score += 10
            elif verb_matches >= 3:
                score += 5
            elif verb_matches > 0:
                score += 2
        
        score = min(100.0, score)
        
        metrics = ExperienceMetrics(
            total_roles=total_roles,
            avg_bullets_per_role=round(avg_bullets_per_role, 1),
            quantified_achievements=quantified_achievements,
            quantification_rate=round(quantification_rate, 1),
            experience_score=round(score, 1)
        )
        
        return score, metrics
    
    def _contains_quantification(self, text: str) -> bool:
        """Check if text contains quantified metrics (%, $, numbers)."""
        patterns = [
            r'\d+%',           # Percentages: 40%
            r'\$\d+',          # Dollar amounts: $1000
            r'R\s?\d+',        # Rand amounts: R1000
            r'£\d+',           # Pound amounts
            r'€\d+',           # Euro amounts
            r'\d+[KMB]\b',     # 10K, 5M, 2B
            r'\d+\s*(million|billion|thousand)',
            r'\d+\+',          # 100+
            r'\d{1,3}(,\d{3})+',  # 1,000 or 1,000,000
            r'\b\d+x\b',       # 5x improvement
        ]
        
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        
        return False
    
    # ============================================
    # SKILLS SCORING (ATS/EXPERT modes)
    # ============================================
    
    def _skills_score(self, resume: Resume, industry: Optional[str] = None) -> Tuple[float, SkillsMetrics]:
        """
        Score skills richness and diversity.
        
        Factors:
        - Total skill count
        - Category diversity
        - Recognition rate (matched to taxonomy)
        - Industry-specific skills match (if industry specified)
        
        Returns:
            Tuple of (skills score 0-100, SkillsMetrics)
        """
        total_skills = len(resume.skills)
        
        if total_skills == 0:
            metrics = SkillsMetrics(
                total_skills=0,
                categorized_skills=0,
                unique_categories=0,
                skills_score=0.0
            )
            return 0.0, metrics
        
        # Count categorized skills and unique categories
        categorized_skills = sum(1 for skill in resume.skills if skill.category)
        categories = set(skill.category for skill in resume.skills if skill.category)
        unique_categories = len(categories)
        
        # Calculate score
        score = 0.0
        
        # Points for skill count (up to 40)
        if total_skills >= 15:
            score += 40
        elif total_skills >= 10:
            score += 30
        elif total_skills >= 5:
            score += 20
        elif total_skills > 0:
            score += 10
        
        # Points for categorization rate (up to 30)
        categorization_rate = (categorized_skills / total_skills * 100)
        if categorization_rate >= 70:
            score += 30
        elif categorization_rate >= 50:
            score += 20
        elif categorization_rate >= 30:
            score += 10
        
        # Points for category diversity (up to 30)
        if unique_categories >= 5:
            score += 30
        elif unique_categories >= 3:
            score += 20
        elif unique_categories >= 2:
            score += 10
        
        # Industry-specific bonus for relevant technical skills
        if industry and industry in INDUSTRY_KEYWORDS:
            industry_skills = INDUSTRY_KEYWORDS[industry]['technical_skills']
            skill_names_lower = [skill.name.lower() for skill in resume.skills]
            
            # Check for industry keyword matches in skills and experience
            all_text = ' '.join(skill_names_lower + [resume.raw_text.lower()])
            
            matched_industry_skills = 0
            for ind_skill in industry_skills:
                if ind_skill in all_text:
                    matched_industry_skills += 1
            
            # Bonus up to 15 points for industry-relevant skills
            match_rate = (matched_industry_skills / len(industry_skills) * 100) if industry_skills else 0
            if match_rate >= 40:
                score += 15
            elif match_rate >= 25:
                score += 10
            elif match_rate >= 15:
                score += 5
        
        score = min(100.0, score)
        
        metrics = SkillsMetrics(
            total_skills=total_skills,
            categorized_skills=categorized_skills,
            unique_categories=unique_categories,
            skills_score=round(score, 1)
        )
        
        return score, metrics
    
    # ============================================
    # EXPERT MODE RULES
    # ============================================
    
    def _apply_expert_rules(self, resume: Resume, industry: Optional[str] = None) -> float:
        """
        Apply expert recruiter scoring adjustments (EXPERT mode only).
        
        Bonuses:
        - Quantified impact with % or metrics
        - Proper section ordering (summary → experience)
        - Certifications present
        - Industry-specific certifications (if industry specified)
        - Awards/achievements section
        
        Penalties:
        - Personal info that increases bias risk (photo, DOB, gender)
        - Inconsistent formatting
        
        Returns:
            Net adjustment (-20 to +20 points)
        """
        adjustment = 0.0
        
        # BONUS: Quantified achievements with impact metrics
        impact_patterns = [
            r'\d+%\s*(increase|decrease|improvement|growth|reduction)',
            r'(increased|decreased|improved|grew|reduced).*\d+%',
            r'\$[\d,]+\s*(revenue|savings|budget)',
            r'\d+[KMB]\s*(users|customers|transactions)',
        ]
        
        has_impact_metrics = False
        for exp in resume.experience:
            for bullet in exp.bullets:
                for pattern in impact_patterns:
                    if re.search(pattern, bullet, re.IGNORECASE):
                        has_impact_metrics = True
                        break
        
        if has_impact_metrics:
            adjustment += 5
        
        # BONUS: Has certifications
        if len(resume.certifications) > 0:
            adjustment += 3
            
            # Extra bonus for industry-specific certifications
            if industry and industry in INDUSTRY_KEYWORDS:
                industry_certs = INDUSTRY_KEYWORDS[industry]['certifications']
                cert_text = ' '.join([c.name.lower() if c.name else '' for c in resume.certifications])
                
                for cert in industry_certs:
                    if cert in cert_text:
                        adjustment += 4  # Significant bonus for relevant certification
                        break
        
        # BONUS: Proper section ordering (summary at top)
        if resume.summary:
            adjustment += 2
        
        # PENALTY: Personal info that may introduce bias
        bias_patterns = [
            r'\b(date\s+of\s+birth|dob|born\s+on)\b',
            r'\b(age|gender|male|female|married|single)\b',
            r'\b(nationality|religion|race)\b',
        ]
        
        raw_text_lower = resume.raw_text.lower()
        for pattern in bias_patterns:
            if re.search(pattern, raw_text_lower):
                adjustment -= 5
                break
        
        # PENALTY: No achievements at all
        total_quantified = 0
        for exp in resume.experience:
            for bullet in exp.bullets:
                if self._contains_quantification(bullet):
                    total_quantified += 1
        
        if total_quantified == 0 and len(resume.experience) > 0:
            adjustment -= 5
        
        return adjustment
    
    # ============================================
    # JOB MATCH SCORING
    # ============================================
    
    def _job_match_score(self, resume: Resume, job_description: str) -> float:
        """
        Calculate job match score based on keyword overlap.
        
        This is a placeholder implementation using basic keyword matching.
        TODO: Upgrade to semantic similarity with embeddings
        
        Args:
            resume: Parsed resume
            job_description: Job description text
            
        Returns:
            Job match score (0-100)
        """
        # Extract keywords from job description
        job_words = set(self.nlp_service.tokenize_words(job_description.lower()))
        job_words = {w for w in job_words if len(w) > 2}  # Filter short words
        
        if not job_words:
            return 50.0  # Default if no keywords
        
        # Extract keywords from resume
        resume_words = set(self.nlp_service.tokenize_words(resume.raw_text.lower()))
        
        # Add skills explicitly
        for skill in resume.skills:
            resume_words.add(skill.name.lower())
            if skill.normalized_name:
                resume_words.add(skill.normalized_name)
        
        # Calculate overlap
        common_words = job_words.intersection(resume_words)
        overlap_rate = len(common_words) / len(job_words) * 100
        
        # Scale to 0-100 (cap at 100)
        score = min(100.0, overlap_rate * 1.5)  # Boost factor
        
        return score
    
    # ============================================
    # WEIGHTED SCORE CALCULATION
    # ============================================
    
    def _calculate_weighted_score(
        self,
        mode: ScanMode,
        ats_score: float,
        readability_score: float,
        layout_score: float,
        experience_score: Optional[float],
        skills_score: Optional[float],
        weights: Dict[str, float]
    ) -> float:
        """Calculate weighted overall score based on mode."""
        
        if mode == ScanMode.BASIC:
            # BASIC mode: only ats, layout, readability
            overall = (
                ats_score * weights['ats_compliance'] +
                layout_score * weights['layout'] +
                readability_score * weights['readability']
            )
        else:
            # ATS/EXPERT modes: all components
            overall = (
                ats_score * weights['ats_compliance'] +
                (experience_score or 0) * weights['experience'] +
                (skills_score or 0) * weights['skills'] +
                readability_score * weights['readability'] +
                layout_score * weights['layout']
            )
        
        return overall
    
    # ============================================
    # STRUCTURE FLAG DETECTION
    # ============================================
    
    def _detect_structure_flags(self, raw_text: str) -> StructureFlags:
        """
        Detect structural issues in resume text.
        
        Looks for:
        - Table indicators
        - Image references
        - Column layouts
        - Headers/footers patterns
        - Image-only PDFs (very short text)
        """
        flags = StructureFlags()
        
        # Check for very short text (image-only PDF indicator)
        word_count = len(raw_text.split())
        if word_count < 20:
            flags.is_image_only_pdf = True
            return flags
        
        # Table detection patterns
        table_patterns = [
            r'\|\s*\w+\s*\|',  # | text |
            r'\t{2,}',         # Multiple tabs
            r'_{5,}',          # Underscores for table borders
        ]
        for pattern in table_patterns:
            if re.search(pattern, raw_text):
                flags.has_tables = True
                break
        
        # Image reference detection
        image_patterns = [
            r'\[image\]',
            r'\[photo\]',
            r'\[picture\]',
            r'\.jpg|\.png|\.gif',
        ]
        for pattern in image_patterns:
            if re.search(pattern, raw_text, re.IGNORECASE):
                flags.has_images = True
                break
        
        # Column detection (multiple spaces between words)
        if re.search(r'\s{5,}', raw_text):
            flags.has_columns = True
        
        # Estimate page count
        flags.page_count = max(1, round(word_count / 450))
        
        return flags
    
    # ============================================
    # FLAG EXTRACTION
    # ============================================
    
    def _extract_flags(
        self, 
        resume: Resume, 
        structure_flags: StructureFlags,
        mode: ScanMode
    ) -> List[str]:
        """
        Extract warning flags for resume issues.
        
        Returns list of warning strings.
        """
        flags = []
        
        # Critical issues
        if structure_flags.is_image_only_pdf:
            flags.append("⚠️ ATS cannot parse images - use text-based PDF")
        
        if not resume.contact.email:
            flags.append("⚠️ Missing contact email")
        
        if not resume.contact.phone:
            flags.append("⚠️ Missing phone number")
        
        # Formatting issues
        if structure_flags.has_tables:
            flags.append("⚠️ Tables may not parse correctly in ATS")
        
        if structure_flags.has_images:
            flags.append("⚠️ Images/photos may increase bias risk")
        
        if structure_flags.page_count > 2:
            flags.append("⚠️ Resume is longer than recommended (2 pages max)")
        
        # Content issues (ATS/EXPERT modes)
        if mode in (ScanMode.ATS, ScanMode.EXPERT):
            # Check for quantified achievements
            total_quantified = 0
            total_bullets = 0
            for exp in resume.experience:
                total_bullets += len(exp.bullets)
                for bullet in exp.bullets:
                    if self._contains_quantification(bullet):
                        total_quantified += 1
            
            if total_bullets > 0 and total_quantified == 0:
                flags.append("⚠️ No achievements quantified - add metrics and numbers")
            
            if not resume.summary:
                flags.append("⚠️ Missing professional summary")
            
            if len(resume.skills) < 5:
                flags.append("⚠️ Limited skills listed - consider adding more")
        
        # Expert mode: bias-inducing content
        if mode == ScanMode.EXPERT:
            bias_patterns = [
                (r'\b(date\s+of\s+birth|dob)\b', "⚠️ Personal info increases bias risk (date of birth)"),
                (r'\b(gender|male|female)\b', "⚠️ Personal info increases bias risk (gender)"),
                (r'\b(nationality|religion)\b', "⚠️ Personal info increases bias risk (nationality/religion)"),
            ]
            
            raw_lower = resume.raw_text.lower()
            for pattern, message in bias_patterns:
                if re.search(pattern, raw_lower):
                    flags.append(message)
        
        return flags
    
    # ============================================
    # COMMENT GENERATION
    # ============================================
    
    def _generate_comments(
        self,
        mode: ScanMode,
        ats_score: float,
        readability_score: float,
        layout_score: float,
        experience_score: Optional[float],
        skills_score: Optional[float],
        flags: List[str],
        resume: Resume,
        industry: Optional[str] = None
    ) -> List[str]:
        """Generate actionable improvement suggestions."""
        comments = []
        
        # ATS Compliance comments
        if ats_score < 70:
            if not resume.contact.email:
                comments.append("Add a professional email address for recruiter contact")
            if len(resume.experience) == 0:
                comments.append("Include work experience to strengthen your resume")
            if len(resume.skills) == 0:
                comments.append("Add a skills section with relevant keywords")
        
        # Readability comments
        if readability_score < 70:
            comments.append("Improve readability by shortening long sentences")
            comments.append("Use simpler language where possible")
        
        # Layout comments
        if layout_score < 70:
            word_count = len(resume.raw_text.split())
            if word_count < 300:
                comments.append("Resume is too short - add more detail to experience")
            elif word_count > 1500:
                comments.append("Consider condensing resume to 1-2 pages")
        
        # Industry-specific comments
        if industry and industry in INDUSTRY_KEYWORDS:
            industry_data = INDUSTRY_KEYWORDS[industry]
            
            # Check for industry-specific skills
            skill_names_lower = [skill.name.lower() for skill in resume.skills]
            all_text_lower = resume.raw_text.lower()
            
            matched_skills = sum(1 for skill in industry_data['technical_skills'] 
                               if skill in all_text_lower)
            
            if matched_skills < 3:
                industry_name = industry.replace('-', '/').title()
                comments.append(f"Add more {industry_name}-specific technical skills to match industry standards")
            
            # Check for industry-specific certifications
            cert_text = ' '.join([c.name.lower() if c.name else '' for c in resume.certifications])
            has_industry_cert = any(cert in cert_text for cert in industry_data['certifications'])
            
            if not has_industry_cert and len(resume.certifications) == 0:
                industry_name = industry.replace('-', '/').title()
                comments.append(f"Consider adding {industry_name}-relevant certifications to boost credibility")
        
        # Experience comments (ATS/EXPERT modes)
        if mode in (ScanMode.ATS, ScanMode.EXPERT) and experience_score is not None:
            if experience_score < 70:
                # Check specific issues
                total_quantified = sum(
                    1 for exp in resume.experience 
                    for bullet in exp.bullets 
                    if self._contains_quantification(bullet)
                )
                
                if total_quantified == 0:
                    comments.append("Add metrics to show real impact (e.g., 'Increased efficiency by 20%')")
                
                avg_bullets = sum(len(exp.bullets) for exp in resume.experience) / max(1, len(resume.experience))
                if avg_bullets < 3:
                    comments.append("Add 3-5 bullet points per role describing key achievements")
        
        # Skills comments (ATS/EXPERT modes)
        if mode in (ScanMode.ATS, ScanMode.EXPERT) and skills_score is not None:
            if skills_score < 70:
                if len(resume.skills) < 10:
                    comments.append("Add a skills section with more relevant keywords")
                comments.append("Include both technical and soft skills")
        
        # General best practices
        if not resume.summary:
            comments.append("Add a professional summary at the top of your resume")
        
        if len(resume.certifications) == 0 and mode == ScanMode.EXPERT:
            comments.append("Consider adding relevant certifications to stand out")
        
        # Ensure consistent bullet formatting
        if len(resume.experience) > 0:
            has_inconsistent_bullets = False
            for exp in resume.experience:
                if len(exp.bullets) > 0:
                    # Check if bullets start with different patterns
                    starts = set()
                    for bullet in exp.bullets[:3]:
                        first_word = bullet.split()[0] if bullet.split() else ""
                        # Check if starts with action verb (capitalized)
                        if first_word and first_word[0].isupper():
                            starts.add("action")
                        else:
                            starts.add("other")
                    if len(starts) > 1:
                        has_inconsistent_bullets = True
                        break
            
            if has_inconsistent_bullets:
                comments.append("Ensure consistent bullet formatting - start each with a strong action verb")
        
        # Limit to top 6 most important comments
        return comments[:6]


# ============================================
# SERVICE SINGLETON
# ============================================

_scoring_service: Optional[ScoringService] = None


def get_scoring_service() -> ScoringService:
    """Get or create scoring service singleton."""
    global _scoring_service
    if _scoring_service is None:
        _scoring_service = ScoringService()
    return _scoring_service
