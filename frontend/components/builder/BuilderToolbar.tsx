/**
 * BuilderToolbar Component
 * Top toolbar with undo/redo, template, font, layout, and export controls
 * Enhanced with better visual design and micro-interactions
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Columns,
  Type,
  Palette,
  Download,
  ScanSearch,
  Save,
  MoreHorizontal,
  ChevronDown,
  Check,
  Loader2,
  FileText,
  BookOpen,
  AlignLeft,
  PanelRight,
  Eye,
  Layout,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useBuilderStore,
  useDocumentData,
  useActiveVariant,
  useCanUndo,
  useCanRedo,
  useDesign,
} from '@/store/builderStore';
import {
  FontFamily,
  ColorScheme,
  LayoutType,
  FONT_CONFIG,
  COLOR_SCHEMES,
  VARIANT_CONFIG,
  DocumentVariant,
} from '@/types/document';

interface BuilderToolbarProps {
  onTogglePreview: () => void;
  isPreviewVisible: boolean;
}

export function BuilderToolbar({ onTogglePreview, isPreviewVisible }: BuilderToolbarProps) {
  const documentData = useDocumentData();
  const activeVariant = useActiveVariant();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const design = useDesign();
  const {
    undo,
    redo,
    setFont,
    setColor,
    setLayout,
    validateDocument,
    setExporting,
    isExporting,
    isSaving,
  } = useBuilderStore();

  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Handle ATS scan
  const handleAtsScan = async () => {
    if (!documentData) return;
    setIsScanning(true);
    try {
      // Call ATS scan API
      const response = await fetch('/api/scanner/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: documentData }),
      });
      const result = await response.json();
      // Handle scan result (show in UI)
      console.log('ATS Scan Result:', result);
    } catch (error) {
      console.error('ATS Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle PDF export
  const handleExportPdf = async () => {
    if (!documentData) return;
    
    // Validate first
    const warnings = validateDocument();
    const errors = warnings.filter((w) => w.type === 'error');
    if (errors.length > 0) {
      alert('Please fix errors before exporting:\n' + errors.map((e) => e.message).join('\n'));
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/render/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: documentData }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentData.title || 'document'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  if (!documentData) {
    return null;
  }

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      {/* Left Section - Undo/Redo & Document Info */}
      <div className="flex items-center gap-4">
        {/* Undo/Redo - Enhanced */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={cn(
              'p-2 rounded-md transition-all duration-200',
              canUndo
                ? 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                : 'text-gray-300 cursor-not-allowed'
            )}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={cn(
              'p-2 rounded-md transition-all duration-200',
              canRedo
                ? 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                : 'text-gray-300 cursor-not-allowed'
            )}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Document Title - Enhanced */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">
              {documentData.title}
            </span>
            <div className="flex items-center gap-2">
              {isSaving ? (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Center Section - Design Controls - Enhanced */}
      <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
        {/* Font Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFontMenu(!showFontMenu);
              setShowColorMenu(false);
              setShowLayoutMenu(false);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200",
              showFontMenu 
                ? "bg-white text-blue-700 shadow-sm" 
                : "text-gray-700 hover:bg-white hover:shadow-sm"
            )}
          >
            <Type className="w-4 h-4" />
            <span className="font-medium">{FONT_CONFIG[design?.font || 'inter'].name}</span>
            <ChevronDown className={cn("w-3 h-3 transition-transform", showFontMenu && "rotate-180")} />
          </button>

          {showFontMenu && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Font Family
              </div>
              {(Object.entries(FONT_CONFIG) as [FontFamily, typeof FONT_CONFIG[FontFamily]][]).map(
                ([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFont(key);
                      setShowFontMenu(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all duration-200',
                      design?.font === key
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                    style={{ fontFamily: config.stack }}
                  >
                    <span>{config.name}</span>
                    {design?.font === key && <Check className="w-4 h-4" />}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Color Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowColorMenu(!showColorMenu);
              setShowFontMenu(false);
              setShowLayoutMenu(false);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200",
              showColorMenu 
                ? "bg-white text-blue-700 shadow-sm" 
                : "text-gray-700 hover:bg-white hover:shadow-sm"
            )}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{
                backgroundColor: COLOR_SCHEMES[design?.color || 'professional'].primary,
              }}
            />
            <span className="font-medium capitalize">{design?.color || 'Professional'}</span>
            <ChevronDown className={cn("w-3 h-3 transition-transform", showColorMenu && "rotate-180")} />
          </button>

          {showColorMenu && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Color Scheme
              </div>
              {(Object.entries(COLOR_SCHEMES) as [ColorScheme, typeof COLOR_SCHEMES[ColorScheme]][]).map(
                ([key, colors]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setColor(key);
                      setShowColorMenu(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all duration-200',
                      design?.color === key
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: colors.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: colors.secondary }}
                        />
                      </div>
                      <span className="capitalize">{key}</span>
                    </div>
                    {design?.color === key && <Check className="w-4 h-4" />}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Layout Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLayoutMenu(!showLayoutMenu);
              setShowFontMenu(false);
              setShowColorMenu(false);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200",
              showLayoutMenu 
                ? "bg-white text-blue-700 shadow-sm" 
                : "text-gray-700 hover:bg-white hover:shadow-sm"
            )}
          >
            <Layout className="w-4 h-4" />
            <span className="font-medium">{design?.layout === 'two_column' ? '2 Column' : '1 Column'}</span>
            <ChevronDown className={cn("w-3 h-3 transition-transform", showLayoutMenu && "rotate-180")} />
          </button>

          {showLayoutMenu && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Layout
              </div>
              {(['one_column', 'two_column'] as LayoutType[]).map((layout) => (
                <button
                  key={layout}
                  onClick={() => {
                    setLayout(layout);
                    setShowLayoutMenu(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-all duration-200',
                    design?.layout === layout
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {layout === 'one_column' ? (
                      <div className="w-5 h-5 border-2 border-current rounded flex p-0.5">
                        <div className="flex-1 bg-current opacity-40 rounded-sm" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-current rounded flex gap-0.5 p-0.5">
                        <div className="flex-1 bg-current opacity-40 rounded-sm" />
                        <div className="flex-1 bg-current opacity-40 rounded-sm" />
                      </div>
                    )}
                    <span>{layout === 'two_column' ? '2 Column' : '1 Column'}</span>
                  </div>
                  {design?.layout === layout && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Actions - Enhanced */}
      <div className="flex items-center gap-2">
        {/* Toggle Preview */}
        <button
          onClick={onTogglePreview}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            isPreviewVisible
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          {isPreviewVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>Preview</span>
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {/* ATS Scan - Enhanced */}
        <button
          onClick={handleAtsScan}
          disabled={isScanning}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border',
            isScanning
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          )}
        >
          {isScanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ScanSearch className="w-4 h-4" />
          )}
          <span>ATS Scan</span>
        </button>

        {/* Download PDF - Enhanced */}
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className={cn(
            'flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            isExporting
              ? 'bg-blue-400 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105'
          )}
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Download PDF</span>
        </button>
      </div>

      {/* Click outside to close menus */}
      {(showFontMenu || showColorMenu || showLayoutMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowFontMenu(false);
            setShowColorMenu(false);
            setShowLayoutMenu(false);
          }}
        />
      )}
    </div>
  );
}
