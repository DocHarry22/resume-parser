'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiConfig';
import { Loader2, Sparkles } from 'lucide-react';

export function SummaryAssistant({ text, onAccept }: { text: string; onAccept: (value: string) => void }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [consent, setConsent] = useState(false);
  const [action, setAction] = useState('professional');
  const [context, setContext] = useState('');
  const [suggestion, setSuggestion] = useState<{ before: string; after: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SITE_MODE === '1') { setAvailable(false); return; }
    let cancelled = false;
    apiFetch('/api/ai/status').then(r => r.ok ? r.json() : null).then(result => { if (!cancelled) setAvailable(result?.configured === true); }).catch(() => { if (!cancelled) setAvailable(false); });
    return () => { cancelled = true; };
  }, []);
  const generate = async () => {
    if (!consent || !text.trim() || !available || busy) return;
    setBusy(true); setError('');
    try {
      const response = await apiFetch('/api/ai/rewrite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, action, context, consent: true }) });
      const result = await response.json();
      if (!response.ok || typeof result.after !== 'string') throw new Error(typeof result.detail === 'string' ? result.detail : 'The writing assistant is unavailable. Your original text is unchanged.');
      setSuggestion({ before: text, after: result.after });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not generate a suggestion.'); }
    finally { setBusy(false); }
  };
  return <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4 space-y-3"><h3 className="font-semibold text-sm flex items-center gap-2 text-violet-900"><Sparkles size={16} /> Writing assistant</h3>
    {available === null ? <p className="text-xs text-slate-500">Checking writing assistant availability…</p> : !available ? <p className="text-sm text-slate-600">{process.env.NEXT_PUBLIC_SITE_MODE === '1' ? <>AI writing is available through the <a className="underline text-blue-700" href="https://resume.docheng.co.za/builder" target="_blank" rel="noopener noreferrer">primary site</a>. </> : 'AI writing is unavailable because no provider is configured. '}You can continue editing your summary above.</p> : <>
      <label className="block text-sm">Rewrite style<select className="mt-1 w-full rounded-lg border p-2 bg-white" value={action} onChange={e => setAction(e.target.value)}><option value="professional">Professional tone</option><option value="improve">Improve clarity</option><option value="shorten">Shorten</option><option value="expand">Expand</option><option value="ats">Improve keyword clarity</option><option value="tailor">Tailor to a role</option></select></label>
      <label className="block text-sm">Role or job context (optional)<textarea className="mt-1 w-full rounded-lg border p-2 min-h-[80px]" value={context} onChange={e => setContext(e.target.value)} placeholder="Paste relevant job requirements. Review suggestions for accuracy." /></label>
      <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />I consent to sending this summary and the context above to the configured AI provider for a writing suggestion.</label>
      <button className="rounded-lg bg-violet-600 text-white px-3 py-2 text-sm disabled:opacity-40 inline-flex gap-2 items-center" disabled={!consent || !text.trim() || busy} onClick={generate}>{busy && <Loader2 size={15} className="animate-spin" />}{busy ? 'Creating suggestion…' : 'Suggest a rewrite'}</button>
    </>}
    {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
    {suggestion && <div className="space-y-3 border-t border-violet-200 pt-3"><p className="text-xs text-violet-900">Review facts and claims before accepting. Your original summary stays unchanged until you accept.</p><div><h4 className="text-xs font-semibold mb-1">Before</h4><p className="text-sm whitespace-pre-wrap p-3 rounded-lg bg-white border">{suggestion.before}</p></div><label className="block text-xs font-semibold">Suggested version — editable<textarea className="mt-1 w-full rounded-lg border p-3 min-h-[180px] text-sm font-normal" value={suggestion.after} onChange={e => setSuggestion({ ...suggestion, after: e.target.value })} /></label>{text !== suggestion.before && <p className="text-xs text-amber-800">Your summary has changed since this suggestion was created. Accepting will replace the current summary.</p>}<div className="flex gap-2"><button className="rounded-lg bg-violet-600 text-white px-3 py-2 text-sm" onClick={() => { onAccept(suggestion.after); setSuggestion(null); }}>Accept version</button><button className="rounded-lg border px-3 py-2 text-sm bg-white" onClick={() => setSuggestion(null)}>Reject</button></div></div>}
  </div>;
}
