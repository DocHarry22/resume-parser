import { apiRequest, apiFetch, jsonBody } from './apiConfig';
import type { CoverLetter, CoverLetterTemplate, AIContentRequest, AIContentResponse } from '@/types/coverLetter';
const base = '/api/cover-letters';
const item = (id: string) => `${base}/${encodeURIComponent(id)}`;
export const listCoverLetters = (): Promise<CoverLetter[]> => apiRequest(base);
export const getCoverLetters = listCoverLetters;
export const getCoverLetter = (id: string): Promise<CoverLetter> => apiRequest(item(id));
export const getTemplates = (): Promise<CoverLetterTemplate[]> => apiRequest(`${base}/templates`);
export async function createCoverLetter(value: string | Partial<CoverLetter> = 'My Cover Letter', template = 'professional', linkedResumeId?: string): Promise<CoverLetter> {
  const title = typeof value === 'string' ? value : value.title || 'My Cover Letter';
  const created = await apiRequest<CoverLetter>(base, { method: 'POST', ...jsonBody({ title, template: typeof value === 'object' ? value.settings?.template || template : template, linked_resume_id: typeof value === 'object' ? value.linked_resume_id : linkedResumeId }) });
  if (typeof value === 'string') return created;
  try { return await updateCoverLetter(created.id, {...value, id: created.id}); }
  catch (error) { await deleteCoverLetter(created.id).catch(() => undefined); throw error; }
}
export const updateCoverLetter = (id: string, data: Partial<CoverLetter>): Promise<CoverLetter> => apiRequest(item(id), { method: 'PUT', ...jsonBody(data) });
export const deleteCoverLetter = (id: string): Promise<unknown> => apiRequest(item(id), { method: 'DELETE' });
export const duplicateCoverLetter = (id: string): Promise<CoverLetter> => apiRequest(`${item(id)}/duplicate`, { method: 'POST' });
export const generateContent = (data: AIContentRequest): Promise<AIContentResponse> => apiRequest(`${base}/ai/generate`, { method: 'POST', ...jsonBody(data) });
export const createFromResume = (id: string, jobTitle = '', companyName = ''): Promise<CoverLetter> => apiRequest(`${base}/from-resume/${encodeURIComponent(id)}?job_title=${encodeURIComponent(jobTitle)}&company_name=${encodeURIComponent(companyName)}`, { method: 'POST' });
export async function exportCoverLetter(id: string, format: 'pdf' | 'docx' | 'txt', template?: string): Promise<Blob> {
  const response = await apiFetch(`${item(id)}/export`, { method: 'POST', ...jsonBody({format, template}) });
  if (!response.ok) throw new Error('Unable to export this cover letter. Please try again.');
  return response.blob();
}
export async function exportCoverLetterData(letter: CoverLetter, format: 'pdf' | 'docx' | 'txt'): Promise<Blob> {
  const response = await apiFetch(`${base}/export-data?format=${format}`, { method: 'POST', ...jsonBody(letter) });
  if (!response.ok) throw new Error('The export service is unavailable. Please try again or use Print / Save as PDF.');
  return response.blob();
}
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = filename.replace(/[<>:"/\\|?*]/g, '_');
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
