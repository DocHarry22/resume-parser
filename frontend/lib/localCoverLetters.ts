import { CoverLetter, defaultCoverLetter } from '@/types/coverLetter';

export const LETTER_STORAGE_KEY = 'resume-studio.letters.v1';

function validate(value: unknown): CoverLetter {
  const letter = value as CoverLetter;
  if (!letter || typeof letter !== 'object' || typeof letter.id !== 'string' || typeof letter.title !== 'string') throw new Error('The browser cover-letter library is unreadable. Your stored data has not been changed.');
  for (const group of ['sender', 'recipient', 'job_details', 'content', 'settings'] as const) {
    const fields = letter[group];
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error('The browser cover-letter library is unreadable. Your stored data has not been changed.');
    for (const [key, sample] of Object.entries(defaultCoverLetter[group])) {
      const field = (fields as unknown as Record<string, unknown>)[key];
      if (Array.isArray(sample) ? !Array.isArray(field) || !field.every(item => typeof item === 'string') : typeof field !== typeof sample || (typeof field === 'number' && !Number.isFinite(field))) {
        throw new Error('The browser cover-letter library is unreadable. Your stored data has not been changed.');
      }
    }
  }
  return letter;
}

export function readLocalLetters(): CoverLetter[] {
  const raw = localStorage.getItem(LETTER_STORAGE_KEY);
  if (!raw) return [];
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('The browser cover-letter library is unreadable. Your stored data has not been changed.'); }
  if (!Array.isArray(parsed)) throw new Error('The browser cover-letter library is unreadable. Your stored data has not been changed.');
  const letters = parsed.map(validate);
  if (letters.some((letter, index) => !letter.id || letters.findIndex(other => other.id === letter.id) !== index)) throw new Error('The browser cover-letter library has invalid document IDs. Your stored data has not been changed.');
  return letters;
}

function write(letters: CoverLetter[]): void {
  try { localStorage.setItem(LETTER_STORAGE_KEY, JSON.stringify(letters)); }
  catch { throw new Error('Could not save in this browser. Storage may be full or blocked. Export your letter to keep your work.'); }
  window.dispatchEvent(new Event('resume-library-change'));
}

export function getLocalLetter(id: string): CoverLetter {
  const letter = readLocalLetters().find(item => item.id === id);
  if (!letter) throw new Error('This browser does not have that cover letter.');
  return letter;
}

export function createLocalLetter(value: string | Partial<CoverLetter> = 'My Cover Letter', template = 'professional'): CoverLetter {
  const initial = structuredClone(defaultCoverLetter);
  const now = new Date().toISOString();
  const letter = validate({ ...initial, ...(typeof value === 'string' ? { title: value, settings: { ...initial.settings, template } } : value), id: crypto.randomUUID(), created_at: now, updated_at: now });
  delete letter.linked_resume_id;
  const letters = readLocalLetters();
  write([letter, ...letters]);
  return letter;
}

export function updateLocalLetter(id: string, data: Partial<CoverLetter>): CoverLetter {
  const letters = readLocalLetters();
  const previous = letters.find(letter => letter.id === id);
  if (!previous) throw new Error('This browser does not have that cover letter.');
  const letter = validate({ ...previous, ...data, id, created_at: previous.created_at, updated_at: new Date().toISOString() });
  delete letter.linked_resume_id;
  write([letter, ...letters.filter(item => item.id !== id)]);
  return letter;
}

export function deleteLocalLetter(id: string): void {
  const letters = readLocalLetters();
  if (!letters.some(letter => letter.id === id)) throw new Error('This browser does not have that cover letter.');
  write(letters.filter(letter => letter.id !== id));
  localStorage.removeItem(`resume-studio.letter-draft.${id}`);
}

export function duplicateLocalLetter(id: string): CoverLetter {
  const letter = getLocalLetter(id);
  return createLocalLetter({ ...letter, title: `${letter.title} (copy)` });
}

export function localLetterText(letter: CoverLetter): string {
  const { sender, recipient, content, job_details, settings } = letter;
  return [sender.full_name, sender.address, [sender.city, sender.state, sender.zip_code].filter(Boolean).join(', '), sender.country, sender.email, sender.phone, sender.linkedin, sender.website, '',
    settings.include_date ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '', '',
    recipient.name, recipient.title, recipient.company, recipient.department, recipient.address, [recipient.city, recipient.state, recipient.zip_code].filter(Boolean).join(', '), recipient.country, '',
    job_details.job_title ? `Re: ${job_details.job_title}${job_details.reference_number ? ` (${job_details.reference_number})` : ''}` : '', '',
    content.salutation || `Dear ${recipient.name || 'Hiring Manager'},`, '', content.opening_paragraph, '', ...content.body_paragraphs.flatMap(paragraph => [paragraph, '']),
    content.closing_paragraph, '', content.signature || 'Sincerely,', sender.full_name, content.ps_line ? `\nP.S. ${content.ps_line}` : '',
  ].join('\n');
}
