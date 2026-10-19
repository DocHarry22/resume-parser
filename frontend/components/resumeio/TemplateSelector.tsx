'use client';

import React from 'react';
import { RESUME_TEMPLATES } from './templateCatalog';
import { TemplateThumbnail } from './TemplateThumbnail';
import type { TemplateStyle, ColorTheme } from './templateCatalog';

export type { TemplateStyle, ColorTheme } from './templateCatalog';

interface TemplateSelectorProps {
  selectedTemplate: TemplateStyle;
  selectedColor: ColorTheme;
  onTemplateChange: (template: TemplateStyle) => void;
  onColorChange: (color: ColorTheme) => void;
  onClose: () => void;
}

const templates = RESUME_TEMPLATES;

const colors: { id: ColorTheme; name: string; primary: string; secondary: string }[] = [
  { id: 'blue', name: 'Blue', primary: '#2563eb', secondary: '#3b82f6' },
  { id: 'green', name: 'Green', primary: '#059669', secondary: '#10b981' },
  { id: 'purple', name: 'Purple', primary: '#7c3aed', secondary: '#8b5cf6' },
  { id: 'red', name: 'Red', primary: '#dc2626', secondary: '#ef4444' },
  { id: 'orange', name: 'Orange', primary: '#ea580c', secondary: '#f97316' },
  { id: 'teal', name: 'Teal', primary: '#0d9488', secondary: '#14b8a6' },
  { id: 'gray', name: 'Gray', primary: '#374151', secondary: '#4b5563' },
  { id: 'indigo', name: 'Indigo', primary: '#4f46e5', secondary: '#6366f1' },
];

export function TemplateSelector({
  selectedTemplate,
  selectedColor,
  onTemplateChange,
  onColorChange,
  onClose,
}: TemplateSelectorProps) {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customize Your Resume</h2>
          <p className="text-gray-500 mt-1">Choose a template and color theme</p>
        </div>
        <button
          aria-label="Close template selector"
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Color Theme Selection */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Color Theme</h3>
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              key={color.id}
              onClick={() => onColorChange(color.id)}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                selectedColor === color.id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg shadow-inner"
                style={{ background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})` }}
              />
              <span className="font-medium text-gray-700">{color.name}</span>
              {selectedColor === color.id && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Template Selection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Template Style</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              aria-pressed={selectedTemplate === tmpl.id}
              onClick={() => onTemplateChange(tmpl.id)}
              className={`group relative p-4 rounded-2xl border-2 transition-all text-left ${
                selectedTemplate === tmpl.id
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* The thumbnail uses the same document renderer as the editor. */}
              <div className="aspect-[3/4] rounded-lg bg-white border border-gray-200 mb-3 overflow-hidden shadow-sm">
                <TemplateThumbnail template={tmpl.id} color={selectedColor} />
              </div>
              
              <h4 className={`font-semibold ${selectedTemplate === tmpl.id ? 'text-blue-700' : 'text-gray-900'}`}>
                {tmpl.name}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">{tmpl.description}</p>
              <span className="mt-2 inline-block text-[10px] uppercase tracking-wide text-slate-400">{tmpl.format}</span>

              {selectedTemplate === tmpl.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Apply Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          Apply Changes
        </button>
      </div>
    </div>
  );
}
