'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDownToLine, ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays, Check, ChevronLeft, ChevronRight, FileText, GripVertical, LayoutGrid, List, MapPin, Plus, Search, Target, Upload, X } from 'lucide-react';
import { downloadText, JOB_STAGES, JobStage, localDate, readJobs, safeJobUrl, saveJobs, TrackedJob, validateJobs } from '@/lib/careerWorkspace';
import { readDocuments } from '@/components/resumeio/resumeDocument';
import { readLocalLetters } from '@/lib/localCoverLetters';
import './tracker.css';

type JobDraft = Omit<TrackedJob, 'id' | 'updatedAt'>;
type DocumentOption = { id: string; title: string };
type View = 'board' | 'list' | 'calendar';
const blank: JobDraft = { company: '', role: '', url: '', stage: 'Saved', appliedOn: '', followUpOn: '', notes: '', location: '', salary: '', description: '', resumeId: '', letterId: '' };
const active = (job: TrackedJob) => !['Offer', 'Closed'].includes(job.stage);
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const dateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
function afterDays(date: string, days: number) { const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + days); return dateValue(value); }
function csvValue(value: string) { return `"${(/^[\u0000-\u0020]*[=+\-@]|^[\t\r\n]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`; }

export default function JobTrackerPage() {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [ready, setReady] = useState(false);
  const [readable, setReadable] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState<View>('board');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<JobDraft>(blank);
  const [showForm, setShowForm] = useState(false);
  const [resumes, setResumes] = useState<DocumentOption[]>([]);
  const [letters, setLetters] = useState<DocumentOption[]>([]);
  const [dragging, setDragging] = useState('');
  const [dropStage, setDropStage] = useState<JobStage | null>(null);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(localDate);
  const importRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const load = () => {
      try { setJobs(readJobs()); setReadable(true); setError(''); }
      catch { setReadable(false); setError('Your saved jobs could not be read. Existing browser data has been kept. Import a backup to recover it before making changes.'); }
      finally { setReady(true); }
    };
    const loadDocuments = () => {
      const failures: string[] = [];
      try { setResumes(readDocuments().map(doc => ({ id: doc.id, title: doc.resume.title || 'Untitled resume' }))); } catch { failures.push('resumes'); }
      try { setLetters(readLocalLetters().map(doc => ({ id: doc.id, title: doc.title || 'Untitled letter' }))); } catch { failures.push('cover letters'); }
      setDocumentError(failures.length ? `Saved ${failures.join(' and ')} could not be read. Their browser data has been kept.` : '');
    };
    load(); loadDocuments();
    window.addEventListener('storage', load); window.addEventListener('storage', loadDocuments); window.addEventListener('career-jobs-change', load); window.addEventListener('resume-library-change', loadDocuments);
    return () => { window.removeEventListener('storage', load); window.removeEventListener('storage', loadDocuments); window.removeEventListener('career-jobs-change', load); window.removeEventListener('resume-library-change', loadDocuments); };
  }, []);
  useEffect(() => { if (showForm) dialogRef.current?.showModal(); else dialogRef.current?.close(); }, [showForm]);

  const commit = (next: TrackedJob[], message: string, recovery = false) => {
    try {
      if (!recovery) {
        if (!readable) throw new Error('unreadable');
        const latest = readJobs();
        if (latest.length !== jobs.length || latest.some(job => !jobs.some(previous => previous.id === job.id && previous.updatedAt === job.updatedAt))) {
          setJobs(latest); setError('Your tracker changed in another tab. The latest jobs have been loaded. Review them and save again.'); return false;
        }
      }
      saveJobs(next); setJobs(next); setReadable(true); setError(''); setNotice(message); return true;
    } catch { setError('Your changes have not been saved. Browser storage may be full, blocked, or unreadable. Export your current jobs before leaving; import a valid backup to recover unreadable data.'); return false; }
  };
  const open = (job?: TrackedJob) => { returnFocusRef.current = document.activeElement as HTMLElement; setEditing(job?.id || null); setDraft(job ? { ...blank, ...job } : { ...blank }); setShowForm(true); setNotice(''); };
  const close = () => { setShowForm(false); requestAnimationFrame(() => (returnFocusRef.current?.isConnected ? returnFocusRef.current : openButtonRef.current)?.focus()); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.url && !safeJobUrl(draft.url)) { setError('Use a complete http:// or https:// job link.'); return; }
    const job: TrackedJob = { ...draft, role: draft.role.trim(), company: draft.company.trim(), id: editing || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (!job.role || !job.company) { setError('Add a job title and company to save this opportunity.'); return; }
    if (!job.appliedOn && job.stage === 'Applied') job.appliedOn = localDate();
    if (commit(editing ? jobs.map(item => item.id === editing ? job : item) : [job, ...jobs], 'Job saved on this browser.')) close();
  };
  const changeStage = (job: TrackedJob, stage: JobStage) => commit(jobs.map(item => item.id === job.id ? { ...item, stage, appliedOn: stage === 'Applied' && !item.appliedOn ? localDate() : item.appliedOn, updatedAt: new Date().toISOString() } : item), `${job.role} moved to ${stage}.`);
  const followUp = (job: TrackedJob, date: string) => commit(jobs.map(item => item.id === job.id ? { ...item, followUpOn: date, updatedAt: new Date().toISOString() } : item), date ? `Follow-up rescheduled to ${dateLabel(date)}.` : `Follow-up completed for ${job.company}.`);
  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('Choose a backup smaller than 5 MB.');
      const parsed = JSON.parse(await file.text());
      const imported = validateJobs(Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? parsed.jobs : null);
      const merged = [...jobs];
      imported.forEach(job => { if (!merged.some(item => item.id === job.id)) merged.push(job); });
      if (!readable && !window.confirm('Replace unreadable tracker storage with this validated backup? The unreadable data will be replaced.')) return;
      commit(merged, `Imported ${merged.length - jobs.length} jobs. Existing readable jobs were kept.`, !readable);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to import this backup.'); }
    finally { if (importRef.current) importRef.current.value = ''; }
  };
  const exportCsv = () => {
    const columns: [string, Exclude<keyof TrackedJob, 'application'>][] = [['Company', 'company'], ['Role', 'role'], ['Stage', 'stage'], ['Location', 'location'], ['Salary', 'salary'], ['Applied on', 'appliedOn'], ['Follow up on', 'followUpOn'], ['Job URL', 'url'], ['Notes', 'notes'], ['Description', 'description'], ['Resume ID', 'resumeId'], ['Cover letter ID', 'letterId']];
    downloadText('\uFEFF' + [columns.map(([label]) => csvValue(label)).join(','), ...jobs.map(job => columns.map(([, key]) => csvValue(job[key] || '')).join(','))].join('\r\n'), `job-tracker-${localDate()}.csv`, 'text/csv;charset=utf-8');
  };
  const filtered = jobs.filter(job => (filter === 'All' || job.stage === filter) && `${job.company} ${job.role} ${job.location || ''} ${job.notes} ${job.description || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const today = localDate();
  const due = jobs.filter(job => job.followUpOn && job.followUpOn <= today && active(job));
  const upcoming = filtered.filter(job => job.followUpOn && job.followUpOn <= afterDays(today, 7) && active(job)).sort((a, b) => a.followUpOn.localeCompare(b.followUpOn));
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const calendarDays = Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1));
  const calendarJobs = filtered.filter(job => job.followUpOn === selectedDate && active(job));
  const stageSelect = (job: TrackedJob) => <select aria-label={`Stage for ${job.role} at ${job.company}`} value={job.stage} onChange={event => changeStage(job, event.target.value as JobStage)} disabled={!readable} className="tracker-stage-select">{JOB_STAGES.map(stage => <option key={stage}>{stage}</option>)}</select>;
  const documentLinks = (job: TrackedJob) => <div className="tracker-document-links">{job.resumeId && <Link href={`/builder?id=${encodeURIComponent(job.resumeId)}`}><FileText size={13} /> Resume</Link>}{job.letterId && letters.some(letter => letter.id === job.letterId) && <Link href={`/cover-letter?id=${encodeURIComponent(job.letterId)}`}><FileText size={13} /> Cover letter</Link>}<Link href={`/letters?job=${encodeURIComponent(job.id)}${job.resumeId ? `&resume=${encodeURIComponent(job.resumeId)}` : ''}`} aria-label={`Prepare cover letter for ${job.role} at ${job.company}`}><FileText size={13} />Prepare letter</Link><Link href={`/tailor?job=${encodeURIComponent(job.id)}${job.resumeId ? `&resume=${encodeURIComponent(job.resumeId)}` : ''}`} aria-label={`Tailor resume for ${job.role} at ${job.company}`}><Target size={13} />Tailor resume</Link><Link href={`/auto-apply?job=${encodeURIComponent(job.id)}`} aria-label={`Prepare application for ${job.role} at ${job.company}`}><ArrowUpRight size={13} />Auto Apply</Link><Link href={`/salary-analyzer?job=${encodeURIComponent(job.id)}`} aria-label={`Analyze salary for ${job.role} at ${job.company}`}><ArrowUpRight size={13} />Analyze salary</Link></div>;
  const card = (job: TrackedJob) => <article key={job.id} draggable={readable} onDragStart={event => { if ((event.target as HTMLElement).closest('button, a, select')) { event.preventDefault(); return; } event.dataTransfer.setData('text/plain', job.id); event.dataTransfer.effectAllowed = 'move'; setDragging(job.id); }} onDragEnd={() => { setDragging(''); setDropStage(null); }} className={`tracker-card ${dragging === job.id ? 'tracker-card-dragging' : ''}`} data-job-id={job.id}>
    <div className="tracker-card-top"><span className="tracker-company-mark" aria-hidden="true">{job.company.slice(0, 1).toUpperCase()}</span><span className="tracker-company">{job.company}</span><GripVertical size={15} className="tracker-grip" aria-hidden="true" /></div>
    <button className="tracker-role" onClick={() => open(job)}>{job.role}</button>
    {(job.location || job.salary) && <p className="tracker-meta">{job.location && <span><MapPin size={12} />{job.location}</span>}{job.salary && <span>{job.salary}</span>}</p>}
    <div className="tracker-card-stage">{stageSelect(job)}</div>
    {job.appliedOn && <p className="tracker-small">Applied {dateLabel(job.appliedOn)}</p>}
    {job.followUpOn && <p className={`tracker-followup ${job.followUpOn <= today && active(job) ? 'tracker-followup-due' : ''}`}><Bell size={12} />Follow up {dateLabel(job.followUpOn)}{job.followUpOn <= today && active(job) ? ' · Due' : ''}</p>}
    {job.notes && <p className="tracker-card-notes">{job.notes}</p>}{documentLinks(job)}
    <div className="tracker-card-footer"><button onClick={() => open(job)}>Edit details</button>{safeJobUrl(job.url) && <a href={safeJobUrl(job.url)!} target="_blank" rel="noopener noreferrer" aria-label={`Open listing for ${job.role}`}>View job <ArrowUpRight size={13} /></a>}</div>
  </article>;

  return <main data-workspace-ready={ready} className="wk-page tracker-page">
    <header className="tracker-header"><div><p className="tracker-eyebrow">Your career, in motion</p><h1>Job tracker<span className="tracker-heading-count">{jobs.length}</span></h1><p>Every opportunity. A clear next step.</p></div><button ref={openButtonRef} onClick={() => open()} disabled={!ready || !readable} className="tracker-primary"><Plus size={17} /> Add a job</button></header>
    <div className="tracker-stats">{[['Saved jobs', jobs.filter(job => job.stage === 'Saved').length, 'Saved'], ['Applications', jobs.filter(job => job.appliedOn || ['Applied', 'Interview', 'Offer'].includes(job.stage)).length, 'Applied'], ['Interviews', jobs.filter(job => job.stage === 'Interview').length, 'Interview'], ['Offers', jobs.filter(job => job.stage === 'Offer').length, 'Offer']].map(([label, count, stage]) => <button key={label} onClick={() => setFilter(filter === stage ? 'All' : String(stage))} className={`tracker-stat tracker-stat-${String(stage).toLowerCase()}`} aria-label={`Filter ${label}`}><span>{label}</span><strong>{count}</strong><span className="tracker-stat-bar" /></button>)}</div>
    <div className="tracker-storage-note"><span><Check size={14} />Saved in this browser on this device. Export a backup to keep a copy.</span><span>No account or cloud sync</span></div>
    {error && <div role="alert" className="tracker-alert">{error}</div>}{notice && <p role="status" className="tracker-notice">{notice}</p>}
    <section className="tracker-workspace" aria-label="Job applications">
      <div className="tracker-workspace-top"><div className="tracker-view-tabs" aria-label="Tracker view">{([['board', LayoutGrid, 'Board'], ['list', List, 'List'], ['calendar', CalendarDays, 'Calendar']] as const).map(([value, Icon, label]) => <button key={value} aria-pressed={view === value} onClick={() => setView(value)}><Icon size={16} />{label}</button>)}</div><div className="tracker-backups"><button disabled={!ready} onClick={() => downloadText(JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), jobs }, null, 2), `job-tracker-${today}.json`)}><ArrowDownToLine size={14} /> Export backup</button><button disabled={!ready} onClick={exportCsv}>CSV</button><button onClick={() => importRef.current?.click()} disabled={!ready}><Upload size={14} /> Import backup</button><input type="file" accept=".json,application/json" ref={importRef} onChange={event => importBackup(event.target.files?.[0])} hidden aria-label="Import job tracker backup" /></div></div>
      <div className="tracker-toolbar"><label className="tracker-search"><Search size={16} /><input aria-label="Search jobs" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search job title, company, notes…" /></label><div className="tracker-stage-filters" aria-label="Filter job stage">{['All', ...JOB_STAGES].map(stage => <button key={stage} aria-pressed={filter === stage} onClick={() => setFilter(stage)}>{stage}<span>{stage === 'All' ? jobs.length : jobs.filter(job => job.stage === stage).length}</span></button>)}</div></div>
      {!ready ? <p role="status" className="tracker-empty">Loading your jobs…</p> : !readable ? <div className="tracker-empty"><BriefcaseBusiness size={30} /><h2>Your tracker data needs attention</h2><p>Import a valid backup to recover your jobs. Existing browser data is kept until you confirm recovery.</p></div> : filtered.length === 0 ? <div className="tracker-empty"><BriefcaseBusiness size={30} /><h2>{jobs.length ? 'No matching opportunities' : 'Make your next move'}</h2><p>{jobs.length ? 'Try another search or stage.' : 'Found a role you like? Save it here and give every application a plan.'}</p>{!jobs.length && <button onClick={() => open()} className="tracker-primary"><Plus size={16} /> Add your first job</button>}</div> : view === 'board' ? <><p className="tracker-board-hint">Drag a card to update its stage, or use the stage menu on any card.</p><div className="tracker-board" aria-label="Application board">{JOB_STAGES.filter(stage => filter === 'All' || stage === filter).map(stage => <section key={stage} className={`tracker-column tracker-column-${stage.toLowerCase()} ${dropStage === stage ? 'tracker-column-drop' : ''}`} aria-label={`${stage} applications`} onDragOver={event => { if (dragging) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropStage(stage); } }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropStage(null); }} onDrop={event => { event.preventDefault(); const job = jobs.find(item => item.id === event.dataTransfer.getData('text/plain')); if (job && job.stage !== stage) changeStage(job, stage); setDragging(''); setDropStage(null); }}><header><h2><span />{stage}<b>{filtered.filter(job => job.stage === stage).length}</b></h2><button onClick={() => { open(); setDraft({ ...blank, stage }); }} aria-label={`Add ${stage.toLowerCase()} job`}><Plus size={16} /></button></header><div className="tracker-column-cards">{filtered.filter(job => job.stage === stage).map(card)}{!filtered.some(job => job.stage === stage) && <div className="tracker-column-empty">Drop an opportunity here</div>}</div></section>)}</div></> : view === 'list' ? <div className="tracker-list">{filtered.map(job => <article key={job.id} className="tracker-list-row" data-job-id={job.id}><div className="tracker-list-company"><span className="tracker-company-mark" aria-hidden="true">{job.company.slice(0, 1).toUpperCase()}</span><div><button className="tracker-role" onClick={() => open(job)}>{job.role}</button><p>{job.company}{job.location ? ` · ${job.location}` : ''}</p></div></div><div>{stageSelect(job)}</div><div className={`tracker-list-date ${job.followUpOn && job.followUpOn <= today && active(job) ? 'tracker-followup-due' : ''}`}><span>Follow-up</span><strong>{job.followUpOn ? dateLabel(job.followUpOn) : 'Not scheduled'}</strong></div><div className="tracker-list-actions">{documentLinks(job)}<button onClick={() => open(job)} aria-label={`Edit ${job.role} at ${job.company}`}>Edit details</button>{safeJobUrl(job.url) && <a href={safeJobUrl(job.url)!} target="_blank" rel="noopener noreferrer" aria-label={`Open listing for ${job.role}`}><ArrowUpRight size={17} /></a>}</div></article>)}</div> : <div className="tracker-calendar-layout"><div className="tracker-calendar"><div className="tracker-calendar-heading"><h2>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2><div><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft size={17} /></button><button onClick={() => { setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setSelectedDate(today); }}>Today</button><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight size={17} /></button></div></div><div className="tracker-calendar-grid"><div className="tracker-calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}</div><div className="tracker-calendar-days">{calendarDays.map(date => { const value = dateValue(date); const count = filtered.filter(job => job.followUpOn === value && active(job)).length; return <button key={value} aria-label={`${value}${count ? `, ${count} follow-up${count === 1 ? '' : 's'}` : ''}`} aria-pressed={selectedDate === value} onClick={() => setSelectedDate(value)} className={`${date.getMonth() !== month.getMonth() ? 'tracker-outside-month' : ''} ${value === today ? 'tracker-calendar-today' : ''}`}><span>{date.getDate()}</span>{count > 0 && <b>{count}<span className="tracker-calendar-label"> follow-up{count === 1 ? '' : 's'}</span></b>}</button>; })}</div></div></div><aside className="tracker-calendar-agenda"><p className="tracker-eyebrow">Your schedule</p><h3>{dateLabel(selectedDate)}</h3>{calendarJobs.length ? calendarJobs.map(job => <div key={job.id} className="tracker-agenda-job"><span>{job.company}</span><button className="tracker-role" onClick={() => open(job)}>{job.role}</button><div><button onClick={() => followUp(job, '')}><Check size={13} /> Mark done</button><button onClick={() => followUp(job, afterDays(selectedDate, 7))}>+7 days</button></div></div>) : <p className="tracker-small">No follow-ups scheduled. Open a job to plan its next step.</p>}</aside></div>}
      <p className="tracker-result-count">{filtered.length} of {jobs.length} opportunities{filter !== 'All' ? ` · ${filter}` : ''}</p>
    </section>
    {readable && jobs.length > 0 && <section className="tracker-followups" aria-label="Upcoming follow-ups"><div className="tracker-section-title"><div><h2><Bell size={18} /> A little follow-up goes a long way</h2><p>{due.length ? `${due.length} follow-up${due.length === 1 ? '' : 's'} due. ` : ''}Your overdue and next seven days, with current filters.</p></div><button onClick={() => setView('calendar')}>Open calendar <ChevronRight size={15} /></button></div>{upcoming.length ? <div className="tracker-followup-list">{upcoming.map(job => <div key={job.id} className="tracker-followup-row"><span className={`tracker-due-date ${job.followUpOn <= today ? 'tracker-due-date-active' : ''}`}>{dateLabel(job.followUpOn)}<small>{job.followUpOn < today ? 'Overdue' : job.followUpOn === today ? 'Today' : 'Upcoming'}</small></span><div><button className="tracker-role" onClick={() => open(job)}>{job.role}</button><p>{job.company} · {job.stage}</p></div><div className="tracker-followup-actions"><button onClick={() => followUp(job, '')} aria-label={`Complete follow-up for ${job.role} at ${job.company}`}><Check size={14} /> Mark done</button><button onClick={() => followUp(job, afterDays(job.followUpOn < today ? today : job.followUpOn, 7))} aria-label={`Reschedule follow-up for ${job.role} at ${job.company} by 7 days`}>+7 days</button></div></div>)}</div> : <p className="tracker-followup-clear"><Check size={16} /> All clear for the next seven days. Add a follow-up date to a job to plan ahead.</p>}</section>}
    <dialog aria-labelledby="job-form-title" ref={dialogRef} onCancel={event => { event.preventDefault(); close(); }} onClose={() => setShowForm(false)} className="tracker-dialog"><form onSubmit={submit}><div className="tracker-dialog-heading"><div><p className="tracker-eyebrow">One step closer</p><h2 id="job-form-title">{editing ? 'Edit opportunity' : 'Save an opportunity'}</h2></div><button type="button" onClick={close} aria-label="Close job form"><X size={21} /></button></div>{error && <p role="alert" className="tracker-alert">{error}</p>}<div className="tracker-form-grid"><label>Job title<input autoFocus required maxLength={150} value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value })} /></label><label>Company<input required maxLength={150} value={draft.company} onChange={event => setDraft({ ...draft, company: event.target.value })} /></label><label>Location<input maxLength={200} placeholder="City, country or remote" value={draft.location} onChange={event => setDraft({ ...draft, location: event.target.value })} /></label><label>Salary<input maxLength={200} placeholder="e.g. R45,000–R55,000 / month" value={draft.salary} onChange={event => setDraft({ ...draft, salary: event.target.value })} /></label><label className="tracker-form-full">Job listing URL<input type="url" maxLength={2000} placeholder="https://company.com/careers/role" value={draft.url} onChange={event => setDraft({ ...draft, url: event.target.value })} /></label><label>Stage<select aria-label="Stage" value={draft.stage} onChange={event => setDraft({ ...draft, stage: event.target.value as JobStage })}>{JOB_STAGES.map(stage => <option key={stage}>{stage}</option>)}</select></label><label>Application date<input type="date" min="1900-01-01" max="2199-12-31" value={draft.appliedOn} onChange={event => setDraft({ ...draft, appliedOn: event.target.value })} /></label><label>Follow-up date<input type="date" min="1900-01-01" max="2199-12-31" value={draft.followUpOn} onChange={event => setDraft({ ...draft, followUpOn: event.target.value })} /></label><div /><label>Linked resume<select aria-label="Linked resume" value={draft.resumeId} onChange={event => setDraft({ ...draft, resumeId: event.target.value })}><option value="">No linked resume</option>{draft.resumeId && !resumes.some(doc => doc.id === draft.resumeId) && <option value={draft.resumeId}>Previously linked resume</option>}{resumes.map(doc => <option key={doc.id} value={doc.id}>{doc.title}</option>)}</select></label><label>Linked cover letter<select aria-label="Linked cover letter" value={draft.letterId} onChange={event => setDraft({ ...draft, letterId: event.target.value })}><option value="">No linked cover letter</option>{draft.letterId && !letters.some(doc => doc.id === draft.letterId) && <option value={draft.letterId}>Previously linked cover letter</option>}{letters.map(doc => <option key={doc.id} value={doc.id}>{doc.title}</option>)}</select></label>{documentError && <p className="tracker-form-full tracker-small">{documentError}</p>}<p className="tracker-form-full tracker-small">Link documents saved in this browser. <Link href="/builder?new=1">Create a resume</Link> or <Link href="/cover-letter">write a cover letter</Link>.</p><label className="tracker-form-full">Job description<textarea rows={4} maxLength={30000} placeholder="Save the requirements, responsibilities and details you want to tailor for." value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label><label className="tracker-form-full">Notes<textarea rows={4} maxLength={10000} placeholder="Contacts, interview details, next steps…" value={draft.notes} onChange={event => setDraft({ ...draft, notes: event.target.value })} /></label></div><div className="tracker-dialog-footer">{editing && <button type="button" className="tracker-delete" onClick={() => { const job = jobs.find(item => item.id === editing); if (job && window.confirm(`Delete ${job.role} at ${job.company}?`) && commit(jobs.filter(item => item.id !== job.id), 'Job removed.')) close(); }}>Delete job</button>}<button type="button" onClick={close}>Cancel</button><button type="submit" className="tracker-primary">Save job</button></div></form></dialog>
  </main>;
}
