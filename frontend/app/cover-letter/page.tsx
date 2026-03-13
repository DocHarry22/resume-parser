'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CoverLetterBuilder } from '@/components/coverLetter/CoverLetterBuilder';
import { CoverLetter, defaultCoverLetter } from '@/types/coverLetter';
import { 
  getCoverLetters, 
  createCoverLetter, 
  updateCoverLetter,
  deleteCoverLetter,
  duplicateCoverLetter,
  exportCoverLetter,
  downloadBlob
} from '@/lib/coverLetterApi';

type ViewMode = 'list' | 'builder';

interface CoverLetterListItem {
  id: string;
  title: string;
  job_details: {
    job_title: string;
    company_name: string;
  };
  created_at?: string;
  updated_at?: string;
}

export default function CoverLetterPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [coverLetters, setCoverLetters] = useState<CoverLetterListItem[]>([]);
  const [editingCoverLetter, setEditingCoverLetter] = useState<CoverLetter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCoverLetters();
  }, []);

  const loadCoverLetters = async () => {
    try {
      setIsLoading(true);
      const data = await getCoverLetters();
      setCoverLetters(data.map(cl => ({
        id: cl.id,
        title: cl.title,
        job_details: cl.job_details,
        created_at: cl.created_at,
        updated_at: cl.updated_at,
      })));
    } catch (err) {
      console.error('Failed to load cover letters:', err);
      // Use empty array if API fails
      setCoverLetters([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCoverLetter({ ...defaultCoverLetter, id: '' });
    setViewMode('builder');
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/cover-letters/${id}`);
      if (response.ok) {
        const coverLetter = await response.json();
        setEditingCoverLetter(coverLetter);
        setViewMode('builder');
      }
    } catch (err) {
      console.error('Failed to load cover letter:', err);
    }
  };

  const handleSave = async (coverLetter: CoverLetter) => {
    try {
      if (coverLetter.id) {
        await updateCoverLetter(coverLetter.id, coverLetter);
      } else {
        await createCoverLetter(coverLetter);
      }
      await loadCoverLetters();
      setViewMode('list');
      setEditingCoverLetter(null);
    } catch (err) {
      console.error('Failed to save cover letter:', err);
      setError('Failed to save cover letter. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cover letter?')) return;
    
    try {
      await deleteCoverLetter(id);
      await loadCoverLetters();
    } catch (err) {
      console.error('Failed to delete cover letter:', err);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateCoverLetter(id);
      await loadCoverLetters();
    } catch (err) {
      console.error('Failed to duplicate cover letter:', err);
    }
  };

  const handleExport = async (id: string, format: 'pdf' | 'docx' | 'txt') => {
    try {
      const blob = await exportCoverLetter(id, format, 'professional');
      const coverLetter = coverLetters.find(cl => cl.id === id);
      const filename = `${coverLetter?.title || 'cover-letter'}.${format}`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (viewMode === 'builder') {
    return (
      <div>
        <button
          onClick={() => {
            setViewMode('list');
            setEditingCoverLetter(null);
          }}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to List
        </button>
        <CoverLetterBuilder
          initialData={editingCoverLetter || undefined}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-purple-600 hover:text-purple-700 text-sm mb-2 inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Cover Letters</h1>
              <p className="text-gray-600 mt-1">
                Create compelling cover letters with AI assistance
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Cover Letter
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your cover letters...</p>
            </div>
          </div>
        ) : coverLetters.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Cover Letters Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start creating professional cover letters tailored to each job application.
              Our AI will help you craft compelling content.
            </p>
            <button
              onClick={handleCreate}
              className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-lg inline-flex items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Cover Letter
            </button>

            {/* Features */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-left">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Suggestions</h3>
                <p className="text-gray-600 text-sm">
                  Get intelligent content suggestions based on the job description
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Professional Templates</h3>
                <p className="text-gray-600 text-sm">
                  Choose from 6 beautiful templates for different industries
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Export Anywhere</h3>
                <p className="text-gray-600 text-sm">
                  Download as PDF, DOCX, or plain text for any application
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverLetters.map((cl) => (
              <div
                key={cl.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Preview */}
                <div className="h-40 bg-gradient-to-br from-purple-500 to-indigo-600 p-4 relative">
                  <div className="bg-white rounded-md shadow p-3 transform scale-75 origin-top-left w-[133%]">
                    <div className="h-2 bg-gray-800 rounded w-1/2 mb-2"></div>
                    <div className="space-y-1">
                      <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-11/12"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-10/12"></div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {cl.title || 'Untitled Cover Letter'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 truncate">
                    {cl.job_details.job_title ? (
                      <>
                        {cl.job_details.job_title}
                        {cl.job_details.company_name && ` at ${cl.job_details.company_name}`}
                      </>
                    ) : (
                      'No job details'
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    Updated {formatDate(cl.updated_at || cl.created_at || '')}
                  </p>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(cl.id)}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(cl.id)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Duplicate"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <div className="relative group/export">
                    <button
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      title="Export"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-10">
                      <button
                        onClick={() => handleExport(cl.id, 'pdf')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span className="text-red-500">📄</span> PDF
                      </button>
                      <button
                        onClick={() => handleExport(cl.id, 'docx')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span className="text-blue-500">📝</span> DOCX
                      </button>
                      <button
                        onClick={() => handleExport(cl.id, 'txt')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span className="text-gray-500">📃</span> TXT
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(cl.id)}
                    className="p-2 border border-red-200 rounded-lg hover:bg-red-50"
                    title="Delete"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
