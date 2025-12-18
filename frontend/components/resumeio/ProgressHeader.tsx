'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Download, FileText, Sparkles, MoreHorizontal, ChevronLeft, Save, Copy, Trash2, FileDown, Settings, HelpCircle, Printer } from 'lucide-react';

interface ProgressHeaderProps {
  title: string;
  progress: number; // 0-100
  lastSaved?: Date | null;
  isSaving?: boolean;
  isExporting?: boolean;
  onBack?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onAIEnhance?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onExportJSON?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
}

export function ProgressHeader({
  title,
  progress,
  lastSaved,
  isSaving,
  isExporting,
  onBack,
  onSave,
  onExport,
  onAIEnhance,
  onDuplicate,
  onDelete,
  onPrint,
  onExportJSON,
  onSettings,
  onHelp,
}: ProgressHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const getProgressColor = () => {
    if (progress >= 80) return 'from-green-500 to-emerald-500';
    if (progress >= 50) return 'from-blue-500 to-indigo-500';
    if (progress >= 25) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getProgressText = () => {
    if (progress >= 80) return 'Excellent!';
    if (progress >= 50) return 'Good progress';
    if (progress >= 25) return 'Keep going';
    return 'Just started';
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="font-semibold text-gray-900 text-lg">{title}</h1>
            <div className="flex items-center gap-3 mt-1">
              {/* Progress Badge */}
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', getProgressColor())}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500">{progress}%</span>
              </div>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{getProgressText()}</span>
              
              {/* Last saved */}
              {lastSaved && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">
                    {isSaving ? 'Saving...' : `Saved ${formatLastSaved(lastSaved)}`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onAIEnhance && (
            <button
              onClick={onAIEnhance}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              AI Enhance
            </button>
          )}
          
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          )}

          {/* More Options Dropdown */}
          <div ref={menuRef} className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                {/* Duplicate */}
                <button
                  onClick={() => { onDuplicate?.(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                  Duplicate Resume
                </button>

                {/* Print */}
                <button
                  onClick={() => { onPrint?.(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Printer className="w-4 h-4 text-gray-400" />
                  Print
                </button>

                {/* Export as JSON */}
                <button
                  onClick={() => { onExportJSON?.(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileDown className="w-4 h-4 text-gray-400" />
                  Export as JSON
                </button>

                <div className="my-2 border-t border-gray-100" />

                {/* Settings */}
                <button
                  onClick={() => { onSettings?.(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </button>

                {/* Help */}
                <button
                  onClick={() => { onHelp?.(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  Help & Support
                </button>

                <div className="my-2 border-t border-gray-100" />

                {/* Delete */}
                <button
                  onClick={() => { onDelete?.(); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Resume
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Score Card Component
interface ScoreCardProps {
  score: number;
  label: string;
  description?: string;
  suggestions?: number;
  onClick?: () => void;
}

export function ScoreCard({ score, label, description, suggestions, onClick }: ScoreCardProps) {
  const getScoreColor = () => {
    if (score >= 80) return { ring: 'ring-green-500', text: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 50) return { ring: 'ring-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 25) return { ring: 'ring-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' };
    return { ring: 'ring-red-500', text: 'text-red-600', bg: 'bg-red-50' };
  };

  const colors = getScoreColor();

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all',
        onClick && 'cursor-pointer hover:shadow-sm'
      )}
    >
      {/* Score Ring */}
      <div className={cn('relative w-14 h-14 rounded-full ring-4', colors.ring, colors.bg)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-lg font-bold', colors.text)}>{score}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 text-left">
        <h4 className="font-semibold text-gray-900">{label}</h4>
        {description && <p className="text-sm text-gray-500">{description}</p>}
        {suggestions !== undefined && suggestions > 0 && (
          <p className="text-xs text-amber-600 mt-1">{suggestions} suggestions available</p>
        )}
      </div>

      {/* Arrow */}
      {onClick && (
        <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
      )}
    </button>
  );
}

// Completion Checklist
interface ChecklistItem {
  id: string;
  label: string;
  isComplete: boolean;
  onClick?: () => void;
}

interface CompletionChecklistProps {
  items: ChecklistItem[];
  title?: string;
}

export function CompletionChecklist({ items, title = 'Completion Checklist' }: CompletionChecklistProps) {
  const completedCount = items.filter(i => i.isComplete).length;
  const progress = Math.round((completedCount / items.length) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="text-sm font-medium text-gray-500">{completedCount}/{items.length}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                item.isComplete
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300'
              )}
            >
              {item.isComplete && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <span
              className={cn(
                'text-sm',
                item.isComplete ? 'text-gray-500 line-through' : 'text-gray-900'
              )}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Tips Card
interface TipsCardProps {
  title: string;
  tips: string[];
  icon?: React.ReactNode;
}

export function TipsCard({ title, tips, icon }: TipsCardProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
          {icon || <Sparkles className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-semibold text-blue-900 mb-2">{title}</h4>
          <ul className="space-y-1.5">
            {tips.map((tip, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
