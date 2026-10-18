const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');

function library() {
  const source = fs.readFileSync(path.join(__dirname, '../components/resumeio/resumeDocument.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const storage = new Map();
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  const catalog = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/resumeio/templateCatalog.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, catalog);
  const context = { exports: {}, require: id => { assert.equal(id, './templateCatalog'); return catalog.exports; }, crypto: webcrypto, structuredClone, localStorage, window: { dispatchEvent() {} }, Event };
  vm.runInNewContext(compiled, context);
  return { ...context.exports, storage, localStorage };
}

test('scanner output populates the editable fields without losing dates, bullets, or languages', () => {
  const lib = library();
  const resume = lib.normalizeResume({ name: 'Test Applicant', contact: { email: 'test@example.test' }, summary: 'A summary',
    experience: [{ job_title: 'Engineer', company: 'Company', is_current: true, start_date: '2020', bullets: ['Built a service', 'Mentored colleagues'] }],
    education: [{ institution: 'College', degree: 'BSc', graduation_year: '2019', gpa: '3.5', honors: 'Distinction' }],
    skills: [{ name: 'TypeScript', category: 'Programming' }], projects: [{ title: 'Portfolio', technologies: ['React'] }], languages: ['English'] });
  assert.equal(resume.contact.full_name, 'Test Applicant');
  assert.equal(resume.experience[0].position, 'Engineer');
  assert.equal(resume.experience[0].current, true);
  assert.equal(resume.experience[0].description[1], 'Mentored colleagues');
  assert.equal(resume.education[0].end_date, '2019');
  assert.equal(resume.education[0].gpa, 3.5);
  assert.equal(resume.projects[0].name, 'Portfolio');
  assert.equal(resume.languages[0].language, 'English');
  assert.equal(resume.skills[0].skills[0], 'TypeScript');
});

test('new template choices survive browser saves and JSON backup normalization', () => {
  const lib = library();
  for (const template of ['executive', 'technical']) {
    const original = lib.createDocument();
    original.template = template;
    original.resume.contact.full_name = 'Template migration candidate';
    lib.saveDocument(original);
    const restored = lib.normalizeDocument(JSON.parse(JSON.stringify(original)));
    assert.equal(restored.template, template);
    assert.equal(lib.readDocuments().find(item => item.id === original.id).template, template);
    assert.equal(restored.resume.contact.full_name, 'Template migration candidate');
    assert.equal(restored.design.font, 'template');
  }
});

test('browser saves support independent copies and restore content plus design', () => {
  const lib = library();
  const original = lib.createDocument();
  original.resume.contact.full_name = 'Test Applicant';
  original.resume.custom_sections.Licences = 'Driving licence';
  original.design.fontSize = 14;
  original.design.hiddenSections = ['skills'];
  lib.saveDocument(original);
  const copy = structuredClone(original); copy.id = webcrypto.randomUUID(); copy.resume.title = 'Role-specific copy';
  lib.saveDocument(copy);
  const restored = lib.readDocuments();
  assert.equal(restored.length, 2);
  assert.equal(restored[0].resume.title, 'Role-specific copy');
  assert.equal(restored[1].resume.contact.full_name, 'Test Applicant');
  assert.equal(restored[1].design.fontSize, 14);
  assert.equal(restored[1].design.hiddenSections[0], 'skills');
  assert.equal(restored[1].resume.custom_sections.Licences, 'Driving licence');
});

test('bad storage is reported and never silently overwritten', () => {
  const lib = library();
  lib.storage.set(lib.STORAGE_KEY, '{broken');
  assert.throws(() => lib.saveDocument(lib.createDocument()));
  assert.equal(lib.storage.get(lib.STORAGE_KEY), '{broken');
});

test('untrusted backup design is normalized and section list remains complete', () => {
  const lib = library();
  const restored = lib.normalizeDocument({ resume: { title: 'Backup' }, template: 'invalid', colorTheme: 'invalid', design: { fontSize: 500, lineHeight: -5, pageSize: 'huge', sectionOrder: ['skills', 'skills', 'invalid'], hiddenSections: ['invalid', 'summary'] } });
  assert.equal(restored.template, 'modern');
  assert.equal(restored.design.fontSize, 16);
  assert.equal(restored.design.lineHeight, 1.2);
  assert.equal(restored.design.pageSize, 'A4');
  assert.equal(restored.design.sectionOrder[0], 'skills');
  assert.equal(restored.design.sectionOrder.length, lib.SECTION_IDS.length);
  assert.equal(restored.design.hiddenSections.length, 1);
  assert.throws(() => lib.normalizeDocument({ unrelated: 'data' }), /recognised resume/);
});
