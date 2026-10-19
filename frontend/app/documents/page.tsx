'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Copy, Download, FolderOpen, Grid2X2, List, Mail, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { readDocuments, saveDocument, SavedResume, STORAGE_KEY } from '@/components/resumeio/resumeDocument';
import { downloadText } from '@/lib/careerWorkspace';
import DocumentThumbnail from '@/components/workspace/DocumentThumbnail';
import { documentHref, formatUpdated, useWorkspaceData } from '@/components/workspace/workspaceData';

export default function DocumentsPage() {
  const { resumes, letters, ready, error, letterError } = useWorkspaceData();
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [renaming, setRenaming] = useState<SavedResume | null>(null);
  const [title, setTitle] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => { if (renaming) dialog.current?.showModal(); else { dialog.current?.close(); trigger.current?.focus(); } }, [renaming]);
  const perform = (task: () => void, message: string) => {
    try { task(); setNotice(message); setActionError(''); }
    catch { setActionError('This change could not be saved. Your existing browser library has been kept. Download a backup before leaving.'); }
  };
  const duplicate = (doc: SavedResume) => perform(() => {
    const current = readDocuments().find(item => item.id === doc.id);
    if (!current) throw new Error('Document no longer exists');
    saveDocument({ ...structuredClone(current), id: crypto.randomUUID(), versions: [], resume: { ...structuredClone(current.resume), title: `${current.resume.title} (copy)` } });
  }, 'An independent copy is ready in your library.');
  const remove = (doc: SavedResume) => {
    if (!window.confirm(`Delete “${doc.resume.title}” from this browser? Keep a downloaded backup if you need it later.`)) return;
    perform(() => { const current = readDocuments(); localStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter(item => item.id !== doc.id))); window.dispatchEvent(new Event('resume-library-change')); }, 'Resume deleted from this browser.');
  };
  const rename = (event: React.FormEvent) => {
    event.preventDefault();
    if (!renaming || !title.trim()) return;
    perform(() => { const current = readDocuments().find(doc => doc.id === renaming.id); if (!current) throw new Error('Missing document'); saveDocument({ ...current, resume: { ...current.resume, title: title.trim() } }); setRenaming(null); }, 'Resume renamed.');
  };
  const matchingResumes = resumes.filter(doc => filter !== 'Cover letters' && `${doc.resume.title} ${doc.resume.contact?.full_name || ''}`.toLowerCase().includes(search.toLowerCase()));
  const matchingLetters = letters.filter(letter => filter !== 'Resumes' && `${letter.title} ${letter.job_details.company_name} ${letter.job_details.job_title}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="wk-page" data-workspace-ready={ready}>
    <div className="wk-heading"><div><span className="wk-eyebrow">Make every word count</span><h1>Your documents</h1><p>A home for your experience. A head start on your next application.</p></div><div className="wk-heading-actions"><Link className="wk-button wk-button-plain" href="/builder?import=1"><Upload size={15} />Import resume</Link><Link className="wk-button wk-button-primary" href="/builder?new=1"><Plus size={16} />Create resume</Link></div></div>
    {(error || actionError) && <p role="alert" className="wk-alert">{actionError || error}</p>}
    {notice && <p role="status" className="wk-text-link">{notice}</p>}
    <div className="wk-toolbar"><div className="wk-tabs" aria-label="Document type">{[['All', resumes.length + letters.length], ['Resumes', resumes.length], ['Cover letters', letters.length]].map(([label, count]) => <button key={label} aria-pressed={filter === label} onClick={() => setFilter(String(label))}>{label}<span>{count}</span></button>)}</div><div className="wk-search"><Search size={15} /><input aria-label="Search documents" placeholder="Search your documents" value={search} onChange={event => setSearch(event.target.value)} /></div><div className="wk-view-toggle"><button aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><Grid2X2 size={17} /></button><button aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={17} /></button></div></div>
    {letterError && filter !== 'Resumes' && <p role="status" className="wk-alert">{letterError}</p>}
    {!ready ? <p role="status" className="wk-empty">Loading your documents…</p> : matchingResumes.length || matchingLetters.length ? <div className={view === 'grid' ? 'wk-document-grid' : 'wk-document-list'}>{matchingResumes.map(doc => <article className="wk-document-card" key={doc.id}>
      <Link href={documentHref(doc)} aria-label={`Open ${doc.resume.title}`}><DocumentThumbnail document={doc} /></Link><div className="wk-document-info"><span className="wk-small-label">Resume · {doc.template}</span><h2>{doc.resume.title}</h2><p>Edited {formatUpdated(doc.updatedAt)}</p></div><div className="wk-document-actions"><Link className="wk-text-link" href={documentHref(doc)}>Edit resume<ArrowRight size={14} /></Link><button title="Rename" aria-label={`Rename ${doc.resume.title}`} onClick={event => { trigger.current = event.currentTarget; setTitle(doc.resume.title); setRenaming(doc); }}><Pencil size={14} /></button><button title="Duplicate" aria-label={`Duplicate ${doc.resume.title}`} onClick={() => duplicate(doc)}><Copy size={14} /></button><button title="Download JSON backup" aria-label={`Back up ${doc.resume.title}`} onClick={() => perform(() => downloadText(JSON.stringify(doc, null, 2), `${doc.resume.title.replace(/[^a-z0-9 -]/gi, '_')}.json`), 'JSON backup downloaded.')}><Download size={14} /></button><button title="Delete" aria-label={`Delete ${doc.resume.title}`} onClick={() => remove(doc)}><Trash2 size={14} /></button></div>
    </article>)}{matchingLetters.map(letter => <article className="wk-document-card" key={letter.id}><Link href={`/cover-letter?id=${encodeURIComponent(letter.id)}`} aria-label={`Open ${letter.title}`}><div className="wk-letter-art" aria-hidden="true"><b>{letter.sender.full_name || 'Your introduction'}</b>{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div></Link><div className="wk-document-info"><span className="wk-small-label">Cover letter</span><h2>{letter.title}</h2><p>{letter.job_details.company_name || 'Your personal introduction'}</p></div><div className="wk-document-actions"><Link className="wk-text-link" href={`/cover-letter?id=${encodeURIComponent(letter.id)}`}>Edit cover letter<ArrowRight size={14} /></Link></div></article>)}</div> : <section className="wk-panel wk-empty"><span className="wk-empty-icon"><FolderOpen size={29} /></span><h3>{search ? 'No matching documents.' : 'A blank page. A world of possibility.'}</h3><p>{search ? 'Try a different title, name or company.' : 'Create your first document and make your experience shine.'}</p><Link className="wk-button wk-button-primary" href={filter === 'Cover letters' ? '/letters' : '/builder?new=1'}><Plus size={16} />{filter === 'Cover letters' ? 'Create a cover letter' : 'Create my resume'}</Link></section>}
    <Link className="wk-review-strip" href="/letters"><span className="wk-tool-icon"><Mail size={23} /></span><div><h2>Tell the rest of your story.</h2><p>A thoughtful cover letter connects your experience to the opportunity.</p></div><span className="wk-text-link">Write a cover letter<ArrowRight size={16} /></span></Link>
    <dialog className="wk-dialog" ref={dialog} aria-labelledby="rename-title" onCancel={() => setRenaming(null)} onClose={() => setRenaming(null)}><form onSubmit={rename}><h2 id="rename-title">Rename your resume</h2><label>Document title<input className="wk-input" autoFocus required maxLength={150} value={title} onChange={event => setTitle(event.target.value)} /></label>{actionError && <p className="wk-alert" role="alert">{actionError}</p>}<div className="wk-dialog-actions"><button type="button" className="wk-button wk-button-plain" onClick={() => setRenaming(null)}>Cancel</button><button className="wk-button wk-button-primary" type="submit">Save title</button></div></form></dialog>
  </main>;
}
