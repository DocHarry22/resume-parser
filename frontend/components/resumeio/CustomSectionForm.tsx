'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

const presets = ['Licences', 'Memberships', 'Awards', 'References', 'Internships', 'Objective', 'Courses', 'Interests'];
const field = 'w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
export function CustomSectionForm({ sections, onChange }: { sections: Record<string, any>; onChange: (sections: Record<string, any>) => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  return <div className="space-y-5"><p className="text-sm text-slate-500">Add optional details relevant to your application. Each section appears in your live preview and exports.</p>
    <div className="flex flex-wrap gap-2">{presets.filter(p => !Object.hasOwn(sections, p)).map(preset => <button key={preset} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100" onClick={() => onChange({ ...sections, [preset]: '' })}>+ {preset}</button>)}</div>
    {Object.entries(sections).map(([heading, value]) => <div key={heading} className="rounded-xl border p-4 space-y-2"><div className="flex justify-between items-center"><label htmlFor={`custom-${encodeURIComponent(heading)}`} className="font-semibold text-sm">{heading}</label><button className="text-xs text-red-600" onClick={() => { const next = { ...sections }; delete next[heading]; onChange(next); }}>Remove</button></div><textarea id={`custom-${encodeURIComponent(heading)}`} className={`${field} min-h-[120px]`} value={typeof value === 'string' ? value : Array.isArray(value) ? value.join('\n') : JSON.stringify(value, null, 2)} onChange={e => onChange({ ...sections, [heading]: e.target.value })} placeholder={`Add your ${heading.toLowerCase()} here`} /></div>)}
    <label className="block text-sm font-medium">Custom heading<input className={`${field} mt-2`} value={title} onChange={e => setTitle(e.target.value)} placeholder="Another section heading" /></label><label className="block text-sm font-medium">Content<textarea className={`${field} mt-2 min-h-[110px]`} value={body} onChange={e => setBody(e.target.value)} /></label><button className="inline-flex items-center gap-2 border rounded-xl px-3 py-2 text-sm disabled:opacity-40" disabled={!title.trim() || Object.hasOwn(sections, title.trim())} onClick={() => { onChange({ ...sections, [title.trim()]: body }); setTitle(''); setBody(''); }}><Plus size={16} /> Add custom section</button>
  </div>;
}
