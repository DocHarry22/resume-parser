'use client';

import { useEffect, useRef, useState } from 'react';
import { StudioPreview } from './StudioPreview';
import { DEFAULT_DESIGN } from './resumeDocument';
import { templateSample } from './templateSample';
import type { TemplateStyle, ColorTheme } from './templateCatalog';

/** The selector renders the real layout rather than an unrelated placeholder. */
export function TemplateThumbnail({ template, color }: { template: TemplateStyle; color: ColorTheme }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(180);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} aria-hidden="true" className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: '794 / 1123', pointerEvents: 'none' }}><div className="absolute left-0 top-0"><StudioPreview printable={false} resume={templateSample} template={template} colorTheme={color} scale={width / 794} design={DEFAULT_DESIGN} /></div></div>;
}
