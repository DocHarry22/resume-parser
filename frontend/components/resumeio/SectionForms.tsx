'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  User, Mail, Phone, MapPin, Linkedin, Globe, Github,
  Briefcase, GraduationCap, Wrench, FolderOpen, Award, Languages,
  Plus, Trash2, Calendar, Link2, Camera, X
} from 'lucide-react';
import { CollapsibleEntry, AddButton } from './CollapsibleSection';
import { 
  ResumeBuilder,
  ContactInfo, 
  ExperienceEntry, 
  EducationEntry, 
  SkillCategory,
  ProjectEntry,
  CertificationEntry 
} from '@/types/builder';

// ============ Base Form Components ============

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
  icon?: React.ReactNode;
}

function Input({ error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        className={cn(
          'w-full px-4 py-2.5 text-sm border rounded-xl transition-all duration-200 outline-none',
          icon ? 'pl-10' : '',
          error
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
            : 'border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-300',
          className
        )}
        {...props}
      />
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

function TextArea({ error, className = '', ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(
        'w-full px-4 py-3 text-sm border rounded-xl transition-all duration-200 outline-none resize-none',
        error
          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
          : 'border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-300',
        className
      )}
      {...props}
    />
  );
}

// ============ Personal Details Form ============

interface PersonalDetailsFormProps {
  contact: ContactInfo | undefined;
  onChange: (contact: ContactInfo) => void;
}

export function PersonalDetailsForm({ contact, onChange }: PersonalDetailsFormProps) {
  const data = contact || {
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
    photo: '',
  };

  const update = (field: keyof ContactInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onChange({ ...data, photo: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    onChange({ ...data, photo: '' });
  };

  return (
    <div className="space-y-5">
      {/* Photo Upload */}
      <div className="flex items-start gap-4">
        <div className="relative group">
          {data.photo ? (
            <div className="relative">
              <img
                src={data.photo}
                alt="Profile"
                className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
              />
              <button
                onClick={removePhoto}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Camera className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Add Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Profile Photo</p>
          <p className="text-xs text-gray-400 mt-1">Optional. Upload a professional headshot.</p>
          <p className="text-xs text-gray-400">Max 2MB, JPG or PNG recommended.</p>
          {data.photo && (
            <label className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
              Change photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <FormField label="Full Name" required>
        <Input
          value={data.full_name}
          onChange={(e) => update('full_name', e.target.value)}
          placeholder="John Doe"
          icon={<User className="w-4 h-4" />}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Email" required>
          <Input
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="john@example.com"
            icon={<Mail className="w-4 h-4" />}
          />
        </FormField>
        <FormField label="Phone">
          <Input
            type="tel"
            value={data.phone || ''}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            icon={<Phone className="w-4 h-4" />}
          />
        </FormField>
      </div>

      <FormField label="Location">
        <Input
          value={data.location || ''}
          onChange={(e) => update('location', e.target.value)}
          placeholder="San Francisco, CA"
          icon={<MapPin className="w-4 h-4" />}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="LinkedIn" hint="Your LinkedIn URL">
          <Input
            value={data.linkedin || ''}
            onChange={(e) => update('linkedin', e.target.value)}
            placeholder="linkedin.com/in/johndoe"
            icon={<Linkedin className="w-4 h-4" />}
          />
        </FormField>
        <FormField label="Website / Portfolio">
          <Input
            value={data.website || ''}
            onChange={(e) => update('website', e.target.value)}
            placeholder="johndoe.com"
            icon={<Globe className="w-4 h-4" />}
          />
        </FormField>
      </div>

      <FormField label="GitHub">
        <Input
          value={data.github || ''}
          onChange={(e) => update('github', e.target.value)}
          placeholder="github.com/johndoe"
          icon={<Github className="w-4 h-4" />}
        />
      </FormField>
    </div>
  );
}

// ============ Summary Form ============

interface SummaryFormProps {
  summary: string;
  onChange: (summary: string) => void;
}

export function SummaryForm({ summary, onChange }: SummaryFormProps) {
  const wordCount = summary?.split(/\s+/).filter(Boolean).length || 0;
  const isOptimal = wordCount >= 40 && wordCount <= 80;

  return (
    <div className="space-y-4">
      {/* Tips */}
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
          value={summary || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Results-driven software engineer with 5+ years of experience in building scalable web applications. Expertise in React, Node.js, and cloud technologies. Led cross-functional teams to deliver projects 20% faster. Passionate about clean code and user-centric design."
          rows={5}
        />
      </FormField>

      <div className="flex items-center justify-between">
        <div className={cn('text-xs', isOptimal ? 'text-green-600' : wordCount > 80 ? 'text-amber-600' : 'text-gray-400')}>
          {wordCount} words {isOptimal && '✓ Optimal length'}
        </div>
        <span className="text-xs text-gray-400">Recommended: 40-80 words</span>
      </div>
    </div>
  );
}

// ============ Experience Form ============

interface ExperienceFormProps {
  experience: ExperienceEntry[];
  onChange: (experience: ExperienceEntry[]) => void;
}

export function ExperienceForm({ experience, onChange }: ExperienceFormProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(experience.length > 0 ? 0 : null);

  const handleAdd = () => {
    const newExp: ExperienceEntry = {
      company: '',
      position: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: [],
      achievements: [],
    };
    onChange([...experience, newExp]);
    setOpenIndex(experience.length);
  };

  const handleUpdate = (index: number, updates: Partial<ExperienceEntry>) => {
    const updated = experience.map((exp, i) => (i === index ? { ...exp, ...updates } : exp));
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(experience.filter((_, i) => i !== index));
    setOpenIndex(null);
  };

  const handleDescriptionChange = (expIndex: number, descIndex: number, value: string) => {
    const exp = experience[expIndex];
    const descriptions = [...exp.description];
    descriptions[descIndex] = value;
    handleUpdate(expIndex, { description: descriptions });
  };

  const addDescription = (expIndex: number) => {
    const exp = experience[expIndex];
    handleUpdate(expIndex, { description: [...exp.description, ''] });
  };

  const removeDescription = (expIndex: number, descIndex: number) => {
    const exp = experience[expIndex];
    handleUpdate(expIndex, { description: exp.description.filter((_, i) => i !== descIndex) });
  };

  return (
    <div className="space-y-4">
      {experience.map((exp, index) => (
        <CollapsibleEntry
          key={index}
          title={exp.position || 'New Position'}
          subtitle={exp.company ? `${exp.company}${exp.start_date ? ` · ${exp.start_date}` : ''}` : undefined}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          onDelete={() => handleDelete(index)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Job Title" required>
                <Input
                  value={exp.position}
                  onChange={(e) => handleUpdate(index, { position: e.target.value })}
                  placeholder="Software Engineer"
                  icon={<Briefcase className="w-4 h-4" />}
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
                icon={<MapPin className="w-4 h-4" />}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" required>
                <Input
                  type="month"
                  value={exp.start_date}
                  onChange={(e) => handleUpdate(index, { start_date: e.target.value })}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </FormField>
              <FormField label="End Date">
                <div className="space-y-2">
                  <Input
                    type="month"
                    value={exp.end_date}
                    onChange={(e) => handleUpdate(index, { end_date: e.target.value })}
                    disabled={exp.current}
                    icon={<Calendar className="w-4 h-4" />}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => handleUpdate(index, { current: e.target.checked, end_date: e.target.checked ? '' : exp.end_date })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    I currently work here
                  </label>
                </div>
              </FormField>
            </div>

            {/* Description / Bullet Points */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Key Responsibilities & Achievements</label>
              <p className="text-xs text-gray-400">Start with action verbs. Include metrics when possible.</p>
              {exp.description.map((desc, descIndex) => (
                <div key={descIndex} className="flex gap-2 items-start">
                  <span className="mt-3 text-gray-300">•</span>
                  <TextArea
                    value={desc}
                    onChange={(e) => handleDescriptionChange(index, descIndex, e.target.value)}
                    placeholder="Increased system performance by 40% through..."
                    rows={2}
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeDescription(index, descIndex)}
                    className="mt-2 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addDescription(index)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-2"
              >
                <Plus className="w-4 h-4" />
                Add Bullet Point
              </button>
            </div>
          </div>
        </CollapsibleEntry>
      ))}

      <AddButton onClick={handleAdd} label="Add Work Experience" />
    </div>
  );
}

// ============ Education Form ============

interface EducationFormProps {
  education: EducationEntry[];
  onChange: (education: EducationEntry[]) => void;
}

export function EducationForm({ education, onChange }: EducationFormProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(education.length > 0 ? 0 : null);

  const handleAdd = () => {
    const newEdu: EducationEntry = {
      institution: '',
      degree: '',
      field_of_study: '',
      location: '',
      start_date: '',
      end_date: '',
      gpa: undefined,
      honors: [],
    };
    onChange([...education, newEdu]);
    setOpenIndex(education.length);
  };

  const handleUpdate = (index: number, updates: Partial<EducationEntry>) => {
    const updated = education.map((edu, i) => (i === index ? { ...edu, ...updates } : edu));
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(education.filter((_, i) => i !== index));
    setOpenIndex(null);
  };

  return (
    <div className="space-y-4">
      {education.map((edu, index) => (
        <CollapsibleEntry
          key={index}
          title={edu.degree || 'New Education'}
          subtitle={edu.institution ? `${edu.institution}${edu.end_date ? ` · ${edu.end_date}` : ''}` : undefined}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          onDelete={() => handleDelete(index)}
        >
          <div className="space-y-4">
            <FormField label="Degree" required>
              <Input
                value={edu.degree}
                onChange={(e) => handleUpdate(index, { degree: e.target.value })}
                placeholder="Bachelor of Science"
                icon={<GraduationCap className="w-4 h-4" />}
              />
            </FormField>

            <FormField label="Field of Study">
              <Input
                value={edu.field_of_study || ''}
                onChange={(e) => handleUpdate(index, { field_of_study: e.target.value })}
                placeholder="Computer Science"
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
                icon={<MapPin className="w-4 h-4" />}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date">
                <Input
                  type="month"
                  value={edu.start_date || ''}
                  onChange={(e) => handleUpdate(index, { start_date: e.target.value })}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </FormField>
              <FormField label="End Date / Expected">
                <Input
                  type="month"
                  value={edu.end_date || ''}
                  onChange={(e) => handleUpdate(index, { end_date: e.target.value })}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="GPA" hint="Optional">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={edu.gpa || ''}
                  onChange={(e) => handleUpdate(index, { gpa: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="3.8"
                />
              </FormField>
              <FormField label="Honors & Awards" hint="Comma-separated">
                <Input
                  value={edu.honors.join(', ')}
                  onChange={(e) => handleUpdate(index, { honors: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Magna Cum Laude, Dean's List"
                />
              </FormField>
            </div>
          </div>
        </CollapsibleEntry>
      ))}

      <AddButton onClick={handleAdd} label="Add Education" />
    </div>
  );
}

// ============ Skills Form ============

interface SkillsFormProps {
  skills: SkillCategory[];
  onChange: (skills: SkillCategory[]) => void;
}

export function SkillsForm({ skills, onChange }: SkillsFormProps) {
  const [newSkill, setNewSkill] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const allCategories = Array.from(new Set(skills.map(s => s.category)));

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    const category = newCategory.trim() || 'General';
    const existingCategoryIndex = skills.findIndex(s => s.category === category);
    
    if (existingCategoryIndex >= 0) {
      const updated = skills.map((s, i) => 
        i === existingCategoryIndex 
          ? { ...s, skills: [...s.skills, newSkill.trim()] }
          : s
      );
      onChange(updated);
    } else {
      onChange([...skills, { category, skills: [newSkill.trim()] }]);
    }
    
    setNewSkill('');
  };

  const handleRemoveSkill = (categoryIndex: number, skillIndex: number) => {
    const updated = skills.map((cat, i) => {
      if (i === categoryIndex) {
        const newSkills = cat.skills.filter((_, j) => j !== skillIndex);
        return { ...cat, skills: newSkills };
      }
      return cat;
    }).filter(cat => cat.skills.length > 0);
    
    onChange(updated);
  };

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
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
            className="flex-1"
            icon={<Wrench className="w-4 h-4" />}
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="">Select Category</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            <option value="Technical">Technical</option>
            <option value="Soft Skills">Soft Skills</option>
            <option value="Languages">Languages</option>
            <option value="Tools">Tools</option>
            <option value="Frameworks">Frameworks</option>
          </select>
          <button
            onClick={handleAddSkill}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Grouped Skills */}
      {skills.map((category, catIndex) => (
        <div key={catIndex} className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            {category.category}
            <span className="text-xs font-normal text-gray-400">({category.skills.length})</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {category.skills.map((skill, skillIndex) => (
              <span
                key={skillIndex}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(catIndex, skillIndex)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-blue-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ))}

      {skills.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No skills added yet</p>
          <p className="text-xs mt-1">Start adding your skills above</p>
        </div>
      )}
    </div>
  );
}

// ============ Projects Form ============

interface ProjectsFormProps {
  projects: ProjectEntry[];
  onChange: (projects: ProjectEntry[]) => void;
}

export function ProjectsForm({ projects, onChange }: ProjectsFormProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(projects.length > 0 ? 0 : null);

  const handleAdd = () => {
    const newProject: ProjectEntry = {
      name: '',
      description: '',
      technologies: [],
      url: '',
      github: '',
      start_date: '',
      end_date: '',
      highlights: [],
    };
    onChange([...projects, newProject]);
    setOpenIndex(projects.length);
  };

  const handleUpdate = (index: number, updates: Partial<ProjectEntry>) => {
    const updated = projects.map((proj, i) => (i === index ? { ...proj, ...updates } : proj));
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(projects.filter((_, i) => i !== index));
    setOpenIndex(null);
  };

  return (
    <div className="space-y-4">
      {projects.map((project, index) => (
        <CollapsibleEntry
          key={index}
          title={project.name || 'New Project'}
          subtitle={project.technologies.slice(0, 3).join(', ') || undefined}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          onDelete={() => handleDelete(index)}
        >
          <div className="space-y-4">
            <FormField label="Project Name" required>
              <Input
                value={project.name}
                onChange={(e) => handleUpdate(index, { name: e.target.value })}
                placeholder="E-commerce Platform"
                icon={<FolderOpen className="w-4 h-4" />}
              />
            </FormField>

            <FormField label="Description">
              <TextArea
                value={project.description}
                onChange={(e) => handleUpdate(index, { description: e.target.value })}
                placeholder="Built a full-stack e-commerce platform with real-time inventory management..."
                rows={3}
              />
            </FormField>

            <FormField label="Technologies Used" hint="Comma-separated">
              <Input
                value={project.technologies.join(', ')}
                onChange={(e) => handleUpdate(index, { technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="React, Node.js, PostgreSQL, AWS"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Live URL">
                <Input
                  value={project.url || ''}
                  onChange={(e) => handleUpdate(index, { url: e.target.value })}
                  placeholder="https://myproject.com"
                  icon={<Link2 className="w-4 h-4" />}
                />
              </FormField>
              <FormField label="GitHub URL">
                <Input
                  value={project.github || ''}
                  onChange={(e) => handleUpdate(index, { github: e.target.value })}
                  placeholder="github.com/user/repo"
                  icon={<Github className="w-4 h-4" />}
                />
              </FormField>
            </div>
          </div>
        </CollapsibleEntry>
      ))}

      <AddButton onClick={handleAdd} label="Add Project" />
    </div>
  );
}

// ============ Certifications Form ============

interface CertificationsFormProps {
  certifications: CertificationEntry[];
  onChange: (certifications: CertificationEntry[]) => void;
}

export function CertificationsForm({ certifications, onChange }: CertificationsFormProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(certifications.length > 0 ? 0 : null);

  const handleAdd = () => {
    const newCert: CertificationEntry = {
      name: '',
      issuer: '',
      issue_date: '',
      expiry_date: '',
      credential_id: '',
      credential_url: '',
    };
    onChange([...certifications, newCert]);
    setOpenIndex(certifications.length);
  };

  const handleUpdate = (index: number, updates: Partial<CertificationEntry>) => {
    const updated = certifications.map((cert, i) => (i === index ? { ...cert, ...updates } : cert));
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(certifications.filter((_, i) => i !== index));
    setOpenIndex(null);
  };

  return (
    <div className="space-y-4">
      {certifications.map((cert, index) => (
        <CollapsibleEntry
          key={index}
          title={cert.name || 'New Certification'}
          subtitle={cert.issuer || undefined}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          onDelete={() => handleDelete(index)}
        >
          <div className="space-y-4">
            <FormField label="Certification Name" required>
              <Input
                value={cert.name}
                onChange={(e) => handleUpdate(index, { name: e.target.value })}
                placeholder="AWS Solutions Architect Professional"
                icon={<Award className="w-4 h-4" />}
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
                  value={cert.issue_date || ''}
                  onChange={(e) => handleUpdate(index, { issue_date: e.target.value })}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </FormField>
              <FormField label="Expiry Date" hint="Leave blank if no expiry">
                <Input
                  type="month"
                  value={cert.expiry_date || ''}
                  onChange={(e) => handleUpdate(index, { expiry_date: e.target.value })}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Credential ID">
                <Input
                  value={cert.credential_id || ''}
                  onChange={(e) => handleUpdate(index, { credential_id: e.target.value })}
                  placeholder="ABC123XYZ"
                />
              </FormField>
              <FormField label="Credential URL">
                <Input
                  value={cert.credential_url || ''}
                  onChange={(e) => handleUpdate(index, { credential_url: e.target.value })}
                  placeholder="https://verify.aws.com/..."
                  icon={<Link2 className="w-4 h-4" />}
                />
              </FormField>
            </div>
          </div>
        </CollapsibleEntry>
      ))}

      <AddButton onClick={handleAdd} label="Add Certification" />
    </div>
  );
}

// ============ Languages Form ============

interface LanguagesFormProps {
  languages: Array<{ language: string; proficiency: string }>;
  onChange: (languages: Array<{ language: string; proficiency: string }>) => void;
}

export function LanguagesForm({ languages, onChange }: LanguagesFormProps) {
  const proficiencyLevels = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];

  const handleAdd = () => {
    onChange([...languages, { language: '', proficiency: 'Intermediate' }]);
  };

  const handleUpdate = (index: number, field: 'language' | 'proficiency', value: string) => {
    const updated = languages.map((lang, i) => (i === index ? { ...lang, [field]: value } : lang));
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(languages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {languages.map((lang, index) => (
        <div
          key={index}
          className="flex items-center gap-4 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group"
        >
          <Input
            value={lang.language}
            onChange={(e) => handleUpdate(index, 'language', e.target.value)}
            placeholder="Language name"
            className="flex-1"
            icon={<Languages className="w-4 h-4" />}
          />
          <select
            value={lang.proficiency}
            onChange={(e) => handleUpdate(index, 'proficiency', e.target.value)}
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
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <AddButton onClick={handleAdd} label="Add Language" />
    </div>
  );
}
