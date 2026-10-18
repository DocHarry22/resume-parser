import { ResumeBuilder } from '@/types/builder';
import { isTemplateStyle } from './templateCatalog';
import type { ColorTheme, TemplateStyle } from './templateCatalog';

export const STORAGE_KEY = 'resume_studio_documents_v1';
export const THEME_COLORS: Record<ColorTheme, string> = { blue: '#2563eb', green: '#059669', purple: '#7c3aed', red: '#dc2626', orange: '#ea580c', teal: '#0d9488', gray: '#374151', indigo: '#4f46e5' };
export const SECTION_IDS = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'achievements', 'volunteer', 'publications', 'custom'] as const;
export type ContentSection = typeof SECTION_IDS[number];
export interface ResumeDesign {
  font: 'template' | 'sans' | 'serif' | 'mono';
  fontSize: number;
  lineHeight: number;
  spacing: number;
  pageSize: 'A4' | 'Letter';
  sectionOrder: ContentSection[];
  hiddenSections: ContentSection[];
}
export interface SavedResume {
  id: string;
  resume: ResumeBuilder;
  template: TemplateStyle;
  colorTheme: ColorTheme;
  design: ResumeDesign;
  updatedAt: string;
}
export const DEFAULT_DESIGN: ResumeDesign = {
  font: 'template', fontSize: 12, lineHeight: 1.5, spacing: 24, pageSize: 'A4',
  sectionOrder: [...SECTION_IDS], hiddenSections: [],
};
export const SECTION_LABELS: Record<ContentSection, string> = {
  summary: 'Professional summary', experience: 'Work experience', education: 'Education', skills: 'Skills',
  projects: 'Projects', certifications: 'Certifications', languages: 'Languages', achievements: 'Achievements',
  volunteer: 'Volunteering', publications: 'Publications', custom: 'Custom sections',
};
export function blankResume(): ResumeBuilder {
  return {
    title: 'Untitled resume', contact: { full_name: '', email: '' }, summary: { summary: '' },
    experience: [], education: [], skills: [], certifications: [], projects: [], achievements: [], languages: [],
    volunteer: [], publications: [], custom_sections: {},
  };
}
export function createDocument(): SavedResume {
  return { id: crypto.randomUUID(), resume: blankResume(), template: 'modern', colorTheme: 'blue',
    design: structuredClone(DEFAULT_DESIGN), updatedAt: new Date().toISOString() };
}
const record = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
const str = (value: unknown) => typeof value === 'string' ? value : '';
const lines = (value: unknown): string[] => Array.isArray(value) ? value.map(str).filter(Boolean) : str(value).split('\n').filter(Boolean);
const entries = (value: unknown): Record<string, any>[] => Array.isArray(value) ? value.filter(v => v && typeof v === 'object') : [];

