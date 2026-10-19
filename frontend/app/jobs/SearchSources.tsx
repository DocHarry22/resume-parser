'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Bookmark, Trash2 } from 'lucide-react';
import { isPublicJobFeed, JOB_FEEDS, PublicJobFeed } from '@/lib/jobSearch';
import { externalJobSearches, JobSearchCriteria, readSavedJobSearches, removeJobSearch, SavedJobSearch, saveJobSearch } from '@/lib/savedJobSearches';

const sourceName = (value: string) => isPublicJobFeed(value) ? JOB_FEEDS[value].name : value === 'all' ? 'All public feeds' : value === 'boards' ? 'Company board' : 'Other job sites';

export function SavedJobSearchPanel({criteria,onRestore}:{criteria:JobSearchCriteria;onRestore:(item:SavedJobSearch)=>void}) {
  const [items,setItems] = useState<SavedJobSearch[]>([]), [name,setName] = useState(''), [error,setError] = useState(''), [storageError,setStorageError] = useState(''), [notice,setNotice] = useState(''), [ready,setReady] = useState(false);
  useEffect(()=>{
    const load=()=>{try{setItems(readSavedJobSearches());setStorageError('');}catch{setStorageError('Saved searches could not be read. Existing browser data has been kept.');}finally{setReady(true);}};
    load();window.addEventListener('storage',load);window.addEventListener('saved-job-searches-change',load);
    return()=>{window.removeEventListener('storage',load);window.removeEventListener('saved-job-searches-change',load);};
  },[]);
  const save=()=>{try{const item=saveJobSearch(name || [criteria.keywords || 'My job search',criteria.location].filter(Boolean).join(' · ').slice(0,80),criteria);setName('');setError('');setNotice(`“${item.name}” saved for your next visit.`);}catch(value){setNotice('');setError(value instanceof Error?value.message:'This search could not be saved. Existing data has been kept.');}};
  const remove=(item:SavedJobSearch)=>{try{removeJobSearch(item.id,item.updatedAt);setError('');setNotice(`“${item.name}” removed.`);}catch(value){setNotice('');setError(value instanceof Error?value.message:'This search could not be removed. Existing data has been kept.');}};
  return <section className="jobs-saved-searches" aria-label="Saved searches">
    <div className="jobs-save-search"><label>Search name (optional)<input className="wk-input" aria-label="Search name" maxLength={80} placeholder="e.g. Engineering in Cape Town" value={name} onChange={event=>setName(event.target.value)}/></label><button type="button" className="wk-button wk-button-plain" disabled={!ready || !!storageError} onClick={save}><Bookmark size={14}/>Save this search</button></div>
    {(error || storageError) && <p role="alert" className="wk-alert">{error || storageError}</p>}{notice && <p role="status">{notice}</p>}
    <div><h2>Saved searches <span>{items.length}</span></h2><p>Keep up to 30 searches on this device. Restore a search, then run it when you’re ready.</p></div>
    {items.length ? <ul>{items.map(item=><li key={item.id}><button className="jobs-restore-search" aria-label={`Use saved search ${item.name}`} onClick={()=>{onRestore(item);setName(item.name);setNotice('');setError('');}}><Bookmark size={14}/><span><strong>{item.name}</strong><small>{[sourceName(item.source),item.keywords,item.location,item.type].filter(Boolean).join(' · ')}</small></span><ArrowRight size={14}/></button><button className="jobs-remove-search" aria-label={`Remove saved search ${item.name}`} disabled={!!storageError} onClick={()=>remove(item)}><Trash2 size={14}/></button></li>)}</ul> : <p className="jobs-saved-empty">Your favorite filters will be ready here next time.</p>}
  </section>;
}

export function ExternalJobSites({keywords,location}:{keywords:string;location:string}) {
  return <section className="jobs-external-section" aria-label="Search on other job sites"><div className="jobs-results-heading"><div><h2>Take your search further.</h2><p>Open another site with your keywords and location. Results and applications stay on that site.</p></div><Link className="wk-text-link" href="/job-tracker">Save a job in your tracker<ArrowRight size={14}/></Link></div><div className="jobs-external-grid">{externalJobSearches(keywords,location).map(engine=><a key={engine.id} className="wk-panel jobs-engine" href={engine.url} target="_blank" rel="noreferrer"><span className="jobs-company-mark">{engine.name.slice(0,2)}</span><div><h3>Search {engine.name}</h3><p>{engine.detail}</p><small>{keywords || 'All roles'}{location ? ` · ${location}` : ''}</small></div><ArrowUpRight size={18}/></a>)}</div><p className="jobs-source-note">Some sites may ask you to sign in or confirm your filters. Found a role? Copy its link into your tracker. The Auto Apply helper supports direct Greenhouse and Lever application links.</p></section>;
}

export function JobFeedCredit({source}:{source:string}) {
  if (source === 'all') return <>Listings provided by {(Object.keys(JOB_FEEDS) as PublicJobFeed[]).map((feed,index)=><span key={feed}>{index > 0 && ', '}<a href={JOB_FEEDS[feed].url} target="_blank" rel="noreferrer">{JOB_FEEDS[feed].name}</a></span>)}. These feeds contain a recent selection. Jobicy includes up to 200 jobs with a 3-hour delay; Arbeitnow includes its first page, mainly in Germany; Remotive has a limited selection with a 24-hour delay.</>;
  if (isPublicJobFeed(source)) return <>Listings provided by <a href={JOB_FEEDS[source].url} target="_blank" rel="noreferrer">{JOB_FEEDS[source].name}</a>. {JOB_FEEDS[source].detail}. Open the source for full availability and employer application links.</>;
  return <>Company-board descriptions may be shortened or omitted by the public endpoint. Read the full employer listing before applying.</>;
}
