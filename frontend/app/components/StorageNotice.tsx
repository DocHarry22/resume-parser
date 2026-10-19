'use client';

import { usePathname } from 'next/navigation';

export default function StorageNotice() {
  const pathname = usePathname();
  // The homepage explains browser storage in its trust row, FAQ and footer.
  if (['/', '/builder', '/tools/builder'].includes(pathname.replace(/\/+$/, '') || '/')) return null;
  if (process.env.NEXT_PUBLIC_SITE_MODE === '1') return <aside className="no-print cf-storage-notice">Browser workspace edition: edit resumes, export backups and track applications here. For document processing when available, <a className="font-semibold underline" href="https://resume.docheng.co.za/">continue in the main DoCHEng app</a>.</aside>;
  if (process.env.NEXT_PUBLIC_STORAGE_MODE === 'local') return <aside className="no-print cf-storage-notice">Your resumes, letters and jobs save in this browser. Imports and checks use the document service when available. Download backups to keep a separate copy.</aside>;
  return null;
}
