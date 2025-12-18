'use client';

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ResumeBuilder as ResumeData, ContactInfo } from '@/types/builder';
import { TemplateSelector, TemplateStyle, ColorTheme } from './TemplateSelector';
import { LiveResumePreview } from './LiveResumePreview';
import { CollapsibleSection } from './CollapsibleSection';
import { ProgressHeader } from './ProgressHeader';
import { 
  PersonalDetailsForm, 
  SummaryForm, 
  ExperienceForm, 
  EducationForm, 
  SkillsForm, 
  ProjectsForm, 
  CertificationsForm,
  LanguagesForm 
} from './SectionForms';
import { 
  User, FileText, Briefcase, GraduationCap, Wrench, 
  FolderOpen, Award, Languages, Download, Palette 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type SectionId = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages';

interface SectionConfig {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  required: boolean;
}

const SECTIONS: SectionConfig[] = [
  { id: 'personal', label: 'Personal Details', icon: <User className="w-5 h-5" />, required: true },
  { id: 'summary', label: 'Professional Summary', icon: <FileText className="w-5 h-5" />, required: true },
  { id: 'experience', label: 'Work Experience', icon: <Briefcase className="w-5 h-5" />, required: true },
  { id: 'education', label: 'Education', icon: <GraduationCap className="w-5 h-5" />, required: true },
  { id: 'skills', label: 'Skills', icon: <Wrench className="w-5 h-5" />, required: true },
  { id: 'projects', label: 'Projects', icon: <FolderOpen className="w-5 h-5" />, required: false },
  { id: 'certifications', label: 'Certifications', icon: <Award className="w-5 h-5" />, required: false },
  { id: 'languages', label: 'Languages', icon: <Languages className="w-5 h-5" />, required: false },
];

const defaultResume: ResumeData = {
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
  summary: { summary: '' },
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

export function ResumeIOBuilder() {
  // Resume data state
  const [resume, setResume] = useState<ResumeData>(defaultResume);
  
  // UI state
  const [activeSection, setActiveSection] = useState<SectionId>('personal');
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(() => new Set<SectionId>(['personal']));
  const [template, setTemplate] = useState<TemplateStyle>('modern');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('blue');
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewScale, setPreviewScale] = useState(0.55);
  const [isExporting, setIsExporting] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Refs
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Auto-save timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate completion percentage for each section
  const calculateCompletion = useCallback((sectionId: SectionId): number => {
    switch (sectionId) {
      case 'personal': {
        const contact = resume.contact;
        if (!contact) return 0;
        const fields = [contact.full_name, contact.email, contact.phone, contact.location];
        const filled = fields.filter(f => f && f.trim().length > 0).length;
        return Math.round((filled / fields.length) * 100);
      }
      case 'summary': {
        const summary = resume.summary?.summary || '';
        if (!summary) return 0;
        const wordCount = summary.split(/\s+/).filter(Boolean).length;
        return Math.min(100, Math.round((wordCount / 40) * 100));
      }
      case 'experience':
        return resume.experience.length > 0 ? 100 : 0;
      case 'education':
        return resume.education.length > 0 ? 100 : 0;
      case 'skills':
        return resume.skills.length > 0 ? 100 : 0;
      case 'projects':
        return resume.projects.length > 0 ? 100 : 0;
      case 'certifications':
        return resume.certifications.length > 0 ? 100 : 0;
      default:
        return 0;
    }
  }, [resume]);

  // Overall completion
  const overallCompletion = Math.round(
    SECTIONS.filter(s => s.required).reduce((acc, s) => acc + calculateCompletion(s.id), 0) / 
    SECTIONS.filter(s => s.required).length
  );

  // Toggle section expansion
  const toggleSection = (sectionId: SectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
    setActiveSection(sectionId);
  };

  // Update resume data
  const updateResume = useCallback((updates: Partial<ResumeData>) => {
    setResume(prev => ({ ...prev, ...updates }));
    
    // Trigger auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      // Simulate save - replace with actual API call
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }, 1500);
  }, []);

  // Update contact info
  const updateContact = useCallback((updates: Partial<ContactInfo>) => {
    setResume(prev => ({
      ...prev,
      contact: { ...prev.contact!, ...updates },
    }));
  }, []);

  // Render section form based on ID
  const renderSectionForm = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'personal':
        return <PersonalDetailsForm contact={resume.contact!} onChange={(contact: ContactInfo) => updateResume({ contact })} />;
      case 'summary':
        return (
          <SummaryForm
            summary={resume.summary?.summary || ''}
            onChange={(summary: string) => updateResume({ summary: { summary } })}
          />
        );
      case 'experience':
        return (
          <ExperienceForm
            experience={resume.experience}
            onChange={(experience: typeof resume.experience) => updateResume({ experience })}
          />
        );
      case 'education':
        return (
          <EducationForm
            education={resume.education}
            onChange={(education: typeof resume.education) => updateResume({ education })}
          />
        );
      case 'skills':
        return (
          <SkillsForm
            skills={resume.skills}
            onChange={(skills: typeof resume.skills) => updateResume({ skills })}
          />
        );
      case 'projects':
        return (
          <ProjectsForm
            projects={resume.projects}
            onChange={(projects: typeof resume.projects) => updateResume({ projects })}
          />
        );
      case 'certifications':
        return (
          <CertificationsForm
            certifications={resume.certifications}
            onChange={(certifications: typeof resume.certifications) => updateResume({ certifications })}
          />
        );
      case 'languages':
        return (
          <LanguagesForm
            languages={resume.languages}
            onChange={(languages: typeof resume.languages) => updateResume({ languages })}
          />
        );
      default:
        return null;
    }
  };

  // Save resume to backend/localStorage
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Save to localStorage as backup
      localStorage.setItem('resume_draft', JSON.stringify({
        resume,
        template,
        colorTheme,
        savedAt: new Date().toISOString(),
      }));
      
      // TODO: Replace with actual API call when backend endpoint is ready
      // const response = await fetch('/api/resumes', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ resume, template, colorTheme }),
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save resume:', error);
    } finally {
      setIsSaving(false);
    }
  }, [resume, template, colorTheme]);

  // Export resume as PDF
  const handleExportPDF = useCallback(async () => {
    if (!previewRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      // Find the actual resume preview element inside the container
      const previewContainer = previewRef.current.querySelector('.bg-white.shadow-2xl');
      if (!previewContainer) {
        throw new Error('Preview element not found');
      }

      // A4 dimensions at 96 DPI
      const A4_WIDTH = 794;
      const A4_HEIGHT = 1123;
      
      // Create a temporary container at full scale for high-quality export
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = `${A4_WIDTH}px`;
      tempContainer.style.height = `${A4_HEIGHT}px`;
      document.body.appendChild(tempContainer);

      // Clone the preview at full scale
      const clone = previewContainer.cloneNode(true) as HTMLElement;
      clone.style.transform = 'none';
      clone.style.width = `${A4_WIDTH}px`;
      clone.style.height = `${A4_HEIGHT}px`;
      
      // Find the inner div and reset its transform
      const innerDiv = clone.querySelector('div');
      if (innerDiv) {
        innerDiv.style.transform = 'none';
        innerDiv.style.width = `${A4_WIDTH}px`;
        innerDiv.style.height = `${A4_HEIGHT}px`;
      }
      
      tempContainer.appendChild(clone);

      // Generate canvas from the clone
      const canvas = await html2canvas(clone, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: '#ffffff',
        width: A4_WIDTH,
        height: A4_HEIGHT,
      });

      // Clean up
      document.body.removeChild(tempContainer);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Generate filename
      const filename = `${resume.contact?.full_name?.replace(/\s+/g, '_') || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [resume.contact?.full_name, isExporting]);

  // Handle Print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle Export JSON
  const handleExportJSON = useCallback(() => {
    const data = {
      resume,
      template,
      colorTheme,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.contact?.full_name?.replace(/\s+/g, '_') || 'Resume'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [resume, template, colorTheme]);

  // Handle Duplicate
  const handleDuplicate = useCallback(() => {
    const duplicated = {
      ...resume,
      title: `${resume.title} (Copy)`,
      id: undefined,
    };
    // Save to localStorage
    localStorage.setItem('resume_duplicate', JSON.stringify(duplicated));
    alert('Resume duplicated! You can start editing the copy.');
    // In a real app, this would create a new resume and navigate to it
  }, [resume]);

  // Handle Delete
  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      localStorage.removeItem('resume_draft');
      setResume(defaultResume);
      alert('Resume deleted.');
    }
  }, []);

  // Handle Settings
  const handleSettings = useCallback(() => {
    setShowSettingsModal(true);
  }, []);

  // Handle Help
  const handleHelp = useCallback(() => {
    setShowHelpModal(true);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Resume Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume Title</label>
                <input
                  type="text"
                  value={resume.title}
                  onChange={(e) => setResume(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="My Resume"
                />
              </div>
              
              {/* Auto-save */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Auto-save</p>
                  <p className="text-xs text-gray-400">Automatically save changes every few seconds</p>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow"></div>
                </div>
              </div>

              {/* Default Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Template</label>
                <select 
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as TemplateStyle)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="minimal">Minimal</option>
                  <option value="professional">Professional</option>
                  <option value="creative">Creative</option>
                  <option value="elegant">Elegant</option>
                </select>
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                <div className="flex gap-2 flex-wrap">
                  {['blue', 'green', 'purple', 'red', 'orange', 'teal', 'gray', 'indigo'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setColorTheme(color as ColorTheme)}
                      className={`w-8 h-8 rounded-full border-2 ${colorTheme === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ 
                        backgroundColor: color === 'blue' ? '#2563eb' : 
                          color === 'green' ? '#059669' : 
                          color === 'purple' ? '#7c3aed' : 
                          color === 'red' ? '#dc2626' :
                          color === 'orange' ? '#ea580c' :
                          color === 'teal' ? '#0d9488' :
                          color === 'gray' ? '#374151' : '#4f46e5'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Clear Data */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (confirm('Clear all saved data? This will reset everything.')) {
                      localStorage.clear();
                      setResume(defaultResume);
                      setShowSettingsModal(false);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear all saved data
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Help & Support</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Quick Start */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🚀 Quick Start</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Fill in your personal details in the left panel</li>
                  <li>• Add your work experience, education, and skills</li>
                  <li>• Watch the preview update in real-time on the right</li>
                  <li>• Click "Change Template" to try different styles</li>
                  <li>• Export as PDF when you're done!</li>
                </ul>
              </div>

              {/* Keyboard Shortcuts */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">⌨️ Keyboard Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-gray-600">Save</span>
                    <span className="text-gray-400">Ctrl + S</span>
                  </div>
                  <div className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-gray-600">Print</span>
                    <span className="text-gray-400">Ctrl + P</span>
                  </div>
                  <div className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-gray-600">Zoom In</span>
                    <span className="text-gray-400">Ctrl + +</span>
                  </div>
                  <div className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-gray-600">Zoom Out</span>
                    <span className="text-gray-400">Ctrl + -</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">💡 Pro Tips</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Use action verbs to start bullet points (Led, Developed, Achieved)</li>
                  <li>• Include metrics and numbers to quantify achievements</li>
                  <li>• Keep your summary between 40-80 words for best impact</li>
                  <li>• Tailor your resume for each job application</li>
                </ul>
              </div>

              {/* Contact */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">📧 Need More Help?</h3>
                <p className="text-sm text-gray-600">
                  Contact us at <a href="mailto:support@example.com" className="text-blue-600 hover:underline">support@example.com</a>
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <ProgressHeader
        title={resume.title || 'My Resume'}
        progress={overallCompletion}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={handleSave}
        onExport={handleExportPDF}
        isExporting={isExporting}
        onPrint={handlePrint}
        onExportJSON={handleExportJSON}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onSettings={handleSettings}
        onHelp={handleHelp}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Form Editor */}
        <div className="w-[500px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-3">
            {SECTIONS.map((section) => (
              <CollapsibleSection
                key={section.id}
                title={section.label}
                icon={section.icon}
                isOpen={expandedSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
                isComplete={calculateCompletion(section.id) === 100}
                badge={section.required ? undefined : 'Optional'}
              >
                {renderSectionForm(section.id)}
              </CollapsibleSection>
            ))}
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="flex-1 bg-gray-100 overflow-hidden relative">
          {/* Template Panel Overlay */}
          {showTemplatePanel && (
            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm overflow-y-auto">
              <TemplateSelector
                selectedTemplate={template}
                selectedColor={colorTheme}
                onTemplateChange={setTemplate}
                onColorChange={setColorTheme}
                onClose={() => setShowTemplatePanel(false)}
              />
            </div>
          )}

          {/* Preview Header */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            {/* Template Button */}
            <button
              onClick={() => setShowTemplatePanel(!showTemplatePanel)}
              className="flex items-center gap-2 bg-white rounded-xl shadow-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Palette className="w-4 h-4" />
              Change Template
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg px-3 py-2">
              <button
                onClick={() => setPreviewScale(s => Math.max(0.3, s - 0.1))}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                {Math.round(previewScale * 100)}%
              </span>
              <button
                onClick={() => setPreviewScale(s => Math.min(1, s + 0.1))}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div ref={previewRef} className="h-full flex items-start justify-center pt-20 pb-8 px-8 overflow-auto">
            <LiveResumePreview
              resume={resume}
              template={template}
              colorTheme={colorTheme}
              scale={previewScale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
