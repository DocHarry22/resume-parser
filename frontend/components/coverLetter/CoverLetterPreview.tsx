'use client';

import React, { useState, useRef } from 'react';
import { CoverLetter } from '@/types/coverLetter';
import { exportCoverLetter, downloadBlob } from '@/lib/coverLetterApi';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface CoverLetterPreviewProps {
  coverLetter: CoverLetter;
  template: string;
}

const TEMPLATE_STYLES: Record<string, { 
  headerBg: string; 
  headerText: string;
  accentColor: string;
  fontFamily: string;
}> = {
  professional: {
    headerBg: 'bg-[#1a1a2e]',
    headerText: 'text-white',
    accentColor: '#1a1a2e',
    fontFamily: 'font-serif',
  },
  modern: {
    headerBg: 'bg-gradient-to-r from-[#667eea] to-[#764ba2]',
    headerText: 'text-white',
    accentColor: '#667eea',
    fontFamily: 'font-sans',
  },
  minimal: {
    headerBg: 'bg-gray-100',
    headerText: 'text-gray-800',
    accentColor: '#2d3436',
    fontFamily: 'font-sans',
  },
  creative: {
    headerBg: 'bg-gradient-to-r from-[#e17055] to-[#fdcb6e]',
    headerText: 'text-white',
    accentColor: '#e17055',
    fontFamily: 'font-sans',
  },
  executive: {
    headerBg: 'bg-[#2c3e50]',
    headerText: 'text-white',
    accentColor: '#2c3e50',
    fontFamily: 'font-serif',
  },
  tech: {
    headerBg: 'bg-gradient-to-r from-[#090979] to-[#00d4ff]',
    headerText: 'text-white',
    accentColor: '#00d4ff',
    fontFamily: 'font-mono',
  },
};

export function CoverLetterPreview({ coverLetter, template }: CoverLetterPreviewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const letterRef = useRef<HTMLDivElement>(null);

  const styles = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.professional;
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
    
    try {
      // Try server-side export if cover letter has been saved
      if (coverLetter.id && !coverLetter.id.startsWith('temp-')) {
        try {
          const blob = await exportCoverLetter(coverLetter.id, format, template);
          downloadBlob(blob, `${coverLetter.title || 'cover-letter'}.${format}`);
          return;
        } catch {
          console.log('Server export failed, falling back to client-side');
        }
      }
      
      // Client-side export
      if (format === 'pdf') {
        await exportToPDF();
      } else if (format === 'txt') {
        const textContent = generateTextContent();
        const blob = new Blob([textContent], { type: 'text/plain' });
        downloadBlob(blob, `${coverLetter.title || 'cover-letter'}.txt`);
      } else if (format === 'docx') {
        // For DOCX, generate as TXT with note
        const textContent = generateTextContent();
        const blob = new Blob([textContent], { type: 'text/plain' });
        downloadBlob(blob, `${coverLetter.title || 'cover-letter'}.txt`);
        alert('DOCX export requires saving the cover letter first. Downloaded as TXT instead.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!letterRef.current) return;
    
    const element = letterRef.current;
    
    // Create canvas from the letter element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    // Calculate dimensions for US Letter size
    const imgWidth = 8.5; // inches
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: imgHeight > 11 ? 'portrait' : 'portrait',
      unit: 'in',
      format: 'letter',
    });
    
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 11));
    
    // If content overflows, add more pages
    if (imgHeight > 11) {
      let remainingHeight = imgHeight - 11;
      let yOffset = 11;
      
      while (remainingHeight > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yOffset, imgWidth, imgHeight);
        remainingHeight -= 11;
        yOffset += 11;
      }
    }
    
    pdf.save(`${coverLetter.title || 'cover-letter'}.pdf`);
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
    lines.push(formatDate());
    lines.push('');
    
    // Recipient
    if (recipient.name) lines.push(recipient.name);
    if (recipient.title) lines.push(recipient.title);
    if (recipient.company) lines.push(recipient.company);
    lines.push('');
    
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
      {/* Preview Header */}
      <div className="bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
        <h3 className="font-medium text-gray-700">Live Preview</h3>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
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
        <div ref={letterRef} className={`bg-white shadow-lg mx-auto max-w-[8.5in] aspect-[8.5/11] p-8 ${styles.fontFamily}`}>
          {/* Header - Sender Info */}
          <div className={`${template === 'minimal' ? 'border-b-2 border-gray-300' : ''} pb-4 mb-6`}>
            {template !== 'minimal' && (
              <div className={`${styles.headerBg} ${styles.headerText} -mx-8 -mt-8 px-8 py-6 mb-6`}>
                <h1 className="text-2xl font-bold">{sender.full_name || 'Your Name'}</h1>
                <div className="text-sm opacity-90 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {sender.email && <span>{sender.email}</span>}
                  {sender.phone && <span>{sender.phone}</span>}
                  {sender.linkedin && <span>{sender.linkedin}</span>}
                </div>
                {sender.address && (
                  <div className="text-sm opacity-80 mt-1">
                    {sender.address}
                    {sender.city && `, ${sender.city}`}
                    {sender.state && `, ${sender.state}`}
                    {sender.zip_code && ` ${sender.zip_code}`}
                  </div>
                )}
              </div>
            )}

            {template === 'minimal' && (
              <>
                <h1 className="text-xl font-semibold text-gray-900">{sender.full_name || 'Your Name'}</h1>
                <div className="text-sm text-gray-600 mt-1">
                  {[sender.email, sender.phone, sender.linkedin].filter(Boolean).join(' • ')}
                </div>
                {sender.address && (
                  <div className="text-sm text-gray-500 mt-1">
                    {sender.address}
                    {sender.city && `, ${sender.city}`}
                    {sender.state && `, ${sender.state}`}
                    {sender.zip_code && ` ${sender.zip_code}`}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Date */}
          <div className="text-sm text-gray-600 mb-4">{formatDate()}</div>

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
