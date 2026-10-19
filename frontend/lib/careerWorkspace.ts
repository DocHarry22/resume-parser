export const JOB_STAGES = ['Saved', 'Applied', 'Interview', 'Offer', 'Closed'] as const;
export type JobStage = typeof JOB_STAGES[number];
export interface ApplicantDetails { firstName: string; lastName: string; email: string; phone: string; location: string; linkedin: string; website: string }
export interface ApplicationPreparation { revision: string; phase: 'queued' | 'prepared' | 'review' | 'submitted'; targetUrl: string; profile?: ApplicantDetails; resumeUpdatedAt?: string; letterUpdatedAt?: string; preparedAt?: string; note?: string }
export interface TrackedJob {
  id: string;
  company: string;
  role: string;
  url: string;
  stage: JobStage;
  appliedOn: string;
  followUpOn: string;
  notes: string;
  updatedAt: string;
  location?: string;
  salary?: string;
  description?: string;
  resumeId?: string;
  letterId?: string;
  application?: ApplicationPreparation;
}
export const JOB_STORAGE_KEY = 'resume-studio.jobs.v1';
export function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function validateJobs(value: unknown): TrackedJob[] {
  if (!Array.isArray(value) || value.length > 5000) throw new Error('Choose a valid job tracker backup with up to 5,000 jobs.');
  const ids = new Set<string>();
  return value.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid job in backup.');
    const job = item as Record<string, unknown>;
    const fields = ['id', 'company', 'role', 'url', 'stage', 'appliedOn', 'followUpOn', 'notes', 'updatedAt'];
    if (fields.some(key => typeof job[key] !== 'string') || !JOB_STAGES.includes(job.stage as JobStage) || !(job.id as string).trim() || !(job.company as string).trim() || !(job.role as string).trim()) throw new Error('The backup contains missing or invalid job details.');
    const limits: Record<string, number> = { id: 200, company: 150, role: 150, url: 2000, notes: 10000, updatedAt: 100, location: 200, salary: 200, description: 30000, resumeId: 200, letterId: 200 };
    for (const [key, maximum] of Object.entries(limits)) {
      if (job[key] !== undefined && (typeof job[key] !== 'string' || (job[key] as string).length > maximum)) throw new Error('The backup contains job details that exceed the supported limits.');
    }
    if (['appliedOn', 'followUpOn'].some(key => {
      const date = job[key] as string;
      if (!date) return false;
      return !/^(19|20|21)\d{2}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date;
    }) || !Number.isFinite(Date.parse(job.updatedAt as string))) throw new Error('The backup contains an invalid date.');
    if (job.url && !safeJobUrl(job.url as string)) throw new Error('The backup contains an invalid job listing URL.');
    if (ids.has(job.id as string)) throw new Error('The backup contains duplicate jobs.');
    ids.add(job.id as string);
    const optional = ['location', 'salary', 'description', 'resumeId', 'letterId'].filter(key => job[key] !== undefined);
    const result = Object.fromEntries([...fields, ...optional].map(key => [key, job[key]])) as unknown as TrackedJob;
    if (job.application !== undefined) {
      const entry = job.application as ApplicationPreparation;
      if (!entry || typeof entry !== 'object' || Array.isArray(entry) || typeof entry.revision !== 'string' || !entry.revision || entry.revision.length > 200 || !['queued', 'prepared', 'review', 'submitted'].includes(entry.phase) || typeof entry.targetUrl !== 'string' || entry.targetUrl.length > 2000 || !safeJobUrl(entry.targetUrl) || ['resumeUpdatedAt', 'letterUpdatedAt', 'preparedAt', 'note'].some(key => { const value = entry[key as keyof ApplicationPreparation]; return value !== undefined && (typeof value !== 'string' || value.length > (key === 'note' ? 1000 : 100)); })) throw new Error('The backup contains invalid application preparation details.');
      if (entry.profile !== undefined) validateApplicantDetails(entry.profile);
      result.application = { revision: entry.revision, phase: entry.phase, targetUrl: entry.targetUrl, ...(entry.profile ? { profile: entry.profile } : {}), ...Object.fromEntries(['resumeUpdatedAt', 'letterUpdatedAt', 'preparedAt', 'note'].filter(key => entry[key as keyof ApplicationPreparation] !== undefined).map(key => [key, entry[key as keyof ApplicationPreparation]])) };
    }
    return result;
  });
}
export function validateApplicantDetails(value: unknown): ApplicantDetails {
  const profile = value as ApplicantDetails;
  const bounds: Record<keyof ApplicantDetails, number> = { firstName: 100, lastName: 100, email: 254, phone: 100, location: 200, linkedin: 500, website: 500 };
  if (!profile || typeof profile !== 'object' || Array.isArray(profile) || Object.entries(bounds).some(([key,max]) => typeof profile[key as keyof ApplicantDetails] !== 'string' || profile[key as keyof ApplicantDetails].length > max) || !profile.firstName.trim() || !profile.lastName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) || [profile.linkedin, profile.website].some(url => url && !safeJobUrl(url))) throw new Error('Review your first name, last name, email and optional profile links before preparing this application.');
  return Object.fromEntries(Object.keys(bounds).map(key => [key, profile[key as keyof ApplicantDetails].trim()])) as unknown as ApplicantDetails;
}
export function readJobs() { return validateJobs(JSON.parse(localStorage.getItem(JOB_STORAGE_KEY) || '[]')); }
export function saveJobs(jobs: TrackedJob[]) { validateJobs(jobs); localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(jobs)); window.dispatchEvent(new Event('career-jobs-change')); }
export function safeJobUrl(url: string) {
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null; } catch { return null; }
}
export function downloadText(text: string, filename: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
