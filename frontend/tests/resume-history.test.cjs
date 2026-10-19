const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
const plain = value => JSON.parse(JSON.stringify(value));
function workspace() {
  const stored = new Map(); let failed = false;
  const localStorage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => { if (failed) throw new Error('Storage full'); stored.set(key, value); } };
  const cache = new Map();
  function load(file) {
    const filename = path.resolve(__dirname, '..', file); if (cache.has(filename)) return cache.get(filename);
    const exports = {}; cache.set(filename, exports);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(compiled, { exports, require: id => load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), id + '.ts'))), localStorage, crypto: webcrypto, structuredClone, window: { dispatchEvent() {} }, Event });
    return exports;
  }
  const docs = load('components/resumeio/resumeDocument.ts'), history = load('lib/resumeHistory.ts');
  const document = docs.createDocument(); document.resume.title = 'Application resume'; document.resume.contact = { full_name: 'History Candidate', email: 'history@example.test' }; document.resume.summary.summary = 'First draft';
  document.tailoring = { sourceResumeId: 'original', jobId: 'job-one', role: 'Engineer', company: 'Example', description: 'Process safety and Python', terms: ['Python'] };
  docs.saveDocument(document);
  return { ...docs, ...history, document, stored, failWrites: () => { failed = true; } };
}

