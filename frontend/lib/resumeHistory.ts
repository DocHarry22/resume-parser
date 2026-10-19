import type { ResumeSnapshot } from '../components/resumeio/resumeDocument';

const labels: Record<string, string> = {
  title: 'Document title', contact: 'Contact details', full_name: 'Full name', email: 'Email', phone: 'Phone', location: 'Location', linkedin: 'LinkedIn', github: 'GitHub', website: 'Website', photo: 'Photo', summary: 'Professional summary', experience: 'Work experience', company: 'Company', position: 'Role', start_date: 'Start date', end_date: 'End date', current: 'Current role', description: 'Description', achievements: 'Achievements', education: 'Education', institution: 'Institution', degree: 'Degree', field_of_study: 'Field of study', gpa: 'GPA', honors: 'Honors', skills: 'Skills', category: 'Category', projects: 'Projects', name: 'Name', technologies: 'Technologies', url: 'Link', highlights: 'Highlights', certifications: 'Certifications', issuer: 'Issuer', issue_date: 'Issue date', expiry_date: 'Expiry date', credential_id: 'Credential', credential_url: 'Credential link', languages: 'Languages', language: 'Language', proficiency: 'Proficiency', volunteer: 'Volunteering', publications: 'Publications', custom_sections: 'Custom sections', template: 'Template', colorTheme: 'Color', design: 'Design', font: 'Font', fontSize: 'Text size', lineHeight: 'Line spacing', spacing: 'Section spacing', pageSize: 'Paper size', sectionOrder: 'Section order', hiddenSections: 'Hidden sections', tailoring: 'Application target', role: 'Target role', terms: 'Terms to check',
};
export interface VersionChange { key: string; section: string; label: string; before: string; after: string; kind: 'added' | 'removed' | 'changed'; photo: boolean }
type Leaf = { label: string; section: string; value: string; photo: boolean };
function fields(document: ResumeSnapshot) {
  const result = new Map<string, Leaf>();
  const add = (value: unknown, path: string[], section: string) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) { value.forEach((item, index) => add(item, [...path, String(index)], section)); return; }
    if (typeof value === 'object') { Object.entries(value).forEach(([key, item]) => add(item, [...path, key], section)); return; }
    const label = path.map(part => /^\d+$/.test(part) ? `Entry ${Number(part) + 1}` : labels[part] || part.replace(/_/g, ' ')).filter((part, index, all) => index === 0 || part !== all[index - 1]).join(' · ');
    result.set(JSON.stringify(path), { section, label, value: typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value), photo: path.length === 2 && path[0] === 'contact' && path[1] === 'photo' });
  };
  Object.entries(document.resume).filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key)).forEach(([key, value]) => add(value, [key], labels[key] || key));
  add(document.template, ['template'], 'Design'); add(document.colorTheme, ['colorTheme'], 'Design');
  Object.entries(document.design).forEach(([key, value]) => {
    if (key === 'sectionOrder' || key === 'hiddenSections') add((value as string[]).map(id => labels[id] || id).join(' → '), ['design', key], 'Design');
    else add(value, ['design', key], 'Design');
  });
  if (document.tailoring) { const { role, company, description, terms } = document.tailoring; add({ role, company, description, terms: terms.join(', ') }, ['tailoring'], 'Application target'); }
  return result;
}
export function compareResumeVersions(before: ResumeSnapshot, after: ResumeSnapshot): VersionChange[] {
  const previous = fields(before), current = fields(after);
  return [...new Set([...previous.keys(), ...current.keys()])].flatMap(key => {
    const old = previous.get(key), next = current.get(key);
    if (old?.value === next?.value) return [];
    const field = next || old!;
    return [{ key, label: field.label, section: field.section, before: old?.value || '', after: next?.value || '', kind: !old ? 'added' : !next ? 'removed' : 'changed', photo: field.photo }];
  });
}
