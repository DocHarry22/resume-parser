'use client';

import React from 'react';
import { LetterTemplateThumbnail } from './Letterhead';
import { CoverLetterTemplate, CoverLetterTone } from '@/types/coverLetter';

interface TemplateSelectorProps {
  templates: CoverLetterTemplate[];
  selectedTemplate: string;
  selectedTone: CoverLetterTone;
  onSelectTemplate: (templateId: string) => void;
  onSelectTone: (tone: CoverLetterTone) => void;
  onNext: () => void;
}

const TONES: { value: CoverLetterTone; label: string; description: string; icon: string }[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Formal and polished language',
    icon: '💼',
  },
  {
    value: 'enthusiastic',
    label: 'Enthusiastic',
    description: 'Energetic and passionate tone',
    icon: '🌟',
  },
  {
    value: 'confident',
    label: 'Confident',
    description: 'Assertive and self-assured',
    icon: '💪',
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm and approachable style',
    icon: '😊',
  },
  {
    value: 'formal',
    label: 'Formal',
    description: 'Traditional and conservative',
    icon: '📜',
  },
];

export function TemplateSelector({
  templates,
  selectedTemplate,
  selectedTone,
  onSelectTemplate,
  onSelectTone,
  onNext,
}: TemplateSelectorProps) {
  return (
    <div className="space-y-8">
      {/* Template Selection */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Template</h2>
        <p className="text-gray-600 mb-6">
          Select a design that matches your industry and personal style.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              aria-pressed={selectedTemplate === template.id}
              onClick={() => onSelectTemplate(template.id)}
              className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                selectedTemplate === template.id
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <LetterTemplateThumbnail template={template.id} />

              {/* Template Info */}
              <div className="p-3 bg-white border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {template.description}
                    </p>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Premium Badge */}
              {template.is_premium && (
                <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">
                  PRO
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tone Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Writing Tone</h3>
        <p className="text-gray-600 text-sm mb-4">
          Choose the voice for your guided writing ideas.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TONES.map((tone) => (
            <button
              key={tone.value}
              aria-pressed={selectedTone === tone.value}
              onClick={() => onSelectTone(tone.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                selectedTone === tone.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">{tone.icon}</div>
              <div className="font-medium text-sm text-gray-900">{tone.label}</div>
              <div className="text-xs text-gray-500 hidden sm:block">{tone.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={onNext}
          disabled={!selectedTemplate}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TemplateSelector;
