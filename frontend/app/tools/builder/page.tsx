'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IS_LOCAL_STORAGE } from '@/lib/apiConfig';
import { ResumeIOBuilder } from '@/components/resumeio';

export default function LegacyBuilderPage() {
  const router = useRouter();
  useEffect(() => {
    if (IS_LOCAL_STORAGE) router.replace('/builder' + window.location.search + window.location.hash);
  }, [router]);
  if (!IS_LOCAL_STORAGE) return <ResumeIOBuilder />;
  return <main className="mx-auto min-h-screen max-w-3xl px-5 pt-28"><p role="status">Opening your resume studio…</p><Link href="/builder" className="mt-4 inline-block text-teal-800 underline">Open resume studio</Link></main>;
}
