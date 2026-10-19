'use client';

import React from 'react';
import { IS_LOCAL_STORAGE } from '@/lib/apiConfig';
import { JobDetails } from '@/types/coverLetter';

interface JobDetailsFormProps {
  jobDetails: JobDetails;
  onChange: (jobDetails: JobDetails) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function JobDetailsForm({ jobDetails, onChange, onNext, onPrevious }: JobDetailsFormProps) {
  const handleChange = (field: keyof JobDetails, value: string) => {
    onChange({ ...jobDetails, [field]: value });
  };

  const isValid = jobDetails.job_title.trim() && jobDetails.company_name.trim();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Details</h2>
        <p className="text-gray-600">
          Tell us about the position you're applying for. This helps us tailor your cover letter.
        </p>
      </div>

      {/* Required Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            aria-label="job title"
            value={jobDetails.job_title}
            onChange={(e) => handleChange('job_title', e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            aria-label="company name"
            value={jobDetails.company_name}
            onChange={(e) => handleChange('company_name', e.target.value)}
            placeholder="e.g., Google"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <input
            type="text"
            aria-label="department"
            value={jobDetails.department}
            onChange={(e) => handleChange('department', e.target.value)}
            placeholder="e.g., Engineering, Marketing"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Reference Number
          </label>
          <input
            type="text"
            aria-label="reference number"
            value={jobDetails.reference_number}
            onChange={(e) => handleChange('reference_number', e.target.value)}
            placeholder="e.g., JOB-2024-12345"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Job Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Description
          <span className="text-gray-500 font-normal ml-2">(Paste the full job posting for more relevant writing ideas)</span>
        </label>
        <textarea
          aria-label="job description"
          value={jobDetails.job_description}
          onChange={(e) => handleChange('job_description', e.target.value)}
          placeholder="Paste the job description here. This helps us generate more relevant content suggestions and match your skills to the job requirements."
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          {IS_LOCAL_STORAGE ? 'Use these requirements to tailor your letter. Writing ideas are guided starting points and do not use external AI.' : 'Our AI will analyze this to highlight matching keywords and suggest relevant content.'}
        </p>
      </div>

      {/* AI Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-blue-600 text-xl">💡</div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Pro Tip</h4>
            <p className="text-sm text-blue-700">
              {IS_LOCAL_STORAGE ? 'Read the job requirements carefully, then add honest examples of how your experience relates to the role.' : 'Including the full job description helps our AI identify key requirements and suggest relevant phrases that will resonate with the hiring manager.'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default JobDetailsForm;
