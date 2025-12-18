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
  createResume,
  saveResume,
} from '@/lib/apiClient';
import { AutoFixPanel } from './AutoFixPanel';
import { ContactEditor, ExperienceEditor, SkillsEditor, SummaryEditor, EducationEditor } from './SectionEditors';
import ResumePreview from './ResumePreview';
import { RealTimeSuggestions } from './RealTimeSuggestions';

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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'fixes'>('edit');
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

  // Helper to ensure resume has an ID (creates on backend if needed)
  const ensureResumeId = async (): Promise<string | null> => {
    if (!resume) return null;
    
    if (resume.id) return resume.id;
    
    // Create resume on backend first
    try {
      const response = await createResume(resume.title || 'My Resume');
      if (response.success && response.resume) {
        // Merge local data with the created resume
        const mergedResume = {
          ...response.resume,
          ...resume,
          id: response.resume.id,
        };
        setResume(mergedResume);
        // Now update with our local data
        const updateResponse = await updateResume(response.resume.id!, mergedResume);
        if (updateResponse.success && updateResponse.resume) {
          setResume(updateResponse.resume);
          return updateResponse.resume.id!;
        }
        return response.resume.id!;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resume');
    }
    return null;
  };

  const handleAnalyze = async () => {
    if (!resume) {
      setError('Please create or import a resume first');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Ensure we have an ID
      const resumeId = await ensureResumeId();
      if (!resumeId) {
        setError('Failed to save resume before analysis');
        setIsAnalyzing(false);
        return;
      }

      const response = await analyzeResume(resumeId, scanMode, industry);
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
    if (!resume) return;

    setIsApplyingAll(true);
    setError(null);

    try {
      const resumeId = resume.id || await ensureResumeId();
      if (!resumeId) {
        setError('Failed to save resume');
        setIsApplyingAll(false);
        return;
      }

      const response = await applyAllAutoFixes(resumeId, scanMode, industry);
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
    if (!resume) return;

    setIsSaving(true);
    setError(null);

    try {
      let resumeId = resume.id;
      
      // If no ID, create on backend first
      if (!resumeId) {
        const createResponse = await createResume(resume.title || 'My Resume');
        if (createResponse.success && createResponse.resume) {
          resumeId = createResponse.resume.id;
        } else {
          throw new Error('Failed to create resume');
        }
      }

      // Update with current data
      const response = await updateResume(resumeId!, { ...resume, id: resumeId });
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
    if (!resume) return;

    try {
      // If resume has no ID, export locally
      if (!resume.id) {
        // Generate text locally for unsaved resumes
        const text = generateResumeText(resume);
        downloadTextFile(text, `${resume.title || 'resume'}.txt`);
        setSuccess('Resume exported successfully!');
        setTimeout(() => setSuccess(null), 3000);
        return;
      }

      const response = await exportResumeText(resume.id);
      if (response.success) {
        downloadTextFile(response.text, `${resume.title || 'resume'}.txt`);
        setSuccess('Resume exported successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export resume');
    }
  };

  // Helper function to download text as a file
  const downloadTextFile = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper function to generate resume text locally
  const generateResumeText = (r: ResumeBuilderType): string => {
    let text = '';
    
    // Contact
    if (r.contact) {
      text += `${r.contact.full_name || ''}\n`;
      if (r.contact.email) text += `Email: ${r.contact.email}\n`;
      if (r.contact.phone) text += `Phone: ${r.contact.phone}\n`;
      if (r.contact.location) text += `Location: ${r.contact.location}\n`;
      if (r.contact.linkedin) text += `LinkedIn: ${r.contact.linkedin}\n`;
      if (r.contact.github) text += `GitHub: ${r.contact.github}\n`;
      text += '\n';
    }
    
    // Summary
    if (r.summary?.summary) {
      text += `PROFESSIONAL SUMMARY\n${'─'.repeat(40)}\n${r.summary.summary}\n\n`;
    }
    
    // Experience
    if (r.experience && r.experience.length > 0) {
      text += `WORK EXPERIENCE\n${'─'.repeat(40)}\n`;
      r.experience.forEach(exp => {
        text += `${exp.position} at ${exp.company}\n`;
        text += `${exp.start_date} - ${exp.current ? 'Present' : exp.end_date || ''}\n`;
        exp.description.forEach(d => {
          if (d) text += `• ${d}\n`;
        });
        text += '\n';
      });
    }
    
    // Education
    if (r.education && r.education.length > 0) {
      text += `EDUCATION\n${'─'.repeat(40)}\n`;
      r.education.forEach(edu => {
        text += `${edu.degree}${edu.field_of_study ? ` in ${edu.field_of_study}` : ''}\n`;
        text += `${edu.institution}`;
        if (edu.end_date) text += ` (${edu.end_date})`;
        if (edu.gpa) text += ` - GPA: ${edu.gpa}`;
        text += '\n\n';
      });
    }
    
    // Skills
    if (r.skills && r.skills.length > 0) {
      text += `SKILLS\n${'─'.repeat(40)}\n`;
      r.skills.forEach(cat => {
        text += `${cat.category}: ${cat.skills.join(', ')}\n`;
      });
      text += '\n';
    }
    
    return text;
  };

  const handleContactChange = (contact: any) => {
    if (resume) {
      setResume({ ...resume, contact });
    }
  };

  const handleSummaryChange = (summary: any) => {
    if (resume) {
      setResume({ ...resume, summary });
    }
  };

  const handleExperienceChange = (experience: any) => {
    if (resume) {
      setResume({ ...resume, experience });
    }
  };

  const handleEducationChange = (education: any) => {
    if (resume) {
      setResume({ ...resume, education });
    }
  };

  const handleSkillsChange = (skills: any) => {
    if (resume) {
      setResume({ ...resume, skills });
    }
  };

  const handleCreateNew = () => {
    const newResume: ResumeBuilderType = {
      title: 'My Resume',
      contact: {
        full_name: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: '',
      },
      summary: {
        summary: '',
      },
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      achievements: [],
      languages: [],
      volunteer: [],
      publications: [],
      custom_sections: {},
    };
    setResume(newResume);
    setSuccess('New resume created! Start adding your information.');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleResetResume = () => {
    setResume(null);
    setFixes([]);
    setOverallScore(0);
    setActiveTab('edit');
  };

  const autoApplicableCount = fixes.filter(f => f.auto_applicable).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Resume Builder</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Build and optimize your resume with AI-powered suggestions
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {!resume && (
                <>
                  <button
                    onClick={handleCreateNew}
                    className="px-5 py-2.5 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New
                  </button>
                  <label className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105 text-white rounded-xl font-semibold cursor-pointer flex items-center gap-2 transition-all duration-200">
                    {isImporting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                </>
              )}

              {resume && (
                <>
                  <button
                    onClick={handleResetResume}
                    className="px-4 py-2.5 border-2 border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-600 rounded-xl font-medium flex items-center gap-2 hover:bg-red-50 transition-all duration-200"
                    title="Start a new resume"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New
                  </button>

                  <button
                    onClick={handleExport}
                    className="px-4 py-2.5 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-50 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </button>

                  <button
                    onClick={handleUpdateResume}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>

          {resume && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'edit'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Edit Forms
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'preview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab('fixes')}
                  className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeTab === 'fixes'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Suggestions
                  {fixes.length > 0 && (
                    <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
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
                  className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="basic">Basic Scan</option>
                  <option value="ats">ATS Scan</option>
                  <option value="expert">Expert Scan</option>
                </select>

                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:scale-105 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
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
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3 animate-fadeIn">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3 animate-fadeIn">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!resume ? (
          <div className="py-16">
            <div className="text-center mb-12">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 animate-pulse" />
                <div className="absolute inset-2 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Create Your Resume</h2>
              <p className="text-gray-500 max-w-lg mx-auto">Build a professional resume from scratch or import an existing one to optimize with AI-powered suggestions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Create New Option */}
              <button
                onClick={handleCreateNew}
                className="group bg-white border-2 border-gray-200 hover:border-blue-400 rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Start Fresh</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Create a new resume from scratch. Perfect for building your first resume or starting with a clean slate.</p>
                <div className="mt-5 flex items-center text-emerald-600 font-semibold text-sm group-hover:gap-2 transition-all">
                  <span>Create New Resume</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Import Option */}
              <label className="group bg-white border-2 border-gray-200 hover:border-blue-400 rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Import Existing</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Upload your existing resume (PDF or DOCX) and get AI-powered suggestions for improvement.</p>
                <div className="mt-5 flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                  <span>Upload Resume</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>

            {/* Features Section */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Analysis</h4>
                <p className="text-gray-500 text-sm">Get intelligent suggestions to improve your resume's impact and ATS compatibility.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">One-Click Fixes</h4>
                <p className="text-gray-500 text-sm">Apply automated improvements instantly with our smart auto-fix feature.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Export Anywhere</h4>
                <p className="text-gray-500 text-sm">Download your polished resume in multiple formats ready for applications.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'edit' && (
              <div className="space-y-8">
                <ContactEditor contact={resume.contact} onChange={handleContactChange} />
                <SummaryEditor summary={resume.summary} onChange={handleSummaryChange} />
                <ExperienceEditor experience={resume.experience} onChange={handleExperienceChange} />
                <EducationEditor education={resume.education} onChange={handleEducationChange} />
                <SkillsEditor skills={resume.skills} onChange={handleSkillsChange} />
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="py-4">
                <ResumePreview
                  resume={resume}
                  onUpdate={(updatedResume: ResumeBuilderType) => setResume(updatedResume)}
                  editable={true}
                />
              </div>
            )}

            {activeTab === 'fixes' && (
              <div className="space-y-6">
                {/* Real-Time Suggestions - Always visible and updates as you type */}
                <RealTimeSuggestions 
                  resume={resume} 
                  apiSuggestions={fixes}
                  overallScore={overallScore}
                  onFixApplied={handleAnalyze}
                />

                {/* Auto-Fix Panel for AI-detected fixes */}
                {autoApplicableCount > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">AI Quick Fix Available</h3>
                          <p className="text-sm text-gray-600">
                            {autoApplicableCount} {autoApplicableCount === 1 ? 'fix' : 'fixes'} from AI analysis can be applied automatically
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleApplyAllFixes}
                        disabled={isApplyingAll}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
                      >
                        {isApplyingAll ? 'Applying...' : `Apply All ${autoApplicableCount} Fixes`}
                      </button>
                    </div>
                  </div>
                )}

                {/* Show API fixes if available */}
                {fixes.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI-Powered Fixes
                    </h3>
                    <AutoFixPanel
                      fixes={fixes}
                      resumeId={resume.id!}
                      overallScore={overallScore}
                      onFixApplied={handleAnalyze}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
