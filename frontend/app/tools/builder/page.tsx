/**
 * Document Builder Page
 * Main page for the Resume/CV/Cover Letter builder
 * Enhanced UI/UX with smooth animations and modern design
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useBuilderStore, useDocumentData } from '@/store/builderStore';
import { BuilderToolbar } from '@/components/builder/BuilderToolbar';
import { SectionSidebar } from '@/components/builder/SectionSidebar';
import { BuilderCanvas } from '@/components/builder/BuilderCanvas';
import { SectionEditor } from '@/components/builder/SectionEditor';
import { LivePreview } from '@/components/builder/LivePreview';
import { DocumentVariant, VARIANT_CONFIG } from '@/types/document';
import {
  FileText,
  BookOpen,
  AlignLeft,
  ArrowRight,
  Sparkles,
  Check,
  Zap,
  Shield,
  Eye,
  Download,
  MousePointerClick,
  ChevronRight,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Variant icons with enhanced styling
const VARIANT_ICONS: Record<DocumentVariant, React.ComponentType<any>> = {
  resume: FileText,
  cv: BookOpen,
  cover_letter: AlignLeft,
};

// Variant gradients for visual distinction
const VARIANT_GRADIENTS: Record<DocumentVariant, string> = {
  resume: 'from-blue-500 to-indigo-600',
  cv: 'from-purple-500 to-pink-600',
  cover_letter: 'from-emerald-500 to-teal-600',
};

const VARIANT_RING_COLORS: Record<DocumentVariant, string> = {
  resume: 'ring-blue-500',
  cv: 'ring-purple-500',
  cover_letter: 'ring-emerald-500',
};

export default function BuilderPage() {
  const documentData = useDocumentData();
  const { initializeDocument, toggleSidebar, isSidebarOpen, isEditorOpen, closeEditor } = useBuilderStore();
  
  const [showPreview, setShowPreview] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close editor
      if (e.key === 'Escape' && isEditorOpen) {
        closeEditor();
      }
      // Ctrl/Cmd + P to toggle preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setShowPreview(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen, closeEditor]);

  // Show loading during hydration with animated spinner
  if (!isHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
            <FileText className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 font-medium animate-pulse">Loading builder...</p>
        </div>
      </div>
    );
  }

  // Show document type selector if no document
  if (!documentData) {
    return <DocumentTypeSelector onSelect={initializeDocument} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <BuilderToolbar
        onTogglePreview={() => setShowPreview(!showPreview)}
        isPreviewVisible={showPreview}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section Sidebar with smooth transition */}
        <div className={cn(
          "transition-all duration-300 ease-in-out flex-shrink-0",
          isSidebarOpen ? "w-72" : "w-12"
        )}>
          <SectionSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        </div>

        {/* Builder Canvas - Flex grow to fill space */}
        <div className="flex-1 min-w-0">
          <BuilderCanvas onAddSection={() => {}} />
        </div>

        {/* Section Editor - Slide in from right */}
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0",
          isEditorOpen ? "w-96" : "w-0"
        )}>
          <SectionEditor isOpen={isEditorOpen} onClose={closeEditor} />
        </div>

        {/* Live Preview - Conditional visibility with transition */}
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden border-l border-gray-200 flex-shrink-0",
          showPreview && !isEditorOpen ? "w-[420px]" : "w-0"
        )}>
          <LivePreview isVisible={showPreview && !isEditorOpen} />
        </div>
      </div>
    </div>
  );
}

// Document Type Selector Component
interface DocumentTypeSelectorProps {
  onSelect: (variant: DocumentVariant) => void;
}

