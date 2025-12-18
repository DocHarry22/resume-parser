'use client';

import React, { useState, useCallback } from 'react';
import { Resume, Experience, Education, Skill, Project, Certification, Language } from '../../types/resume';
import { SectionId } from './SidebarNav';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}

function FormField({ label, required, children, hint, error }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full px-4 py-2.5 text-sm border rounded-xl transition-all duration-200 outline-none
        ${error
          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
          : 'border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-300'
        } ${className}`}
      {...props}
    />
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

function TextArea({ error, className = '', ...props }: TextAreaProps) {
  return (
    <textarea
      className={`w-full px-4 py-3 text-sm border rounded-xl transition-all duration-200 outline-none resize-none
        ${error
          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
          : 'border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-300'
        } ${className}`}
      {...props}
    />
  );
}

interface CollapsibleItemProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
  dragHandle?: React.ReactNode;
}

function CollapsibleItem({ title, subtitle, isOpen, onToggle, onDelete, children, dragHandle }: CollapsibleItemProps) {
  return (
    <div className={`border rounded-xl transition-all duration-200 ${isOpen ? 'border-blue-200 bg-blue-50/30 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
      <div 
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={onToggle}
      >
        {dragHandle}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">{title || 'Untitled'}</h4>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-white rounded-b-xl">
          {children}
        </div>
      )}
    </div>
  );
}

interface AddButtonProps {
  onClick: () => void;
  label: string;
}

function AddButton({ onClick, label }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );
}

// Personal Details Form
interface PersonalDetailsFormProps {
  resume: Resume;
  onChange: (updates: Partial<Resume>) => void;
}

