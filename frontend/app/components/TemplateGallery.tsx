'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { StudioPreview } from '@/components/resumeio/StudioPreview';
import { DEFAULT_DESIGN } from '@/components/resumeio/resumeDocument';
import { RESUME_TEMPLATES } from '@/components/resumeio/templateCatalog';
import { templateSample } from '@/components/resumeio/templateSample';

export const templates = RESUME_TEMPLATES;
export const gallerySample = templateSample;

export default function TemplateGallery({ variant = 'grid', showHeading = true }: { variant?: 'grid' | 'carousel'; showHeading?: boolean }) {
  const [filter, setFilter] = useState('All');
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const track = useRef<HTMLDivElement>(null);
  const filtered = templates.filter(template => filter === 'All' || template.category === filter);
  const scroll = (direction: number) => track.current?.scrollBy({ left: direction * 360, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  return <section className={`template-gallery template-gallery-${variant}`} id="templates" data-gallery-ready={ready} aria-label="Resume templates"><div className="cf-container">
    {showHeading && <div className="gallery-heading"><div><p className="cf-eyebrow">Made for a great first impression</p><h2>Resume templates that<br className="gallery-heading-break" /> let your experience shine.</h2><p>Choose your look. Make it yours. Download and take the next step.</p></div>{variant === 'carousel' ? <Link className="home-text-link" href="/templates">View all templates <ArrowRight size={18} /></Link> : <span className="gallery-promise"><Check size={17} />Switch styles without losing your content</span>}</div>}
    <div className="gallery-controls"><div className="gallery-filters" aria-label="Filter templates">{['All', 'Modern', 'Professional', 'Classic', 'Minimal', 'Creative'].map(category => <button key={category} disabled={!ready} onClick={() => { setFilter(category); if (track.current) track.current.scrollLeft = 0; }} aria-pressed={filter === category}>{category}</button>)}</div>{variant === 'carousel' && <div className="gallery-arrows"><button onClick={() => scroll(-1)} aria-label="Previous templates"><ArrowLeft size={20} /></button><button onClick={() => scroll(1)} aria-label="Next templates"><ArrowRight size={20} /></button></div>}</div>
    <div className="gallery-track" ref={track}>{filtered.map(template => <article className="template-card" key={template.id}><Link className="template-preview-link" href={`/builder?template=${template.id}&color=${template.color}`} aria-label={`Use ${template.name} template`}><div className="template-preview-canvas" aria-hidden="true"><StudioPreview printable={false} resume={gallerySample} template={template.id} colorTheme={template.color} scale={0.36} design={DEFAULT_DESIGN} /></div><span className="template-use-button">Use this template <ArrowRight size={17} /></span></Link><div className="template-card-details"><h3>{template.name}</h3><span>{template.format}</span><p>{template.description}</p></div></article>)}</div>
    <p className="gallery-example-note">Illustrative sample content. Your new resume starts with your own details.</p>
  </div></section>;
}
