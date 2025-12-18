'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ResumeBuilder, ContactInfo, ExperienceEntry, EducationEntry, SkillCategory } from '@/types/builder';

// A4 dimensions in pixels at 96 DPI (standard screen)
const A4_WIDTH = 794; // 210mm
const A4_HEIGHT = 1123; // 297mm

// Template types
export type TemplateStyle = 'classic' | 'modern' | 'minimal' | 'professional' | 'creative' | 'custom';

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  headerBg: string;
  headerText: string;
}

export const colorThemes: ColorTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    primary: '#1a1a1a',
    secondary: '#4a4a4a',
    accent: '#2563eb',
    text: '#333333',
    background: '#ffffff',
    headerBg: '#ffffff',
    headerText: '#1a1a1a',
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    primary: '#0f4c81',
    secondary: '#1e6091',
    accent: '#3b82f6',
    text: '#333333',
    background: '#ffffff',
    headerBg: '#0f4c81',
    headerText: '#ffffff',
  },
  {
    id: 'forest',
    name: 'Forest Green',
    primary: '#166534',
    secondary: '#15803d',
    accent: '#22c55e',
    text: '#333333',
    background: '#ffffff',
    headerBg: '#166534',
    headerText: '#ffffff',
  },
  {
    id: 'wine',
    name: 'Wine Red',
    primary: '#7f1d1d',
    secondary: '#991b1b',
    accent: '#dc2626',
    text: '#333333',
    background: '#ffffff',
    headerBg: '#7f1d1d',
    headerText: '#ffffff',
  },
  {
    id: 'slate',
    name: 'Slate Gray',
    primary: '#334155',
    secondary: '#475569',
    accent: '#64748b',
    text: '#333333',
    background: '#ffffff',
    headerBg: '#334155',
    headerText: '#ffffff',
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    primary: '#581c87',
    secondary: '#7c3aed',
    accent: '#a855f7',
    text: '#333333',
    background: '#ffffff',
    headerBg: '#581c87',
    headerText: '#ffffff',
  },
  {
    id: 'teal',
    name: 'Teal',
    primary: '#0d9488',
    secondary: '#14b8a6',
    accent: '#2dd4bf',
    text: '#333333',
    background: '#ffffff',
    headerBg: '#0d9488',
    headerText: '#ffffff',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    primary: '#f8fafc',
    secondary: '#e2e8f0',
    accent: '#60a5fa',
    text: '#e2e8f0',
    background: '#1e293b',
    headerBg: '#0f172a',
    headerText: '#f8fafc',
  },
];

export interface TemplateConfig {
  style: TemplateStyle;
  theme: ColorTheme;
  showPhoto: boolean;
  photoUrl: string | null;
  fontSize: 'small' | 'medium' | 'large';
  customLayout?: CustomLayoutConfig;
}

// Custom layout configuration for custom template maker
export interface CustomLayoutConfig {
  sections: CustomSection[];
  backgroundColor: string;
}

export interface CustomSection {
  id: string;
  type: 'header' | 'contact' | 'summary' | 'experience' | 'education' | 'skills';
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

// Field validation types
interface FieldError {
  field: string;
  message: string;
}

// Validation rules for different field types
const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  phone: {
    pattern: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    message: 'Please enter a valid phone number',
  },
  url: {
    pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    message: 'Please enter a valid URL',
  },
  required: {
    pattern: /\S+/,
    message: 'This field is required',
  },
  date: {
    pattern: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/,
    message: 'Use format: Mon YYYY (e.g., Jan 2024)',
  },
};

// Validate a field value
const validateField = (value: string, type: keyof typeof validationRules): FieldError | null => {
  if (!value && type !== 'required') return null;
  const rule = validationRules[type];
  if (!rule.pattern.test(value)) {
    return { field: type, message: rule.message };
  }
  return null;
};

// Add Section Button Component
interface AddSectionButtonProps {
  onClick: () => void;
  label: string;
  color?: string;
}

const AddSectionButton: React.FC<AddSectionButtonProps> = ({ onClick, label, color = '#3b82f6' }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed hover:border-solid transition-all text-sm font-medium group"
    style={{ borderColor: color, color: color }}
  >
    <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
    {label}
  </button>
);

// Inline Add Button (for within sections)
interface InlineAddButtonProps {
  onClick: () => void;
  tooltip?: string;
  size?: 'sm' | 'md';
}

const InlineAddButton: React.FC<InlineAddButtonProps> = ({ onClick, tooltip = 'Add new', size = 'sm' }) => (
  <button
    onClick={onClick}
    title={tooltip}
    className={`flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-md hover:shadow-lg ${
      size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
    }`}
  >
    <svg className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
    </svg>
  </button>
);

