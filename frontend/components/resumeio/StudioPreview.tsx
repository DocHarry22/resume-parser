'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { ResumeBuilder } from '@/types/builder';
import { TemplateStyle, ColorTheme } from './TemplateSelector';
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

export function StudioPreview({ resume, template, colorTheme, scale = 0.65, design = DEFAULT_DESIGN }: {
  resume: ResumeBuilder; template: TemplateStyle; colorTheme: ColorTheme; scale?: number; design?: ResumeDesign;
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
      case 'skills': return resume.skills.length > 0 && resume.skills.map((s, i) => <p className="mb-2" key={i}>{s.category && <strong>{s.category}: </strong>}{s.skills.join(' · ')}</p>);
      case 'projects': return resume.projects.length > 0 && resume.projects.map((p, i) => <div className="resume-entry mb-4" key={i}><div className="flex justify-between gap-4"><strong>{p.name}</strong><span className="text-[0.9em]">{period(p.start_date, p.end_date)}</span></div><p className="whitespace-pre-wrap">{p.description}</p>{p.technologies.length > 0 && <p className="opacity-75">{p.technologies.join(' · ')}</p>}{(p.url || p.github) && <p className="break-all">{[p.url, p.github].filter(Boolean).join(' · ')}</p>}<Bullets values={p.highlights} /></div>);
      case 'certifications': return resume.certifications.length > 0 && resume.certifications.map((c, i) => <div className="resume-entry mb-3" key={i}><strong>{c.name}</strong><p>{[c.issuer, date(c.issue_date), c.expiry_date && `Expires ${date(c.expiry_date)}`].filter(Boolean).join(' · ')}</p>{c.credential_id && <p>Credential: {c.credential_id}</p>}{c.credential_url && <p className="break-all">{c.credential_url}</p>}</div>);
      case 'languages': return resume.languages.length > 0 && <p>{resume.languages.map(l => [l.language, l.proficiency].filter(Boolean).join(' — ')).join(' · ')}</p>;
      case 'achievements': return resume.achievements.length > 0 && <Bullets values={resume.achievements} />;
      case 'volunteer': return resume.volunteer.length > 0 && <RecordEntries values={resume.volunteer} />;
      case 'publications': return resume.publications.length > 0 && <RecordEntries values={resume.publications} />;
      case 'custom': return Object.keys(resume.custom_sections).length > 0 && Object.entries(resume.custom_sections).map(([title, value]) => <div className="resume-entry mb-4" key={title}><strong>{title}</strong>{Array.isArray(value) ? <Bullets values={value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v))} /> : <p className="whitespace-pre-wrap">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>}</div>);
    }
  };
  const content = design.sectionOrder.filter(id => !design.hiddenSections.includes(id)).map(id => {
    const body = section(id);
    return body ? <section key={id} style={{ marginTop: design.spacing }}><h2 className="font-bold uppercase tracking-[0.14em] mb-3 pb-1 border-b" style={{ color, borderColor: `${color}44`, fontSize: '0.95em' }}>{SECTION_LABELS[id]}</h2>{body}</section> : null;
  });
  const contact = resume.contact;
  const contactLines = [contact?.email, contact?.phone, contact?.location, contact?.linkedin, contact?.github, contact?.website].filter(Boolean);
  const serif = template === 'classic' || template === 'elegant';
  const sidebar = template === 'modern';
  const family = design.font === 'mono' ? 'ui-monospace, monospace' : design.font === 'serif' || serif ? 'Georgia, serif' : 'Arial, Helvetica, sans-serif';
  return <div className="print-content bg-white shadow-xl rounded-sm shrink-0" style={{ width: width * scale, height: height * scale }}>
    <div ref={inner} className="print-inner resume-document" data-template={template} style={{ width, minHeight: pageHeight, transform: `scale(${scale})`, transformOrigin: 'top left', fontFamily: family, fontSize: design.fontSize, lineHeight: design.lineHeight, color: '#1e293b', overflowWrap: 'anywhere', background: 'white' }}>
      <div style={{ display: sidebar ? 'grid' : 'block', gridTemplateColumns: sidebar ? '220px minmax(0, 1fr)' : undefined, minHeight: pageHeight, padding: sidebar ? 0 : template === 'minimal' ? 48 : 42, borderTop: template === 'creative' ? `10px solid ${color}` : undefined }}>
        <div style={{ textAlign: ['classic', 'elegant'].includes(template) ? 'center' : 'left', background: template === 'professional' || sidebar ? color : undefined, color: template === 'professional' || sidebar ? 'white' : undefined, paddingTop: sidebar ? 42 : template === 'professional' ? 24 : 0, paddingRight: sidebar || template === 'professional' ? 24 : 0, paddingLeft: sidebar || template === 'professional' ? 24 : 0, paddingBottom: sidebar ? 42 : template === 'professional' ? 24 : template === 'classic' ? 18 : 0, borderBottom: template === 'classic' ? `3px double ${color}` : undefined }}>
          {contact?.photo && /^(data:image\/(png|jpeg|webp);base64,|https?:\/\/)/i.test(contact.photo) && <img src={contact.photo} alt="Profile" className="w-20 h-20 object-cover rounded-full float-right ml-5 mb-3" />}
          <h1 style={{ color: template === 'professional' || sidebar ? 'white' : color, fontSize: sidebar ? 28 : template === 'elegant' ? 38 : 32, lineHeight: 1.15, fontWeight: template === 'minimal' ? 400 : 700, letterSpacing: template === 'elegant' ? 2 : -0.5 }}>{contact?.full_name || 'Your name'}</h1>
          {contactLines.length > 0 && (sidebar ? <div className="mt-6 space-y-3 text-[0.9em]">{contactLines.map((line, i) => <p key={i}>{line}</p>)}</div> : <p className="mt-3 text-[0.9em]">{contactLines.join('  ·  ')}</p>)}
        </div>
        <div style={{ minWidth: 0, padding: sidebar ? '18px 32px 42px' : undefined }}>
        {content}
        {!contact?.full_name && !resume.summary?.summary && !resume.experience.length && !resume.education.length && !resume.skills.length && <p className="mt-12 text-slate-400 text-center">Add your details to begin your resume.</p>}
        </div>
      </div>
    </div>
  </div>;
}
