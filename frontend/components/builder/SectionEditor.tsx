/**
 * SectionEditor Component
 * Context-aware editor for different section types
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  GraduationCap,
  Link,
  ExternalLink,
  Sparkles,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBuilderStore, useSections, useSelectedSectionId } from '@/store/builderStore';
import {
  Section,
  SectionType,
  SECTION_META,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  PublicationEntry,
  CertificationEntry,
  SkillCategory,
  createEmptyExperienceEntry,
  createEmptyEducationEntry,
  createEmptyProjectEntry,
  createEmptyPublicationEntry,
  createEmptyCertificationEntry,
  createEmptySkillCategory,
} from '@/types/sections';

interface SectionEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SectionEditor({ isOpen, onClose }: SectionEditorProps) {
  const sections = useSections();
  const selectedSectionId = useSelectedSectionId();
  const { updateSection, saveToHistory } = useBuilderStore();

  const section = sections.find((s) => s.id === selectedSectionId);

  if (!isOpen || !section) {
    return null;
  }

  const meta = SECTION_META[section.type];

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="font-semibold text-gray-900">{meta.name}</h2>
          <p className="text-sm text-gray-500">{meta.description}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <EditorContent section={section} updateSection={updateSection} saveToHistory={saveToHistory} />
      </div>
    </div>
  );
}

// Editor content based on section type
interface EditorContentProps {
  section: Section;
  updateSection: (id: string, content: any) => void;
  saveToHistory: () => void;
}

function EditorContent({ section, updateSection, saveToHistory }: EditorContentProps) {
  switch (section.type) {
    case 'summary':
      return <SummaryEditor section={section} updateSection={updateSection} saveToHistory={saveToHistory} />;
    case 'experience':
      return <ExperienceEditor section={section} updateSection={updateSection} saveToHistory={saveToHistory} />;
    case 'education':
      return <EducationEditor section={section} updateSection={updateSection} saveToHistory={saveToHistory} />;
    case 'skills':
      return <SkillsEditor section={section} updateSection={updateSection} saveToHistory={saveToHistory} />;
    case 'projects':
      return <ProjectsEditor section={section} updateSection={updateSection} saveToHistory={saveToHistory} />;
    case 'publications':
      return <PublicationsEditor section={section} updateSection={updateSection} saveToHistory={saveToHistory} />;
    case 'certifications':
      return <CertificationsEditor section={section} updateSection={updateSection} saveToHistory={saveToHistory} />;
    case 'paragraph':
      return <ParagraphEditor section={section} updateSection={updateSection} saveToHistory={saveToHistory} />;
    default:
      return <div>Unknown section type</div>;
  }
}

// Summary Editor
function SummaryEditor({ section, updateSection, saveToHistory }: EditorContentProps) {
  const content = (section as any).content;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Summary
        </label>
        <textarea
          value={content.text || ''}
          onChange={(e) => updateSection(section.id, { text: e.target.value })}
          onBlur={saveToHistory}
          placeholder="Write a compelling 2-3 sentence summary of your professional background, key skills, and career goals..."
          className="w-full h-40 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          {(content.text || '').length} / 500 characters recommended
        </p>
      </div>

      <div className="p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">AI Suggestions</span>
        </div>
        <button className="w-full py-2 text-sm text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
          Generate Summary with AI
        </button>
      </div>
    </div>
  );
}

// Experience Editor
function ExperienceEditor({ section, updateSection, saveToHistory }: EditorContentProps) {
  const content = (section as any).content;
  const entries: ExperienceEntry[] = content.entries || [];
  const [expandedId, setExpandedId] = useState<string | null>(entries[0]?.id || null);

  const addEntry = () => {
    saveToHistory();
    const newEntry = createEmptyExperienceEntry();
    updateSection(section.id, { entries: [...entries, newEntry] });
    setExpandedId(newEntry.id);
  };

  const updateEntry = (entryId: string, updates: Partial<ExperienceEntry>) => {
    const newEntries = entries.map((e) =>
      e.id === entryId ? { ...e, ...updates } : e
    );
    updateSection(section.id, { entries: newEntries });
  };

  const removeEntry = (entryId: string) => {
    saveToHistory();
    updateSection(section.id, { entries: entries.filter((e) => e.id !== entryId) });
  };

  const addBullet = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry) {
      updateEntry(entryId, { bullets: [...entry.bullets, ''] });
    }
  };

  const updateBullet = (entryId: string, bulletIndex: number, value: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry) {
      const newBullets = [...entry.bullets];
      newBullets[bulletIndex] = value;
      updateEntry(entryId, { bullets: newBullets });
    }
  };

  const removeBullet = (entryId: string, bulletIndex: number) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry && entry.bullets.length > 1) {
      updateEntry(entryId, {
        bullets: entry.bullets.filter((_, i) => i !== bulletIndex),
      });
    }
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          {/* Entry Header */}
          <button
            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {entry.role || `Position ${index + 1}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {entry.company && (
                <span className="text-xs text-gray-500">{entry.company}</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeEntry(entry.id);
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </button>

          {/* Entry Content */}
          {expandedId === entry.id && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={entry.role}
                    onChange={(e) => updateEntry(entry.id, { role: e.target.value })}
                    onBlur={saveToHistory}
                    placeholder="e.g., Software Engineer"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={entry.company}
                    onChange={(e) => updateEntry(entry.id, { company: e.target.value })}
                    onBlur={saveToHistory}
                    placeholder="e.g., Google"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={entry.location}
                  onChange={(e) => updateEntry(entry.id, { location: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="e.g., San Francisco, CA"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="text"
                    value={entry.startDate}
                    onChange={(e) => updateEntry(entry.id, { startDate: e.target.value })}
                    onBlur={saveToHistory}
                    placeholder="e.g., Jan 2020"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="text"
                    value={entry.isCurrent ? 'Present' : entry.endDate}
                    onChange={(e) =>
                      updateEntry(entry.id, {
                        endDate: e.target.value,
                        isCurrent: e.target.value.toLowerCase() === 'present',
                      })
                    }
                    onBlur={saveToHistory}
                    placeholder="e.g., Present"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bullet Points */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Achievements & Responsibilities
                </label>
                <div className="space-y-2">
                  {entry.bullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-2.5">•</span>
                      <textarea
                        value={bullet}
                        onChange={(e) => updateBullet(entry.id, bulletIndex, e.target.value)}
                        onBlur={saveToHistory}
                        placeholder="Start with an action verb (e.g., Led, Developed, Increased...)"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                      />
                      <button
                        onClick={() => removeBullet(entry.id, bulletIndex)}
                        className="p-1 mt-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        disabled={entry.bullets.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addBullet(entry.id)}
                  className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Bullet Point
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addEntry}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Experience
      </button>
    </div>
  );
}

// Education Editor
function EducationEditor({ section, updateSection, saveToHistory }: EditorContentProps) {
  const content = (section as any).content;
  const entries: EducationEntry[] = content.entries || [];
  const [expandedId, setExpandedId] = useState<string | null>(entries[0]?.id || null);

  const addEntry = () => {
    saveToHistory();
    const newEntry = createEmptyEducationEntry();
    updateSection(section.id, { entries: [...entries, newEntry] });
    setExpandedId(newEntry.id);
  };

  const updateEntry = (entryId: string, updates: Partial<EducationEntry>) => {
    const newEntries = entries.map((e) =>
      e.id === entryId ? { ...e, ...updates } : e
    );
    updateSection(section.id, { entries: newEntries });
  };

  const removeEntry = (entryId: string) => {
    saveToHistory();
    updateSection(section.id, { entries: entries.filter((e) => e.id !== entryId) });
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {entry.degree || `Education ${index + 1}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {entry.institution && (
                <span className="text-xs text-gray-500">{entry.institution}</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeEntry(entry.id);
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </button>

          {expandedId === entry.id && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Degree / Certification
                </label>
                <input
                  type="text"
                  value={entry.degree}
                  onChange={(e) => updateEntry(entry.id, { degree: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="e.g., Bachelor of Science in Computer Science"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  value={entry.institution}
                  onChange={(e) => updateEntry(entry.id, { institution: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="e.g., Stanford University"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={entry.location}
                    onChange={(e) => updateEntry(entry.id, { location: e.target.value })}
                    onBlur={saveToHistory}
                    placeholder="e.g., Stanford, CA"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    GPA (optional)
                  </label>
                  <input
                    type="text"
                    value={entry.gpa || ''}
                    onChange={(e) => updateEntry(entry.id, { gpa: e.target.value })}
                    onBlur={saveToHistory}
                    placeholder="e.g., 3.8/4.0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="text"
                    value={entry.startDate}
                    onChange={(e) => updateEntry(entry.id, { startDate: e.target.value })}
                    onBlur={saveToHistory}
                    placeholder="e.g., Sep 2016"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="text"
                    value={entry.endDate}
                    onChange={(e) => updateEntry(entry.id, { endDate: e.target.value })}
                    onBlur={saveToHistory}
                    placeholder="e.g., May 2020"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addEntry}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Education
      </button>
    </div>
  );
}

// Skills Editor
function SkillsEditor({ section, updateSection, saveToHistory }: EditorContentProps) {
  const content = (section as any).content;
  const categories: SkillCategory[] = content.categories || [];
  const [newSkill, setNewSkill] = useState<Record<string, string>>({});

  const addCategory = () => {
    saveToHistory();
    const newCategory = createEmptySkillCategory();
    updateSection(section.id, { categories: [...categories, newCategory] });
  };

  const updateCategory = (catId: string, updates: Partial<SkillCategory>) => {
    const newCategories = categories.map((c) =>
      c.id === catId ? { ...c, ...updates } : c
    );
    updateSection(section.id, { categories: newCategories });
  };

  const removeCategory = (catId: string) => {
    saveToHistory();
    updateSection(section.id, { categories: categories.filter((c) => c.id !== catId) });
  };

  const addSkill = (catId: string) => {
    const skill = newSkill[catId]?.trim();
    if (!skill) return;

    const category = categories.find((c) => c.id === catId);
    if (category) {
      updateCategory(catId, { skills: [...category.skills, skill] });
      setNewSkill({ ...newSkill, [catId]: '' });
    }
  };

  const removeSkill = (catId: string, skillIndex: number) => {
    const category = categories.find((c) => c.id === catId);
    if (category) {
      updateCategory(catId, {
        skills: category.skills.filter((_, i) => i !== skillIndex),
      });
    }
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="border border-gray-200 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={category.name}
              onChange={(e) => updateCategory(category.id, { name: e.target.value })}
              onBlur={saveToHistory}
              placeholder="Category name (e.g., Programming Languages)"
              className="flex-1 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => removeCategory(category.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Skills Tags */}
          <div className="flex flex-wrap gap-2">
            {category.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {skill}
                <button
                  onClick={() => removeSkill(category.id, index)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add Skill Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSkill[category.id] || ''}
              onChange={(e) => setNewSkill({ ...newSkill, [category.id]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(category.id);
                }
              }}
              placeholder="Add a skill and press Enter"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => addSkill(category.id)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addCategory}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Skill Category
      </button>
    </div>
  );
}

// Projects Editor
function ProjectsEditor({ section, updateSection, saveToHistory }: EditorContentProps) {
  const content = (section as any).content;
  const entries: ProjectEntry[] = content.entries || [];
  const [expandedId, setExpandedId] = useState<string | null>(entries[0]?.id || null);
  const [newTech, setNewTech] = useState<Record<string, string>>({});

  const addEntry = () => {
    saveToHistory();
    const newEntry = createEmptyProjectEntry();
    updateSection(section.id, { entries: [...entries, newEntry] });
    setExpandedId(newEntry.id);
  };

  const updateEntry = (entryId: string, updates: Partial<ProjectEntry>) => {
    const newEntries = entries.map((e) =>
      e.id === entryId ? { ...e, ...updates } : e
    );
    updateSection(section.id, { entries: newEntries });
  };

  const removeEntry = (entryId: string) => {
    saveToHistory();
    updateSection(section.id, { entries: entries.filter((e) => e.id !== entryId) });
  };

  const addTech = (entryId: string) => {
    const tech = newTech[entryId]?.trim();
    if (!tech) return;

    const entry = entries.find((e) => e.id === entryId);
    if (entry) {
      updateEntry(entryId, { technologies: [...entry.technologies, tech] });
      setNewTech({ ...newTech, [entryId]: '' });
    }
  };

  const removeTech = (entryId: string, techIndex: number) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry) {
      updateEntry(entryId, {
        technologies: entry.technologies.filter((_, i) => i !== techIndex),
      });
    }
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {entry.name || `Project ${index + 1}`}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeEntry(entry.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </button>

          {expandedId === entry.id && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={entry.name}
                  onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="e.g., E-commerce Platform"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  value={entry.description}
                  onChange={(e) => updateEntry(entry.id, { description: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="Brief description of the project..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Project URL (optional)
                </label>
                <input
                  type="url"
                  value={entry.url || ''}
                  onChange={(e) => updateEntry(entry.id, { url: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Technologies Used
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {entry.technologies.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                    >
                      {tech}
                      <button
                        onClick={() => removeTech(entry.id, techIndex)}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTech[entry.id] || ''}
                    onChange={(e) => setNewTech({ ...newTech, [entry.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTech(entry.id);
                      }
                    }}
                    placeholder="Add technology"
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => addTech(entry.id)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addEntry}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Project
      </button>
    </div>
  );
}

// Publications Editor
function PublicationsEditor({ section, updateSection, saveToHistory }: EditorContentProps) {
  const content = (section as any).content;
  const entries: PublicationEntry[] = content.entries || [];
  const [expandedId, setExpandedId] = useState<string | null>(entries[0]?.id || null);

  const addEntry = () => {
    saveToHistory();
    const newEntry = createEmptyPublicationEntry();
    updateSection(section.id, { entries: [...entries, newEntry] });
    setExpandedId(newEntry.id);
  };

  const updateEntry = (entryId: string, updates: Partial<PublicationEntry>) => {
    const newEntries = entries.map((e) =>
      e.id === entryId ? { ...e, ...updates } : e
    );
    updateSection(section.id, { entries: newEntries });
  };

  const removeEntry = (entryId: string) => {
    saveToHistory();
    updateSection(section.id, { entries: entries.filter((e) => e.id !== entryId) });
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 truncate max-w-48">
                {entry.title || `Publication ${index + 1}`}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeEntry(entry.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </button>

          {expandedId === entry.id && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={entry.title}
                  onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="Publication title"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Publication / Journal
                </label>
                <input
                  type="text"
                  value={entry.publication}
                  onChange={(e) => updateEntry(entry.id, { publication: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="e.g., Nature, IEEE"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date
                </label>
                <input
                  type="text"
                  value={entry.date}
                  onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="e.g., 2023"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  DOI / URL (optional)
                </label>
                <input
                  type="text"
                  value={entry.doi || entry.url || ''}
                  onChange={(e) => updateEntry(entry.id, { doi: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="DOI or URL"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addEntry}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Publication
      </button>
    </div>
  );
}

// Certifications Editor
function CertificationsEditor({ section, updateSection, saveToHistory }: EditorContentProps) {
  const content = (section as any).content;
  const entries: CertificationEntry[] = content.entries || [];
  const [expandedId, setExpandedId] = useState<string | null>(entries[0]?.id || null);

  const addEntry = () => {
    saveToHistory();
    const newEntry = createEmptyCertificationEntry();
    updateSection(section.id, { entries: [...entries, newEntry] });
    setExpandedId(newEntry.id);
  };

  const updateEntry = (entryId: string, updates: Partial<CertificationEntry>) => {
    const newEntries = entries.map((e) =>
      e.id === entryId ? { ...e, ...updates } : e
    );
    updateSection(section.id, { entries: newEntries });
  };

  const removeEntry = (entryId: string) => {
    saveToHistory();
    updateSection(section.id, { entries: entries.filter((e) => e.id !== entryId) });
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {entry.name || `Certification ${index + 1}`}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeEntry(entry.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </button>

          {expandedId === entry.id && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Certification Name
                </label>
                <input
                  type="text"
                  value={entry.name}
                  onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="e.g., AWS Solutions Architect"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  value={entry.issuer}
                  onChange={(e) => updateEntry(entry.id, { issuer: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="e.g., Amazon Web Services"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="text"
                    value={entry.date}
                    onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                    onBlur={saveToHistory}
                    placeholder="e.g., Jan 2023"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={entry.expiryDate || ''}
                    onChange={(e) => updateEntry(entry.id, { expiryDate: e.target.value })}
                    onBlur={saveToHistory}
                    placeholder="e.g., Jan 2026"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Credential ID (optional)
                </label>
                <input
                  type="text"
                  value={entry.credentialId || ''}
                  onChange={(e) => updateEntry(entry.id, { credentialId: e.target.value })}
                  onBlur={saveToHistory}
                  placeholder="Credential ID"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addEntry}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Certification
      </button>
    </div>
  );
}

// Paragraph Editor (for cover letters)
function ParagraphEditor({ section, updateSection, saveToHistory }: EditorContentProps) {
  const content = (section as any).content;

  const styleLabels = {
    opening: 'Opening Paragraph',
    body: 'Body Paragraph',
    closing: 'Closing Paragraph',
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paragraph Type
        </label>
        <div className="flex gap-2">
          {(['opening', 'body', 'closing'] as const).map((style) => (
            <button
              key={style}
              onClick={() => updateSection(section.id, { style })}
              className={cn(
                'flex-1 py-2 text-sm rounded-lg border transition-colors',
                content.style === style
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {styleLabels[style]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <textarea
          value={content.text || ''}
          onChange={(e) => updateSection(section.id, { text: e.target.value })}
          onBlur={saveToHistory}
          placeholder={
            content.style === 'opening'
              ? "Dear Hiring Manager,\n\nI am writing to express my interest in..."
              : content.style === 'closing'
              ? "Thank you for considering my application. I look forward to..."
              : "Describe your relevant experience, skills, and achievements..."
          }
          className="w-full h-48 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
        <p className="text-xs text-yellow-800">
          <strong>Tip:</strong> Cover letters should be personalized for each job application.
          Mention the company name and specific role you're applying for.
        </p>
      </div>
    </div>
  );
}
