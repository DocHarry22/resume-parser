import { readJobs, saveJobs, TrackedJob } from './careerWorkspace';

export type PublicJobFeed = 'remotive' | 'jobicy' | 'arbeitnow';
export type JobProvider = 'greenhouse' | 'lever' | PublicJobFeed;
export const JOB_FEEDS: Record<PublicJobFeed, { name: string; endpoint: string; url: string; ttl: number; detail: string }> = {
  jobicy: { name: 'Jobicy', endpoint: 'https://jobicy.com/api/v2/remote-jobs?count=200', url: 'https://jobicy.com', ttl: 3600000, detail: 'Up to 200 recent remote jobs · 3-hour publishing delay · cached for one hour' },
  arbeitnow: { name: 'Arbeitnow', endpoint: 'https://www.arbeitnow.com/api/job-board-api', url: 'https://www.arbeitnow.com', ttl: 3600000, detail: 'First page of European jobs, mainly Germany · remote roles may have country restrictions · cached for one hour' },
  remotive: { name: 'Remotive', endpoint: 'https://remotive.com/api/remote-jobs?limit=500', url: 'https://remotive.com', ttl: 21600000, detail: 'Limited public remote feed · 24-hour publishing delay · cached for six hours' },
};
export function isPublicJobFeed(value: string): value is PublicJobFeed { return Object.prototype.hasOwnProperty.call(JOB_FEEDS, value); }
export interface BoardTarget { provider: 'greenhouse' | 'lever'; board: string; postingId: string; eu: boolean; url: string; api: string }
export interface SearchJob { key: string; provider: JobProvider; title: string; company: string; location: string; type: string; salary: string; description: string; url: string; applyUrl: string; publishedAt: string; board?: string; postingId?: string; eu?: boolean }
export interface JobCatalog { jobs: SearchJob[]; fetchedAt: string; source: string; notice: string; warnings?: string[] }
const text = (value: unknown, limit = 30000) => typeof value === 'string' ? value.slice(0, limit) : '';
const record = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
export function plainJobText(value: unknown): string {
  let html = text(value, 200000);
  // Provider HTML is only converted to text; it is never mounted into the page.
  for (let pass = 0; pass < 2; pass++) html = html.replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:\d+|x[0-9a-f]+);/gi, value => {
    const named: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' };
    if (named[value.toLowerCase()]) return named[value.toLowerCase()];
    const number = value.startsWith('&#x') ? parseInt(value.slice(3, -1), 16) : parseInt(value.slice(2, -1), 10);
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : '';
  });
  return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<\/?(?:p|div|li|br|h[1-6]|ul|ol)\b[^>]*>/gi, '\n').replace(/<[^>]*>/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim().slice(0, 30000);
}

