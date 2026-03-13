'use client';

import React, { useState, useCallback } from 'react';
import { CoverLetter, CoverLetterContent, AIContentResponse } from '@/types/coverLetter';
import { generateContent } from '@/lib/coverLetterApi';

interface ContentEditorProps {
  coverLetter: CoverLetter;
  onChange: (content: CoverLetterContent) => void;
  onNext: () => void;
  onPrevious: () => void;
}

type ContentSection = 'opening' | 'body' | 'closing';

export function ContentEditor({ coverLetter, onChange, onNext, onPrevious }: ContentEditorProps) {
  const [activeSection, setActiveSection] = useState<ContentSection>('opening');
  const [aiSuggestions, setAiSuggestions] = useState<AIContentResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { content } = coverLetter;

  const handleChange = (field: keyof CoverLetterContent, value: string | string[]) => {
    onChange({ ...content, [field]: value });
  };

  const handleBodyChange = (index: number, value: string) => {
    const newBody = [...content.body_paragraphs];
    newBody[index] = value;
    handleChange('body_paragraphs', newBody);
  };

  const addBodyParagraph = () => {
    handleChange('body_paragraphs', [...content.body_paragraphs, '']);
  };

  const removeBodyParagraph = (index: number) => {
    if (content.body_paragraphs.length > 1) {
      const newBody = content.body_paragraphs.filter((_, i) => i !== index);
      handleChange('body_paragraphs', newBody);
    }
  };

  const generateAISuggestions = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await generateContent({
        job_title: coverLetter.job_details.job_title,
        company_name: coverLetter.job_details.company_name,
        job_description: coverLetter.job_details.job_description,
        skills: [], // Could be populated from resume
        experience_summary: '',
        tone: coverLetter.settings.tone,
        section: activeSection,
      });
      setAiSuggestions(response);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [coverLetter, activeSection]);

  const applySuggestion = (text: string) => {
    if (activeSection === 'opening') {
      handleChange('opening_paragraph', text);
    } else if (activeSection === 'body') {
      handleBodyChange(0, text);
    } else if (activeSection === 'closing') {
      handleChange('closing_paragraph', text);
    }
    setShowSuggestions(false);
  };

  const isValid = content.opening_paragraph.trim() && content.body_paragraphs.some(p => p.trim()) && content.closing_paragraph.trim();

  const renderSectionTabs = () => (
    <div className="flex border-b border-gray-200 mb-4">
      {(['opening', 'body', 'closing'] as ContentSection[]).map((section) => (
        <button
          key={section}
          onClick={() => setActiveSection(section)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === section
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {section === 'opening' && '✨ Opening'}
          {section === 'body' && '📝 Body'}
          {section === 'closing' && '🎯 Closing'}
        </button>
      ))}
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'opening':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Opening Paragraph</h3>
                <p className="text-sm text-gray-500">
                  Hook the reader and state your purpose
                </p>
              </div>
              <button
                onClick={generateAISuggestions}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin">⚙️</span> Generating...
                  </>
                ) : (
                  <>
                    ✨ AI Suggest
                  </>
                )}
              </button>
            </div>
            <textarea
              value={content.opening_paragraph}
              onChange={(e) => handleChange('opening_paragraph', e.target.value)}
              placeholder={`Start with a strong hook. Mention the position you're applying for and where you found it.

Example: "I am writing to express my strong interest in the ${coverLetter.job_details.job_title || 'position'} at ${coverLetter.job_details.company_name || 'your company'}. With my background in..."`}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
        );

      case 'body':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Body Paragraphs</h3>
                <p className="text-sm text-gray-500">
                  Highlight your skills and experience that match the job
                </p>
              </div>
              <button
                onClick={generateAISuggestions}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin">⚙️</span> Generating...
                  </>
                ) : (
                  <>
                    ✨ AI Suggest
                  </>
                )}
              </button>
            </div>
            
            {content.body_paragraphs.map((paragraph, index) => (
              <div key={index} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paragraph {index + 1}
                  {content.body_paragraphs.length > 1 && (
                    <button
                      onClick={() => removeBodyParagraph(index)}
                      className="ml-2 text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </label>
                <textarea
                  value={paragraph}
                  onChange={(e) => handleBodyChange(index, e.target.value)}
                  placeholder={index === 0 
                    ? "Describe your most relevant qualifications and how they align with the job requirements..."
                    : "Add another key achievement or relevant experience..."}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            ))}
            
            <button
              onClick={addBodyParagraph}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Another Paragraph
            </button>
          </div>
        );

      case 'closing':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Closing Paragraph</h3>
                <p className="text-sm text-gray-500">
                  End with a call to action and thank them
                </p>
              </div>
              <button
                onClick={generateAISuggestions}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin">⚙️</span> Generating...
                  </>
                ) : (
                  <>
                    ✨ AI Suggest
                  </>
                )}
              </button>
            </div>
            <textarea
              value={content.closing_paragraph}
              onChange={(e) => handleChange('closing_paragraph', e.target.value)}
              placeholder={`Wrap up your letter with enthusiasm. Express your interest in an interview and thank them for their consideration.

Example: "I am excited about the opportunity to bring my skills to ${coverLetter.job_details.company_name || 'your team'}. I would welcome the chance to discuss how I can contribute..."`}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sign-off
                </label>
                <select
                  value={content.signature}
                  onChange={(e) => handleChange('signature', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Sincerely">Sincerely</option>
                  <option value="Best regards">Best regards</option>
                  <option value="Kind regards">Kind regards</option>
                  <option value="Respectfully">Respectfully</option>
                  <option value="Thank you">Thank you</option>
                  <option value="Warm regards">Warm regards</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post-script (Optional)
                </label>
                <input
                  type="text"
                  value={content.ps_line}
                  onChange={(e) => handleChange('ps_line', e.target.value)}
                  placeholder="P.S. I'm also available for a call..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Write Your Letter</h2>
        <p className="text-gray-600">
          Craft compelling content with AI-powered suggestions based on the job description.
        </p>
      </div>

      {/* Salutation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Greeting
        </label>
        <input
          type="text"
          value={content.salutation}
          onChange={(e) => handleChange('salutation', e.target.value)}
          placeholder="Dear Hiring Manager,"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Section Tabs */}
      {renderSectionTabs()}

      {/* Active Section Content */}
      {renderActiveSection()}

      {/* AI Suggestions Modal */}
      {showSuggestions && aiSuggestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                ✨ AI Suggestions for {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </h3>
              <button
                onClick={() => setShowSuggestions(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {aiSuggestions.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors"
                  onClick={() => applySuggestion(suggestion)}
                >
                  <p className="text-gray-700">{suggestion}</p>
                  <button className="mt-2 text-sm text-purple-600 font-medium">
                    Use this →
                  </button>
                </div>
              ))}

              {aiSuggestions.tips && aiSuggestions.tips.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-amber-900 mb-2">💡 Writing Tips</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {aiSuggestions.tips.map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestions.keywords && aiSuggestions.keywords.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">🔑 Suggested Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Preview & Export
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ContentEditor;