export function PersonalDetailsForm({ resume, onChange }: PersonalDetailsFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(resume.photo || null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        onChange({ photo: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Photo Upload */}
      <div className="flex items-start gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl cursor-pointer transition-opacity">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
          {photoPreview && (
            <button
              onClick={() => { setPhotoPreview(null); onChange({ photo: undefined }); }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-gray-700">Profile Photo</p>
          <p className="text-xs text-gray-400">Upload a professional photo. Square images work best.</p>
          <p className="text-xs text-gray-400">Recommended: 200x200px or larger</p>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" required>
          <Input
            value={resume.name?.split(' ')[0] || ''}
            onChange={(e) => {
              const lastName = resume.name?.split(' ').slice(1).join(' ') || '';
              onChange({ name: `${e.target.value} ${lastName}`.trim() });
            }}
            placeholder="John"
          />
        </FormField>
        <FormField label="Last Name" required>
          <Input
            value={resume.name?.split(' ').slice(1).join(' ') || ''}
            onChange={(e) => {
              const firstName = resume.name?.split(' ')[0] || '';
              onChange({ name: `${firstName} ${e.target.value}`.trim() });
            }}
            placeholder="Doe"
          />
        </FormField>
      </div>

      <FormField label="Job Title" hint="Your current or desired job title">
        <Input
          value={resume.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Senior Software Engineer"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Email" required>
          <Input
            type="email"
            value={resume.email || ''}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="john.doe@example.com"
          />
        </FormField>
        <FormField label="Phone">
          <Input
            type="tel"
            value={resume.phone || ''}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </FormField>
      </div>

      <FormField label="Location">
        <Input
          value={resume.location || ''}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder="San Francisco, CA"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="LinkedIn" hint="Your LinkedIn profile URL">
          <Input
            value={resume.linkedin || ''}
            onChange={(e) => onChange({ linkedin: e.target.value })}
            placeholder="linkedin.com/in/johndoe"
          />
        </FormField>
        <FormField label="Website / Portfolio">
          <Input
            value={resume.website || ''}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="johndoe.com"
          />
        </FormField>
      </div>
    </div>
  );
}

// Summary Form
interface SummaryFormProps {
  resume: Resume;
  onChange: (updates: Partial<Resume>) => void;
}

export function SummaryForm({ resume, onChange }: SummaryFormProps) {
  const wordCount = resume.summary?.split(/\s+/).filter(Boolean).length || 0;
  const isOptimal = wordCount >= 40 && wordCount <= 80;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Writing a great summary</p>
            <p className="text-xs text-blue-700 mt-1">
              Highlight your key achievements, years of experience, and core skills. Keep it concise (40-80 words) and impactful.
            </p>
          </div>
        </div>
      </div>

      <FormField label="Professional Summary" required>
        <TextArea
          value={resume.summary || ''}
          onChange={(e) => onChange({ summary: e.target.value })}
          placeholder="Results-driven software engineer with 5+ years of experience in building scalable web applications. Expertise in React, Node.js, and cloud technologies. Led cross-functional teams to deliver projects 20% faster. Passionate about clean code and user-centric design."
          rows={5}
        />
      </FormField>

      <div className="flex items-center justify-between">
        <div className={`text-xs ${isOptimal ? 'text-green-600' : wordCount > 80 ? 'text-amber-600' : 'text-gray-400'}`}>
          {wordCount} words {isOptimal && '✓ Optimal length'}
        </div>
        <div className="flex gap-2">
          <span className="text-xs text-gray-400">Recommended: 40-80 words</span>
        </div>
      </div>
    </div>
  );
}

// Experience Form
interface ExperienceFormProps {
  resume: Resume;
  onChange: (updates: Partial<Resume>) => void;
}

export function ExperienceForm({ resume, onChange }: ExperienceFormProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const experiences = resume.experience || [];

  const handleAdd = () => {
    const newExp: Experience = {
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: '',
      highlights: [],
    };
    onChange({ experience: [...experiences, newExp] });
    setOpenIndex(experiences.length);
  };

  const handleUpdate = (index: number, updates: Partial<Experience>) => {
    const updated = experiences.map((exp: Experience, i: number) => (i === index ? { ...exp, ...updates } : exp));
    onChange({ experience: updated });
  };

  const handleDelete = (index: number) => {
    onChange({ experience: experiences.filter((_: Experience, i: number) => i !== index) });
    setOpenIndex(null);
  };

  const handleHighlightChange = (expIndex: number, highlightIndex: number, value: string) => {
    const exp = experiences[expIndex];
    const highlights = [...(exp.highlights || [])];
    highlights[highlightIndex] = value;
    handleUpdate(expIndex, { highlights });
  };

  const addHighlight = (expIndex: number) => {
    const exp = experiences[expIndex];
    handleUpdate(expIndex, { highlights: [...(exp.highlights || []), ''] });
  };

  const removeHighlight = (expIndex: number, highlightIndex: number) => {
    const exp = experiences[expIndex];
    handleUpdate(expIndex, { highlights: (exp.highlights || []).filter((_: string, i: number) => i !== highlightIndex) });
  };

  return (
    <div className="space-y-4">
      {experiences.map((exp: Experience, index: number) => (
        <CollapsibleItem
          key={index}
          title={exp.title || 'New Position'}
          subtitle={exp.company ? `${exp.company}${exp.start_date ? ` · ${exp.start_date}` : ''}` : undefined}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          onDelete={() => handleDelete(index)}
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Job Title" required>
                <Input
                  value={exp.title}
                  onChange={(e) => handleUpdate(index, { title: e.target.value })}
                  placeholder="Software Engineer"
                />
              </FormField>
              <FormField label="Company" required>
                <Input
                  value={exp.company}
                  onChange={(e) => handleUpdate(index, { company: e.target.value })}
                  placeholder="Google"
                />
              </FormField>
            </div>

            <FormField label="Location">
              <Input
                value={exp.location || ''}
                onChange={(e) => handleUpdate(index, { location: e.target.value })}
                placeholder="Mountain View, CA"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" required>
                <Input
                  type="month"
                  value={exp.start_date}
                  onChange={(e) => handleUpdate(index, { start_date: e.target.value })}
                />
              </FormField>
              <FormField label="End Date">
                <div className="space-y-2">
                  <Input
                    type="month"
                    value={exp.end_date}
                    onChange={(e) => handleUpdate(index, { end_date: e.target.value })}
                    disabled={exp.current}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={exp.current || false}
                      onChange={(e) => handleUpdate(index, { current: e.target.checked, end_date: e.target.checked ? '' : exp.end_date })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    I currently work here
                  </label>
                </div>
              </FormField>
            </div>

            <FormField label="Description" hint="Brief overview of your role">
              <TextArea
                value={exp.description}
                onChange={(e) => handleUpdate(index, { description: e.target.value })}
                placeholder="Led the development of..."
                rows={3}
              />
            </FormField>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Key Achievements</label>
              <p className="text-xs text-gray-400">Start with action verbs. Include metrics when possible.</p>
              {(exp.highlights || []).map((highlight: string, hIndex: number) => (
                <div key={hIndex} className="flex gap-2 items-start">
                  <span className="mt-3 text-gray-300">•</span>
                  <TextArea
                    value={highlight}
                    onChange={(e) => handleHighlightChange(index, hIndex, e.target.value)}
                    placeholder="Increased system performance by 40% through..."
                    rows={2}
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeHighlight(index, hIndex)}
                    className="mt-2 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => addHighlight(index)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Achievement
              </button>
            </div>
          </div>
        </CollapsibleItem>
      ))}

      <AddButton onClick={handleAdd} label="Add Work Experience" />
    </div>
  );
}

// Education Form
interface EducationFormProps {
  resume: Resume;
  onChange: (updates: Partial<Resume>) => void;
}

export function EducationForm({ resume, onChange }: EducationFormProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const education = resume.education || [];

  const handleAdd = () => {
    const newEdu: Education = {
      degree: '',
      institution: '',
      location: '',
      graduation_date: '',
      gpa: '',
      honors: '',
      coursework: [],
    };
    onChange({ education: [...education, newEdu] });
    setOpenIndex(education.length);
  };

  const handleUpdate = (index: number, updates: Partial<Education>) => {
    const updated = education.map((edu: Education, i: number) => (i === index ? { ...edu, ...updates } : edu));
    onChange({ education: updated });
  };

  const handleDelete = (index: number) => {
    onChange({ education: education.filter((_: Education, i: number) => i !== index) });
    setOpenIndex(null);
  };

  return (
    <div className="space-y-4">
      {education.map((edu: Education, index: number) => (
        <CollapsibleItem
          key={index}
          title={edu.degree || 'New Education'}
          subtitle={edu.institution ? `${edu.institution}${edu.graduation_date ? ` · ${edu.graduation_date}` : ''}` : undefined}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          onDelete={() => handleDelete(index)}
        >
          <div className="space-y-4 pt-2">
            <FormField label="Degree" required>
              <Input
                value={edu.degree}
                onChange={(e) => handleUpdate(index, { degree: e.target.value })}
                placeholder="Bachelor of Science in Computer Science"
              />
            </FormField>

            <FormField label="Institution" required>
              <Input
                value={edu.institution}
                onChange={(e) => handleUpdate(index, { institution: e.target.value })}
                placeholder="Stanford University"
              />
            </FormField>

            <FormField label="Location">
              <Input
                value={edu.location || ''}
                onChange={(e) => handleUpdate(index, { location: e.target.value })}
                placeholder="Stanford, CA"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Graduation Date">
                <Input
                  type="month"
                  value={edu.graduation_date}
                  onChange={(e) => handleUpdate(index, { graduation_date: e.target.value })}
                />
              </FormField>
              <FormField label="GPA" hint="Optional">
                <Input
                  value={edu.gpa || ''}
                  onChange={(e) => handleUpdate(index, { gpa: e.target.value })}
                  placeholder="3.8/4.0"
                />
              </FormField>
            </div>

            <FormField label="Honors & Awards">
              <Input
                value={edu.honors || ''}
                onChange={(e) => handleUpdate(index, { honors: e.target.value })}
                placeholder="Magna Cum Laude, Dean's List"
              />
            </FormField>

            <FormField label="Relevant Coursework" hint="Comma-separated">
              <Input
                value={(edu.coursework || []).join(', ')}
                onChange={(e) => handleUpdate(index, { coursework: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="Data Structures, Algorithms, Machine Learning"
              />
            </FormField>
          </div>
        </CollapsibleItem>
      ))}

      <AddButton onClick={handleAdd} label="Add Education" />
    </div>
  );
}

// Skills Form
interface SkillsFormProps {
  resume: Resume;
  onChange: (updates: Partial<Resume>) => void;
}

export function SkillsForm({ resume, onChange }: SkillsFormProps) {
  const skills = resume.skills || [];
  const [newSkill, setNewSkill] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const categories: string[] = Array.from(new Set(skills.map((s: Skill) => s.category).filter((c: string | undefined): c is string => Boolean(c))));
  const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  const handleAdd = () => {
    if (!newSkill.trim()) return;
    const skill: Skill = {
      name: newSkill.trim(),
      category: newCategory || 'General',
      proficiency: 'Intermediate',
    };
    onChange({ skills: [...skills, skill] });
    setNewSkill('');
  };

  const handleUpdate = (index: number, updates: Partial<Skill>) => {
    const updated = skills.map((skill: Skill, i: number) => (i === index ? { ...skill, ...updates } : skill));
    onChange({ skills: updated });
  };

  const handleDelete = (index: number) => {
    onChange({ skills: skills.filter((_: Skill, i: number) => i !== index) });
  };

  const groupedSkills = skills.reduce((acc: Record<string, { skill: Skill; index: number }[]>, skill: Skill, index: number) => {
    const category = skill.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push({ skill, index });
    return acc;
  }, {} as Record<string, { skill: Skill; index: number }[]>);

  return (
    <div className="space-y-6">
      {/* Add New Skill */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Add a Skill</h4>
        <div className="flex gap-3">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="e.g., React, Python, Project Management"
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="Technical">Technical</option>
            <option value="Soft Skills">Soft Skills</option>
            <option value="Languages">Languages</option>
            <option value="Tools">Tools</option>
          </select>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Grouped Skills */}
      {Object.entries(groupedSkills).map(([category, skillItems]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            {category}
            <span className="text-xs font-normal text-gray-400">({(skillItems as { skill: Skill; index: number }[]).length})</span>
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {(skillItems as { skill: Skill; index: number }[]).map(({ skill, index }: { skill: Skill; index: number }) => (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group"
              >
                <span className="flex-1 text-sm text-gray-900">{skill.name}</span>
                <select
                  value={skill.proficiency || 'Intermediate'}
                  onChange={(e) => handleUpdate(index, { proficiency: e.target.value })}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-gray-50 focus:border-blue-500 outline-none"
                >
                  {proficiencyLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleDelete(index)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {skills.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-sm">No skills added yet</p>
          <p className="text-xs mt-1">Start adding your skills above</p>
        </div>
      )}
    </div>
  );
}

// Projects Form
interface ProjectsFormProps {
  resume: Resume;
  onChange: (updates: Partial<Resume>) => void;
}

export function ProjectsForm({ resume, onChange }: ProjectsFormProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const projects = resume.projects || [];

  const handleAdd = () => {
    const newProject: Project = {
      name: '',
      description: '',
      technologies: [],
      url: '',
      highlights: [],
    };
    onChange({ projects: [...projects, newProject] });
    setOpenIndex(projects.length);
  };

  const handleUpdate = (index: number, updates: Partial<Project>) => {
    const updated = projects.map((proj: Project, i: number) => (i === index ? { ...proj, ...updates } : proj));
    onChange({ projects: updated });
  };

  const handleDelete = (index: number) => {
    onChange({ projects: projects.filter((_: Project, i: number) => i !== index) });
    setOpenIndex(null);
  };

  return (
    <div className="space-y-4">
      {projects.map((project: Project, index: number) => (
        <CollapsibleItem
          key={index}
          title={project.name || 'New Project'}
          subtitle={project.technologies?.slice(0, 3).join(', ') || undefined}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          onDelete={() => handleDelete(index)}
        >
          <div className="space-y-4 pt-2">
            <FormField label="Project Name" required>
              <Input
                value={project.name}
                onChange={(e) => handleUpdate(index, { name: e.target.value })}
                placeholder="E-commerce Platform"
              />
            </FormField>

            <FormField label="Description">
              <TextArea
                value={project.description}
                onChange={(e) => handleUpdate(index, { description: e.target.value })}
                placeholder="Built a full-stack e-commerce platform..."
                rows={3}
              />
            </FormField>

            <FormField label="Technologies Used" hint="Comma-separated">
              <Input
                value={(project.technologies || []).join(', ')}
                onChange={(e) => handleUpdate(index, { technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="React, Node.js, PostgreSQL"
              />
            </FormField>

            <FormField label="Project URL">
              <Input
                value={project.url || ''}
                onChange={(e) => handleUpdate(index, { url: e.target.value })}
                placeholder="https://github.com/username/project"
              />
            </FormField>
          </div>
        </CollapsibleItem>
      ))}

      <AddButton onClick={handleAdd} label="Add Project" />
    </div>
  );
}

// Certifications Form
interface CertificationsFormProps {
  resume: Resume;
  onChange: (updates: Partial<Resume>) => void;
}

export function CertificationsForm({ resume, onChange }: CertificationsFormProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const certifications = resume.certifications || [];

  const handleAdd = () => {
    const newCert: Certification = {
      name: '',
      issuer: '',
      date: '',
      expiry: '',
      credential_id: '',
    };
    onChange({ certifications: [...certifications, newCert] });
    setOpenIndex(certifications.length);
  };

  const handleUpdate = (index: number, updates: Partial<Certification>) => {
    const updated = certifications.map((cert: Certification, i: number) => (i === index ? { ...cert, ...updates } : cert));
    onChange({ certifications: updated });
  };

  const handleDelete = (index: number) => {
    onChange({ certifications: certifications.filter((_: Certification, i: number) => i !== index) });
    setOpenIndex(null);
  };

  return (
    <div className="space-y-4">
      {certifications.map((cert: Certification, index: number) => (
        <CollapsibleItem
          key={index}
          title={cert.name || 'New Certification'}
          subtitle={cert.issuer || undefined}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          onDelete={() => handleDelete(index)}
        >
          <div className="space-y-4 pt-2">
            <FormField label="Certification Name" required>
              <Input
                value={cert.name}
                onChange={(e) => handleUpdate(index, { name: e.target.value })}
                placeholder="AWS Solutions Architect"
              />
            </FormField>

            <FormField label="Issuing Organization" required>
              <Input
                value={cert.issuer}
                onChange={(e) => handleUpdate(index, { issuer: e.target.value })}
                placeholder="Amazon Web Services"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Issue Date">
                <Input
                  type="month"
                  value={cert.date}
                  onChange={(e) => handleUpdate(index, { date: e.target.value })}
                />
              </FormField>
              <FormField label="Expiry Date" hint="Leave blank if no expiry">
                <Input
                  type="month"
                  value={cert.expiry || ''}
                  onChange={(e) => handleUpdate(index, { expiry: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="Credential ID">
              <Input
                value={cert.credential_id || ''}
                onChange={(e) => handleUpdate(index, { credential_id: e.target.value })}
                placeholder="ABC123XYZ"
              />
            </FormField>
          </div>
        </CollapsibleItem>
      ))}

      <AddButton onClick={handleAdd} label="Add Certification" />
    </div>
  );
}

// Languages Form
interface LanguagesFormProps {
  resume: Resume;
  onChange: (updates: Partial<Resume>) => void;
}

export function LanguagesForm({ resume, onChange }: LanguagesFormProps) {
  const languages = resume.languages || [];
  const proficiencyLevels = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];

  const handleAdd = () => {
    const newLang: Language = {
      name: '',
      proficiency: 'Intermediate',
    };
    onChange({ languages: [...languages, newLang] });
  };

  const handleUpdate = (index: number, updates: Partial<Language>) => {
    const updated = languages.map((lang: Language, i: number) => (i === index ? { ...lang, ...updates } : lang));
    onChange({ languages: updated });
  };

  const handleDelete = (index: number) => {
    onChange({ languages: languages.filter((_: Language, i: number) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {languages.map((lang: Language, index: number) => (
        <div
          key={index}
          className="flex items-center gap-4 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group"
        >
          <Input
            value={lang.name}
            onChange={(e) => handleUpdate(index, { name: e.target.value })}
            placeholder="Language name"
            className="flex-1"
          />
          <select
            value={lang.proficiency}
            onChange={(e) => handleUpdate(index, { proficiency: e.target.value })}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none"
          >
            {proficiencyLevels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <button
            onClick={() => handleDelete(index)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      <AddButton onClick={handleAdd} label="Add Language" />
    </div>
  );
}

// Main Section Form Component
interface SectionFormProps {
  sectionId: SectionId;
  resume: Resume;
  onChange: (updates: Partial<Resume>) => void;
}

export function SectionForm({ sectionId, resume, onChange }: SectionFormProps) {
  switch (sectionId) {
    case 'personal':
      return <PersonalDetailsForm resume={resume} onChange={onChange} />;
    case 'summary':
      return <SummaryForm resume={resume} onChange={onChange} />;
    case 'experience':
      return <ExperienceForm resume={resume} onChange={onChange} />;
    case 'education':
      return <EducationForm resume={resume} onChange={onChange} />;
    case 'skills':
      return <SkillsForm resume={resume} onChange={onChange} />;
    case 'projects':
      return <ProjectsForm resume={resume} onChange={onChange} />;
    case 'certifications':
      return <CertificationsForm resume={resume} onChange={onChange} />;
    case 'languages':
      return <LanguagesForm resume={resume} onChange={onChange} />;
    default:
      return null;
  }
}
