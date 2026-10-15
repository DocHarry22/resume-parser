import { apiRequest, apiFetch, jsonBody } from './apiConfig';
import type { ScanMode, ParseAndScoreResponse, Resume } from './types';
import type { ResumeBuilder, BuilderResponse, AnalyzeResponse, AutoFix } from '@/types/builder';

const documentPath = (id: string) => `/api/builder/${encodeURIComponent(id)}`;
export async function parseAndScoreResume(file: File, mode: ScanMode = 'basic', jobDescription?: string, industry?: string): Promise<ParseAndScoreResponse> {
  const form = new FormData(); form.set('file', file);
  if (jobDescription) form.set('job_description', jobDescription);
  if (industry) form.set('industry', industry);
  return apiRequest(`/api/parse-and-score?mode=${mode}`, { method: 'POST', body: form });
}
export function parseResume(file: File): Promise<Resume> {
  const form = new FormData(); form.set('file', file);
  return apiRequest('/api/parse-resume', { method: 'POST', body: form });
}
export function importResume(file: File): Promise<BuilderResponse> {
  const form = new FormData(); form.set('file', file);
  return apiRequest('/api/builder/import', { method: 'POST', body: form });
}
export function createResume(title = 'My Resume'): Promise<BuilderResponse> {
  const form = new FormData(); form.set('title', title);
  return apiRequest('/api/builder/create', { method: 'POST', body: form });
}
export const getResume = (id: string): Promise<BuilderResponse> => apiRequest(documentPath(id));
export const updateResume = (id: string, data: Partial<ResumeBuilder>): Promise<BuilderResponse> => apiRequest(documentPath(id), { method: 'PATCH', ...jsonBody(data) });
export const saveResume = (id: string): Promise<{success: boolean; message: string}> => apiRequest(`${documentPath(id)}/save`, { method: 'POST' });
export const deleteResume = (id: string): Promise<{success: boolean}> => apiRequest(documentPath(id), { method: 'DELETE' });
export const listResumes = (): Promise<{resumes: ResumeBuilder[]}> => apiRequest('/api/builder/list/all');
const scanForm = (mode: ScanMode, industry: string): FormData => { const form = new FormData(); form.set('mode', mode); form.set('industry', industry); return form; };
export const analyzeResume = (id: string, mode: ScanMode = 'expert', industry = 'default'): Promise<AnalyzeResponse> => apiRequest(`${documentPath(id)}/analyze`, { method: 'POST', body: scanForm(mode, industry) });
export const applyAutoFix = (id: string, fix: AutoFix): Promise<BuilderResponse> => apiRequest(`${documentPath(id)}/apply-fix`, { method: 'POST', ...jsonBody(fix) });
export const applyAllAutoFixes = (id: string, mode: ScanMode = 'expert', industry = 'default'): Promise<BuilderResponse> => apiRequest(`${documentPath(id)}/apply-all-fixes`, { method: 'POST', body: scanForm(mode, industry) });
export async function exportResumeText(id: string): Promise<{success: boolean; text: string}> {
  const response = await apiFetch(`${documentPath(id)}/export/text`);
  if (!response.ok) throw new Error('Unable to export this resume.');
  const value = await response.json();
  return { success: true, text: typeof value === 'string' ? value : value.text };
}
