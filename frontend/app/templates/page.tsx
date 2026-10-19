import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import TemplateGallery from '../components/TemplateGallery';

export default function TemplatesPage() {
  return <main className="cf-page templates-page"><section className="cf-page-hero cf-container"><nav className="cf-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Resume templates</span></nav><p className="cf-eyebrow">Your experience. Beautifully presented.</p><h1>Professional resume templates.<br /><span>Find your perfect fit.</span></h1><p className="cf-page-description">A great first impression starts here. Explore eight distinct layouts, choose a style that feels like you, and make it your own.</p><div className="cf-inline-benefits">{['Fully customizable', 'Live document preview', 'PDF and Word options'].map(text => <span key={text}><Check size={16} />{text}</span>)}</div></section><TemplateGallery showHeading={false} /><section className="cf-bottom-prompt cf-container"><div><h2>Great design. Your words.</h2><p>Need a little help with what to write? Start with our practical resume guide.</p></div><Link className="home-text-link" href="/resources/guides">Read the guide <ArrowRight size={18} /></Link></section></main>;
}