/** Only public, known ATS endpoints are derived from pasted URLs. */
export function parseBoardUrl(value: string): BoardTarget {
  let url: URL; try { url = new URL(value); } catch { throw new Error('Paste a complete HTTPS Greenhouse or Lever job or company-board URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || value.length > 2000) throw new Error('Use a public HTTPS job-board URL without credentials or a custom port.');
  const parts = url.pathname.split('/').filter(Boolean);
  const greenhouse = ['boards.greenhouse.io', 'job-boards.greenhouse.io', 'boards.eu.greenhouse.io', 'job-boards.eu.greenhouse.io'].includes(url.hostname);
  const lever = ['jobs.lever.co', 'jobs.eu.lever.co'].includes(url.hostname);
  if ((!greenhouse && !lever) || !parts[0] || !/^[a-z0-9_-]{1,100}$/i.test(parts[0])) throw new Error('This helper supports Greenhouse and Lever company boards and job links.');
  const board = parts[0];
  const postingId = greenhouse ? (parts[1] === 'jobs' ? parts[2] || '' : '') : parts[1] || '';
  if (greenhouse ? parts.length !== (postingId ? 3 : 1) || (postingId && !/^\d{1,30}$/.test(postingId)) : parts.length > (postingId ? 3 : 1) || (parts[2] && parts[2] !== 'apply') || (postingId && !/^[a-f0-9-]{20,60}$/i.test(postingId))) throw new Error('Use the direct company board or job listing link, without extra path segments.');
  const eu = url.hostname.includes('.eu.');
  const canonical = greenhouse ? `https://${eu ? 'job-boards.eu.greenhouse.io' : 'job-boards.greenhouse.io'}/${board}${postingId ? `/jobs/${postingId}` : ''}` : `https://${eu ? 'jobs.eu.lever.co' : 'jobs.lever.co'}/${board}${postingId ? `/${postingId}/apply` : ''}`;
  const api = greenhouse ? `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs${postingId ? `/${postingId}` : ''}` : `https://${eu ? 'api.eu.lever.co' : 'api.lever.co'}/v0/postings/${encodeURIComponent(board)}${postingId ? `/${postingId}` : ''}?mode=json`;
  return { provider: greenhouse ? 'greenhouse' : 'lever', board, postingId, eu, url: canonical, api };
}
export function applicationTarget(value: string): BoardTarget | null { try { const target = parseBoardUrl(value); return target.postingId ? target : null; } catch { return null; } }
export function canonicalJobUrl(value: string) {
  const target = applicationTarget(value); if (target) return target.url.toLowerCase();
  try { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return ''; url.hash = ''; ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'gh_src'].forEach(key => url.searchParams.delete(key)); return url.href.replace(/\/$/, ''); } catch { return ''; }
}
function publicListingUrl(value: unknown, provider: PublicJobFeed): string {
  try { const url = new URL(text(value,2000)); const hosts = provider === 'arbeitnow' ? ['www.arbeitnow.com','arbeitnow.com'] : [`${provider}.com`]; return url.protocol === 'https:' && !url.username && !url.password && !url.port && hosts.includes(url.hostname) ? url.href : ''; } catch { return ''; }
}
export function normalizeCatalog(value: unknown, target?: BoardTarget | PublicJobFeed): SearchJob[] {
  const feed: PublicJobFeed | undefined = typeof target === 'string' ? target : !target ? 'remotive' : undefined;
  const board = typeof target === 'object' ? target : undefined;
  const root = record(value);
  if (root.success === false) throw new Error('This provider could not return jobs. Please try again later.');
  const values = board ? board.postingId ? [value] : board.provider === 'greenhouse' ? root.jobs : value : feed === 'arbeitnow' ? root.data : root.jobs;
  if (!Array.isArray(values) || values.length > 5000) throw new Error('This provider returned an unreadable or unusually large job list. Try a direct job link.');
  return values.slice(0, 2000).flatMap<SearchJob>(item => {
    const raw = record(item);
    if (feed) {
      const url = publicListingUrl(raw.url,feed), id = text(String(feed === 'arbeitnow' ? raw.slug || '' : raw.id || ''),200);
      const title = plainJobText(feed === 'jobicy' ? raw.jobTitle : raw.title).slice(0,150), company = plainJobText(feed === 'jobicy' ? raw.companyName : raw.company_name).slice(0,150);
      if (!url || !id || !title || !company) return [];
      const unix = typeof raw.created_at === 'number' && Number.isFinite(raw.created_at) ? new Date(raw.created_at * 1000) : undefined;
      const publishedAt = feed === 'arbeitnow' ? unix && Number.isFinite(unix.getTime()) ? unix.toISOString() : '' : text(feed === 'jobicy' ? raw.pubDate : raw.publication_date,100);
      const types = feed === 'jobicy' ? raw.jobType : raw.job_types;
      const type = feed === 'remotive' ? text(raw.job_type,80) : Array.isArray(types) ? types.filter(item=>typeof item === 'string').join(', ').slice(0,80) : '';
      const salary = feed === 'jobicy' && typeof raw.salaryMin === 'number' && Number.isFinite(raw.salaryMin) ? `${text(raw.salaryCurrency,10)} ${raw.salaryMin.toLocaleString()}${typeof raw.salaryMax === 'number' && Number.isFinite(raw.salaryMax) ? `–${raw.salaryMax.toLocaleString()}` : ''} ${text(raw.salaryPeriod,30)}`.trim() : text(raw.salary,200);
      // A remote flag alone never implies worldwide eligibility.
      const location = plainJobText(feed === 'jobicy' ? raw.jobGeo : feed === 'arbeitnow' ? raw.location : raw.candidate_required_location).slice(0,180) + (feed === 'arbeitnow' && raw.remote === true ? ' · Remote' : '');
      return [{ key: `${feed}:${id}`, provider: feed, title, company, location, type: type.replace(/[_-]/g,' '), salary, description: plainJobText(feed === 'jobicy' ? raw.jobDescription || raw.jobExcerpt : raw.description), url, applyUrl: '', publishedAt }];
    }
    const target = board!;
    const id = String(raw.id || '');
    const title = target.provider === 'greenhouse' ? text(raw.title,150) : text(raw.text,150);
    if (!id || !title) return [];
    let direct: BoardTarget; try { direct = parseBoardUrl(`${target.provider === 'greenhouse' ? `https://${target.eu ? 'job-boards.eu.greenhouse.io' : 'job-boards.greenhouse.io'}/${target.board}/jobs` : `https://${target.eu ? 'jobs.eu.lever.co' : 'jobs.lever.co'}/${target.board}`}/${id}`); } catch { return []; }
    const categories = record(raw.categories), salary = record(raw.salaryRange);
    const description = target.provider === 'greenhouse' ? raw.content : [raw.descriptionPlain || plainJobText(raw.description), ...(Array.isArray(raw.lists) ? raw.lists.map((entry: any) => `${text(entry?.text)}\n${plainJobText(entry?.content)}`) : []), raw.additionalPlain || plainJobText(raw.additional)].filter(Boolean).join('\n\n');
    return [{ key: `${target.provider}:${target.eu ? 'eu:' : ''}${target.board}:${id}`, provider: target.provider, board: target.board, postingId: id, eu: target.eu, title: plainJobText(title).slice(0,150), company: text(record(raw.company).name,150) || target.board, location: text(record(raw.location).name || categories.location,200), type: text(categories.commitment || raw.workplaceType,80), salary: text(raw.salaryDescriptionPlain,200) || (typeof salary.min === 'number' && typeof salary.max === 'number' ? `${salary.currency || ''} ${salary.min.toLocaleString()}–${salary.max.toLocaleString()} ${salary.interval || ''}`.slice(0,200) : ''), description: plainJobText(description), url: direct.url, applyUrl: direct.url, publishedAt: text(raw.updated_at,100) || (typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? new Date(raw.createdAt).toISOString() : '') }];
  });
}
const pending = new Map<string, Promise<JobCatalog>>();
const CACHE_KEY = 'resume-studio.job-catalog-cache.v1';
export async function fetchJobCatalog(source: string, signal?: AbortSignal): Promise<JobCatalog> {
  if (signal?.aborted) throw new Error('Job search cancelled.');
  if (source === 'all') {
    const feeds = Object.keys(JOB_FEEDS) as PublicJobFeed[];
    const results = await Promise.allSettled(feeds.map(feed=>fetchJobCatalog(feed,signal)));
    if (signal?.aborted) throw new Error('Job search cancelled.');
    const catalogs = results.flatMap(result=>result.status === 'fulfilled' ? [result.value] : []);
    const warnings = results.flatMap((result,index)=>result.status === 'rejected' ? [`${JOB_FEEDS[feeds[index]].name}: ${result.reason instanceof Error ? result.reason.message : 'Source unavailable.'}`] : []);
    if (!catalogs.length) throw new Error(`No public feeds could be loaded. ${warnings.join(' ')}`);
    const urls = new Set<string>();
    const jobs = catalogs.flatMap(catalog=>catalog.jobs).filter(job=>{const url=canonicalJobUrl(job.url);if(urls.has(url))return false;urls.add(url);return true;}).sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
    return { jobs, source:'all', fetchedAt:catalogs.map(catalog=>catalog.fetchedAt).sort()[0], notice:catalogs.map(catalog=>catalog.notice).filter(Boolean).join(' '), warnings };
  }
  const feed = isPublicJobFeed(source) ? source : undefined;
  const target = feed ? undefined : parseBoardUrl(source);
  const key = feed || target!.url;
  const ttl = feed ? JOB_FEEDS[feed].ttl : 15 * 60 * 1000;
  let cache: Record<string, JobCatalog> = {};
  try { const raw = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}'); if (raw && typeof raw === 'object' && !Array.isArray(raw)) cache = raw; } catch { /* Public cache can be discarded; user libraries are separate. */ }
  const cached = cache[key];
  if (cached && cached.source === key && typeof cached.notice === 'string' && Array.isArray(cached.jobs) && cached.jobs.length <= 2000 && cached.jobs.every(job => job && ['key','title','company','location','type','salary','description','url','applyUrl','publishedAt'].every(key => typeof job[key as keyof SearchJob] === 'string') && (feed ? job.provider === feed && !!publicListingUrl(job.url,feed) && !job.applyUrl : job.provider === target!.provider && !!applicationTarget(job.url) && applicationTarget(job.url)?.url === job.applyUrl)) && Date.now() - Date.parse(cached.fetchedAt) >= 0 && Date.now() - Date.parse(cached.fetchedAt) < ttl) return cached;
  if (pending.has(key)) return pending.get(key)!;
  const request = (async () => {
    const gate = `resume-studio.job-fetch.${feed || 'boards'}`;
    if (feed) try { const last = Number(sessionStorage.getItem(gate) || 0); if (Date.now() - last < 31000) throw new Error('Please wait half a minute before asking this provider for a different job list.'); sessionStorage.setItem(gate, String(Date.now())); } catch (value) { if (value instanceof Error && value.message.startsWith('Please wait')) throw value; }
    const timeout = new AbortController(), stop = () => timeout.abort();
    signal?.addEventListener('abort', stop, { once: true }); if (signal?.aborted) timeout.abort();
    const timer = setTimeout(stop, 20000);
    try {
      const response = await fetch(feed ? JOB_FEEDS[feed].endpoint : target!.api, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: timeout.signal });
      if (!response.ok) throw new Error(response.status === 429 ? 'This job source is busy. Try again later; your saved jobs are still available.' : response.status === 404 ? 'That board or job was not found. Check the link or the employer’s careers page.' : `The job source could not be reached (${response.status}).`);
      const reader = response.body?.getReader(), chunks: Uint8Array[] = []; let length = 0;
      if (reader) { try { while (true) { const next = await reader.read(); if (next.done) break; length += next.value.byteLength; if (length > 8 * 1024 * 1024) { await reader.cancel(); throw new Error('This board is too large to load here. Paste a direct job link instead.'); } chunks.push(next.value); } } finally { reader.releaseLock(); } }
      const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
      const body = reader ? new TextDecoder().decode(bytes) : await response.text();
      let parsed: unknown; try { parsed = JSON.parse(body); } catch { throw new Error('This provider returned unreadable job data. Open its careers page or try again later.'); }
      const jobs = normalizeCatalog(parsed, feed || target);
      const result = { jobs, fetchedAt: new Date().toISOString(), source: key, notice: feed === 'remotive' ? plainJobText(record(parsed)['00-warning']).slice(0,500) : '' };
      try {
        // Parallel sources may have completed since this request read the cache.
        const latest = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
        cache = latest && typeof latest === 'object' && !Array.isArray(latest) ? latest : {};
        cache[key] = result;
        const entries = Object.entries(cache).filter(([,item])=>item && typeof item.fetchedAt === 'string' && Number.isFinite(Date.parse(item.fetchedAt))).sort((a,b) => Date.parse(b[1].fetchedAt) - Date.parse(a[1].fetchedAt)).slice(0,5);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
      } catch { /* A cache failure never touches saved documents or applications. */ }
      return result;
    } catch (value) { if (timeout.signal.aborted) throw new Error(signal?.aborted ? 'Job search cancelled.' : 'The job source took too long. Try again later.'); throw value; }
    finally { clearTimeout(timer); signal?.removeEventListener('abort', stop); }
  })();
  pending.set(key, request); try { return await request; } finally { pending.delete(key); }
}
export function filterSearchJobs(jobs: SearchJob[], keywords: string, location: string, type: string, worldwide = true) {
  const terms = keywords.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return jobs.filter(job => terms.every(term => `${job.title} ${job.company} ${job.description}`.toLowerCase().includes(term)) && (!location.trim() || job.location.toLowerCase().includes(location.toLowerCase().trim()) || (worldwide && /worldwide|anywhere|global/i.test(job.location))) && (!type || job.type.toLowerCase().includes(type)));
}
export function saveDiscoveredJob(listing: SearchJob): TrackedJob {
  const jobs = readJobs(), canonical = canonicalJobUrl(listing.url);
  if (!canonical) throw new Error('This listing does not have a usable job URL.');
  const existing = jobs.find(job => canonicalJobUrl(job.url) === canonical);
  if (existing) return existing;
  const job: TrackedJob = { id: crypto.randomUUID(), company: listing.company, role: listing.title, url: listing.applyUrl || listing.url, stage: 'Saved', appliedOn: '', followUpOn: '', notes: '', location: listing.location, salary: listing.salary, description: listing.description, updatedAt: new Date().toISOString() };
  saveJobs([job, ...jobs]); return job;
}
