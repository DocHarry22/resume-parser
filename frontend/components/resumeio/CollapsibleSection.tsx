'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, GripVertical, Plus, Trash2, Eye, EyeOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string | number;
  isComplete?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  isDraggable?: boolean;
  dragHandleProps?: Record<string, any>;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  badge,
  isComplete,
  isVisible = true,
  onToggleVisibility,
  isDraggable,
  dragHandleProps,
  className,
}: CollapsibleSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  return (
    <div
      className={cn(
        'bg-white rounded-xl border transition-all duration-200',
        isOpen ? 'border-blue-200 shadow-sm' : 'border-gray-200 hover:border-gray-300',
        !isVisible && 'opacity-50',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-4 cursor-pointer select-none',
          isOpen && 'border-b border-gray-100'
        )}
        onClick={onToggle}
      >
        {/* Drag Handle */}
        {isDraggable && (
          <div
            {...dragHandleProps}
            className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
            isOpen
              ? 'bg-blue-100 text-blue-600'
              : isComplete
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {isComplete && !isOpen ? (
            <Check className="w-5 h-5" />
          ) : (
            icon
          )}
        </div>

        {/* Title & Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {badge !== undefined && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                {badge}
              </span>
            )}
          </div>
          {isComplete && !isOpen && (
            <p className="text-xs text-green-600 mt-0.5">Completed</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onToggleVisibility && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility();
              }}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                isVisible
                  ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  : 'text-orange-500 hover:text-orange-600 hover:bg-orange-50'
              )}
              title={isVisible ? 'Hide section' : 'Show section'}
            >
              {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? `${contentHeight + 50}px` : '0px' }}
      >
        <div ref={contentRef} className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// Collapsible Entry for lists (experience, education, etc.)
interface CollapsibleEntryProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
  isDraggable?: boolean;
  dragHandleProps?: Record<string, any>;
}

export function CollapsibleEntry({
  title,
  subtitle,
  isOpen,
  onToggle,
  onDelete,
  children,
  isDraggable,
  dragHandleProps,
}: CollapsibleEntryProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  return (
    <div
      className={cn(
        'border rounded-xl transition-all duration-200',
        isOpen ? 'border-blue-200 bg-blue-50/30 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={onToggle}
      >
        {isDraggable && (
          <div
            {...dragHandleProps}
            className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">
            {title || 'Untitled'}
          </h4>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          >
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? `${contentHeight + 50}px` : '0px' }}
      >
        <div
          ref={contentRef}
          className={cn(
            'px-4 pb-4 pt-2 border-t',
            isOpen ? 'border-gray-100' : 'border-transparent'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Add Button
interface AddButtonProps {
  onClick: () => void;
  label: string;
  variant?: 'default' | 'dashed';
}

export function AddButton({ onClick, label, variant = 'dashed' }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
        variant === 'dashed'
          ? 'border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50'
          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
      )}
    >
      <Plus className="w-5 h-5" />
      {label}
    </button>
  );
}
