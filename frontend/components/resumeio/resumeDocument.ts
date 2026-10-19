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
export interface ResumeSnapshot {
  id: string;
  resume: ResumeBuilder;
  template: TemplateStyle;
  colorTheme: ColorTheme;
  design: ResumeDesign;
  updatedAt: string;
  tailoring?: ResumeTarget;
}
export interface SavedResume extends ResumeSnapshot { versions?: ResumeVersion[] }
export interface ResumeVersion {
  id: string;
  label: string;
  createdAt: string;
  kind: 'checkpoint' | 'before-restore';
  snapshot: ResumeSnapshot;
}
export const MAX_RESUME_VERSIONS = 20;
export interface ResumeTarget {
  sourceResumeId: string;
  jobId: string;
  role: string;
  company: string;
  description: string;
  terms: string[];
}
export function normalizeTarget(value: unknown): ResumeTarget | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const target = value as Record<string, unknown>;
  const bounds: Record<string, number> = { sourceResumeId: 200, jobId: 200, role: 150, company: 150, description: 30000 };
  if (Object.entries(bounds).some(([key, max]) => typeof target[key] !== 'string' || (target[key] as string).length > max)) return;
  if (!(target.sourceResumeId as string).trim() || !(target.role as string).trim() || !(target.description as string).trim()) return;
  if (!Array.isArray(target.terms) || target.terms.length > 60 || target.terms.some(term => typeof term !== 'string' || !term.trim() || term.length > 80)) return;
  const terms = [...new Map((target.terms as string[]).map(term => [term.trim().toLocaleLowerCase(), term.trim()])).values()];
  return { sourceResumeId: target.sourceResumeId as string, jobId: target.jobId as string, role: (target.role as string).trim(), company: (target.company as string).trim(), description: target.description as string, terms };
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
function normalizeSnapshot(value: unknown): ResumeSnapshot {
  const raw = record(value);
  const tailoring = normalizeTarget(raw.tailoring);
  const design = record(raw.design);
  const template = isTemplateStyle(raw.template) ? raw.template : 'modern';
  const colorTheme = ['blue', 'green', 'purple', 'red', 'orange', 'teal', 'gray', 'indigo'].includes(raw.colorTheme) ? raw.colorTheme : 'blue';
  const order = Array.isArray(design.sectionOrder) ? design.sectionOrder.filter((s: any) => SECTION_IDS.includes(s)) : [];
  return { id: str(raw.id) || crypto.randomUUID(), resume: normalizeResume(raw.resume || raw), template, colorTheme,
    ...(tailoring ? { tailoring } : {}),
    design: { ...DEFAULT_DESIGN, font: ['template', 'sans', 'serif', 'mono'].includes(design.font) ? design.font : 'template',
      fontSize: Math.max(10, Math.min(16, Number(design.fontSize) || 12)), lineHeight: Math.max(1.2, Math.min(2, Number(design.lineHeight) || 1.5)),
      spacing: Math.max(12, Math.min(40, Number(design.spacing) || 24)), pageSize: design.pageSize === 'Letter' ? 'Letter' : 'A4',
      sectionOrder: Array.from(new Set([...order, ...SECTION_IDS])) as ContentSection[],
      hiddenSections: Array.isArray(design.hiddenSections) ? design.hiddenSections.filter((s: any) => SECTION_IDS.includes(s)) : [] },
    updatedAt: str(raw.updatedAt) || new Date().toISOString(),
  };
}
function normalizeVersions(value: unknown, documentId: string): ResumeVersion[] | undefined {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > MAX_RESUME_VERSIONS) throw new Error('Saved version history is unreadable or exceeds 20 checkpoints. Existing data has been kept.');
  const ids = new Set<string>();
  return value.map(item => {
    const version = record(item);
    if (typeof version.id !== 'string' || !version.id.trim() || version.id.length > 200 || ids.has(version.id) || typeof version.label !== 'string' || !version.label.trim() || version.label.length > 100 || typeof version.createdAt !== 'string' || version.createdAt.length > 100 || !Number.isFinite(Date.parse(version.createdAt)) || !['checkpoint', 'before-restore'].includes(version.kind) || !version.snapshot || typeof version.snapshot !== 'object' || Array.isArray(version.snapshot)) throw new Error('A saved checkpoint could not be read. Existing data has been kept.');
    ids.add(version.id);
    return { id: version.id, label: version.label.trim(), createdAt: version.createdAt, kind: version.kind, snapshot: { ...normalizeSnapshot(version.snapshot), id: documentId } };
  });
}
export function normalizeDocument(value: unknown): SavedResume {
  const snapshot = normalizeSnapshot(value);
  const versions = normalizeVersions(record(value).versions, snapshot.id);
  return { ...snapshot, ...(versions !== undefined ? { versions } : {}) };
}
export function readDocuments(): SavedResume[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Saved resume library is unreadable. Export your current work before clearing browser data.');
  return parsed.map(normalizeDocument);
}
export function saveDocument(document: SavedResume, options: { replaceVersions?: boolean; expectedState?: string } = {}): SavedResume {
  const documents = readDocuments();
  const current = documents.find(item => item.id === document.id);
  if (current && options.expectedState !== undefined && resumeStateKey(current) !== options.expectedState && resumeStateKey(current) !== resumeStateKey(document)) throw new Error('This resume changed in another tab. Download a backup of your draft or load the latest saved version before continuing.');
  // An editor opened before a new checkpoint must never erase the newer history.
  const versions = normalizeVersions(!options.replaceVersions && current?.versions !== undefined ? current.versions : document.versions, document.id);
  const saved = { ...document, ...(versions !== undefined ? { versions } : {}), updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([saved, ...documents.filter(d => d.id !== saved.id)]));
  window.dispatchEvent(new Event('resume-library-change'));
  return saved;
}

