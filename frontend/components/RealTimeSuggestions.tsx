'use client';

import React, { useMemo } from 'react';
import { ResumeBuilder, FixType, AutoFix } from '@/types/builder';

// Suggestion severity levels
type SeverityLevel = 'critical' | 'warning' | 'info' | 'success';

interface Suggestion {
  id: string;
  category: string;
  title: string;
  message: string;
  severity: SeverityLevel;
  section: string;
  field?: string;
  fixType?: FixType;
  autoFixable?: boolean;
  suggestedValue?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  section: string;
  severity: SeverityLevel;
}

interface RealTimeSuggestionsProps {
  resume: ResumeBuilder;
  apiSuggestions?: AutoFix[]; // From backend analysis
  overallScore?: number;
  onFixApplied?: () => void;
}

// Validation patterns
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
const linkedinPattern = /linkedin\.com\/in\/[\w-]+/i;

// Word count helpers
const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

// Action verb check
const actionVerbs = [
  'achieved', 'accomplished', 'accelerated', 'acquired', 'adapted', 'addressed', 'administered', 'advanced',
  'analyzed', 'applied', 'appointed', 'approved', 'architected', 'arranged', 'assembled', 'assessed',
  'built', 'calculated', 'captured', 'championed', 'changed', 'collaborated', 'completed', 'composed',
  'conducted', 'consolidated', 'constructed', 'converted', 'coordinated', 'created', 'cultivated',
  'decreased', 'defined', 'delivered', 'demonstrated', 'designed', 'developed', 'devised', 'directed',
  'discovered', 'doubled', 'drove', 'earned', 'edited', 'eliminated', 'enabled', 'engineered', 'enhanced',
  'established', 'evaluated', 'exceeded', 'executed', 'expanded', 'expedited', 'facilitated', 'finalized',
  'formulated', 'founded', 'generated', 'grew', 'guided', 'handled', 'headed', 'helped', 'hired',
  'identified', 'implemented', 'improved', 'increased', 'influenced', 'initiated', 'innovated', 'installed',
  'instituted', 'integrated', 'introduced', 'invented', 'investigated', 'launched', 'led', 'leveraged',
  'maintained', 'managed', 'marketed', 'maximized', 'mentored', 'merged', 'minimized', 'mobilized',
  'modernized', 'monitored', 'motivated', 'navigated', 'negotiated', 'operated', 'optimized', 'orchestrated',
  'organized', 'originated', 'outperformed', 'overhauled', 'oversaw', 'partnered', 'performed', 'pioneered',
  'planned', 'prepared', 'presented', 'prioritized', 'processed', 'produced', 'programmed', 'projected',
  'promoted', 'proposed', 'provided', 'published', 'purchased', 'qualified', 'raised', 'ranked', 'reached',
  'realized', 'recommended', 'reconciled', 'recruited', 'redesigned', 'reduced', 'refined', 'reformed',
  'regenerated', 'remodeled', 'reorganized', 'replaced', 'reported', 'represented', 'researched', 'resolved',
  'restored', 'restructured', 'revamped', 'reviewed', 'revised', 'revitalized', 'saved', 'scheduled',
  'secured', 'selected', 'served', 'shaped', 'simplified', 'solved', 'spearheaded', 'specified', 'staffed',
  'standardized', 'started', 'steered', 'streamlined', 'strengthened', 'structured', 'succeeded', 'supervised',
  'supported', 'surpassed', 'sustained', 'synchronized', 'systemized', 'targeted', 'taught', 'terminated',
  'tested', 'tracked', 'trained', 'transferred', 'transformed', 'translated', 'trimmed', 'tripled', 'turned',
  'uncovered', 'unified', 'united', 'updated', 'upgraded', 'utilized', 'validated', 'visualized', 'won', 'wrote'
];

const startsWithActionVerb = (text: string): boolean => {
  if (!text) return false;
  const firstWord = text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
  return actionVerbs.includes(firstWord);
};

