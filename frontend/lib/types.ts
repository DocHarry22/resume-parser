export type ScanMode = 'basic' | 'ats' | 'expert';
export interface ContactInfo { email?: string; phone?: string; location?: string; linkedin?: string; github?: string; website?: string }
export interface ExperienceItem { job_title?: string; company?: string; location?: string; start_date?: string; end_date?: string; is_current: boolean; bullets: string[]; raw_text: string }
export interface EducationItem { degree?: string; field_of_study?: string; institution?: string; location?: string; graduation_year?: string; gpa?: string; honors?: string; raw_text: string }
export interface SkillItem { name: string; category?: string; normalized_name: string }
export interface ProjectItem { title?: string; description?: string; technologies: string[]; date?: string; url?: string; raw_text: string }
export interface CertificationItem { name: string; issuer?: string; date?: string; credential_id?: string; raw_text: string }
export interface Resume { name?: string; contact: ContactInfo; summary?: string; experience: ExperienceItem[]; education: EducationItem[]; skills: SkillItem[]; projects: ProjectItem[]; certifications: CertificationItem[]; languages: string[]; raw_text: string }
// Serialized ScoringService metrics are optional by mode and may be partial.
export interface ScoreDetailedMetrics {
  readability?: { flesch_reading_ease?: number; flesch_kincaid_grade?: number; avg_words_per_sentence?: number } | null;
  structure?: { has_contact?: boolean; has_summary?: boolean; has_experience?: boolean; has_education?: boolean; has_skills?: boolean } | null;
  layout?: { word_count?: number; estimated_pages?: number } | null;
  experience?: { total_roles?: number; avg_bullets_per_role?: number; quantified_achievements?: number; quantification_rate?: number } | null;
  skills?: { total_skills?: number; categorized_skills?: number; unique_categories?: number } | null;
}
export interface ResumeScore { overall: number; ats_compliance: number; readability: number; layout: number; experience: number | null; skills: number | null; job_match: number | null; comments: string[]; flags: string[]; mode: ScanMode; industry?: string; detailed_metrics?: ScoreDetailedMetrics | null }
export interface ParseAndScoreResponse { resume: Resume; score: ResumeScore }
