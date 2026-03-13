// Cover Letter Types

export type CoverLetterTone = 'professional' | 'enthusiastic' | 'confident' | 'friendly' | 'formal';

export interface RecipientInfo {
  name: string;
  title: string;
  company: string;
  department: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface SenderInfo {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  linkedin: string;
  website: string;
}

export interface JobDetails {
  job_title: string;
  company_name: string;
  department: string;
  job_description: string;
  reference_number: string;
}

export interface CoverLetterContent {
  salutation: string;
  opening_paragraph: string;
  body_paragraphs: string[];
  closing_paragraph: string;
  signature: string;
  ps_line: string;
}

export interface CoverLetterSettings {
  template: string;
  tone: CoverLetterTone;
  font_family: string;
  font_size: number;
  line_spacing: number;
  margin_size: 'narrow' | 'normal' | 'wide';
  include_date: boolean;
  date_format: string;
}

export interface CoverLetter {
  id: string;
  title: string;
  sender: SenderInfo;
  recipient: RecipientInfo;
  job_details: JobDetails;
  content: CoverLetterContent;
  settings: CoverLetterSettings;
  created_at?: string;
  updated_at?: string;
  linked_resume_id?: string;
}

export interface CoverLetterTemplate {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  category: 'modern' | 'classic' | 'creative' | 'minimal';
  is_premium: boolean;
  color_scheme: string[];
}

export interface AIContentRequest {
  section: 'opening' | 'body' | 'closing';
  job_title: string;
  job_description?: string;
  company_name?: string;
  experience_summary?: string;
  skills?: string[];
  tone?: CoverLetterTone;
}

export interface AIContentResponse {
  suggestions: string[];
  section: string;
  tips: string[];
  keywords: string[];
}

export interface CoverLetterExportRequest {
  format: 'pdf' | 'docx' | 'txt';
  template?: string;
}

// Wizard step types
export type WizardStep = 
  | 'template'
  | 'job-details'
  | 'sender-info'
  | 'recipient-info'
  | 'content'
  | 'preview';

export interface WizardStepConfig {
  id: WizardStep;
  title: string;
  description: string;
  icon: string;
}

// Default values
export const defaultSenderInfo: SenderInfo = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
  linkedin: '',
  website: '',
};

export const defaultRecipientInfo: RecipientInfo = {
  name: '',
  title: '',
  company: '',
  department: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
};

export const defaultJobDetails: JobDetails = {
  job_title: '',
  company_name: '',
  department: '',
  job_description: '',
  reference_number: '',
};

export const defaultCoverLetterContent: CoverLetterContent = {
  salutation: 'Dear Hiring Manager,',
  opening_paragraph: '',
  body_paragraphs: [''],
  closing_paragraph: '',
  signature: 'Sincerely',
  ps_line: '',
};

export const defaultCoverLetterSettings: CoverLetterSettings = {
  template: 'professional',
  tone: 'professional',
  font_family: 'Arial',
  font_size: 11,
  line_spacing: 1.15,
  margin_size: 'normal',
  include_date: true,
  date_format: 'MMMM d, yyyy',
};

export const defaultCoverLetter: CoverLetter = {
  id: '',
  title: 'My Cover Letter',
  sender: defaultSenderInfo,
  recipient: defaultRecipientInfo,
  job_details: defaultJobDetails,
  content: defaultCoverLetterContent,
  settings: defaultCoverLetterSettings,
};

export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: 'template',
    title: 'Choose Template',
    description: 'Select a professional template',
    icon: '🎨',
  },
  {
    id: 'job-details',
    title: 'Job Details',
    description: 'Enter position information',
    icon: '💼',
  },
  {
    id: 'sender-info',
    title: 'Your Information',
    description: 'Add your contact details',
    icon: '👤',
  },
  {
    id: 'recipient-info',
    title: 'Recipient',
    description: 'Add company details',
    icon: '🏢',
  },
  {
    id: 'content',
    title: 'Write Content',
    description: 'Craft your message',
    icon: '✍️',
  },
  {
    id: 'preview',
    title: 'Preview & Export',
    description: 'Review and download',
    icon: '✨',
  },
];
