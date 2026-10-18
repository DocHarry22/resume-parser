'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, Download, Plus, Search, Upload, X } from 'lucide-react';
import { downloadText, JOB_STAGES, JobStage, localDate, readJobs, safeJobUrl, saveJobs, TrackedJob, validateJobs } from '@/lib/careerWorkspace';

type JobDraft = Omit<TrackedJob, 'id' | 'updatedAt'>;
const blank: JobDraft = { company: '', role: '', url: '', stage: 'Saved', appliedOn: '', followUpOn: '', notes: '' };
const input = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100';

export default function JobTrackerPage() {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<JobDraft>(blank);
  const [showForm, setShowForm] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const load = () => { try { setJobs(readJobs()); setError(''); } catch { setError('Your saved jobs could not be read. Existing browser data has been kept. You can restore a backup.'); } finally { setReady(true); } };
    load(); window.addEventListener('storage', load); return () => window.removeEventListener('storage', load);
  }, []);
  useEffect(() => { if (showForm) dialogRef.current?.showModal(); else dialogRef.current?.close(); }, [showForm]);
  const commit = (next: TrackedJob[], message: string) => {
    try { saveJobs(next); setJobs(next); setError(''); setNotice(message); return true; }
    catch { setError('Browser storage is unavailable or full. Your changes have not been saved. Export your current jobs before leaving.'); return false; }
  };
  const open = (job?: TrackedJob) => { setEditing(job?.id || null); setDraft(job ? { ...job } : { ...blank }); setShowForm(true); setNotice(''); };
  const close = () => { setShowForm(false); requestAnimationFrame(() => openButtonRef.current?.focus()); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.url && !safeJobUrl(draft.url)) { setError('Use a complete http:// or https:// job link.'); return; }
    const job: TrackedJob = { ...draft, role: draft.role.trim(), company: draft.company.trim(), id: editing || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (!job.role || !job.company) return;
    if (commit(editing ? jobs.map(j => j.id === editing ? job : j) : [job, ...jobs], 'Job saved on this browser.')) close();
  };
  const changeStage = (job: TrackedJob, stage: JobStage) => commit(jobs.map(j => j.id === job.id ? { ...j, stage, appliedOn: stage === 'Applied' && !j.appliedOn ? localDate() : j.appliedOn, updatedAt: new Date().toISOString() } : j), `Moved to ${stage}.`);
  const remove = (job: TrackedJob) => { if (window.confirm(`Delete ${job.role} at ${job.company}?`)) commit(jobs.filter(j => j.id !== job.id), 'Job removed.'); };
  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('Choose a backup smaller than 5 MB.');
      const parsed = JSON.parse(await file.text());
      const imported = validateJobs(Array.isArray(parsed) ? parsed : parsed.jobs);
      const merged = [...jobs];
      imported.forEach(job => { const index = merged.findIndex(j => j.id === job.id); if (index < 0) merged.push(job); });
      commit(merged, `Imported ${merged.length - jobs.length} jobs. Existing jobs were kept.`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to import this backup.'); }
    finally { if (importRef.current) importRef.current.value = ''; }
  };
  const filtered = jobs.filter(j => (filter === 'All' || j.stage === filter) && `${j.company} ${j.role} ${j.notes}`.toLowerCase().includes(search.toLowerCase()));
  const due = jobs.filter(j => j.followUpOn && j.followUpOn <= localDate() && !['Offer', 'Closed'].includes(j.stage));
  return <main data-workspace-ready={ready} className="min-h-screen bg-[#f7f9fc] px-4 pb-10 pt-28 text-slate-900 sm:px-8">
    <div className="mx-auto max-w-7xl">
      <Link href="/dashboard" className="text-sm font-medium text-blue-800 hover:underline">Career workspace / Job tracker</Link>
      <div className="my-7 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-blue-700">Your next chapter</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">A little more organized.<br />A lot more focused.</h1><p className="mt-3 max-w-xl text-slate-600">Keep every opportunity, next step, and application note in one place.</p></div><button ref={openButtonRef} onClick={() => open()} disabled={!ready} className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"><Plus size={18} /> Add a job</button></div>
      <div className="mb-7 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">Saved on this browser and device. Export a backup to keep a copy or move to another device. No account or cloud sync.</div>
      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Opportunities', jobs.length], ['Applications sent', jobs.filter(j => j.appliedOn || ['Applied', 'Interview', 'Offer'].includes(j.stage)).length], ['In conversation', jobs.filter(j => j.stage === 'Interview').length], ['Follow-ups due', due.length]].map(([label, count]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold">{count}</p></div>)}</div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {notice && <p role="status" className="mb-4 text-sm text-blue-800">{notice}</p>}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="relative w-full sm:w-80"><Search size={17} className="absolute left-3 top-3.5 text-slate-400" /><input aria-label="Search jobs" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search role, company or notes" className={`${input} pl-10`} /></div><div className="flex flex-wrap gap-2"><button disabled={!ready} onClick={() => downloadText(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), jobs }, null, 2), `job-tracker-${localDate()}.json`)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"><Download size={16} /> Export backup</button><button onClick={() => importRef.current?.click()} disabled={!ready} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"><Upload size={16} /> Import backup</button><input type="file" accept=".json,application/json" ref={importRef} onChange={e => importBackup(e.target.files?.[0])} className="hidden" aria-label="Import job tracker backup" /></div></div>
      <div className="mb-5 flex flex-wrap gap-2" aria-label="Filter job stage">{['All', ...JOB_STAGES].map(stage => <button key={stage} aria-pressed={filter === stage} onClick={() => setFilter(stage)} className={`rounded-full px-4 py-2 text-sm font-medium ${filter === stage ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{stage} <span className="ml-1 opacity-70">{stage === 'All' ? jobs.length : jobs.filter(j => j.stage === stage).length}</span></button>)}</div>
      {!ready ? <p role="status" className="py-12 text-center text-slate-500">Loading your jobs…</p> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><BriefcaseBusiness size={32} className="mx-auto mb-4 text-blue-700" /><h2 className="text-xl font-semibold">{jobs.length ? 'No matching opportunities' : 'Your next opportunity starts here'}</h2><p className="mx-auto mt-2 max-w-md text-slate-500">{jobs.length ? 'Try another search or stage.' : 'Save a role you like, track your application, and plan your follow-up. Add your first job to begin.'}</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(job => <article key={job.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-blue-700">{job.company}</p><h2 className="mt-1 break-words text-lg font-semibold">{job.role}</h2></div>{safeJobUrl(job.url) && <a href={safeJobUrl(job.url)!} target="_blank" rel="noopener noreferrer" aria-label={`Open listing for ${job.role}`} className="rounded-lg border p-2 text-slate-500 hover:bg-slate-50"><ArrowUpRight size={17} /></a>}</div><label className="mt-4 text-xs font-medium text-slate-500">Application stage<select aria-label={`Stage for ${job.role} at ${job.company}`} value={job.stage} onChange={e => changeStage(job, e.target.value as JobStage)} className={input}>{JOB_STAGES.map(stage => <option key={stage}>{stage}</option>)}</select></label><div className="mt-4 space-y-1 text-sm text-slate-500">{job.appliedOn && <p>Applied: {job.appliedOn}</p>}{job.followUpOn && <p className={job.followUpOn <= localDate() && !['Offer', 'Closed'].includes(job.stage) ? 'font-medium text-amber-800' : ''}>Follow up: {job.followUpOn}{job.followUpOn <= localDate() && !['Offer', 'Closed'].includes(job.stage) ? ' · Due' : ''}</p>}</div>{job.notes && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-slate-600">{job.notes}</p>}<div className="mt-auto flex gap-4 pt-5"><button onClick={() => open(job)} className="text-sm font-semibold text-blue-800 hover:underline">Edit details</button><button onClick={() => remove(job)} className="text-sm text-slate-500 hover:text-red-700">Delete</button></div></article>)}</div>}
      <dialog aria-labelledby="job-form-title" ref={dialogRef} onCancel={close} onClose={() => setShowForm(false)} className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl rounded-2xl p-0 shadow-2xl backdrop:bg-slate-900/40"><form onSubmit={submit} className="p-6"><div className="mb-5 flex items-center justify-between"><h2 id="job-form-title" className="text-2xl font-semibold">{editing ? 'Edit opportunity' : 'Save an opportunity'}</h2><button type="button" onClick={close} aria-label="Close job form" className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button></div>{error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}<div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Job title<input autoFocus required maxLength={150} value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value })} className={input} /></label><label className="text-sm font-medium">Company<input required maxLength={150} value={draft.company} onChange={e => setDraft({ ...draft, company: e.target.value })} className={input} /></label><label className="text-sm font-medium sm:col-span-2">Job listing URL<input type="url" maxLength={2000} placeholder="https://company.com/careers/role" value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })} className={input} /></label><label className="text-sm font-medium">Stage<select value={draft.stage} onChange={e => setDraft({ ...draft, stage: e.target.value as JobStage })} className={input}>{JOB_STAGES.map(stage => <option key={stage}>{stage}</option>)}</select></label><label className="text-sm font-medium">Application date<input type="date" value={draft.appliedOn} onChange={e => setDraft({ ...draft, appliedOn: e.target.value })} className={input} /></label><label className="text-sm font-medium">Follow-up date<input type="date" value={draft.followUpOn} onChange={e => setDraft({ ...draft, followUpOn: e.target.value })} className={input} /></label><label className="text-sm font-medium sm:col-span-2">Notes<textarea rows={4} maxLength={10000} placeholder="Contacts, interview details, next steps…" value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} className={input} /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={close} className="rounded-xl border px-4 py-2.5 text-sm">Cancel</button><button type="submit" className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Save job</button></div></form></dialog>
    </div>
  </main>;
}
