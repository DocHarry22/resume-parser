const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validatePath, rejectPrivatePath, classify, scanSecrets, parseTree, insideRoot, options } = require('./package-release.cjs');
const path = require('node:path');

test('portable archive paths reject traversal and Windows ambiguities', () => {
  assert.equal(validatePath('components/Editor.tsx'), 'components/Editor.tsx');
  for (const filename of ['../secret', 'app/../secret', '/absolute', 'C:/secret', 'app\\secret', 'app//file', 'app/NUL.txt', 'app/file.']) assert.throws(() => validatePath(filename));
  assert.equal(insideRoot(path.resolve('example'), path.resolve('example/.runtime/release')), true);
  assert.equal(insideRoot(path.resolve('example'), path.resolve('elsewhere')), false);
});

test('allowlists select deployable source and omit private/build/sample artifacts', () => {
  assert.deepEqual(classify('frontend/package.json', 'frontend'), { destination: 'package.json' });
  assert.deepEqual(classify('frontend/lib/apiConfig.ts', 'frontend'), { destination: 'lib/apiConfig.ts' });
  assert.equal(classify('frontend/public/templates/professional.pdf', 'frontend'), null);
  assert.equal(classify('frontend/.next/server/app.js', 'frontend'), null);
  assert.equal(classify('frontend/node_modules/example/index.js', 'frontend'), null);
  assert.equal(classify('frontend/tests/editor-e2e.cjs', 'frontend'), null);
  assert.equal(classify('data/workspaces/person/resume.json', 'backend'), null);
  assert.deepEqual(classify('data/skills_taxonomy.json', 'backend'), { destination: 'data/skills_taxonomy.json' });
  assert.equal(classify('data/resume.json', 'backend'), null);
  assert.throws(() => classify('frontend/app/.env.local', 'frontend'), /secret/);
  assert.throws(() => classify('app/credentials.json', 'backend'), /secret/);
  assert.throws(() => classify('frontend/public/uploads/person.png', 'frontend'), /secret/);
});

test('secret checks reject credential material without including it in errors', () => {
  assert.doesNotThrow(() => scanSecrets('.env.example', Buffer.from('PORT=8000\nAI_API_KEY=\n# WORKSPACE_SECRET=\n')));
  for (const text of ['-----BEGIN PRIVATE KEY-----', `AI_API_KEY=${'x'.repeat(30)}`, 'https://user:password@example.test']) assert.throws(() => scanSecrets('.env.example', Buffer.from(text)));
  assert.throws(() => rejectPrivatePath('app/key.pem'), /secret/);
  assert.doesNotThrow(() => rejectPrivatePath('app/core/workspaces.py'));
});

test('Git tree records retain regular and symlink modes for fail-closed packaging', () => {
  const records = parseTree(Buffer.from(`100644 blob ${'a'.repeat(40)}\tfrontend/package.json\0` + `120000 blob ${'b'.repeat(40)}\tfrontend/app/link.ts\0`));
  assert.equal(records[0].source, 'frontend/package.json');
  assert.equal(records[1].mode, '120000');
  assert.throws(() => parseTree(Buffer.from('invalid\0')));
  assert.deepEqual(options([]), ['frontend', 'backend']);
  assert.deepEqual(options(['--target', 'backend']), ['backend']);
  assert.throws(() => options(['--ref', 'other']));
});
