const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');

function workspace() {
  const stored = new Map(); let fail = false;
  const storage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => { if (fail) throw new Error('Storage full'); stored.set(key, value); } };
  const cache = new Map();
  function load(file) {
    const filename = path.resolve(__dirname, '..', file);
    if (cache.has(filename)) return cache.get(filename);
    const exports = {}; cache.set(filename, exports);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(compiled, { exports, require: id => load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), id + '.ts'))), localStorage: storage, crypto: webcrypto, structuredClone, window: { dispatchEvent() {} }, Event });
    return exports;
  }
  const documents = load('components/resumeio/resumeDocument.ts');
  const tailoring = load('lib/resumeTailoring.ts');
  const document = documents.createDocument(); document.resume.title = 'Original resume'; document.resume.contact = { full_name: 'Candidate', email: 'person@example.test' };
  document.resume.summary = { summary: 'Built Python services with C++ and C#.' };
  document.resume.skills = [{ category: 'Technical', skills: ['SQL', 'Power BI'] }];
  document.resume.experience = [{ company: 'Example', position: 'Engineer', current: true, start_date: '2024', description: ['Led a process safety review.'], achievements: [] }];
  document.resume.projects = [{ name: 'Kubernetes project', description: 'Docker deployments', technologies: [], highlights: [] }];
  documents.saveDocument(document);
  return { ...documents, ...tailoring, document, stored, failWrites: () => { fail = true; } };
}
const target = { jobId: 'job-one', role: 'Process Engineer', company: 'Example Company', description: 'Python, SQL, process safety and HAZOP.', terms: ['Python', 'SQL', 'process safety', 'HAZOP'] };
const plain = value => JSON.parse(JSON.stringify(value));

test('coverage finds whole terms and phrases with evidence and excludes metadata and hidden sections', () => {
  const w = workspace(); w.document.design.hiddenSections = ['projects'];
  w.document.resume.title = 'HAZOP Kubernetes'; w.document.resume.contact.full_name = 'HAZOP'; w.document.tailoring = { ...target, sourceResumeId: 'source' };
  const evidence = plain(w.analyzeTerms(w.document, ['Python', 'process safety', 'SQL', 'HAZOP', 'Docker', 'Kubernetes']));
  assert.deepEqual(evidence.map(item => item.found), [true, true, true, false, false, false]);
  assert.equal(evidence[1].label, 'Work experience'); assert.match(evidence[1].snippet, /process safety/);
});
test('C++, C#, .NET and multiword terms match literally without substring false positives', () => {
  const w = workspace(); w.document.resume.summary.summary = 'C++ C# .NET Node.js and Power BI. JavaScript.';
  const terms = ['C', 'C++', 'C#', '.NET', 'Node.js', 'Power BI', 'Java', 'powerful'];
  assert.deepEqual(plain(w.analyzeTerms(w.document, terms)).map(item => item.found), [false, true, true, true, true, true, false, false]);
  assert.deepEqual(plain(w.analyzeTerms(w.document, [])), []);
});
test('term input deduplicates and wording suggestions omit common boilerplate and numbers', () => {
  const w = workspace(); assert.deepEqual(plain(w.parseTerms('Python, SQL\n python\nPower BI')), ['python', 'SQL', 'Power BI']);
  const suggested = plain(w.suggestTerms('We are looking for a candidate with Python, SQL, Python and C++ skills. 2026 full time role.'));
  assert.equal(suggested[0], 'python'); assert.ok(suggested.includes('sql')); assert.ok(suggested.includes('c++')); assert.ok(!suggested.includes('2026')); assert.ok(!suggested.includes('candidate'));
});
test('a tailored copy preserves the original and has independent content and design', () => {
  const w = workspace(); const before = plain(w.readDocuments().find(item => item.id === w.document.id));
  const copy = w.createTailoredDocument(w.document.id, target);
  assert.notEqual(copy.id, w.document.id); assert.equal(copy.tailoring.sourceResumeId, w.document.id); assert.match(copy.resume.title, /Process Engineer.*tailored/);
  assert.deepEqual(plain(copy.design), before.design); assert.equal(copy.resume.contact.full_name, 'Candidate');
  copy.resume.skills[0].skills.push('HAZOP'); copy.design.fontSize = 16; w.saveDocument(copy);
  assert.deepEqual(plain(w.readDocuments().find(item => item.id === w.document.id)), before);
});
test('target details survive JSON normalization and invalid target metadata is discarded safely', () => {
  const w = workspace(); const copy = w.createTailoredDocument(w.document.id, target);
  assert.deepEqual(plain(w.normalizeDocument(plain(copy)).tailoring), plain(copy.tailoring));
  const restored = w.normalizeDocument({ ...plain(copy), tailoring: { ...copy.tailoring, terms: ['a'.repeat(81)] } });
  assert.equal(restored.tailoring, undefined); assert.equal(restored.resume.contact.full_name, 'Candidate');
});
test('target updates preserve newer resume edits and reject conflicting target edits', () => {
  const w = workspace(); const copy = w.createTailoredDocument(w.document.id, target); const expected = JSON.stringify(copy.tailoring);
  const edited = w.readDocuments().find(item => item.id === copy.id); edited.resume.summary.summary = 'Newer content from another tab'; w.saveDocument(edited);
  const saved = w.saveResumeTarget(copy.id, { ...copy.tailoring, company: 'Updated Company' }, expected);
  assert.equal(saved.resume.summary.summary, 'Newer content from another tab');
  const before = w.stored.get(w.STORAGE_KEY); assert.throws(() => w.saveResumeTarget(copy.id, copy.tailoring, expected), /another tab/); assert.equal(w.stored.get(w.STORAGE_KEY), before);
});
test('copy creation cannot overwrite corrupt storage or partially save when storage is full', () => {
  const w = workspace(); const before = w.stored.get(w.STORAGE_KEY); w.failWrites(); assert.throws(() => w.createTailoredDocument(w.document.id, target), /Storage full/); assert.equal(w.stored.get(w.STORAGE_KEY), before);
  const broken = workspace(); broken.stored.set(broken.STORAGE_KEY, '{broken'); assert.throws(() => broken.createTailoredDocument(broken.document.id, target)); assert.equal(broken.stored.get(broken.STORAGE_KEY), '{broken');
});
test('invalid or oversized targets and deleted source IDs never create a copy', () => {
  const w = workspace(); const before = w.stored.get(w.STORAGE_KEY);
  for (const patch of [{ role: '' }, { description: '' }, { description: 'x'.repeat(30001) }, { terms: Array.from({ length: 61 }, (_, index) => `term${index}`) }]) assert.throws(() => w.createTailoredDocument(w.document.id, { ...target, ...patch }));
  assert.throws(() => w.createTailoredDocument('deleted', target), /no longer/); assert.equal(w.stored.get(w.STORAGE_KEY), before);
});
