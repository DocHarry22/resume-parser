'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Check, CheckCircle2, Copy, FileText, Lightbulb, Link2, Plus, Save, Target } from 'lucide-react';
import { createTailoredDocument, readDocuments, ResumeTarget, SavedResume, saveResumeTarget } from '@/components/resumeio/resumeDocument';
import { readJobs, saveJobs } from '@/lib/careerWorkspace';
import { analyzeTerms, parseTerms, suggestTerms } from '@/lib/resumeTailoring';
import { useWorkspaceData } from '@/components/workspace/workspaceData';
import DocumentThumbnail from '@/components/workspace/DocumentThumbnail';

export default function TailorPage() {
  return <Suspense fallback={<main className="wk-page"><p role="status">Opening resume tailoring…</p></main>}><TailoringWorkspace /></Suspense>;
}

function TailoringWorkspace() {
  const query = useSearchParams().toString();
  const { resumes, jobs, ready, error: libraryError } = useWorkspaceData();
  const [resumeId, setResumeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [termText, setTermText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const handled = useRef<string | null>(null);
  const expected = useRef('null');
  const chosen = resumes.find(document => document.id === resumeId);
  const selectedJob = jobs.find(job => job.id === jobId);
  const terms = useMemo(() => parseTerms(termText), [termText]);
  const suggestions = useMemo(() => suggestTerms(description), [description]);
  const evidence = useMemo(() => chosen ? analyzeTerms(chosen, terms) : [], [chosen, terms]);
  const matched = evidence.filter(item => item.found);
  const missing = evidence.filter(item => !item.found);
  const invalidTerms = terms.length > 60 || terms.some(term => term.length > 80);
  const linked = !!chosen && !!selectedJob && selectedJob.resumeId === chosen.id;
  const targetChanged = !!chosen?.tailoring && (jobId !== chosen.tailoring.jobId || role.trim() !== chosen.tailoring.role || company.trim() !== chosen.tailoring.company || description !== chosen.tailoring.description || JSON.stringify(terms) !== JSON.stringify(chosen.tailoring.terms));

  const loadTarget = (document?: SavedResume) => {
    const target = document?.tailoring;
    expected.current = JSON.stringify(target || null);
    setJobId(target?.jobId || ''); setRole(target?.role || ''); setCompany(target?.company || '');
    setDescription(target?.description || ''); setTermText(target?.terms.join('\n') || '');
  };
  useEffect(() => {
    if (!ready || handled.current === query) return;
    handled.current = query;
    const params = new URLSearchParams(query);
    const job = jobs.find(item => item.id === params.get('job'));
    const requested = params.get('resume');
    const document = requested ? resumes.find(item => item.id === requested) : resumes.find(item => item.id === job?.resumeId) || resumes[0];
    setResumeId(document?.id || ''); loadTarget(document);
    if (requested && !document) setError('That resume is not saved in this browser. Choose a saved document below.');
    if (params.has('job') && !job) setError('That opportunity is no longer in this browser. Paste its description or choose another job.');
    if (job) { setJobId(job.id); setRole(job.role); setCompany(job.company); setDescription(job.description || ''); setTermText(document?.tailoring?.jobId === job.id ? document.tailoring.terms.join('\n') : suggestTerms(job.description || '').join('\n')); }
  }, [query, ready, resumes, jobs]);

  const chooseResume = (id: string) => {
    setResumeId(id); setError(''); setNotice('');
    const document = resumes.find(item => item.id === id);
    expected.current = JSON.stringify(document?.tailoring || null);
    if (document?.tailoring) loadTarget(document);
  };
  const chooseJob = (id: string) => {
    setJobId(id); setNotice(''); setError('');
    const job = jobs.find(item => item.id === id);
    if (job) { setRole(job.role); setCompany(job.company); setDescription(job.description || ''); setTermText(suggestTerms(job.description || '').join('\n')); }
  };
  const target = (): Omit<ResumeTarget, 'sourceResumeId'> => ({ jobId, role, company, description, terms });
  const persist = () => {
    if (!chosen) return;
    setError(''); setNotice('');
    try {
      const saved = chosen.tailoring
        ? saveResumeTarget(chosen.id, { ...target(), sourceResumeId: chosen.tailoring.sourceResumeId }, expected.current)
        : createTailoredDocument(chosen.id, target());
      setResumeId(saved.id); expected.current = JSON.stringify(saved.tailoring);
      const url = `/tailor?resume=${encodeURIComponent(saved.id)}`;
      handled.current = url.split('?')[1]; window.history.replaceState(null, '', url);
      setNotice(chosen.tailoring ? 'Target details saved. Your resume content is unchanged.' : 'Your tailored copy is saved. Open the editor to adapt your own experience; the original is unchanged.');
    } catch (failure) { setError(`${failure instanceof Error ? failure.message : 'The copy could not be saved.'} Your original resume has been kept. If browser storage is full, download a backup before clearing anything.`); }
  };
  const linkToJob = () => {
    if (!chosen?.tailoring || !jobId) return;
    if (targetChanged) { setError('Save the updated target details before linking this resume.'); return; }
    try {
      if (!readDocuments().some(document => document.id === chosen.id)) throw new Error('This resume was removed. Choose another saved resume.');
      const latest = readJobs();
      const currentJob = latest.find(job => job.id === jobId);
      if (!currentJob) throw new Error('This opportunity was removed. Your tailored copy is still saved.');
      saveJobs(latest.map(job => job.id === jobId ? { ...job, resumeId: chosen.id, updatedAt: new Date().toISOString() } : job));
      setError(''); setNotice('Your tailored resume is linked to this application. Its other job details have been kept.');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'The application link could not be saved. Your resume copy is still available.'); }
  };
  const toggleTerm = (term: string) => setTermText(terms.some(item => item.toLowerCase() === term.toLowerCase()) ? terms.filter(item => item.toLowerCase() !== term.toLowerCase()).join('\n') : [...terms, term].join('\n'));
  const editorHref = (section?: string) => `/builder?id=${encodeURIComponent(resumeId)}${section ? `&section=${section}` : ''}`;
  const guardEditor = (event: React.MouseEvent<HTMLAnchorElement>) => { if (targetChanged) { event.preventDefault(); setError('Save your target details before opening the editor.'); } };

  return <main className="wk-page tailor-page" data-workspace-ready={ready}>
    <div className="wk-heading"><div><span className="wk-eyebrow">The right experience. The right emphasis.</span><h1>Make your next application personal.</h1><p>A focused resume for a specific opportunity, with your original kept safe.</p></div><span className="tailor-local"><Target size={15} />Private, browser-based comparison</span></div>
    {(error || libraryError) && <p role="alert" className="wk-alert">{error || libraryError}</p>}
    {notice && <p role="status" className="tailor-notice"><CheckCircle2 size={16} />{notice}</p>}
    <div className="tailor-steps" aria-label="Tailoring workflow"><span className={chosen ? 'is-complete' : ''}><b>1</b>Choose a resume</span><i /><span className={description.trim() ? 'is-complete' : ''}><b>2</b>Add the opportunity</span><i /><span className={chosen?.tailoring ? 'is-complete' : ''}><b>3</b>Make it your own</span></div>
    {!ready ? <p role="status" className="wk-empty">Loading your saved work…</p> : !resumes.length ? <section className="wk-panel wk-empty"><span className="wk-empty-icon"><FileText size={28} /></span><h2>Start with your experience.</h2><p>Build or import a resume first. Then create a separate version for each opportunity.</p><Link href="/builder?new=1" className="wk-button wk-button-primary"><Plus size={16} />Create a resume</Link><Link href="/builder?import=1" className="wk-button wk-button-plain">Import a resume</Link></section> : <div className="tailor-layout">
      <section className="wk-panel tailor-target" aria-label="Application target"><div className="wk-panel-heading"><div><h2>Your next opportunity</h2><p>Give your draft a clear direction.</p></div><Target size={21} /></div>
        <div className="tailor-fields"><label>Saved resume<select aria-label="Saved resume" className="wk-input" value={resumeId} onChange={event => chooseResume(event.target.value)}><option value="">Choose a saved resume</option>{resumes.map(document => <option value={document.id} key={document.id}>{document.resume.title}{document.tailoring ? ' · Tailored version' : ''}</option>)}</select></label>
          <label>Target job<select aria-label="Target job" className="wk-input" value={jobId} onChange={event => chooseJob(event.target.value)}><option value="">Paste a job description</option>{jobId && !jobs.some(job => job.id === jobId) && <option value={jobId}>Previously saved opportunity</option>}{jobs.map(job => <option value={job.id} key={job.id}>{job.role} · {job.company}</option>)}</select></label>
          <div className="tailor-field-pair"><label>Target role<input className="wk-input" required maxLength={150} value={role} onChange={event => setRole(event.target.value)} placeholder="e.g. Process Engineer" /></label><label>Company<input className="wk-input" maxLength={150} value={company} onChange={event => setCompany(event.target.value)} placeholder="Where you want to make a difference" /></label></div>
          <label>Job description<textarea className="wk-input" rows={8} maxLength={30000} value={description} onChange={event => setDescription(event.target.value)} placeholder="Paste the responsibilities, skills and requirements for this role…" /></label>
          <div className="tailor-term-heading"><label htmlFor="tailoring-terms">Terms to check</label><button disabled={!description.trim()} onClick={() => setTermText(suggestions.join('\n'))}><Lightbulb size={13} />Use suggestions</button></div>
          <textarea id="tailoring-terms" className="wk-input tailor-terms-input" rows={4} maxLength={6000} value={termText} onChange={event => setTermText(event.target.value)} placeholder="One skill or phrase per line, for example:\nProcess safety\nPython\nProject management" />
          <p className="tailor-hint">Choose the wording that matters. Use one term or phrase per line, or separate them with commas. Up to 60 terms, 80 characters each.</p>
          {invalidTerms && <p role="alert" className="wk-alert">Use up to 60 terms, with 80 characters or fewer in each.</p>}
          {suggestions.length > 0 && <details className="tailor-suggestions"><summary>Wording suggestions from this description</summary><p>These are word-frequency suggestions. Choose the ones relevant to your application.</p><div>{suggestions.map(term => <button key={term} aria-pressed={terms.some(item => item.toLowerCase() === term.toLowerCase())} onClick={() => toggleTerm(term)}>{terms.some(item => item.toLowerCase() === term.toLowerCase()) && <Check size={11} />}{term}</button>)}</div></details>}
          <div className="tailor-save"><button className="wk-button wk-button-primary" disabled={!chosen || !role.trim() || !description.trim() || invalidTerms} onClick={persist}>{chosen?.tailoring ? <Save size={16} /> : <Copy size={16} />}{chosen?.tailoring ? 'Save target details' : 'Create tailored copy'}</button><p>{chosen?.tailoring ? 'Updates the target for this version. Your resume text stays editable in the builder.' : 'Copies your current content and design. Your original stays in your document library.'}</p></div>
        </div>
      </section>
      <aside className="tailor-review" aria-label="Resume term coverage"><section className="wk-panel tailor-match"><div className="wk-panel-heading"><div><h2>See what your draft says.</h2><p>Compare selected wording with visible resume sections.</p></div><span className="tailor-match-count">{terms.length ? `${matched.length}/${evidence.length}` : '—'}</span></div>
        <p className="tailor-measure">Selected terms found · a wording check, not an ATS score.</p>
        {chosen && <div className="tailor-current-document"><div><DocumentThumbnail document={chosen} /></div><div><span className="wk-small-label">{chosen.tailoring ? 'YOUR TAILORED VERSION' : 'YOUR STARTING POINT'}</span><h3>{chosen.resume.title}</h3><p>{chosen.tailoring ? `${chosen.tailoring.role}${chosen.tailoring.company ? ` · ${chosen.tailoring.company}` : ''}` : 'Create a separate copy before tailoring.'}</p></div></div>}
        {!terms.length ? <div className="tailor-coverage-empty"><Target size={27} /><h3>Focus on what matters.</h3><p>Add terms or choose suggestions to see which words and phrases appear in your draft.</p></div> : <><div className="tailor-coverage-bar" aria-hidden="true"><span style={{ width: `${evidence.length ? matched.length / evidence.length * 100 : 0}%` }} /></div><section className="tailor-term-group"><h3><CheckCircle2 size={15} />In your resume <b>{matched.length}</b></h3>{matched.length ? matched.map(item => <details key={item.term}><summary>{item.term}<span>{item.label}</span></summary><p>{item.snippet}</p></details>) : <p>No selected terms found in your visible sections yet.</p>}</section><section className="tailor-term-group tailor-missing"><h3><Target size={15} />Not found yet <b>{missing.length}</b></h3><div>{missing.map(item => <span key={item.term}>{item.term}</span>)}</div>{missing.length > 0 && <p>Only include skills and experience you actually have. A missing phrase can also be expressed in different words.</p>}</section></>}
        <p className="tailor-method">Checks whole words and phrases without case or separator punctuation. Synonyms are not inferred. Hidden sections, contact details, document titles and the job description do not count.</p>
      </section>
      {chosen?.tailoring && <section className="wk-panel tailor-next-step"><span className="wk-feature-tag"><FileText size={13} />Make it your own</span><h2>Bring your relevant experience forward.</h2><p>Adapt your summary, emphasize useful examples and put the right skills in context. The comparison refreshes when your edited resume saves.</p><Link onClick={guardEditor} href={editorHref()} className="wk-button wk-button-primary">Open resume editor<ArrowRight size={16} /></Link><div className="tailor-editor-links"><Link onClick={guardEditor} href={editorHref('summary')}>Edit summary</Link><Link onClick={guardEditor} href={editorHref('experience')}>Edit experience</Link><Link onClick={guardEditor} href={editorHref('skills')}>Edit skills</Link></div>{jobId && <div className="tailor-application-link"><button className="wk-button wk-button-secondary" disabled={linked || !selectedJob || targetChanged} onClick={linkToJob}><Link2 size={14} />{linked ? 'Linked to this application' : 'Use for this application'}</button><p>{targetChanged ? 'Save target details before linking this version.' : linked ? 'Open the resume directly from your job tracker.' : selectedJob ? 'Sets this version as the linked resume for the selected job. Your copy stays saved if linking fails.' : 'This job was removed from the tracker. Your saved resume and target details are still available.'}</p><Link className="wk-text-link" href="/job-tracker">Open job tracker<ArrowRight size={14} /></Link></div>}{resumes.some(document => document.id === chosen.tailoring!.sourceResumeId) && <Link className="wk-text-link tailor-original" href={`/builder?id=${encodeURIComponent(chosen.tailoring.sourceResumeId)}`}>View original resume<ArrowRight size={14} /></Link>}</section>}
      </aside>
    </div>}
  </main>;
}
