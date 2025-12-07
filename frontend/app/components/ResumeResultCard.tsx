"use client";

import { Resume } from "@/lib/types";

interface ResumeResultCardProps {
  resume: Resume;
}

export default function ResumeResultCard({ resume }: ResumeResultCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header with Name */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {resume.name || "Unknown Candidate"}
        </h2>
        
        {/* Contact Information */}
        {resume.contact && (
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
            {resume.contact.email && (
              <a
                href={`mailto:${resume.contact.email}`}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {resume.contact.email}
              </a>
            )}
            {resume.contact.phone && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {resume.contact.phone}
              </span>
            )}
            {resume.contact.location && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {resume.contact.location}
              </span>
            )}
            {resume.contact.linkedin && (
              <a
                href={resume.contact.linkedin.startsWith('http') ? resume.contact.linkedin : `https://${resume.contact.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {resume.summary && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Summary</h3>
          <p className="text-gray-600 leading-relaxed">{resume.summary}</p>
        </div>
      )}

      {/* Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Experience</h3>
          <div className="space-y-4">
            {resume.experience.map((exp, index) => (
              <div key={index} className="border-l-2 border-blue-200 pl-4">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{exp.job_title}</h4>
                    <p className="text-gray-700">{exp.company}</p>
                  </div>
                  {(exp.start_date || exp.end_date) && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {exp.start_date}{exp.start_date && exp.end_date ? " - " : ""}{exp.is_current ? "Present" : exp.end_date}
                    </span>
                  )}
                </div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                    {exp.bullets.map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Education</h3>
          <div className="space-y-3">
            {resume.education.map((edu, index) => (
              <div key={index} className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {edu.degree}
                    {edu.field_of_study && <span className="text-gray-600"> in {edu.field_of_study}</span>}
                  </h4>
                  <p className="text-gray-700">{edu.institution}</p>
                </div>
                {edu.graduation_year && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {edu.graduation_year}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  skill.category === "technical"
                    ? "bg-blue-100 text-blue-800"
                    : skill.category === "soft"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {resume.certifications && resume.certifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Certifications</h3>
          <ul className="space-y-1">
            {resume.certifications.map((cert, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {cert.name}{cert.issuer && ` - ${cert.issuer}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Languages */}
      {resume.languages && resume.languages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Languages</h3>
          <div className="flex flex-wrap gap-2">
            {resume.languages.map((language, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
              >
                {language}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw Text Toggle */}
      {resume.raw_text && (
        <div className="border-t pt-4">
          <details className="group">
            <summary className="flex justify-between items-center cursor-pointer list-none text-sm text-gray-500 hover:text-gray-700">
              <span>View Raw Text</span>
              <svg
                className="w-4 h-4 group-open:rotate-180 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <pre className="mt-3 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
              {resume.raw_text}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
