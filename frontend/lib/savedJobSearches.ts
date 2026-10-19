import { isPublicJobFeed, parseBoardUrl } from './jobSearch';

export interface JobSearchCriteria { source: string; boardUrl: string; keywords: string; location: string; type: string; worldwide: boolean }
export interface SavedJobSearch extends JobSearchCriteria { id: string; name: string; createdAt: string; updatedAt: string }
export const SAVED_SEARCH_KEY = 'resume-studio.saved-job-searches.v1';

export function validateSearchCriteria(value: unknown): JobSearchCriteria {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('This saved search has invalid filters.');
  const item = value as JobSearchCriteria;
  if (![item.keywords,item.location,item.boardUrl,item.source,item.type].every(field=>typeof field === 'string') || item.keywords.length > 200 || item.location.length > 200 || item.boardUrl.length > 2000 || !['','full','part','contract','intern'].includes(item.type) || typeof item.worldwide !== 'boolean' || !(isPublicJobFeed(item.source) || ['all','boards','external'].includes(item.source))) throw new Error('This saved search has invalid filters.');
  return { source:item.source, boardUrl:item.source === 'boards' ? parseBoardUrl(item.boardUrl).url : '', keywords:item.keywords.trim(), location:item.location.trim(), type:item.type, worldwide:item.worldwide };
}
export function readSavedJobSearches(): SavedJobSearch[] {
  const value: unknown = JSON.parse(localStorage.getItem(SAVED_SEARCH_KEY) || '[]');
  if (!Array.isArray(value) || value.length > 30) throw new Error('Saved searches could not be read. Existing browser data has been kept.');
  const ids = new Set<string>();
  return value.map(raw=>{
    const item = raw as SavedJobSearch;
    if (!item || typeof item.id !== 'string' || !item.id || item.id.length > 200 || ids.has(item.id) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 80 || typeof item.createdAt !== 'string' || typeof item.updatedAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt)) || !Number.isFinite(Date.parse(item.updatedAt))) throw new Error('Saved searches could not be read. Existing browser data has been kept.');
    ids.add(item.id); return { ...validateSearchCriteria(item), id:item.id, name:item.name, createdAt:item.createdAt, updatedAt:item.updatedAt };
  });
}
function store(items: SavedJobSearch[]) { localStorage.setItem(SAVED_SEARCH_KEY,JSON.stringify(items)); window.dispatchEvent(new Event('saved-job-searches-change')); }
export function saveJobSearch(name: string, criteria: JobSearchCriteria): SavedJobSearch {
  if (!name.trim() || name.length > 80) throw new Error('Give this search a name of up to 80 characters.');
  const filters = validateSearchCriteria(criteria), items = readSavedJobSearches();
  const key = JSON.stringify(filters), existing = items.find(item=>JSON.stringify(validateSearchCriteria(item)) === key);
  if (!existing && items.length >= 30) throw new Error('You have 30 saved searches. Remove one before adding another.');
  const now = new Date().toISOString();
  const item: SavedJobSearch = { ...filters, id:existing?.id || crypto.randomUUID(), name:name.trim(), createdAt:existing?.createdAt || now, updatedAt:now };
  store([item,...items.filter(value=>value.id !== item.id)]); return item;
}
export function removeJobSearch(id: string, expectedUpdatedAt: string) {
  const items = readSavedJobSearches(), item = items.find(item=>item.id === id);
  if (!item || item.updatedAt !== expectedUpdatedAt) throw new Error('This search changed in another tab. Review the latest saved searches.');
  store(items.filter(item=>item.id !== id));
}

export function externalJobSearches(keywords: string, location: string) {
  const query = keywords.trim().slice(0,200), place = location.trim().slice(0,200);
  const url = (base: string, params: Record<string,string>) => {const result=new URL(base);Object.entries(params).forEach(([key,value])=>{if(value)result.searchParams.set(key,value);});return result.href;};
  const slug = (value: string) => encodeURIComponent(value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,''));
  const pnet = `https://www.pnet.co.za/jobs${query ? `/${slug(query) || 'jobs'}` : ''}${place ? `/in-${slug(place) || 'south-africa'}` : ''}`;
  return [
    { id:'linkedin', name:'LinkedIn', detail:'Professional roles and company networks', url:url('https://www.linkedin.com/jobs/search/',{keywords:query,location:place}) },
    { id:'indeed', name:'Indeed', detail:'Search the South African job site', url:url('https://za.indeed.com/jobs',{q:query,l:place}) },
    { id:'pnet', name:'Pnet', detail:'Local roles across South Africa', url:pnet },
    { id:'careerjet', name:'Careerjet', detail:'South African job search engine', url:url('https://www.careerjet.co.za/jobs',{s:query,l:place}) },
    { id:'google', name:'Google Jobs', detail:'Search for jobs across the web', url:url('https://www.google.com/search',{q:[query || 'job opportunities',place,'jobs'].filter(Boolean).join(' '),udm:'8'}) },
  ];
}
