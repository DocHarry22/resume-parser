'use client';

import React, { useState } from 'react';
import {
  ContactInfo,
  ExperienceEntry,
  EducationEntry,
  SkillCategory,
  CertificationEntry,
  ProjectEntry,
} from '@/types/builder';

// Contact Section Editor
interface ContactEditorProps {
  contact: ContactInfo | undefined;
  onChange: (contact: ContactInfo) => void;
}

export function ContactEditor({ contact, onChange }: ContactEditorProps) {
  const [formData, setFormData] = useState<ContactInfo>(
    contact || {
      full_name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: '',
    }
  );

  const handleChange = (field: keyof ContactInfo, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#cccccc] mb-4">Contact Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#cccccc] mb-2">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#cccccc] mb-2">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#cccccc] mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
            placeholder="+1-555-0123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#cccccc] mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
            placeholder="San Francisco, CA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#cccccc] mb-2">
            LinkedIn
          </label>
          <input
            type="url"
            value={formData.linkedin || ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
            placeholder="linkedin.com/in/johndoe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#cccccc] mb-2">
            GitHub
          </label>
          <input
            type="url"
            value={formData.github || ''}
            onChange={(e) => handleChange('github', e.target.value)}
            className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
            placeholder="github.com/johndoe"
          />
        </div>
      </div>
    </div>
  );
}

// Experience Entry Editor
interface ExperienceEditorProps {
  experience: ExperienceEntry[];
  onChange: (experience: ExperienceEntry[]) => void;
}

export function ExperienceEditor({ experience, onChange }: ExperienceEditorProps) {
  const addExperience = () => {
    const newExp: ExperienceEntry = {
      company: '',
      position: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: [''],
      achievements: [],
    };
    onChange([...experience, newExp]);
  };

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: any) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeExperience = (index: number) => {
    onChange(experience.filter((_, i) => i !== index));
  };

  const addBullet = (expIndex: number) => {
    const updated = [...experience];
    updated[expIndex].description.push('');
    onChange(updated);
  };

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const updated = [...experience];
    updated[expIndex].description[bulletIndex] = value;
    onChange(updated);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...experience];
    updated[expIndex].description = updated[expIndex].description.filter((_, i) => i !== bulletIndex);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#cccccc]">Work Experience</h3>
        <button
          onClick={addExperience}
          className="px-4 py-2 bg-[#00d9ff] hover:bg-[#00c3e6] text-[#1e1e1e] rounded font-medium text-sm transition-colors"
        >
          + Add Experience
        </button>
      </div>

      {experience.length === 0 ? (
        <p className="text-[#858585] text-sm">No experience added yet. Click "Add Experience" to get started.</p>
      ) : (
        <div className="space-y-6">
          {experience.map((exp, expIndex) => (
            <div key={expIndex} className="border border-[#3e3e42] rounded-lg p-4 bg-[#252526]">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-md font-semibold text-[#9cdcfe]">Experience #{expIndex + 1}</h4>
                <button
                  onClick={() => removeExperience(expIndex)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-2">Company *</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(expIndex, 'company', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
                    placeholder="Tech Corp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-2">Position *</label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateExperience(expIndex, 'position', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-2">Start Date *</label>
                  <input
                    type="text"
                    value={exp.start_date}
                    onChange={(e) => updateExperience(expIndex, 'start_date', e.target.value)}
                    className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
                    placeholder="2020-01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cccccc] mb-2">End Date</label>
                  <input
                    type="text"
                    value={exp.end_date || ''}
                    onChange={(e) => updateExperience(expIndex, 'end_date', e.target.value)}
                    disabled={exp.current}
                    className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff] disabled:opacity-50"
                    placeholder="2023-12"
                  />
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => updateExperience(expIndex, 'current', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-[#cccccc]">Currently working here</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#cccccc] mb-2">Responsibilities</label>
                <div className="space-y-2">
                  {exp.description.map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => updateBullet(expIndex, bulletIndex, e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
                        placeholder="Led development of..."
                      />
                      <button
                        onClick={() => removeBullet(expIndex, bulletIndex)}
                        className="text-red-400 hover:text-red-300 px-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addBullet(expIndex)}
                    className="text-[#00d9ff] hover:text-[#00c3e6] text-sm"
                  >
                    + Add bullet point
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Skills Editor
interface SkillsEditorProps {
  skills: SkillCategory[];
  onChange: (skills: SkillCategory[]) => void;
}

export function SkillsEditor({ skills, onChange }: SkillsEditorProps) {
  const addCategory = () => {
    onChange([...skills, { category: '', skills: [] }]);
  };

  const updateCategory = (index: number, category: string) => {
    const updated = [...skills];
    updated[index].category = category;
    onChange(updated);
  };

  const updateSkills = (index: number, skillsStr: string) => {
    const updated = [...skills];
    updated[index].skills = skillsStr.split(',').map(s => s.trim()).filter(s => s);
    onChange(updated);
  };

  const removeCategory = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#cccccc]">Skills</h3>
        <button
          onClick={addCategory}
          className="px-4 py-2 bg-[#00d9ff] hover:bg-[#00c3e6] text-[#1e1e1e] rounded font-medium text-sm transition-colors"
        >
          + Add Category
        </button>
      </div>

      {skills.length === 0 ? (
        <p className="text-[#858585] text-sm">No skills added yet. Click "Add Category" to organize your skills.</p>
      ) : (
        <div className="space-y-4">
          {skills.map((skillCat, index) => (
            <div key={index} className="border border-[#3e3e42] rounded-lg p-4 bg-[#252526]">
              <div className="flex justify-between items-start mb-3">
                <input
                  type="text"
                  value={skillCat.category}
                  onChange={(e) => updateCategory(index, e.target.value)}
                  className="flex-1 mr-4 px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
                  placeholder="Category (e.g., Programming Languages)"
                />
                <button
                  onClick={() => removeCategory(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                value={skillCat.skills.join(', ')}
                onChange={(e) => updateSkills(index, e.target.value)}
                className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:border-[#00d9ff]"
                placeholder="Python, JavaScript, TypeScript (comma-separated)"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
