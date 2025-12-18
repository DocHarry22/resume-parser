/**
 * TypeScript types for Resume (legacy compatibility)
 * This provides types for the legacy builder components
 */

export interface Resume {
  id?: string;
  title?: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  photo?: string;
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  projects?: Project[];
  certifications?: Certification[];
  languages?: Language[];
}

export interface Experience {
  title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description: string;
  highlights: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  graduation_date?: string;
  gpa?: string;
  achievements?: string[];
  honors?: string;
  coursework?: string[];
}

export interface Skill {
  name: string;
  category?: string;
  level?: string;
  proficiency?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies?: string[];
  url?: string;
  github?: string;
  start_date?: string;
  end_date?: string;
  highlights?: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  expiry?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  url?: string;
}

export interface Language {
  name: string;
  proficiency: string;
}
