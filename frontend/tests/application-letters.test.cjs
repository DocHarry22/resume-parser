const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
const plain = value => JSON.parse(JSON.stringify(value));
function workspace() {
  const stored = new Map(), modules = new Map(), events = [];
  let failing = '';
  function load(relative) {
    const file = path.resolve(__dirname, '..', relative);
    if (modules.has(file)) return modules.get(file);
    const exports = {}; modules.set(file, exports);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
      exports, crypto: webcrypto, structuredClone, Date, Event, URL,
      localStorage: { getItem: key => stored.get(key) ?? null, setItem: (key, value) => { if (key === failing) throw new Error('Storage full'); stored.set(key, value); }, removeItem: key => stored.delete(key) },
      window: { dispatchEvent: event => events.push(event.type) },
      require: name => load(name.startsWith('@/') ? name.slice(2) + '.ts' : path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(file), name + '.ts'))),
    }, { filename: file });
    return exports;
  }
  const resumes = load('components/resumeio/resumeDocument.ts'), local = load('lib/localCoverLetters.ts'), jobs = load('lib/careerWorkspace.ts'), actions = load('lib/applicationLetters.ts');
  const resume = resumes.createDocument(); resume.id = 'resume-one'; resume.resume.title = 'My real resume'; resume.resume.contact = { full_name: 'Zoë Naïdø', email: 'zoe@example.test', phone: '+27 123456', location: 'Cape Town', linkedin: 'https://example.test/profile', website: 'https://example.test' }; resume.resume.summary.summary = 'My supplied process engineering experience.'; resumes.saveDocument(resume);
  const job = { id: 'job-one', role: 'Process Engineer', company: 'Example Works', url: 'https://example.test/jobs', stage: 'Interview', appliedOn: '2026-10-18', followUpOn: '2026-10-21', notes: 'Keep my notes.', updatedAt: '2026-10-19T08:00:00Z', resumeId: resume.id, letterId: '', salary: 'R50,000', location: 'Cape Town', description: 'Process engineering and safety.' }; jobs.saveJobs([job]);
  const input = { resumeId: resume.id, jobId: job.id, role: job.role, company: job.company, description: job.description, template: 'tech', includeSummary: true };
  return { ...actions, ...local, ...resumes, ...jobs, stored, events, resume, job, input, fail: key => { failing = key; } };
}
test('application starter copies only supplied details and creates an independent editable letter', () => {
  const w = workspace(), beforeResume = w.stored.get(w.STORAGE_KEY), beforeJobs = w.stored.get(w.JOB_STORAGE_KEY);
  const letter = w.startApplicationLetter(w.input);
  assert.equal(letter.sender.full_name, 'Zoë Naïdø'); assert.equal(letter.sender.address, 'Cape Town'); assert.equal(letter.sender.linkedin, w.resume.resume.contact.linkedin);
  assert.equal(letter.job_details.job_description, w.job.description); assert.equal(letter.recipient.company, w.job.company); assert.equal(letter.settings.template, 'tech');
  assert.deepEqual(plain(letter.content.body_paragraphs), [w.resume.resume.summary.summary]); assert.equal(letter.content.closing_paragraph, ''); assert.deepEqual(plain(letter.workspace_context), { resumeId: w.resume.id, jobId: w.job.id });
  assert.equal(letter.linked_resume_id, undefined); assert.equal(w.stored.get(w.STORAGE_KEY), beforeResume); assert.equal(w.stored.get(w.JOB_STORAGE_KEY), beforeJobs); assert.equal(w.getLocalLetter(letter.id).id, letter.id);
});
test('manual starts and summary opt-out never infer contact details or experience', () => {
  const w = workspace(); const letter = w.startApplicationLetter({ ...w.input, resumeId: '', jobId: '', company: '', includeSummary: false });
  assert.equal(letter.sender.full_name, ''); assert.deepEqual(plain(letter.content.body_paragraphs), ['']); assert.equal(letter.job_details.company_name, ''); assert.equal(letter.content.opening_paragraph, 'I am writing to apply for the Process Engineer position.');
  const optedOut = w.startApplicationLetter({ ...w.input, includeSummary: false }); assert.deepEqual(plain(optedOut.content.body_paragraphs), ['']);
});
test('invalid targets, removed sources, and unreadable libraries cannot partially create letters', () => {
  const w = workspace();
  for (const patch of [{ role: '' }, { role: 'a'.repeat(151) }, { company: 'a'.repeat(151) }, { description: 'a'.repeat(30001) }, { template: 'made-up' }, { resumeId: 'deleted' }, { jobId: 'deleted' }]) assert.throws(() => w.startApplicationLetter({ ...w.input, ...patch }));
  assert.equal(w.readLocalLetters().length, 0); w.stored.set(w.LETTER_STORAGE_KEY, '{broken'); assert.throws(() => w.startApplicationLetter(w.input)); assert.equal(w.stored.get(w.LETTER_STORAGE_KEY), '{broken');
});
test('attaching rereads the application and retains its current resume, notes, dates and stage', () => {
  const w = workspace(); const letter = w.startApplicationLetter(w.input); w.saveJobs([{ ...w.job, notes: 'New notes from another tab', stage: 'Offer', salary: 'R60,000' }]);
  const linked = w.linkApplicationLetter(w.job.id, letter.id, ''); assert.equal(linked.letterId, letter.id); assert.equal(linked.notes, 'New notes from another tab'); assert.equal(linked.stage, 'Offer'); assert.equal(linked.salary, 'R60,000'); assert.equal(linked.resumeId, w.resume.id); assert.equal(linked.followUpOn, w.job.followUpOn);
  const detached = w.unlinkApplicationLetter(w.job.id, letter.id); assert.equal(detached.letterId, ''); assert.equal(detached.notes, linked.notes); assert.equal(w.getLocalLetter(letter.id).id, letter.id);
});
test('stale attach and detach cannot replace another tab’s newer letter selection', () => {
  const w = workspace(); const a = w.startApplicationLetter(w.input), b = w.startApplicationLetter(w.input); w.linkApplicationLetter(w.job.id, b.id, ''); const before = w.stored.get(w.JOB_STORAGE_KEY);
  assert.throws(() => w.linkApplicationLetter(w.job.id, a.id, ''), /another tab/); assert.throws(() => w.unlinkApplicationLetter(w.job.id, a.id), /another tab/); assert.equal(w.stored.get(w.JOB_STORAGE_KEY), before);
  assert.equal(w.linkApplicationLetter(w.job.id, a.id, b.id).letterId, a.id); assert.equal(w.readLocalLetters().length, 2);
});
test('a failed application attachment leaves the saved letter and all existing jobs intact', () => {
  const w = workspace(); const letter = w.startApplicationLetter(w.input), before = w.stored.get(w.JOB_STORAGE_KEY); w.fail(w.JOB_STORAGE_KEY);
  assert.throws(() => w.linkApplicationLetter(w.job.id, letter.id, ''), /Storage full/); assert.equal(w.stored.get(w.JOB_STORAGE_KEY), before); assert.equal(w.getLocalLetter(letter.id).id, letter.id);
  w.fail(''); w.deleteLocalLetter(letter.id); assert.throws(() => w.linkApplicationLetter(w.job.id, letter.id, ''), /does not have/); assert.equal(w.stored.get(w.JOB_STORAGE_KEY), before);
});
test('backup import restores independent editable copies and never changes application attachments', () => {
  const w = workspace(); const letter = w.startApplicationLetter(w.input); w.linkApplicationLetter(w.job.id, letter.id, ''); const before = w.stored.get(w.JOB_STORAGE_KEY);
  const imported = w.importLocalLetters(plain({ format: 'careerforge.cover-letters', version: 1, letters: [letter] })); assert.equal(imported.length, 1); assert.notEqual(imported[0].id, letter.id); assert.deepEqual(plain(imported[0].content), plain(letter.content)); assert.deepEqual(plain(imported[0].workspace_context), plain(letter.workspace_context)); assert.equal(w.stored.get(w.JOB_STORAGE_KEY), before);
  const single = w.importLocalLetters(plain(letter)); assert.notEqual(single[0].id, letter.id); assert.equal(w.readLocalLetters().length, 3);
});
test('invalid or quota-failed imports perform no partial writes and retain all current letters', () => {
  const w = workspace(); const letter = w.startApplicationLetter(w.input), before = w.stored.get(w.LETTER_STORAGE_KEY);
  for (const invalid of [{}, { ...plain(letter), workspace_context: { resumeId: 4, jobId: '' } }]) assert.throws(() => w.importLocalLetters({ format: 'careerforge.cover-letters', version: 1, letters: [letter, invalid] }));
  assert.equal(w.stored.get(w.LETTER_STORAGE_KEY), before); w.fail(w.LETTER_STORAGE_KEY); assert.throws(() => w.importLocalLetters(plain(letter)), /Storage may be full/); assert.equal(w.stored.get(w.LETTER_STORAGE_KEY), before);
});
test('updates and duplicates retain valid workspace context while copies never attach themselves', () => {
  const w = workspace(); const letter = w.startApplicationLetter(w.input); const updated = w.updateLocalLetter(letter.id, { content: { ...letter.content, closing_paragraph: 'My own closing.' } }); assert.deepEqual(plain(updated.workspace_context), plain(letter.workspace_context));
  w.linkApplicationLetter(w.job.id, letter.id, ''); const before = w.stored.get(w.JOB_STORAGE_KEY); const copy = w.duplicateLocalLetter(letter.id); assert.notEqual(copy.id, letter.id); assert.equal(copy.content.closing_paragraph, 'My own closing.'); assert.equal(w.stored.get(w.JOB_STORAGE_KEY), before);
});
