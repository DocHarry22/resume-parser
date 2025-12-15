'use client';

import React, { useState, useEffect } from 'react';
import { ResumeBuilder as ResumeBuilderType, AutoFix } from '@/types/builder';
import { ScanMode } from '@/lib/types';
import {
  importResume,
  analyzeResume,
  updateResume,
  exportResumeText,
  applyAllAutoFixes,
} from '@/lib/apiClient';
import { AutoFixPanel } from './AutoFixPanel';
import { ContactEditor, ExperienceEditor, SkillsEditor } from './SectionEditors';

interface ResumeBuilderProps {
  initialResume?: ResumeBuilderType;
  onSave?: (resume: ResumeBuilderType) => void;
}

export default function ResumeBuilder({ initialResume, onSave }: ResumeBuilderProps) {
  const [resume, setResume] = useState<ResumeBuilderType | null>(initialResume || null);
  const [fixes, setFixes] = useState<AutoFix[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'fixes'>('edit');
  const [scanMode, setScanMode] = useState<ScanMode>('expert');
  const [industry, setIndustry] = useState<string>('default');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);

    try {
      const response = await importResume(file);
      if (response.success && response.resume) {
        setResume(response.resume);
        setSuccess('Resume imported successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import resume');
    } finally {
      setIsImporting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!resume?.id) {
      setError('Please import a resume first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await analyzeResume(resume.id, scanMode, industry);
      setFixes(response.fixes);
      setOverallScore(response.overall_score);
      setActiveTab('fixes');
      setSuccess(`Found ${response.fixes_count} suggestions for improvement`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAllFixes = async () => {
    if (!resume?.id) return;

    setIsApplyingAll(true);
    setError(null);

    try {
      const response = await applyAllAutoFixes(resume.id, scanMode, industry);
      if (response.success && response.resume) {
        setResume(response.resume);
        // Re-analyze to get updated fixes
        await handleAnalyze();
        setSuccess(response.message);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply fixes');
    } finally {
      setIsApplyingAll(false);
    }
  };

  const handleUpdateResume = async () => {
    if (!resume?.id) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await updateResume(resume.id, resume);
      if (response.success && response.resume) {
        setResume(response.resume);
        setSuccess('Resume saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
        if (onSave) {
          onSave(response.resume);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!resume?.id) return;

    try {
      const response = await exportResumeText(resume.id);
      if (response.success) {
        // Create a download link
        const blob = new Blob([response.text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${resume.title || 'resume'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccess('Resume exported successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export resume');
    }
  };

  const handleContactChange = (contact: any) => {
    if (resume) {
      setResume({ ...resume, contact });
    }
  };

  const handleExperienceChange = (experience: any) => {
    if (resume) {
      setResume({ ...resume, experience });
    }
  };

  const handleSkillsChange = (skills: any) => {
    if (resume) {
      setResume({ ...resume, skills });
    }
  };

  const autoApplicableCount = fixes.filter(f => f.auto_applicable).length;

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#cccccc]">
      {/* Header */}
      <div className="border-b border-[#2d2d30] bg-[#252526]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#cccccc]">Resume Builder</h1>
              <p className="text-sm text-[#858585] mt-1">
                Build and optimize your resume with AI-powered suggestions
              </p>
            </div>

            <div className="flex gap-3">
              {!resume && (
                <label className="px-4 py-2 bg-[#00d9ff] hover:bg-[#00c3e6] text-[#1e1e1e] rounded font-medium cursor-pointer flex items-center gap-2">
                  {isImporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Importing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Import Resume
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              )}

              {resume && (
                <>
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 border border-[#3e3e42] hover:border-[#4e4e52] text-[#cccccc] rounded font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </button>

                  <button
                    onClick={handleUpdateResume}
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#00d9ff] hover:bg-[#00c3e6] text-[#1e1e1e] rounded font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>

          {resume && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-4 py-2 rounded transition-colors ${
                    activeTab === 'edit'
                      ? 'bg-[#3e3e42] text-[#cccccc]'
                      : 'text-[#858585] hover:text-[#cccccc]'
                  }`}
                >
                  Edit Resume
                </button>
                <button
                  onClick={() => setActiveTab('fixes')}
                  className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                    activeTab === 'fixes'
                      ? 'bg-[#3e3e42] text-[#cccccc]'
                      : 'text-[#858585] hover:text-[#cccccc]'
                  }`}
                >
                  Suggestions
                  {fixes.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {fixes.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex-1" />

              <div className="flex gap-3 items-center">
                <select
                  value={scanMode}
                  onChange={(e) => setScanMode(e.target.value as ScanMode)}
                  className="px-3 py-1.5 bg-[#3e3e42] border border-[#4e4e52] rounded text-[#cccccc] text-sm"
                >
                  <option value="basic">Basic Scan</option>
                  <option value="ats">ATS Scan</option>
                  <option value="expert">Expert Scan</option>
                </select>

                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="px-3 py-1.5 bg-[#3e3e42] border border-[#4e4e52] rounded text-[#cccccc] text-sm"
                >
                  <option value="default">No Industry</option>
                  <option value="engineering">Engineering</option>
                  <option value="it-software">IT & Software</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                </select>

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-4 py-1.5 bg-[#00d9ff] hover:bg-[#00c3e6] text-[#1e1e1e] rounded font-medium text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Analyze
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {(error || success) && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded p-4 mb-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-900/20 border border-green-700/50 rounded p-4 mb-4">
              <p className="text-green-400">{success}</p>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!resume ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-[#858585] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-[#cccccc] mb-2">No Resume Yet</h2>
            <p className="text-[#858585] mb-6">Import an existing resume to get started</p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-[#00d9ff] hover:bg-[#00c3e6] text-[#1e1e1e] rounded-lg font-medium cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import Resume (PDF/DOCX)
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <>
            {activeTab === 'edit' && (
              <div className="space-y-8">
                <ContactEditor contact={resume.contact} onChange={handleContactChange} />
                <ExperienceEditor experience={resume.experience} onChange={handleExperienceChange} />
                <SkillsEditor skills={resume.skills} onChange={handleSkillsChange} />
              </div>
            )}

            {activeTab === 'fixes' && (
              <div className="space-y-6">
                {autoApplicableCount > 0 && (
                  <div className="bg-[#252526] border border-[#3e3e42] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-md font-semibold text-[#cccccc]">Quick Fix Available</h3>
                        <p className="text-sm text-[#858585]">
                          {autoApplicableCount} {autoApplicableCount === 1 ? 'fix' : 'fixes'} can be applied automatically
                        </p>
                      </div>
                      <button
                        onClick={handleApplyAllFixes}
                        disabled={isApplyingAll}
                        className="px-6 py-2 bg-[#00d9ff] hover:bg-[#00c3e6] text-[#1e1e1e] rounded font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        {isApplyingAll ? 'Applying...' : `Apply All ${autoApplicableCount} Fixes`}
                      </button>
                    </div>
                  </div>
                )}

                <AutoFixPanel
                  fixes={fixes}
                  resumeId={resume.id!}
                  overallScore={overallScore}
                  onFixApplied={handleAnalyze}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
