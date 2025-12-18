/**
 * SectionBlock Component
 * Draggable section block with controls for the builder canvas
 * Enhanced with smooth animations and better visual hierarchy
 */

'use client';

import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Trash2,
  Edit3,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderKanban,
  BookOpen,
  Award,
  AlignLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Section, SectionType, SECTION_META } from '@/types/sections';
import { useBuilderStore } from '@/store/builderStore';

interface SectionBlockProps {
  section: Section;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onToggleVisibility: () => void;
}

// Icon mapping with colors
const SECTION_ICONS: Record<SectionType, React.ComponentType<any>> = {
  summary: FileText,
  experience: Briefcase,
  education: GraduationCap,
  skills: Wrench,
  projects: FolderKanban,
  publications: BookOpen,
  certifications: Award,
  paragraph: AlignLeft,
};

const SECTION_COLORS: Record<SectionType, { bg: string; text: string; border: string }> = {
  summary: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  experience: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  education: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  skills: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  projects: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  publications: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  certifications: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  paragraph: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

// Get content preview
function getContentPreview(section: Section): string {
  switch (section.type) {
    case 'summary':
      return section.content.text?.substring(0, 100) || 'No summary yet...';
    case 'experience':
      const expCount = section.content.entries?.length || 0;
      if (expCount === 0) return 'No experience added yet...';
      const firstExp = section.content.entries[0];
      return `${expCount} ${expCount === 1 ? 'position' : 'positions'} · ${firstExp.role || 'Untitled'} at ${firstExp.company || 'Company'}`;
    case 'education':
      const eduCount = section.content.entries?.length || 0;
      if (eduCount === 0) return 'No education added yet...';
      return `${eduCount} ${eduCount === 1 ? 'degree' : 'degrees'}`;
    case 'skills':
      const skillCount = section.content.categories?.reduce(
        (acc: number, cat: any) => acc + (cat.skills?.length || 0),
        0
      ) || 0;
      return skillCount > 0 ? `${skillCount} skills` : 'No skills added yet...';
    case 'projects':
      const projCount = section.content.entries?.length || 0;
      return projCount > 0 ? `${projCount} ${projCount === 1 ? 'project' : 'projects'}` : 'No projects added yet...';
    case 'publications':
      const pubCount = section.content.entries?.length || 0;
      return pubCount > 0 ? `${pubCount} ${pubCount === 1 ? 'publication' : 'publications'}` : 'No publications added yet...';
    case 'certifications':
      const certCount = section.content.entries?.length || 0;
      return certCount > 0 ? `${certCount} ${certCount === 1 ? 'certification' : 'certifications'}` : 'No certifications added yet...';
    case 'paragraph':
      return section.content.text?.substring(0, 100) || 'No content yet...';
    default:
      return 'Click to edit...';
  }
}

export const SectionBlock = memo(function SectionBlock({
  section,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisibility,
}: SectionBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = SECTION_ICONS[section.type];
  const meta = SECTION_META[section.type];
  const colors = SECTION_COLORS[section.type];
  const preview = getContentPreview(section);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-white rounded-xl border-2 transition-all duration-200',
        isDragging && 'shadow-2xl scale-[1.02] z-50 ring-4 ring-blue-200',
        isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-100'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md',
        !section.isVisible && 'opacity-60 bg-gray-50'
      )}
      onClick={onSelect}
    >
      {/* Colored accent line */}
      <div className={cn(
        'absolute left-0 top-3 bottom-3 w-1 rounded-full transition-all duration-200',
        isSelected ? 'bg-blue-500' : colors.text.replace('text-', 'bg-'),
        'opacity-0 group-hover:opacity-100',
        isSelected && 'opacity-100'
      )} />

      {/* Drag Handle - Enhanced */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg',
          'cursor-grab active:cursor-grabbing',
          'opacity-0 group-hover:opacity-100 transition-all duration-200',
          'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        )}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Main Content */}
      <div className="pl-10 pr-4 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Section Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={cn(
                'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
                isSelected 
                  ? 'bg-blue-100 text-blue-600' 
                  : cn(colors.bg, colors.text),
                'group-hover:scale-110'
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {section.title || meta.name}
                </h3>
                {!section.isVisible && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    <EyeOff className="w-3 h-3" />
                    Hidden
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate mt-1 leading-relaxed">{preview}</p>
            </div>
          </div>

          {/* Actions - Enhanced */}
          <div
            className={cn(
              'flex items-center gap-0.5 bg-gray-50 rounded-lg p-1',
              'opacity-0 group-hover:opacity-100 transition-all duration-200'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onToggleVisibility}
              className={cn(
                'p-2 rounded-md transition-all duration-200',
                section.isVisible 
                  ? 'text-gray-400 hover:text-gray-600 hover:bg-white' 
                  : 'text-orange-500 hover:text-orange-600 hover:bg-orange-50'
              )}
              title={section.isVisible ? 'Hide section' : 'Show section'}
            >
              {section.isVisible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
            {section.type === 'paragraph' && onDuplicate && (
              <button
                onClick={onDuplicate}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-white transition-all duration-200"
                title="Duplicate section"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-2 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
              title="Edit section"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              title="Delete section"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edit indicator - Enhanced */}
        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group/edit"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit this section</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover/edit:translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
