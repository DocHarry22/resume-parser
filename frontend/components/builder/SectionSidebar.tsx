/**
 * SectionSidebar Component
 * Sidebar for adding and managing document sections
 * Enhanced with smooth animations and improved UX
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderKanban,
  BookOpen,
  Award,
  AlignLeft,
  User,
  Upload,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  PanelLeftClose,
  PanelLeft,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBuilderStore, useActiveVariant, useSections, useContact } from '@/store/builderStore';
import { SectionType, SECTION_META } from '@/types/sections';
import { VARIANT_CONFIG, DocumentVariant } from '@/types/document';

interface SectionSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
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

const SECTION_COLORS: Record<SectionType, { bg: string; text: string; hover: string }> = {
  summary: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-50' },
  experience: { bg: 'bg-indigo-100', text: 'text-indigo-600', hover: 'hover:bg-indigo-50' },
  education: { bg: 'bg-green-100', text: 'text-green-600', hover: 'hover:bg-green-50' },
  skills: { bg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:bg-orange-50' },
  projects: { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:bg-purple-50' },
  publications: { bg: 'bg-pink-100', text: 'text-pink-600', hover: 'hover:bg-pink-50' },
  certifications: { bg: 'bg-amber-100', text: 'text-amber-600', hover: 'hover:bg-amber-50' },
  paragraph: { bg: 'bg-gray-100', text: 'text-gray-600', hover: 'hover:bg-gray-50' },
};

// Variant icons
const VARIANT_ICONS: Record<DocumentVariant, React.ComponentType<any>> = {
  resume: FileText,
  cv: BookOpen,
  cover_letter: AlignLeft,
};

const VARIANT_COLORS: Record<DocumentVariant, { bg: string; text: string; border: string }> = {
  resume: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  cv: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  cover_letter: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
};

export function SectionSidebar({ isOpen, onToggle }: SectionSidebarProps) {
  const activeVariant = useActiveVariant();
  const sections = useSections();
  const contact = useContact();
  const { addSection, switchVariant, selectSection, updateContact } = useBuilderStore();

  const [isContactOpen, setIsContactOpen] = useState(true);
  const [isVariantOpen, setIsVariantOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(false);

  const config = VARIANT_CONFIG[activeVariant];
  const allowedSections = config.allowedSections;

  // Check if section already exists (for non-repeatable sections)
  const getSectionStatus = (type: SectionType) => {
    const exists = sections.some((s) => s.type === type);
    const isRepeatable = SECTION_META[type].isRepeatable;
    return { exists, canAdd: isRepeatable || !exists };
  };

  // Handle adding a section
  const handleAddSection = (type: SectionType) => {
    const { canAdd } = getSectionStatus(type);
    if (canAdd) {
      addSection(type);
    }
  };

  // Collapsed state - enhanced with tooltips and better styling
  if (!isOpen) {
    return (
      <div className="h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
        <button
          onClick={onToggle}
          className="p-2.5 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group"
          title="Open sidebar"
        >
          <PanelLeft className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>
        <div className="w-6 border-t border-gray-200 my-2" />
        {allowedSections.slice(0, 6).map((type) => {
          const Icon = SECTION_ICONS[type];
          const colors = SECTION_COLORS[type];
          const { exists, canAdd } = getSectionStatus(type);
          const isCompleted = exists && !SECTION_META[type].isRepeatable;
          
          return (
            <button
              key={type}
              onClick={() => handleAddSection(type)}
              disabled={!canAdd}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200 group relative',
                canAdd
                  ? `${colors.hover} ${colors.text}`
                  : 'text-gray-300 cursor-not-allowed',
                isCompleted && 'bg-green-50 text-green-600'
              )}
              title={`${canAdd ? 'Add' : isCompleted ? 'Added:' : ''} ${SECTION_META[type].name}`}
            >
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              )}
              {/* Tooltip on hover */}
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {SECTION_META[type].name}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-gray-900">Builder</h2>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Document Type Selector - Enhanced */}
        <div className="p-4 border-b border-gray-100">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
            Document Type
          </label>
          <button
            onClick={() => setIsVariantOpen(!isVariantOpen)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 border",
              VARIANT_COLORS[activeVariant].bg,
              VARIANT_COLORS[activeVariant].border
            )}
          >
            <div className="flex items-center gap-3">
              {React.createElement(VARIANT_ICONS[activeVariant], {
                className: cn('w-5 h-5', VARIANT_COLORS[activeVariant].text),
              })}
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">
                  {config.name}
                </div>
              </div>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform duration-200',
                isVariantOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown with animation */}
          <div className={cn(
            "overflow-hidden transition-all duration-200",
            isVariantOpen ? "max-h-48 mt-2" : "max-h-0"
          )}>
            <div className="space-y-1 p-1 bg-gray-50 rounded-xl">
              {(Object.keys(VARIANT_CONFIG) as DocumentVariant[]).map((variant) => {
                const variantConfig = VARIANT_CONFIG[variant];
                const Icon = VARIANT_ICONS[variant];
                const colors = VARIANT_COLORS[variant];
                const isActive = activeVariant === variant;

                return (
                  <button
                    key={variant}
                    onClick={() => {
                      switchVariant(variant);
                      setIsVariantOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
                      isActive
                        ? `${colors.bg} ${colors.text}`
                        : 'hover:bg-white text-gray-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium flex-1 text-left">{variantConfig.name}</span>
                    {isActive && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contact Info Section - Enhanced */}
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={() => setIsContactOpen(!isContactOpen)}
            className="w-full flex items-center justify-between mb-3 group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <User className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <span className="text-sm font-medium text-gray-900">Contact Info</span>
              {contact?.fullName && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">✓</span>
              )}
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform duration-200',
                isContactOpen && 'rotate-180'
              )}
            />
          </button>

          <div className={cn(
            "overflow-hidden transition-all duration-200",
            isContactOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}>
            {editingContact ? (
              <div className="space-y-3 animate-fadeIn">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={contact?.fullName || ''}
                    onChange={(e) => updateContact({ fullName: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={contact?.email || ''}
                    onChange={(e) => updateContact({ email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={contact?.phone || ''}
                    onChange={(e) => updateContact({ phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Location"
                    value={contact?.location || ''}
                    onChange={(e) => updateContact({ location: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    placeholder="LinkedIn URL (optional)"
                    value={contact?.linkedin || ''}
                    onChange={(e) => updateContact({ linkedin: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    placeholder="Website (optional)"
                    value={contact?.website || ''}
                    onChange={(e) => updateContact({ website: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  onClick={() => setEditingContact(false)}
                  className="w-full py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Save Contact
                </button>
              </div>
            ) : (
              <div>
                {contact?.fullName ? (
                  <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {contact.fullName}
                    </p>
                    {contact.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {contact.email}
                      </p>
                    )}
                    {contact.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {contact.phone}
                      </p>
                    )}
                    {contact.location && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {contact.location}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center">
                    <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No contact info yet</p>
                  </div>
                )}
                <button
                  onClick={() => setEditingContact(true)}
                  className="mt-3 w-full py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {contact?.fullName ? 'Edit Contact' : 'Add Contact Info'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Sections - Enhanced */}
        <div className="p-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Add Sections</h3>
          <div className="space-y-1.5">
            {allowedSections.map((type, index) => {
              const Icon = SECTION_ICONS[type];
              const colors = SECTION_COLORS[type];
              const meta = SECTION_META[type];
              const { exists, canAdd } = getSectionStatus(type);
              const isCompleted = exists && !meta.isRepeatable;

              return (
                <button
                  key={type}
                  onClick={() => handleAddSection(type)}
                  disabled={!canAdd}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-left group',
                    canAdd
                      ? `${colors.hover} text-gray-700 hover:shadow-sm`
                      : 'text-gray-400 cursor-not-allowed',
                    isCompleted && 'bg-green-50 border border-green-200'
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
                      isCompleted
                        ? 'bg-green-100'
                        : colors.bg,
                      canAdd && 'group-hover:scale-110'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Icon className={cn('w-4 h-4', colors.text)} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{meta.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {meta.description}
                    </div>
                  </div>
                  {canAdd && (
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Plus className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  {isCompleted && (
                    <span className="text-xs text-green-600 font-medium">Added</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Import Section - Enhanced */}
        <div className="p-4 border-t border-gray-100">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Import</h3>
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-blue-50 text-gray-700 transition-all duration-200 text-left group border-2 border-dashed border-gray-200 hover:border-blue-300">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Upload Resume</div>
              <div className="text-xs text-gray-500">PDF, DOCX, or TXT</div>
            </div>
          </button>
        </div>

        {/* AI Suggestions - Enhanced */}
        <div className="p-4 border-t border-gray-100">
          <div className="p-4 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-xl border border-purple-100/50 relative overflow-hidden">
            {/* Decorative sparkle */}
            <div className="absolute top-2 right-2 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full blur-xl" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900">AI Assistant</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Pro</span>
              </div>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Get AI-powered suggestions to improve your content and tailor it for specific jobs.
              </p>
              <button className="w-full py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                ✨ Optimize with AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
