'use client';

import { useEffect, useRef, useState } from 'react';
import type { SenderInfo } from '@/types/coverLetter';

export const LETTER_DESIGNS: Record<string, { accentColor: string; fontFamily: string }> = {
  professional: { accentColor: '#28364a', fontFamily: 'font-serif' },
  modern: { accentColor: '#2563eb', fontFamily: 'font-sans' },
  minimal: { accentColor: '#384345', fontFamily: 'font-sans' },
  creative: { accentColor: '#b64d3e', fontFamily: 'font-sans' },
  executive: { accentColor: '#263445', fontFamily: 'font-serif' },
  tech: { accentColor: '#0f766e', fontFamily: 'font-mono' },
};

export function Letterhead({ sender, template }: { sender: SenderInfo; template: string }) {
  const name = sender.full_name || 'Your name';
  const contacts = [sender.email, sender.phone, sender.linkedin, sender.website].filter(Boolean);
  const address = [sender.address, [sender.city, sender.state, sender.zip_code].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return <div className="letterhead" data-letterhead={template} style={{ '--letter-accent': (LETTER_DESIGNS[template] || LETTER_DESIGNS.professional).accentColor } as React.CSSProperties}>
    {template === 'creative' && <span className="letterhead-monogram" aria-hidden="true">{name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('')}</span>}
    {template === 'tech' && <div className="letterhead-overline" aria-hidden="true">CONTACT / APPLICATION</div>}
    <h1>{name}</h1>
    <div className="letterhead-details">{contacts.length > 0 && <div className="letterhead-contact">{contacts.map((contact, index) => <span key={index}>{contact}</span>)}</div>}{address && <p className="letterhead-address">{address}</p>}</div>
  </div>;
}

export function LetterTemplateThumbnail({ template }: { template: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(180);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const sender: SenderInfo = { full_name: 'Alex Morgan', email: 'alex.morgan@example.com', phone: '+27 00 000 0000', address: '', city: 'Cape Town', state: '', zip_code: '', country: '', linkedin: '', website: '' };
  return <div ref={container} aria-hidden="true" className="letter-template-thumbnail"><div className={`letter-document ${LETTER_DESIGNS[template]?.fontFamily || 'font-sans'}`} data-letter-template={template} style={{ width: 640, minHeight: 828, transform: `scale(${width / 640})`, transformOrigin: 'top left', padding: 40 }}>
    <Letterhead sender={sender} template={template} />
    <div className="letter-thumbnail-copy"><p>18 October 2026</p><p>Hiring Manager<br />Example Studio</p><p><strong>Re: Project Coordinator</strong></p><p>Dear Hiring Manager,</p><p>I am excited to apply for the Project Coordinator role. My experience brings thoughtful planning, clear communication and a practical approach to your team.</p><p>In my current role, I coordinate people, schedules and project updates. I enjoy turning complex briefs into well-organized work and helping colleagues deliver with confidence.</p><p>I would welcome the opportunity to discuss how I can contribute to your next project.</p><p>Sincerely,<br /><br /><strong>Alex Morgan</strong></p></div>
  </div></div>;
}
