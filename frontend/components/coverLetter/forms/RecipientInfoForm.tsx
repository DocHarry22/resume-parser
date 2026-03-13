'use client';

import React from 'react';
import { RecipientInfo } from '@/types/coverLetter';

interface RecipientInfoFormProps {
  recipient: RecipientInfo;
  onChange: (recipient: RecipientInfo) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function RecipientInfoForm({ recipient, onChange, onNext, onPrevious }: RecipientInfoFormProps) {
  const handleChange = (field: keyof RecipientInfo, value: string) => {
    onChange({ ...recipient, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recipient Information</h2>
        <p className="text-gray-600">
          Who are you sending this cover letter to? Adding a name makes it more personal.
        </p>
      </div>

      {/* Recipient Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hiring Manager's Name
            </label>
            <input
              type="text"
              value={recipient.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Jane Smith"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              If unknown, leave blank and we'll use "Dear Hiring Manager"
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={recipient.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="HR Director"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={recipient.company}
            onChange={(e) => handleChange('company', e.target.value)}
            placeholder="Acme Corporation"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <input
            type="text"
            value={recipient.department}
            onChange={(e) => handleChange('department', e.target.value)}
            placeholder="Human Resources"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Company Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Company Address</h3>
        <p className="text-sm text-gray-600">
          Optional - Include if you're sending a formal letter or mailing a physical copy.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <input
            type="text"
            value={recipient.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="456 Corporate Blvd, Suite 100"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={recipient.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="New York"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State/Province
            </label>
            <input
              type="text"
              value={recipient.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="NY"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zip/Postal Code
            </label>
            <input
              type="text"
              value={recipient.zip_code}
              onChange={(e) => handleChange('zip_code', e.target.value)}
              placeholder="10001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              value={recipient.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="United States"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-blue-600 text-xl">🔍</div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Finding the Hiring Manager</h4>
            <p className="text-sm text-blue-700">
              Try LinkedIn, the company website, or the job posting to find the hiring manager's name. 
              Addressing someone by name significantly increases your response rate.
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
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"
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

export default RecipientInfoForm;
