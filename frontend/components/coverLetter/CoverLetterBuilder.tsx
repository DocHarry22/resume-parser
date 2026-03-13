'use client';

import React, { useState, useCallback } from 'react';
import {
  CoverLetter,
  CoverLetterTemplate,
  WizardStep,
  WIZARD_STEPS,
  defaultCoverLetter,
  CoverLetterTone,
  SenderInfo,
  RecipientInfo,
  CoverLetterContent,
} from '@/types/coverLetter';
import { TemplateSelector } from './TemplateSelector';
import { JobDetailsForm } from './forms/JobDetailsForm';
import { SenderInfoForm } from './forms/SenderInfoForm';
import { RecipientInfoForm } from './forms/RecipientInfoForm';
import { ContentEditor } from './forms/ContentEditor';
import { CoverLetterPreview } from './CoverLetterPreview';

interface CoverLetterBuilderProps {
  initialData?: CoverLetter;
  onSave?: (coverLetter: CoverLetter) => void;
}

const TEMPLATES: CoverLetterTemplate[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean and professional design perfect for corporate roles',
    preview_image: '/templates/professional.png',
    category: 'classic',
    is_premium: false,
    color_scheme: ['#1a1a2e', '#16213e', '#0f3460'],
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with a fresh, modern feel',
    preview_image: '/templates/modern.png',
    category: 'modern',
    is_premium: false,
    color_scheme: ['#667eea', '#764ba2', '#f093fb'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant minimalist design',
    preview_image: '/templates/minimal.png',
    category: 'minimal',
    is_premium: false,
    color_scheme: ['#2d3436', '#636e72', '#b2bec3'],
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design for creative industries',
    preview_image: '/templates/creative.png',
    category: 'creative',
    is_premium: false,
    color_scheme: ['#e17055', '#fdcb6e', '#00b894'],
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Sophisticated design for senior positions',
    preview_image: '/templates/executive.png',
    category: 'classic',
    is_premium: false,
    color_scheme: ['#2c3e50', '#34495e', '#7f8c8d'],
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Modern design tailored for tech industry',
    preview_image: '/templates/tech.png',
    category: 'modern',
    is_premium: false,
    color_scheme: ['#00d4ff', '#090979', '#020024'],
  },
];

export function CoverLetterBuilder({ initialData, onSave }: CoverLetterBuilderProps) {
  const [coverLetter, setCoverLetter] = useState<CoverLetter>(
    initialData || defaultCoverLetter
  );
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);

  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  const updateCoverLetter = useCallback((updates: Partial<CoverLetter>) => {
    setCoverLetter((prev) => ({ ...prev, ...updates }));
  }, []);

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex + 1].id);
    }
  };

  const goPrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex - 1].id);
    }
  };

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(coverLetter);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    updateCoverLetter({
      settings: { ...coverLetter.settings, template: templateId },
    });
  };

  const handleToneChange = (tone: CoverLetterTone) => {
    updateCoverLetter({
      settings: { ...coverLetter.settings, tone },
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return (
          <TemplateSelector
            templates={TEMPLATES}
            selectedTemplate={coverLetter.settings.template}
            selectedTone={coverLetter.settings.tone}
            onSelectTemplate={handleTemplateSelect}
            onSelectTone={handleToneChange}
            onNext={goNext}
          />
        );
      case 'job-details':
        return (
          <JobDetailsForm
            jobDetails={coverLetter.job_details}
            onChange={(job_details) => updateCoverLetter({ job_details })}
            onNext={goNext}
            onPrevious={goPrevious}
          />
        );
      case 'sender-info':
        return (
          <SenderInfoForm
            sender={coverLetter.sender}
            onChange={(sender: SenderInfo) => updateCoverLetter({ sender })}
            onNext={goNext}
            onPrevious={goPrevious}
          />
        );
      case 'recipient-info':
        return (
          <RecipientInfoForm
            recipient={coverLetter.recipient}
            onChange={(recipient: RecipientInfo) => updateCoverLetter({ recipient })}
            onNext={goNext}
            onPrevious={goPrevious}
          />
        );
      case 'content':
        return (
          <ContentEditor
            coverLetter={coverLetter}
            onChange={(content: CoverLetterContent) => updateCoverLetter({ content })}
            onNext={goNext}
            onPrevious={goPrevious}
          />
        );
      case 'preview':
        return (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Your Cover Letter is Ready!
            </h2>
            <p className="text-gray-600 mb-8">
              Review your cover letter in the preview panel and export when ready.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={goPrevious}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Back to Edit
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Cover Letter'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Cover Letter Builder
              </h1>
              <input
                type="text"
                value={coverLetter.title}
                onChange={(e) => updateCoverLetter({ title: e.target.value })}
                className="text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none px-2 py-1"
                placeholder="Cover Letter Title"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreviewPanel(!showPreviewPanel)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title={showPreviewPanel ? 'Hide Preview' : 'Show Preview'}
              >
                {showPreviewPanel ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                className={`flex-1 flex flex-col items-center relative ${
                  index <= currentStepIndex
                    ? 'text-purple-600'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 ${
                    index < currentStepIndex
                      ? 'bg-purple-600 text-white'
                      : index === currentStepIndex
                      ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < currentStepIndex ? '✓' : step.icon}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`absolute top-5 left-[60%] w-[80%] h-0.5 ${
                      index < currentStepIndex ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className={`flex gap-6 ${showPreviewPanel ? '' : 'justify-center'}`}>
          {/* Form Panel */}
          <div
            className={`${
              showPreviewPanel ? 'w-1/2' : 'w-full max-w-2xl'
            } bg-white rounded-xl shadow-sm border border-gray-200 p-6`}
          >
            {renderStepContent()}
          </div>

          {/* Preview Panel */}
          {showPreviewPanel && currentStep !== 'template' && (
            <div className="w-1/2 sticky top-32 self-start">
              <CoverLetterPreview
                coverLetter={coverLetter}
                template={coverLetter.settings.template}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoverLetterBuilder;
