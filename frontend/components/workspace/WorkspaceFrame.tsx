'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, Calculator, ChevronRight, FileText, Flag, FolderOpen, GraduationCap, History, LayoutDashboard, Menu, MessageSquare, ScanLine, Search, ShieldCheck, Sparkles, Target, X } from 'lucide-react';
import { readDocuments } from '@/components/resumeio/resumeDocument';

const workspaceRoutes = ['/dashboard', '/documents', '/job-tracker', '/interview-prep', '/tailor', '/history', '/letters', '/jobs', '/auto-apply', '/salary-analyzer', '/career-plan'];
const navigation = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Documents', href: '/documents', icon: FolderOpen },
  { label: 'Job Search', href: '/jobs', icon: Search },
  { label: 'Auto Apply', href: '/auto-apply', icon: Sparkles },
  { label: 'Job Tracker', href: '/job-tracker', icon: BriefcaseBusiness },
  { label: 'Salary Analyzer', href: '/salary-analyzer', icon: Calculator },
  { label: '90-Day Plan', href: '/career-plan', icon: Flag },
  { label: 'Resume Tailoring', href: '/tailor', icon: Target },
  { label: 'Version History', href: '/history', icon: History },
  { label: 'Interview Prep', href: '/interview-prep', icon: MessageSquare },
];

export default function WorkspaceFrame({ children, publicHeader, publicFooter }: { children: React.ReactNode; publicHeader: React.ReactNode; publicFooter: React.ReactNode }) {
  const pathname = usePathname();
  const inWorkspace = workspaceRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [name, setName] = useState('Your workspace');
  const toggle = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    const load = () => { try { setName(readDocuments()[0]?.resume.contact?.full_name || 'Your workspace'); } catch { /* Recovery is presented by each workspace page. */ } };
    load(); window.addEventListener('resume-library-change', load); window.addEventListener('storage', load);
    return () => { window.removeEventListener('resume-library-change', load); window.removeEventListener('storage', load); };
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    drawer.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileOpen(false); toggle.current?.focus(); }
      if (event.key === 'Tab') {
        const nodes = drawer.current?.querySelectorAll<HTMLElement>('a, button');
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', keyboard); };
  }, [mobileOpen]);
  if (!inWorkspace) return <>{publicHeader}{children}{publicFooter}</>;
  return <div className="wk-shell">
    <a href="#workspace-main" className="wk-skip">Skip to workspace</a>
    {mobileOpen && <button className="wk-backdrop" aria-label="Close navigation" onClick={() => { setMobileOpen(false); toggle.current?.focus(); }} />}
    <aside ref={drawer} className={`wk-sidebar ${mobileOpen ? 'is-open' : ''}`} id="workspace-navigation" role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen || undefined} aria-label="Career workspace navigation">
      <div className="wk-brand-row"><Link href="/" className="wk-brand" aria-label="CareerForge home"><span className="wk-brand-mark"><i /><i /></span><span>CareerForge<small>by DoCHEng</small></span></Link><button className="wk-drawer-close wk-icon-button" aria-label="Close menu" onClick={() => { setMobileOpen(false); toggle.current?.focus(); }}><X size={20} /></button></div>
      <div className="wk-profile"><span className="wk-avatar">{name === 'Your workspace' ? <FileText size={21} /> : name.split(' ').map(word => word[0]).slice(0, 2).join('')}</span><div><strong>{name}</strong><small>Your next chapter starts here</small></div></div>
      <nav aria-label="Workspace"><span className="wk-nav-caption">MY WORKSPACE</span>{navigation.map(({ label, href, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}><Icon size={19} /><span>{label}</span>{pathname === href && <ChevronRight size={15} />}</Link>)}
        <span className="wk-nav-caption wk-nav-space">YOUR CAREER TOOLKIT</span>
        <Link href="/builder?new=1"><FileText size={19} /><span>Resume Builder</span></Link>
        <Link href="/letters" aria-current={pathname === '/letters' ? 'page' : undefined}><FileText size={19} /><span>Cover Letters</span></Link>
        <Link href="/resume-scanner"><ScanLine size={19} /><span>Resume Checker</span></Link>
        <Link href="/resources/guides"><GraduationCap size={19} /><span>Learning & Guides</span></Link>
      </nav>
      <div className="wk-sidebar-bottom"><div className="wk-sidebar-tip"><BookOpen size={22} /><strong>A stronger next step.</strong><p>A little guidance for every stage of your career.</p><Link href="/resources/guides">Explore the guides <ArrowRight size={15} /></Link></div><Link href="/privacy" className="wk-privacy"><ShieldCheck size={16} />Privacy & browser data</Link><Link href="/" className="wk-privacy"><ArrowLeft size={15} />Back to website</Link></div>
    </aside>
    <div className="wk-main" id="workspace-main"><header className="wk-topbar"><div className="wk-topbar-left"><button ref={toggle} className="wk-menu-toggle wk-icon-button" aria-label="Open workspace menu" aria-expanded={mobileOpen} aria-controls="workspace-navigation" onClick={() => setMobileOpen(true)}><Menu size={23} /></button><span className="wk-breadcrumb">Workspace <ChevronRight size={13} /><strong>{pathname === '/letters' ? 'Cover Letters' : navigation.find(item => item.href === pathname)?.label || 'Documents'}</strong></span></div><div className="wk-topbar-actions"><span className="wk-local-badge"><span />Browser workspace</span><Link href="/builder?new=1" className="wk-button wk-button-primary">Create resume <ArrowRight size={15} /></Link></div></header>{children}<footer className="wk-footer"><span>Made for your next chapter.</span><Link href="/privacy">Saved on this device · Keep a downloaded backup</Link></footer></div>
  </div>;
}
