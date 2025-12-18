/**
 * BuilderCanvas Component
 * Main drag-and-drop canvas for arranging resume sections
 * Enhanced with smooth animations and better visual feedback
 */

'use client';

import React, { useCallback, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { FileText, Plus, Sparkles, GripVertical, Layout, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBuilderStore, useSections, useSelectedSectionId } from '@/store/builderStore';
import { SectionBlock } from './SectionBlock';
import { Section, SECTION_META } from '@/types/sections';

interface BuilderCanvasProps {
  onAddSection: () => void;
}

export function BuilderCanvas({ onAddSection }: BuilderCanvasProps) {
  const sections = useSections();
  const selectedSectionId = useSelectedSectionId();
  const {
    reorderSections,
    removeSection,
    selectSection,
    duplicateSection,
    toggleSectionVisibility,
    openEditor,
  } = useBuilderStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeSection = sections.find((s) => s.id === activeId);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          reorderSections(oldIndex, newIndex);
        }
      }
    },
    [sections, reorderSections]
  );

  // Handle section actions
  const handleSelect = useCallback(
    (id: string) => {
      selectSection(id);
    },
    [selectSection]
  );

  const handleEdit = useCallback(
    (id: string) => {
      selectSection(id);
      openEditor();
    },
    [selectSection, openEditor]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm('Are you sure you want to delete this section?')) {
        removeSection(id);
      }
    },
    [removeSection]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateSection(id);
    },
    [duplicateSection]
  );

  const handleToggleVisibility = useCallback(
    (id: string) => {
      toggleSectionVisibility(id);
    },
    [toggleSectionVisibility]
  );

  // Empty state - enhanced
  if (sections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center max-w-md">
          {/* Animated icon */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 animate-pulse" />
            <div className="absolute inset-2 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <Layout className="w-10 h-10 text-blue-600" />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Start Building Your Document
          </h3>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Add sections from the sidebar to create your professional document.
            Drag and drop to reorder them anytime.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onAddSection}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Section
            </button>
          </div>
          
          {/* Hint */}
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
            <GripVertical className="w-4 h-4" />
            <span>Use the sidebar to add sections</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="p-6 max-w-3xl mx-auto">
        {/* Canvas Header - Enhanced */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Document Sections
                </h2>
                <p className="text-sm text-gray-500">
                  {sections.length} section{sections.length !== 1 ? 's' : ''} · Drag to reorder
                </p>
              </div>
            </div>
            <button
              onClick={onAddSection}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>
        </div>

        {/* Sortable Sections */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sections.map((section, index) => (
                <div 
                  key={section.id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <SectionBlock
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    onSelect={() => handleSelect(section.id)}
                    onEdit={() => handleEdit(section.id)}
                    onDelete={() => handleDelete(section.id)}
                    onDuplicate={
                      section.type === 'paragraph'
                        ? () => handleDuplicate(section.id)
                        : undefined
                    }
                    onToggleVisibility={() => handleToggleVisibility(section.id)}
                  />
                </div>
              ))}
            </div>
          </SortableContext>

          {/* Drag Overlay - Enhanced */}
          <DragOverlay>
            {activeSection && (
              <div className="transform scale-105 shadow-2xl rounded-xl opacity-95">
                <SectionBlock
                  section={activeSection}
                  isSelected={false}
                  onSelect={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onToggleVisibility={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Quick Actions - Enhanced */}
        <div className="mt-8 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100/50 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-2xl" />
          
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Pro Tip</h4>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                Keep your resume to 1-2 pages. Use the preview panel to check formatting
                and run an ATS scan before applying.
              </p>
              <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Learn more →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
