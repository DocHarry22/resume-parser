'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Bookmark, BriefcaseBusiness, Check, Clock3, ExternalLink, MapPin, Search, Sparkles, X } from 'lucide-react';
import { canonicalJobUrl, fetchJobCatalog, filterSearchJobs, isPublicJobFeed, JOB_FEEDS, JobCatalog, PublicJobFeed, saveDiscoveredJob, SearchJob } from '@/lib/jobSearch';
import { readJobs, TrackedJob } from '@/lib/careerWorkspace';
import { SavedJobSearchPanel, ExternalJobSites, JobFeedCredit } from './SearchSources';

export default function JobSearchPage() {
  const router = useRouter();
  const [source, setSource] = useState('all');
  const [boardUrl, setBoardUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [worldwide, setWorldwide] = useState(true);
  const [catalog, setCatalog] = useState<JobCatalog | null>(null);
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [selected, setSelected] = useState<SearchJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null), controller = useRef<AbortController | null>(null), trigger = useRef<HTMLElement | null>(null);
  const filtered = catalog ? filterSearchJobs(catalog.jobs, keywords, location, type, worldwide) : [];
  const publicFeed = source === 'all' || isPublicJobFeed(source);
  useEffect(() => {
    const load = () => { try { setJobs(readJobs()); } catch { setError('Saved applications could not be read. Existing data has been kept.'); } };
    load(); window.addEventListener('storage',load); window.addEventListener('career-jobs-change',load);
    return () => { controller.current?.abort(); window.removeEventListener('storage',load); window.removeEventListener('career-jobs-change',load); };
  }, []);
  useEffect(() => { if (selected) dialog.current?.showModal(); else { dialog.current?.close(); trigger.current?.focus(); } }, [selected]);
  const search = async(event: React.FormEvent) => {
    event.preventDefault(); if (source === 'external') return; controller.current?.abort(); const current = new AbortController(); controller.current = current; setLoading(true); setError(''); setNotice('');
    try { const result = await fetchJobCatalog(source === 'boards' ? boardUrl : source, current.signal); if (!current.signal.aborted) setCatalog(result); }
    catch(value) { if (!current.signal.aborted) setError(value instanceof Error ? value.message : 'This public job source could not be loaded. Try again later.'); }
    finally { if (!current.signal.aborted) setLoading(false); }
  };
  const save = (listing: SearchJob, prepare = false) => {
    try { const job = saveDiscoveredJob(listing); setError(''); setNotice('This opportunity is saved in your tracker. Your existing notes and document choices are kept.'); if (prepare) router.push(`/auto-apply?job=${encodeURIComponent(job.id)}`); }
    catch(value) { setError(value instanceof Error ? value.message : 'This job could not be saved. Existing browser data has been kept.'); }
  };
  const saved = (listing: SearchJob) => jobs.find(job => canonicalJobUrl(job.url) === canonicalJobUrl(listing.url));
  const chooseSource = (value: string) => { controller.current?.abort(); setLoading(false); setSource(value); setCatalog(null); setSelected(null); setError(''); setNotice(''); };
  const provider = (value: string) => isPublicJobFeed(value) ? JOB_FEEDS[value].name : value === 'greenhouse' ? 'Greenhouse' : 'Lever';
  return <main className="wk-page jobs-page" data-workspace-ready="true">
    <div className="wk-heading"><div><span className="wk-eyebrow">Your next chapter is out there</span><h1>Find a role worth your next move.</h1><p>Search more sources, save your filters, and keep every opportunity together.</p></div><Link className="wk-button wk-button-plain" href="/auto-apply"><Sparkles size={15} />Open Auto Apply<ArrowRight size={15} /></Link></div>
    {error && <p role="alert" className="wk-alert">{error}</p>}{notice && <p role="status" className="jobs-notice"><Check size={15} />{notice}</p>}
    <section className="wk-panel jobs-search-panel" aria-label="Job search"><div className="wk-tabs"><button aria-pressed={publicFeed} onClick={() => chooseSource('all')}>Public job feeds</button><button aria-pressed={source === 'boards'} onClick={() => chooseSource('boards')}>Greenhouse & Lever boards</button><button aria-pressed={source === 'external'} onClick={() => chooseSource('external')}>Search other sites<ArrowUpRight size={12}/></button></div>
      <form onSubmit={search}>
        {publicFeed && <label className="jobs-feed-picker">Public job feed<select aria-label="Public job feed" className="wk-input" value={source} onChange={event=>chooseSource(event.target.value)}><option value="all">All public feeds</option>{(Object.keys(JOB_FEEDS) as PublicJobFeed[]).map(feed=><option key={feed} value={feed}>{JOB_FEEDS[feed].name}</option>)}</select><small>{source === 'all' ? 'Jobicy remote roles, Arbeitnow European jobs, and Remotive. Each source offers a recent selection, with its own location restrictions.' : JOB_FEEDS[source as PublicJobFeed].detail}</small></label>}
        {source === 'boards' && <label className="jobs-board-url">Company board or direct job URL<input aria-label="Company board or direct job URL" type="url" required maxLength={2000} className="wk-input" value={boardUrl} onChange={event => {setBoardUrl(event.target.value);setCatalog(null);}} placeholder="https://jobs.lever.co/company or a Greenhouse job link" /><small>Public company boards and individual jobs. Choose an employer’s actual careers link.</small></label>}
        <div className={`jobs-search-fields${source === 'external' ? ' jobs-search-external' : ''}`}><label>Role, skills or company<div className="jobs-input-icon"><Search size={16} /><input aria-label="Role, skills or company" className="wk-input" value={keywords} maxLength={200} onChange={event => setKeywords(event.target.value)} placeholder="e.g. Process Engineer" /></div></label><label>Location<div className="jobs-input-icon"><MapPin size={16} /><input aria-label="Location" className="wk-input" value={location} maxLength={200} onChange={event => setLocation(event.target.value)} placeholder="e.g. South Africa" /></div></label>{source !== 'external' && <><label>Job type<select aria-label="Job type" className="wk-input" value={type} onChange={event => setType(event.target.value)}><option value="">Any type</option><option value="full">Full time</option><option value="part">Part time</option><option value="contract">Contract</option><option value="intern">Internship</option></select></label><button className="wk-button wk-button-primary" disabled={loading} type="submit"><Search size={15} />{loading ? 'Loading jobs…' : catalog ? 'Search loaded jobs' : 'Find jobs'}</button></>}</div>
        <div className="jobs-search-caption"><label><input type="checkbox" checked={worldwide} disabled={source === 'external'} onChange={event => setWorldwide(event.target.checked)} />Include listings marked worldwide</label><span>{source === 'external' ? 'Links carry your keywords and location. Choose job type and other filters on the destination site.' : source === 'boards' ? 'Your filters apply to the selected company board.' : 'Filters match the loaded selection. Remote does not always mean worldwide.'}</span></div>
      </form>
      <SavedJobSearchPanel criteria={{source,boardUrl,keywords,location,type,worldwide}} onRestore={item=>{chooseSource(item.source);setBoardUrl(item.boardUrl);setKeywords(item.keywords);setLocation(item.location);setType(item.type);setWorldwide(item.worldwide);setNotice(`“${item.name}” filters restored. ${item.source === 'external' ? 'Choose a job site below.' : 'Click Find jobs to run this search.'}`);}}/>
    </section>
    {source === 'external' ? <ExternalJobSites keywords={keywords} location={location}/> : <>
    {catalog?.warnings?.map(warning=><p role="status" className="jobs-source-warning" key={warning}>{warning} Other available sources are shown below.</p>)}
    <div className="jobs-results-heading"><div><h2>{catalog ? `${filtered.length} ${filtered.length === 1 ? 'opportunity' : 'opportunities'} to explore` : 'A fresh start for your search.'}</h2><p>{catalog ? `${catalog.jobs.length} listings loaded · ${new Date(catalog.fetchedAt).toLocaleString()}` : 'Choose a public feed or paste a company board to load real listings.'}</p></div><Link className="wk-text-link" href="/job-tracker">Your saved opportunities<ArrowRight size={14} /></Link></div>
    {!catalog ? <section className="wk-panel wk-empty jobs-empty"><span className="wk-empty-icon"><BriefcaseBusiness size={32} /></span><h2>Make room for what’s next.</h2><p>Explore three public feeds, or load a Greenhouse or Lever company board to prepare applications with the browser helper.</p><div><span><Bookmark size={15} />Save jobs without changing their stage</span><span><Sparkles size={15} />Review every application before sending</span></div></section> : !filtered.length ? <section className="wk-panel wk-empty"><Search size={28} /><h2>No matching listings in this feed.</h2><p>Try broader wording, another location or another company board. Availability and location restrictions come from the employer.</p></section> : <div className="jobs-results-grid">{filtered.slice(0,100).map(listing => { const existing = saved(listing); return <article className="wk-panel jobs-result" key={listing.key}><div className="jobs-result-top"><span className="jobs-company-mark">{listing.company.slice(0,2).toUpperCase()}</span><div><span className="wk-small-label">{listing.company}</span><h3><button onClick={event => { trigger.current = event.currentTarget; setSelected(listing); }}>{listing.title}</button></h3></div>{listing.applyUrl && <span className="jobs-helper-tag"><Sparkles size={11} />Helper supported</span>}</div><div className="jobs-result-meta"><span><MapPin size={13} />{listing.location || 'Location not supplied'}</span>{listing.type && <span><Clock3 size={13} />{listing.type}</span>}</div>{listing.salary && <p className="jobs-salary">{listing.salary}</p>}<p className="jobs-result-excerpt">{listing.description.slice(0,230) || 'Open this listing for the employer’s full description and requirements.'}</p><div className="jobs-source"><a href={listing.url} target="_blank" rel="noreferrer">Sourced from {provider(listing.provider)}<ExternalLink size={11} /></a><button onClick={() => save(listing)} className={existing ? 'is-saved' : ''} aria-label={`${existing ? 'Saved' : 'Save'} ${listing.title} at ${listing.company}`}><Bookmark size={14} />{existing ? 'Saved' : 'Save job'}</button></div><div className="jobs-result-actions"><button className="wk-button wk-button-plain" onClick={event => { trigger.current = event.currentTarget; setSelected(listing); }}>View details<ArrowRight size={13} /></button>{listing.applyUrl ? <button className="wk-button wk-button-primary" onClick={() => save(listing,true)}>Prepare application<ArrowRight size={13} /></button> : <a className="wk-button wk-button-plain" href={listing.url} target="_blank" rel="noreferrer">Open listing<ArrowUpRight size={13} /></a>}</div></article>; })}</div>}
    {catalog && <p className="jobs-source-note"><JobFeedCredit source={catalog.source}/> Filters match the loaded titles, company names, descriptions and location text. {filtered.length > 100 && 'Showing the first 100 matching listings; narrow your filters to see others.'}</p>}
    </>}
    <dialog ref={dialog} className="wk-dialog jobs-detail-dialog" aria-labelledby="job-detail-title" onCancel={() => setSelected(null)} onClose={() => setSelected(null)}>{selected && <><div className="jobs-detail-heading"><div><span className="wk-small-label">{selected.company}</span><h2 id="job-detail-title">{selected.title}</h2><p>{selected.location || 'Location not supplied'}{selected.type ? ` · ${selected.type}` : ''}</p></div><button aria-label="Close job details" onClick={() => setSelected(null)}><X size={20} /></button></div><div className="jobs-detail-body">{selected.description || 'This endpoint provides the listing details only. Open the employer’s listing for the full description.'}</div><div className="jobs-detail-actions"><a className="wk-button wk-button-plain" href={selected.url} target="_blank" rel="noreferrer">Open {provider(selected.provider)} listing<ExternalLink size={14} /></a><button className="wk-button wk-button-primary" onClick={() => { save(selected); setSelected(null); }}>Save to tracker<Bookmark size={14} /></button>{selected.applyUrl && <button className="wk-button wk-button-primary" onClick={() => save(selected,true)}>Prepare application<ArrowRight size={14} /></button>}</div></>}</dialog>
  </main>;
}
