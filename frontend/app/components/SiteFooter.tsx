'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowUp, Globe2, ShieldCheck } from 'lucide-react';

const groups = [
  { title: 'Resume', links: [['Resume builder', '/builder?new=1'], ['Resume templates', '/templates'], ['Resume examples', '/#resume-examples'], ['Resume checker', '/resume-scanner']] },
  { title: 'Cover letter', links: [['Cover letter builder', '/cover-letter'], ['My cover letters', '/cover-letter'], ['Writing guidance', '/resources/guides#cover-letters']] },
  { title: 'Your next move', links: [['My workspace', '/dashboard'], ['Job tracker', '/job-tracker'], ['Create a new CV', '/builder?new=1&type=cv']] },
  { title: 'Resources', links: [['Resume writing guide', '/resources/guides'], ['First applications', '/resources/guides#graduates'], ['Technical careers', '/resources/guides#technical'], ['Frequently asked questions', '/#faq']] },
  { title: 'Support', links: [['Getting started', '/resources/guides'], ['Privacy and data', '/privacy'], ['Download your backups', '/dashboard']] },
];

function FooterContent() {
  const pathname = usePathname();
  const search = useSearchParams();
  if (pathname.includes('/builder') || (pathname === '/tools' && ['builder', 'cv-builder'].includes(search.get('view') || ''))) return null;
  return <footer className="site-footer no-print"><div className="site-footer-inner">
    <div className="site-footer-top"><Link className="home-logo" href="/" aria-label="CareerForge home"><span className="home-logo-mark" aria-hidden="true"><i /><i /><i /></span><span>CareerForge<small>by DoCHEng</small></span></Link><p>A better resume. A more confident next step.</p><a className="footer-back-top" href="#" onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}>Back to top <ArrowUp size={17} /></a></div>
    <div className="site-footer-columns">{groups.map(group => <div key={group.title}><h2>{group.title}</h2>{group.links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}</div>)}</div>
    <div className="site-footer-bottom"><span>© {new Date().getFullYear()} CareerForge by DoCHEng</span><Link href="/privacy"><ShieldCheck size={16} />Your privacy matters</Link><span><Globe2 size={16} />South Africa · English</span></div>
    <p className="site-footer-note">Your drafts save in this browser. Keep a downloaded backup before switching devices or clearing browser data.</p>
  </div></footer>;
}

export default function SiteFooter() { return <Suspense fallback={null}><FooterContent /></Suspense>; }
