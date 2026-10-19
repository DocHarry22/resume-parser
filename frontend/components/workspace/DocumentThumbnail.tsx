'use client';

import { useEffect, useRef, useState } from 'react';
import { StudioPreview } from '@/components/resumeio/StudioPreview';
import type { SavedResume } from '@/components/resumeio/resumeDocument';

export default function DocumentThumbnail({ document }: { document: SavedResume }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(180);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(container.current); return () => observer.disconnect();
  }, []);
  return <div ref={container} className="wk-document-preview" aria-hidden="true"><div><StudioPreview printable={false} resume={document.resume} template={document.template} colorTheme={document.colorTheme} scale={width / (document.design.pageSize === 'Letter' ? 816 : 794)} design={document.design} /></div></div>;
}
