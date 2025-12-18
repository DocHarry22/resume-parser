'use client';

import React from 'react';

export type TemplateStyle = 'classic' | 'modern' | 'minimal' | 'professional' | 'creative' | 'elegant';
export type ColorTheme = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'teal' | 'gray' | 'indigo';

interface TemplateSelectorProps {
  selectedTemplate: TemplateStyle;
  selectedColor: ColorTheme;
  onTemplateChange: (template: TemplateStyle) => void;
  onColorChange: (color: ColorTheme) => void;
  onClose: () => void;
}

const templates: { id: TemplateStyle; name: string; description: string }[] = [
  { id: 'modern', name: 'Modern', description: 'Clean sidebar layout with accent colors' },
  { id: 'classic', name: 'Classic', description: 'Traditional professional format' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and elegant design' },
  { id: 'professional', name: 'Professional', description: 'Corporate-ready template' },
  { id: 'creative', name: 'Creative', description: 'Stand out with unique styling' },
  { id: 'elegant', name: 'Elegant', description: 'Sophisticated and refined' },
];

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
        <div className="grid grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onTemplateChange(tmpl.id)}
              className={`group relative p-4 rounded-2xl border-2 transition-all text-left ${
                selectedTemplate === tmpl.id
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Template Preview Placeholder */}
              <div className="aspect-[3/4] rounded-lg bg-white border border-gray-200 mb-3 overflow-hidden shadow-sm">
                <TemplatePreviewMini template={tmpl.id} color={selectedColor} />
              </div>
              
              <h4 className={`font-semibold ${selectedTemplate === tmpl.id ? 'text-blue-700' : 'text-gray-900'}`}>
                {tmpl.name}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">{tmpl.description}</p>

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

// Mini template previews for selection
function TemplatePreviewMini({ template, color }: { template: TemplateStyle; color: ColorTheme }) {
  const colorValue = colors.find(c => c.id === color)?.primary || '#2563eb';

  const baseStyles = "w-full h-full p-2";

  switch (template) {
    case 'modern':
      return (
        <div className={`${baseStyles} flex`}>
          <div className="w-1/3 h-full rounded" style={{ backgroundColor: colorValue }} />
          <div className="flex-1 p-2 space-y-1">
            <div className="h-2 w-3/4 bg-gray-200 rounded" />
            <div className="h-1 w-1/2 bg-gray-100 rounded" />
            <div className="mt-2 space-y-1">
              <div className="h-1 w-full bg-gray-100 rounded" />
              <div className="h-1 w-full bg-gray-100 rounded" />
              <div className="h-1 w-3/4 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      );
    case 'classic':
      return (
        <div className={`${baseStyles} space-y-2`}>
          <div className="text-center pb-2 border-b-2" style={{ borderColor: colorValue }}>
            <div className="h-2 w-1/2 mx-auto bg-gray-300 rounded" />
            <div className="h-1 w-1/3 mx-auto bg-gray-200 rounded mt-1" />
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-1/4 rounded" style={{ backgroundColor: colorValue }} />
            <div className="h-1 w-full bg-gray-100 rounded" />
            <div className="h-1 w-full bg-gray-100 rounded" />
          </div>
        </div>
      );
    case 'minimal':
      return (
        <div className={`${baseStyles} space-y-3`}>
          <div>
            <div className="h-3 w-2/3 bg-gray-300 rounded" />
            <div className="h-1 w-1/3 bg-gray-200 rounded mt-1" />
          </div>
          <div className="space-y-1 pl-2 border-l-2" style={{ borderColor: colorValue }}>
            <div className="h-1 w-full bg-gray-100 rounded" />
            <div className="h-1 w-3/4 bg-gray-100 rounded" />
          </div>
        </div>
      );
    case 'professional':
      return (
        <div className={baseStyles}>
          <div className="h-8 rounded-t flex items-center px-2 gap-2" style={{ backgroundColor: colorValue }}>
            <div className="w-4 h-4 rounded bg-white/30" />
            <div className="h-1.5 w-1/2 bg-white/50 rounded" />
          </div>
          <div className="p-2 space-y-1">
            <div className="h-1 w-full bg-gray-100 rounded" />
            <div className="h-1 w-full bg-gray-100 rounded" />
          </div>
        </div>
      );
    case 'creative':
      return (
        <div className={`${baseStyles}`} style={{ background: `linear-gradient(135deg, ${colorValue}10, white)` }}>
          <div className="flex gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg shadow" style={{ backgroundColor: colorValue }} />
            <div className="flex-1">
              <div className="h-2 w-3/4 rounded" style={{ backgroundColor: colorValue }} />
              <div className="h-1 w-1/2 bg-gray-200 rounded mt-1" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-1 w-full bg-gray-100 rounded" />
            <div className="h-1 w-3/4 bg-gray-100 rounded" />
          </div>
        </div>
      );
    case 'elegant':
      return (
        <div className={baseStyles}>
          <div className="h-1 rounded-t" style={{ background: `linear-gradient(90deg, ${colorValue}, #6366f1)` }} />
          <div className="text-center py-2">
            <div className="h-2 w-2/3 mx-auto bg-gray-200 rounded" />
            <div className="h-1 w-1/3 mx-auto bg-gray-100 rounded mt-1" style={{ backgroundColor: colorValue + '40' }} />
          </div>
          <div className="space-y-1 mt-2">
            <div className="h-1 w-full bg-gray-100 rounded" />
            <div className="h-1 w-full bg-gray-100 rounded" />
          </div>
        </div>
      );
    default:
      return null;
  }
}
