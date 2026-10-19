'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, FileSearch, ScanLine, ShieldCheck, Target } from 'lucide-react';
import { createDocument, normalizeResume, saveDocument } from '@/components/resumeio/resumeDocument';
import ResumeUploadForm from '../components/ResumeUploadForm';
import ResumeResultCard from '../components/ResumeResultCard';
import ScoreBreakdown from '../components/ScoreBreakdown';
import type { ParseAndScoreResponse, ScanMode } from '@/lib/types';

export default function ResumeScannerPage() {
  const router = useRouter();
  const [result, setResult] = useState<ParseAndScoreResponse | null>(null);
  const [importError, setImportError] = useState('');
  const [mode, setMode] = useState<ScanMode>('basic');
  const [jobDescription, setJobDescription] = useState('');
  const [industry, setIndustry] = useState('default');
  const results = useRef<HTMLDivElement>(null);
  const editParsedResume = () => {
    if (!result) return;
    try {
      const document = createDocument();
      document.resume = normalizeResume(result.resume);
      document.resume.title = result.resume.name ? `${result.resume.name} resume` : 'Imported resume';
      const saved = saveDocument(document);
      router.push(`/builder?id=${saved.id}`);
    } catch { setImportError('Your browser could not save the parsed resume. Free some browser storage or use the builder import to try again.'); }
  };
  return <main className="cf-page checker-page"><section className="checker-hero cf-container"><div className="checker-intro"><nav className="cf-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Resume checker</span></nav><span className="cf-icon-tile"><ScanLine size={30} strokeWidth={1.5} /></span><h1>A better resume.<br /><span>One check away.</span></h1><p className="cf-page-description">See your resume through a fresh pair of eyes. Get clear feedback on its structure, content and fit for your next opportunity.</p><ul className="checker-benefits">{['Understand what your resume does well', 'Find practical ways to improve your writing', 'Compare your experience with a job description'].map(text => <li key={text}><Check size={18} />{text}</li>)}</ul><div className="checker-privacy"><ShieldCheck size={20} /><p>Your document is sent to the document service only when you choose to scan. <Link href="/privacy">How processing works</Link></p></div></div>
    <section className="checker-upload cf-panel" id="scanner-upload" aria-labelledby="checker-upload-title"><span className="cf-eyebrow">Let’s take a closer look</span><h2 id="checker-upload-title">Upload your resume</h2><p>Choose a PDF or Word document to get started.</p><div className="checker-mode-tabs" aria-label="Analysis level">{([['basic', 'Basic'], ['ats', 'ATS'], ['expert', 'Expert']] as const).map(([value, title]) => <button key={value} onClick={() => setMode(value)} aria-pressed={mode === value}>{title}</button>)}</div><ResumeUploadForm mode={mode} jobDescription={jobDescription} industry={industry} onResult={data => { setResult(data); setImportError(''); requestAnimationFrame(() => results.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })); }} /><details className="checker-options"><summary>Tailor your feedback <span>Optional</span></summary><label>Industry<select value={industry} onChange={event => setIndustry(event.target.value)}><option value="default">All industries</option><option value="engineering">Engineering</option><option value="it-software">IT and software</option><option value="finance">Finance</option><option value="healthcare">Healthcare</option></select></label><label>Job description<textarea rows={5} value={jobDescription} onChange={event => setJobDescription(event.target.value)} placeholder="Paste the job description to compare it with your experience…" /></label></details><p className="checker-score-note">A score is a writing aid, not a prediction of an employer’s decision.</p></section>
  </section>
  {result ? <section className="checker-results cf-container" ref={results} aria-label="Resume analysis results"><div className="checker-result-heading"><div><p className="cf-eyebrow">Your next draft starts here</p><h2>Let’s make your resume stronger.</h2></div><button className="cf-button" onClick={editParsedResume}>Edit this resume <ArrowRight size={18} /></button></div>{importError && <p role="alert" className="cf-error">{importError}</p>}<div className="grid gap-6 md:grid-cols-2"><ResumeResultCard resume={result.resume} /><ScoreBreakdown score={result.score} /></div><button className="home-text-link checker-reset" onClick={() => { setResult(null); setImportError(''); document.getElementById('scanner-upload')?.scrollIntoView({ behavior: 'smooth' }); }}>Scan Another Resume <ArrowRight size={17} /></button></section> : <section className="cf-container checker-explainer"><div className="home-section-heading"><h2>A little clarity.<br />A stronger application.</h2><p>Understand your document, then make your next edit count.</p></div><div className="checker-explainer-grid">{[{ icon: FileSearch, title: 'See the full picture', text: 'Review the contact details, experience, education and skills extracted from your resume.' }, { icon: ScanLine, title: 'Find room to improve', text: 'Get feedback on measurable writing and formatting criteria, with explanations you can act on.' }, { icon: Target, title: 'Focus on the opportunity', text: 'Add a job description for a comparison, then make changes that reflect your real experience.' }].map(({ icon: Icon, title, text }) => <article key={title}><Icon size={27} strokeWidth={1.5} /><h3>{title}</h3><p>{text}</p></article>)}</div></section>}
  </main>;
}