test('named checkpoints persist independent flat snapshots of content, design and target', () => {
  const w = workspace(); const saved = w.checkpointResume(w.document.id, 'Before the next edit');
  assert.equal(saved.versions.length, 1); const checkpoint = saved.versions[0]; assert.equal(checkpoint.kind, 'checkpoint');
  assert.equal(checkpoint.snapshot.tailoring.jobId, 'job-one'); assert.equal(checkpoint.snapshot.resume.summary.summary, 'First draft'); assert.equal(Object.hasOwn(checkpoint.snapshot, 'versions'), false);
  saved.resume.summary.summary = 'Changed'; saved.design.fontSize = 16; w.saveDocument(saved);
  assert.equal(w.readDocuments()[0].versions[0].snapshot.resume.summary.summary, 'First draft'); assert.notEqual(w.readDocuments()[0].versions[0].snapshot.design.fontSize, 16);
});
test('restore keeps the document ID and preserves current work in a safety checkpoint atomically', () => {
  const w = workspace(); const a = w.checkpointResume(w.document.id, 'Original'); const version = a.versions[0];
  a.resume.summary.summary = 'Current important draft'; a.template = 'technical'; a.design.font = 'mono'; a.tailoring.role = 'Senior Engineer'; const b = w.saveDocument(a);
  const restored = w.restoreResumeVersion(b.id, version.id, w.resumeStateKey(b)); assert.equal(restored.id, b.id); assert.equal(restored.resume.summary.summary, 'First draft'); assert.equal(restored.tailoring.role, 'Engineer');
  assert.equal(restored.versions[0].kind, 'before-restore'); assert.equal(restored.versions[0].snapshot.resume.summary.summary, 'Current important draft'); assert.equal(restored.versions[0].snapshot.template, 'technical'); assert.equal(restored.versions.length, 2);
  const undone = w.restoreResumeVersion(restored.id, restored.versions[0].id, w.resumeStateKey(restored)); assert.equal(undone.resume.summary.summary, 'Current important draft'); assert.equal(undone.versions.length, 3);
});
test('saving from an older editor retains newer checkpoints while rejecting stale content writes', () => {
  const w = workspace(); const old = w.readDocuments()[0], expected = w.resumeStateKey(old); w.checkpointResume(old.id, 'Keep this');
  old.resume.summary.summary = 'An edit after the checkpoint'; const saved = w.saveDocument(old, { expectedState: expected }); assert.equal(saved.versions.length, 1);
  const newer = plain(saved); newer.resume.summary.summary = 'Newer tab'; w.saveDocument(newer);
  const before = w.stored.get(w.STORAGE_KEY); old.resume.summary.summary = 'Stale tab'; assert.throws(() => w.saveDocument(old, { expectedState: expected }), /another tab/); assert.equal(w.stored.get(w.STORAGE_KEY), before);
});
test('restore detects a changed draft and cannot overwrite it or add a partial safety checkpoint', () => {
  const w = workspace(); const a = w.checkpointResume(w.document.id, 'First'); a.resume.summary.summary = 'Second'; const b = w.saveDocument(a); const expected = w.resumeStateKey(b);
  b.resume.summary.summary = 'Third from another tab'; w.saveDocument(b); const before = w.stored.get(w.STORAGE_KEY);
  assert.throws(() => w.restoreResumeVersion(b.id, a.versions[0].id, expected), /another tab/); assert.equal(w.stored.get(w.STORAGE_KEY), before);
});
test('history limit never prunes checkpoints and a restore needs a slot for the safety copy', () => {
  const w = workspace(); for (let index = 0; index < w.MAX_RESUME_VERSIONS; index++) w.checkpointResume(w.document.id, `Checkpoint ${index}`);
  let current = w.readDocuments()[0]; const before = w.stored.get(w.STORAGE_KEY); assert.throws(() => w.checkpointResume(current.id, 'Overflow'), /20 checkpoints/); assert.equal(w.stored.get(w.STORAGE_KEY), before);
  current.resume.summary.summary = 'Needs a safety snapshot'; current = w.saveDocument(current); assert.throws(() => w.restoreResumeVersion(current.id, current.versions[0].id, w.resumeStateKey(current)), /Make room/);
  current = w.deleteResumeVersion(current.id, current.versions[1].id); const restored = w.restoreResumeVersion(current.id, current.versions[0].id, w.resumeStateKey(current)); assert.equal(restored.versions.length, w.MAX_RESUME_VERSIONS);
});
test('JSON backups round trip all checkpoints without nested or recursive history', () => {
  const w = workspace(); let current = w.checkpointResume(w.document.id, 'First'); current.resume.summary.summary = 'Another'; w.saveDocument(current); current = w.checkpointResume(current.id, 'Second');
  const restored = w.normalizeDocument(plain(current)); assert.deepEqual(plain(restored.versions), plain(current.versions));
  const nested = plain(current); nested.versions[0].snapshot.versions = [{ unexpected: true }]; const flattened = w.normalizeDocument(nested); assert.equal(Object.hasOwn(flattened.versions[0].snapshot, 'versions'), false);
});
test('quota and unreadable storage leave saved documents and history unchanged', () => {
  const w = workspace(); const current = w.checkpointResume(w.document.id, 'First'); current.resume.summary.summary = 'Later'; const saved = w.saveDocument(current); const before = w.stored.get(w.STORAGE_KEY); w.failWrites();
  assert.throws(() => w.restoreResumeVersion(saved.id, saved.versions[0].id, w.resumeStateKey(saved)), /Storage full/); assert.throws(() => w.checkpointResume(saved.id, 'No room'), /Storage full/); assert.equal(w.stored.get(w.STORAGE_KEY), before);
  const broken = workspace(); broken.stored.set(broken.STORAGE_KEY, '{broken'); assert.throws(() => broken.checkpointResume(broken.document.id, 'Invalid')); assert.equal(broken.stored.get(broken.STORAGE_KEY), '{broken');
});
test('invalid history is rejected rather than silently erased on import or save', () => {
  const w = workspace(); const current = w.checkpointResume(w.document.id, 'First');
  for (const patch of [{ createdAt: 'invalid' }, { label: '' }, { kind: 'unknown' }, { snapshot: {} }]) { const input = plain(current); Object.assign(input.versions[0], patch); assert.throws(() => w.normalizeDocument(input)); }
  const duplicate = plain(current); duplicate.versions.push(plain(duplicate.versions[0])); assert.throws(() => w.normalizeDocument(duplicate));
  const broken = plain(current); broken.versions = null; w.stored.set(w.STORAGE_KEY, JSON.stringify([broken])); const before = w.stored.get(w.STORAGE_KEY); assert.throws(() => w.saveDocument(w.document)); assert.equal(w.stored.get(w.STORAGE_KEY), before);
});
test('opening a checkpoint as a copy and deleting checkpoints keep current work intact', () => {
  const w = workspace(); let current = w.checkpointResume(w.document.id, 'Original'); const versionId = current.versions[0].id; current.resume.summary.summary = 'Current'; current = w.saveDocument(current);
  const key = w.resumeStateKey(current); const copy = w.copyResumeVersion(current.id, versionId); assert.notEqual(copy.id, current.id); assert.equal(copy.resume.summary.summary, 'First draft'); assert.deepEqual(plain(copy.versions), []); assert.equal(w.resumeStateKey(w.readDocuments().find(item => item.id === current.id)), key);
  const deleted = w.deleteResumeVersion(current.id, versionId); assert.equal(deleted.versions.length, 0); assert.equal(w.resumeStateKey(deleted), key);
});
test('comparison identifies added, removed and edited fields including design and application target', () => {
  const w = workspace(); const before = w.readDocuments()[0], after = plain(before); after.resume.summary.summary = 'Edited introduction'; after.resume.contact.phone = '+27 555'; after.resume.contact.email = ''; after.design.pageSize = 'Letter'; after.tailoring.role = 'Senior Engineer';
  const changes = plain(w.compareResumeVersions(before, after)); assert.ok(changes.some(item => item.kind === 'added' && item.label.includes('Phone'))); assert.ok(changes.some(item => item.kind === 'removed' && item.label.includes('Email'))); assert.ok(changes.some(item => item.section === 'Design')); assert.ok(changes.some(item => item.section === 'Application target')); assert.ok(changes.some(item => item.after === 'Edited introduction'));
  const later = plain(before); later.updatedAt = '2099-01-01'; later.versions = [{ ignored: true }]; assert.equal(w.resumeStateKey(before), w.resumeStateKey(later)); assert.equal(w.compareResumeVersions(before, later).length, 0);
});
