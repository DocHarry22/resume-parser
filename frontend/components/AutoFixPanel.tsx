'use client';

import React, { useState } from 'react';
import { AutoFix, FixType } from '@/types/builder';
import { applyAutoFix } from '@/lib/apiClient';

interface AutoFixCardProps {
  fix: AutoFix;
  resumeId: string;
  onFixApplied: () => void;
}

export function AutoFixCard({ fix, resumeId, onFixApplied }: AutoFixCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFixIcon = () => {
    // Flag icon for critical issues, warning for others
    const isCritical = [FixType.CONTACT, FixType.SUMMARY, FixType.LENGTH].includes(fix.fix_type);
    
    return isCritical ? (
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
    ) : (
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  const getFixBadge = () => {
    const isCritical = [FixType.CONTACT, FixType.SUMMARY, FixType.LENGTH].includes(fix.fix_type);
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
        isCritical 
          ? 'bg-red-100 text-red-700 border border-red-200' 
          : 'bg-amber-100 text-amber-700 border border-amber-200'
      }`}>
        {isCritical ? '⚠️ Critical' : '💡 Suggestion'}
      </span>
    );
  };

  const handleApplyFix = async () => {
    if (!fix.auto_applicable) {
      setShowDetails(true);
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      await applyAutoFix(resumeId, fix);
      onFixApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply fix');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        {getFixIcon()}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {getFixBadge()}
          </div>
          
          <p className="text-gray-700 text-sm mb-3 leading-relaxed">
            {fix.description}
          </p>

          {showDetails && (
            <div className="mb-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-blue-700 text-xs font-bold mb-2">Suggested Action:</p>
              {fix.suggested_value && (
                <p className="text-gray-700 text-sm mb-2">{fix.suggested_value}</p>
              )}
              
              {fix.metadata?.examples && Array.isArray(fix.metadata.examples) && (
                <div className="mt-2">
                  <p className="text-blue-700 text-xs font-bold mb-1">Examples:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {fix.metadata.examples.map((example: string, idx: number) => (
                      <li key={idx} className="text-gray-700 text-sm">{example}</li>
                    ))}
                  </ul>
                </div>
              )}

              {fix.metadata?.suggested_verbs && (
                <div className="mt-2">
                  <p className="text-blue-700 text-xs font-bold mb-1">Suggested Action Verbs:</p>
                  <p className="text-gray-700 text-sm">
                    {fix.metadata.suggested_verbs.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            {fix.auto_applicable ? (
              <button
                onClick={handleApplyFix}
                disabled={isApplying}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {isApplying ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Applying...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Auto-Fix
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Manual Fix Required
              </button>
            )}
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showDetails ? 'Hide Details' : 'Learn More'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AutoFixPanelProps {
  fixes: AutoFix[];
  resumeId: string;
  overallScore: number;
  onFixApplied: () => void;
}

export function AutoFixPanel({ fixes, resumeId, overallScore, onFixApplied }: AutoFixPanelProps) {
  if (fixes.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-800">Great Job!</h3>
            <p className="text-green-700">No issues found. Your resume looks excellent!</p>
          </div>
        </div>
      </div>
    );
  }

  const criticalCount = fixes.filter(f => 
    [FixType.CONTACT, FixType.SUMMARY, FixType.LENGTH].includes(f.fix_type)
  ).length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Improvement Suggestions
            </h2>
            <p className="text-sm text-gray-500">
              {fixes.length} {fixes.length === 1 ? 'item' : 'items'}
              {criticalCount > 0 && (
                <span className="ml-2 text-red-600 font-medium">
                  ({criticalCount} critical)
                </span>
              )}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{Math.round(overallScore)}</div>
            <div className="text-xs text-gray-500 font-medium">Resume Score</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {fixes.map((fix, index) => (
          <AutoFixCard
            key={`${fix.fix_type}-${fix.section}-${index}`}
            fix={fix}
            resumeId={resumeId}
            onFixApplied={onFixApplied}
          />
        ))}
      </div>
    </div>
  );
}
