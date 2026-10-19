import JSZip from 'jszip';
import { SavedResume, SECTION_LABELS, THEME_COLORS } from './resumeDocument';
import { resolveTemplateFont } from './templateCatalog';

type Block = { kind: 'title' | 'heading' | 'body' | 'bullet'; text: string };
const flatten = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => flatten(item).map(text => `${key.replace(/_/g, ' ')}: ${text}`));
  return value == null || value === '' ? [] : [String(value)];
};
/** Export in the user's chosen reading order, keeping every editable field. */
export function resumeTextBlocks(doc: SavedResume): Block[] {
  const blocks: Block[] = [];
  const add = (text: unknown, kind: Block['kind'] = 'body') => { if (text != null && String(text).trim()) blocks.push({ kind, text: String(text) }); };
  const resume = doc.resume;
  const contact = resume.contact;
  add(contact?.full_name || resume.title, 'title');
  add([contact?.email, contact?.phone, contact?.location].filter(Boolean).join(' | '));
  [contact?.linkedin, contact?.github, contact?.website].forEach(value => add(value));
  for (const id of doc.design.sectionOrder.filter(id => !doc.design.hiddenSections.includes(id))) {
    const start = blocks.length;
    add(SECTION_LABELS[id], 'heading');
    switch (id) {
      case 'summary': add(resume.summary?.summary); break;
      case 'experience': resume.experience.forEach(e => { add([e.position, e.company].filter(Boolean).join(' — ')); add(e.location); add([e.start_date, e.current ? 'Present' : e.end_date].filter(Boolean).join(' — ')); [...e.description, ...e.achievements].forEach(text => add(text, 'bullet')); }); break;
      case 'education': resume.education.forEach(e => { add([e.degree, e.field_of_study, e.institution].filter(Boolean).join(' — ')); add(e.location); add([e.start_date, e.end_date].filter(Boolean).join(' — ')); if (e.gpa != null) add(`GPA: ${e.gpa}`); e.honors.forEach(text => add(text, 'bullet')); }); break;
      case 'skills': resume.skills.forEach(s => add(`${s.category ? `${s.category}: ` : ''}${s.skills.join(', ')}`)); break;
      case 'projects': resume.projects.forEach(p => { add(p.name); add(p.description); add([p.start_date, p.end_date].filter(Boolean).join(' — ')); add(p.technologies.join(', ')); add(p.url); add(p.github); p.highlights.forEach(text => add(text, 'bullet')); }); break;
      case 'certifications': resume.certifications.forEach(c => { add([c.name, c.issuer, c.issue_date].filter(Boolean).join(' — ')); if (c.expiry_date) add(`Expires: ${c.expiry_date}`); if (c.credential_id) add(`Credential: ${c.credential_id}`); add(c.credential_url); }); break;
      case 'languages': resume.languages.forEach(l => add([l.language, l.proficiency].filter(Boolean).join(' — '))); break;
      case 'achievements': resume.achievements.forEach(text => add(text, 'bullet')); break;
      case 'volunteer': case 'publications': resume[id].forEach(entry => flatten(entry).forEach(text => add(text))); break;
      case 'custom': Object.entries(resume.custom_sections).forEach(([title, value]) => { add(title); flatten(value).forEach(text => add(text)); }); break;
    }
    if (blocks.length === start + 1) blocks.pop();
  }
  return blocks;
}
export function localText(doc: SavedResume): Blob {
  const text = resumeTextBlocks(doc).map(block => `${block.kind === 'bullet' ? '• ' : ''}${block.kind === 'heading' ? `\n${block.text.toUpperCase()}` : block.text}`).join('\n');
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}
const xml = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** A real Office Open XML document, generated locally without sending personal data. */
export async function localDocx(doc: SavedResume): Promise<Blob> {
  const archive = new JSZip();
  const selectedFont = resolveTemplateFont(doc.template, doc.design.font);
  const font = selectedFont === 'serif' ? 'Georgia' : selectedFont === 'mono' ? 'Courier New' : 'Arial';
  const color = THEME_COLORS[doc.colorTheme].slice(1);
  const paragraphs = resumeTextBlocks(doc).map(block => {
    const heading = block.kind === 'heading'; const title = block.kind === 'title';
    const text = `${block.kind === 'bullet' ? '• ' : ''}${block.text}`;
    const properties = `<w:spacing w:after="${heading ? 100 : 70}" w:before="${heading ? doc.design.spacing * 12 : 0}" w:line="${Math.round(doc.design.lineHeight * 240)}" w:lineRule="auto"/>${heading || title ? '<w:keepNext/>' : ''}`;
    const runs = text.split('\n').map((line, index) => `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>${heading || title ? `<w:b/><w:color w:val="${color}"/>` : ''}<w:sz w:val="${title ? 36 : Math.round(doc.design.fontSize * 1.5)}"/></w:rPr>${index ? '<w:br/>' : ''}<w:t xml:space="preserve">${xml(line)}</w:t></w:r>`).join('');
    return `<w:p><w:pPr>${properties}</w:pPr>${runs}</w:p>`;
  }).join('');
  const [width, height] = doc.design.pageSize === 'Letter' ? [12240, 15840] : [11906, 16838];
  archive.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  archive.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  archive.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="${width}" w:h="${height}"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>`);
  return archive.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
}
