import type { SavedResume, ContentSection } from '../components/resumeio/resumeDocument';

export function parseTerms(text: string): string[] {
  return [...new Map(text.split(/[,\n]/).map(term => term.trim()).filter(Boolean).map(term => [term.toLowerCase(), term])).values()];
}
const tokenPattern = /\.net\b|[\p{L}\p{N}]+(?:\.[\p{L}\p{N}]+)*(?:\+\+|#)?/gu;
function tokens(text: string) {
  return Array.from(text.normalize('NFKC').toLowerCase().matchAll(tokenPattern), match => ({ word: match[0], index: match.index! }));
}
const stop = new Set(('the and for with this that from will your our you are have has who all any can but not into their they them its more work working role team company experience required requirements preferred responsibilities skills ability including include excellent strong good must should years year least other such about candidate candidates opportunity looking join application applications apply please would also within across needs need minimum relevant based using use responsible successful knowledge understanding ensure support develop development provide proven demonstrated both part full time position job qualifications qualifications benefits ideal desired degree related equivalent new as well to in on of a an is be or at by we us it an was were been being through than what when where which do does may able'.split(/\s+/)));
/** Wording suggestions, not inferred employer requirements. The user chooses the list. */
export function suggestTerms(description: string): string[] {
  const counts = new Map<string, { value: string; count: number; order: number }>();
  for (const token of tokens(description.slice(0, 30000))) {
    if (stop.has(token.word) || !/\p{L}/u.test(token.word) || (token.word.length < 3 && !['r', 'go', 'c#', 'c++', 'c'].includes(token.word))) continue;
    const previous = counts.get(token.word);
    if (previous) previous.count++;
    else counts.set(token.word, { value: token.word, count: 1, order: counts.size });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.order - b.order).slice(0, 18).map(item => item.value);
}
const labels: Record<ContentSection, string> = { summary: 'Professional summary', experience: 'Work experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', languages: 'Languages', achievements: 'Achievements', volunteer: 'Volunteering', publications: 'Publications', custom: 'Custom sections' };
function flatten(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [value];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (value && typeof value === 'object') return Object.values(value).flatMap(flatten);
  return [];
}
function visibleBlocks(document: SavedResume) {
  return document.design.sectionOrder.filter(section => !document.design.hiddenSections.includes(section)).flatMap(section => {
    const content = section === 'custom' ? document.resume.custom_sections : document.resume[section];
    // Contact details, the document title and the target description never count as evidence.
    return flatten(content).map(text => ({ section, label: labels[section], text: text.normalize('NFKC') }));
  });
}
export interface TermEvidence { term: string; found: boolean; section?: ContentSection; label?: string; snippet?: string }
export function analyzeTerms(document: SavedResume, terms: string[]): TermEvidence[] {
  const blocks = visibleBlocks(document).map(block => ({ ...block, tokens: tokens(block.text) }));
  return parseTerms(terms.join('\n')).slice(0, 60).map(term => {
    const wanted = tokens(term).map(token => token.word);
    if (!wanted.length) return { term, found: false };
    for (const block of blocks) {
      const position = block.tokens.findIndex((_, index) => wanted.every((word, offset) => block.tokens[index + offset]?.word === word));
      if (position < 0) continue;
      const start = Math.max(0, block.tokens[position].index - 45);
      const end = Math.min(block.text.length, block.tokens[position + wanted.length - 1].index + wanted[wanted.length - 1].length + 100);
      return { term, found: true, section: block.section, label: block.label, snippet: `${start ? '…' : ''}${block.text.slice(start, end)}${end < block.text.length ? '…' : ''}` };
    }
    return { term, found: false };
  });
}
