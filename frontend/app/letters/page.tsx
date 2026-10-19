'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Copy, Download, FileText, Link2, Mail, Plus, Search, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { readDocuments, SavedResume } from '@/components/resumeio/resumeDocument';
import { CoverLetterPreview } from '@/components/coverLetter/CoverLetterPreview';
import { APPLICATION_LETTER_STYLES, linkApplicationLetter, startApplicationLetter, unlinkApplicationLetter } from '@/lib/applicationLetters';
import { deleteLocalLetter, duplicateLocalLetter, importLocalLetters, LETTER_STORAGE_KEY, readLocalLetters } from '@/lib/localCoverLetters';
import { downloadText, readJobs, TrackedJob } from '@/lib/careerWorkspace';
import { IS_LOCAL_STORAGE } from '@/lib/apiConfig';
import type { CoverLetter } from '@/types/coverLetter';

type PendingAttachment = { kind: 'attach' | 'detach'; jobId: string; letterId: string; expected: string; jobLabel: string; letterTitle: string; mismatch: boolean };

export default function LettersPage() {
  return <Suspense fallback={<main className="wk-page"><p role="status">Opening your cover letters…</p></main>}><ApplicationLetters /></Suspense>;
}
function ApplicationLetters() {
  const query = useSearchParams().toString();
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [ready, setReady] = useState(false);
  const [libraryErrors, setLibraryErrors] = useState({ letters: '', resumes: '', jobs: '' });
  const [letterId, setLetterId] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('professional');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const initialized = useRef<string | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const selected = letters.find(letter => letter.id === letterId);
  const resume = resumes.find(document => document.id === resumeId);
  const job = jobs.find(item => item.id === jobId);
  const source = resumes.find(document => document.id === selected?.workspace_context?.resumeId);
  const attachments = selected ? jobs.filter(item => item.letterId === selected.id) : [];
  const linked = !!job && job.letterId === selected?.id;
  const matching = letters.filter(letter => `${letter.title} ${letter.sender.full_name} ${letter.job_details.job_title} ${letter.job_details.company_name}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!IS_LOCAL_STORAGE) { setReady(true); return; }
    const load = () => {
      const errors = { letters: '', resumes: '', jobs: '' };
      try { setLetters(readLocalLetters()); } catch (value) { errors.letters = value instanceof Error ? value.message : 'Saved cover letters could not be read.'; }
      try { setResumes(readDocuments()); } catch { errors.resumes = 'Saved resumes could not be read. Existing browser data has been kept.'; }
      try { setJobs(readJobs()); } catch { errors.jobs = 'Saved applications could not be read. Existing browser data has been kept.'; }
      setLibraryErrors(errors); setReady(true);
    };
    const events = ['storage', 'resume-library-change', 'career-jobs-change'];
    load(); events.forEach(event => window.addEventListener(event, load));
    return () => events.forEach(event => window.removeEventListener(event, load));
  }, []);
  useEffect(() => {
    if (!ready || initialized.current === query) return;
    initialized.current = query;
    const params = new URLSearchParams(query);
    const requestedJob = params.get('job');
    const requestedLetter = params.get('letter');
    const initialLetter = requestedLetter ? letters.find(item => item.id === requestedLetter) : undefined;
    const initialJob = jobs.find(item => item.id === (requestedJob || initialLetter?.workspace_context?.jobId));
    const initialResume = resumes.find(item => item.id === (params.get('resume') || initialJob?.resumeId || initialLetter?.workspace_context?.resumeId)) || (!params.has('resume') && !initialJob && !initialLetter ? resumes[0] : undefined);
    setJobId(initialJob?.id || ''); setResumeId(initialResume?.id || '');
    setRole(initialJob?.role || initialResume?.tailoring?.role || ''); setCompany(initialJob?.company || initialResume?.tailoring?.company || ''); setDescription(initialJob?.description || initialResume?.tailoring?.description || '');
    setLetterId(initialLetter?.id || (requestedJob ? initialJob?.letterId || '' : letters[0]?.id || ''));
    if (requestedJob && !initialJob) setError('That application is no longer saved. Choose another opportunity or enter its details.');
    else if (requestedLetter && !initialLetter) setError('That cover letter is no longer saved. Choose another letter below.');
    else if (params.has('resume') && !initialResume) setError('That resume is no longer saved. Choose another resume or start without one.');
  }, [ready, query, jobs, resumes, letters]);
  useEffect(() => {
    if (pending) confirmation.current?.showModal();
    else { confirmation.current?.close(); returnFocus.current?.focus(); }
  }, [pending]);

  const failure = (value: unknown) => { setNotice(''); setError(value instanceof Error ? value.message : 'This change could not be saved. Existing browser data has been kept.'); };
  const chooseJob = (id: string) => {
    setJobId(id); setError(''); setNotice('');
    const next = jobs.find(item => item.id === id);
    if (next) { setRole(next.role); setCompany(next.company); setDescription(next.description || ''); setLetterId(next.letterId || ''); if (next.resumeId) setResumeId(next.resumeId); }
  };
  const create = (event: React.FormEvent) => {
    event.preventDefault();
    try { const letter = startApplicationLetter({ resumeId, jobId, role, company, description, template, includeSummary }); setLetterId(letter.id); setError(''); setNotice('Your separate cover letter is saved. Review the starter text in the editor, then attach it when you’re ready.'); }
    catch (value) { failure(value); }
  };
  const attach = () => {
    if (!job || !selected) return;
    const expected = job.letterId || '';
    const mismatch = selected.job_details.job_title.trim().toLowerCase() !== job.role.trim().toLowerCase() || selected.job_details.company_name.trim().toLowerCase() !== job.company.trim().toLowerCase();
    if (expected || mismatch) {
      returnFocus.current = document.activeElement as HTMLElement;
      setPending({ kind: 'attach', jobId: job.id, letterId: selected.id, expected, jobLabel: `${job.role} at ${job.company}`, letterTitle: selected.title, mismatch });
      return;
    }
    try { linkApplicationLetter(job.id, selected.id, expected); setError(''); setNotice('Cover letter attached. The application’s resume, notes, dates and stage have been kept.'); }
    catch (value) { failure(value); }
  };
  const detach = (item: TrackedJob) => {
    if (!selected) return;
    returnFocus.current = document.activeElement as HTMLElement;
    setPending({ kind: 'detach', jobId: item.id, letterId: selected.id, expected: selected.id, jobLabel: `${item.role} at ${item.company}`, letterTitle: selected.title, mismatch: false });
  };
  const confirmAttachment = () => {
    if (!pending) return;
    try {
      if (pending.kind === 'attach') linkApplicationLetter(pending.jobId, pending.letterId, pending.expected);
      else unlinkApplicationLetter(pending.jobId, pending.expected);
      setError(''); setNotice(pending.kind === 'attach' ? 'Cover letter attached. Your previous letter is still in the library, and the application’s other details have been kept.' : 'The application attachment was removed. Your saved letter is still available.');
    } catch (value) { failure(value); }
    finally { setPending(null); }
  };
  const duplicate = (id: string) => { try { const copy = duplicateLocalLetter(id); setLetterId(copy.id); setError(''); setNotice('An independent letter copy is saved. Application attachments are unchanged.'); } catch (value) { failure(value); } };
  const remove = (letter: CoverLetter) => {
    if (!window.confirm(`Delete “${letter.title}” from this browser? Back up first if you need it later. Existing applications will need another cover letter.`)) return;
    try { deleteLocalLetter(letter.id); if (letterId === letter.id) setLetterId(''); setError(''); setNotice('Cover letter deleted. Your resumes and applications have been kept.'); } catch (value) { failure(value); }
  };
  const backup = () => { try { const current = readLocalLetters(); downloadText(JSON.stringify({ format: 'careerforge.cover-letters', version: 1, letters: current }, null, 2), 'careerforge-cover-letters.json'); setError(''); setNotice('Cover-letter JSON backup downloaded. Import it here to restore editable copies.'); } catch (value) { failure(value); } };
  const importBackup = async (file?: File) => {
    if (!file) return;
    try { if (!/\.json$/i.test(file.name) || file.size > 10 * 1024 * 1024) throw new Error('Choose a cover-letter JSON backup up to 10 MB.'); const imported = importLocalLetters(JSON.parse(await file.text())); setLetterId(imported[0].id); setError(''); setNotice(`${imported.length} editable ${imported.length === 1 ? 'copy restored' : 'copies restored'}. Existing letters and application attachments have been kept.`); }
    catch (value) { failure(value); } finally { if (upload.current) upload.current.value = ''; }
  };

  if (!IS_LOCAL_STORAGE) return <main className="wk-page"><section className="wk-panel wk-empty"><Mail size={30} /><h1>Your cover letters</h1><p>Open the letter builder to create and manage letters in this workspace.</p><Link className="wk-button wk-button-primary" href="/cover-letter">Open cover letters<ArrowRight size={16} /></Link></section></main>;
  return <main className="wk-page letters-page" data-workspace-ready={ready}>
    <div className="wk-heading"><div><span className="wk-eyebrow">Go beyond the bullet points</span><h1>Give your application a voice.</h1><p>A personal introduction, connected to your next opportunity.</p></div><div className="wk-heading-actions"><input ref={upload} type="file" accept=".json" aria-label="Import cover-letter backup" hidden onChange={event => importBackup(event.target.files?.[0])} /><button className="wk-button wk-button-plain" disabled={!ready || !!libraryErrors.letters} onClick={() => upload.current?.click()}><Upload size={15} />Import backup</button><button className="wk-button wk-button-plain" disabled={!ready || !letters.length || !!libraryErrors.letters} onClick={backup}><Download size={15} />Back up letters</button></div></div>
    {(error || Object.values(libraryErrors).some(Boolean)) && <p role="alert" className="wk-alert">{[error, ...Object.values(libraryErrors)].filter(Boolean).join(' ')}</p>}
    {notice && <p role="status" className="letters-notice"><CheckCircle2 size={16} />{notice}</p>}
    {!ready ? <p role="status" className="wk-empty">Loading your saved work…</p> : <>
      <div className="letters-layout"><section className="wk-panel letters-start" aria-label="Start a cover letter"><div className="wk-panel-heading"><div><h2>A head start, in your words.</h2><p>Bring your details. Make the introduction yours.</p></div><Mail size={22} /></div><form onSubmit={create} className="letters-fields">
        <label>Tracked opportunity<select className="wk-input" aria-label="Tracked opportunity" disabled={!!libraryErrors.jobs} value={jobId} onChange={event => chooseJob(event.target.value)}><option value="">Enter job details myself</option>{jobs.map(item => <option value={item.id} key={item.id}>{item.role} · {item.company}</option>)}</select></label>
        <label>Starting resume<select className="wk-input" aria-label="Starting resume" disabled={!!libraryErrors.resumes} value={resumeId} onChange={event => setResumeId(event.target.value)}><option value="">Start without a resume</option>{resumes.map(document => <option value={document.id} key={document.id}>{document.resume.title}</option>)}</select></label>
        <p className="letters-hint">Copies contact details into a separate letter. Your resume stays unchanged.</p>
        <div className="letters-pair"><label>Target role<input required maxLength={150} className="wk-input" value={role} onChange={event => setRole(event.target.value)} placeholder="e.g. Process Engineer" /></label><label>Company<input maxLength={150} className="wk-input" value={company} onChange={event => setCompany(event.target.value)} placeholder="Your next opportunity" /></label></div>
        <label>Job description<textarea aria-label="Job description" maxLength={30000} rows={4} className="wk-input" value={description} onChange={event => setDescription(event.target.value)} placeholder="Keep the role’s requirements alongside your letter." /></label>
        <label>Letter style<select aria-label="Letter style" className="wk-input" value={template} onChange={event => setTemplate(event.target.value)}>{APPLICATION_LETTER_STYLES.map(style => <option key={style} value={style}>{style[0].toUpperCase() + style.slice(1)}</option>)}</select></label>
        <label className="letters-summary-option"><input type="checkbox" checked={includeSummary} disabled={!resume?.resume.summary?.summary.trim()} onChange={event => setIncludeSummary(event.target.checked)} /><span>Use my resume summary as a starting paragraph<small>{resume?.resume.summary?.summary.trim() ? 'Copies your existing words for you to adapt in the editor.' : 'Choose a resume with a summary to use this option.'}</small></span></label>
        <button className="wk-button wk-button-primary" type="submit" disabled={!role.trim() || !!libraryErrors.letters || (!!resumeId && !!libraryErrors.resumes) || (!!jobId && !!libraryErrors.jobs)}><Plus size={16} />Create cover letter</button><p className="letters-hint">Starts with your supplied details and a simple opening. Add your own relevant examples and closing before sending.</p>
      </form></section>
      <section className="letters-review" aria-label="Selected cover letter">{selected ? <>
        <section className="wk-panel letters-current"><div><span className="wk-small-label">YOUR SAVED INTRODUCTION</span><h2>{selected.title}</h2><p>{[selected.job_details.job_title, selected.job_details.company_name].filter(Boolean).join(' · ') || 'Ready to make your own'}</p></div><Link className="wk-button wk-button-primary" href={`/cover-letter?id=${encodeURIComponent(selected.id)}`}>Edit letter<ArrowRight size={15} /></Link>
          <div className="letters-context"><span><FileText size={14} />{source ? <Link href={`/builder?id=${encodeURIComponent(source.id)}`}>{source.resume.title}</Link> : selected.workspace_context?.resumeId ? 'Starting resume no longer in this browser' : 'Written without a starting resume'}</span>{job && <button className="wk-button wk-button-secondary" disabled={linked || !!libraryErrors.jobs || !!libraryErrors.letters} onClick={attach}><Link2 size={14} />{linked ? 'Attached to this application' : 'Use for this application'}</button>}</div>
          {job && <p className="letters-attach-caption">{linked ? 'Open this saved letter directly from your job tracker.' : `Attach to ${job.role} at ${job.company}. Its other details stay in place.`}</p>}
          {attachments.length > 0 && <div className="letters-attachments"><span className="wk-small-label">ATTACHED APPLICATIONS</span>{attachments.map(item => <div key={item.id}><Link href="/job-tracker">{item.role} · {item.company}</Link><button aria-label={`Detach letter from ${item.role} at ${item.company}`} onClick={() => detach(item)}>Remove attachment</button></div>)}</div>}
        </section><div className="letters-live-preview"><CoverLetterPreview coverLetter={selected} template={selected.settings.template} /></div>
      </> : <section className="wk-panel wk-empty letters-empty"><span className="wk-empty-icon"><Mail size={32} /></span><h2>A little context. A lasting impression.</h2><p>Create a letter from the details on the left, or choose a saved letter below. Your real preview will appear here.</p><div><span><FileText size={15} />Your contact details, ready to go</span><span><Link2 size={15} />Documents together for each application</span></div></section>}</section></div>
      <section className="letters-library" aria-label="Saved cover letters"><div className="letters-library-heading"><div><span className="wk-eyebrow">Words worth keeping</span><h2>Your cover letters <span>{letters.length}</span></h2></div><div className="wk-search"><Search size={15} /><input aria-label="Search cover letters" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by title, role or company" /></div></div>
        {matching.length ? <div className="letters-card-grid">{matching.map(letter => <article className={`wk-panel letters-card ${letter.id === selected?.id ? 'is-selected' : ''}`} key={letter.id}><button className="letters-card-preview" aria-label={`Preview ${letter.title}`} aria-pressed={letter.id === selected?.id} onClick={() => setLetterId(letter.id)}><Mail size={22} /><span className="wk-small-label">{letter.settings.template} · cover letter</span><h3>{letter.title}</h3><p>{[letter.job_details.job_title, letter.job_details.company_name].filter(Boolean).join(' · ') || 'A personal introduction'}</p></button><div className="letters-card-actions"><Link className="wk-text-link" href={`/cover-letter?id=${encodeURIComponent(letter.id)}`}>Edit letter<ArrowRight size={14} /></Link><button title="Duplicate letter" aria-label={`Duplicate ${letter.title}`} onClick={() => duplicate(letter.id)} disabled={!!libraryErrors.letters}><Copy size={14} /></button><button title="Back up letter" aria-label={`Back up ${letter.title}`} onClick={() => downloadText(JSON.stringify(letter, null, 2), `${letter.title.replace(/[^a-z0-9 -]/gi, '_')}.json`)}><Download size={14} /></button><button title="Delete letter" aria-label={`Delete ${letter.title}`} onClick={() => remove(letter)} disabled={!!libraryErrors.letters}><Trash2 size={14} /></button></div></article>)}</div> : <div className="wk-panel letters-library-empty"><Mail size={24} /><p>{search ? 'No matching cover letters. Try another title, role or company.' : 'Your saved letters will be here, ready for the next opportunity.'}</p></div>}
      </section><p className="letters-storage"><ShieldCheck size={15} />Saved in this browser on this device. JSON backups restore editable letters; PDF and DOCX exports use the document-processing service.</p>
      <dialog className="wk-dialog letters-confirmation" ref={confirmation} aria-labelledby="letter-attachment-title" onCancel={() => setPending(null)} onClose={() => setPending(null)}>{pending && <div><h2 id="letter-attachment-title">{pending.kind === 'attach' ? 'Use this cover letter?' : 'Remove this attachment?'}</h2><p><strong>{pending.letterTitle}</strong></p><p>{pending.kind === 'attach' ? 'Attach to' : 'Remove from'} {pending.jobLabel}.</p>{pending.mismatch && <p className="wk-alert">This letter’s target details differ from the application. Review its wording before sending.</p>}<p>Your saved letters stay in the library. The application’s resume, notes, dates and stage stay in place.</p><div className="wk-dialog-actions"><button autoFocus className="wk-button wk-button-plain" onClick={() => setPending(null)}>Cancel</button><button className="wk-button wk-button-primary" onClick={confirmAttachment}>{pending.kind === 'attach' ? 'Confirm attachment' : 'Remove attachment'}</button></div></div>}</dialog>
    </>}
  </main>;
}
