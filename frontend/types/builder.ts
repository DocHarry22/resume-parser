/**
 * TypeScript types for Resume Builder
 * Maps to backend builder_models.py
 */

export enum SectionType {
  CONTACT = 'contact',
  SUMMARY = 'summary',
  EXPERIENCE = 'experience',
  EDUCATION = 'education',
  SKILLS = 'skills',
  CERTIFICATIONS = 'certifications',
  PROJECTS = 'projects',
  ACHIEVEMENTS = 'achievements',
  LANGUAGES = 'languages',
  VOLUNTEER = 'volunteer',
  PUBLICATIONS = 'publications',
  REFERENCES = 'references',
}

export interface ContactInfo {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  photo?: string; // Base64 encoded image or URL
}

export interface ProfessionalSummary {
  summary: string;
}

export interface ExperienceEntry {
  company: string;
  position: string;
  location?: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description: string[];
  achievements: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field_of_study?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  gpa?: number;
  honors: string[];
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  github?: string;
  start_date?: string;
  end_date?: string;
  highlights: string[];
}

export interface ResumeBuilder {
  id?: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  contact?: ContactInfo;
  summary?: ProfessionalSummary;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillCategory[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
  achievements: string[];
  languages: Array<{ language: string; proficiency: string }>;
  volunteer: Array<Record<string, any>>;
  publications: Array<Record<string, any>>;
  custom_sections: Record<string, any>;
}

export enum FixType {
  LENGTH = 'length',
  SUMMARY = 'summary',
  READABILITY = 'readability',
  FORMATTING = 'formatting',
  QUANTIFICATION = 'quantification',
  CONTACT = 'contact',
  DATES = 'dates',
  BULLETS = 'bullets',
  KEYWORDS = 'keywords',
}

export enum FixAction {
  ADD = 'add',
  REMOVE = 'remove',
  MODIFY = 'modify',
  REFORMAT = 'reformat',
  SUGGEST = 'suggest',
}

export interface AutoFix {
  fix_type: FixType;
  action: FixAction;
  section: string;
  description: string;
  original_value?: any;
  suggested_value?: any;
  auto_applicable: boolean;
  metadata: Record<string, any>;
}

export interface AnalyzeResponse {
  success: boolean;
  resume_id: string;
  overall_score: number;
  fixes_count: number;
  fixes: AutoFix[];
}

export interface BuilderResponse {
  success: boolean;
  message: string;
  resume?: ResumeBuilder;
  errors?: Record<string, string[]>;
}
