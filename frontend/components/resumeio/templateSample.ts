import { blankResume } from './resumeDocument';

export const templateSample = {
  ...blankResume(),
  contact: { full_name: 'Alex Morgan', email: 'alex.morgan@example.com', phone: '+27 00 000 0000', location: 'Cape Town, South Africa', linkedin: 'linkedin.com/in/example' },
  summary: { summary: 'Project coordinator bringing people, plans and priorities together. A clear communicator who turns complex briefs into thoughtful, well-organized work.' },
  experience: [
    { position: 'Project Coordinator', company: 'Example Studio', start_date: '2022-03', current: true, description: ['Coordinate schedules and budgets across a multidisciplinary team.', 'Translate project goals into clear plans and stakeholder updates.', 'Improve handovers with practical documentation and shared processes.'], achievements: [] },
    { position: 'Project Assistant', company: 'Example Company', start_date: '2019-02', end_date: '2022-02', current: false, description: ['Prepared project records and followed up on agreed actions.', 'Supported research, meeting preparation and supplier coordination.'], achievements: [] },
  ],
  education: [{ institution: 'Example University', degree: 'Bachelor of Commerce', start_date: '2015', end_date: '2018', honors: [] }],
  skills: [{ category: 'Core skills', skills: ['Project planning', 'Communication', 'Research', 'Budget tracking', 'Microsoft Office'] }],
  languages: [{ language: 'English', proficiency: 'Fluent' }, { language: 'French', proficiency: 'Intermediate' }],
  certifications: [{ name: 'Project Management Fundamentals', issuer: 'Example Institute', issue_date: '2023' }],
};