function DocumentTypeSelector({ onSelect }: DocumentTypeSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<DocumentVariant | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleContinue = () => {
    if (selectedVariant) {
      setIsAnimating(true);
      setTimeout(() => {
        onSelect(selectedVariant);
      }, 300);
    }
  };

  const features = [
    { label: 'Drag & Drop Editor', icon: MousePointerClick, color: 'text-blue-600' },
    { label: 'ATS-Friendly Format', icon: Shield, color: 'text-green-600' },
    { label: 'Real-Time Preview', icon: Eye, color: 'text-purple-600' },
    { label: 'PDF Export', icon: Download, color: 'text-orange-600' },
  ];

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 md:p-8 transition-all duration-300",
      isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100",
      mounted ? "opacity-100" : "opacity-0"
    )}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-4xl w-full">
        {/* Header */}
        <div className={cn(
          "text-center mb-10 transition-all duration-500 delay-100",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-blue-700 rounded-full text-sm font-medium mb-6 shadow-sm border border-blue-100">
            <Sparkles className="w-4 h-4" />
            AI-Powered Document Builder
            <span className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs rounded-full ml-1">
              New
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
            What would you like to create?
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto text-lg">
            Choose the type of document you want to build. Our intelligent builder
            will guide you through creating a professional, ATS-friendly document.
          </p>
        </div>

        {/* Variant Cards */}
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 transition-all duration-500 delay-200",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          {(Object.keys(VARIANT_CONFIG) as DocumentVariant[]).map((variant, index) => {
            const config = VARIANT_CONFIG[variant];
            const Icon = VARIANT_ICONS[variant];
            const isSelected = selectedVariant === variant;
            const gradient = VARIANT_GRADIENTS[variant];

            return (
              <button
                key={variant}
                onClick={() => setSelectedVariant(variant)}
                className={cn(
                  "group relative p-6 rounded-2xl text-left transition-all duration-300 transform",
                  "bg-white/80 backdrop-blur-sm border-2 shadow-sm hover:shadow-xl",
                  isSelected
                    ? `border-transparent ring-2 ring-offset-2 ${VARIANT_RING_COLORS[variant]}`
                    : 'border-gray-100 hover:border-gray-200',
                  "hover:-translate-y-1"
                )}
              >
                {/* Selected Indicator with animation */}
                <div className={cn(
                  "absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
                  isSelected
                    ? `bg-gradient-to-r ${gradient} scale-100 opacity-100`
                    : "scale-75 opacity-0"
                )}>
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>

                {/* Icon with gradient background */}
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300",
                  isSelected
                    ? `bg-gradient-to-br ${gradient}`
                    : "bg-gray-100 group-hover:bg-gray-200"
                )}>
                  <Icon className={cn(
                    "w-7 h-7 transition-colors duration-300",
                    isSelected ? "text-white" : "text-gray-600"
                  )} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  {config.name}
                  {variant === 'resume' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                      <Star className="w-3 h-3" fill="currentColor" />
                      Popular
                    </span>
                  )}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{config.description}</p>

                {/* Features badges */}
                <div className="flex flex-wrap gap-2">
                  {variant === 'resume' && (
                    <>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                        <Zap className="w-3 h-3" />
                        1-2 pages
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        ATS-optimized
                      </span>
                    </>
                  )}
                  {variant === 'cv' && (
                    <>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                        <FileText className="w-3 h-3" />
                        Unlimited length
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-medium">
                        <BookOpen className="w-3 h-3" />
                        Publications
                      </span>
                    </>
                  )}
                  {variant === 'cover_letter' && (
                    <>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                        <AlignLeft className="w-3 h-3" />
                        1 page
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium">
                        <Sparkles className="w-3 h-3" />
                        Personalized
                      </span>
                    </>
                  )}
                </div>

                {/* Hover indicator */}
                <div className={cn(
                  "absolute bottom-4 right-4 transition-all duration-300",
                  isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0"
                )}>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className={cn(
          "flex justify-center mb-12 transition-all duration-500 delay-300",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <button
            onClick={handleContinue}
            disabled={!selectedVariant}
            className={cn(
              "group flex items-center gap-3 px-10 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-300",
              selectedVariant
                ? `bg-gradient-to-r ${VARIANT_GRADIENTS[selectedVariant]} hover:shadow-2xl hover:scale-105 shadow-lg`
                : 'bg-gray-300 cursor-not-allowed'
            )}
          >
            <span>Start Building</span>
            <ArrowRight className={cn(
              "w-5 h-5 transition-transform duration-300",
              selectedVariant && "group-hover:translate-x-1"
            )} />
          </button>
        </div>

        {/* Features Grid */}
        <div className={cn(
          "bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 shadow-sm transition-all duration-500 delay-400",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h4 className="text-sm font-semibold text-gray-900 text-center mb-6 uppercase tracking-wider">
            All documents include
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <div 
                  key={feature.label} 
                  className="group flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-all duration-300"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110",
                    "bg-gradient-to-br from-gray-50 to-gray-100"
                  )}>
                    <FeatureIcon className={cn("w-6 h-6", feature.color)} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center">{feature.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pro tip */}
        <p className={cn(
          "text-center text-sm text-gray-500 mt-6 transition-all duration-500 delay-500",
          mounted ? "opacity-100" : "opacity-0"
        )}>
          💡 Tip: Press <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+P</kbd> to toggle preview anytime
        </p>
      </div>
    </div>
  );
}
