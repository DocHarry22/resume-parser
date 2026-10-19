'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Download, MessageSquare, Pause, Play, RotateCcw } from 'lucide-react';
import { downloadText } from '@/lib/careerWorkspace';

const questions = [
  { category: 'Your introduction', title: 'Tell me about yourself.', tip: 'Start with your current focus, connect it to relevant experience, then explain what interests you about this opportunity.' },
  { category: 'Motivation', title: 'Why do you want this role?', tip: 'Connect a specific part of the role or company to your own experience and interests. Be honest about what you hope to contribute.' },
  { category: 'Problem solving', title: 'Tell me about a challenge you overcame.', tip: 'Choose one real example. Describe the situation, your responsibility, the action you took and what you learned from the result.' },
  { category: 'Working together', title: 'Describe a time you worked through a disagreement.', tip: 'Explain the different perspectives, how you listened and what you did to move the work forward. Focus on your contribution.' },
  { category: 'Growth', title: 'What would you like to improve?', tip: 'Name a real skill you are developing. Describe the steps you are taking and how you will know you have made progress.' },
  { category: 'Your questions', title: 'What would you like to ask us?', tip: 'Prepare questions about team priorities, the first few months and how success is measured. Use the conversation to decide whether the opportunity fits you too.' },
];
const key = 'careerforge.interview-practice.v1';
function readAnswers(): Record<string, string> {
  const saved = JSON.parse(localStorage.getItem(key) || '{}');
  if (!saved || Array.isArray(saved) || typeof saved !== 'object' || Object.entries(saved).some(([id, value]) => !/^\d$/.test(id) || Number(id) >= questions.length || typeof value !== 'string')) throw new Error('Unreadable practice notes');
  return saved;
}

export default function InterviewPrepPage() {
  const [selected, setSelected] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const pending = useRef<Record<string, string>>({});
  const unsaved = useRef<Record<string, string>>({});
  useEffect(() => {
    const load = () => {
      try { const saved = { ...readAnswers(), ...unsaved.current }; setAnswers(saved); pending.current = saved; setBlocked(false); setError(''); }
      catch { setBlocked(true); setError('Your saved practice could not be read. It has been kept unchanged. You can still practice and download your answers.'); }
    };
    const changed = (event: StorageEvent) => { if (event.key === key || event.key === null) load(); };
    load(); window.addEventListener('storage', changed);
    setReady(true);
    return () => window.removeEventListener('storage', changed);
  }, []);
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setSeconds(value => value + 1), 1000); return () => window.clearInterval(timer); }, [running]);
  const update = (value: string) => {
    const next = { ...pending.current, [selected]: value }; pending.current = next; setAnswers(next);
    unsaved.current = { ...unsaved.current, [selected]: value };
    if (blocked) return;
    let merged: Record<string, string>;
    try { merged = { ...readAnswers(), ...unsaved.current }; }
    catch { setBlocked(true); setError('Your saved practice could not be read. It has been kept unchanged. Download your current answers to keep this practice.'); return; }
    try { localStorage.setItem(key, JSON.stringify(merged)); pending.current = merged; unsaved.current = {}; setAnswers(merged); setStatus('Saved on this device'); setError(''); }
    catch { setStatus('Unsaved changes'); setError('Browser storage is unavailable or full. Download your answers to keep this practice.'); }
  };
  const current = questions[selected];
  const completed = questions.filter((_, index) => answers[index]?.trim()).length;
  return <main className="wk-page" data-workspace-ready={ready}><div className="wk-heading"><div><span className="wk-eyebrow">Find your words. Build your confidence.</span><h1>A little practice. A stronger conversation.</h1><p>Prepare real examples and rehearse at your own pace.</p></div><button className="wk-button wk-button-plain" disabled={!ready} onClick={() => downloadText(questions.map((question, index) => `${question.title}\n${answers[index] || '(Not answered yet)'}`).join('\n\n'), 'interview-practice.txt', 'text/plain;charset=utf-8')}><Download size={15} />Download answers</button></div>
    {error && <p role="alert" className="wk-alert">{error}</p>}
    <div className="wk-interview-layout"><section className="wk-panel wk-question-list" aria-label="Practice questions">{questions.map((question, index) => <button key={question.title} aria-pressed={selected === index} onClick={() => { setSelected(index); setRunning(false); setSeconds(0); setStatus(''); }}><small>{question.category}{answers[index]?.trim() && ' · Drafted'}</small>{index + 1}. {question.title}</button>)}</section><section className="wk-panel wk-interview-editor"><span className="wk-feature-tag"><MessageSquare size={13} />Question {selected + 1} of {questions.length}</span><h2>{current.title}</h2><p>{current.tip}</p><div className="wk-star-guide" aria-label="STAR answer structure">{[['Situation', 'Set the scene.'], ['Task', 'What was your role?'], ['Action', 'What did you do?'], ['Result', 'What changed or what did you learn?']].map(([title, detail]) => <div key={title}><b>{title}</b><p>{detail}</p></div>)}</div><label className="wk-small-label" htmlFor="practice-answer">Your practice notes</label><textarea id="practice-answer" className="wk-input" rows={8} maxLength={20000} disabled={!ready} value={answers[selected] || ''} placeholder="Choose a real example. Jot down the key points you want to remember…" onChange={event => update(event.target.value)} /><div className="wk-practice-footer"><span role="status">{status || `${completed} of ${questions.length} answers drafted`}</span><div className="wk-heading-actions"><button className="wk-button wk-button-plain" onClick={() => { setSeconds(0); setRunning(false); }} aria-label="Reset practice timer"><RotateCcw size={14} /></button><button className="wk-button wk-button-secondary" aria-pressed={running} onClick={() => setRunning(!running)}>{running ? <Pause size={14} /> : <Play size={14} />}{running ? 'Pause' : 'Rehearse'} {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</button><button className="wk-button wk-button-primary" onClick={() => { setSelected((selected + 1) % questions.length); setRunning(false); setSeconds(0); setStatus(''); }}>{selected === questions.length - 1 ? 'Start again' : 'Next question'}<ArrowRight size={14} /></button></div></div></section></div>
    <div className="wk-practice-tip"><BookOpen size={19} /><p>This is a personal practice notebook. Speak your answer aloud, keep your examples truthful and make room for a natural conversation. <Link className="wk-text-link" href="/resources/guides">Explore writing guidance<ArrowRight size={13} /></Link></p></div>
  </main>;
}
