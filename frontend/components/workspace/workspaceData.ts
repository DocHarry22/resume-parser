'use client';

import { useEffect, useState } from 'react';
import { readDocuments, SavedResume } from '@/components/resumeio/resumeDocument';
import { getCoverLetters } from '@/lib/coverLetterApi';
import { readJobs, TrackedJob } from '@/lib/careerWorkspace';
import type { CoverLetter } from '@/types/coverLetter';

export function useWorkspaceData() {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [error, setError] = useState('');
  const [letterError, setLetterError] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => {
      const errors: string[] = [];
      try { setResumes(readDocuments().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))); }
      catch { errors.push('Saved resumes could not be read. Your existing browser data has been kept.'); }
      try { setJobs(readJobs()); }
      catch { errors.push('Saved applications could not be read. Your existing browser data has been kept.'); }
      setError(errors.join(' ')); setReady(true);
      getCoverLetters().then(value => { if (active) { setLetters(value); setLetterError(''); } })
        .catch(() => { if (active) setLetterError('Cover letters are unavailable. Open the letter builder to retry.'); });
    };
    const events = ['storage', 'career-jobs-change', 'resume-library-change', 'cover-letter-library-change'];
    load(); events.forEach(event => window.addEventListener(event, load));
    return () => { active = false; events.forEach(event => window.removeEventListener(event, load)); };
  }, []);
  return { resumes, letters, jobs, error, letterError, ready };
}

/** Section completion is a checklist, not an ATS or hiring score. */
export function resumeProgress(document?: SavedResume) {
  const resume = document?.resume;
  const checks = [
    { label: 'Add your contact details', done: !!(resume?.contact?.full_name?.trim() && resume?.contact?.email?.trim()) },
    { label: 'Write your professional summary', done: !!resume?.summary?.summary?.trim() },
    { label: 'Add employment history', done: !!resume?.experience?.some(item => item.company?.trim() && item.position?.trim()) },
    { label: 'Add your education', done: !!resume?.education?.some(item => item.institution?.trim() && item.degree?.trim()) },
    { label: 'Highlight your skills', done: !!resume?.skills?.some(item => item.skills?.some(skill => skill.trim())) },
  ];
  const completed = checks.filter(check => check.done).length;
  return { checks, completed, percent: completed * 20, next: checks.find(check => !check.done)?.label || 'Review your finished draft' };
}

export function documentHref(document?: SavedResume) {
  return document ? `/builder?id=${encodeURIComponent(document.id)}` : '/builder?new=1';
}

export function formatUpdated(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }) : 'Recently';
}