// Check for quantifiable achievements (numbers, percentages, etc.)
const hasQuantifiableResult = (text: string): boolean => {
  if (!text) return false;
  return /\d+%|\$\d+|\d+\+|\d+ percent|increased by \d+|reduced by \d+|saved \d+|grew \d+/.test(text);
};

export function RealTimeSuggestions({ resume, apiSuggestions = [], overallScore = 0, onFixApplied }: RealTimeSuggestionsProps) {
  // Generate real-time suggestions based on resume content
  const suggestions = useMemo((): Suggestion[] => {
    const result: Suggestion[] = [];

    // === CONTACT SECTION ===
    const contact = resume.contact;
    
    // Name check
    if (!contact?.full_name || contact.full_name.trim().length === 0) {
      result.push({
        id: 'contact-name-missing',
        category: 'Contact Information',
        title: 'Name is required',
        message: 'Add your full name to help recruiters identify you.',
        severity: 'critical',
        section: 'contact',
        field: 'full_name',
        fixType: FixType.CONTACT,
      });
    } else if (contact.full_name.trim().split(' ').length < 2) {
      result.push({
        id: 'contact-name-incomplete',
        category: 'Contact Information',
        title: 'Consider adding full name',
        message: 'Including both first and last name helps with professional identification.',
        severity: 'warning',
        section: 'contact',
        field: 'full_name',
      });
    }

    // Email check
    if (!contact?.email || contact.email.trim().length === 0) {
      result.push({
        id: 'contact-email-missing',
        category: 'Contact Information',
        title: 'Email is required',
        message: 'Email is essential for recruiters to contact you.',
        severity: 'critical',
        section: 'contact',
        field: 'email',
        fixType: FixType.CONTACT,
      });
    } else if (!emailPattern.test(contact.email)) {
      result.push({
        id: 'contact-email-invalid',
        category: 'Contact Information',
        title: 'Invalid email format',
        message: `"${contact.email}" doesn't appear to be a valid email address.`,
        severity: 'critical',
        section: 'contact',
        field: 'email',
        fixType: FixType.CONTACT,
      });
    }

    // Phone check
    if (!contact?.phone || contact.phone.trim().length === 0) {
      result.push({
        id: 'contact-phone-missing',
        category: 'Contact Information',
        title: 'Phone number recommended',
        message: 'Adding a phone number makes it easier for recruiters to reach you quickly.',
        severity: 'warning',
        section: 'contact',
        field: 'phone',
      });
    } else if (!phonePattern.test(contact.phone.replace(/\s/g, ''))) {
      result.push({
        id: 'contact-phone-invalid',
        category: 'Contact Information',
        title: 'Check phone format',
        message: 'Phone number format may not be recognized. Use format: (123) 456-7890',
        severity: 'warning',
        section: 'contact',
        field: 'phone',
      });
    }

    // LinkedIn check
    if (!contact?.linkedin || contact.linkedin.trim().length === 0) {
      result.push({
        id: 'contact-linkedin-missing',
        category: 'Contact Information',
        title: 'Add LinkedIn profile',
        message: '90% of recruiters use LinkedIn. Add your profile URL to increase visibility.',
        severity: 'info',
        section: 'contact',
        field: 'linkedin',
      });
    } else if (!linkedinPattern.test(contact.linkedin)) {
      result.push({
        id: 'contact-linkedin-invalid',
        category: 'Contact Information',
        title: 'Check LinkedIn URL',
        message: 'LinkedIn URL should be in format: linkedin.com/in/your-name',
        severity: 'warning',
        section: 'contact',
        field: 'linkedin',
      });
    }

    // Location check
    if (!contact?.location || contact.location.trim().length === 0) {
      result.push({
        id: 'contact-location-missing',
        category: 'Contact Information',
        title: 'Add location',
        message: 'City and state/country helps match you with local or remote positions.',
        severity: 'info',
        section: 'contact',
        field: 'location',
      });
    }

    // === SUMMARY SECTION ===
    const summary = resume.summary?.summary || '';
    const summaryWords = countWords(summary);

    if (!summary || summary.trim().length === 0) {
      result.push({
        id: 'summary-missing',
        category: 'Professional Summary',
        title: 'Add a professional summary',
        message: 'A strong summary grabs attention. Write 2-4 sentences highlighting your key qualifications.',
        severity: 'critical',
        section: 'summary',
        fixType: FixType.SUMMARY,
      });
    } else {
      if (summaryWords < 20) {
        result.push({
          id: 'summary-too-short',
          category: 'Professional Summary',
          title: 'Summary is too short',
          message: `Your summary has ${summaryWords} words. Aim for 30-60 words to effectively showcase your value.`,
          severity: 'warning',
          section: 'summary',
          fixType: FixType.SUMMARY,
        });
      } else if (summaryWords > 80) {
        result.push({
          id: 'summary-too-long',
          category: 'Professional Summary',
          title: 'Summary may be too long',
          message: `Your summary has ${summaryWords} words. Consider trimming to 50-70 words for better impact.`,
          severity: 'info',
          section: 'summary',
        });
      }
    }

    // === EXPERIENCE SECTION ===
    if (resume.experience.length === 0) {
      result.push({
        id: 'experience-missing',
        category: 'Experience',
        title: 'Add work experience',
        message: 'Work experience is crucial. Add at least one relevant position.',
        severity: 'critical',
        section: 'experience',
        fixType: FixType.LENGTH,
      });
    } else {
      resume.experience.forEach((exp, index) => {
        const expNum = index + 1;
        
        // Position title
        if (!exp.position || exp.position.trim().length === 0) {
          result.push({
            id: `experience-${index}-position-missing`,
            category: 'Experience',
            title: `Experience #${expNum}: Missing job title`,
            message: 'Every position needs a clear job title.',
            severity: 'critical',
            section: 'experience',
            field: `experience[${index}].position`,
          });
        }

        // Company name
        if (!exp.company || exp.company.trim().length === 0) {
          result.push({
            id: `experience-${index}-company-missing`,
            category: 'Experience',
            title: `Experience #${expNum}: Missing company name`,
            message: 'Add the company or organization name.',
            severity: 'critical',
            section: 'experience',
            field: `experience[${index}].company`,
          });
        }

        // Date validation
        if (!exp.start_date) {
          result.push({
            id: `experience-${index}-startdate-missing`,
            category: 'Experience',
            title: `Experience #${expNum}: Add start date`,
            message: 'Include start date to show your career timeline.',
            severity: 'warning',
            section: 'experience',
            field: `experience[${index}].start_date`,
          });
        }

        if (!exp.current && !exp.end_date) {
          result.push({
            id: `experience-${index}-enddate-missing`,
            category: 'Experience',
            title: `Experience #${expNum}: Add end date or mark as current`,
            message: 'Either add an end date or check "Currently working here".',
            severity: 'warning',
            section: 'experience',
            field: `experience[${index}].end_date`,
          });
        }

        // Description bullet points
        const bulletCount = exp.description.filter(d => d.trim().length > 0).length;
        if (bulletCount === 0) {
          result.push({
            id: `experience-${index}-descriptions-missing`,
            category: 'Experience',
            title: `Experience #${expNum}: Add job responsibilities`,
            message: 'Add 3-5 bullet points describing your key responsibilities and achievements.',
            severity: 'critical',
            section: 'experience',
            field: `experience[${index}].description`,
            fixType: FixType.BULLETS,
          });
        } else if (bulletCount < 3) {
          result.push({
            id: `experience-${index}-descriptions-few`,
            category: 'Experience',
            title: `Experience #${expNum}: Add more bullet points`,
            message: `You have ${bulletCount} bullet point(s). Aim for 3-5 for better detail.`,
            severity: 'warning',
            section: 'experience',
            field: `experience[${index}].description`,
          });
        }

        // Check each bullet for action verbs and metrics
        exp.description.forEach((desc, descIndex) => {
          if (desc.trim().length > 0) {
            if (!startsWithActionVerb(desc)) {
              result.push({
                id: `experience-${index}-desc-${descIndex}-actionverb`,
                category: 'Experience',
                title: `Experience #${expNum}: Use action verb`,
                message: `"${desc.substring(0, 30)}..." should start with a strong action verb like "Developed", "Led", "Improved".`,
                severity: 'info',
                section: 'experience',
                field: `experience[${index}].description[${descIndex}]`,
                fixType: FixType.KEYWORDS,
              });
            }

            if (!hasQuantifiableResult(desc) && index < 2 && descIndex < 3) {
              result.push({
                id: `experience-${index}-desc-${descIndex}-metrics`,
                category: 'Experience',
                title: `Experience #${expNum}: Add measurable results`,
                message: 'Consider adding numbers, percentages, or dollar amounts to quantify your impact.',
                severity: 'info',
                section: 'experience',
                field: `experience[${index}].description[${descIndex}]`,
                fixType: FixType.QUANTIFICATION,
              });
            }
          }
        });
      });
    }

    // === EDUCATION SECTION ===
    if (resume.education.length === 0) {
      result.push({
        id: 'education-missing',
        category: 'Education',
        title: 'Add education',
        message: 'Include your educational background, even if it\'s just a high school diploma.',
        severity: 'warning',
        section: 'education',
        fixType: FixType.LENGTH,
      });
    } else {
      resume.education.forEach((edu, index) => {
        const eduNum = index + 1;

        if (!edu.institution || edu.institution.trim().length === 0) {
          result.push({
            id: `education-${index}-institution-missing`,
            category: 'Education',
            title: `Education #${eduNum}: Add institution name`,
            message: 'Add the name of your school, college, or university.',
            severity: 'warning',
            section: 'education',
            field: `education[${index}].institution`,
          });
        }

        if (!edu.degree || edu.degree.trim().length === 0) {
          result.push({
            id: `education-${index}-degree-missing`,
            category: 'Education',
            title: `Education #${eduNum}: Add degree/certification`,
            message: 'Specify your degree, diploma, or certification.',
            severity: 'warning',
            section: 'education',
            field: `education[${index}].degree`,
          });
        }
      });
    }

    // === SKILLS SECTION ===
    const totalSkills = resume.skills.reduce((sum, cat) => sum + cat.skills.length, 0);

    if (resume.skills.length === 0 || totalSkills === 0) {
      result.push({
        id: 'skills-missing',
        category: 'Skills',
        title: 'Add your skills',
        message: 'List 8-15 relevant skills organized by category (Technical, Soft Skills, Tools, etc.)',
        severity: 'warning',
        section: 'skills',
        fixType: FixType.KEYWORDS,
      });
    } else if (totalSkills < 5) {
      result.push({
        id: 'skills-few',
        category: 'Skills',
        title: 'Add more skills',
        message: `You have ${totalSkills} skills. Consider adding more to match job requirements (aim for 8-15).`,
        severity: 'info',
        section: 'skills',
      });
    } else if (totalSkills > 25) {
      result.push({
        id: 'skills-too-many',
        category: 'Skills',
        title: 'Consider trimming skills',
        message: `You have ${totalSkills} skills. Focus on the most relevant 15-20 to avoid overwhelming recruiters.`,
        severity: 'info',
        section: 'skills',
      });
    }

    // Check for uncategorized skills
    resume.skills.forEach((cat, index) => {
      if (!cat.category || cat.category.trim().length === 0) {
        result.push({
          id: `skills-${index}-nocategory`,
          category: 'Skills',
          title: 'Name this skill category',
          message: 'Add a category name like "Technical Skills", "Languages", or "Tools".',
          severity: 'info',
          section: 'skills',
          field: `skills[${index}].category`,
        });
      }
    });

    return result;
  }, [resume]);

  // Generate checklist based on resume completeness
  const checklist = useMemo((): ChecklistItem[] => {
    const items: ChecklistItem[] = [];
    const contact = resume.contact;

    // Contact checklist
    items.push({
      id: 'check-name',
      label: 'Full name added',
      completed: !!(contact?.full_name && contact.full_name.trim().length > 0),
      section: 'contact',
      severity: 'critical',
    });
    items.push({
      id: 'check-email',
      label: 'Valid email address',
      completed: !!(contact?.email && emailPattern.test(contact.email)),
      section: 'contact',
      severity: 'critical',
    });
    items.push({
      id: 'check-phone',
      label: 'Phone number added',
      completed: !!(contact?.phone && contact.phone.trim().length > 0),
      section: 'contact',
      severity: 'warning',
    });
    items.push({
      id: 'check-location',
      label: 'Location specified',
      completed: !!(contact?.location && contact.location.trim().length > 0),
      section: 'contact',
      severity: 'info',
    });
    items.push({
      id: 'check-linkedin',
      label: 'LinkedIn profile linked',
      completed: !!(contact?.linkedin && linkedinPattern.test(contact.linkedin)),
      section: 'contact',
      severity: 'info',
    });

    // Summary checklist
    const summaryWords = countWords(resume.summary?.summary || '');
    items.push({
      id: 'check-summary',
      label: 'Professional summary written',
      completed: summaryWords >= 20,
      section: 'summary',
      severity: 'critical',
    });
    items.push({
      id: 'check-summary-length',
      label: 'Summary is 30-70 words',
      completed: summaryWords >= 30 && summaryWords <= 70,
      section: 'summary',
      severity: 'info',
    });

    // Experience checklist
    items.push({
      id: 'check-experience',
      label: 'At least one work experience',
      completed: resume.experience.length > 0,
      section: 'experience',
      severity: 'critical',
    });
    
    const hasDetailedExperience = resume.experience.some(exp => 
      exp.position && exp.company && exp.description.filter(d => d.trim()).length >= 3
    );
    items.push({
      id: 'check-experience-detail',
      label: 'Experience has 3+ bullet points',
      completed: hasDetailedExperience,
      section: 'experience',
      severity: 'warning',
    });

    const hasActionVerbs = resume.experience.some(exp =>
      exp.description.some(d => startsWithActionVerb(d))
    );
    items.push({
      id: 'check-action-verbs',
      label: 'Using action verbs',
      completed: hasActionVerbs,
      section: 'experience',
      severity: 'info',
    });

    const hasMetrics = resume.experience.some(exp =>
      exp.description.some(d => hasQuantifiableResult(d))
    );
    items.push({
      id: 'check-metrics',
      label: 'Quantified achievements',
      completed: hasMetrics,
      section: 'experience',
      severity: 'info',
    });

    // Education checklist
    items.push({
      id: 'check-education',
      label: 'Education section completed',
      completed: resume.education.length > 0 && resume.education.some(e => e.institution && e.degree),
      section: 'education',
      severity: 'warning',
    });

    // Skills checklist
    const totalSkills = resume.skills.reduce((sum, cat) => sum + cat.skills.length, 0);
    items.push({
      id: 'check-skills',
      label: 'Skills section has 8+ skills',
      completed: totalSkills >= 8,
      section: 'skills',
      severity: 'warning',
    });

    return items;
  }, [resume]);

  // Calculate real-time score
  const realTimeScore = useMemo(() => {
    const criticalIssues = suggestions.filter(s => s.severity === 'critical').length;
    const warnings = suggestions.filter(s => s.severity === 'warning').length;
    const completedChecks = checklist.filter(c => c.completed).length;
    const totalChecks = checklist.length;

    // Base score from checklist completion
    let score = (completedChecks / totalChecks) * 100;
    
    // Deduct for critical issues and warnings
    score -= criticalIssues * 10;
    score -= warnings * 3;
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [suggestions, checklist]);

  // Group suggestions by severity
  const groupedSuggestions = useMemo(() => {
    const critical = suggestions.filter(s => s.severity === 'critical');
    const warning = suggestions.filter(s => s.severity === 'warning');
    const info = suggestions.filter(s => s.severity === 'info');
    return { critical, warning, info };
  }, [suggestions]);

  // If no issues, show success state
  const allClear = suggestions.length === 0 && checklist.every(c => c.completed);

  const getSeverityStyles = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          iconBg: 'from-red-500 to-rose-600',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-700 border-red-200',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          iconBg: 'from-amber-400 to-orange-500',
          text: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-700 border-amber-200',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          iconBg: 'from-blue-400 to-indigo-500',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-700 border-blue-200',
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          iconBg: 'from-green-500 to-emerald-600',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-700 border-green-200',
        };
    }
  };

  const renderSuggestionIcon = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-Time Score Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Real-Time Resume Check
            </h2>
            <p className="text-sm text-gray-500">
              {suggestions.length === 0 
                ? 'Looking good! Keep editing to maintain quality.' 
                : `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'} to improve your resume`
              }
            </p>
          </div>
          
          <div className="text-right">
            <div className={`text-3xl font-bold bg-gradient-to-r ${
              realTimeScore >= 80 ? 'from-green-500 to-emerald-600' :
              realTimeScore >= 60 ? 'from-amber-500 to-orange-600' :
              'from-red-500 to-rose-600'
            } bg-clip-text text-transparent`}>
              {realTimeScore}
            </div>
            <div className="text-xs text-gray-500 font-medium">Live Score</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                realTimeScore >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                realTimeScore >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                'bg-gradient-to-r from-red-500 to-rose-600'
              }`}
              style={{ width: `${realTimeScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Resume Checklist
          <span className="text-sm font-normal text-gray-500">
            ({checklist.filter(c => c.completed).length}/{checklist.length} completed)
          </span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {checklist.map((item) => (
            <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-default">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                item.completed 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                  : item.severity === 'critical' 
                    ? 'border-2 border-red-300 bg-red-50'
                    : item.severity === 'warning'
                      ? 'border-2 border-amber-300 bg-amber-50'
                      : 'border-2 border-gray-300 bg-gray-50'
              }`}>
                {item.completed && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* All Clear State */}
      {allClear && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-800">Great Job!</h3>
              <p className="text-green-700">Your resume looks excellent! All checks passed.</p>
            </div>
          </div>
        </div>
      )}

      {/* Critical Issues */}
      {groupedSuggestions.critical.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Critical Issues ({groupedSuggestions.critical.length})
          </h3>
          {groupedSuggestions.critical.map((suggestion) => {
            const styles = getSeverityStyles(suggestion.severity);
            return (
              <div key={suggestion.id} className={`${styles.bg} border-2 ${styles.border} rounded-2xl p-4`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${styles.iconBg} flex items-center justify-center shadow-lg`}>
                    {renderSuggestionIcon(suggestion.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${styles.badge} border`}>
                        {suggestion.category}
                      </span>
                    </div>
                    <h4 className={`font-semibold ${styles.text}`}>{suggestion.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warnings */}
      {groupedSuggestions.warning.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Recommendations ({groupedSuggestions.warning.length})
          </h3>
          {groupedSuggestions.warning.map((suggestion) => {
            const styles = getSeverityStyles(suggestion.severity);
            return (
              <div key={suggestion.id} className={`${styles.bg} border ${styles.border} rounded-xl p-4`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${styles.iconBg} flex items-center justify-center`}>
                    {renderSuggestionIcon(suggestion.severity)}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold text-sm ${styles.text}`}>{suggestion.title}</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{suggestion.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info/Tips */}
      {groupedSuggestions.info.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Tips & Improvements ({groupedSuggestions.info.length})
          </h3>
          <div className="space-y-2">
            {groupedSuggestions.info.map((suggestion) => {
              const styles = getSeverityStyles(suggestion.severity);
              return (
                <div key={suggestion.id} className={`${styles.bg} border ${styles.border} rounded-lg p-3`}>
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    <div>
                      <span className="font-medium text-sm text-gray-700">{suggestion.title}:</span>
                      <span className="text-sm text-gray-600 ml-1">{suggestion.message}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* API-based suggestions from backend analysis */}
      {apiSuggestions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Analysis Results
            <span className="text-sm font-normal text-gray-500">
              (from last scan)
            </span>
          </h3>
          <p className="text-sm text-gray-500">
            Click "Analyze" button to get AI-powered suggestions for your resume.
          </p>
        </div>
      )}
    </div>
  );
}
