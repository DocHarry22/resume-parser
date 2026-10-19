'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export function BuilderActions({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [availableHeight, setAvailableHeight] = useState(480);
  const [panelLeft, setPanelLeft] = useState<number | undefined>();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const items = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') || []);
  const close = () => { setOpen(false); toggle.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const anchor = root.current?.getBoundingClientRect();
      if (!anchor) return;
      const width = panel.current?.getBoundingClientRect().width || Math.min(256, window.innerWidth - 32);
      setAvailableHeight(Math.max(120, window.innerHeight - anchor.bottom - 24));
      setPanelLeft(Math.max(16, Math.min(anchor.right - width, window.innerWidth - width - 16)) - anchor.left);
    };
    measure();
    items()[0]?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', measure);
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', measure); };
  }, [open]);

  return <div ref={root} className="studio-action-menu" onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      const links = items(), index = links.indexOf(document.activeElement as HTMLElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + links.length) % links.length;
      links[next]?.focus();
    }
  }}>
    <button ref={toggle} type="button" className="studio-actions-toggle" aria-label="Resume actions" title="Resume actions" aria-expanded={open} aria-controls="resume-actions" onClick={() => setOpen(value => !value)}><MoreHorizontal size={21} aria-hidden="true" /></button>
    {open && <div ref={panel} id="resume-actions" role="group" aria-label="Resume actions" className="studio-action-popover" style={{ maxHeight: availableHeight, left: panelLeft, right: panelLeft === undefined ? 0 : 'auto' }} onClick={event => { if ((event.target as HTMLElement).closest('button:not(:disabled), a[href]')) close(); }}><p className="studio-actions-caption">Resume actions</p>{children}</div>}
  </div>;
}
