export type TemplateStyle = 'classic' | 'modern' | 'minimal' | 'professional' | 'creative' | 'elegant' | 'executive' | 'technical';
export type ColorTheme = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'teal' | 'gray' | 'indigo';

export const RESUME_TEMPLATES: { id: TemplateStyle; name: string; category: string; color: ColorTheme; description: string; format: string }[] = [
  { id: 'modern', name: 'Modern', category: 'Modern', color: 'blue', description: 'A deep sidebar for your skills, with a spacious career story alongside.', format: 'Left sidebar' },
  { id: 'classic', name: 'Classic', category: 'Classic', color: 'gray', description: 'Traditional serif typography, a centered nameplate and crisp section rules.', format: 'Single column' },
  { id: 'minimal', name: 'Minimal', category: 'Minimal', color: 'teal', description: 'Quiet typography and a dedicated label column give every section room.', format: 'Editorial labels' },
  { id: 'professional', name: 'Professional', category: 'Professional', color: 'indigo', description: 'A precise career timeline with dates in the margin and clear milestones.', format: 'Career timeline' },
  { id: 'creative', name: 'Creative', category: 'Creative', color: 'purple', description: 'An oversized masthead, a personal monogram and a bright portfolio layout.', format: 'Portfolio split' },
  { id: 'elegant', name: 'Elegant', category: 'Classic', color: 'green', description: 'Sophisticated serif headlines with a soft right-hand qualifications panel.', format: 'Right sidebar' },
  { id: 'executive', name: 'Executive', category: 'Professional', color: 'gray', description: 'A dark, full-width nameplate and a separate column for credentials.', format: 'Executive columns' },
  { id: 'technical', name: 'Technical', category: 'Modern', color: 'teal', description: 'Monospace details, numbered sections and compact skill tags.', format: 'Technical outline' },
];

export const isTemplateStyle = (value: unknown): value is TemplateStyle => RESUME_TEMPLATES.some(template => template.id === value);

export function resolveTemplateFont(template: TemplateStyle, choice: 'template' | 'sans' | 'serif' | 'mono') {
  if (choice !== 'template') return choice;
  return template === 'technical' ? 'mono' : template === 'classic' || template === 'elegant' ? 'serif' : 'sans';
}
