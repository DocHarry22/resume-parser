/**
 * LivePreview Component
 * Real-time PDF-like preview of the document
 * Enhanced with better styling and zoom controls
 */

'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  useDocumentData,
  useDesign,
  useSections,
  useContact,
} from '@/store/builderStore';
import { Section, ExperienceEntry, EducationEntry, SkillCategory, ProjectEntry, PublicationEntry, CertificationEntry } from '@/types/sections';
import { COLOR_SCHEMES, FONT_CONFIG, DocumentDesign } from '@/types/document';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Github,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Lightbulb,
} from 'lucide-react';

interface LivePreviewProps {
  isVisible: boolean;
}

export function LivePreview({ isVisible }: LivePreviewProps) {
  const documentData = useDocumentData();
  const design = useDesign();
  const sections = useSections();
  const contact = useContact();
  const [zoom, setZoom] = useState(100);

  // Get style values
  const colors = COLOR_SCHEMES[design?.color || 'professional'];
  const fontConfig = FONT_CONFIG[design?.font || 'inter'];
  const isOneColumn = design?.layout === 'one_column';

  // Filter visible sections
  const visibleSections = useMemo(() => {
    return sections.filter((s) => s.isVisible).sort((a, b) => a.order - b.order);
  }, [sections]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(100);

  if (!isVisible || !documentData) {
    return null;
  }

  return (
    <div className="h-full bg-gradient-to-b from-gray-100 to-gray-200 overflow-hidden flex flex-col">
      {/* Preview Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Live Preview</h3>
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-white transition-all"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white rounded-md transition-all"
              title="Reset zoom"
            >
              {zoom}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-white transition-all"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Content Area */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          {/* Preview Container - Paper-like appearance */}
          <div
            className="bg-white shadow-2xl rounded-sm transition-transform duration-200 origin-top"
            style={{
              fontFamily: fontConfig.stack,
              width: '360px',
              minHeight: '460px',
              transform: `scale(${zoom / 100})`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Preview Content */}
            <div className="p-6 text-[10px] leading-relaxed">
              {/* Header / Contact */}
              <PreviewHeader contact={contact} colors={colors} />

              {/* Sections */}
              {visibleSections.length === 0 ? (
                <div className="mt-8 text-center text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Add sections to see preview</p>
                </div>
              ) : isOneColumn ? (
                <div className="mt-4 space-y-4">
                  {visibleSections.map((section) => (
                    <PreviewSection
                      key={section.id}
                      section={section}
                      colors={colors}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {/* Left Column - 2/3 width */}
                  <div className="col-span-2 space-y-4">
                    {visibleSections
                      .filter((s) =>
                        ['summary', 'experience', 'projects', 'publications'].includes(s.type)
                      )
                      .map((section) => (
                        <PreviewSection
                          key={section.id}
                          section={section}
                          colors={colors}
                        />
                      ))}
                  </div>
                  {/* Right Column - 1/3 width */}
                  <div className="space-y-4">
                    {visibleSections
                      .filter((s) =>
                        ['education', 'skills', 'certifications'].includes(s.type)
                      )
                      .map((section) => (
                        <PreviewSection
                          key={section.id}
                          section={section}
                          colors={colors}
                          compact
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Tips - Enhanced */}
      <div className="flex-shrink-0 p-3 bg-white/80 backdrop-blur-sm border-t border-gray-200">
        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 mb-1">Preview Tips</h4>
            <ul className="text-xs text-gray-600 space-y-0.5">
              <li>• Scaled preview – PDF will be full size</li>
              <li>• ATS-friendly: no tables, real text only</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preview Header Component
interface PreviewHeaderProps {
  contact: ReturnType<typeof useContact>;
  colors: typeof COLOR_SCHEMES[keyof typeof COLOR_SCHEMES];
}

function PreviewHeader({ contact, colors }: PreviewHeaderProps) {
  if (!contact) return null;

  return (
    <div className="text-center pb-3 border-b" style={{ borderColor: colors.primary }}>
      {/* Name */}
      {contact.fullName && (
        <h1
          className="text-lg font-bold tracking-wide"
          style={{ color: colors.primary }}
        >
          {contact.fullName}
        </h1>
      )}

      {/* Contact Info */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-gray-600">
        {contact.email && (
          <span className="flex items-center gap-1">
            <Mail className="w-2.5 h-2.5" />
            {contact.email}
          </span>
        )}
        {contact.phone && (
          <span className="flex items-center gap-1">
            <Phone className="w-2.5 h-2.5" />
            {contact.phone}
          </span>
        )}
        {contact.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />
            {contact.location}
          </span>
        )}
        {contact.linkedin && (
          <span className="flex items-center gap-1">
            <Linkedin className="w-2.5 h-2.5" />
            LinkedIn
          </span>
        )}
        {contact.website && (
          <span className="flex items-center gap-1">
            <Globe className="w-2.5 h-2.5" />
            Portfolio
          </span>
        )}
        {contact.github && (
          <span className="flex items-center gap-1">
            <Github className="w-2.5 h-2.5" />
            GitHub
          </span>
        )}
      </div>
    </div>
  );
}

// Preview Section Component
interface PreviewSectionProps {
  section: Section;
  colors: typeof COLOR_SCHEMES[keyof typeof COLOR_SCHEMES];
  compact?: boolean;
}

function PreviewSection({ section, colors, compact }: PreviewSectionProps) {
  const sectionTitles: Record<string, string> = {
    summary: 'Professional Summary',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    publications: 'Publications',
    certifications: 'Certifications',
    paragraph: '',
  };

  const title = section.title || sectionTitles[section.type];

  return (
    <div>
      {/* Section Title */}
      {title && section.type !== 'paragraph' && (
        <h2
          className="text-[11px] font-bold uppercase tracking-wider pb-1 mb-2 border-b"
          style={{ color: colors.primary, borderColor: colors.secondary }}
        >
          {title}
        </h2>
      )}

      {/* Section Content */}
      <div className="text-gray-700">
        {section.type === 'summary' && (
          <SummaryPreview content={section.content} />
        )}
        {section.type === 'experience' && (
          <ExperiencePreview content={section.content} colors={colors} compact={compact} />
        )}
        {section.type === 'education' && (
          <EducationPreview content={section.content} colors={colors} compact={compact} />
        )}
        {section.type === 'skills' && (
          <SkillsPreview content={section.content} colors={colors} />
        )}
        {section.type === 'projects' && (
          <ProjectsPreview content={section.content} colors={colors} compact={compact} />
        )}
        {section.type === 'publications' && (
          <PublicationsPreview content={section.content} colors={colors} />
        )}
        {section.type === 'certifications' && (
          <CertificationsPreview content={section.content} colors={colors} compact={compact} />
        )}
        {section.type === 'paragraph' && (
          <ParagraphPreview content={section.content} />
        )}
      </div>
    </div>
  );
}

// Content Preview Components
function SummaryPreview({ content }: { content: { text: string } }) {
  if (!content.text) {
    return <p className="text-gray-400 italic">No summary added yet...</p>;
  }
  return <p className="leading-relaxed">{content.text}</p>;
}

function ExperiencePreview({
  content,
  colors,
  compact,
}: {
  content: { entries: ExperienceEntry[] };
  colors: typeof COLOR_SCHEMES[keyof typeof COLOR_SCHEMES];
  compact?: boolean;
}) {
  if (!content.entries?.length) {
    return <p className="text-gray-400 italic">No experience added yet...</p>;
  }

  return (
    <div className="space-y-3">
      {content.entries.map((entry) => (
        <div key={entry.id}>
          <div className="flex justify-between items-baseline">
            <h3 className="font-semibold" style={{ color: colors.primary }}>
              {entry.role || 'Position'}
            </h3>
            <span className="text-gray-500 text-[9px]">
              {entry.startDate} - {entry.isCurrent ? 'Present' : entry.endDate}
            </span>
          </div>
          <div className="text-gray-600 text-[9px]">
            {entry.company}
            {entry.location && ` · ${entry.location}`}
          </div>
          {entry.bullets.length > 0 && entry.bullets[0] && (
            <ul className="mt-1 space-y-0.5">
              {entry.bullets
                .filter((b) => b)
                .slice(0, compact ? 2 : undefined)
                .map((bullet, idx) => (
                  <li key={idx} className="flex">
                    <span className="mr-1">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function EducationPreview({
  content,
  colors,
  compact,
}: {
  content: { entries: EducationEntry[] };
  colors: typeof COLOR_SCHEMES[keyof typeof COLOR_SCHEMES];
  compact?: boolean;
}) {
  if (!content.entries?.length) {
    return <p className="text-gray-400 italic">No education added yet...</p>;
  }

  return (
    <div className="space-y-2">
      {content.entries.map((entry) => (
        <div key={entry.id}>
          <h3 className="font-semibold text-[10px]" style={{ color: colors.primary }}>
            {entry.degree || 'Degree'}
          </h3>
          <div className="text-gray-600 text-[9px]">
            {entry.institution}
            {!compact && entry.location && ` · ${entry.location}`}
          </div>
          <div className="text-gray-500 text-[9px]">
            {entry.startDate} - {entry.endDate}
            {entry.gpa && ` · GPA: ${entry.gpa}`}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillsPreview({
  content,
  colors,
}: {
  content: { categories: SkillCategory[]; displayStyle: string };
  colors: typeof COLOR_SCHEMES[keyof typeof COLOR_SCHEMES];
}) {
  if (!content.categories?.length) {
    return <p className="text-gray-400 italic">No skills added yet...</p>;
  }

  return (
    <div className="space-y-2">
      {content.categories.map((category) => (
        <div key={category.id}>
          {category.name && (
            <span className="font-medium" style={{ color: colors.primary }}>
              {category.name}:{' '}
            </span>
          )}
          <span>{category.skills.join(', ')}</span>
        </div>
      ))}
    </div>
  );
}

function ProjectsPreview({
  content,
  colors,
  compact,
}: {
  content: { entries: ProjectEntry[] };
  colors: typeof COLOR_SCHEMES[keyof typeof COLOR_SCHEMES];
  compact?: boolean;
}) {
  if (!content.entries?.length) {
    return <p className="text-gray-400 italic">No projects added yet...</p>;
  }

  return (
    <div className="space-y-2">
      {content.entries.slice(0, compact ? 2 : undefined).map((entry) => (
        <div key={entry.id}>
          <h3 className="font-semibold" style={{ color: colors.primary }}>
            {entry.name || 'Project'}
          </h3>
          {entry.description && (
            <p className="text-gray-600 text-[9px]">{entry.description}</p>
          )}
          {entry.technologies.length > 0 && (
            <div className="text-[9px] text-gray-500 mt-0.5">
              <span className="font-medium">Tech:</span> {entry.technologies.join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PublicationsPreview({
  content,
  colors,
}: {
  content: { entries: PublicationEntry[] };
  colors: typeof COLOR_SCHEMES[keyof typeof COLOR_SCHEMES];
}) {
  if (!content.entries?.length) {
    return <p className="text-gray-400 italic">No publications added yet...</p>;
  }

  return (
    <div className="space-y-2">
      {content.entries.map((entry) => (
        <div key={entry.id}>
          <h3 className="font-medium" style={{ color: colors.primary }}>
            {entry.title || 'Publication'}
          </h3>
          <div className="text-gray-600 text-[9px]">
            {entry.publication}
            {entry.date && ` · ${entry.date}`}
          </div>
        </div>
      ))}
    </div>
  );
}

function CertificationsPreview({
  content,
  colors,
  compact,
}: {
  content: { entries: CertificationEntry[] };
  colors: typeof COLOR_SCHEMES[keyof typeof COLOR_SCHEMES];
  compact?: boolean;
}) {
  if (!content.entries?.length) {
    return <p className="text-gray-400 italic">No certifications added yet...</p>;
  }

  return (
    <div className="space-y-1.5">
      {content.entries.map((entry) => (
        <div key={entry.id}>
          <h3 className="font-medium text-[10px]" style={{ color: colors.primary }}>
            {entry.name || 'Certification'}
          </h3>
          <div className="text-gray-600 text-[9px]">
            {entry.issuer}
            {!compact && entry.date && ` · ${entry.date}`}
          </div>
        </div>
      ))}
    </div>
  );
}

function ParagraphPreview({ content }: { content: { text: string; style: string } }) {
  if (!content.text) {
    return <p className="text-gray-400 italic">No content added yet...</p>;
  }

  return (
    <p className={cn(
      'leading-relaxed whitespace-pre-wrap',
      content.style === 'opening' && 'mb-3',
      content.style === 'closing' && 'mt-3'
    )}>
      {content.text}
    </p>
  );
}
