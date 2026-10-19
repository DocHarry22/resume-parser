'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, BriefcaseBusiness, CalendarDays, Check, ChevronRight, CircleCheck, FileText, FolderOpen, Mail, MessageSquare, Plus, ScanLine, Sparkles } from 'lucide-react';
import { localDate } from '@/lib/careerWorkspace';
import DocumentThumbnail from '@/components/workspace/DocumentThumbnail';
import { documentHref, formatUpdated, resumeProgress, useWorkspaceData } from '@/components/workspace/workspaceData';

const goals = ['Resume Building', 'Job Search', 'Interview Prep', 'Learning'];

export default function DashboardPage() {
  const { resumes, letters, jobs, ready, error, letterError } = useWorkspaceData();
  const [goal, setGoal] = useState(0);
  const latest = resumes[0];
  const progress = resumeProgress(latest);
  const firstName = latest?.resume.contact?.full_name?.trim().split(/\s+/)[0];
  const due = jobs.filter(job => job.followUpOn && job.followUpOn <= localDate() && !['Offer', 'Closed'].includes(job.stage));
  const interviews = jobs.filter(job => job.stage === 'Interview');
  const activities = [
    { icon: FileText, title: 'Resume building', value: `${progress.percent}%`, percent: progress.percent, href: documentHref(latest) },
    { icon: Mail, title: 'Cover letter crafting', value: `${letters.length} saved`, percent: letters.length ? 100 : 0, href: '/letters' },
    { icon: BriefcaseBusiness, title: 'Application tracking', value: `${jobs.length} jobs`, percent: jobs.length ? Math.min(100, jobs.filter(job => job.stage !== 'Saved').length / jobs.length * 100) : 0, href: '/job-tracker' },
    { icon: MessageSquare, title: 'Interview pipeline', value: `${interviews.length} in progress`, percent: interviews.length ? 100 : 0, href: '/interview-prep' },
  ];
  const features = [
    { tag: 'Your next edit', title: latest ? 'Make your resume even better.' : 'Your next chapter starts with a great resume.', text: latest ? 'A few thoughtful details can make your story clearer. Pick up right where you left off.' : 'Bring your experience, ideas and ambitions. We’ll help you put them on the page.', action: latest ? progress.next : 'Create your first resume', href: documentHref(latest), color: 'blue' },
    { tag: 'Stay on top of your search', title: 'Every opportunity. One clear overview.', text: 'Explore public job feeds, save the roles that interest you and prepare applications with your own final review.', action: 'Explore job search', href: '/jobs', color: 'mint' },
    { tag: 'Walk in with confidence', title: 'A little practice goes a long way.', text: 'Prepare your stories, structure your answers and make the most of your next conversation.', action: 'Start interview practice', href: '/interview-prep', color: 'lavender' },
    { tag: 'Learn something useful', title: 'Small steps. Stronger applications.', text: 'Practical writing guides to help you tell your story, tailor your resume and introduce yourself.', action: 'Explore career guides', href: '/resources/guides', color: 'peach' },
  ];
  const feature = features[goal];
  return <main className="wk-page wk-dashboard" data-workspace-ready={ready}>
    <section className="wk-greeting"><span className="wk-eyebrow">A little progress, every day</span><h1>{firstName ? `Hi ${firstName}!` : 'Welcome to your workspace.'}<span className="wk-greeting-spark" aria-hidden="true">✦</span></h1><p>What’s your goal today?</p></section>
    <div className="wk-goals" role="tablist" aria-label="Your career goal">{goals.map((item, index) => <button key={item} id={`goal-${index}`} role="tab" aria-selected={goal === index} aria-controls="goal-panel" tabIndex={goal === index ? 0 : -1} onClick={() => setGoal(index)} onKeyDown={event => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 3 : (goal + (event.key === 'ArrowRight' ? 1 : 3)) % 4; setGoal(next); document.getElementById(`goal-${next}`)?.focus(); } }}><span className="wk-goal-step">{index < goal ? <Check size={13} /> : index + 1}</span>{item}</button>)}</div>
    {error && <p className="wk-alert" role="alert">{error}</p>}
    <div className="wk-focus-grid"><section className="wk-panel wk-progress"><div className="wk-panel-heading"><h2>Your progress</h2><span className="wk-small-label">Keep going</span></div><div>{activities.map(({ icon: Icon, title, value, percent, href }, index) => <Link key={title} href={href} className={`wk-progress-item ${index === goal ? 'is-active' : ''}`}><span className="wk-tool-icon"><Icon size={23} strokeWidth={1.6} /></span><div><span><strong>{title}</strong><small>{ready ? value : '…'}</small></span><span className="wk-progress-track"><i style={{ width: `${percent}%` }} /></span></div></Link>)}</div><p className="wk-progress-note">Resume progress reflects 5 core sections.</p></section>
      <section id="goal-panel" role="tabpanel" aria-labelledby={`goal-${goal}`} className={`wk-feature wk-feature-${feature.color}`}><div className="wk-feature-copy"><span className="wk-feature-tag"><Sparkles size={13} />{feature.tag}</span><h2>{feature.title}</h2><p>{feature.text}</p><Link className="wk-feature-action" href={feature.href}>{feature.action}<ArrowRight size={18} /></Link>{goal === 0 && latest && <span className="wk-completion-caption"><CircleCheck size={14} />{progress.completed} of 5 sections complete</span>}</div><div className="wk-feature-art" aria-hidden="true">{goal === 0 && latest ? <><DocumentThumbnail document={latest} /><span className="wk-score"><b>{progress.percent}%</b><span>Section<br />completion</span></span></> : goal === 0 ? <div className="wk-paper-art"><span /><strong>Your story.<br />Your next step.</strong><i /><i /><i /><hr /><i /><i /><i /><span className="wk-paper-stamp"><FileText size={27} /></span></div> : <div className="wk-goal-art">{goal === 1 ? <BriefcaseBusiness size={65} strokeWidth={1} /> : goal === 2 ? <MessageSquare size={65} strokeWidth={1} /> : <BookOpen size={65} strokeWidth={1} />}<span>{goal === 1 ? `${jobs.length} opportunities` : goal === 2 ? 'You’ve got a story to tell.' : 'Room to grow.'}</span><div><i /><i /><i /></div></div>}</div></section></div>
    <section className="wk-metrics" aria-label="Workspace overview">{[
      { icon: FileText, label: 'Saved resumes', value: resumes.length, href: '/documents' },
      { icon: Mail, label: 'Cover letters', value: letterError ? '—' : letters.length, href: '/documents' },
      { icon: BriefcaseBusiness, label: 'Applications sent', value: jobs.filter(job => job.appliedOn || ['Applied', 'Interview', 'Offer'].includes(job.stage)).length, href: '/job-tracker' },
      { icon: CalendarDays, label: 'Follow-ups due', value: due.length, href: '/job-tracker' },
    ].map(({ icon: Icon, label, value, href }) => <Link key={label} href={href}><span className="wk-metric-icon"><Icon size={20} /></span><div><strong>{ready ? value : '…'}</strong><span>{label}</span></div><ChevronRight size={16} /></Link>)}</section>
    <div className="wk-lower-grid"><section className="wk-panel"><div className="wk-panel-heading"><div><h2>Your recent documents</h2><p>Ready when you are.</p></div><Link className="wk-text-link" href="/documents">View all<ArrowRight size={16} /></Link></div>{!ready ? <p className="wk-empty" role="status">Loading your workspace…</p> : resumes.length ? <div className="wk-recent-documents">{resumes.slice(0, 2).map(doc => <Link className="wk-recent-document" key={doc.id} href={documentHref(doc)}><div className="wk-recent-preview"><DocumentThumbnail document={doc} /></div><div><span className="wk-small-label">RESUME</span><h3>{doc.resume.title || 'Untitled resume'}</h3><p>Edited {formatUpdated(doc.updatedAt)}</p><span className="wk-text-link">Continue editing<ArrowRight size={14} /></span></div></Link>)}{resumes.length === 1 && <Link href="/builder?new=1" className="wk-create-document"><Plus size={24} /><span>Create another resume</span></Link>}</div> : <div className="wk-empty"><span className="wk-empty-icon"><FolderOpen size={29} /></span><h3>A home for your next chapter.</h3><p>Your resumes and cover letters will appear here.<br />Let’s start with a first draft.</p><Link href="/builder?new=1" className="wk-button wk-button-primary"><Plus size={16} />Create my resume</Link></div>}{letterError && <p className="wk-inline-warning" role="status">{letterError}</p>}</section>
      <section className="wk-panel wk-next"><div className="wk-panel-heading"><h2>Next on your list</h2><CalendarDays size={19} /></div>{due.length ? <ul>{due.slice(0, 3).map(job => <li key={job.id}><Link href="/job-tracker"><span className="wk-task-dot" /><div><strong>Follow up with {job.company}</strong><p>{job.role}</p><small>Due {job.followUpOn}</small></div><ChevronRight size={16} /></Link></li>)}</ul> : <div className="wk-next-empty"><CircleCheck size={31} strokeWidth={1.3} /><h3>You’re all caught up.</h3><p>Add a follow-up date to an application and we’ll keep your next step here.</p></div>}<Link href="/job-tracker" className="wk-text-link">Manage applications<ArrowRight size={16} /></Link></section></div>
    <Link className="wk-review-strip" href="/resume-scanner"><span className="wk-tool-icon"><ScanLine size={25} /></span><div><h2>A fresh pair of eyes for your resume.</h2><p>Check structure, readability and job keywords before you hit send.</p></div><span className="wk-button wk-button-secondary">Check my resume<ArrowRight size={16} /></span></Link>
  </main>;
}
