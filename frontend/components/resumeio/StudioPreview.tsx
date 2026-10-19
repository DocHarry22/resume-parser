'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { ResumeBuilder } from '@/types/builder';
import type { TemplateStyle, ColorTheme } from './templateCatalog';
import { resolveTemplateFont } from './templateCatalog';
import { ContentSection, DEFAULT_DESIGN, ResumeDesign, SECTION_LABELS, THEME_COLORS } from './resumeDocument';

export { THEME_COLORS } from './resumeDocument';
function date(value?: string) {
  if (!value) return '';
  if (/^\d{4}$/.test(value)) return value;
  if (!/^\d{4}(-\d{2})?(-\d{2})?$/.test(value)) return value;
  const month = value.length === 4 ? `${value}-01` : value.slice(0, 7);
  const parsed = new Date(`${month}-01T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en', { month: 'short', year: 'numeric' });
}
const period = (start?: string, end?: string, current?: boolean) => [date(start), current ? 'Present' : date(end)].filter(Boolean).join(' — ');
function Bullets({ values }: { values?: string[] }) { return values?.length ? <ul className="list-disc pl-5 mt-2 space-y-1">{values.filter(Boolean).map((v, i) => <li key={i}>{v}</li>)}</ul> : null; }
function RecordEntries({ values }: { values: Record<string, any>[] }) {
  return <>{values.map((entry, i) => <div className="resume-entry mb-4" key={i}>{Object.entries(entry).filter(([, value]) => value !== '' && value != null).map(([key, value]) => <div key={key}>{Array.isArray(value) ? <Bullets values={value.map(String)} /> : typeof value !== 'object' ? <p><span className="font-semibold">{key.replace(/_/g, ' ')}: </span>{String(value)}</p> : null}</div>)}</div>)}</>;
}

export function StudioPreview({ resume, template, colorTheme, scale = 0.65, design = DEFAULT_DESIGN, printable = true }: {
  resume: ResumeBuilder; template: TemplateStyle; colorTheme: ColorTheme; scale?: number; design?: ResumeDesign; printable?: boolean;
}) {
  const inner = useRef<HTMLDivElement>(null);
  const width = design.pageSize === 'A4' ? 794 : 816;
  const pageHeight = design.pageSize === 'A4' ? 1123 : 1056;
  const [height, setHeight] = useState(pageHeight);
  const color = THEME_COLORS[colorTheme];
  useLayoutEffect(() => {
    if (!inner.current) return;
    const observer = new ResizeObserver(() => setHeight(inner.current?.offsetHeight || pageHeight));
    observer.observe(inner.current);
    return () => observer.disconnect();
  }, [pageHeight]);
  const section = (id: ContentSection): React.ReactNode => {
    switch (id) {
      case 'summary': return resume.summary?.summary && <p className="whitespace-pre-wrap">{resume.summary.summary}</p>;
      case 'experience': return resume.experience.length > 0 && resume.experience.map((e, i) => <div className="resume-entry mb-4" key={i}><div className="flex justify-between gap-4"><strong>{e.position}</strong><span className="shrink-0 text-[0.9em]">{period(e.start_date, e.end_date, e.current)}</span></div><p className="opacity-75">{[e.company, e.location].filter(Boolean).join(' · ')}</p><Bullets values={[...e.description, ...e.achievements]} /></div>);
      case 'education': return resume.education.length > 0 && resume.education.map((e, i) => <div className="resume-entry mb-4" key={i}><div className="flex justify-between gap-4"><strong>{e.institution}</strong><span className="shrink-0 text-[0.9em]">{period(e.start_date, e.end_date)}</span></div><p>{[e.degree, e.field_of_study, e.location].filter(Boolean).join(' · ')}</p>{e.gpa != null && <p>GPA: {e.gpa}</p>}<Bullets values={e.honors} /></div>);
      case 'skills': return resume.skills.length > 0 && resume.skills.map((s, i) => <div className="resume-skill-group" key={i}>{s.category && <strong className="resume-skill-category">{s.category}</strong>}<ul className="resume-skill-list">{s.skills.map((skill, index) => <li key={index}>{skill}</li>)}</ul></div>);
      case 'projects': return resume.projects.length > 0 && resume.projects.map((p, i) => <div className="resume-entry mb-4" key={i}><div className="flex justify-between gap-4"><strong>{p.name}</strong><span className="text-[0.9em]">{period(p.start_date, p.end_date)}</span></div><p className="whitespace-pre-wrap">{p.description}</p>{p.technologies.length > 0 && <p className="opacity-75">{p.technologies.join(' · ')}</p>}{(p.url || p.github) && <p className="break-all">{[p.url, p.github].filter(Boolean).join(' · ')}</p>}<Bullets values={p.highlights} /></div>);
      case 'certifications': return resume.certifications.length > 0 && resume.certifications.map((c, i) => <div className="resume-entry mb-3" key={i}><strong>{c.name}</strong><p>{[c.issuer, date(c.issue_date), c.expiry_date && `Expires ${date(c.expiry_date)}`].filter(Boolean).join(' · ')}</p>{c.credential_id && <p>Credential: {c.credential_id}</p>}{c.credential_url && <p className="break-all">{c.credential_url}</p>}</div>);
      case 'languages': return resume.languages.length > 0 && <ul className="resume-language-list">{resume.languages.map((language, index) => <li key={index}><strong>{language.language}</strong><span>{language.proficiency}</span></li>)}</ul>;
      case 'achievements': return resume.achievements.length > 0 && <Bullets values={resume.achievements} />;
      case 'volunteer': return resume.volunteer.length > 0 && <RecordEntries values={resume.volunteer} />;
      case 'publications': return resume.publications.length > 0 && <RecordEntries values={resume.publications} />;
      case 'custom': return Object.keys(resume.custom_sections).length > 0 && Object.entries(resume.custom_sections).map(([title, value]) => <div className="resume-entry mb-4" key={title}><strong>{title}</strong>{Array.isArray(value) ? <Bullets values={value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v))} /> : <p className="whitespace-pre-wrap">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>}</div>);
    }
  };
  const content = design.sectionOrder.filter(id => !design.hiddenSections.includes(id)).map(id => {
    const body = section(id);
    return body ? { id, element: <section className="resume-section" data-section={id} key={id} style={{ marginTop: design.spacing }}><h2>{SECTION_LABELS[id]}</h2><div className="resume-section-content">{body}</div></section> } : null;
  }).filter((item): item is { id: ContentSection; element: React.ReactElement } => item !== null);
  const contact = resume.contact;
  const contactLines = [contact?.email, contact?.phone, contact?.location, contact?.linkedin, contact?.github, contact?.website].filter(Boolean);
  const font = resolveTemplateFont(template, design.font);
  const family = font === 'mono' ? '"Courier New", monospace' : font === 'serif' ? 'Georgia, "Times New Roman", serif' : 'Arial, Helvetica, sans-serif';
  const sideSections: ContentSection[] = template === 'modern' ? ['skills', 'languages', 'certifications'] : template === 'elegant' ? ['education', 'skills', 'languages'] : template === 'executive' ? ['education', 'skills', 'languages', 'certifications'] : template === 'creative' ? ['skills', 'languages', 'certifications'] : [];
  const mainContent = content.filter(item => !sideSections.includes(item.id));
  const sideContent = content.filter(item => sideSections.includes(item.id));
  const initials = (contact?.full_name || 'Your name').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('');
  const identity = <div className="resume-identity">
    {contact?.photo && /^(data:image\/(png|jpeg|webp);base64,|https?:\/\/)/i.test(contact.photo) && <img src={contact.photo} alt="Profile" className="resume-photo" />}
    {template === 'creative' && <div className="resume-monogram" aria-hidden="true">{initials}</div>}
    {template === 'technical' && <span className="resume-overline" aria-hidden="true">PROFILE / CURRICULUM VITAE</span>}
    <h1>{contact?.full_name || 'Your name'}</h1>
    {contactLines.length > 0 && <div className="resume-contact">{contactLines.map((line, index) => <span key={index}>{line}</span>)}</div>}
  </div>;
  const empty = !content.length && <p className="resume-empty">Add your details to begin your resume.</p>;
  return <div className={`${printable ? 'print-content ' : ''}bg-white shadow-xl rounded-sm shrink-0`} style={{ width: width * scale, height: height * scale }}>
    <div ref={inner} className={`${printable ? 'print-inner ' : ''}resume-document`} data-template={template} style={{ width, minHeight: pageHeight, transform: `scale(${scale})`, transformOrigin: 'top left', fontFamily: family, fontSize: design.fontSize, lineHeight: design.lineHeight, color: '#26313c', overflowWrap: 'anywhere', background: 'white', '--resume-accent': color, '--resume-tint': `${color}0c`, '--resume-rule': `${color}38`, '--resume-page-height': `${pageHeight}px` } as React.CSSProperties}>
      <div className="resume-layout">
        {template === 'modern' ? <>
          <div className="resume-sidebar">{identity}{sideContent.map(item => item.element)}</div>
          <div className="resume-main">{mainContent.map(item => item.element)}{empty}</div>
        </> : <>
          {identity}
          <div className={`resume-body${sideSections.length ? ' resume-body-split' : ''}`}>
            <div className="resume-main">{mainContent.map(item => item.element)}{empty}</div>
            {sideSections.length > 0 && <div className="resume-sidebar">{sideContent.map(item => item.element)}</div>}
          </div>
        </>}
      </div>
    </div>
  </div>;
}