// Delete Button Component
interface DeleteButtonProps {
  onClick: () => void;
  tooltip?: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick, tooltip = 'Remove' }) => (
  <button
    onClick={onClick}
    title={tooltip}
    className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 hover:bg-red-500 text-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

// Validated Input Component
interface ValidatedInputProps {
  value: string;
  onChange: (value: string) => void;
  validationType?: keyof typeof validationRules;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  editable?: boolean;
  multiline?: boolean;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  value,
  onChange,
  validationType,
  placeholder = 'Click to edit',
  className = '',
  style = {},
  editable = true,
  multiline = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setEditValue(value);
    // Validate on initial load if there's a value
    if (value && validationType) {
      const validationError = validateField(value, validationType);
      setError(validationError?.message || null);
    }
  }, [value, validationType]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleChange = (newValue: string) => {
    setEditValue(newValue);
    if (validationType) {
      const validationError = validateField(newValue, validationType);
      setError(validationError?.message || null);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) handleBlur();
    if (e.key === 'Escape') { setEditValue(value); setIsEditing(false); }
  };

  if (!editable) return <span className={className} style={style}>{value || placeholder}</span>;

  if (isEditing) {
    const inputClass = `${className} bg-blue-50/50 border-b-2 outline-none px-1 -mx-1 ${
      error ? 'border-red-500' : 'border-blue-500'
    }`;
    
    const inputElement = multiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={editValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${inputClass} resize-none w-full min-h-[60px]`}
        placeholder={placeholder}
        style={style}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClass}
        placeholder={placeholder}
        style={style}
      />
    );

    return (
      <div className="relative">
        {inputElement}
        {error && (
          <div className="absolute left-0 top-full mt-1 text-xs text-red-500 bg-red-50 px-2 py-1 rounded shadow-sm whitespace-nowrap z-10">
            ⚠️ {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <span 
        onClick={() => setIsEditing(true)}
        className={`${className} cursor-pointer hover:bg-blue-50/50 transition-colors ${!value ? 'opacity-50 italic' : ''} ${error ? 'border-b border-red-400' : ''}`}
        title={error || "Click to edit"}
        style={style}
      >
        {value || placeholder}
      </span>
      {error && !isEditing && (
        <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-red-500 cursor-help" title={error}>
          ⚠️
        </span>
      )}
    </div>
  );
};

// New entry creators
const createNewExperience = (): ExperienceEntry => ({
  company: '',
  position: '',
  location: '',
  start_date: '',
  end_date: '',
  current: false,
  description: [''],
  achievements: [],
});

const createNewEducation = (): EducationEntry => ({
  institution: '',
  degree: '',
  field_of_study: '',
  location: '',
  end_date: '',
  gpa: undefined,
  honors: [],
});

const createNewSkillCategory = (): SkillCategory => ({
  category: '',
  skills: [''],
});

interface TemplateSelectorProps {
  config: TemplateConfig;
  onConfigChange: (config: TemplateConfig) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ config, onConfigChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onConfigChange({ ...config, photoUrl: reader.result as string, showPhoto: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const templateStyles: { id: TemplateStyle; name: string; description: string }[] = [
    { id: 'classic', name: 'Classic', description: 'Traditional single-column layout' },
    { id: 'modern', name: 'Modern', description: 'Two-column with sidebar' },
    { id: 'minimal', name: 'Minimal', description: 'Clean and simple' },
    { id: 'professional', name: 'Professional', description: 'Corporate style with header' },
    { id: 'creative', name: 'Creative', description: 'Bold with accent colors' },
    { id: 'custom', name: 'Custom', description: 'Build your own layout' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        Template Options
      </h3>

      {/* Template Style */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Layout Style</label>
        <div className="grid grid-cols-6 gap-2">
          {templateStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onConfigChange({ ...config, style: style.id })}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                config.style === style.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${style.id === 'custom' ? 'bg-gradient-to-r from-purple-50 to-pink-50' : ''}`}
              title={style.description}
            >
              <div className="text-xs font-medium text-gray-900">{style.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Theme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Color Theme</label>
        <div className="grid grid-cols-4 gap-2">
          {colorThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onConfigChange({ ...config, theme })}
              className={`p-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                config.theme.id === theme.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: theme.headerBg }}
              />
              <span className="text-xs font-medium text-gray-700">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Profile Photo</label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {config.photoUrl ? (
              <div className="relative group">
                <img
                  src={config.photoUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <button
                  onClick={() => onConfigChange({ ...config, photoUrl: null, showPhoto: false })}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {config.photoUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-1">JPG, PNG. Max 2MB.</p>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.showPhoto}
              onChange={(e) => onConfigChange({ ...config, showPhoto: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={!config.photoUrl}
            />
            <span className="text-sm text-gray-600">Show</span>
          </label>
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Font Size</label>
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => onConfigChange({ ...config, fontSize: size })}
              className={`px-4 py-2 rounded-lg border-2 transition-all capitalize text-sm font-medium ${
                config.fontSize === size
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Placeholder data for empty resumes
const placeholderData = {
  contact: {
    full_name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/johndoe',
    github: 'github.com/johndoe',
  },
  summary: 'Results-driven professional with 5+ years of experience in software development. Proven track record of delivering high-quality solutions and leading cross-functional teams. Passionate about creating innovative products that make a difference.',
  experience: [
    {
      company: 'Tech Company Inc.',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      start_date: 'Jan 2021',
      end_date: '',
      current: true,
      description: [
        'Led development of microservices architecture serving 1M+ daily users',
        'Mentored team of 5 junior developers, improving code quality by 40%',
        'Implemented CI/CD pipeline reducing deployment time by 60%',
      ],
      achievements: [],
    },
    {
      company: 'Startup Labs',
      position: 'Software Developer',
      location: 'New York, NY',
      start_date: 'Jun 2018',
      end_date: 'Dec 2020',
      current: false,
      description: [
        'Built responsive web applications using React and TypeScript',
        'Collaborated with design team to implement pixel-perfect UIs',
        'Optimized database queries improving performance by 50%',
      ],
      achievements: [],
    },
  ],
  education: [
    {
      institution: 'University of Technology',
      degree: 'Bachelor of Science',
      field_of_study: 'Computer Science',
      location: 'Boston, MA',
      end_date: '2018',
      gpa: 3.8,
      honors: ['Magna Cum Laude', "Dean's List"],
    },
  ],
  skills: [
    { category: 'Programming', skills: ['JavaScript', 'TypeScript', 'Python', 'Java'] },
    { category: 'Frameworks', skills: ['React', 'Node.js', 'Next.js', 'Django'] },
    { category: 'Tools', skills: ['Git', 'Docker', 'AWS', 'PostgreSQL'] },
  ],
};

// Helper to get value with placeholder fallback
const getWithPlaceholder = <T,>(value: T | undefined, placeholder: T, isEmpty: (v: T) => boolean): { value: T; isPlaceholder: boolean } => {
  if (value === undefined || isEmpty(value)) {
    return { value: placeholder, isPlaceholder: true };
  }
  return { value, isPlaceholder: false };
};

// Editable components (reused from before)
interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  editable?: boolean;
  style?: React.CSSProperties;
}

const EditableText: React.FC<EditableTextProps> = ({ 
  value, 
  onChange, 
  className = '', 
  placeholder = 'Click to edit',
  multiline = false,
  editable = true,
  style = {},
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) handleBlur();
    if (e.key === 'Escape') { setEditValue(value); setIsEditing(false); }
  };

  if (!editable) return <span className={className} style={style}>{value || placeholder}</span>;

  if (isEditing) {
    const inputClass = `${className} bg-blue-50/50 border-b-2 border-blue-500 outline-none px-1 -mx-1`;
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${inputClass} resize-none w-full min-h-[60px]`}
          placeholder={placeholder}
          style={style}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClass}
        placeholder={placeholder}
        style={style}
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-pointer hover:bg-blue-50/50 transition-colors ${!value ? 'opacity-50 italic' : ''}`}
      title="Click to edit"
      style={style}
    >
      {value || placeholder}
    </span>
  );
};

// Bullet list component
interface EditableBulletListProps {
  items: string[];
  onChange: (items: string[]) => void;
  editable?: boolean;
  bulletColor?: string;
  textStyle?: React.CSSProperties;
}

const EditableBulletList: React.FC<EditableBulletListProps> = ({ items, onChange, editable = true, bulletColor = '#666', textStyle = {} }) => {
  return (
    <ul className="list-none space-y-0.5">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2 group">
          <span style={{ color: bulletColor }} className="mt-1">•</span>
          <EditableText
            value={item}
            onChange={(value) => {
              const newItems = [...items];
              newItems[index] = value;
              onChange(newItems);
            }}
            className="flex-1 text-sm leading-relaxed"
            placeholder="Add accomplishment..."
            editable={editable}
            style={textStyle}
          />
          {editable && (
            <button
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </li>
      ))}
      {editable && (
        <li>
          <button onClick={() => onChange([...items, ''])} className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1 mt-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add bullet
          </button>
        </li>
      )}
    </ul>
  );
};

interface StyledResumeProps {
  resume: ResumeBuilder;
  config: TemplateConfig;
  onUpdate: (resume: ResumeBuilder) => void;
  editable?: boolean;
}

// Classic Template
const ClassicTemplate: React.FC<StyledResumeProps> = ({ resume, config, onUpdate, editable = true }) => {
  const { theme, fontSize } = config;
  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';

  // Use placeholder data for empty fields
  const name = resume.contact?.full_name || '';
  const email = resume.contact?.email || '';
  const phone = resume.contact?.phone || '';
  const location = resume.contact?.location || '';
  const linkedin = resume.contact?.linkedin || '';
  const summary = resume.summary?.summary || '';
  const experience = resume.experience.length > 0 ? resume.experience : placeholderData.experience;
  const education = resume.education.length > 0 ? resume.education : placeholderData.education;
  const skills = resume.skills.length > 0 ? resume.skills : placeholderData.skills;
  
  const isPlaceholderExp = resume.experience.length === 0;
  const isPlaceholderEdu = resume.education.length === 0;
  const isPlaceholderSkills = resume.skills.length === 0;

  const updateField = (section: keyof ResumeBuilder, value: any) => {
    onUpdate({ ...resume, [section]: value });
  };

  const updateContact = (field: string, value: string) => {
    updateField('contact', { ...resume.contact, [field]: value });
  };

  const addExperience = () => {
    const newExp = createNewExperience();
    updateField('experience', [...resume.experience, newExp]);
  };

  const removeExperience = (index: number) => {
    updateField('experience', resume.experience.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    const newEdu = createNewEducation();
    updateField('education', [...resume.education, newEdu]);
  };

  const removeEducation = (index: number) => {
    updateField('education', resume.education.filter((_, i) => i !== index));
  };

  const addSkillCategory = () => {
    const newCat = createNewSkillCategory();
    updateField('skills', [...resume.skills, newCat]);
  };

  const removeSkillCategory = (index: number) => {
    updateField('skills', resume.skills.filter((_, i) => i !== index));
  };

  const placeholderStyle = { opacity: 0.5, fontStyle: 'italic' as const };

  return (
    <div 
      className={`p-8 ${fontSizeClass} relative`} 
      style={{ 
        backgroundColor: theme.background, 
        color: theme.text, 
        fontFamily: "'Cambria', 'Georgia', serif", 
        width: `${A4_WIDTH}px`, 
        minHeight: `${A4_HEIGHT}px`,
        maxWidth: `${A4_WIDTH}px`,
      }}
    >
      {/* Header */}
      <header className="text-center mb-6 pb-4" style={{ borderBottom: `2px solid ${theme.primary}` }}>
        <div className="flex justify-center items-center gap-6 mb-4">
          {config.showPhoto && config.photoUrl && (
            <img src={config.photoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4" style={{ borderColor: theme.primary }} />
          )}
          {!config.photoUrl && config.showPhoto && (
            <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center bg-gray-100" style={{ borderColor: theme.primary }}>
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <div>
            <ValidatedInput
              value={name}
              onChange={(value) => updateContact('full_name', value)}
              validationType="required"
              className="text-3xl font-bold tracking-wide block mb-2"
              style={{ color: theme.primary, ...(name ? {} : placeholderStyle) }}
              placeholder={placeholderData.contact.full_name}
              editable={editable}
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm" style={{ color: theme.secondary }}>
          <ValidatedInput value={email} onChange={(v) => updateContact('email', v)} validationType="email" placeholder={placeholderData.contact.email} editable={editable} style={email ? {} : placeholderStyle} />
          <span>•</span>
          <ValidatedInput value={phone} onChange={(v) => updateContact('phone', v)} validationType="phone" placeholder={placeholderData.contact.phone} editable={editable} style={phone ? {} : placeholderStyle} />
          <span>•</span>
          <ValidatedInput value={location} onChange={(v) => updateContact('location', v)} placeholder={placeholderData.contact.location} editable={editable} style={location ? {} : placeholderStyle} />
          <span>•</span>
          <ValidatedInput value={linkedin} onChange={(v) => updateContact('linkedin', v)} validationType="url" placeholder={placeholderData.contact.linkedin} editable={editable} style={linkedin ? {} : placeholderStyle} />
        </div>
      </header>

      {/* Summary */}
      <section className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold uppercase tracking-wider pb-1 mb-3" style={{ color: theme.primary, borderBottom: `1px solid ${theme.secondary}` }}>
            Professional Summary
          </h2>
        </div>
        <ValidatedInput 
          value={summary} 
          onChange={(v) => updateField('summary', { summary: v })} 
          className="leading-relaxed w-full" 
          placeholder={placeholderData.summary}
          style={summary ? {} : placeholderStyle}
          multiline 
          editable={editable} 
        />
      </section>

      {/* Experience */}
      <section className="mb-6 group/section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold uppercase tracking-wider pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.secondary}` }}>
            Work Experience
          </h2>
          {editable && (
            <InlineAddButton onClick={addExperience} tooltip="Add Experience" />
          )}
        </div>
        <div className="space-y-4" style={isPlaceholderExp ? placeholderStyle : {}}>
          {(isPlaceholderExp ? experience : resume.experience).map((exp, i) => (
            <div key={i} className="group relative">
              {editable && !isPlaceholderExp && (
                <div className="absolute -right-6 top-0">
                  <DeleteButton onClick={() => removeExperience(i)} tooltip="Remove experience" />
                </div>
              )}
              <div className="flex justify-between items-start">
                <div>
                  <ValidatedInput 
                    value={isPlaceholderExp ? '' : exp.position} 
                    onChange={(v) => {
                      const newExp = [...resume.experience];
                      newExp[i] = { ...newExp[i], position: v };
                      updateField('experience', newExp);
                    }}
                    validationType="required"
                    className="font-bold inline" 
                    style={{ color: theme.primary }}
                    placeholder={exp.position || 'Job Title'}
                    editable={editable && !isPlaceholderExp}
                  />
                  <span style={{ color: theme.secondary }}> at </span>
                  <ValidatedInput 
                    value={isPlaceholderExp ? '' : exp.company} 
                    onChange={(v) => {
                      const newExp = [...resume.experience];
                      newExp[i] = { ...newExp[i], company: v };
                      updateField('experience', newExp);
                    }}
                    validationType="required"
                    className="font-semibold inline"
                    placeholder={exp.company || 'Company Name'}
                    editable={editable && !isPlaceholderExp}
                  />
                </div>
                <div className="flex items-center gap-1 text-sm" style={{ color: theme.secondary }}>
                  <ValidatedInput 
                    value={isPlaceholderExp ? exp.start_date : (resume.experience[i]?.start_date || '')}
                    onChange={(v) => {
                      const newExp = [...resume.experience];
                      newExp[i] = { ...newExp[i], start_date: v };
                      updateField('experience', newExp);
                    }}
                    validationType="date"
                    placeholder="Jan 2020"
                    editable={editable && !isPlaceholderExp}
                  />
                  <span>–</span>
                  <ValidatedInput 
                    value={isPlaceholderExp ? (exp.current ? 'Present' : (exp.end_date || '')) : (resume.experience[i]?.current ? 'Present' : (resume.experience[i]?.end_date || ''))}
                    onChange={(v) => {
                      const newExp = [...resume.experience];
                      const isCurrent = v.toLowerCase() === 'present';
                      newExp[i] = { ...newExp[i], end_date: isCurrent ? '' : v, current: isCurrent };
                      updateField('experience', newExp);
                    }}
                    placeholder="Present"
                    editable={editable && !isPlaceholderExp}
                  />
                </div>
              </div>
              <EditableBulletList
                items={isPlaceholderExp ? exp.description : (resume.experience[i]?.description || [])}
                onChange={(items) => {
                  const newExp = [...resume.experience];
                  newExp[i] = { ...newExp[i], description: items };
                  updateField('experience', newExp);
                }}
                editable={editable && !isPlaceholderExp}
                bulletColor={theme.accent}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="mb-6 group/section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold uppercase tracking-wider pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.secondary}` }}>
            Education
          </h2>
          {editable && (
            <InlineAddButton onClick={addEducation} tooltip="Add Education" />
          )}
        </div>
        <div style={isPlaceholderEdu ? placeholderStyle : {}}>
          {(isPlaceholderEdu ? education : resume.education).map((edu, i) => (
            <div key={i} className="flex justify-between mb-2 group relative">
              {editable && !isPlaceholderEdu && (
                <div className="absolute -right-6 top-0">
                  <DeleteButton onClick={() => removeEducation(i)} tooltip="Remove education" />
                </div>
              )}
              <div>
                <ValidatedInput 
                  value={isPlaceholderEdu ? '' : edu.degree} 
                  onChange={(v) => {
                    const newEdu = [...resume.education];
                    newEdu[i] = { ...newEdu[i], degree: v };
                    updateField('education', newEdu);
                  }}
                  validationType="required"
                  className="font-bold inline" 
                  style={{ color: theme.primary }}
                  placeholder={edu.degree || 'Degree'}
                  editable={editable && !isPlaceholderEdu}
                />
                {edu.field_of_study && <span> in {edu.field_of_study}</span>}
                <div style={{ color: theme.secondary }}>
                  <ValidatedInput 
                    value={isPlaceholderEdu ? '' : (resume.education[i]?.institution || '')}
                    onChange={(v) => {
                      const newEdu = [...resume.education];
                      newEdu[i] = { ...newEdu[i], institution: v };
                      updateField('education', newEdu);
                    }}
                    validationType="required"
                    placeholder={edu.institution || 'Institution'}
                    editable={editable && !isPlaceholderEdu}
                  />
                </div>
              </div>
              <ValidatedInput 
                value={isPlaceholderEdu ? (edu.end_date || '') : (resume.education[i]?.end_date || '')}
                onChange={(v) => {
                  const newEdu = [...resume.education];
                  newEdu[i] = { ...newEdu[i], end_date: v };
                  updateField('education', newEdu);
                }}
                style={{ color: theme.secondary }}
                placeholder="2020"
                editable={editable && !isPlaceholderEdu}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="group/section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold uppercase tracking-wider pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.secondary}` }}>
            Skills
          </h2>
          {editable && (
            <InlineAddButton onClick={addSkillCategory} tooltip="Add Skill Category" />
          )}
        </div>
        <div className="space-y-1" style={isPlaceholderSkills ? placeholderStyle : {}}>
          {(isPlaceholderSkills ? skills : resume.skills).map((cat, i) => (
            <div key={i} className="group relative flex items-start gap-2">
              {editable && !isPlaceholderSkills && (
                <div className="absolute -right-6 top-0">
                  <DeleteButton onClick={() => removeSkillCategory(i)} tooltip="Remove category" />
                </div>
              )}
              <ValidatedInput 
                value={isPlaceholderSkills ? cat.category : (resume.skills[i]?.category || '')}
                onChange={(v) => {
                  const newSkills = [...resume.skills];
                  newSkills[i] = { ...newSkills[i], category: v };
                  updateField('skills', newSkills);
                }}
                className="font-semibold"
                style={{ color: theme.primary }}
                placeholder="Category"
                editable={editable && !isPlaceholderSkills}
              />
              <span>:</span>
              <ValidatedInput 
                value={isPlaceholderSkills ? cat.skills.join(', ') : (resume.skills[i]?.skills.join(', ') || '')}
                onChange={(v) => {
                  const newSkills = [...resume.skills];
                  newSkills[i] = { ...newSkills[i], skills: v.split(',').map(s => s.trim()).filter(Boolean) };
                  updateField('skills', newSkills);
                }}
                className="flex-1"
                placeholder="Skill 1, Skill 2, Skill 3"
                editable={editable && !isPlaceholderSkills}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// Modern Template (Two Column)
const ModernTemplate: React.FC<StyledResumeProps> = ({ resume, config, onUpdate, editable = true }) => {
  const { theme, fontSize } = config;
  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';

  // Use placeholder data for empty fields
  const name = resume.contact?.full_name || '';
  const email = resume.contact?.email || '';
  const phone = resume.contact?.phone || '';
  const location = resume.contact?.location || '';
  const linkedin = resume.contact?.linkedin || '';
  const summary = resume.summary?.summary || '';
  const experience = resume.experience.length > 0 ? resume.experience : placeholderData.experience;
  const education = resume.education.length > 0 ? resume.education : placeholderData.education;
  const skills = resume.skills.length > 0 ? resume.skills : placeholderData.skills;
  
  const isPlaceholderExp = resume.experience.length === 0;
  const isPlaceholderEdu = resume.education.length === 0;
  const isPlaceholderSkills = resume.skills.length === 0;

  const updateField = (section: keyof ResumeBuilder, value: any) => {
    onUpdate({ ...resume, [section]: value });
  };

  const updateContact = (field: string, value: string) => {
    updateField('contact', { ...resume.contact, [field]: value });
  };

  const addExperience = () => updateField('experience', [...resume.experience, createNewExperience()]);
  const removeExperience = (i: number) => updateField('experience', resume.experience.filter((_, idx) => idx !== i));
  const addEducation = () => updateField('education', [...resume.education, createNewEducation()]);
  const removeEducation = (i: number) => updateField('education', resume.education.filter((_, idx) => idx !== i));
  const addSkillCategory = () => updateField('skills', [...resume.skills, createNewSkillCategory()]);
  const removeSkillCategory = (i: number) => updateField('skills', resume.skills.filter((_, idx) => idx !== i));

  const placeholderStyle = { opacity: 0.5, fontStyle: 'italic' as const };

  return (
    <div 
      className={`flex ${fontSizeClass}`} 
      style={{ 
        backgroundColor: theme.background, 
        color: theme.text, 
        fontFamily: "'Inter', 'Segoe UI', sans-serif", 
        width: `${A4_WIDTH}px`, 
        minHeight: `${A4_HEIGHT}px`,
        maxWidth: `${A4_WIDTH}px`,
      }}
    >
      {/* Sidebar */}
      <div className="w-1/3 p-6" style={{ backgroundColor: theme.headerBg, color: theme.headerText }}>
        {/* Photo */}
        {config.showPhoto && config.photoUrl && (
          <div className="mb-6 flex justify-center">
            <img src={config.photoUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white/30" />
          </div>
        )}
        {!config.photoUrl && config.showPhoto && (
          <div className="mb-6 flex justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-white/30 flex items-center justify-center bg-white/10">
              <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-80">Contact</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2" style={email ? {} : placeholderStyle}>
              <span className="opacity-60">✉</span> 
              <ValidatedInput value={email} onChange={(v) => updateContact('email', v)} validationType="email" placeholder={placeholderData.contact.email} editable={editable} />
            </div>
            <div className="flex items-center gap-2" style={phone ? {} : placeholderStyle}>
              <span className="opacity-60">📞</span> 
              <ValidatedInput value={phone} onChange={(v) => updateContact('phone', v)} validationType="phone" placeholder={placeholderData.contact.phone} editable={editable} />
            </div>
            <div className="flex items-center gap-2" style={location ? {} : placeholderStyle}>
              <span className="opacity-60">📍</span> 
              <ValidatedInput value={location} onChange={(v) => updateContact('location', v)} placeholder={placeholderData.contact.location} editable={editable} />
            </div>
            <div className="flex items-center gap-2" style={linkedin ? {} : placeholderStyle}>
              <span className="opacity-60">🔗</span> 
              <ValidatedInput value={linkedin} onChange={(v) => updateContact('linkedin', v)} validationType="url" placeholder={placeholderData.contact.linkedin} editable={editable} />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">Skills</h3>
            {editable && <InlineAddButton onClick={addSkillCategory} tooltip="Add Category" size="sm" />}
          </div>
          <div style={isPlaceholderSkills ? placeholderStyle : {}}>
            {(isPlaceholderSkills ? skills : resume.skills).map((cat, i) => (
              <div key={i} className="mb-4 group relative">
                {editable && !isPlaceholderSkills && (
                  <div className="absolute -right-2 -top-1"><DeleteButton onClick={() => removeSkillCategory(i)} /></div>
                )}
                <ValidatedInput 
                  value={isPlaceholderSkills ? cat.category : (resume.skills[i]?.category || '')}
                  onChange={(v) => {
                    const newSkills = [...resume.skills];
                    newSkills[i] = { ...newSkills[i], category: v };
                    updateField('skills', newSkills);
                  }}
                  className="font-medium text-sm mb-2"
                  placeholder="Category"
                  editable={editable && !isPlaceholderSkills}
                />
                <div className="flex flex-wrap gap-1">
                  {cat.skills.map((skill, j) => (
                    <span key={j} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education (in sidebar) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">Education</h3>
            {editable && <InlineAddButton onClick={addEducation} tooltip="Add Education" size="sm" />}
          </div>
          <div style={isPlaceholderEdu ? placeholderStyle : {}}>
            {(isPlaceholderEdu ? education : resume.education).map((edu, i) => (
              <div key={i} className="mb-3 group relative">
                {editable && !isPlaceholderEdu && (
                  <div className="absolute -right-2 -top-1"><DeleteButton onClick={() => removeEducation(i)} /></div>
                )}
                <ValidatedInput 
                  value={isPlaceholderEdu ? '' : (resume.education[i]?.degree || '')}
                  onChange={(v) => {
                    const newEdu = [...resume.education];
                    newEdu[i] = { ...newEdu[i], degree: v };
                    updateField('education', newEdu);
                  }}
                  className="font-medium text-sm"
                  placeholder={edu.degree}
                  editable={editable && !isPlaceholderEdu}
                />
                <div className="text-xs opacity-80">{edu.institution}</div>
                <div className="text-xs opacity-60">{edu.end_date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <header className="mb-8">
          <ValidatedInput
            value={name}
            onChange={(value) => updateContact('full_name', value)}
            validationType="required"
            className="text-4xl font-bold mb-2 block"
            style={{ color: theme.primary, ...(name ? {} : placeholderStyle) }}
            placeholder={placeholderData.contact.full_name}
            editable={editable}
          />
          <ValidatedInput
            value={summary}
            onChange={(v) => updateField('summary', { summary: v })}
            className="leading-relaxed opacity-80"
            style={summary ? {} : placeholderStyle}
            placeholder={placeholderData.summary}
            multiline
            editable={editable}
          />
        </header>

        {/* Experience */}
        <section>
          <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: `2px solid ${theme.accent}` }}>
            <h2 className="text-lg font-bold uppercase tracking-wider" style={{ color: theme.primary }}>Experience</h2>
            {editable && <InlineAddButton onClick={addExperience} tooltip="Add Experience" />}
          </div>
          <div className="space-y-6" style={isPlaceholderExp ? placeholderStyle : {}}>
            {(isPlaceholderExp ? experience : resume.experience).map((exp, i) => (
              <div key={i} className="group relative">
                {editable && !isPlaceholderExp && (
                  <div className="absolute -right-6 top-0"><DeleteButton onClick={() => removeExperience(i)} /></div>
                )}
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <ValidatedInput 
                      value={isPlaceholderExp ? '' : (resume.experience[i]?.position || '')}
                      onChange={(v) => {
                        const newExp = [...resume.experience];
                        newExp[i] = { ...newExp[i], position: v };
                        updateField('experience', newExp);
                      }}
                      validationType="required"
                      className="font-bold text-base inline"
                      style={{ color: theme.primary }}
                      placeholder={exp.position}
                      editable={editable && !isPlaceholderExp}
                    />
                    <span className="mx-2 opacity-50">|</span>
                    <ValidatedInput 
                      value={isPlaceholderExp ? '' : (resume.experience[i]?.company || '')}
                      onChange={(v) => {
                        const newExp = [...resume.experience];
                        newExp[i] = { ...newExp[i], company: v };
                        updateField('experience', newExp);
                      }}
                      validationType="required"
                      className="font-medium inline"
                      placeholder={exp.company}
                      editable={editable && !isPlaceholderExp}
                    />
                  </div>
                  <span className="text-sm opacity-60">{exp.start_date} – {exp.current ? 'Present' : exp.end_date}</span>
                </div>
                <EditableBulletList
                  items={isPlaceholderExp ? exp.description : (resume.experience[i]?.description || [])}
                  onChange={(items) => {
                    const newExp = [...resume.experience];
                    newExp[i] = { ...newExp[i], description: items };
                    updateField('experience', newExp);
                  }}
                  editable={editable && !isPlaceholderExp}
                  bulletColor={theme.accent}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// Minimal Template
const MinimalTemplate: React.FC<StyledResumeProps> = ({ resume, config, onUpdate, editable = true }) => {
  const { theme, fontSize } = config;
  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';

  // Use placeholder data for empty fields
  const name = resume.contact?.full_name || '';
  const email = resume.contact?.email || '';
  const phone = resume.contact?.phone || '';
  const location = resume.contact?.location || '';
  const summary = resume.summary?.summary || '';
  const experience = resume.experience.length > 0 ? resume.experience : placeholderData.experience;
  const education = resume.education.length > 0 ? resume.education : placeholderData.education;
  const skills = resume.skills.length > 0 ? resume.skills : placeholderData.skills;
  
  const isPlaceholderExp = resume.experience.length === 0;
  const isPlaceholderEdu = resume.education.length === 0;
  const isPlaceholderSkills = resume.skills.length === 0;

  const updateField = (section: keyof ResumeBuilder, value: any) => {
    onUpdate({ ...resume, [section]: value });
  };

  const updateContact = (field: string, value: string) => {
    updateField('contact', { ...resume.contact, [field]: value });
  };

  const addExperience = () => updateField('experience', [...resume.experience, createNewExperience()]);
  const removeExperience = (i: number) => updateField('experience', resume.experience.filter((_, idx) => idx !== i));
  const addEducation = () => updateField('education', [...resume.education, createNewEducation()]);
  const removeEducation = (i: number) => updateField('education', resume.education.filter((_, idx) => idx !== i));
  const addSkillCategory = () => updateField('skills', [...resume.skills, createNewSkillCategory()]);
  const removeSkillCategory = (i: number) => updateField('skills', resume.skills.filter((_, idx) => idx !== i));

  const placeholderStyle = { opacity: 0.5, fontStyle: 'italic' as const };

  return (
    <div 
      className={`p-10 ${fontSizeClass}`} 
      style={{ 
        backgroundColor: theme.background, 
        color: theme.text, 
        fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
        width: `${A4_WIDTH}px`, 
        minHeight: `${A4_HEIGHT}px`,
        maxWidth: `${A4_WIDTH}px`,
      }}
    >
      {/* Simple Header */}
      <header className="mb-8">
        <div className="flex items-center gap-6">
          {config.showPhoto && config.photoUrl && (
            <img src={config.photoUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
          )}
          {!config.photoUrl && config.showPhoto && (
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.accent}20` }}>
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primary }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <div>
            <ValidatedInput
              value={name}
              onChange={(value) => updateContact('full_name', value)}
              validationType="required"
              className="text-2xl font-light tracking-wide block"
              style={{ color: theme.primary, ...(name ? {} : placeholderStyle) }}
              placeholder={placeholderData.contact.full_name}
              editable={editable}
            />
            <div className="flex gap-4 mt-2 text-sm opacity-60">
              <ValidatedInput value={email} onChange={(v) => updateContact('email', v)} validationType="email" placeholder={placeholderData.contact.email} editable={editable} style={email ? {} : placeholderStyle} />
              <ValidatedInput value={phone} onChange={(v) => updateContact('phone', v)} validationType="phone" placeholder={placeholderData.contact.phone} editable={editable} style={phone ? {} : placeholderStyle} />
              <ValidatedInput value={location} onChange={(v) => updateContact('location', v)} placeholder={placeholderData.contact.location} editable={editable} style={location ? {} : placeholderStyle} />
            </div>
          </div>
        </div>
      </header>

      {/* Summary */}
      <section className="mb-8">
        <ValidatedInput 
          value={summary} 
          onChange={(v) => updateField('summary', { summary: v })} 
          className="leading-relaxed opacity-70 w-full" 
          style={summary ? {} : placeholderStyle}
          placeholder={placeholderData.summary}
          multiline 
          editable={editable} 
        />
      </section>

      {/* Experience */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.accent }}>Experience</h2>
          {editable && <InlineAddButton onClick={addExperience} tooltip="Add Experience" />}
        </div>
        <div className="space-y-6" style={isPlaceholderExp ? placeholderStyle : {}}>
          {(isPlaceholderExp ? experience : resume.experience).map((exp, i) => (
            <div key={i} className="group relative">
              {editable && !isPlaceholderExp && (
                <div className="absolute -right-6 top-0"><DeleteButton onClick={() => removeExperience(i)} /></div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="font-medium" style={{ color: theme.primary }}>
                  <ValidatedInput 
                    value={isPlaceholderExp ? '' : (resume.experience[i]?.position || '')}
                    onChange={(v) => {
                      const newExp = [...resume.experience];
                      newExp[i] = { ...newExp[i], position: v };
                      updateField('experience', newExp);
                    }}
                    validationType="required"
                    placeholder={exp.position}
                    editable={editable && !isPlaceholderExp}
                  />, 
                  <ValidatedInput 
                    value={isPlaceholderExp ? '' : (resume.experience[i]?.company || '')}
                    onChange={(v) => {
                      const newExp = [...resume.experience];
                      newExp[i] = { ...newExp[i], company: v };
                      updateField('experience', newExp);
                    }}
                    validationType="required"
                    placeholder={exp.company}
                    editable={editable && !isPlaceholderExp}
                  />
                </span>
                <span className="text-xs opacity-50">{exp.start_date} – {exp.current ? 'Present' : exp.end_date}</span>
              </div>
              <EditableBulletList 
                items={isPlaceholderExp ? exp.description : (resume.experience[i]?.description || [])}
                onChange={(items) => {
                  const newExp = [...resume.experience];
                  newExp[i] = { ...newExp[i], description: items };
                  updateField('experience', newExp);
                }} 
                editable={editable && !isPlaceholderExp} 
                bulletColor={theme.secondary} 
              />
            </div>
          ))}
        </div>
      </section>

      {/* Two Column: Education & Skills */}
      <div className="grid grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.accent }}>Education</h2>
            {editable && <InlineAddButton onClick={addEducation} tooltip="Add Education" size="sm" />}
          </div>
          <div style={isPlaceholderEdu ? placeholderStyle : {}}>
            {(isPlaceholderEdu ? education : resume.education).map((edu, i) => (
              <div key={i} className="mb-2 group relative">
                {editable && !isPlaceholderEdu && (
                  <div className="absolute -right-4 top-0"><DeleteButton onClick={() => removeEducation(i)} /></div>
                )}
                <div className="font-medium" style={{ color: theme.primary }}>{edu.degree}</div>
                <div className="text-sm opacity-60">{edu.institution}, {edu.end_date}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.accent }}>Skills</h2>
            {editable && <InlineAddButton onClick={addSkillCategory} tooltip="Add Category" size="sm" />}
          </div>
          <div style={isPlaceholderSkills ? placeholderStyle : {}}>
            {(isPlaceholderSkills ? skills : resume.skills).map((cat, i) => (
              <div key={i} className="mb-2 text-sm group relative">
                {editable && !isPlaceholderSkills && (
                  <div className="absolute -right-4 top-0"><DeleteButton onClick={() => removeSkillCategory(i)} /></div>
                )}
                {cat.skills.join(' • ')}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// Professional Template
const ProfessionalTemplate: React.FC<StyledResumeProps> = ({ resume, config, onUpdate, editable = true }) => {
  const { theme, fontSize } = config;
  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';

  const name = resume.contact?.full_name || '';
  const email = resume.contact?.email || '';
  const phone = resume.contact?.phone || '';
  const location = resume.contact?.location || '';
  const linkedin = resume.contact?.linkedin || '';
  const summary = resume.summary?.summary || '';
  const experience = resume.experience.length > 0 ? resume.experience : placeholderData.experience;
  const education = resume.education.length > 0 ? resume.education : placeholderData.education;
  const skills = resume.skills.length > 0 ? resume.skills : placeholderData.skills;
  
  const isPlaceholderExp = resume.experience.length === 0;
  const isPlaceholderEdu = resume.education.length === 0;
  const isPlaceholderSkills = resume.skills.length === 0;

  const updateField = (section: keyof ResumeBuilder, value: any) => {
    onUpdate({ ...resume, [section]: value });
  };

  const updateContact = (field: string, value: string) => {
    updateField('contact', { ...resume.contact, [field]: value });
  };

  const addExperience = () => updateField('experience', [...resume.experience, createNewExperience()]);
  const removeExperience = (i: number) => updateField('experience', resume.experience.filter((_, idx) => idx !== i));
  const addEducation = () => updateField('education', [...resume.education, createNewEducation()]);
  const removeEducation = (i: number) => updateField('education', resume.education.filter((_, idx) => idx !== i));
  const addSkillCategory = () => updateField('skills', [...resume.skills, createNewSkillCategory()]);

  const placeholderStyle = { opacity: 0.5, fontStyle: 'italic' as const };

  return (
    <div 
      className={fontSizeClass} 
      style={{ 
        backgroundColor: theme.background, 
        color: theme.text, 
        fontFamily: "'Times New Roman', 'Georgia', serif",
        width: `${A4_WIDTH}px`, 
        minHeight: `${A4_HEIGHT}px`,
        maxWidth: `${A4_WIDTH}px`,
      }}
    >
      {/* Full-width Header */}
      <header className="p-8" style={{ backgroundColor: theme.headerBg, color: theme.headerText }}>
        <div className="flex items-center gap-6">
          {config.showPhoto && config.photoUrl && (
            <img src={config.photoUrl} alt="Profile" className="w-28 h-28 rounded-lg object-cover border-4 border-white/20" />
          )}
          {!config.photoUrl && config.showPhoto && (
            <div className="w-28 h-28 rounded-lg flex items-center justify-center border-4 border-white/20 bg-white/10">
              <svg className="w-14 h-14 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <ValidatedInput
              value={name}
              onChange={(value) => updateContact('full_name', value)}
              validationType="required"
              className="text-3xl font-bold tracking-wide block mb-2"
              style={name ? {} : placeholderStyle}
              placeholder={placeholderData.contact.full_name}
              editable={editable}
            />
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm opacity-90">
              <span style={email ? {} : placeholderStyle}>📧 <ValidatedInput value={email} onChange={(v) => updateContact('email', v)} validationType="email" placeholder={placeholderData.contact.email} editable={editable} /></span>
              <span style={phone ? {} : placeholderStyle}>📱 <ValidatedInput value={phone} onChange={(v) => updateContact('phone', v)} validationType="phone" placeholder={placeholderData.contact.phone} editable={editable} /></span>
              <span style={location ? {} : placeholderStyle}>📍 <ValidatedInput value={location} onChange={(v) => updateContact('location', v)} placeholder={placeholderData.contact.location} editable={editable} /></span>
              <span style={linkedin ? {} : placeholderStyle}>🔗 <ValidatedInput value={linkedin} onChange={(v) => updateContact('linkedin', v)} validationType="url" placeholder={placeholderData.contact.linkedin} editable={editable} /></span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Summary */}
        <section className="mb-6 p-4 rounded-lg" style={{ backgroundColor: `${theme.accent}15`, ...(summary ? {} : placeholderStyle) }}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: theme.primary }}>Profile</h2>
          <ValidatedInput 
            value={summary} 
            onChange={(v) => updateField('summary', { summary: v })} 
            className="leading-relaxed w-full" 
            placeholder={placeholderData.summary}
            multiline 
            editable={editable} 
          />
        </section>

        {/* Experience */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: `3px solid ${theme.accent}` }}>
            <h2 className="text-lg font-bold uppercase tracking-wider" style={{ color: theme.primary }}>Professional Experience</h2>
            {editable && <InlineAddButton onClick={addExperience} tooltip="Add Experience" />}
          </div>
          <div className="space-y-5" style={isPlaceholderExp ? placeholderStyle : {}}>
            {(isPlaceholderExp ? experience : resume.experience).map((exp, i) => (
              <div key={i} className="border-l-4 pl-4 group relative" style={{ borderColor: theme.accent }}>
                {editable && !isPlaceholderExp && (
                  <div className="absolute -right-6 top-0"><DeleteButton onClick={() => removeExperience(i)} /></div>
                )}
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <ValidatedInput 
                      value={isPlaceholderExp ? '' : (resume.experience[i]?.position || '')}
                      onChange={(v) => {
                        const newExp = [...resume.experience];
                        newExp[i] = { ...newExp[i], position: v };
                        updateField('experience', newExp);
                      }}
                      validationType="required"
                      className="font-bold text-base inline"
                      style={{ color: theme.primary }}
                      placeholder={exp.position}
                      editable={editable && !isPlaceholderExp}
                    />
                    <span className="opacity-50"> — </span>
                    <ValidatedInput 
                      value={isPlaceholderExp ? '' : (resume.experience[i]?.company || '')}
                      onChange={(v) => {
                        const newExp = [...resume.experience];
                        newExp[i] = { ...newExp[i], company: v };
                        updateField('experience', newExp);
                      }}
                      validationType="required"
                      className="font-medium inline"
                      placeholder={exp.company}
                      editable={editable && !isPlaceholderExp}
                    />
                  </div>
                  <span className="text-sm font-medium" style={{ color: theme.accent }}>{exp.start_date} – {exp.current ? 'Present' : exp.end_date}</span>
                </div>
                <EditableBulletList
                  items={isPlaceholderExp ? exp.description : (resume.experience[i]?.description || [])}
                  onChange={(items) => {
                    const newExp = [...resume.experience];
                    newExp[i] = { ...newExp[i], description: items };
                    updateField('experience', newExp);
                  }}
                  editable={editable && !isPlaceholderExp}
                  bulletColor={theme.accent}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Education & Skills Grid */}
        <div className="grid grid-cols-2 gap-6">
          <section>
            <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: `3px solid ${theme.accent}` }}>
              <h2 className="text-lg font-bold uppercase tracking-wider" style={{ color: theme.primary }}>Education</h2>
              {editable && <InlineAddButton onClick={addEducation} tooltip="Add Education" size="sm" />}
            </div>
            <div style={isPlaceholderEdu ? placeholderStyle : {}}>
              {(isPlaceholderEdu ? education : resume.education).map((edu, i) => (
                <div key={i} className="mb-3 group relative">
                  {editable && !isPlaceholderEdu && (
                    <div className="absolute -right-4 top-0"><DeleteButton onClick={() => removeEducation(i)} /></div>
                  )}
                  <div className="font-bold" style={{ color: theme.primary }}>{edu.degree}</div>
                  <div className="text-sm">{edu.institution}</div>
                  <div className="text-sm opacity-60">{edu.end_date}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: `3px solid ${theme.accent}` }}>
              <h2 className="text-lg font-bold uppercase tracking-wider" style={{ color: theme.primary }}>Core Competencies</h2>
              {editable && <InlineAddButton onClick={addSkillCategory} tooltip="Add Skills" size="sm" />}
            </div>
            <div className="flex flex-wrap gap-2" style={isPlaceholderSkills ? placeholderStyle : {}}>
              {(isPlaceholderSkills ? skills : resume.skills).flatMap(cat => cat.skills).map((skill, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: `${theme.accent}20`, color: theme.primary }}>
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Creative Template
const CreativeTemplate: React.FC<StyledResumeProps> = ({ resume, config, onUpdate, editable = true }) => {
  const { theme, fontSize } = config;
  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';

  // Use placeholder data for empty fields
  const name = resume.contact?.full_name || '';
  const email = resume.contact?.email || '';
  const phone = resume.contact?.phone || '';
  const location = resume.contact?.location || '';
  const summary = resume.summary?.summary || '';
  const experience = resume.experience.length > 0 ? resume.experience : placeholderData.experience;
  const education = resume.education.length > 0 ? resume.education : placeholderData.education;
  const skills = resume.skills.length > 0 ? resume.skills : placeholderData.skills;
  
  const isPlaceholderExp = resume.experience.length === 0;
  const isPlaceholderEdu = resume.education.length === 0;
  const isPlaceholderSkills = resume.skills.length === 0;

  const updateField = (section: keyof ResumeBuilder, value: any) => {
    onUpdate({ ...resume, [section]: value });
  };

  const updateContact = (field: string, value: string) => {
    updateField('contact', { ...resume.contact, [field]: value });
  };

  // Add/Remove handlers
  const addExperience = () => {
    const newExp = createNewExperience();
    updateField('experience', [...resume.experience, newExp]);
  };

  const removeExperience = (index: number) => {
    updateField('experience', resume.experience.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    const newEdu = createNewEducation();
    updateField('education', [...resume.education, newEdu]);
  };

  const removeEducation = (index: number) => {
    updateField('education', resume.education.filter((_, i) => i !== index));
  };

  const addSkillCategory = () => {
    const newCat = createNewSkillCategory();
    updateField('skills', [...resume.skills, newCat]);
  };

  const removeSkillCategory = (index: number) => {
    updateField('skills', resume.skills.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: any) => {
    const updated = [...resume.experience];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      updateField('experience', updated);
    }
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: any) => {
    const updated = [...resume.education];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      updateField('education', updated);
    }
  };

  const updateSkill = (catIndex: number, skillIndex: number, value: string) => {
    const updated = [...resume.skills];
    if (updated[catIndex]) {
      const updatedSkills = [...updated[catIndex].skills];
      updatedSkills[skillIndex] = value;
      updated[catIndex] = { ...updated[catIndex], skills: updatedSkills };
      updateField('skills', updated);
    }
  };

  const addSkillToCategory = (catIndex: number) => {
    const updated = [...resume.skills];
    if (updated[catIndex]) {
      updated[catIndex] = { ...updated[catIndex], skills: [...updated[catIndex].skills, ''] };
      updateField('skills', updated);
    }
  };

  const removeSkillFromCategory = (catIndex: number, skillIndex: number) => {
    const updated = [...resume.skills];
    if (updated[catIndex]) {
      updated[catIndex] = { ...updated[catIndex], skills: updated[catIndex].skills.filter((_, i) => i !== skillIndex) };
      updateField('skills', updated);
    }
  };

  const placeholderStyle = { opacity: 0.5, fontStyle: 'italic' as const };

  return (
    <div 
      className={fontSizeClass} 
      style={{ 
        width: `${A4_WIDTH}px`, 
        minHeight: `${A4_HEIGHT}px`, 
        maxWidth: `${A4_WIDTH}px`,
        backgroundColor: theme.background, 
        color: theme.text, 
        fontFamily: "'Poppins', 'Montserrat', sans-serif" 
      }}
    >
      {/* Diagonal Header */}
      <header className="relative overflow-hidden p-8 pb-16" style={{ backgroundColor: theme.headerBg, color: theme.headerText }}>
        <div className="absolute bottom-0 left-0 right-0 h-16" style={{ 
          background: theme.background,
          clipPath: 'polygon(0 100%, 100% 0, 100% 100%)'
        }} />
        <div className="flex items-center gap-6 relative z-10">
          {config.showPhoto && config.photoUrl && (
            <img src={config.photoUrl} alt="Profile" className="w-28 h-28 rounded-2xl object-cover shadow-xl border-4 border-white/30" />
          )}
          {!config.photoUrl && config.showPhoto && (
            <div className="w-28 h-28 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white/30 bg-white/10">
              <svg className="w-14 h-14 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <div>
            <ValidatedInput
              value={name}
              onChange={(value) => updateContact('full_name', value)}
              validationType="required"
              placeholder={placeholderData.contact.full_name}
              editable={editable}
              className="text-4xl font-black tracking-tight block mb-1 bg-transparent border-none text-inherit"
              style={name ? {} : placeholderStyle}
            />
            <div className="text-lg opacity-80 font-light" style={experience[0]?.position ? {} : placeholderStyle}>
              {experience[0]?.position || placeholderData.experience[0].position}
            </div>
          </div>
        </div>
      </header>

      <div className="p-8 pt-4">
        {/* Contact Pills */}
        <div className="flex flex-wrap gap-3 mb-8 -mt-4">
          <span className="px-4 py-2 rounded-full shadow-md text-sm font-medium flex items-center" style={{ backgroundColor: theme.accent, color: 'white' }}>
            <ValidatedInput 
              value={email} 
              onChange={(v) => updateContact('email', v)} 
              validationType="email"
              placeholder={placeholderData.contact.email} 
              editable={editable} 
              className="bg-transparent border-none text-inherit text-center"
              style={email ? {} : placeholderStyle}
            />
          </span>
          <span className="px-4 py-2 rounded-full shadow-md text-sm font-medium flex items-center" style={{ backgroundColor: theme.headerBg, color: theme.headerText }}>
            <ValidatedInput 
              value={phone} 
              onChange={(v) => updateContact('phone', v)} 
              validationType="phone"
              placeholder={placeholderData.contact.phone} 
              editable={editable} 
              className="bg-transparent border-none text-inherit text-center"
              style={phone ? {} : placeholderStyle}
            />
          </span>
          <span className="px-4 py-2 rounded-full shadow-md text-sm font-medium border-2 flex items-center" style={{ borderColor: theme.accent, color: theme.primary }}>
            <ValidatedInput 
              value={location} 
              onChange={(v) => updateContact('location', v)} 
              validationType="required"
              placeholder={placeholderData.contact.location} 
              editable={editable} 
              className="bg-transparent border-none text-inherit text-center"
              style={location ? {} : placeholderStyle}
            />
          </span>
        </div>

        {/* Summary Card */}
        <section className="mb-8 p-6 rounded-2xl shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.headerBg}, ${theme.accent})`, color: 'white' }}>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3 opacity-80">About Me</h2>
          <EditableText 
            value={summary} 
            onChange={(v) => updateField('summary', { summary: v })} 
            className="leading-relaxed font-light" 
            style={summary ? {} : placeholderStyle}
            placeholder={placeholderData.summary}
            multiline 
            editable={editable} 
          />
        </section>

        {/* Experience Timeline */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.accent, color: 'white' }}>💼</span>
              Experience
            </h2>
            {editable && <InlineAddButton onClick={addExperience} tooltip="Add Experience" />}
          </div>
          <div className="space-y-6 border-l-4 ml-4 pl-6" style={{ borderColor: theme.accent }}>
            {experience.map((exp, i) => {
              const isPlaceholder = isPlaceholderExp;
              return (
                <div key={i} className="relative group" style={isPlaceholder ? placeholderStyle : {}}>
                  {editable && !isPlaceholder && <DeleteButton onClick={() => removeExperience(i)} />}
                  <div className="absolute -left-8 w-4 h-4 rounded-full" style={{ backgroundColor: theme.accent }} />
                  <EditableText
                    value={exp.position}
                    onChange={(v) => updateExperience(i, 'position', v)}
                    className="font-bold text-lg"
                    style={{ color: theme.primary }}
                    placeholder="Position"
                    editable={editable && !isPlaceholder}
                  />
                  <div className="text-sm font-medium opacity-70 mb-2 flex gap-1 items-center flex-wrap">
                    <EditableText value={exp.company} onChange={(v) => updateExperience(i, 'company', v)} placeholder="Company" editable={editable && !isPlaceholder} />
                    <span>•</span>
                    <EditableText value={exp.start_date} onChange={(v) => updateExperience(i, 'start_date', v)} placeholder="Start" editable={editable && !isPlaceholder} />
                    <span>–</span>
                    <EditableText value={exp.current ? 'Present' : (exp.end_date || '')} onChange={(v) => updateExperience(i, 'end_date', v)} placeholder="End" editable={editable && !isPlaceholder} />
                  </div>
                  <ul className="list-none space-y-0.5 mt-1">
                    {exp.description.map((desc, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span style={{ color: theme.accent }} className="mt-1">▹</span>
                        <EditableText
                          value={desc}
                          onChange={(v) => {
                            const newDesc = [...exp.description];
                            newDesc[j] = v;
                            updateExperience(i, 'description', newDesc);
                          }}
                          className="text-sm leading-relaxed"
                          placeholder="Description"
                          editable={editable && !isPlaceholder}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Skills as Tags */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.accent, color: 'white' }}>⚡</span>
              Skills
            </h2>
            {editable && <InlineAddButton onClick={addSkillCategory} tooltip="Add Skill Category" />}
          </div>
          {skills.map((cat, ci) => {
            const isPlaceholder = isPlaceholderSkills;
            return (
              <div key={ci} className="mb-4 group relative" style={isPlaceholder ? placeholderStyle : {}}>
                {editable && !isPlaceholder && <DeleteButton onClick={() => removeSkillCategory(ci)} />}
                <div className="flex items-center gap-2 mb-2">
                  <EditableText
                    value={cat.category}
                    onChange={(v) => {
                      const updated = [...resume.skills];
                      updated[ci] = { ...updated[ci], category: v };
                      updateField('skills', updated);
                    }}
                    className="font-semibold text-sm"
                    style={{ color: theme.primary }}
                    placeholder="Category"
                    editable={editable && !isPlaceholder}
                  />
                  {editable && !isPlaceholder && (
                    <button
                      onClick={() => addSkillToCategory(ci)}
                      className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs hover:bg-blue-600"
                      title="Add Skill"
                    >
                      +
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill, si) => (
                    <span 
                      key={`${ci}-${si}`} 
                      className="px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-transform hover:scale-105 group/skill relative"
                      style={{ 
                        backgroundColor: ci % 2 === 0 ? `${theme.headerBg}15` : `${theme.accent}15`,
                        color: theme.primary,
                        border: `1px solid ${ci % 2 === 0 ? theme.headerBg : theme.accent}30`
                      }}
                    >
                      <EditableText
                        value={skill}
                        onChange={(v) => updateSkill(ci, si, v)}
                        placeholder="Skill"
                        editable={editable && !isPlaceholder}
                      />
                      {editable && !isPlaceholder && (
                        <button
                          onClick={() => removeSkillFromCategory(ci, si)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover/skill:opacity-100 hover:bg-red-600"
                          title="Remove Skill"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Education Cards */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.accent, color: 'white' }}>🎓</span>
              Education
            </h2>
            {editable && <InlineAddButton onClick={addEducation} tooltip="Add Education" />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {education.map((edu, i) => {
              const isPlaceholder = isPlaceholderEdu;
              return (
                <div key={i} className="p-4 rounded-xl border-2 group relative" style={{ borderColor: `${theme.accent}30`, ...(isPlaceholder ? placeholderStyle : {}) }}>
                  {editable && !isPlaceholder && <DeleteButton onClick={() => removeEducation(i)} />}
                  <EditableText
                    value={edu.degree}
                    onChange={(v) => updateEducation(i, 'degree', v)}
                    className="font-bold"
                    style={{ color: theme.primary }}
                    placeholder="Degree"
                    editable={editable && !isPlaceholder}
                  />
                  <EditableText
                    value={edu.institution}
                    onChange={(v) => updateEducation(i, 'institution', v)}
                    className="text-sm opacity-70"
                    placeholder="Institution"
                    editable={editable && !isPlaceholder}
                  />
                  <EditableText
                    value={edu.end_date || ''}
                    onChange={(v) => updateEducation(i, 'end_date', v)}
                    className="text-xs mt-1 opacity-50"
                    placeholder="Year"
                    editable={editable && !isPlaceholder}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

// Custom Template Maker - Drag, drop, scale sections with background color
const CustomTemplateMaker: React.FC<StyledResumeProps> = ({ resume, config, onUpdate, editable = true }) => {
  const { theme, fontSize } = config;
  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';
  
  // Initialize custom layout if not present
  const customLayout = config.customLayout || {
    sections: [
      { id: 'header', type: 'header' as const, x: 0, y: 0, width: 100, height: 15, scale: 1 },
      { id: 'summary', type: 'summary' as const, x: 0, y: 16, width: 100, height: 12, scale: 1 },
      { id: 'experience', type: 'experience' as const, x: 0, y: 29, width: 60, height: 35, scale: 1 },
      { id: 'skills', type: 'skills' as const, x: 62, y: 29, width: 38, height: 20, scale: 1 },
      { id: 'education', type: 'education' as const, x: 62, y: 50, width: 38, height: 14, scale: 1 },
    ],
    backgroundColor: theme.background,
  };

  const [draggedSection, setDraggedSection] = React.useState<string | null>(null);
  const [resizingSection, setResizingSection] = React.useState<string | null>(null);
  const [showLayoutPanel, setShowLayoutPanel] = React.useState(false);
  const [bgColor, setBgColor] = React.useState(customLayout.backgroundColor);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Use placeholder data for empty fields
  const name = resume.contact?.full_name || '';
  const email = resume.contact?.email || '';
  const phone = resume.contact?.phone || '';
  const location = resume.contact?.location || '';
  const summary = resume.summary?.summary || '';
  const experience = resume.experience.length > 0 ? resume.experience : placeholderData.experience;
  const education = resume.education.length > 0 ? resume.education : placeholderData.education;
  const skills = resume.skills.length > 0 ? resume.skills : placeholderData.skills;
  
  const isPlaceholderExp = resume.experience.length === 0;
  const isPlaceholderEdu = resume.education.length === 0;
  const isPlaceholderSkills = resume.skills.length === 0;

  const updateField = (section: keyof ResumeBuilder, value: any) => {
    onUpdate({ ...resume, [section]: value });
  };

  const updateContact = (field: string, value: string) => {
    updateField('contact', { ...resume.contact, [field]: value });
  };

  // Add/Remove handlers
  const addExperience = () => {
    updateField('experience', [...resume.experience, createNewExperience()]);
  };

  const removeExperience = (index: number) => {
    updateField('experience', resume.experience.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    updateField('education', [...resume.education, createNewEducation()]);
  };

  const removeEducation = (index: number) => {
    updateField('education', resume.education.filter((_, i) => i !== index));
  };

  const addSkillCategory = () => {
    updateField('skills', [...resume.skills, createNewSkillCategory()]);
  };

  const removeSkillCategory = (index: number) => {
    updateField('skills', resume.skills.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: any) => {
    const updated = [...resume.experience];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      updateField('experience', updated);
    }
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: any) => {
    const updated = [...resume.education];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      updateField('education', updated);
    }
  };

  // Layout update function - notifies parent of config change
  const updateSectionLayout = (sectionId: string, updates: Partial<CustomSection>) => {
    const updatedSections = customLayout.sections.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    );
    // Note: This would need parent to handle config updates
    console.log('Layout updated:', { sectionId, updates, sections: updatedSections });
  };

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    if (!editable) return;
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current || !draggedSection) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    updateSectionLayout(draggedSection, { x: Math.max(0, Math.min(90, x)), y: Math.max(0, Math.min(90, y)) });
    setDraggedSection(null);
  };

  const placeholderStyle = { opacity: 0.5, fontStyle: 'italic' as const };

  // Render individual section based on type
  const renderSection = (section: CustomSection) => {
    const sectionStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${section.x}%`,
      top: `${section.y}%`,
      width: `${section.width}%`,
      minHeight: `${section.height}%`,
      transform: `scale(${section.scale})`,
      transformOrigin: 'top left',
      cursor: editable ? 'move' : 'default',
      border: editable ? '1px dashed rgba(59, 130, 246, 0.3)' : 'none',
      borderRadius: '8px',
      padding: '8px',
      overflow: 'hidden',
    };

    const renderHandle = () => editable && (
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          setResizingSection(section.id);
        }}
        title="Resize"
      />
    );

    switch (section.type) {
      case 'header':
        return (
          <div
            key={section.id}
            className="group"
            style={{ ...sectionStyle, backgroundColor: theme.headerBg, color: theme.headerText, borderRadius: '12px' }}
            draggable={editable}
            onDragStart={(e) => handleDragStart(e, section.id)}
          >
            {renderHandle()}
            <div className="flex items-center gap-4 p-4">
              {config.showPhoto && config.photoUrl && (
                <img src={config.photoUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-white/30" />
              )}
              {!config.photoUrl && config.showPhoto && (
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/10 border-2 border-white/30">
                  <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <ValidatedInput
                  value={name}
                  onChange={(v) => updateContact('full_name', v)}
                  validationType="required"
                  placeholder={placeholderData.contact.full_name}
                  editable={editable}
                  className="text-2xl font-bold bg-transparent border-none"
                  style={name ? {} : placeholderStyle}
                />
                <div className="flex flex-wrap gap-3 text-sm mt-2 opacity-80">
                  <ValidatedInput value={email} onChange={(v) => updateContact('email', v)} validationType="email" placeholder={placeholderData.contact.email} editable={editable} className="bg-transparent border-none" style={email ? {} : placeholderStyle} />
                  <ValidatedInput value={phone} onChange={(v) => updateContact('phone', v)} validationType="phone" placeholder={placeholderData.contact.phone} editable={editable} className="bg-transparent border-none" style={phone ? {} : placeholderStyle} />
                  <ValidatedInput value={location} onChange={(v) => updateContact('location', v)} validationType="required" placeholder={placeholderData.contact.location} editable={editable} className="bg-transparent border-none" style={location ? {} : placeholderStyle} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div
            key={section.id}
            className="group"
            style={{ ...sectionStyle, backgroundColor: `${theme.accent}10`, borderRadius: '12px' }}
            draggable={editable}
            onDragStart={(e) => handleDragStart(e, section.id)}
          >
            {renderHandle()}
            <div className="p-3">
              <h2 className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: theme.primary }}>About Me</h2>
              <EditableText 
                value={summary} 
                onChange={(v) => updateField('summary', { summary: v })} 
                className="text-sm leading-relaxed" 
                style={summary ? {} : placeholderStyle}
                placeholder={placeholderData.summary}
                multiline 
                editable={editable} 
              />
            </div>
          </div>
        );

      case 'experience':
        return (
          <div
            key={section.id}
            className="group"
            style={sectionStyle}
            draggable={editable}
            onDragStart={(e) => handleDragStart(e, section.id)}
          >
            {renderHandle()}
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: theme.primary }}>Experience</h2>
              {editable && <InlineAddButton onClick={addExperience} tooltip="Add Experience" />}
            </div>
            <div className="space-y-3">
              {experience.map((exp, i) => {
                const isPlaceholder = isPlaceholderExp;
                return (
                  <div key={i} className="relative group/item border-l-2 pl-3" style={{ borderColor: theme.accent, ...(isPlaceholder ? placeholderStyle : {}) }}>
                    {editable && !isPlaceholder && <DeleteButton onClick={() => removeExperience(i)} />}
                    <EditableText value={exp.position} onChange={(v) => updateExperience(i, 'position', v)} className="font-semibold text-sm" style={{ color: theme.primary }} placeholder="Position" editable={editable && !isPlaceholder} />
                    <div className="text-xs opacity-70">{exp.company} • {exp.start_date} – {exp.current ? 'Present' : exp.end_date}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'skills':
        return (
          <div
            key={section.id}
            className="group"
            style={sectionStyle}
            draggable={editable}
            onDragStart={(e) => handleDragStart(e, section.id)}
          >
            {renderHandle()}
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: theme.primary }}>Skills</h2>
              {editable && <InlineAddButton onClick={addSkillCategory} tooltip="Add Category" />}
            </div>
            <div className="space-y-2" style={isPlaceholderSkills ? placeholderStyle : {}}>
              {skills.map((cat, ci) => (
                <div key={ci} className="group/cat relative">
                  {editable && !isPlaceholderSkills && <DeleteButton onClick={() => removeSkillCategory(ci)} />}
                  <div className="text-xs font-semibold mb-1" style={{ color: theme.accent }}>{cat.category}</div>
                  <div className="flex flex-wrap gap-1">
                    {cat.skills.map((skill, si) => (
                      <span key={si} className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: `${theme.accent}20`, color: theme.text }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'education':
        return (
          <div
            key={section.id}
            className="group"
            style={sectionStyle}
            draggable={editable}
            onDragStart={(e) => handleDragStart(e, section.id)}
          >
            {renderHandle()}
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: theme.primary }}>Education</h2>
              {editable && <InlineAddButton onClick={addEducation} tooltip="Add Education" />}
            </div>
            <div className="space-y-2" style={isPlaceholderEdu ? placeholderStyle : {}}>
              {education.map((edu, i) => (
                <div key={i} className="relative group/item">
                  {editable && !isPlaceholderEdu && <DeleteButton onClick={() => removeEducation(i)} />}
                  <EditableText value={edu.degree} onChange={(v) => updateEducation(i, 'degree', v)} className="font-semibold text-sm" style={{ color: theme.primary }} placeholder="Degree" editable={editable && !isPlaceholderEdu} />
                  <div className="text-xs opacity-70">{edu.institution} • {edu.end_date}</div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={fontSizeClass}>
      {/* Layout Control Panel */}
      {editable && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-gray-700">🎨 Custom Layout Controls</h3>
            <button
              onClick={() => setShowLayoutPanel(!showLayoutPanel)}
              className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {showLayoutPanel ? 'Hide' : 'Show'} Section Controls
            </button>
          </div>
          
          <div className="flex items-center gap-4 mb-3">
            <label className="text-sm font-medium text-gray-600">Background Color:</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border border-gray-300"
            />
            <span className="text-xs text-gray-500">{bgColor}</span>
          </div>

          {showLayoutPanel && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-gray-200">
              {customLayout.sections.map((section) => (
                <div key={section.id} className="p-2 bg-white rounded border border-gray-200">
                  <div className="text-xs font-semibold capitalize mb-2 text-gray-700">{section.type}</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <label className="text-gray-500">X:</label>
                      <input
                        type="number"
                        value={Math.round(section.x)}
                        onChange={(e) => updateSectionLayout(section.id, { x: Number(e.target.value) })}
                        className="w-full px-1 py-0.5 border rounded text-xs"
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <label className="text-gray-500">Y:</label>
                      <input
                        type="number"
                        value={Math.round(section.y)}
                        onChange={(e) => updateSectionLayout(section.id, { y: Number(e.target.value) })}
                        className="w-full px-1 py-0.5 border rounded text-xs"
                        min={0}
                        max={100}
                      />
                    </div>
                    <div>
                      <label className="text-gray-500">W:</label>
                      <input
                        type="number"
                        value={Math.round(section.width)}
                        onChange={(e) => updateSectionLayout(section.id, { width: Number(e.target.value) })}
                        className="w-full px-1 py-0.5 border rounded text-xs"
                        min={10}
                        max={100}
                      />
                    </div>
                    <div>
                      <label className="text-gray-500">H:</label>
                      <input
                        type="number"
                        value={Math.round(section.height)}
                        onChange={(e) => updateSectionLayout(section.id, { height: Number(e.target.value) })}
                        className="w-full px-1 py-0.5 border rounded text-xs"
                        min={5}
                        max={100}
                      />
                    </div>
                  </div>
                  <div className="mt-1">
                    <label className="text-gray-500 text-xs">Scale:</label>
                    <input
                      type="range"
                      value={section.scale}
                      onChange={(e) => updateSectionLayout(section.id, { scale: Number(e.target.value) })}
                      className="w-full"
                      min={0.5}
                      max={1.5}
                      step={0.1}
                    />
                    <span className="text-xs text-gray-500">{section.scale}x</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-3">
            💡 Tip: Drag sections to reposition them. Use the control panel above to fine-tune positions, sizes, and scale.
          </p>
        </div>
      )}

      {/* A4 Canvas */}
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: `${A4_WIDTH}px`,
          minHeight: `${A4_HEIGHT}px`,
          maxWidth: `${A4_WIDTH}px`,
          backgroundColor: bgColor,
          color: theme.text,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {customLayout.sections.map(renderSection)}
      </div>
    </div>
  );
};

// Main export
export const StyledResume: React.FC<StyledResumeProps> = (props) => {
  const templates: Record<TemplateStyle, React.FC<StyledResumeProps>> = {
    classic: ClassicTemplate,
    modern: ModernTemplate,
    minimal: MinimalTemplate,
    professional: ProfessionalTemplate,
    creative: CreativeTemplate,
    custom: CustomTemplateMaker,
  };

  const Template = templates[props.config.style];
  return <Template {...props} />;
};
