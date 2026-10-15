'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowDown, ArrowUp, Download, Eye, FileText, HelpCircle, Loader2, Palette, Redo2, Save, Settings2, Undo2, Upload, X } from 'lucide-react';
import { apiFetch, IS_LOCAL_STORAGE } from '@/lib/apiConfig';
import { ResumeBuilder } from '@/types/builder';
import { TemplateSelector } from './TemplateSelector';
import { PersonalDetailsForm, SummaryForm, ExperienceForm, EducationForm, SkillsForm, ProjectsForm, CertificationsForm, LanguagesForm } from './SectionForms';
import { StudioPreview } from './StudioPreview';
import { SummaryAssistant } from './SummaryAssistant';
import { CustomSectionForm } from './CustomSectionForm';
import { localDocx, localText } from './localExport';
import { ContentSection, createDocument, normalizeDocument, normalizeResume, readDocuments, ResumeDesign, SavedResume, saveDocument, SECTION_LABELS, STORAGE_KEY } from './resumeDocument';

const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
const field = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const clone = <T,>(value: T): T => structuredClone(value);
const SITE_MODE = process.env.NEXT_PUBLIC_SITE_MODE === '1';
const PRIMARY_BUILDER = 'https://resume.docheng.co.za/builder';
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';
const serviceError = (body: any, fallback: string) => typeof body?.detail === 'string' ? body.detail : Array.isArray(body?.detail)
  ? body.detail.map((item: any) => `${(item.loc || []).filter((part: any) => part !== 'body').join(' → ')}: ${item.msg || 'Check this field'}`).join('; ')
  : fallback;

