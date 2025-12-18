/**
 * Section Types for Resume/CV/Cover Letter Builder
 * Defines all section content structures
 */

// Section types
export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'publications'
  | 'certifications'
  | 'paragraph';

// Base section interface
export interface BaseSection {
  id: string;
  type: SectionType;
  order: number;
  isVisible: boolean;
  title?: string; // Custom title override
}

// Summary section
export interface SummarySection extends BaseSection {
  type: 'summary';
  content: {
    text: string;
    highlights?: string[];
  };
}

// Experience entry
export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
  achievements?: string[];
}

// Experience section
export interface ExperienceSection extends BaseSection {
  type: 'experience';
  content: {
    entries: ExperienceEntry[];
  };
}

// Education entry
export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string[];
  coursework?: string[];
}

// Education section
export interface EducationSection extends BaseSection {
  type: 'education';
  content: {
    entries: EducationEntry[];
  };
}

// Skill category
export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

// Skills section
export interface SkillsSection extends BaseSection {
  type: 'skills';
  content: {
    categories: SkillCategory[];
    displayStyle: 'grouped' | 'inline' | 'bars';
  };
}

// Project entry
export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

// Projects section
export interface ProjectsSection extends BaseSection {
  type: 'projects';
  content: {
    entries: ProjectEntry[];
  };
}

// Publication entry
export interface PublicationEntry {
  id: string;
  title: string;
  authors: string[];
  publication: string;
  date: string;
  doi?: string;
  url?: string;
  abstract?: string;
}

// Publications section
export interface PublicationsSection extends BaseSection {
  type: 'publications';
  content: {
    entries: PublicationEntry[];
  };
}

// Certification entry
export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

// Certifications section
export interface CertificationsSection extends BaseSection {
  type: 'certifications';
  content: {
    entries: CertificationEntry[];
  };
}

// Paragraph section (for cover letters)
export interface ParagraphSection extends BaseSection {
  type: 'paragraph';
  content: {
    text: string;
    style: 'opening' | 'body' | 'closing';
  };
}

// Union type for all sections
export type Section =
  | SummarySection
  | ExperienceSection
  | EducationSection
  | SkillsSection
  | ProjectsSection
  | PublicationsSection
  | CertificationsSection
  | ParagraphSection;

// Section metadata
export interface SectionMeta {
  type: SectionType;
  name: string;
  icon: string;
  description: string;
  maxEntries?: number;
  isRepeatable: boolean;
}

// Section metadata configuration
export const SECTION_META: Record<SectionType, SectionMeta> = {
  summary: {
    type: 'summary',
    name: 'Professional Summary',
    icon: 'FileText',
    description: 'A brief overview of your professional background',
    isRepeatable: false,
  },
  experience: {
    type: 'experience',
    name: 'Work Experience',
    icon: 'Briefcase',
    description: 'Your professional work history',
    maxEntries: 10,
    isRepeatable: false,
  },
  education: {
    type: 'education',
    name: 'Education',
    icon: 'GraduationCap',
    description: 'Your academic background',
    maxEntries: 5,
    isRepeatable: false,
  },
  skills: {
    type: 'skills',
    name: 'Skills',
    icon: 'Wrench',
    description: 'Your technical and soft skills',
    isRepeatable: false,
  },
  projects: {
    type: 'projects',
    name: 'Projects',
    icon: 'FolderKanban',
    description: 'Notable projects and work samples',
    maxEntries: 8,
    isRepeatable: false,
  },
  publications: {
    type: 'publications',
    name: 'Publications',
    icon: 'BookOpen',
    description: 'Academic papers and publications',
    maxEntries: 20,
    isRepeatable: false,
  },
  certifications: {
    type: 'certifications',
    name: 'Certifications',
    icon: 'Award',
    description: 'Professional certifications and licenses',
    maxEntries: 10,
    isRepeatable: false,
  },
  paragraph: {
    type: 'paragraph',
    name: 'Paragraph',
    icon: 'AlignLeft',
    description: 'Free-form text paragraph',
    isRepeatable: true,
  },
};

// Create empty section content
export function createEmptySection(type: SectionType, order: number): Section {
  const id = `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const base = { id, type, order, isVisible: true };

  switch (type) {
    case 'summary':
      return { ...base, type: 'summary', content: { text: '', highlights: [] } };
    case 'experience':
      return { ...base, type: 'experience', content: { entries: [] } };
    case 'education':
      return { ...base, type: 'education', content: { entries: [] } };
    case 'skills':
      return { ...base, type: 'skills', content: { categories: [], displayStyle: 'grouped' } };
    case 'projects':
      return { ...base, type: 'projects', content: { entries: [] } };
    case 'publications':
      return { ...base, type: 'publications', content: { entries: [] } };
    case 'certifications':
      return { ...base, type: 'certifications', content: { entries: [] } };
    case 'paragraph':
      return { ...base, type: 'paragraph', content: { text: '', style: 'body' } };
  }
}

// Create empty entry helpers
export function createEmptyExperienceEntry(): ExperienceEntry {
  return {
    id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    bullets: [''],
  };
}

export function createEmptyEducationEntry(): EducationEntry {
  return {
    id: `edu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    degree: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
  };
}

export function createEmptyProjectEntry(): ProjectEntry {
  return {
    id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    description: '',
    technologies: [],
    bullets: [''],
  };
}

export function createEmptyPublicationEntry(): PublicationEntry {
  return {
    id: `pub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: '',
    authors: [],
    publication: '',
    date: '',
  };
}

export function createEmptyCertificationEntry(): CertificationEntry {
  return {
    id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    issuer: '',
    date: '',
  };
}

export function createEmptySkillCategory(): SkillCategory {
  return {
    id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    skills: [],
  };
}
