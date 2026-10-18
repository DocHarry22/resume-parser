'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, FileText, ScanLine, Mail, FolderOpen, Briefcase, BookOpen } from 'lucide-react';
import { ResumeIOBuilder } from '@/components/resumeio';
import ResumeScannerPage from '../resume-scanner/page';
import TemplatesPage from '../templates/page';

function ToolsContent() {
  const view = useSearchParams().get('view');
  if (view === 'scanner') return <ResumeScannerPage />;
  if (view === 'builder' || view === 'cv-builder') return <ResumeIOBuilder />;
  if (view === 'templates' || view === 'cv-templates') return <TemplatesPage />;
  return <main className="cf-page cf-container workspace-tools"><section className="cf-page-hero"><p className="cf-eyebrow">One place for your next chapter</p><h1>Your career toolkit.</h1><p className="cf-page-description">A clearer story. A stronger application. Choose where you’d like to start.</p></section><div className="workspace-tool-grid">{[{ icon: FileText, title: 'Resume builder', text: 'Build or import your CV and make it yours.', href: '/builder' }, { icon: ScanLine, title: 'Resume checker', text: 'Get a fresh perspective on your resume.', href: '/resume-scanner' }, { icon: Mail, title: 'Cover letters', text: 'Make a thoughtful personal introduction.', href: '/cover-letter' }, { icon: FolderOpen, title: 'My documents', text: 'Pick up where you left off.', href: '/dashboard' }, { icon: Briefcase, title: 'Job tracker', text: 'Keep every opportunity organized.', href: '/job-tracker' }, { icon: BookOpen, title: 'Writing guide', text: 'Practical support for your next draft.', href: '/resources/guides' }].map(({ icon: Icon, title, text, href }) => <Link key={title} href={href} className="cf-panel"><Icon size={29} strokeWidth={1.5} /><h2>{title}</h2><p>{text}</p><span className="home-text-link">Get started <ArrowRight size={17} /></span></Link>)}</div></main>;
}

export default function ToolsPage() { return <Suspense fallback={<main className="cf-page cf-container" role="status">Loading your workspace…</main>}><ToolsContent /></Suspense>; }
