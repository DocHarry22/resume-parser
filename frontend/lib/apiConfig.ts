/** One API origin for every frontend. Empty means the same-origin /api proxy. */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
export const IS_SITES = process.env.NEXT_PUBLIC_SITE_MODE === '1';

export function apiUrl(route: string): string {
  const normalized = route.startsWith('/') ? route : '/' + route;
  return API_BASE_URL + normalized;
}

const protectedPrefixes = ['/api/builder', '/api/cover-letters', '/api/workspace', '/api/ai'];
let workspaceBootstrap: Promise<Response> | undefined;

function routePath(route: string): string {
  return (route.startsWith('/') ? route : '/' + route).split(/[?#]/, 1)[0].replace(/\/+$/, '');
}

function requiresWorkspace(route: string): boolean {
  const path = routePath(route);
  return protectedPrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

function ensureWorkspace(): Promise<Response> {
  if (workspaceBootstrap) return workspaceBootstrap;
  // Use raw fetch so establishing the cookie cannot recursively call apiFetch.
  const initialize = () => fetch(apiUrl('/api/workspace'), { credentials: 'include', cache: 'no-store' });
  const start = async (): Promise<Response> => {
    if (typeof navigator !== 'undefined' && navigator.locks?.request) {
      // Each tab checks under the same lock, after prior tabs have received their cookie.
      return navigator.locks.request('docheng-workspace:' + apiUrl('/api/workspace'), initialize);
    }
    return initialize();
  };
  const pending = start().then(response => {
    if (!response.ok && workspaceBootstrap === pending) workspaceBootstrap = undefined;
    return response;
  }, error => {
    if (workspaceBootstrap === pending) workspaceBootstrap = undefined;
    throw error;
  });
  workspaceBootstrap = pending;
  return pending;
}

export async function apiFetch(route: string, init: RequestInit = {}): Promise<Response> {
  // Static Sites must never initialize a guest session or contact the document service.
  if (IS_SITES) return new Response(JSON.stringify({detail: 'Open the main DoCHEng app for imports, AI and server workspace operations.'}), {status: 503, headers: {'Content-Type':'application/json'}});
  if (requiresWorkspace(route)) {
    const bootstrap = await ensureWorkspace();
    // Each concurrent caller needs its own response body for compatible error handling.
    if (!bootstrap.ok) return bootstrap.clone();
  }
  const response = await fetch(apiUrl(route), { ...init, credentials: 'include' });
  if (response.ok && (init.method || 'GET').toUpperCase() === 'DELETE' && routePath(route) === '/api/workspace') {
    // Deletion expires the HttpOnly cookie; the next protected call must establish a new one.
    workspaceBootstrap = undefined;
  }
  return response;
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
    const detail = typeof body?.detail === 'string' ? body.detail : 'Request failed (' + response.status + '). Please check the information and try again.';
    throw new Error(detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const jsonBody = (value: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value),
});
