'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Download, FileText, Plus, Trash2 } from 'lucide-react';
import { CoverLetterBuilder } from '@/components/coverLetter/CoverLetterBuilder';
import { CoverLetter, defaultCoverLetter } from '@/types/coverLetter';
import { getCoverLetters, getCoverLetter, createCoverLetter, updateCoverLetter, deleteCoverLetter, duplicateCoverLetter, exportCoverLetter, downloadBlob } from '@/lib/coverLetterApi';

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
      setEditing(result); setNotice('Cover letter saved.');
      // The builder stays open so preview and export remain one click away.
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
  if (editing) return <main className="bg-gray-50 pt-16"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3"><button onClick={() => { setEditing(null); load(); }} className="text-sm font-semibold text-teal-800 hover:underline">← All cover letters</button><p role="status" className="text-sm text-teal-800">{notice}</p></div><CoverLetterBuilder initialData={editing} onSave={save} /></main>;
  return <main data-letter-ready={!loading} className="min-h-screen bg-[#f5f7f8] px-4 pb-10 pt-28 text-slate-900 sm:px-8"><div className="mx-auto max-w-7xl">
    <Link href="/dashboard" className="text-sm font-medium text-teal-800 hover:underline">Career workspace / Cover letters</Link>
    <div className="mb-8 mt-7 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-teal-700">Make a personal introduction</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">A letter for every opportunity.</h1><p className="mt-3 max-w-xl text-slate-500">Turn your experience into a thoughtful introduction, with guided writing ideas and a live preview.</p></div><button disabled={loading} onClick={() => { setEditing(structuredClone(defaultCoverLetter)); setNotice(''); setError(''); }} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800"><Plus size={18} /> Create cover letter</button></div>
    <p className="mb-7 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">Saved letters belong to your current browser workspace. Export a copy before changing browsers or clearing browser data.</p>
    {error && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{error}</span><button onClick={load} disabled={loading} className="font-semibold underline">Retry</button></div>}
    {notice && <p role="status" className="mb-4 text-sm text-teal-800">{notice}</p>}
    {loading ? <p role="status" className="py-16 text-center text-slate-500">Loading your cover letters…</p> : !error && letters.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><FileText className="mx-auto mb-5 text-teal-700" size={34} /><h2 className="text-xl font-semibold">Give your application a voice</h2><p className="mx-auto mt-3 max-w-md text-slate-500">Choose a style, add the job details, and write a letter that sounds like you. Download a PDF, Word document, or plain text copy.</p><button disabled={loading} onClick={() => setEditing(structuredClone(defaultCoverLetter))} className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Write my first letter</button></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{letters.map(letter => <article key={letter.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><button onClick={() => edit(letter.id)} disabled={!!busy} className="w-full bg-[#e6eeeb] px-6 pt-6 text-left disabled:opacity-50" aria-label={`Edit ${letter.title}`}><div className="mx-auto h-36 overflow-hidden rounded-t-lg bg-white px-6 pt-6 shadow-sm"><p className="truncate font-serif font-semibold">{letter.sender.full_name || 'Your introduction'}</p><div className="mt-2 h-px bg-teal-700" /><p className="mt-4 truncate text-[10px] text-slate-500">{letter.content.salutation}</p><p className="mt-2 line-clamp-3 text-[9px] leading-relaxed text-slate-500">{letter.content.opening_paragraph || 'Add your opening paragraph in the editor.'}</p></div></button><div className="p-5"><h2 className="truncate font-semibold">{letter.title || 'Untitled cover letter'}</h2><p className="mt-1 text-sm text-slate-500">{[letter.job_details.job_title, letter.job_details.company_name].filter(Boolean).join(' · ') || 'No job details yet'}</p><p className="mt-2 text-xs capitalize text-slate-400">{letter.settings.template} template</p><div className="mt-5 flex items-center gap-2"><button onClick={() => edit(letter.id)} disabled={!!busy} className="flex-1 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{busy === letter.id ? 'Working…' : 'Edit letter'}</button><button onClick={() => action(letter.id, () => duplicateCoverLetter(letter.id), 'Cover letter duplicated.')} disabled={!!busy} aria-label={`Duplicate ${letter.title}`} className="rounded-lg border p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50"><Copy size={17} /></button><button onClick={() => { if (confirm(`Delete "${letter.title}"?`)) action(letter.id, () => deleteCoverLetter(letter.id), 'Cover letter deleted.'); }} disabled={!!busy} aria-label={`Delete ${letter.title}`} className="rounded-lg border p-2 text-slate-500 hover:text-red-700 disabled:opacity-50"><Trash2 size={17} /></button></div><div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3"><Download size={14} className="text-slate-400" />{(['pdf', 'docx', 'txt'] as const).map(format => <button key={format} disabled={!!busy} onClick={() => download(letter, format)} className="text-xs font-semibold uppercase text-slate-500 hover:text-teal-800 disabled:opacity-50">{format}</button>)}</div></div></article>)}</div>}
  </div></main>;
}
