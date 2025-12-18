'use client';

import React, { useMemo } from 'react';
import { ResumeBuilder as ResumeData } from '@/types/builder';
import { TemplateStyle, ColorTheme } from './TemplateSelector';

interface LiveResumePreviewProps {
  resume: ResumeData;
  template: TemplateStyle;
  colorTheme: ColorTheme;
  scale?: number;
}

const colorThemes: Record<ColorTheme, { primary: string; secondary: string; accent: string; text: string }> = {
  blue: { primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', text: '#1e40af' },
  green: { primary: '#059669', secondary: '#10b981', accent: '#34d399', text: '#047857' },
  purple: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', text: '#5b21b6' },
  red: { primary: '#dc2626', secondary: '#ef4444', accent: '#f87171', text: '#b91c1c' },
  orange: { primary: '#ea580c', secondary: '#f97316', accent: '#fb923c', text: '#c2410c' },
  teal: { primary: '#0d9488', secondary: '#14b8a6', accent: '#2dd4bf', text: '#0f766e' },
  gray: { primary: '#374151', secondary: '#4b5563', accent: '#6b7280', text: '#1f2937' },
  indigo: { primary: '#4f46e5', secondary: '#6366f1', accent: '#818cf8', text: '#3730a3' },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function LiveResumePreview({ resume, template, colorTheme, scale = 0.55 }: LiveResumePreviewProps) {
  const colors = colorThemes[colorTheme];

  // A4 dimensions at 96 DPI
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  const styles = useMemo(() => ({
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-text': colors.text,
  } as React.CSSProperties), [colors]);

  return (
    <div
      className="bg-white shadow-2xl overflow-hidden rounded-sm"
      style={{
        width: A4_WIDTH * scale,
        height: A4_HEIGHT * scale,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div
        style={{
          width: A4_WIDTH,
          height: A4_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          ...styles,
        }}
      >
        {template === 'classic' && <ClassicTemplate resume={resume} colors={colors} />}
        {template === 'modern' && <ModernTemplate resume={resume} colors={colors} />}
        {template === 'minimal' && <MinimalTemplate resume={resume} colors={colors} />}
        {template === 'professional' && <ProfessionalTemplate resume={resume} colors={colors} />}
        {template === 'creative' && <CreativeTemplate resume={resume} colors={colors} />}
        {template === 'elegant' && <ElegantTemplate resume={resume} colors={colors} />}
      </div>
    </div>
  );
}

interface TemplateProps {
  resume: ResumeData;
  colors: { primary: string; secondary: string; accent: string; text: string };
}

// Modern Template - Sidebar style like resume.io
function ModernTemplate({ resume, colors }: TemplateProps) {
  const contact = resume.contact;
  
  return (
    <div className="w-full h-full flex overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-[280px] p-8 text-white" style={{ backgroundColor: colors.primary }}>
        {/* Photo */}
        {contact?.photo && (
          <div className="mb-6 flex justify-center">
            <img
              src={contact.photo}
              alt={contact.full_name || 'Profile'}
              className="w-28 h-28 rounded-full object-cover border-4 border-white/30 shadow-lg"
            />
          </div>
        )}
        
        {/* Name & Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-tight text-center">
            {contact?.full_name || 'Your Name'}
          </h1>
          {resume.summary?.summary && (
            <p className="text-sm opacity-80 mt-4 leading-relaxed">
              {resume.summary.summary.slice(0, 200)}
              {resume.summary.summary.length > 200 ? '...' : ''}
            </p>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-3 text-sm mb-8">
          <h3 className="font-bold uppercase tracking-wider text-xs opacity-60">Contact</h3>
          {contact?.email && (
            <div className="flex items-start gap-3 opacity-90">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span className="break-all">{contact.email}</span>
            </div>
          )}
          {contact?.phone && (
            <div className="flex items-start gap-3 opacity-90">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span>{contact.phone}</span>
            </div>
          )}
          {contact?.location && (
            <div className="flex items-start gap-3 opacity-90">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{contact.location}</span>
            </div>
          )}
          {contact?.linkedin && (
            <div className="flex items-start gap-3 opacity-90">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs break-all">{contact.linkedin}</span>
            </div>
          )}
          {contact?.github && (
            <div className="flex items-start gap-3 opacity-90">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs break-all">{contact.github}</span>
            </div>
          )}
          {contact?.website && (
            <div className="flex items-start gap-3 opacity-90">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
              </svg>
              <span className="text-xs break-all">{contact.website}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        {resume.skills.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold uppercase tracking-wider text-xs opacity-60 mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {resume.skills.flatMap(cat => cat.skills).slice(0, 12).map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs rounded bg-white/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <div>
            <h3 className="font-bold uppercase tracking-wider text-xs opacity-60 mb-3">Languages</h3>
            <div className="space-y-2">
              {resume.languages.map((lang, i) => (
                <div key={i} className="text-sm opacity-90 flex justify-between">
                  <span>{lang.language}</span>
                  <span className="opacity-60">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-hidden">
        {/* Experience */}
        {resume.experience.length > 0 && (
          <section className="mb-6">
            <h2
              className="text-sm font-bold uppercase tracking-wider mb-4 pb-2 border-b-2"
              style={{ color: colors.primary, borderColor: colors.primary }}
            >
              Experience
            </h2>
            <div className="space-y-4">
              {resume.experience.slice(0, 3).map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{exp.position}</h3>
                      <p className="text-sm" style={{ color: colors.primary }}>
                        {exp.company}{exp.location ? ` • ${exp.location}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(exp.start_date)} - {exp.current ? 'Present' : formatDate(exp.end_date)}
                    </span>
                  </div>
                  {exp.description.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                      {exp.description.slice(0, 3).map((desc, j) => (
                        <li key={j} className="leading-relaxed">{desc}</li>
                      ))}
                    </ul>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="mt-1 text-sm text-gray-600 list-disc list-inside space-y-1">
                      {exp.achievements.slice(0, 2).map((achievement, j) => (
                        <li key={j} className="leading-relaxed font-medium">{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <section className="mb-6">
            <h2
              className="text-sm font-bold uppercase tracking-wider mb-4 pb-2 border-b-2"
              style={{ color: colors.primary, borderColor: colors.primary }}
            >
              Education
            </h2>
            <div className="space-y-3">
              {resume.education.slice(0, 2).map((edu, i) => (
                <div key={i}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                      <p className="text-sm" style={{ color: colors.primary }}>
                        {edu.institution}{edu.location ? ` • ${edu.location}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(edu.end_date)}</span>
                  </div>
                  {edu.field_of_study && (
                    <p className="text-sm text-gray-600 mt-1">{edu.field_of_study}</p>
                  )}
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    {edu.gpa && <span>GPA: {edu.gpa}</span>}
                    {edu.honors && edu.honors.length > 0 && (
                      <span>{edu.honors.join(', ')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <section className="mb-6">
            <h2
              className="text-sm font-bold uppercase tracking-wider mb-4 pb-2 border-b-2"
              style={{ color: colors.primary, borderColor: colors.primary }}
            >
              Projects
            </h2>
            <div className="space-y-3">
              {resume.projects.slice(0, 2).map((project, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-gray-900">{project.name}</h3>
                    {(project.url || project.github) && (
                      <span className="text-xs text-gray-400">
                        {project.url ? '🔗' : ''}{project.github ? ' 📁' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                  {project.highlights && project.highlights.length > 0 && (
                    <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                      {project.highlights.slice(0, 2).map((highlight, j) => (
                        <li key={j}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.technologies.slice(0, 5).map((tech, j) => (
                        <span
                          key={j}
                          className="px-2 py-0.5 text-xs rounded"
                          style={{ backgroundColor: colors.accent + '20', color: colors.text }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <section>
            <h2
              className="text-sm font-bold uppercase tracking-wider mb-4 pb-2 border-b-2"
              style={{ color: colors.primary, borderColor: colors.primary }}
            >
              Certifications
            </h2>
            <div className="space-y-2">
              {resume.certifications.slice(0, 3).map((cert, i) => (
                <div key={i} className="text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{cert.name}</span>
                    <span className="text-gray-500"> - {cert.issuer}</span>
                  </div>
                  {(cert.issue_date || cert.credential_id) && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {cert.issue_date && <span>Issued {formatDate(cert.issue_date)}</span>}
                      {cert.issue_date && cert.credential_id && <span> • </span>}
                      {cert.credential_id && <span>ID: {cert.credential_id}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// Classic Template
function ClassicTemplate({ resume, colors }: TemplateProps) {
  const contact = resume.contact;

  return (
    <div className="w-full h-full p-12 font-serif text-gray-800 overflow-hidden">
      {/* Header */}
      <div className="text-center border-b-2 pb-6 mb-6" style={{ borderColor: colors.primary }}>
        {/* Photo */}
        {contact?.photo && (
          <div className="mb-4 flex justify-center">
            <img
              src={contact.photo}
              alt={contact.full_name || 'Profile'}
              className="w-24 h-24 rounded-full object-cover border-4 shadow-md"
              style={{ borderColor: colors.primary }}
            />
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-wide" style={{ color: colors.primary }}>
          {contact?.full_name || 'Your Name'}
        </h1>
        <div className="flex flex-wrap justify-center gap-4 mt-3 text-sm text-gray-600">
          {contact?.email && <span>{contact.email}</span>}
          {contact?.phone && <span>• {contact.phone}</span>}
          {contact?.location && <span>• {contact.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {resume.summary?.summary && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed text-gray-700">{resume.summary.summary}</p>
        </section>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
            Work Experience
          </h2>
          {resume.experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{exp.position}</h3>
                  <p className="text-gray-600">{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(exp.start_date)} - {exp.current ? 'Present' : formatDate(exp.end_date)}
                </span>
              </div>
              {exp.description.length > 0 && (
                <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                  {exp.description.map((d, j) => <li key={j}>{d}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
            Education
          </h2>
          {resume.education.map((edu, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                  <p className="text-gray-600">{edu.institution}</p>
                </div>
                <span className="text-sm text-gray-500">{formatDate(edu.end_date)}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {resume.skills.length > 0 && (
        <section>
          <h2 className="text-lg font-bold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.flatMap(cat => cat.skills).map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1 text-sm rounded-full"
                style={{ backgroundColor: colors.accent + '20', color: colors.text }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Minimal Template
function MinimalTemplate({ resume, colors }: TemplateProps) {
  const contact = resume.contact;

  return (
    <div className="w-full h-full p-12 font-sans text-gray-800 overflow-hidden">
      {/* Header */}
      <div className="mb-8 flex items-start gap-6">
        {/* Photo */}
        {contact?.photo && (
          <img
            src={contact.photo}
            alt={contact.full_name || 'Profile'}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            style={{ border: `2px solid ${colors.primary}` }}
          />
        )}
        <div>
          <h1 className="text-4xl font-light text-gray-900 mb-1">
            {contact?.full_name || 'Your Name'}
          </h1>
          <div className="flex gap-6 mt-4 text-sm text-gray-500">
            {contact?.email && <span>{contact.email}</span>}
            {contact?.phone && <span>{contact.phone}</span>}
            {contact?.location && <span>{contact.location}</span>}
          </div>
        </div>
      </div>

      {/* Summary */}
      {resume.summary?.summary && (
        <section className="mb-8">
          <p className="text-sm leading-relaxed text-gray-600">{resume.summary.summary}</p>
        </section>
      )}

      {/* Experience */}
      {resume.experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: colors.primary }}>
            Experience
          </h2>
          {resume.experience.map((exp, i) => (
            <div key={i} className="mb-5 pl-4 border-l-2" style={{ borderColor: colors.accent }}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{exp.position}</h3>
                  <p className="text-sm text-gray-500">{exp.company}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(exp.start_date)} - {exp.current ? 'Present' : formatDate(exp.end_date)}
                </span>
              </div>
              {exp.description.length > 0 && (
                <ul className="mt-2 text-sm text-gray-600">
                  {exp.description.map((d, j) => <li key={j} className="mb-1">— {d}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {resume.education.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: colors.primary }}>
            Education
          </h2>
          {resume.education.map((edu, i) => (
            <div key={i} className="mb-3 pl-4 border-l-2" style={{ borderColor: colors.accent }}>
              <h3 className="font-medium text-gray-900">{edu.degree}</h3>
              <p className="text-sm text-gray-500">{edu.institution} • {formatDate(edu.end_date)}</p>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {resume.skills.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: colors.primary }}>
            Skills
          </h2>
          <p className="text-sm text-gray-600">
            {resume.skills.flatMap(cat => cat.skills).join(' • ')}
          </p>
        </section>
      )}
    </div>
  );
}

// Professional Template
function ProfessionalTemplate({ resume, colors }: TemplateProps) {
  const contact = resume.contact;

  return (
    <div className="w-full h-full overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="px-10 py-6" style={{ backgroundColor: colors.primary }}>
        <div className="text-white flex items-center gap-6">
          {/* Photo */}
          {contact?.photo && (
            <img
              src={contact.photo}
              alt={contact.full_name || 'Profile'}
              className="w-20 h-20 rounded-full object-cover border-3 border-white/50 shadow-lg flex-shrink-0"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{contact?.full_name || 'Your Name'}</h1>
            <div className="flex gap-4 mt-2 text-xs opacity-80">
              {contact?.email && <span>{contact.email}</span>}
              {contact?.phone && <span>{contact.phone}</span>}
              {contact?.location && <span>{contact.location}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-10 space-y-6">
        {/* Summary */}
        {resume.summary?.summary && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: colors.primary }}>
              <span className="w-8 h-0.5" style={{ backgroundColor: colors.primary }}></span>
              Profile
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 pl-10">{resume.summary.summary}</p>
          </section>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: colors.primary }}>
              <span className="w-8 h-0.5" style={{ backgroundColor: colors.primary }}></span>
              Experience
            </h2>
            <div className="pl-10 space-y-4">
              {resume.experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{exp.position}</h3>
                      <p className="text-sm" style={{ color: colors.primary }}>{exp.company}</p>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {formatDate(exp.start_date)} - {exp.current ? 'Present' : formatDate(exp.end_date)}
                    </span>
                  </div>
                  {exp.description.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                      {exp.description.map((d, j) => <li key={j}>{d}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-10">
          {/* Education */}
          {resume.education.length > 0 && (
            <section className="flex-1">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: colors.primary }}>
                <span className="w-8 h-0.5" style={{ backgroundColor: colors.primary }}></span>
                Education
              </h2>
              <div className="pl-10 space-y-3">
                {resume.education.map((edu, i) => (
                  <div key={i}>
                    <h3 className="font-bold text-sm text-gray-900">{edu.degree}</h3>
                    <p className="text-xs text-gray-600">{edu.institution}</p>
                    <p className="text-xs text-gray-400">{formatDate(edu.end_date)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {resume.skills.length > 0 && (
            <section className="flex-1">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: colors.primary }}>
                <span className="w-8 h-0.5" style={{ backgroundColor: colors.primary }}></span>
                Skills
              </h2>
              <div className="pl-10 flex flex-wrap gap-2">
                {resume.skills.flatMap(cat => cat.skills).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded"
                    style={{ backgroundColor: colors.accent + '20', color: colors.text }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// Creative Template
function CreativeTemplate({ resume, colors }: TemplateProps) {
  const contact = resume.contact;

  return (
    <div className="w-full h-full p-10 overflow-hidden font-sans" style={{ background: `linear-gradient(135deg, ${colors.primary}10 0%, white 50%, ${colors.accent}10 100%)` }}>
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        {/* Photo */}
        {contact?.photo && (
          <img
            src={contact.photo}
            alt={contact.full_name || 'Profile'}
            className="w-24 h-24 rounded-2xl object-cover shadow-lg flex-shrink-0"
            style={{ border: `3px solid ${colors.primary}` }}
          />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-black" style={{ color: colors.primary }}>
            {contact?.full_name || 'Your Name'}
          </h1>
          <div className="flex flex-wrap gap-3 mt-3">
            {contact?.email && (
              <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }}></span>
                {contact.email}
              </span>
            )}
            {contact?.phone && (
              <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.secondary }}></span>
                {contact.phone}
              </span>
            )}
            {contact?.location && (
              <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }}></span>
                {contact.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {resume.summary?.summary && (
        <section className="mb-6 p-4 bg-white/60 rounded-xl backdrop-blur-sm">
          <p className="text-sm leading-relaxed text-gray-600 italic">&ldquo;{resume.summary.summary}&rdquo;</p>
        </section>
      )}

      <div className="flex gap-8">
        {/* Main Column */}
        <div className="flex-1">
          {/* Experience */}
          {resume.experience.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
                💼 Experience
              </h2>
              {resume.experience.map((exp, i) => (
                <div key={i} className="mb-4 p-3 bg-white/60 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{exp.position}</h3>
                      <p className="text-sm" style={{ color: colors.primary }}>{exp.company}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(exp.start_date)} - {exp.current ? 'Present' : formatDate(exp.end_date)}
                    </span>
                  </div>
                  {exp.description.length > 0 && (
                    <ul className="mt-2 text-xs text-gray-600">
                      {exp.description.slice(0, 2).map((d, j) => <li key={j}>• {d}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Education */}
          {resume.education.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
                🎓 Education
              </h2>
              {resume.education.map((edu, i) => (
                <div key={i} className="mb-3 p-3 bg-white/60 rounded-lg">
                  <h3 className="font-bold text-sm text-gray-900">{edu.degree}</h3>
                  <p className="text-xs text-gray-600">{edu.institution} • {formatDate(edu.end_date)}</p>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Side Column */}
        <div className="w-48">
          {/* Skills */}
          {resume.skills.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
                ⚡ Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {resume.skills.flatMap(cat => cat.skills).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded-full text-white"
                    style={{ backgroundColor: i % 2 === 0 ? colors.primary : colors.secondary }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {resume.languages.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: colors.primary }}>
                🌍 Languages
              </h2>
              <div className="space-y-2">
                {resume.languages.map((lang, i) => (
                  <div key={i} className="text-xs text-gray-600 flex justify-between">
                    <span>{lang.language}</span>
                    <span className="text-gray-400">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// Elegant Template
function ElegantTemplate({ resume, colors }: TemplateProps) {
  const contact = resume.contact;

  return (
    <div className="w-full h-full overflow-hidden font-serif">
      {/* Decorative Top */}
      <div className="h-2" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})` }}></div>

      <div className="p-10">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b border-gray-200">
          {/* Photo */}
          {contact?.photo && (
            <div className="mb-4 flex justify-center">
              <img
                src={contact.photo}
                alt={contact.full_name || 'Profile'}
                className="w-24 h-24 rounded-full object-cover shadow-md"
                style={{ border: `3px solid ${colors.primary}` }}
              />
            </div>
          )}
          <h1 className="text-3xl font-light tracking-[0.3em] text-gray-800 uppercase mb-2">
            {contact?.full_name || 'Your Name'}
          </h1>
          <div className="flex justify-center gap-8 mt-4 text-xs text-gray-500">
            {contact?.email && <span>{contact.email}</span>}
            {contact?.phone && <span>{contact.phone}</span>}
            {contact?.location && <span>{contact.location}</span>}
          </div>
        </div>

        {/* Summary */}
        {resume.summary?.summary && (
          <section className="mb-6 text-center max-w-2xl mx-auto">
            <p className="text-sm leading-relaxed text-gray-600 italic">{resume.summary.summary}</p>
          </section>
        )}

        <div className="flex gap-10">
          {/* Main */}
          <div className="flex-1">
            {/* Experience */}
            {resume.experience.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xs font-medium uppercase tracking-[0.2em] mb-4 text-center" style={{ color: colors.primary }}>
                  — Experience —
                </h2>
                {resume.experience.map((exp, i) => (
                  <div key={i} className="mb-4">
                    <div className="text-center">
                      <h3 className="font-medium text-gray-900">{exp.position}</h3>
                      <p className="text-sm" style={{ color: colors.primary }}>{exp.company}</p>
                      <span className="text-xs text-gray-400">
                        {formatDate(exp.start_date)} - {exp.current ? 'Present' : formatDate(exp.end_date)}
                      </span>
                    </div>
                    {exp.description.length > 0 && (
                      <ul className="mt-2 text-sm text-gray-600 text-center">
                        {exp.description.slice(0, 2).map((d, j) => <li key={j} className="mb-1">{d}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            )}
          </div>

          {/* Side */}
          <div className="w-56">
            {/* Education */}
            {resume.education.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xs font-medium uppercase tracking-[0.2em] mb-3 text-center" style={{ color: colors.primary }}>
                  — Education —
                </h2>
                {resume.education.map((edu, i) => (
                  <div key={i} className="mb-3 text-center">
                    <h3 className="font-medium text-sm text-gray-900">{edu.degree}</h3>
                    <p className="text-xs text-gray-500">{edu.institution}</p>
                    <p className="text-xs text-gray-400">{formatDate(edu.end_date)}</p>
                  </div>
                ))}
              </section>
            )}

            {/* Skills */}
            {resume.skills.length > 0 && (
              <section>
                <h2 className="text-xs font-medium uppercase tracking-[0.2em] mb-3 text-center" style={{ color: colors.primary }}>
                  — Skills —
                </h2>
                <div className="text-center text-sm text-gray-600">
                  {resume.skills.flatMap(cat => cat.skills).join(' • ')}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
