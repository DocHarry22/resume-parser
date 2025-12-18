/**
 * Builder Store - Zustand State Management
 * Handles all state for the Resume/CV/Cover Letter Builder
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  DocumentData,
  DocumentVariant,
  DocumentDesign,
  ContactInfo,
  DEFAULT_DESIGN,
  DEFAULT_CONTACT,
  VARIANT_CONFIG,
  ValidationWarning,
  LayoutType,
  FontFamily,
  ColorScheme,
} from '@/types/document';
import {
  Section,
  SectionType,
  createEmptySection,
} from '@/types/sections';

// Maximum undo/redo stack size
const MAX_HISTORY_SIZE = 50;

// State interface
interface BuilderState {
  // Document data
  documentData: DocumentData | null;
  
  // UI state
  selectedSectionId: string | null;
  activeVariant: DocumentVariant;
  isPreviewMode: boolean;
  isSidebarOpen: boolean;
  isEditorOpen: boolean;
  
  // History for undo/redo
  undoStack: DocumentData[];
  redoStack: DocumentData[];
  
  // Validation
  warnings: ValidationWarning[];
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isExporting: boolean;
}

// Actions interface
interface BuilderActions {
  // Document actions
  initializeDocument: (variant: DocumentVariant) => void;
  loadDocument: (document: DocumentData) => void;
  loadFromScanner: (scannerData: any) => void;
  clearDocument: () => void;
  
  // Section actions
  addSection: (type: SectionType) => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, content: any) => void;
  reorderSections: (sourceIndex: number, targetIndex: number) => void;
  duplicateSection: (id: string) => void;
  toggleSectionVisibility: (id: string) => void;
  
  // Contact actions
  updateContact: (contact: Partial<ContactInfo>) => void;
  
  // Design actions
  updateDesign: (design: Partial<DocumentDesign>) => void;
  setLayout: (layout: LayoutType) => void;
  setFont: (font: FontFamily) => void;
  setColor: (color: ColorScheme) => void;
  
  // Variant actions
  switchVariant: (variant: DocumentVariant) => void;
  applyTemplate: (templateId: string) => void;
  
  // UI actions
  selectSection: (id: string | null) => void;
  togglePreviewMode: () => void;
  toggleSidebar: () => void;
  openEditor: () => void;
  closeEditor: () => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // Validation
  validateDocument: () => ValidationWarning[];
  clearWarnings: () => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setExporting: (exporting: boolean) => void;
}

// Create unique ID
const createId = () => `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create initial document
const createInitialDocument = (variant: DocumentVariant): DocumentData => {
  const config = VARIANT_CONFIG[variant];
  const sections = config.defaultSections.map((type, index) => 
    createEmptySection(type, index)
  );
  
  return {
    id: createId(),
    variant,
    template_id: 'default',
    title: `My ${config.name}`,
    contact: { ...DEFAULT_CONTACT },
    sections,
    design: { ...DEFAULT_DESIGN },
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Initial state
const initialState: BuilderState = {
  documentData: null,
  selectedSectionId: null,
  activeVariant: 'resume',
  isPreviewMode: false,
  isSidebarOpen: true,
  isEditorOpen: false,
  undoStack: [],
  redoStack: [],
  warnings: [],
  isLoading: false,
  isSaving: false,
  isExporting: false,
};

// Create the store
export const useBuilderStore = create<BuilderState & BuilderActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Initialize new document
        initializeDocument: (variant) => {
          const document = createInitialDocument(variant);
          set((state) => {
            state.documentData = document;
            state.activeVariant = variant;
            state.selectedSectionId = null;
            state.undoStack = [];
            state.redoStack = [];
            state.warnings = [];
          });
        },

        // Load existing document
        loadDocument: (document) => {
          set((state) => {
            state.documentData = document;
            state.activeVariant = document.variant;
            state.selectedSectionId = null;
            state.undoStack = [];
            state.redoStack = [];
          });
        },

        // Load from scanner/parser results
        loadFromScanner: (scannerData) => {
          const { documentData, activeVariant } = get();
          if (!documentData) return;

          get().saveToHistory();

          set((state) => {
            if (!state.documentData) return;

            // Map scanner data to document format
            if (scannerData.contact) {
              state.documentData.contact = {
                ...state.documentData.contact,
                fullName: scannerData.contact.name || '',
                email: scannerData.contact.email || '',
                phone: scannerData.contact.phone || '',
                location: scannerData.contact.location || '',
                linkedin: scannerData.contact.linkedin || '',
              };
            }

            // Map sections from scanner
            if (scannerData.summary) {
              const summarySection = state.documentData.sections.find(s => s.type === 'summary');
              if (summarySection && summarySection.type === 'summary') {
                summarySection.content.text = scannerData.summary;
              }
            }

            if (scannerData.experience) {
              const expSection = state.documentData.sections.find(s => s.type === 'experience');
              if (expSection && expSection.type === 'experience') {
                expSection.content.entries = scannerData.experience.map((exp: any, idx: number) => ({
                  id: `exp-${Date.now()}-${idx}`,
                  role: exp.title || '',
                  company: exp.company || '',
                  location: exp.location || '',
                  startDate: exp.start_date || '',
                  endDate: exp.end_date || '',
                  isCurrent: exp.is_current || false,
                  bullets: exp.bullets || [],
                }));
              }
            }

            if (scannerData.education) {
              const eduSection = state.documentData.sections.find(s => s.type === 'education');
              if (eduSection && eduSection.type === 'education') {
                eduSection.content.entries = scannerData.education.map((edu: any, idx: number) => ({
                  id: `edu-${Date.now()}-${idx}`,
                  degree: edu.degree || '',
                  institution: edu.institution || '',
                  location: edu.location || '',
                  startDate: edu.start_date || '',
                  endDate: edu.end_date || '',
                  gpa: edu.gpa || '',
                }));
              }
            }

            if (scannerData.skills) {
              const skillsSection = state.documentData.sections.find(s => s.type === 'skills');
              if (skillsSection && skillsSection.type === 'skills') {
                skillsSection.content.categories = [{
                  id: `skill-${Date.now()}`,
                  name: 'Skills',
                  skills: scannerData.skills,
                }];
              }
            }

            state.documentData.updatedAt = new Date().toISOString();
          });
        },

        // Clear document
        clearDocument: () => {
          set((state) => {
            state.documentData = null;
            state.selectedSectionId = null;
            state.undoStack = [];
            state.redoStack = [];
            state.warnings = [];
          });
        },

        // Add section
        addSection: (type) => {
          const { documentData, activeVariant } = get();
          if (!documentData) return;

          const config = VARIANT_CONFIG[activeVariant];
          if (!config.allowedSections.includes(type)) return;

          // Check if non-repeatable section already exists
          const existingSection = documentData.sections.find(s => s.type === type);
          if (existingSection && type !== 'paragraph') return;

          get().saveToHistory();

          set((state) => {
            if (!state.documentData) return;
            const order = state.documentData.sections.length;
            const newSection = createEmptySection(type, order);
            state.documentData.sections.push(newSection);
            state.documentData.updatedAt = new Date().toISOString();
            state.selectedSectionId = newSection.id;
            state.isEditorOpen = true;
          });
        },

        // Remove section
        removeSection: (id) => {
          const { documentData } = get();
          if (!documentData) return;

          get().saveToHistory();

          set((state) => {
            if (!state.documentData) return;
            state.documentData.sections = state.documentData.sections
              .filter(s => s.id !== id)
              .map((s, idx) => ({ ...s, order: idx }));
            state.documentData.updatedAt = new Date().toISOString();
            if (state.selectedSectionId === id) {
              state.selectedSectionId = null;
              state.isEditorOpen = false;
            }
          });
        },

        // Update section content
        updateSection: (id, content) => {
          set((state) => {
            if (!state.documentData) return;
            const section = state.documentData.sections.find(s => s.id === id);
            if (section) {
              section.content = { ...section.content, ...content };
              state.documentData.updatedAt = new Date().toISOString();
            }
          });
        },

        // Reorder sections
        reorderSections: (sourceIndex, targetIndex) => {
          const { documentData } = get();
          if (!documentData) return;
          if (sourceIndex === targetIndex) return;

          get().saveToHistory();

          set((state) => {
            if (!state.documentData) return;
            const sections = [...state.documentData.sections];
            const [removed] = sections.splice(sourceIndex, 1);
            sections.splice(targetIndex, 0, removed);
            state.documentData.sections = sections.map((s, idx) => ({ ...s, order: idx }));
            state.documentData.updatedAt = new Date().toISOString();
          });
        },

        // Duplicate section
        duplicateSection: (id) => {
          const { documentData } = get();
          if (!documentData) return;

          const section = documentData.sections.find(s => s.id === id);
          if (!section) return;

          // Only allow duplicating paragraph sections
          if (section.type !== 'paragraph') return;

          get().saveToHistory();

          set((state) => {
            if (!state.documentData) return;
            const sectionIndex = state.documentData.sections.findIndex(s => s.id === id);
            const newSection = {
              ...JSON.parse(JSON.stringify(section)),
              id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              order: sectionIndex + 1,
            };
            state.documentData.sections.splice(sectionIndex + 1, 0, newSection);
            state.documentData.sections = state.documentData.sections.map((s, idx) => ({ ...s, order: idx }));
            state.documentData.updatedAt = new Date().toISOString();
          });
        },

        // Toggle section visibility
        toggleSectionVisibility: (id) => {
          set((state) => {
            if (!state.documentData) return;
            const section = state.documentData.sections.find(s => s.id === id);
            if (section) {
              section.isVisible = !section.isVisible;
              state.documentData.updatedAt = new Date().toISOString();
            }
          });
        },

        // Update contact info
        updateContact: (contact) => {
          set((state) => {
            if (!state.documentData) return;
            state.documentData.contact = { ...state.documentData.contact, ...contact };
            state.documentData.updatedAt = new Date().toISOString();
          });
        },

        // Update design
        updateDesign: (design) => {
          set((state) => {
            if (!state.documentData) return;
            state.documentData.design = { ...state.documentData.design, ...design };
            state.documentData.updatedAt = new Date().toISOString();
          });
        },

        // Set layout
        setLayout: (layout) => {
          get().updateDesign({ layout });
        },

        // Set font
        setFont: (font) => {
          get().updateDesign({ font });
        },

        // Set color
        setColor: (color) => {
          get().updateDesign({ color });
        },

        // Switch variant
        switchVariant: (variant) => {
          const { documentData } = get();
          if (!documentData) {
            get().initializeDocument(variant);
            return;
          }

          get().saveToHistory();

          const config = VARIANT_CONFIG[variant];

          set((state) => {
            if (!state.documentData) return;
            state.activeVariant = variant;
            state.documentData.variant = variant;

            // Filter out sections not allowed in new variant
            state.documentData.sections = state.documentData.sections
              .filter(s => config.allowedSections.includes(s.type))
              .map((s, idx) => ({ ...s, order: idx }));

            // Add required sections if missing
            config.requiredSections.forEach(type => {
              if (!state.documentData!.sections.find(s => s.type === type)) {
                const order = state.documentData!.sections.length;
                state.documentData!.sections.push(createEmptySection(type, order));
              }
            });

            state.documentData.updatedAt = new Date().toISOString();
          });
        },

        // Apply template
        applyTemplate: (templateId) => {
          get().saveToHistory();

          set((state) => {
            if (!state.documentData) return;
            state.documentData.template_id = templateId;
            // Template-specific design would be loaded here
            state.documentData.updatedAt = new Date().toISOString();
          });
        },

        // Select section
        selectSection: (id) => {
          set((state) => {
            state.selectedSectionId = id;
            if (id) {
              state.isEditorOpen = true;
            }
          });
        },

        // Toggle preview mode
        togglePreviewMode: () => {
          set((state) => {
            state.isPreviewMode = !state.isPreviewMode;
          });
        },

        // Toggle sidebar
        toggleSidebar: () => {
          set((state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
          });
        },

        // Open editor
        openEditor: () => {
          set((state) => {
            state.isEditorOpen = true;
          });
        },

        // Close editor
        closeEditor: () => {
          set((state) => {
            state.isEditorOpen = false;
            state.selectedSectionId = null;
          });
        },

        // Undo
        undo: () => {
          const { undoStack, documentData } = get();
          if (undoStack.length === 0) return;

          set((state) => {
            const previous = state.undoStack.pop();
            if (previous && state.documentData) {
              state.redoStack.push(JSON.parse(JSON.stringify(state.documentData)));
              if (state.redoStack.length > MAX_HISTORY_SIZE) {
                state.redoStack.shift();
              }
              state.documentData = previous;
            }
          });
        },

        // Redo
        redo: () => {
          const { redoStack } = get();
          if (redoStack.length === 0) return;

          set((state) => {
            const next = state.redoStack.pop();
            if (next && state.documentData) {
              state.undoStack.push(JSON.parse(JSON.stringify(state.documentData)));
              if (state.undoStack.length > MAX_HISTORY_SIZE) {
                state.undoStack.shift();
              }
              state.documentData = next;
            }
          });
        },

        // Save to history (for undo)
        saveToHistory: () => {
          const { documentData } = get();
          if (!documentData) return;

          set((state) => {
            state.undoStack.push(JSON.parse(JSON.stringify(documentData)));
            if (state.undoStack.length > MAX_HISTORY_SIZE) {
              state.undoStack.shift();
            }
            state.redoStack = [];
          });
        },

        // Validate document
        validateDocument: () => {
          const { documentData, activeVariant } = get();
          const warnings: ValidationWarning[] = [];

          if (!documentData) {
            warnings.push({
              id: 'no-document',
              type: 'error',
              message: 'No document loaded',
              autoFixable: false,
            });
            return warnings;
          }

          const config = VARIANT_CONFIG[activeVariant];

          // Check contact info
          if (!documentData.contact.fullName) {
            warnings.push({
              id: 'missing-name',
              type: 'error',
              message: 'Full name is required',
              section: 'contact',
              suggestion: 'Add your full name to the contact section',
              autoFixable: false,
            });
          }

          if (!documentData.contact.email) {
            warnings.push({
              id: 'missing-email',
              type: 'error',
              message: 'Email is required',
              section: 'contact',
              suggestion: 'Add your email address',
              autoFixable: false,
            });
          }

          // Check required sections
          config.requiredSections.forEach(type => {
            const section = documentData.sections.find(s => s.type === type);
            if (!section) {
              warnings.push({
                id: `missing-${type}`,
                type: 'error',
                message: `${type.charAt(0).toUpperCase() + type.slice(1)} section is required`,
                suggestion: `Add a ${type} section to your ${activeVariant}`,
                autoFixable: true,
              });
            }
          });

          // Check for empty sections
          documentData.sections.forEach(section => {
            if (section.type === 'experience') {
              if ((section as any).content.entries.length === 0) {
                warnings.push({
                  id: `empty-${section.id}`,
                  type: 'warning',
                  section: section.id,
                  message: 'Experience section has no entries',
                  suggestion: 'Add at least one work experience entry',
                  autoFixable: false,
                });
              }
            }
            if (section.type === 'summary') {
              if (!(section as any).content.text) {
                warnings.push({
                  id: `empty-${section.id}`,
                  type: 'warning',
                  section: section.id,
                  message: 'Summary section is empty',
                  suggestion: 'Write a professional summary',
                  autoFixable: false,
                });
              }
            }
          });

          // Variant-specific validations
          if (activeVariant === 'resume') {
            // Check page count (estimate)
            const wordCount = JSON.stringify(documentData).length / 5;
            if (wordCount > 1500) {
              warnings.push({
                id: 'too-long',
                type: 'warning',
                message: 'Resume may exceed 2 pages',
                suggestion: 'Consider trimming content to fit on 1-2 pages',
                autoFixable: false,
              });
            }
          }

          if (activeVariant === 'cover_letter') {
            // Check paragraph count
            const paragraphs = documentData.sections.filter(s => s.type === 'paragraph');
            if (paragraphs.length < 3) {
              warnings.push({
                id: 'few-paragraphs',
                type: 'info',
                message: 'Cover letter typically has 3-4 paragraphs',
                suggestion: 'Add opening, body, and closing paragraphs',
                autoFixable: false,
              });
            }
          }

          set((state) => {
            state.warnings = warnings;
          });

          return warnings;
        },

        // Clear warnings
        clearWarnings: () => {
          set((state) => {
            state.warnings = [];
          });
        },

        // Loading states
        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setSaving: (saving) => {
          set((state) => {
            state.isSaving = saving;
          });
        },

        setExporting: (exporting) => {
          set((state) => {
            state.isExporting = exporting;
          });
        },
      })),
      {
        name: 'builder-storage',
        partialize: (state) => ({
          documentData: state.documentData,
          activeVariant: state.activeVariant,
        }),
      }
    ),
    { name: 'BuilderStore' }
  )
);

// Selectors for optimized re-renders
export const useDocumentData = () => useBuilderStore((state) => state.documentData);
export const useActiveVariant = () => useBuilderStore((state) => state.activeVariant);
export const useSelectedSectionId = () => useBuilderStore((state) => state.selectedSectionId);
export const useSections = () => useBuilderStore((state) => state.documentData?.sections ?? []);
export const useContact = () => useBuilderStore((state) => state.documentData?.contact);
export const useDesign = () => useBuilderStore((state) => state.documentData?.design);
export const useWarnings = () => useBuilderStore((state) => state.warnings);
export const useCanUndo = () => useBuilderStore((state) => state.undoStack.length > 0);
export const useCanRedo = () => useBuilderStore((state) => state.redoStack.length > 0);
