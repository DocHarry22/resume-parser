/**
 * Document Types for Resume/CV/Cover Letter Builder
 * Core data model supporting all document variants
 */

import { Section, SectionType } from './sections';

// Document variant types
export type DocumentVariant = 'resume' | 'cv' | 'cover_letter';

// Layout options
export type LayoutType = 'one_column' | 'two_column';

// Design configuration
export interface DocumentDesign {
  font: FontFamily;
  color: ColorScheme;
  layout: LayoutType;
  fontSize: FontSize;
  spacing: SpacingSize;
}

// Font family options
export type FontFamily = 
  | 'inter'
  | 'roboto'
  | 'open-sans'
  | 'lato'
  | 'merriweather'
  | 'playfair'
  | 'source-serif';

// Color scheme options
export type ColorScheme = 
  | 'professional'   // Navy/Dark Blue
  | 'modern'         // Slate/Gray
  | 'creative'       // Teal/Cyan
  | 'elegant'        // Burgundy/Wine
  | 'minimal'        // Black/White
  | 'corporate';     // Dark Blue/Gold

// Font size options
export type FontSize = 'small' | 'medium' | 'large';

// Spacing options
export type SpacingSize = 'compact' | 'normal' | 'relaxed';

// Contact information
export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  github?: string;
}

// Main document data structure
export interface DocumentData {
  id: string;
  variant: DocumentVariant;
  template_id: string;
  title: string;
  contact: ContactInfo;
  sections: Section[];
  design: DocumentDesign;
  metadata: DocumentMetadata;
  createdAt: string;
  updatedAt: string;
}

// Document metadata
export interface DocumentMetadata {
  targetRole?: string;
  targetCompany?: string;
  industry?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  lastExported?: string;
  atsScore?: number;
  wordCount?: number;
  pageCount?: number;
}

// Template definition
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  variant: DocumentVariant;
  thumbnail: string;
  design: DocumentDesign;
  defaultSections: SectionType[];
  isPremium: boolean;
}

// Validation warning
export interface ValidationWarning {
  id: string;
  type: 'error' | 'warning' | 'info';
  section?: string;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
}

// Export options
export interface ExportOptions {
  format: 'pdf' | 'docx' | 'txt';
  includeMetadata: boolean;
  atsOptimized: boolean;
}

// Default design settings
export const DEFAULT_DESIGN: DocumentDesign = {
  font: 'inter',
  color: 'professional',
  layout: 'one_column',
  fontSize: 'medium',
  spacing: 'normal',
};

// Default contact info
export const DEFAULT_CONTACT: ContactInfo = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
};

// Variant configurations
export const VARIANT_CONFIG: Record<DocumentVariant, {
  name: string;
  description: string;
  maxPages: number;
  requiredSections: SectionType[];
  allowedSections: SectionType[];
  defaultSections: SectionType[];
}> = {
  resume: {
    name: 'Resume',
    description: 'Concise 1-2 page professional summary',
    maxPages: 2,
    requiredSections: ['summary', 'experience'],
    allowedSections: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
    defaultSections: ['summary', 'experience', 'skills', 'education'],
  },
  cv: {
    name: 'Curriculum Vitae',
    description: 'Comprehensive academic and professional history',
    maxPages: 10,
    requiredSections: ['summary'],
    allowedSections: ['summary', 'experience', 'education', 'skills', 'projects', 'publications', 'certifications'],
    defaultSections: ['summary', 'education', 'publications', 'experience', 'skills'],
  },
  cover_letter: {
    name: 'Cover Letter',
    description: 'Personalized application letter',
    maxPages: 1,
    requiredSections: ['paragraph'],
    allowedSections: ['paragraph'],
    defaultSections: ['paragraph', 'paragraph', 'paragraph'],
  },
};

// Color scheme values
export const COLOR_SCHEMES: Record<ColorScheme, { primary: string; secondary: string; accent: string }> = {
  professional: { primary: '#1e3a5f', secondary: '#2c5282', accent: '#3182ce' },
  modern: { primary: '#1a202c', secondary: '#4a5568', accent: '#718096' },
  creative: { primary: '#0d9488', secondary: '#14b8a6', accent: '#2dd4bf' },
  elegant: { primary: '#7c2d12', secondary: '#9a3412', accent: '#c2410c' },
  minimal: { primary: '#000000', secondary: '#374151', accent: '#6b7280' },
  corporate: { primary: '#1e3a8a', secondary: '#1d4ed8', accent: '#d97706' },
};

// Font configurations
export const FONT_CONFIG: Record<FontFamily, { name: string; className: string; stack: string }> = {
  'inter': { name: 'Inter', className: 'font-inter', stack: 'Inter, sans-serif' },
  'roboto': { name: 'Roboto', className: 'font-roboto', stack: 'Roboto, sans-serif' },
  'open-sans': { name: 'Open Sans', className: 'font-opensans', stack: '"Open Sans", sans-serif' },
  'lato': { name: 'Lato', className: 'font-lato', stack: 'Lato, sans-serif' },
  'merriweather': { name: 'Merriweather', className: 'font-merriweather', stack: 'Merriweather, serif' },
  'playfair': { name: 'Playfair Display', className: 'font-playfair', stack: '"Playfair Display", serif' },
  'source-serif': { name: 'Source Serif Pro', className: 'font-source-serif', stack: '"Source Serif Pro", serif' },
};