/** Normalize file backups and parser output before they reach editable forms. */
export function normalizeResume(value: unknown): ResumeBuilder {
  const raw = record(value);
  if (!['title', 'contact', 'name', 'email', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'custom_sections'].some(key => Object.hasOwn(raw, key))) throw new Error('This file does not contain a recognised resume object. Choose a resume JSON backup.');
  const contact = record(raw.contact);
  const summary = typeof raw.summary === 'string' ? raw.summary : str(record(raw.summary).summary);
  return { ...blankResume(), title: str(raw.title) || 'Imported resume',
    contact: { full_name: str(contact.full_name || raw.name), email: str(contact.email || raw.email),
      phone: str(contact.phone || raw.phone), location: str(contact.location || raw.location), linkedin: str(contact.linkedin || raw.linkedin),
      github: str(contact.github || raw.github), website: str(contact.website || raw.website), photo: /^data:image\/(png|jpeg|webp);base64,/i.test(str(contact.photo || raw.photo)) ? str(contact.photo || raw.photo) : '' },
    summary: { summary },
    experience: entries(raw.experience).map(e => ({ company: str(e.company), position: str(e.position || e.job_title || e.title), location: str(e.location),
      start_date: str(e.start_date), end_date: str(e.end_date), current: Boolean(e.current || e.is_current), description: lines(e.description || e.bullets), achievements: lines(e.achievements || e.highlights) })),
    education: entries(raw.education).map(e => ({ institution: str(e.institution), degree: str(e.degree), field_of_study: str(e.field_of_study || e.field),
      location: str(e.location), start_date: str(e.start_date), end_date: str(e.end_date || e.graduation_date || e.graduation_year),
      gpa: e.gpa !== '' && e.gpa != null && Number.isFinite(Number(e.gpa)) ? Number(e.gpa) : undefined, honors: lines(e.honors || e.achievements) })),
    skills: (Array.isArray(raw.skills) ? raw.skills : []).map(s => typeof s === 'string' ? { category: 'Skills', skills: [s] } : { category: str(s?.category) || 'Skills', skills: Array.isArray(s?.skills) ? lines(s.skills) : [str(s?.name)].filter(Boolean) }),
    projects: entries(raw.projects).map(p => ({ name: str(p.name || p.title), description: str(p.description), technologies: lines(p.technologies), url: str(p.url), github: str(p.github), start_date: str(p.start_date || p.date), end_date: str(p.end_date), highlights: lines(p.highlights) })),
    certifications: entries(raw.certifications).map(c => ({ name: str(c.name), issuer: str(c.issuer), issue_date: str(c.issue_date || c.date), expiry_date: str(c.expiry_date || c.expiry), credential_id: str(c.credential_id), credential_url: str(c.credential_url || c.url) })),
    languages: (Array.isArray(raw.languages) ? raw.languages : []).map(l => typeof l === 'string' ? { language: l, proficiency: '' } : { language: str(l?.language || l?.name), proficiency: str(l?.proficiency) }),
    achievements: lines(raw.achievements), volunteer: entries(raw.volunteer), publications: entries(raw.publications), custom_sections: record(raw.custom_sections),
  };
}
export function normalizeDocument(value: unknown): SavedResume {
  const raw = record(value);
  const design = record(raw.design);
  const template = isTemplateStyle(raw.template) ? raw.template : 'modern';
  const colorTheme = ['blue', 'green', 'purple', 'red', 'orange', 'teal', 'gray', 'indigo'].includes(raw.colorTheme) ? raw.colorTheme : 'blue';
  const order = Array.isArray(design.sectionOrder) ? design.sectionOrder.filter((s: any) => SECTION_IDS.includes(s)) : [];
  return { id: str(raw.id) || crypto.randomUUID(), resume: normalizeResume(raw.resume || raw), template, colorTheme,
    design: { ...DEFAULT_DESIGN, font: ['template', 'sans', 'serif', 'mono'].includes(design.font) ? design.font : 'template',
      fontSize: Math.max(10, Math.min(16, Number(design.fontSize) || 12)), lineHeight: Math.max(1.2, Math.min(2, Number(design.lineHeight) || 1.5)),
      spacing: Math.max(12, Math.min(40, Number(design.spacing) || 24)), pageSize: design.pageSize === 'Letter' ? 'Letter' : 'A4',
      sectionOrder: Array.from(new Set([...order, ...SECTION_IDS])) as ContentSection[],
      hiddenSections: Array.isArray(design.hiddenSections) ? design.hiddenSections.filter((s: any) => SECTION_IDS.includes(s)) : [] },
    updatedAt: str(raw.updatedAt) || new Date().toISOString(),
  };
}
export function readDocuments(): SavedResume[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Saved resume library is unreadable. Export your current work before clearing browser data.');
  return parsed.map(normalizeDocument);
}
export function saveDocument(document: SavedResume): SavedResume {
  const saved = { ...document, updatedAt: new Date().toISOString() };
  const documents = readDocuments();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([saved, ...documents.filter(d => d.id !== saved.id)]));
  window.dispatchEvent(new Event('resume-library-change'));
  return saved;
}
