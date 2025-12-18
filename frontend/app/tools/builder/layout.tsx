/**
 * Builder Page Layout
 * Provides the layout wrapper for the document builder
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Document Builder - Resume, CV & Cover Letter',
  description: 'Create professional resumes, CVs, and cover letters with our drag-and-drop builder',
};

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
