import { ApplicantDetails, ApplicationPreparation, localDate, readJobs, saveJobs, TrackedJob, validateApplicantDetails } from './careerWorkspace';
import { applicationTarget } from './jobSearch';
import { readDocuments } from '../components/resumeio/resumeDocument';
import { localDocx } from '../components/resumeio/localExport';
import { getLocalLetter, localLetterText } from './localCoverLetters';
import { exportLetterDocx } from './coverLetterExport';

export interface ApplicationFile { name: string; type: string; base64: string }
export interface ApplicationPacket { format: 'careerforge.application'; version: 1; id: string; revision: string; createdAt: string; expiresAt: string; url: string; role: string; company: string; profile: ApplicantDetails; reviewed: true; mode: 'review'; resume: ApplicationFile; coverLetter?: ApplicationFile; coverLetterText: string }
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
function currentJob(id: string) { const jobs = readJobs(), job = jobs.find(item => item.id === id); if (!job) throw new Error('That opportunity is no longer saved.'); return { jobs, job }; }
function writeJob(job: TrackedJob, jobs: TrackedJob[]) { saveJobs(jobs.map(item => item.id === job.id ? job : item)); return job; }
export function queueApplication(jobId: string, resumeId: string, letterId: string): TrackedJob {
  const { jobs, job } = currentJob(jobId);
  const target = applicationTarget(job.url); if (!target) throw new Error('Add a direct Greenhouse or Lever job link before using Auto Apply.');
  if (job.stage !== 'Saved' || job.appliedOn || job.application?.phase === 'submitted') throw new Error('This opportunity is already applied to or has moved beyond Saved. It will not be queued again.');
  if (jobs.some(other => other.id !== job.id && applicationTarget(other.url)?.url.toLowerCase() === target.url.toLowerCase() && (other.application || other.appliedOn || other.stage !== 'Saved'))) throw new Error('This same employer posting is already queued or has progressed in another tracker entry. Open that application instead of preparing a duplicate.');
  if (!readDocuments().some(document => document.id === resumeId)) throw new Error('Choose a saved resume for this application.');
  if (letterId) getLocalLetter(letterId);
  if (job.application && job.resumeId === resumeId && (job.letterId || '') === letterId && job.application.targetUrl === target.url) return job;
  const application: ApplicationPreparation = { revision: crypto.randomUUID(), phase: 'queued', targetUrl: target.url };
  return writeJob({ ...job, resumeId, letterId, application, updatedAt: new Date().toISOString() }, jobs);
}
export function removeQueuedApplication(jobId: string, expected: string) {
  const { jobs, job } = currentJob(jobId);
  if (job.application?.revision !== expected) throw new Error('This application changed in another tab. Review the latest queue entry.');
  if (job.application.phase === 'submitted') throw new Error('This application has already been recorded as submitted.');
  const { application, ...remaining } = job;
  return writeJob({ ...remaining, updatedAt: new Date().toISOString() }, jobs);
}
async function file(blob: Blob, name: string): Promise<ApplicationFile> {
  if (blob.size > 4 * 1024 * 1024) throw new Error('This document is larger than 4 MB. Reduce its size before preparing this application.');
  const bytes = new Uint8Array(await blob.arrayBuffer()); let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return { name: name.replace(/[^a-z0-9 ._-]/gi, '_').slice(0,150), type: DOCX, base64: btoa(binary) };
}
/** Builds documents locally; it never submits, fetches an ATS, or invents answers. */
export async function prepareApplication(jobId: string, expected: string, details: ApplicantDetails): Promise<ApplicationPacket> {
  const profile = validateApplicantDetails(details);
  const { job } = currentJob(jobId), entry = job.application;
  if (!entry || entry.revision !== expected) throw new Error('This application changed in another tab. Review it again before preparing.');
  if (job.stage !== 'Saved' || job.appliedOn || entry.phase === 'submitted') throw new Error('This application has already progressed. It will not be prepared again.');
  const target = applicationTarget(job.url);
  if (!target || target.url !== entry.targetUrl) throw new Error('The job URL changed. Update the queue entry and review the target before continuing.');
  const resume = readDocuments().find(item => item.id === job.resumeId);
  if (!resume) throw new Error('The selected resume is no longer saved. Choose another document.');
  const letter = job.letterId ? getLocalLetter(job.letterId) : undefined;
  const resumeFile = await file(await localDocx(resume), `${resume.resume.title || 'Resume'}.docx`);
  const coverLetterText = letter ? localLetterText(letter) : '';
  const coverLetter = letter ? await file(await exportLetterDocx(letter, coverLetterText), `${letter.title || 'Cover letter'}.docx`) : undefined;
  const latest = currentJob(jobId);
  if (latest.job.application?.revision !== expected || latest.job.resumeId !== job.resumeId || latest.job.letterId !== job.letterId || applicationTarget(latest.job.url)?.url !== target.url || latest.job.stage !== 'Saved' || latest.job.appliedOn || readDocuments().find(item => item.id === resume.id)?.updatedAt !== resume.updatedAt || (letter && getLocalLetter(letter.id).updated_at !== letter.updated_at)) throw new Error('The application or its documents changed while preparing. Review the latest details and try again.');
  const createdAt = new Date().toISOString(), revision = crypto.randomUUID();
  const packet: ApplicationPacket = { format: 'careerforge.application', version: 1, id: jobId, revision, createdAt, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), url: target.url, role: job.role, company: job.company, profile, reviewed: true, mode: 'review', resume: resumeFile, ...(coverLetter ? { coverLetter } : {}), coverLetterText };
  writeJob({ ...latest.job, application: { ...entry, revision, phase: 'prepared', profile, resumeUpdatedAt: resume.updatedAt, letterUpdatedAt: letter?.updated_at || '', preparedAt: createdAt, note: 'Documents prepared locally. Final submission still requires your review on the employer’s site.' }, updatedAt: createdAt }, latest.jobs);
  return packet;
}
export function recordHelperReview(jobId: string, revision: string, note: string) {
  const { jobs, job } = currentJob(jobId);
  if (!job.application || job.application.revision !== revision || job.application.phase !== 'prepared') return job;
  return writeJob({ ...job, application: { ...job.application, phase: 'review', note: note.slice(0,1000) }, updatedAt: new Date().toISOString() }, jobs);
}
/** Only the user's explicit confirmation changes the tracker to Applied. */
export function confirmApplicationSubmitted(jobId: string, revision: string, reference: string) {
  const { jobs, job } = currentJob(jobId), entry = job.application;
  if (!entry || entry.revision !== revision) throw new Error('This application changed in another tab. Review its latest state before confirming.');
  if (!['prepared', 'review'].includes(entry.phase) || applicationTarget(job.url)?.url !== entry.targetUrl) throw new Error('Prepare and review the actual application before recording a submission.');
  return writeJob({ ...job, stage: job.stage === 'Saved' ? 'Applied' : job.stage, appliedOn: job.appliedOn || localDate(), application: { ...entry, phase: 'submitted', note: `You confirmed submission on the employer’s site.${reference.trim() ? ` Reference: ${reference.trim().slice(0,500)}` : ''}` }, updatedAt: new Date().toISOString() }, jobs);
}

export function helperRequest(action: string, payload?: unknown, timeoutMs = 3500): Promise<any> {
  return new Promise((resolve,reject) => {
    const requestId = crypto.randomUUID();
    const listener = (event: MessageEvent) => { if (event.source !== window || event.origin !== location.origin || event.data?.channel !== 'careerforge-helper-response' || event.data.requestId !== requestId) return; clearTimeout(timer); window.removeEventListener('message', listener); if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.result); };
    const timer = setTimeout(() => { window.removeEventListener('message', listener); reject(new Error('The browser helper is not connected. Install it in Chrome or Edge, or download a reviewed application packet and import it through the helper.')); }, timeoutMs);
    window.addEventListener('message', listener); window.postMessage({ channel: 'careerforge-helper-request', requestId, action, payload }, location.origin);
  });
}
