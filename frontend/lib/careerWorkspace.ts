export const JOB_STAGES = ['Saved', 'Applied', 'Interview', 'Offer', 'Closed'] as const;
export type JobStage = typeof JOB_STAGES[number];
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
    if (['appliedOn', 'followUpOn'].some(key => job[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(job[key] as string) || !Number.isFinite(Date.parse(job[key] as string))))) throw new Error('The backup contains an invalid date.');
    if (ids.has(job.id as string)) throw new Error('The backup contains duplicate jobs.');
    ids.add(job.id as string);
    return Object.fromEntries(fields.map(key => [key, job[key]])) as unknown as TrackedJob;
  });
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
