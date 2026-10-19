'use client';

import React, { useState, useRef } from 'react';
import { CoverLetter } from '@/types/coverLetter';
import { downloadBlob } from '@/lib/coverLetterApi';
import { exportLetterDocx } from '@/lib/coverLetterExport';
import { IS_LOCAL_STORAGE } from '@/lib/apiConfig';
import { Letterhead, LETTER_DESIGNS } from './Letterhead';

interface CoverLetterPreviewProps {
  coverLetter: CoverLetter;
  template: string;
}

export function CoverLetterPreview({ coverLetter, template }: CoverLetterPreviewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [exportError, setExportError] = useState('');
  const letterRef = useRef<HTMLDivElement>(null);

  const styles = LETTER_DESIGNS[template] || LETTER_DESIGNS.professional;
  const { sender, recipient, content, job_details } = coverLetter;

  // Set date on client side to avoid hydration mismatch
  React.useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
  }, []);

  const formatDate = () => {
    return currentDate;
  };

  const getSalutation = () => {
    if (content.salutation) return content.salutation;
    if (recipient.name) return `Dear ${recipient.name},`;
    return 'Dear Hiring Manager,';
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    setIsExporting(true);
    setShowExportMenu(false);
    setExportError('');
    
    try {
      // Always export current editor content, including unsaved changes.
      if (format === 'pdf') {
        await exportToPDF();
      } else if (format === 'txt') {
        const textContent = generateTextContent();
        const blob = new Blob([textContent], { type: 'text/plain' });
        downloadBlob(blob, `${coverLetter.title || 'cover-letter'}.txt`);
      } else if (format === 'docx') {
        const blob = IS_LOCAL_STORAGE ? await (await import('@/lib/coverLetterApi')).exportCoverLetterData(coverLetter, 'docx') : await exportLetterDocx(coverLetter, generateTextContent());
        downloadBlob(blob, `${coverLetter.title || 'cover-letter'}.docx`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setExportError('Export failed. Your letter is still here. Try again or download TXT to keep a local copy.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    // Export current editor content as selectable text through the document service.
    const { exportCoverLetterData } = await import('@/lib/coverLetterApi');
    downloadBlob(await exportCoverLetterData(coverLetter, 'pdf'), `${coverLetter.title || 'cover-letter'}.pdf`);
  };

  const generateTextContent = () => {
    const lines: string[] = [];
    
    // Sender info
    lines.push(sender.full_name);
    if (sender.address) lines.push(sender.address);
    if (sender.city || sender.state) {
      lines.push(`${sender.city}${sender.city && sender.state ? ', ' : ''}${sender.state} ${sender.zip_code || ''}`);
    }
    lines.push(sender.email);
    if (sender.phone) lines.push(sender.phone);
    lines.push('');
    
    // Date
    if (coverLetter.settings.include_date) lines.push(formatDate());
    lines.push('');
    
    // Recipient
    if (recipient.name) lines.push(recipient.name);
    if (recipient.title) lines.push(recipient.title);
    if (recipient.company) lines.push(recipient.company);
    if (recipient.address) lines.push(recipient.address);
    if (recipient.city || recipient.state) lines.push([recipient.city, recipient.state, recipient.zip_code].filter(Boolean).join(', '));
    if (recipient.country) lines.push(recipient.country);
    lines.push('');
    if (job_details.job_title) lines.push(`Re: ${job_details.job_title}${job_details.reference_number ? ` (Ref: ${job_details.reference_number})` : ''}`, '');
    
    // Content
    lines.push(getSalutation());
    lines.push('');
    lines.push(content.opening_paragraph);
    lines.push('');
    content.body_paragraphs.forEach(para => {
      if (para.trim()) {
        lines.push(para);
        lines.push('');
      }
    });
    lines.push(content.closing_paragraph);
    lines.push('');
    lines.push(content.signature || 'Sincerely,');
    lines.push(sender.full_name);
    
    if (content.ps_line) {
      lines.push('');
      lines.push(`P.S. ${content.ps_line}`);
    }
    
    return lines.join('\n');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {exportError && <p role="alert" className="border-b border-red-200 bg-red-50 p-3 text-sm text-red-800">{exportError}</p>}
      {/* Preview Header */}
      <div className="bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
        <h3 className="font-medium text-gray-700">Live Preview</h3>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <span className="animate-spin">⚙️</span> Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </>
            )}
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="text-red-500">📄</span> Download PDF
              </button>
              <button
                onClick={() => handleExport('docx')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="text-blue-500">📝</span> Download DOCX
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="text-gray-500">📃</span> Download TXT
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Letter Preview */}
      <div className="p-4 bg-gray-50 max-h-[calc(100vh-250px)] overflow-y-auto">
        <div ref={letterRef} data-live-letter-preview={template} data-letter-template={template} className={`letter-document bg-white shadow-lg mx-auto max-w-[8.5in] min-h-[11in] p-8 ${styles.fontFamily}`}>
          <Letterhead sender={sender} template={template} />

          {/* Date */}
          {coverLetter.settings.include_date && <div className="text-sm text-gray-600 mb-4">{formatDate()}</div>}

          {/* Recipient Info */}
          <div className="text-sm text-gray-700 mb-6">
            {recipient.name && <div className="font-medium">{recipient.name}</div>}
            {recipient.title && <div>{recipient.title}</div>}
            {recipient.company && <div>{recipient.company}</div>}
            {recipient.address && (
              <div>
                {recipient.address}
                {recipient.city && `, ${recipient.city}`}
                {recipient.state && `, ${recipient.state}`}
                {recipient.zip_code && ` ${recipient.zip_code}`}
              </div>
            )}
          </div>

          {/* Subject Line */}
          {job_details.job_title && (
            <div className="font-medium text-gray-800 mb-4">
              Re: {job_details.job_title}
              {job_details.reference_number && ` (Ref: ${job_details.reference_number})`}
            </div>
          )}

          {/* Salutation */}
          <div className="mb-4">{getSalutation()}</div>

          {/* Body */}
          <div className="space-y-4 text-gray-700 leading-relaxed text-sm">
            {/* Opening */}
            <p>
              {content.opening_paragraph || (
                <span className="text-gray-400 italic">Your opening paragraph will appear here...</span>
              )}
            </p>

            {/* Body Paragraphs */}
            {content.body_paragraphs.map((paragraph, index) => (
              paragraph.trim() && <p key={index}>{paragraph}</p>
            ))}
            {!content.body_paragraphs.some(p => p.trim()) && (
              <p className="text-gray-400 italic">Your main content will appear here...</p>
            )}

            {/* Closing */}
            <p>
              {content.closing_paragraph || (
                <span className="text-gray-400 italic">Your closing paragraph will appear here...</span>
              )}
            </p>
          </div>

          {/* Signature */}
          <div className="mt-8">
            <div className="mb-4">{content.signature || 'Sincerely'},</div>
            <div className="font-medium" style={{ color: styles.accentColor }}>
              {sender.full_name || 'Your Name'}
            </div>
          </div>

          {/* PS Line */}
          {content.ps_line && (
            <div className="mt-6 text-sm text-gray-600 italic">
              P.S. {content.ps_line}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoverLetterPreview;
