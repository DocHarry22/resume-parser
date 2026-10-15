import { apiRequest, apiFetch, jsonBody, IS_LOCAL_STORAGE } from './apiConfig';
import type { CoverLetter, CoverLetterTemplate, AIContentRequest, AIContentResponse } from '@/types/coverLetter';
import { createLocalLetter, deleteLocalLetter, duplicateLocalLetter, getLocalLetter, localLetterText, readLocalLetters, updateLocalLetter } from './localCoverLetters';
const base = '/api/cover-letters';
const item = (id: string) => `${base}/${encodeURIComponent(id)}`;
export const listCoverLetters = async (): Promise<CoverLetter[]> => IS_LOCAL_STORAGE ? readLocalLetters() : apiRequest(base);
export const getCoverLetters = listCoverLetters;
export const getCoverLetter = async (id: string): Promise<CoverLetter> => IS_LOCAL_STORAGE ? getLocalLetter(id) : apiRequest(item(id));
export const getTemplates = (): Promise<CoverLetterTemplate[]> => apiRequest(IS_LOCAL_STORAGE ? '/api/exports/cover-letter/templates' : `${base}/templates`);
export async function createCoverLetter(value: string | Partial<CoverLetter> = 'My Cover Letter', template = 'professional', linkedResumeId?: string): Promise<CoverLetter> {
  if (IS_LOCAL_STORAGE) return createLocalLetter(value, template);
  const title = typeof value === 'string' ? value : value.title || 'My Cover Letter';
  const created = await apiRequest<CoverLetter>(base, { method: 'POST', ...jsonBody({ title, template: typeof value === 'object' ? value.settings?.template || template : template, linked_resume_id: typeof value === 'object' ? value.linked_resume_id : linkedResumeId }) });
  if (typeof value === 'string') return created;
  try { return await updateCoverLetter(created.id, {...value, id: created.id}); }
  catch (error) { await deleteCoverLetter(created.id).catch(() => undefined); throw error; }
}
export const updateCoverLetter = async (id: string, data: Partial<CoverLetter>): Promise<CoverLetter> => IS_LOCAL_STORAGE ? updateLocalLetter(id, data) : apiRequest(item(id), { method: 'PUT', ...jsonBody(data) });
export const deleteCoverLetter = async (id: string): Promise<unknown> => IS_LOCAL_STORAGE ? deleteLocalLetter(id) : apiRequest(item(id), { method: 'DELETE' });
export const duplicateCoverLetter = async (id: string): Promise<CoverLetter> => IS_LOCAL_STORAGE ? duplicateLocalLetter(id) : apiRequest(`${item(id)}/duplicate`, { method: 'POST' });
export const generateContent = (data: AIContentRequest): Promise<AIContentResponse> => apiRequest(IS_LOCAL_STORAGE ? '/api/exports/cover-letter/guidance' : `${base}/ai/generate`, { method: 'POST', ...jsonBody(IS_LOCAL_STORAGE ? { ...data, use_ai: false } : data) });
export const createFromResume = (id: string, jobTitle = '', companyName = ''): Promise<CoverLetter> => apiRequest(`${base}/from-resume/${encodeURIComponent(id)}?job_title=${encodeURIComponent(jobTitle)}&company_name=${encodeURIComponent(companyName)}`, { method: 'POST' });
export async function exportCoverLetter(id: string, format: 'pdf' | 'docx' | 'txt', template?: string): Promise<Blob> {
  if (IS_LOCAL_STORAGE) return exportCoverLetterData(getLocalLetter(id), format);
  const response = await apiFetch(`${item(id)}/export`, { method: 'POST', ...jsonBody({format, template}) });
  if (!response.ok) throw new Error('Unable to export this cover letter. Please try again.');
  return response.blob();
}
export async function exportCoverLetterData(letter: CoverLetter, format: 'pdf' | 'docx' | 'txt'): Promise<Blob> {
  if (IS_LOCAL_STORAGE && format === 'txt') return new Blob([localLetterText(letter)], { type: 'text/plain;charset=utf-8' });
  const route = IS_LOCAL_STORAGE ? `/api/exports/cover-letter/${format}` : `${base}/export-data?format=${format}`;
  const response = await apiFetch(route, { method: 'POST', ...jsonBody(letter) });
  if (!response.ok) throw new Error(IS_LOCAL_STORAGE ? 'The export service is unavailable. Try again or download TXT to keep a local copy.' : 'The export service is unavailable. Please try again or use Print / Save as PDF.');
  return response.blob();
}
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = filename.replace(/[<>:"/\\|?*]/g, '_');
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