/** One library write creates an independent version; no other document is edited. */
export function createTailoredDocument(sourceId: string, target: Omit<ResumeTarget, 'sourceResumeId'>): SavedResume {
  const context = normalizeTarget({ ...target, sourceResumeId: sourceId });
  if (!context) throw new Error('Add a role, a job description and up to 60 terms of 80 characters or fewer.');
  const source = readDocuments().find(document => document.id === sourceId);
  if (!source) throw new Error('That resume is no longer in this browser. Choose another saved resume.');
  const copy: SavedResume = { ...structuredClone(source), id: crypto.randomUUID(), versions: [], tailoring: context,
    resume: { ...structuredClone(source.resume), title: `${context.role}${context.company ? ` · ${context.company}` : ''} (tailored)` } };
  return saveDocument(copy);
}

export function saveResumeTarget(documentId: string, target: ResumeTarget, expected: string): SavedResume {
  const context = normalizeTarget(target);
  if (!context) throw new Error('Add a role, a job description and up to 60 terms of 80 characters or fewer.');
  const current = readDocuments().find(document => document.id === documentId);
  if (!current) throw new Error('That resume is no longer in this browser. Choose another saved resume.');
  if (JSON.stringify(current.tailoring || null) !== expected) throw new Error('The target changed in another tab. Choose the resume again to load its latest details before saving.');
  return saveDocument({ ...current, tailoring: context });
}

/** Content/design identity excludes timestamps and the history itself. */
export function resumeStateKey(document: ResumeSnapshot): string {
  const snapshot = normalizeSnapshot(document);
  return JSON.stringify({ resume: snapshot.resume, template: snapshot.template, colorTheme: snapshot.colorTheme, design: snapshot.design, tailoring: snapshot.tailoring || null });
}
function requiredDocument(documentId: string): SavedResume {
  const document = readDocuments().find(item => item.id === documentId);
  if (!document) throw new Error('That resume is no longer saved in this browser.');
  return document;
}
function makeVersion(document: SavedResume, label: string, kind: ResumeVersion['kind']): ResumeVersion {
  if (!label.trim() || label.length > 100) throw new Error('Give this checkpoint a name of up to 100 characters.');
  return { id: crypto.randomUUID(), label: label.trim(), createdAt: new Date().toISOString(), kind, snapshot: structuredClone(normalizeSnapshot(document)) };
}
export function checkpointResume(documentId: string, label: string): SavedResume {
  const document = requiredDocument(documentId);
  const versions = document.versions || [];
  if (versions.length >= MAX_RESUME_VERSIONS) throw new Error('This resume has 20 checkpoints. Download a backup and remove a checkpoint to make room.');
  return saveDocument({ ...document, versions: [makeVersion(document, label, 'checkpoint'), ...versions] }, { replaceVersions: true });
}
export function restoreResumeVersion(documentId: string, versionId: string, expectedState: string): SavedResume {
  const current = requiredDocument(documentId);
  const versions = current.versions || [];
  const version = versions.find(item => item.id === versionId);
  if (!version) throw new Error('That checkpoint is no longer available. Choose another one.');
  if (resumeStateKey(current) !== expectedState) throw new Error('This resume changed in another tab. Review the latest draft before restoring.');
  if (resumeStateKey(current) === resumeStateKey(version.snapshot)) throw new Error('This checkpoint already matches your current draft.');
  if (versions.length >= MAX_RESUME_VERSIONS) throw new Error('Make room for a safety checkpoint before restoring. Download a backup and remove a checkpoint, or open this checkpoint as a new copy.');
  const safety = makeVersion(current, `Before restore · ${version.label}`.slice(0, 100), 'before-restore');
  return saveDocument({ ...structuredClone(version.snapshot), id: current.id, versions: [safety, ...versions] }, { replaceVersions: true, expectedState });
}
export function deleteResumeVersion(documentId: string, versionId: string): SavedResume {
  const current = requiredDocument(documentId);
  if (!current.versions?.some(item => item.id === versionId)) throw new Error('That checkpoint was already removed.');
  return saveDocument({ ...current, versions: current.versions.filter(item => item.id !== versionId) }, { replaceVersions: true });
}
export function copyResumeVersion(documentId: string, versionId: string): SavedResume {
  const current = requiredDocument(documentId);
  const version = current.versions?.find(item => item.id === versionId);
  if (!version) throw new Error('That checkpoint is no longer available.');
  return saveDocument({ ...structuredClone(version.snapshot), id: crypto.randomUUID(), versions: [], resume: { ...structuredClone(version.snapshot.resume), title: `${version.snapshot.resume.title} (restored copy)` } });
}
