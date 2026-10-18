'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Copy, Download, Plus, Trash2 } from 'lucide-react';
import { CoverLetterBuilder } from '@/components/coverLetter/CoverLetterBuilder';
import { CoverLetter, defaultCoverLetter } from '@/types/coverLetter';
import { getCoverLetters, getCoverLetter, createCoverLetter, updateCoverLetter, deleteCoverLetter, duplicateCoverLetter, exportCoverLetter, downloadBlob } from '@/lib/coverLetterApi';
import { IS_LOCAL_STORAGE } from '@/lib/apiConfig';

export default function CoverLetterPage() {
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [editing, setEditing] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = async () => {
    setLoading(true);
    try { setLetters(await getCoverLetters()); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load cover letters. Check the connection and retry.'); }
    finally { setLoading(false); }
  };
  const edit = async (id: string) => {
    setBusy(id); setError('');
    try { setEditing(await getCoverLetter(id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to open this letter. Please retry.'); }
    finally { setBusy(null); }
  };
  useEffect(() => { load(); const id = new URLSearchParams(window.location.search).get('id'); if (id) edit(id); }, []);
  const save = async (letter: CoverLetter) => {
    try {
      const result = letter.id ? await updateCoverLetter(letter.id, letter) : await createCoverLetter(letter);
      setEditing(result); setNotice(IS_LOCAL_STORAGE ? 'Cover letter saved only in this browser on this device.' : 'Cover letter saved.');
      getCoverLetters().then(setLetters).catch(() => undefined);
      return result;
    } catch (err) { throw new Error(err instanceof Error ? err.message : 'Unable to save your letter. Your edits are still here.'); }
  };
  const action = async (id: string, task: () => Promise<unknown>, success: string) => {
    setBusy(id); setError(''); setNotice('');
    try { await task(); await load(); setNotice(success); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to complete this action. Please retry.'); }
    finally { setBusy(null); }
  };
  const download = (letter: CoverLetter, format: 'pdf' | 'docx' | 'txt') => action(letter.id, async () => {
    const blob = await exportCoverLetter(letter.id, format, letter.settings.template);
    downloadBlob(blob, `${letter.title || 'cover-letter'}.${format}`);
  }, 'Download ready.');
  const startLetter = () => { setEditing(structuredClone(defaultCoverLetter)); setNotice(''); setError(''); };

  if (editing) return <main className="cover-letter-edit-page pt-16"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3"><button onClick={() => { setEditing(null); load(); }} className="text-sm font-medium text-[#1a91f0] hover:underline">← All cover letters</button><p role="status" className="text-sm text-blue-700">{notice}</p></div><CoverLetterBuilder initialData={editing} onSave={save} /></main>;
  return <main data-letter-ready={!loading} className="cf-page cover-letter-library"><div className="cf-container"><nav className="cf-breadcrumb" aria-label="Breadcrumb" style={{ paddingTop: 32, marginBottom: 0 }}><Link href="/">Home</Link><span>/</span><span>Cover letters</span></nav><section className="cover-letter-page-hero"><div><p className="cf-eyebrow">Go beyond the bullet points</p><h1>A great resume.<br /><span>A personal introduction.</span></h1><p className="cf-page-description">Tell the rest of your story. Create a cover letter that connects your experience to your next opportunity.</p><button disabled={loading} onClick={startLetter} className="cf-button"><Plus size={18} />Create cover letter</button><div className="cf-inline-benefits"><span><Check size={16} />Guided writing steps</span><span><Check size={16} />Live preview</span></div></div><div className="cover-letter-hero-art"><img src="/home/features/cover-letter.png" alt="Illustrative cover letter draft and document details" width="500" height="350" /></div></section>
    <section className="cover-letter-library-content" aria-label="Your cover letters"><p className="cover-letter-storage">{IS_LOCAL_STORAGE ? 'Letters save only in this browser on this device. PDF and DOCX exports send your current letter for processing without saving a server copy. Download a copy before clearing browser data.' : 'Saved letters belong to your current browser workspace. Export a copy before changing browsers or clearing browser data.'}</p>
    {error && <div role="alert" className="cf-error flex flex-wrap items-center justify-between gap-3"><span>{error}</span><button onClick={load} disabled={loading} className="font-medium underline">Retry</button></div>}
    {notice && <p role="status" className="mb-4 text-sm text-blue-700">{notice}</p>}
    {loading ? <p role="status" className="py-16 text-center text-slate-500">Loading your cover letters…</p> : !error && letters.length === 0 ? <div className="cover-letter-empty"><div aria-hidden="true"><div className="cover-letter-mini-paper"><strong>Your name</strong><small>Your next chapter starts here.</small>{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div></div><div><p className="cf-eyebrow">Make the first connection</p><h2>Give your application a voice.</h2><p>A little context can make a big difference. Choose a style, add the job details and write an introduction that sounds like you.</p><button onClick={startLetter} className="cf-button">Write my first letter <ArrowRight size={17} /></button></div></div> : <><div className="mb-6 flex items-center justify-between"><h2 className="text-3xl font-medium">Your cover letters</h2><span className="text-sm text-slate-500">{letters.length} saved in your workspace</span></div><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{letters.map(letter => <article key={letter.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white"><button onClick={() => edit(letter.id)} disabled={!!busy} className="w-full bg-[#eff2f9] px-6 pt-6 text-left disabled:opacity-50" aria-label={`Edit ${letter.title}`}><div className="mx-auto h-44 overflow-hidden rounded-t bg-white px-6 pt-6 shadow-sm"><p className="truncate font-serif font-semibold">{letter.sender.full_name || 'Your introduction'}</p><div className="mt-2 h-px bg-[#1a91f0]" /><p className="mt-4 truncate text-[10px] text-slate-500">{letter.content.salutation}</p><p className="mt-2 line-clamp-3 text-[9px] leading-relaxed text-slate-500">{letter.content.opening_paragraph || 'Add your opening paragraph in the editor.'}</p></div></button><div className="p-5"><h3 className="truncate text-xl font-medium">{letter.title || 'Untitled cover letter'}</h3><p className="mt-1 text-sm text-slate-500">{[letter.job_details.job_title, letter.job_details.company_name].filter(Boolean).join(' · ') || 'No job details yet'}</p><p className="mt-2 text-xs capitalize text-slate-400">{letter.settings.template} template</p><div className="mt-5 flex items-center gap-2"><button onClick={() => edit(letter.id)} disabled={!!busy} className="cf-button flex-1">{busy === letter.id ? 'Working…' : 'Edit letter'}</button><button onClick={() => action(letter.id, () => duplicateCoverLetter(letter.id), 'Cover letter duplicated.')} disabled={!!busy} aria-label={`Duplicate ${letter.title}`} className="rounded border p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50"><Copy size={17} /></button><button onClick={() => { if (confirm(`Delete "${letter.title}"?`)) action(letter.id, () => deleteCoverLetter(letter.id), 'Cover letter deleted.'); }} disabled={!!busy} aria-label={`Delete ${letter.title}`} className="rounded border p-2 text-slate-500 hover:text-red-700 disabled:opacity-50"><Trash2 size={17} /></button></div><div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3"><Download size={14} className="text-slate-400" />{(['pdf', 'docx', 'txt'] as const).map(format => <button key={format} disabled={!!busy} onClick={() => download(letter, format)} className="text-xs font-medium uppercase text-slate-500 hover:text-blue-600 disabled:opacity-50">{format}</button>)}</div></div></article>)}</div></>}
    </section></div></main>;
}
