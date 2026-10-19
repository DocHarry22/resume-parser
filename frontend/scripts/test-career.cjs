const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const JSZip = require('jszip');
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = new Module(filename, module); mod.filename = filename; mod.paths = module.paths; mod._compile(compiled, filename); return mod.exports;
}
const jobs = load('lib/careerWorkspace.ts');
const valid = { id: 'one', company: 'Company', role: 'Engineer', stage: 'Saved', url: '', notes: '', appliedOn: '', followUpOn: '', updatedAt: '2026-10-15T00:00:00Z' };
assert.equal(jobs.validateJobs([valid]).length, 1);
assert.throws(() => jobs.validateJobs([valid, valid]), /duplicate/);
assert.throws(() => jobs.validateJobs([{ ...valid, stage: 'Invalid' }]), /invalid/);
assert.throws(() => jobs.validateJobs([{ ...valid, company: '' }]), /invalid/);
assert.equal(jobs.safeJobUrl('javascript:alert(1)'), null);
assert.equal(jobs.safeJobUrl('https://example.com/job'), 'https://example.com/job');
assert.equal(jobs.safeJobUrl('not a URL'), null);
(async () => {
  const { exportLetterDocx } = load('lib/coverLetterExport.ts');
  const blob = await exportLetterDocx({ settings: { font_size: 11 } }, 'Zoë & <Company>\nOpening paragraph\n\nFinal paragraph');
  assert.equal(blob.type, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const archive = await JSZip.loadAsync(await blob.arrayBuffer());
  for (const file of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml']) assert.ok(archive.file(file), `Missing ${file}`);
  const document = await archive.file('word/document.xml').async('string');
  assert.match(document, /Zoë &amp; &lt;Company&gt;/);
  assert.match(document, /Final paragraph/);
  assert.equal((document.match(/<w:p>/g) || []).length, 4);
  console.log('Career workspace validation and genuine DOCX export checks passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
