import { readDocuments } from '../components/resumeio/resumeDocument';
import { readJobs, saveJobs, TrackedJob } from './careerWorkspace';
import { createLocalLetter, getLocalLetter } from './localCoverLetters';
import { defaultCoverLetter } from '../types/coverLetter';
import type { CoverLetter } from '../types/coverLetter';

export const APPLICATION_LETTER_STYLES = ['professional', 'modern', 'minimal', 'creative', 'executive', 'tech'] as const;
export interface LetterStart { resumeId: string; jobId: string; role: string; company: string; description: string; template: string; includeSummary: boolean }

/** Copy only supplied contact/target details; any summary is the user's verbatim text. */
export function startApplicationLetter(input: LetterStart): CoverLetter {
  if (!input.role.trim() || input.role.length > 150 || input.company.length > 150 || input.description.length > 30000 || !APPLICATION_LETTER_STYLES.includes(input.template as typeof APPLICATION_LETTER_STYLES[number])) throw new Error('Add a role of up to 150 characters, a company up to 150 and a description up to 30,000. Choose a supported style.');
  const resume = input.resumeId ? readDocuments().find(document => document.id === input.resumeId) : undefined;
  if (input.resumeId && !resume) throw new Error('That resume is no longer saved. Choose another resume or start without one.');
  const job = input.jobId ? readJobs().find(item => item.id === input.jobId) : undefined;
  if (input.jobId && !job) throw new Error('That application is no longer saved. Choose another opportunity or enter the job details.');
  const contact = resume?.resume.contact;
  const letter = structuredClone(defaultCoverLetter);
  const role = input.role.trim(), company = input.company.trim();
  letter.title = `${role}${company ? ` · ${company}` : ''} — cover letter`;
  letter.sender = { ...letter.sender, full_name: contact?.full_name || '', email: contact?.email || '', phone: contact?.phone || '', address: contact?.location || '', linkedin: contact?.linkedin || '', website: contact?.website || '' };
  letter.recipient.company = company;
  letter.job_details = { ...letter.job_details, job_title: role, company_name: company, job_description: input.description };
  letter.settings.template = input.template;
  letter.content.opening_paragraph = `I am writing to apply for the ${role} position${company ? ` at ${company}` : ''}.`;
  letter.content.body_paragraphs = [input.includeSummary ? resume?.resume.summary?.summary || '' : ''];
  letter.workspace_context = { resumeId: resume?.id || '', jobId: job?.id || '' };
  return createLocalLetter(letter);
}

/** Compare the selected slot, then reread/preserve every other current job field. */
export function linkApplicationLetter(jobId: string, letterId: string, expectedLetterId: string): TrackedJob {
  getLocalLetter(letterId);
  const jobs = readJobs();
  const job = jobs.find(item => item.id === jobId);
  if (!job) throw new Error('That application was removed. Your saved cover letter is still available.');
  if ((job.letterId || '') !== expectedLetterId && job.letterId !== letterId) throw new Error('This application’s cover letter changed in another tab. Review the latest attachment before replacing it.');
  const linked = { ...job, letterId, updatedAt: new Date().toISOString() };
  saveJobs(jobs.map(item => item.id === jobId ? linked : item));
  return linked;
}

export function unlinkApplicationLetter(jobId: string, expectedLetterId: string): TrackedJob {
  const jobs = readJobs();
  const job = jobs.find(item => item.id === jobId);
  if (!job) throw new Error('That application is no longer saved.');
  if ((job.letterId || '') !== expectedLetterId) throw new Error('This application’s cover letter changed in another tab. Review its latest attachment first.');
  const detached = { ...job, letterId: '', updatedAt: new Date().toISOString() };
  saveJobs(jobs.map(item => item.id === jobId ? detached : item));
  return detached;
}
