'use client';

import React from 'react';

export type SectionId = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages';

interface Section {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  description: string;
  required?: boolean;
}

export const sections: Section[] = [
  {
    id: 'personal',
    label: 'Personal Details',
    description: 'Your contact information',
    required: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'summary',
    label: 'Professional Summary',
    description: 'Brief overview of your profile',
    required: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  {
    id: 'experience',
    label: 'Work Experience',
    description: 'Your employment history',
    required: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Your academic background',
    required: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  },
  {
    id: 'skills',
    label: 'Skills',
    description: 'Your technical & soft skills',
    required: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Showcase your work',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    id: 'certifications',
    label: 'Certifications',
    description: 'Professional certificates',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    id: 'languages',
    label: 'Languages',
    description: 'Languages you speak',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
  },
];

interface SidebarNavProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  completionStatus: Record<SectionId, number>;
  enabledSections: SectionId[];
  onToggleSection: (section: SectionId) => void;
}

export function SidebarNav({
  activeSection,
  onSectionChange,
  completionStatus,
  enabledSections,
  onToggleSection,
}: SidebarNavProps) {
  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500 bg-green-100';
    if (percentage >= 50) return 'text-amber-500 bg-amber-100';
    if (percentage > 0) return 'text-orange-500 bg-orange-100';
    return 'text-gray-400 bg-gray-100';
  };

  return (
    <nav className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Resume Builder</h1>
            <p className="text-xs text-gray-500">Build your perfect resume</p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-blue-600">
            {Math.round(
              Object.values(completionStatus).reduce((a, b) => a + b, 0) /
                Math.max(enabledSections.length, 1)
            )}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
            style={{
              width: `${Math.round(
                Object.values(completionStatus).reduce((a, b) => a + b, 0) /
                  Math.max(enabledSections.length, 1)
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Section List */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
            Sections
          </div>
          {sections.map((section) => {
            const isEnabled = enabledSections.includes(section.id);
            const isActive = activeSection === section.id;
            const completion = completionStatus[section.id] || 0;

            return (
              <div
                key={section.id}
                className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl mb-1 cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : isEnabled
                    ? 'hover:bg-gray-50 border-2 border-transparent'
                    : 'opacity-50 border-2 border-transparent'
                }`}
                onClick={() => isEnabled && onSectionChange(section.id)}
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : isEnabled
                      ? 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {section.icon}
                </div>

                {/* Label & Description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium text-sm ${
                        isActive ? 'text-blue-700' : isEnabled ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {section.label}
                    </span>
                    {section.required && (
                      <span className="text-[10px] font-semibold text-red-500">*</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{section.description}</p>
                </div>

                {/* Completion Badge */}
                {isEnabled && completion > 0 && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getCompletionColor(
                      completion
                    )}`}
                  >
                    {completion >= 100 ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      `${completion}%`
                    )}
                  </div>
                )}

                {/* Toggle Button (for optional sections) */}
                {!section.required && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSection(section.id);
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                      isEnabled
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-green-500 hover:bg-green-50'
                    }`}
                    title={isEnabled ? 'Remove section' : 'Add section'}
                  >
                    {isEnabled ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add More Sections */}
        <div className="px-3 mt-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
            Add Sections
          </div>
          {sections
            .filter((s) => !s.required && !enabledSections.includes(s.id))
            .map((section) => (
              <button
                key={section.id}
                onClick={() => onToggleSection(section.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-green-50 border-2 border-dashed border-gray-200 hover:border-green-300 transition-all mb-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500 group-hover:text-green-700">{section.label}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Footer Tips */}
      <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700">Pro Tip</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Complete all required sections for a professional resume.
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
}
