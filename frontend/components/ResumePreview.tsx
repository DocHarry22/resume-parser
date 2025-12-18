'use client';

import React, { useState } from 'react';
import { ResumeBuilder } from '@/types/builder';
import { TemplateSelector, StyledResume, TemplateConfig, colorThemes } from './ResumeTemplates';

interface ResumePreviewProps {
  resume: ResumeBuilder;
  onUpdate: (resume: ResumeBuilder) => void;
  editable?: boolean;
}

export default function ResumePreview({ resume, onUpdate, editable = true }: ResumePreviewProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [config, setConfig] = useState<TemplateConfig>({
    style: 'classic',
    theme: colorThemes[0],
    showPhoto: false,
    photoUrl: null,
    fontSize: 'medium',
  });

  return (
    <div className="space-y-6">
      {/* Toggle Options Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 ${
            showOptions 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:shadow-md'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {showOptions ? 'Hide Options' : 'Customize Template'}
        </button>

        {/* Quick Theme Picker */}
        {!showOptions && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Theme:</span>
            <div className="flex gap-1">
              {colorThemes.slice(0, 5).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setConfig({ ...config, theme })}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    config.theme.id === theme.id ? 'border-blue-500 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: theme.headerBg }}
                  title={theme.name}
                />
              ))}
              <button
                onClick={() => setShowOptions(true)}
                className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300"
                title="More options"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Template Options Panel */}
      {showOptions && (
        <div className="animate-fadeIn">
          <TemplateSelector config={config} onConfigChange={setConfig} />
        </div>
      )}

      {/* Resume Preview */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <StyledResume
          resume={resume}
          config={config}
          onUpdate={onUpdate}
          editable={editable}
        />
        
        {/* Edit mode indicator */}
        {editable && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 px-6 py-3 text-center">
            <p className="text-sm text-blue-600">
              <span className="font-medium">✨ Inline Editing Mode</span> – Click on any text to edit it directly
            </p>
          </div>
        )}
      </div>

      {/* Template Style Quick Selector */}
      <div className="flex justify-center gap-4">
        {(['classic', 'modern', 'minimal', 'professional', 'creative'] as const).map((style) => (
          <button
            key={style}
            onClick={() => setConfig({ ...config, style })}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all capitalize ${
              config.style === style
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  );
}
