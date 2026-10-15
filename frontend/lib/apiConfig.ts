/** One API origin for every frontend. Empty means the same-origin /api proxy. */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
export const IS_SITES = process.env.NEXT_PUBLIC_SITE_MODE === '1';

export function apiUrl(route: string): string {
  const normalized = route.startsWith('/') ? route : `/${route}`;
  return `${API_BASE_URL}${normalized}`;
}

export function apiFetch(route: string, init: RequestInit = {}): Promise<Response> {
  if (IS_SITES) return Promise.resolve(new Response(JSON.stringify({detail: 'Open the main DoCHEng app for imports, AI and server workspace operations.'}), {status: 503, headers: {'Content-Type':'application/json'}}));
  return fetch(apiUrl(route), { ...init, credentials: 'include' });
}

export async function apiRequest<T>(route: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await apiFetch(route, init);
  } catch {
    throw new Error('The document service is unavailable. Your local draft is safe; please try again.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = typeof body?.detail === 'string' ? body.detail : `Request failed (${response.status}). Please check the information and try again.`;
    throw new Error(detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const jsonBody = (value: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value),
});
