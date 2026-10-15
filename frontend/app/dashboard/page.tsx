'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, FileText, Mail, Plus, ScanLine } from 'lucide-react';
import { localDate, readJobs, TrackedJob } from '@/lib/careerWorkspace';
import { SavedResume, STORAGE_KEY } from '@/components/resumeio/resumeDocument';
import { getCoverLetters } from '@/lib/coverLetterApi';
import type { CoverLetter } from '@/types/coverLetter';

export default function DashboardPage() {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [localError, setLocalError] = useState('');
  const [letterError, setLetterError] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const loadLocal = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(saved)) throw new Error('Invalid saved resume data');
        setResumes(saved.filter((doc): doc is SavedResume => !!doc && typeof doc.id === 'string' && !!doc.resume && typeof doc.resume.title === 'string'));
        setJobs(readJobs()); setLocalError('');
      } catch { setLocalError('Some browser data could not be read. Existing saved data has been kept.'); }
      finally { setReady(true); }
    };
    loadLocal(); window.addEventListener('storage', loadLocal); window.addEventListener('career-jobs-change', loadLocal);
    getCoverLetters().then(setLetters).catch(() => setLetterError('Cover letters are temporarily unavailable. Open the cover letter builder to retry.'));
    return () => { window.removeEventListener('storage', loadLocal); window.removeEventListener('career-jobs-change', loadLocal); };
  }, []);
  const due = jobs.filter(job => job.followUpOn && job.followUpOn <= localDate() && !['Offer', 'Closed'].includes(job.stage));
  return <main data-workspace-ready={ready} className="min-h-screen bg-[#f5f7f8] px-4 pb-10 pt-28 text-slate-900 sm:px-8"><div className="mx-auto max-w-7xl">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-teal-700">Your career workspace</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Make your next move.</h1><p className="mt-3 text-slate-500">Your documents and opportunities, with a clear next step.</p></div><Link href="/builder?new=1" className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800"><Plus size={18} /> Create resume</Link></div>
    {localError && <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{localError}</p>}
    <div className="mb-8 grid gap-4 sm:grid-cols-3">{[[FileText, 'Resumes', ready ? resumes.length : '…', '/builder'], [Mail, 'Cover letters', letterError ? 'Unavailable' : letters.length, '/cover-letter'], [BriefcaseBusiness, 'Opportunities', ready ? jobs.length : '…', '/job-tracker']].map(([Icon, label, count, href]) => { const Symbol = Icon as typeof FileText; return <Link key={label as string} href={href as string} className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-teal-400"><Symbol size={21} className="mb-5 text-teal-700" /><p className="text-sm text-slate-500">{label as string}</p><div className="mt-2 flex items-center justify-between"><p className="text-3xl font-semibold">{count as string | number}</p><ArrowRight size={18} className="text-slate-400" /></div></Link>; })}</div>
    <div className="grid gap-7 lg:grid-cols-[1.7fr_1fr]"><section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">Your resumes</h2><Link href="/builder?new=1" className="text-sm font-semibold text-teal-800 hover:underline">New resume</Link></div>{!ready ? <p role="status" className="py-8 text-slate-500">Loading saved resumes…</p> : resumes.length ? <ul className="divide-y divide-slate-100">{[...resumes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(doc => <li key={doc.id}><Link href={`/builder?id=${encodeURIComponent(doc.id)}`} className="flex items-center gap-4 rounded-xl py-4 hover:bg-slate-50"><div className="rounded-xl bg-teal-50 p-3 text-teal-700"><FileText size={23} /></div><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{doc.resume.title || 'Untitled resume'}</h3><p className="mt-1 text-sm text-slate-500">{doc.resume.contact?.full_name || 'Add your details'} · {doc.template} template</p></div><ArrowRight size={18} className="text-slate-400" /></Link></li>)}</ul> : <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center"><FileText size={30} className="mx-auto mb-3 text-teal-700" /><h3 className="font-semibold">Start with your story</h3><p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Build a resume from scratch or import an existing document. Your saved resumes will appear here.</p><Link href="/builder?new=1" className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Build my resume</Link></div>}<p className="mt-5 text-xs text-slate-500">Resumes are saved on this browser and device. Download a JSON backup from the editor to keep a copy.</p></section>
    <aside className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Next on your list</h2>{due.length ? <ul className="mt-4 space-y-4">{due.slice(0, 4).map(job => <li key={job.id}><Link href="/job-tracker" className="block rounded-xl bg-amber-50 p-3 hover:bg-amber-100"><p className="text-sm font-semibold">Follow up with {job.company}</p><p className="mt-1 text-xs text-amber-900">{job.role} · Due {job.followUpOn}</p></Link></li>)}</ul> : <p className="mt-3 text-sm leading-relaxed text-slate-500">No follow-ups due. Save opportunities and add a follow-up date in your tracker to keep the momentum going.</p>}<Link href="/job-tracker" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-800">Open job tracker <ArrowRight size={16} /></Link></section><Link href="/resume-scanner" className="block rounded-2xl bg-[#e6eeeb] p-6 hover:bg-teal-100"><ScanLine size={26} className="mb-4 text-teal-800" /><h2 className="text-lg font-semibold">A fresh pair of eyes</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">Check your resume for structure, readability, and relevant keywords before you send it.</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-900">Review my resume <ArrowRight size={16} /></span></Link></aside></div>
    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Cover letters</h2><Link href="/cover-letter" className="text-sm font-semibold text-teal-800 hover:underline">Manage letters</Link></div>{letterError ? <p role="status" className="mt-4 text-sm text-amber-800">{letterError}</p> : letters.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{letters.slice(0, 6).map(letter => <Link href={`/cover-letter?id=${encodeURIComponent(letter.id)}`} key={letter.id} className="rounded-xl border border-slate-200 p-4 hover:border-teal-400"><Mail size={20} className="mb-3 text-teal-700" /><h3 className="font-semibold">{letter.title}</h3><p className="mt-1 text-sm text-slate-500">{[letter.job_details.job_title, letter.job_details.company_name].filter(Boolean).join(' · ') || 'Add job details'}</p></Link>)}</div> : <p className="mt-4 text-sm text-slate-500">Write a tailored introduction for your next application. <Link href="/cover-letter" className="font-medium text-teal-800 underline">Create a cover letter</Link></p>}<p className="mt-5 text-xs text-slate-500">Cover letters use your current browser workspace on the server.</p></section>
  </div></main>;
}
