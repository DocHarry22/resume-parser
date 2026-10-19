'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock3, Copy, Download, FileText, History, Plus, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { checkpointResume, copyResumeVersion, deleteResumeVersion, MAX_RESUME_VERSIONS, restoreResumeVersion, resumeStateKey } from '@/components/resumeio/resumeDocument';
import { compareResumeVersions } from '@/lib/resumeHistory';
import { downloadText } from '@/lib/careerWorkspace';
import { useWorkspaceData } from '@/components/workspace/workspaceData';
import DocumentThumbnail from '@/components/workspace/DocumentThumbnail';

export default function HistoryPage() {
  return <Suspense fallback={<main className="wk-page"><p role="status">Opening version history…</p></main>}><ResumeHistory /></Suspense>;
}
function ResumeHistory() {
  const query = useSearchParams().toString();
  const { resumes, ready, error: libraryError } = useWorkspaceData();
  const [resumeId, setResumeId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [label, setLabel] = useState('');
  const [section, setSection] = useState('All changes');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copyId, setCopyId] = useState('');
  const handled = useRef<string | null>(null);
  const document = resumes.find(item => item.id === resumeId);
  const versions = document?.versions || [];
  const selected = versions.find(item => item.id === versionId) || versions[0];
  const currentKey = useMemo(() => document ? resumeStateKey(document) : '', [document]);
  const checkpointKey = useMemo(() => selected ? resumeStateKey(selected.snapshot) : '', [selected]);
  const changes = useMemo(() => selected && document ? compareResumeVersions(selected.snapshot, document) : [], [selected, document]);
  const sections = [...new Set(changes.map(change => change.section))];
  const visible = section === 'All changes' ? changes : changes.filter(change => change.section === section);
  const same = currentKey === checkpointKey;
  useEffect(() => {
    if (!ready || handled.current === query) return;
    handled.current = query;
    const requested = new URLSearchParams(query).get('resume');
    const chosen = requested ? resumes.find(item => item.id === requested) : resumes[0];
    setResumeId(chosen?.id || ''); setVersionId(chosen?.versions?.[0]?.id || '');
    if (requested && !chosen) setError('That resume is no longer saved in this browser. Choose another document below.');
  }, [ready, query, resumes]);
  const choose = (id: string) => { setResumeId(id); setVersionId(resumes.find(item => item.id === id)?.versions?.[0]?.id || ''); setSection('All changes'); setError(''); setNotice(''); setCopyId(''); };
  const failure = (value: unknown) => setError(value instanceof Error ? value.message : 'This change could not be saved. Your existing browser data has been kept.');
  const checkpoint = (event: React.FormEvent) => {
    event.preventDefault(); if (!document || !label.trim()) return;
    try { const saved = checkpointResume(document.id, label); setVersionId(saved.versions![0].id); setLabel(''); setSection('All changes'); setError(''); setNotice('Checkpoint saved. Keep editing with a place to return to.'); }
    catch (value) { failure(value); }
  };
  const restore = () => {
    if (!document || !selected || same) return;
    const expected = currentKey;
    if (!window.confirm(`Restore “${selected.label}”? Your current draft will be kept as a safety checkpoint first. The document's existing application links will stay in place.`)) return;
    try { restoreResumeVersion(document.id, selected.id, expected); setError(''); setSection('All changes'); setNotice('Checkpoint restored. Your previous draft is kept in the newest safety checkpoint.'); }
    catch (value) { failure(value); }
  };
  const copy = () => {
    if (!document || !selected) return;
    try { const saved = copyResumeVersion(document.id, selected.id); setCopyId(saved.id); setError(''); setNotice('A separate copy is saved. The current draft and its checkpoints are unchanged.'); }
    catch (value) { failure(value); }
  };
  const remove = (id: string, title: string) => {
    if (!document || !window.confirm(`Delete checkpoint “${title}”? Your current draft will stay unchanged. Download a JSON backup first if you need this checkpoint later.`)) return;
    try { const saved = deleteResumeVersion(document.id, id); if (id === selected?.id) setVersionId(saved.versions?.[0]?.id || ''); setSection('All changes'); setError(''); setNotice('Checkpoint removed. Your current draft has been kept.'); }
    catch (value) { failure(value); }
  };
  const date = (value: string) => new Date(value).toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return <main className="wk-page history-page" data-workspace-ready={ready}>
    <div className="wk-heading"><div><span className="wk-eyebrow">A little room to try something new.</span><h1>Your story, saved along the way.</h1><p>Keep a checkpoint. Explore an edit. Come back with confidence.</p></div>{document && <div className="wk-heading-actions"><button className="wk-button wk-button-plain" onClick={() => downloadText(JSON.stringify(document, null, 2), `${document.resume.title.replace(/[^a-z0-9 -]/gi, '_')}-with-history.json`)}><Download size={15} />Back up with history</button><Link className="wk-button wk-button-primary" href={`/builder?id=${encodeURIComponent(document.id)}`}>Open resume editor<ArrowRight size={15} /></Link></div>}</div>
    {(error || libraryError) && <p role="alert" className="wk-alert">{error || libraryError}</p>}
    {notice && <p role="status" className="history-notice"><CheckCircle2 size={16} />{notice}{copyId && <Link href={`/builder?id=${encodeURIComponent(copyId)}`}>Open new copy<ArrowRight size={14} /></Link>}</p>}
    {!ready ? <p role="status" className="wk-empty">Loading your saved work…</p> : !resumes.length ? <section className="wk-panel wk-empty"><span className="wk-empty-icon"><History size={28} /></span><h2>A place for your next draft.</h2><p>Create or import a resume, then save the versions you want to keep.</p><Link href="/builder?new=1" className="wk-button wk-button-primary"><Plus size={16} />Create a resume</Link></section> : <>
      <div className="history-selection"><label>Saved resume<select aria-label="Saved resume" className="wk-input" value={resumeId} onChange={event => choose(event.target.value)}><option value="">Choose a saved resume</option>{resumes.map(item => <option key={item.id} value={item.id}>{item.resume.title}</option>)}</select></label><p><ShieldCheck size={16} />Checkpoints stay in this browser with your resume. Download a backup to keep a separate copy.</p></div>
      {document && <div className="history-layout"><aside className="wk-panel history-timeline"><div className="wk-panel-heading"><h2>Your checkpoints</h2><span>{versions.length}/{MAX_RESUME_VERSIONS}</span></div><form onSubmit={checkpoint} className="history-checkpoint-form"><label>Checkpoint name<input className="wk-input" maxLength={100} value={label} onChange={event => setLabel(event.target.value)} placeholder="e.g. Before tailoring for Atlas" /></label><button type="submit" className="wk-button wk-button-primary" disabled={!label.trim() || versions.length >= MAX_RESUME_VERSIONS}><Plus size={15} />Save checkpoint</button><p>Captures the current saved draft, its design and application target. Up to 20 checkpoints per resume.</p></form>
        {versions.length ? <ol>{versions.map(version => <li key={version.id} className={selected?.id === version.id ? 'is-selected' : ''}><button className="history-version" aria-pressed={selected?.id === version.id} onClick={() => { setVersionId(version.id); setSection('All changes'); }}><span className={`history-version-icon ${version.kind === 'before-restore' ? 'is-safety' : ''}`}>{version.kind === 'before-restore' ? <ShieldCheck size={16} /> : <Clock3 size={16} />}</span><span><strong>{version.label}</strong><small>{date(version.createdAt)}</small><em>{version.kind === 'before-restore' ? 'Safety checkpoint' : 'Saved checkpoint'}</em></span></button><button className="history-delete" aria-label={`Delete checkpoint ${version.label}`} title="Delete checkpoint" onClick={() => remove(version.id, version.label)}><Trash2 size={14} /></button></li>)}</ol> : <div className="history-empty-timeline"><Clock3 size={28} /><h3>A moment worth keeping.</h3><p>Save a checkpoint before trying a new layout or tailoring your next application.</p></div>}
      </aside><section className="history-comparison" aria-label="Version comparison">{selected ? <>
        <section className="wk-panel history-compare-top"><div><span className="wk-small-label">COMPARE WITH YOUR CURRENT SAVED DRAFT</span><h2>{selected.label}</h2><p>{date(selected.createdAt)}</p></div><div className="history-restore-actions"><button className="wk-button wk-button-primary" disabled={same || versions.length >= MAX_RESUME_VERSIONS} onClick={restore}><RotateCcw size={15} />{same ? 'Already current' : 'Restore checkpoint'}</button><button className="wk-button wk-button-plain" onClick={copy}><Copy size={15} />Open as new copy</button></div><p className="history-safety-caption"><ShieldCheck size={14} />Restoring keeps your current draft in a safety checkpoint first.{versions.length >= MAX_RESUME_VERSIONS && ' To restore, back up and remove a checkpoint to make room, or open a new copy.'}</p></section>
        <section className="history-previews" aria-label="Resume previews"><div className="wk-panel"><div><span className="wk-small-label">SAVED CHECKPOINT</span><h3>{selected.snapshot.resume.title}</h3></div><div className="history-preview-canvas"><DocumentThumbnail document={selected.snapshot} /></div></div><div className="wk-panel"><div><span className="wk-small-label">CURRENT SAVED DRAFT</span><h3>{document.resume.title}</h3></div><div className="history-preview-canvas"><DocumentThumbnail document={document} /></div></div></section>
        <section className="wk-panel history-changes"><div className="wk-panel-heading"><h2>{changes.length ? `${changes.length} changed field${changes.length === 1 ? '' : 's'}` : 'No changes since this checkpoint.'}</h2>{sections.length > 1 && <label><span className="sr-only">Filter changes by section</span><select aria-label="Filter changes by section" value={section} onChange={event => setSection(event.target.value)}><option>All changes</option>{sections.map(value => <option key={value}>{value}</option>)}</select></label>}</div>{changes.length ? <><div className="history-change-counts">{[['added', 'Added'], ['removed', 'Removed'], ['changed', 'Edited']].map(([kind, title]) => <span key={kind} className={`history-count-${kind}`}>{title}<b>{changes.filter(change => change.kind === kind).length}</b></span>)}</div><div className="history-diff-head"><span>Saved checkpoint</span><span>Current saved draft</span></div>{visible.map(change => <article className="history-change" key={change.key}><header><h3>{change.label}</h3><span className={`history-kind-${change.kind}`}>{change.kind === 'changed' ? 'Edited' : change.kind === 'added' ? 'Added' : 'Removed'}</span></header><div className="history-diff-columns">{[change.before, change.after].map((value, index) => <div key={index} data-side={index === 0 ? 'before' : 'after'}><small>{index === 0 ? 'Saved checkpoint' : 'Current saved draft'}</small>{change.photo ? value ? <img src={value} width={70} height={70} alt={index === 0 ? 'Photo in checkpoint' : 'Photo in current draft'} /> : <em>No photo</em> : value ? <p>{value}</p> : <em>Not included</em>}</div>)}</div></article>)}</> : <div className="history-no-changes"><CheckCircle2 size={28} /><p>Your content, layout and target details match. A new edit will appear here after it saves.</p></div>}</section>
      </> : <section className="wk-panel wk-empty history-get-started"><span className="wk-empty-icon"><FileText size={30} /></span><h2>Keep a little room to experiment.</h2><p>Give your current draft a name and save your first checkpoint. You’ll be able to compare content, design and application target details here.</p><div><span><History size={16} />A timeline you can return to</span><span><ShieldCheck size={16} />A safety copy before each restore</span></div></section>}</section></div>}
    </>}
  </main>;
}
