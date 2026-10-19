'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Star, HelpCircle, X, ArrowRight } from 'lucide-react';

const words = ['noticed', 'interview ready', 'a fresh start'];

export default function HomepageHero() {
  const [word, setWord] = useState(words[0]);
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let index = 0;
    let length = words[0].length;
    let deleting = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (deleting) {
        length--;
        setWord(words[index].slice(0, length));
        if (length === 0) { deleting = false; index = (index + 1) % words.length; }
        timer = setTimeout(tick, length === 0 ? 250 : 45);
      } else {
        length++;
        setWord(words[index].slice(0, length));
        if (length === words[index].length) deleting = true;
        timer = setTimeout(tick, deleting ? 3500 : 85);
      }
    };
    timer = setTimeout(tick, 5000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setHelpOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  return <>
    <section className="home-hero" aria-labelledby="home-headline"><div className="home-hero-inner">
      <div className="home-hero-copy">
        <h1 id="home-headline">This resume<br className="home-desktop-break" /> builder gets you<br /><span className="home-changing-word" aria-hidden="true">{word}<span className="home-type-cursor" /></span><span className="sr-only">noticed</span></h1>
        <p className="home-hero-subtitle">Your next opportunity starts with a great resume.</p>
        <div className="home-hero-actions"><Link href="/builder?new=1" className="home-button home-button-primary">Create my resume</Link><Link href="/builder?import=1" className="home-button home-button-secondary">Upload my resume</Link></div>
        <div className="home-hero-trust"><div className="home-trust-line"><span className="home-trust-check"><Check size={12} strokeWidth={3} /></span><span><strong>Your story,</strong> professionally presented</span></div><div className="home-trust-line home-trust-brand"><Star size={24} fill="currentColor" strokeWidth={0} aria-hidden="true" /><strong>CareerForge</strong><span>Free to start | No account needed</span></div></div>
      </div>
      <picture className="home-hero-art"><source media="(max-width: 600px)" srcSet="/home/resume-hero-mobile.png" /><img src="/home/resume-hero.png" alt="Illustrative resume for Alice Hart, with a portrait, resume score and skills suggestions" width="726" height="594" loading="eager" /></picture>
    </div></section>
    {helpOpen && <aside className="home-help-panel" aria-label="Resume help"><div><h2>A little help getting started?</h2><button aria-label="Close help" onClick={() => setHelpOpen(false)}><X size={19} /></button></div><p>Find your next step with our practical resume guide, or pick up where you left off.</p><Link href="/resources/guides">Read the resume guide <ArrowRight size={16} /></Link><Link href="/dashboard">Open my workspace <ArrowRight size={16} /></Link><a href="#faq" onClick={() => setHelpOpen(false)}>Frequently asked questions <ArrowRight size={16} /></a></aside>}
    <button className="home-help-toggle" aria-label={helpOpen ? 'Close resume help' : 'Open resume help'} aria-expanded={helpOpen} onClick={() => setHelpOpen(!helpOpen)}>{helpOpen ? <X size={27} /> : <HelpCircle size={29} strokeWidth={2} />}</button>
  </>;
}