export function ResumeIOBuilder() {
  const [doc, setDoc] = useState<SavedResume | null>(null);
  const current = useRef<SavedResume | null>(null);
  const past = useRef<SavedResume[]>([]);
  const future = useRef<SavedResume[]>([]);
  const [, setHistoryVersion] = useState(0);
  const [active, setActive] = useState<'personal' | ContentSection>('personal');
  const [tab, setTab] = useState<'content' | 'design'>('content');
  const [mobilePreview, setMobilePreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [zoom, setZoom] = useState(0.66);
  const [saveState, setSaveState] = useState<'pending' | 'saved' | 'failed'>('pending');
  const [savedAt, setSavedAt] = useState<string>('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const previewScroll = useRef<HTMLDivElement>(null);
  const [cloudId, setCloudId] = useState<string | null>(null);
  const lastEdit = useRef(0);

  useEffect(() => {
    if (!previewScroll.current) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width > 0) setZoom(Math.max(0.3, Math.min(0.66, width / (doc?.design.pageSize === 'Letter' ? 816 : 794))));
    });
    observer.observe(previewScroll.current);
    return () => observer.disconnect();
  }, [Boolean(doc), doc?.design.pageSize]);

  useEffect(() => {
    if (!showTemplates && !showHelp) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select, textarea, a[href], [tabindex="0"]') || []);
    focusable()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setShowTemplates(false); setShowHelp(false); }
      if (event.key === 'Tab') {
        const items = focusable(); const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, [showTemplates, showHelp]);

  const replace = useCallback((next: SavedResume, record = true) => {
    if (record && current.current) {
      // Group rapid typing into one undo step while keeping separate actions distinct.
      if (Date.now() - lastEdit.current > 600 || !past.current.length) past.current = [...past.current.slice(-49), clone(current.current)];
      future.current = [];
      lastEdit.current = Date.now();
    }
    current.current = next;
    setDoc(next);
    setSaveState('pending');
    setHistoryVersion(v => v + 1);
  }, []);
  const update = useCallback((changes: Partial<SavedResume>) => {
    if (current.current) replace({ ...current.current, ...changes });
  }, [replace]);
  const updateResume = (changes: Partial<ResumeBuilder>) => doc && update({ resume: { ...doc.resume, ...changes } });
  const updateDesign = (changes: Partial<ResumeDesign>) => doc && update({ design: { ...doc.design, ...changes } });

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const all = readDocuments();
      const id = params.get('id');
      let initial = params.has('new') ? createDocument() : id ? all.find(d => d.id === id) : all[0];
      if (id && !initial) setError('This browser does not have that resume. A new document has been opened.');
      if (!initial && !params.has('new') && !id) {
        const legacy = localStorage.getItem('resume_draft');
        if (legacy) {
          initial = normalizeDocument(JSON.parse(legacy));
          setNotice('Your earlier browser draft has been restored.');
        }
      }
      initial ||= createDocument();
      const requestedTemplate = params.get('template');
      if (requestedTemplate && ['modern', 'classic', 'minimal', 'professional', 'creative', 'elegant'].includes(requestedTemplate)) {
        initial = { ...initial, template: requestedTemplate as SavedResume['template'] };
      }
      if (params.get('type') === 'cv' && params.has('new')) initial.resume.title = 'Untitled CV';
      current.current = initial;
      setDoc(initial);
      window.history.replaceState(null, '', `/builder?id=${encodeURIComponent(initial.id)}`);
    } catch (e) {
      setError(`Could not restore browser drafts: ${errorText(e)} Your stored data has not been cleared.`);
      const initial = createDocument();
      current.current = initial;
      setDoc(initial);
    }
  }, []);

  const save = useCallback(() => {
    if (!current.current) return false;
    try {
      const saved = saveDocument(current.current);
      current.current = { ...current.current, updatedAt: saved.updatedAt };
      setSavedAt(saved.updatedAt);
      setSaveState('saved');
      setError(previous => previous.startsWith('Browser save failed:') ? '' : previous);
      return true;
    } catch (e) {
      setSaveState('failed');
      setError(`Browser save failed: ${errorText(e)} Download a JSON backup to keep your work.`);
      return false;
    }
  }, []);
  useEffect(() => {
    if (!doc) return;
    const timeout = window.setTimeout(save, 700);
    return () => window.clearTimeout(timeout);
  }, [doc, save]);
  useEffect(() => {
    const onClose = (event: BeforeUnloadEvent) => {
      if (saveState !== 'saved' && !save()) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onClose);
    return () => window.removeEventListener('beforeunload', onClose);
  }, [saveState, save]);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (!previous || !current.current) return;
    future.current.push(clone(current.current));
    lastEdit.current = 0;
    replace(previous, false);
  }, [replace]);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next || !current.current) return;
    past.current.push(clone(current.current));
    lastEdit.current = 0;
    replace(next, false);
  }, [replace]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      if (e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if (e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [save, undo, redo]);

  const downloadBlob = (blob: Blob, extension: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(current.current?.resume.title || 'resume').replace(/[^a-z0-9 _-]/gi, '').trim() || 'resume'}.${extension}`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const exportFile = async (format: 'pdf' | 'docx' | 'txt' | 'json') => {
    if (!doc || busy) return;
    setError('');
    if (SITE_MODE && format === 'pdf') { window.print(); return; }
    if (format === 'txt') {
      downloadBlob(localText(doc), 'txt');
      setNotice('Text resume downloaded locally in your chosen section order.');
      return;
    }
    if (SITE_MODE && format === 'docx') {
      setBusy('export-docx');
      try { downloadBlob(await localDocx(doc), 'docx'); setNotice('Editable DOCX downloaded locally. Use Print / Save PDF for the exact preview design.'); }
      catch (e) { setError(errorText(e)); }
      finally { setBusy(''); }
      return;
    }
    if (format === 'json') {
      downloadBlob(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }), 'json');
      setNotice('JSON backup downloaded. Import it here to restore content and design.');
      return;
    }
    setBusy(`export-${format}`);
    try {
      const visible = { ...doc.resume };
      doc.design.hiddenSections.forEach(id => {
        if (id === 'custom') visible.custom_sections = {};
        else if (id === 'summary') visible.summary = { summary: '' };
        else (visible as any)[id] = [];
      });
      const route = IS_LOCAL_STORAGE ? `/api/exports/resume/${format}` : `/api/builder/export/${format}`;
      const response = await apiFetch(`${route}?page_size=${doc.design.pageSize}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(visible) });
      if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(serviceError(body, `Export unavailable (${response.status}). Use Print / Save PDF for your chosen design.`)); }
      downloadBlob(await response.blob(), format);
      setNotice(`${format.toUpperCase()} downloaded in a readable document layout. Use Print / Save PDF to export the exact preview design.`);
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(''); }
  };
  const importFile = async (file?: File) => {
    if (!file || busy) return;
    if (SITE_MODE && !/\.json$/i.test(file.name)) { setError('This Sites edition restores JSON backups locally. Open the primary site for PDF, DOCX, and TXT parsing.'); return; }
    if (!/\.(pdf|docx|txt|json)$/i.test(file.name)) { setError('Choose a PDF, DOCX, TXT, or JSON resume file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Choose a resume smaller than 10 MB.'); return; }
    setBusy('import'); setError(''); setNotice('');
    try {
      let imported: SavedResume;
      let importedCloudId: string | null = null;
      if (/\.json$/i.test(file.name)) imported = normalizeDocument(JSON.parse(await file.text()));
      else {
        const data = new FormData(); data.append('file', file);
        const response = await apiFetch(IS_LOCAL_STORAGE ? '/api/exports/resume/import' : '/api/builder/import', { method: 'POST', body: data });
        const result = await response.json();
        if (!response.ok || !result.resume) throw new Error(serviceError(result, 'Could not read this resume. Try a text-based PDF, DOCX, or TXT file.'));
        imported = { ...createDocument(), resume: normalizeResume(result.resume) };
        importedCloudId = IS_LOCAL_STORAGE ? null : result.resume.id || null;
      }
      // Import creates a separate document, preserving the previously saved draft.
      if (current.current && !save()) throw new Error('Save your current work as a JSON backup before importing.');
      imported.id = crypto.randomUUID();
      imported.resume.title = imported.resume.title === 'My Resume' || imported.resume.title === 'Imported resume' ? file.name.replace(/\.[^.]+$/, '') : imported.resume.title;
      past.current = []; future.current = [];
      setCloudId(importedCloudId);
      replace(imported, false);
      window.history.replaceState(null, '', `/builder?id=${encodeURIComponent(imported.id)}`);
      setNotice('Resume imported into a new document. Review dates and sections before exporting.');
      setActive('personal');
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(''); if (fileInput.current) fileInput.current.value = ''; }
  };
  const duplicate = () => {
    if (!doc || busy || !save()) return;
    const copy = { ...clone(doc), id: crypto.randomUUID(), resume: { ...clone(doc.resume), title: `${doc.resume.title} (copy)` } };
    past.current = []; future.current = []; setCloudId(null);
    replace(copy, false);
    window.history.replaceState(null, '', `/builder?id=${copy.id}`);
    setNotice('A separate copy is ready to edit. Your original is in Documents.');
  };
  const deleteDocument = () => {
    if (!doc || busy || !window.confirm(`Delete “${doc.resume.title}” from this browser? Download a backup first if you need it.`)) return;
    try {
      const remaining = readDocuments().filter(d => d.id !== doc.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      const next = createDocument(); past.current = []; future.current = []; setCloudId(null);
      replace(next, false); window.history.replaceState(null, '', `/builder?id=${next.id}`);
      setNotice('Resume deleted from this browser. A blank document is ready.');
    } catch (e) { setError(errorText(e)); }
  };
  const sync = async () => {
    if (SITE_MODE) { window.open(PRIMARY_BUILDER, '_blank', 'noopener,noreferrer'); return; }
    if (IS_LOCAL_STORAGE) { setNotice('Your resume saves only in this browser on this device. Download a JSON backup to keep another copy.'); return; }
    if (!doc || busy) return;
    const syncingDocumentId = doc.id;
    setBusy('sync'); setError('');
    try {
      let id = cloudId;
      if (!id) {
        const body = new FormData(); body.append('title', doc.resume.title);
        const response = await apiFetch('/api/builder/create', { method: 'POST', body });
        const result = await response.json();
        if (!response.ok || !result.resume?.id) throw new Error('The document service could not create a session copy. Your browser draft is safe.');
        id = result.resume.id;
        if (current.current?.id !== syncingDocumentId) return;
        setCloudId(id);
      }
      const response = await apiFetch(`/api/builder/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc.resume) });
      if (!response.ok) throw new Error(serviceError(await response.json().catch(() => null), 'The session copy could not be updated. Your browser draft is safe.'));
      if (current.current?.id !== syncingDocumentId) return;
      setNotice('Saved to this browser and your current server session. This is a guest workspace; download a backup for long-term storage.');
      save();
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(''); }
  };

  if (!doc) return <div className="min-h-[70vh] flex items-center justify-center gap-3 text-slate-500"><Loader2 className="animate-spin w-5 h-5" /> Opening your document…</div>;
  const resume = doc.resume;
  const complete = [Boolean(resume.contact?.full_name && resume.contact?.email), Boolean(resume.summary?.summary.trim()), resume.experience.some(e => e.company && e.position), resume.education.some(e => e.institution && e.degree), resume.skills.some(s => s.skills.length > 0)];
  const completion = Math.round(complete.filter(Boolean).length / complete.length * 100);
  const withEntryOrder = (content: React.ReactNode) => {
    const entries = (resume as any)[active];
    if (!Array.isArray(entries) || entries.length < 2) return content;
    return <div className="space-y-5"><details className="rounded-xl border p-3"><summary className="cursor-pointer text-sm font-medium text-slate-600">Reorder entries ({entries.length})</summary><div className="mt-3 space-y-2">{entries.map((entry: any, index: number) => <div key={index} className="flex items-center gap-2"><span className="text-sm flex-1 truncate">{entry.position || entry.institution || entry.name || entry.category || entry.language || `Entry ${index + 1}`}</span>{[-1, 1].map(offset => <button key={offset} className="p-2 rounded-lg border disabled:opacity-25" aria-label={`Move entry ${index + 1} ${offset < 0 ? 'up' : 'down'}`} disabled={index + offset < 0 || index + offset >= entries.length} onClick={() => { const reordered = [...entries]; [reordered[index], reordered[index + offset]] = [reordered[index + offset], reordered[index]]; lastEdit.current = 0; updateResume({ [active]: reordered }); }}>{offset < 0 ? <ArrowUp size={15} /> : <ArrowDown size={15} />}</button>)}</div>)}</div></details>{content}</div>;
  };
  const form = () => {
    switch (active) {
      case 'personal': return <PersonalDetailsForm contact={resume.contact} onChange={contact => updateResume({ contact })} />;
      case 'summary': return <div className="space-y-5"><SummaryForm summary={resume.summary?.summary || ''} onChange={summary => updateResume({ summary: { summary } })} /><SummaryAssistant text={resume.summary?.summary || ''} onAccept={summary => { lastEdit.current = 0; updateResume({ summary: { summary } }); }} /></div>;
      case 'experience': return withEntryOrder(<ExperienceForm experience={resume.experience} onChange={experience => updateResume({ experience })} />);
      case 'education': return withEntryOrder(<EducationForm education={resume.education} onChange={education => updateResume({ education })} />);
      case 'skills': return withEntryOrder(<SkillsForm skills={resume.skills} onChange={skills => updateResume({ skills })} />);
      case 'projects': return withEntryOrder(<ProjectsForm projects={resume.projects} onChange={projects => updateResume({ projects })} />);
      case 'certifications': return withEntryOrder(<CertificationsForm certifications={resume.certifications} onChange={certifications => updateResume({ certifications })} />);
      case 'languages': return withEntryOrder(<LanguagesForm languages={resume.languages} onChange={languages => updateResume({ languages })} />);
      case 'achievements': return <label className="block text-sm font-medium">Achievements<textarea className={`${field} mt-2 min-h-[220px]`} value={resume.achievements.join('\n')} onChange={e => updateResume({ achievements: e.target.value.split('\n') })} placeholder="One achievement per line. Include a specific outcome where you can." /></label>;
      case 'volunteer': case 'publications': return <div className="space-y-4"><p className="text-sm text-slate-500">Add one entry per line. Imported structured entries remain intact until you edit this field.</p><textarea aria-label={SECTION_LABELS[active]} className={`${field} min-h-[220px]`} value={resume[active].map(e => typeof e.description === 'string' && Object.keys(e).length === 1 ? e.description : Object.values(e).map(v => Array.isArray(v) ? v.join('; ') : String(v)).filter(Boolean).join(' · ')).join('\n')} onChange={e => updateResume({ [active]: e.target.value.split('\n').map(description => ({ description })) })} /></div>;
      case 'custom': return <CustomSectionForm sections={resume.custom_sections} onChange={custom_sections => updateResume({ custom_sections })} />;
    }
  };
  return <main className="studio-root bg-slate-50 text-slate-900 min-h-screen pt-16 print:pt-0">
    <style>{`@media print { @page { size: ${doc.design.pageSize}; margin: 10mm; } html, body, .studio-root, .studio-layout, .studio-preview-pane, .studio-preview-scroll { height:auto!important; overflow:visible!important; display:block!important; } .studio-preview-pane { position:static!important; } .print-content { position:static!important; width:100%!important; min-height:0!important; height:auto!important; } .print-inner { width:100%!important; min-height:0!important; transform:none!important; } .resume-entry { break-inside:avoid; } .resume-document h2 { break-after:avoid; } .resume-document { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }`}</style>
    <div className="no-print border-b bg-white px-4 sm:px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1800px] mx-auto">
        <div className="flex items-center gap-3 min-w-0 flex-1 basis-full sm:basis-0"><Link href="/tools" aria-label="Back to documents" className="p-2 rounded-xl hover:bg-slate-100"><ArrowLeft size={20} /></Link><div className="min-w-0"><input aria-label="Resume title" className="font-semibold text-lg max-w-full w-64 bg-transparent outline-none border-b border-transparent focus:border-blue-500" value={resume.title} onChange={e => updateResume({ title: e.target.value })} /><p className="text-xs text-slate-500 mt-1" role="status">{saveState === 'saved' ? `Saved in this browser${savedAt ? ` · ${new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}` : saveState === 'failed' ? 'Save failed — download a backup' : 'Saving in this browser…'}</p></div></div>
        <div className="flex items-center gap-2"><button title="Undo (Ctrl/Cmd+Z)" aria-label="Undo" className={button} onClick={undo} disabled={!past.current.length}><Undo2 size={16} /></button><button title="Redo (Ctrl/Cmd+Shift+Z)" aria-label="Redo" className={button} onClick={redo} disabled={!future.current.length}><Redo2 size={16} /></button><button className={`${button} hidden sm:inline-flex`} onClick={save}><Save size={16} /> Save</button><button className={primaryButton} disabled={Boolean(busy)} onClick={() => exportFile('pdf')}>{busy === 'export-pdf' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {SITE_MODE ? 'Print / Save PDF' : 'Download PDF'}</button></div>
      </div>
    </div>
    <div className="no-print flex flex-wrap gap-2 items-center px-4 sm:px-6 py-3 border-b bg-white">
      <input ref={fileInput} aria-label="Import resume" className="hidden" type="file" accept={SITE_MODE ? '.json' : '.pdf,.docx,.txt,.json'} onChange={e => importFile(e.target.files?.[0])} />
      <button className={button} disabled={Boolean(busy)} onClick={() => fileInput.current?.click()}>{busy === 'import' ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} {SITE_MODE ? 'Restore JSON backup' : 'Import resume'}</button>
      <button className={button} disabled={Boolean(busy)} onClick={duplicate}>Duplicate</button><button className={button} onClick={() => exportFile('json')}>JSON backup</button><button className={button} disabled={Boolean(busy)} onClick={() => exportFile('docx')}>DOCX</button><button className={button} disabled={Boolean(busy)} onClick={() => exportFile('txt')}>TXT</button><button className={button} onClick={() => window.print()}>Print / Save PDF</button>{!IS_LOCAL_STORAGE && <button className={button} disabled={Boolean(busy)} onClick={sync}>{SITE_MODE ? 'Open primary workspace' : 'Save session copy'}</button>}<button className={`${button} ml-auto`} aria-label="Editor help" onClick={() => setShowHelp(true)}><HelpCircle size={16} /></button>
    </div>
    {IS_LOCAL_STORAGE && <p className="no-print border-b bg-teal-50 px-4 py-3 text-sm text-teal-950 sm:px-6">Saved only in this browser on this device. Download JSON backups before clearing browser data. Imports and PDF / DOCX exports send your document for processing without saving a server copy.</p>}
    {(notice || error) && <div className={`no-print px-6 py-3 text-sm flex items-center justify-between gap-3 ${error ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`} role={error ? 'alert' : 'status'}><span>{error || notice}</span><button aria-label="Dismiss message" onClick={() => { setError(''); setNotice(''); }}><X size={16} /></button></div>}
    <div className="no-print lg:hidden flex p-3 gap-2 bg-white border-b"><button className={`${button} flex-1 ${!mobilePreview ? 'border-blue-500 text-blue-600' : ''}`} onClick={() => setMobilePreview(false)}><FileText size={16} /> Edit</button><button className={`${button} flex-1 ${mobilePreview ? 'border-blue-500 text-blue-600' : ''}`} onClick={() => setMobilePreview(true)}><Eye size={16} /> Preview</button></div>
    <div className="studio-layout flex min-h-[calc(100vh-160px)]">
      <aside className={`no-print w-full lg:w-[470px] xl:w-[530px] shrink-0 bg-white border-r ${mobilePreview ? 'hidden lg:block' : ''}`}>
        <div className="px-5 pt-5"><div className="flex justify-between items-center text-xs text-slate-500 mb-2"><span>Profile completeness</span><span>{completion}% · {complete.filter(Boolean).length}/5 essentials</span></div><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${completion}%` }} /></div><p className="text-xs text-slate-400 mt-2">A writing checklist, not an ATS score.</p></div>
        <div className="flex gap-1 p-4 border-b"><button className={`${button} flex-1 ${tab === 'content' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}`} onClick={() => setTab('content')}><FileText size={16} /> Content</button><button className={`${button} flex-1 ${tab === 'design' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}`} onClick={() => setTab('design')}><Settings2 size={16} /> Design & sections</button></div>
        {tab === 'content' ? <div className="p-5 space-y-5"><label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Editing section<select className={`${field} mt-2 font-normal normal-case tracking-normal`} value={active} onChange={e => setActive(e.target.value as typeof active)}><option value="personal">Personal details</option>{doc.design.sectionOrder.map(id => <option key={id} value={id}>{SECTION_LABELS[id]}{doc.design.hiddenSections.includes(id) ? ' (hidden in preview)' : ''}</option>)}</select></label><h2 className="font-semibold text-xl">{active === 'personal' ? 'Personal details' : SECTION_LABELS[active]}</h2>{form()}<div className="pt-4 border-t flex justify-between"><button className="text-sm text-slate-500 hover:text-blue-600" onClick={() => { setTab('design'); }}>Manage section order</button><button className="text-sm text-blue-600 font-medium" onClick={() => { const ids = ['personal', ...doc.design.sectionOrder] as typeof active[]; setActive(ids[(ids.indexOf(active) + 1) % ids.length]); }}>Next section →</button></div></div> : <div className="p-5 space-y-5"><button className={`${button} w-full`} onClick={() => setShowTemplates(true)}><Palette size={16} /> Choose template & color</button><div className="grid grid-cols-2 gap-4"><label className="text-sm font-medium">Font<select className={`${field} mt-2`} value={doc.design.font} onChange={e => updateDesign({ font: e.target.value as ResumeDesign['font'] })}><option value="sans">Sans serif</option><option value="serif">Serif</option><option value="mono">Monospace</option></select></label><label className="text-sm font-medium">Paper<select className={`${field} mt-2`} value={doc.design.pageSize} onChange={e => updateDesign({ pageSize: e.target.value as 'A4' | 'Letter' })}><option>A4</option><option>Letter</option></select></label></div><label className="block text-sm font-medium">Text size: {doc.design.fontSize}px<input className="w-full mt-2" aria-label="Text size" type="range" min="10" max="16" value={doc.design.fontSize} onChange={e => updateDesign({ fontSize: Number(e.target.value) })} /></label><label className="block text-sm font-medium">Line spacing: {doc.design.lineHeight}<input className="w-full mt-2" aria-label="Line spacing" type="range" min="1.2" max="2" step="0.1" value={doc.design.lineHeight} onChange={e => updateDesign({ lineHeight: Number(e.target.value) })} /></label><label className="block text-sm font-medium">Section spacing: {doc.design.spacing}px<input className="w-full mt-2" aria-label="Section spacing" type="range" min="12" max="40" step="2" value={doc.design.spacing} onChange={e => updateDesign({ spacing: Number(e.target.value) })} /></label><h3 className="font-semibold">Sections</h3><p className="text-xs text-slate-500">Reorder sections or hide them from preview and exports. Your content stays editable.</p><div className="space-y-2">{doc.design.sectionOrder.map((id, index) => <div className="flex items-center gap-2 p-3 rounded-xl border" key={id}><input type="checkbox" aria-label={`Show ${SECTION_LABELS[id]}`} checked={!doc.design.hiddenSections.includes(id)} onChange={() => updateDesign({ hiddenSections: doc.design.hiddenSections.includes(id) ? doc.design.hiddenSections.filter(s => s !== id) : [...doc.design.hiddenSections, id] })} /><span className="text-sm flex-1">{SECTION_LABELS[id]}</span>{[-1, 1].map(offset => <button className="p-1 rounded hover:bg-slate-100 disabled:opacity-25" key={offset} aria-label={`Move ${SECTION_LABELS[id]} ${offset < 0 ? 'up' : 'down'}`} disabled={index + offset < 0 || index + offset >= doc.design.sectionOrder.length} onClick={() => { const order = [...doc.design.sectionOrder]; [order[index], order[index + offset]] = [order[index + offset], order[index]]; lastEdit.current = 0; updateDesign({ sectionOrder: order }); }}>{offset < 0 ? <ArrowUp size={15} /> : <ArrowDown size={15} />}</button>)}</div>)}</div><button className="text-sm text-red-600 disabled:opacity-40" disabled={Boolean(busy)} onClick={deleteDocument}>Delete this resume from browser</button></div>}
      </aside>
      <section className={`studio-preview-pane flex-1 min-w-0 bg-slate-100 ${!mobilePreview ? 'hidden lg:block' : ''}`}>
        <div className="no-print flex flex-wrap gap-3 items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50"><button className={button} onClick={() => setShowTemplates(true)}><Palette size={16} /> {doc.template[0].toUpperCase() + doc.template.slice(1)} template</button><div className="flex items-center gap-2"><button aria-label="Zoom out" className={button} onClick={() => setZoom(v => Math.max(0.3, Number((v - 0.1).toFixed(2))))}>−</button><span className="text-xs w-10 text-center text-slate-500">{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" className={button} onClick={() => setZoom(v => Math.min(1.2, Number((v + 0.1).toFixed(2))))}>+</button></div></div><div ref={previewScroll} className="studio-preview-scroll overflow-auto p-6 sm:p-10 flex justify-start xl:justify-center"><StudioPreview resume={resume} template={doc.template} colorTheme={doc.colorTheme} design={doc.design} scale={zoom} /></div><p className="no-print px-6 pb-5 text-center text-xs text-slate-500">Live document · {doc.design.pageSize} · Print / Save PDF preserves this design and flows over multiple pages.</p>
      </section>
    </div>
    {showTemplates && <div className="no-print fixed inset-0 bg-slate-950/40 z-[70] flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Choose resume template"><div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto"><TemplateSelector selectedTemplate={doc.template} selectedColor={doc.colorTheme} onTemplateChange={template => update({ template })} onColorChange={colorTheme => update({ colorTheme })} onClose={() => setShowTemplates(false)} /></div></div>}
    {showHelp && <div className="no-print fixed inset-0 bg-slate-950/40 z-[70] flex items-center justify-center p-5" role="dialog" aria-modal="true" aria-label="Editor help"><div className="max-w-lg rounded-2xl bg-white p-7 space-y-4"><div className="flex justify-between"><h2 className="font-semibold text-xl">Your document workspace</h2><button aria-label="Close help" onClick={() => setShowHelp(false)}><X size={20} /></button></div><p className="text-sm text-slate-600">Changes save automatically in this browser. Browser storage can be cleared, so download JSON backups for long-term storage. Backups restore your content, template, and layout.</p><p className="text-sm text-slate-600">Import PDF, DOCX, or TXT files to populate editable sections. Check the result, especially dates and headings. Image-only PDFs may need text recognition before import.</p><p className="text-sm text-slate-600">Download PDF and DOCX create readable text documents. Print / Save PDF uses your selected design. Hidden sections are omitted from preview and downloads; JSON backups retain all content.</p><p className="text-sm text-slate-600">Ctrl/Cmd+S saves. Ctrl/Cmd+Z undoes. Ctrl/Cmd+Shift+Z redoes. Personalise one copy per application using Duplicate.</p><button className={button} onClick={() => setShowHelp(false)}>Done</button></div></div>}
  </main>;
}
