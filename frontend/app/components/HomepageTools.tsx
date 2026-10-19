'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase, Check, FileText, FolderOpen, LayoutTemplate, ScanLine } from 'lucide-react';

const categories = [
  { label: '1. Get noticed', cards: [
    { title: 'Resume builder', text: 'Put your experience in the best light. Build a resume with a live preview, flexible sections and a design that feels like you.', href: '/builder?new=1', action: 'Create my resume', icon: FileText, image: '/home/tools/resume-builder.png', tone: 'lavender' },
    { title: 'Resume checker', text: 'A fresh perspective makes a difference. See what works in your resume and find practical ways to make your next draft stronger.', href: '/resume-scanner', action: 'Check my resume', icon: ScanLine, image: '/home/features/job-match.png', tone: 'mint' },
  ] },
  { label: '2. Get interview ready', cards: [
    { title: 'Cover letter builder', text: 'Go beyond the bullet points. Create a thoughtful introduction that connects your experience to the opportunity.', href: '/cover-letter', action: 'Write my cover letter', icon: FolderOpen, image: '/home/features/cover-letter.png', tone: 'blue' },
    { title: 'Professional templates', text: 'Keep the focus on what you bring. Find a clean, readable layout and customize it to suit your story.', href: '/templates', action: 'Find my template', icon: LayoutTemplate, image: '/home/features/step-by-step.png', tone: 'lavender' },
  ] },
  { label: '3. Stay organized', cards: [
    { title: 'Job tracker', text: 'One place for every opportunity. Save job details, track your applications and keep your next follow-up in sight.', href: '/job-tracker', action: 'Organize my job search', icon: Briefcase, image: '/home/features/job-match.png', tone: 'mint' },
    { title: 'Your document workspace', text: 'Keep your drafts close. Return to a saved resume, open your cover letters and build on the work you’ve already done.', href: '/dashboard', action: 'Open my workspace', icon: FolderOpen, image: '/home/tools/resume-builder.png', tone: 'blue' },
  ] },
  { label: '4. Take the next step', cards: [
    { title: 'Resume writing guide', text: 'A blank page doesn’t have to stay blank. Find practical prompts for your experience, education, skills and next application.', href: '/resources/guides', action: 'Read the guide', icon: FileText, image: '/home/features/summary.png', tone: 'lavender' },
    { title: 'A version for every opportunity', text: 'Duplicate your resume, choose what matters for the role and keep your original. Your career story can keep growing.', href: '/builder', action: 'Make my next draft', icon: Check, image: '/home/features/step-by-step.png', tone: 'mint' },
  ] },
];

export default function HomepageTools() {
  const [active, setActive] = useState(0);
  return <section className="home-career-tools cf-container" id="career-tools"><div className="home-section-heading"><h2>Every tool you need is here.</h2><p>A little support for every stage of your next move.</p></div><div className="home-career-tabs" role="tablist" aria-label="Your career journey">{categories.map((category, index) => <button key={category.label} role="tab" id={`career-tab-${index}`} aria-selected={active === index} aria-controls="career-tools-panel" tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? categories.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + categories.length) % categories.length; setActive(next); document.getElementById(`career-tab-${next}`)?.focus(); } }}>{category.label}</button>)}</div><div id="career-tools-panel" role="tabpanel" aria-labelledby={`career-tab-${active}`} className="home-career-panels">{categories[active].cards.map(({ title, text, href, action, icon: Icon, image, tone }) => <article className={`home-career-card ${tone}`} key={title}><span className="home-career-icon"><Icon size={25} strokeWidth={1.6} /></span><h3>{title}</h3><p>{text}</p><Link href={href} className="home-text-link">{action}<ArrowRight size={18} /></Link><div className="home-career-card-art"><img src={image} alt={`Illustrative ${title.toLowerCase()} workspace`} width="500" height="280" loading="lazy" /></div></article>)}</div></section>;
}
