const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');

function browser(options = {}) {
  const data = options.data || new Map(), calls = [], events = [], modules = new Map();
  const storage = {
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) { if (options.full) throw new Error('QuotaExceeded'); data.set(key, value); },
    removeItem(key) { data.delete(key); },
  };
  const fetch = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.endsWith('/templates')) return new Response('[]');
    if (url.endsWith('/guidance')) return new Response(JSON.stringify({ suggestions: ['Use your own experience.'], section: 'opening', tips: [], keywords: [] }));
    return new Response(options.exportFails ? JSON.stringify({ detail: 'Unavailable' }) : 'CURRENT EXPORT', { status: options.exportFails ? 503 : 200 });
  };
  function load(relative) {
    const filename = path.resolve(__dirname, '..', relative);
    if (modules.has(filename)) return modules.get(filename);
    const exports = {}; modules.set(filename, exports);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(compiled, {
      exports, fetch, Blob, Response, Date, crypto: webcrypto, structuredClone, Event,
      localStorage: storage, window: { dispatchEvent(event) { events.push(event.type); } },
      process: { env: { NEXT_PUBLIC_STORAGE_MODE: options.local === false ? '' : 'local', NEXT_PUBLIC_SITE_MODE: options.sites ? '1' : '' } },
      require(name) { return load(name.startsWith('@/') ? name.slice(2) + '.ts' : path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), name + '.ts'))); },
    }, { filename });
    return exports;
  }
  return { load, data, calls, events, storage, api: load('lib/coverLetterApi.ts'), local: load('lib/localCoverLetters.ts') };
}

test('browser CRUD survives reload, duplicates independently, deletes its draft, and never contacts server', async () => {
  const first = browser();
  const { defaultCoverLetter } = first.load('types/coverLetter.ts');
  const original = structuredClone(defaultCoverLetter);
  original.sender.full_name = 'Zoë Naïdø'; original.content.opening_paragraph = 'My actual experience.';
  original.linked_resume_id = 'old-server-id';
  const saved = await first.api.createCoverLetter(original);
  assert.ok(saved.id); assert.equal(saved.linked_resume_id, undefined);
  assert.equal(original.id, '', 'Saving must not mutate the editor input');
  const second = browser({ data: first.data });
  assert.equal((await second.api.getCoverLetters())[0].sender.full_name, 'Zoë Naïdø');
  const updated = await second.api.updateCoverLetter(saved.id, { title: 'Updated application' });
  assert.equal(updated.id, saved.id);
  const copy = await second.api.duplicateCoverLetter(saved.id);
  assert.notEqual(copy.id, saved.id); assert.equal(copy.title, 'Updated application (copy)');
  assert.equal((await second.api.getCoverLetters()).length, 2);
  second.storage.setItem(`resume-studio.letter-draft.${saved.id}`, 'old draft');
  await second.api.deleteCoverLetter(saved.id);
  assert.equal(second.storage.getItem(`resume-studio.letter-draft.${saved.id}`), null);
  assert.equal((await second.api.getCoverLetters()).length, 1);
  assert.equal((await second.api.getCoverLetter(copy.id)).sender.full_name, 'Zoë Naïdø');
  await assert.rejects(second.api.updateCoverLetter('missing', { title: 'wrong' }), /does not have/);
  assert.equal(first.calls.length + second.calls.length, 0);
  assert.ok(second.events.includes('resume-library-change'));
});

test('unreadable library is preserved and cannot be overwritten by create or delete', async () => {
  for (const raw of ['{bad json', '{}', '[{"id":"fake","title":"missing fields"}]']) {
    const b = browser(); b.data.set(b.local.LETTER_STORAGE_KEY, raw);
    await assert.rejects(b.api.createCoverLetter('New'), /unreadable/);
    await assert.rejects(b.api.deleteCoverLetter('fake'), /unreadable/);
    assert.equal(b.data.get(b.local.LETTER_STORAGE_KEY), raw);
    assert.equal(b.calls.length, 0);
  }
});

test('quota failure is reported without replacing the saved library', async () => {
  const b = browser(); const saved = await b.api.createCoverLetter('Keep this');
  const previous = b.data.get(b.local.LETTER_STORAGE_KEY);
  const full = browser({ data: b.data, full: true });
  await assert.rejects(full.api.updateCoverLetter(saved.id, { title: 'Cannot save' }), /Storage may be full or blocked/);
  assert.equal(b.data.get(b.local.LETTER_STORAGE_KEY), previous);
});

test('PDF and DOCX export current unsaved content through stateless endpoints without saving or cookies', async () => {
  const b = browser(); const saved = await b.api.createCoverLetter('Application');
  const current = { ...saved, content: { ...saved.content, opening_paragraph: 'UNSAVED CURRENT CONTENT' } };
  const before = b.data.get(b.local.LETTER_STORAGE_KEY);
  for (const format of ['pdf', 'docx']) {
    assert.equal(await (await b.api.exportCoverLetterData(current, format)).text(), 'CURRENT EXPORT');
    const request = b.calls.at(-1);
    assert.equal(request.url, `/api/exports/cover-letter/${format}`);
    assert.equal(JSON.parse(request.init.body).content.opening_paragraph, 'UNSAVED CURRENT CONTENT');
    assert.equal(request.init.method, 'POST'); assert.equal(request.init.credentials, 'omit');
  }
  assert.equal(b.data.get(b.local.LETTER_STORAGE_KEY), before);
  assert.equal(b.calls.length, 2);
});

test('TXT export works offline; export failures leave browser library untouched', async () => {
  const b = browser({ exportFails: true }); const saved = await b.api.createCoverLetter('Keep me');
  const current = { ...saved, sender: { ...saved.sender, full_name: 'Zoë Naïdø' }, content: { ...saved.content, opening_paragraph: 'Offline current letter' } };
  const before = b.data.get(b.local.LETTER_STORAGE_KEY);
  const txt = await b.api.exportCoverLetterData(current, 'txt');
  assert.match(await txt.text(), /Zoë Naïdø/); assert.match(await txt.text(), /Offline current letter/);
  assert.equal(b.calls.length, 0);
  await assert.rejects(b.api.exportCoverLetterData(current, 'pdf'), /unavailable/);
  assert.equal(b.data.get(b.local.LETTER_STORAGE_KEY), before);
});

test('templates and guidance use processing routes; server-only operations stay blocked', async () => {
  const b = browser();
  assert.equal((await b.api.getTemplates()).length, 0);
  assert.equal((await b.api.generateContent({ section: 'opening', job_title: 'Engineer' })).suggestions[0], 'Use your own experience.');
  assert.deepEqual(b.calls.map(call => call.url), ['/api/exports/cover-letter/templates', '/api/exports/cover-letter/guidance']);
  assert.equal(JSON.parse(b.calls[1].init.body).use_ai, false);
  await assert.rejects(b.api.createFromResume('old-server-resume'), /Server workspace storage is disabled/);
  assert.equal(b.calls.length, 2);
});

test('Sites precedence bypasses local storage and still blocks all network operations', async () => {
  const b = browser({ sites: true });
  await assert.rejects(b.api.createCoverLetter('No fake save'), /main DoCHEng app/);
  assert.equal(b.data.size, 0); assert.equal(b.calls.length, 0);
});
