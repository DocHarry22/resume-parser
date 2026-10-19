'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X, FileText, LayoutTemplate, ScanLine, BookOpen, Briefcase, FolderOpen, ArrowRight } from 'lucide-react';

const menus = [
  { label: 'Resume Templates', links: [
    { title: 'All resume templates', description: 'Find a style that feels like you', href: '/templates', icon: LayoutTemplate },
    { title: 'Modern', description: 'A strong header and clean structure', href: '/builder?template=modern', icon: FileText },
    { title: 'Professional', description: 'Make a confident first impression', href: '/builder?template=professional', icon: FileText },
    { title: 'Simple', description: 'Let your experience take the spotlight', href: '/builder?template=minimal', icon: FileText },
  ] },
  { label: 'Resume Examples', links: [
    { title: 'Explore resume layouts', description: 'See eight distinct resume layouts', href: '/#templates', icon: LayoutTemplate },
    { title: 'Write your first resume', description: 'A practical guide to getting started', href: '/resources/guides', icon: BookOpen },
    { title: 'Check your resume', description: 'Find ways to improve your draft', href: '/resume-scanner', icon: ScanLine },
  ] },
  { label: 'Cover Letter', links: [
    { title: 'Cover letter builder', description: 'Tell the rest of your story', href: '/cover-letter', icon: FolderOpen },
    { title: 'Writing guidance', description: 'Clear words for your next opportunity', href: '/resources/guides', icon: BookOpen },
  ] },
  { label: 'Resources', links: [
    { title: 'Resume writing guide', description: 'Make your experience stand out', href: '/resources/guides', icon: BookOpen },
    { title: 'Resume checker', description: 'Practical feedback on your resume', href: '/resume-scanner', icon: ScanLine },
    { title: 'Job tracker', description: 'Keep your next move organized', href: '/job-tracker', icon: Briefcase },
    { title: 'My workspace', description: 'Return to your saved browser drafts', href: '/dashboard', icon: FolderOpen },
  ] },
];

export default function HomepageNavbar() {
  const [active, setActive] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const close = () => { setActive(null); setMobileOpen(false); };
  useEffect(() => { close(); }, [pathname]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!nav.current?.contains(event.target as Node)) close(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);
  return <header className="home-header" ref={nav}>
    <nav className="home-nav" aria-label="Main navigation">
      <Link className="home-logo" href="/" aria-label="CareerForge home" onClick={close}><span className="home-logo-mark" aria-hidden="true"><i /><i /><i /></span><span>CareerForge<small>by DoCHEng</small></span></Link>
      <div className="home-nav-links">{menus.map((menu, i) => <div className="home-nav-group" key={menu.label}>
        {i === 3 && <Link className="home-nav-faq" href="/#faq" onClick={close}>FAQ</Link>}
        <button className={active === menu.label ? 'is-open' : ''} aria-expanded={active === menu.label} aria-controls={`home-menu-${i}`} onClick={() => setActive(active === menu.label ? null : menu.label)}>{menu.label}<ChevronDown size={14} strokeWidth={2.2} /></button>
        {active === menu.label && <div className="home-nav-dropdown" id={`home-menu-${i}`}>{menu.links.map(({ title, description, href, icon: Icon }) => <Link key={title} href={href} onClick={close}><span><Icon size={21} strokeWidth={1.6} /></span><div><strong>{title}</strong><small>{description}</small></div><ArrowRight size={15} /></Link>)}</div>}
      </div>)}</div>
      <div className="home-nav-actions"><Link href="/dashboard" className="home-nav-workspace">My workspace</Link><Link href="/builder?new=1" className="home-button home-button-primary">Create my resume</Link><button className="home-mobile-toggle" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="home-mobile-nav" onClick={() => { setMobileOpen(!mobileOpen); setActive(null); }}>{mobileOpen ? <X size={25} /> : <Menu size={25} />}</button></div>
    </nav>
    {mobileOpen && <nav className="home-mobile-nav" id="home-mobile-nav" aria-label="Mobile navigation">{menus.map(menu => <div key={menu.label}><button onClick={() => setActive(active === menu.label ? null : menu.label)} aria-expanded={active === menu.label}>{menu.label}<ChevronDown size={16} /></button>{active === menu.label && <div>{menu.links.map(link => <Link key={link.title} href={link.href} onClick={close}>{link.title}</Link>)}</div>}</div>)}<Link href="/#faq" onClick={close}>FAQ</Link><Link href="/dashboard" onClick={close}>My workspace</Link><Link href="/builder?new=1" onClick={close} className="home-button home-button-primary">Create my resume</Link></nav>}
  </header>;
}
