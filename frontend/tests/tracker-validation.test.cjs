const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../lib/careerWorkspace.ts');
const mod = new Module(filename, module);
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const { validateJobs, saveJobs } = mod.exports;
const legacy = { id: 'one', company: 'Company', role: 'Engineer', stage: 'Saved', url: '', notes: '', appliedOn: '', followUpOn: '', updatedAt: '2026-10-19T00:00:00Z' };
test('legacy jobs remain readable and optional metadata survives backups', () => {
  assert.deepEqual(validateJobs([legacy]), [legacy]);
  const rich = { ...legacy, location: 'Johannesburg', salary: 'R55,000', description: 'Plant engineering', resumeId: 'resume-one', letterId: 'letter-one' };
  assert.deepEqual(validateJobs([rich]), [rich]);
});
test('invalid metadata and calendar rollover dates are rejected', () => {
  for (const patch of [{ followUpOn: '2026-02-30' }, { appliedOn: '2026-13-01' }, { followUpOn: '2200-01-01' }, { updatedAt: 'invalid' }, { resumeId: 4 }, { notes: 'a'.repeat(10001) }, { description: 'a'.repeat(30001) }, { url: 'javascript:alert(1)' }]) assert.throws(() => validateJobs([{ ...legacy, ...patch }]));
  assert.equal(validateJobs([{ ...legacy, followUpOn: '2028-02-29' }]).length, 1);
});
test('invalid backup records never reach browser storage', () => {
  let writes = 0;
  global.localStorage = { setItem() { writes++; } };
  global.window = { dispatchEvent() {} };
  assert.throws(() => saveJobs([{ ...legacy, followUpOn: '2026-02-30' }]));
  assert.equal(writes, 0);
  saveJobs([legacy]); assert.equal(writes, 1);
  delete global.localStorage; delete global.window;
});
