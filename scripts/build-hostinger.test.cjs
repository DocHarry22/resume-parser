const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { apiOrigin, options, selectSource, childEnvironment, inventory, verifyBackend, assertPrimaryEdition } = require('./build-hostinger.cjs');
const origin = 'https://careerforge-resume-api-free.onrender.com';

test('only an exact native HTTPS Render origin is accepted', () => {
  assert.equal(apiOrigin(origin + '/'), origin);
  for (const bad of ['http://service.onrender.com', 'https://user:pass@service.onrender.com', origin + ':443', origin + '/api', origin + '/api/..', origin + '?key=x', origin + '#fragment', origin + '\\evil', 'https://service.onrender.com.attacker.test', 'https://localhost', ' ' + origin]) assert.throws(() => apiOrigin(bad), /exact HTTPS/);
});

test('check-only needs no API origin; explicit origin and environment fallback are validated', () => {
  assert.deepEqual(options(['--check'], {}), { check: true, origin: null });
  assert.equal(options(['--check', '--api-origin', origin], {}).origin, origin);
  assert.equal(options([], { HOSTINGER_API_ORIGIN: origin }).origin, origin);
  assert.throws(() => options(['--api-origin', origin + '/api'], {}));
  assert.throws(() => options(['--publish'], {}), /Usage/);
});

test('curated source excludes Sites identity, environment, private uploads, old PDFs, dependencies, and test fixtures', () => {
  for (const filename of ['frontend/app/page.tsx', 'frontend/lib/apiConfig.ts', 'frontend/components/resumeio/StudioBuilder.tsx', 'frontend/public/icon.svg', 'frontend/next.config.js', 'frontend/public/home/commons-regular.woff2', 'frontend/public/home/resume-hero.png']) assert.ok(selectSource(filename), filename);
  assert.equal(selectSource('frontend/public/home/README.md'), null);
  assert.ok(selectSource('frontend/public/application-helper/careerforge-auto-apply.zip'));
  assert.throws(() => selectSource('frontend/public/unknown.zip'), /unsupported frontend/);
  for (const filename of ['sites/careerforge/.openai/hosting.json', 'frontend/.env.production', 'frontend/lib/.env.local', 'frontend/public/old-resume.pdf', 'frontend/public/sample.docx', 'frontend/public/uploads/private.png', 'frontend/node_modules/secret.js', 'frontend/.next/private.js', 'frontend/tempss/old.ts', 'frontend/tests/fixture.ts', 'data/resumes/private.json']) assert.equal(selectSource(filename), null, filename);
  assert.throws(() => selectSource('frontend/lib/id_rsa'), /Private or secret/);
  assert.throws(() => selectSource('frontend/app/../escape.tsx'), /Nonportable/);
});

test('build environment fixes primary local mode and does not inherit Sites identity or provider secrets', () => {
  const env = childEnvironment(origin, { PATH: 'tools', NEXT_PUBLIC_SITE_MODE: '1', NEXT_PUBLIC_API_BASE_URL: 'https://wrong.example', HOSTINGER_API_ORIGIN: origin, OPENAI_API_KEY: 'private', DATABASE_URL: 'private', NODE_OPTIONS: '--require=hook', API_PROXY_TARGET: 'private', NEXT_PUBLIC_STORAGE_MODE: 'server' });
  assert.equal(env.PATH, 'tools'); assert.equal(env.STATIC_EXPORT, '1'); assert.equal(env.NEXT_PUBLIC_STORAGE_MODE, 'local'); assert.equal(env.NEXT_PUBLIC_API_BASE_URL, origin);
  for (const key of ['NEXT_PUBLIC_SITE_MODE', 'HOSTINGER_API_ORIGIN', 'OPENAI_API_KEY', 'DATABASE_URL', 'NODE_OPTIONS', 'API_PROXY_TARGET']) assert.equal(Object.hasOwn(env, key), false, key);
});

test('primary edition verification supports the homepage without a notice and rejects Sites or unconfigured app pages', () => {
  const primaryNotice = '<div data-editor-edition="browser-local"></div>';
  assert.doesNotThrow(() => assertPrimaryEdition('<h1>CareerForge</h1>', primaryNotice));
  assert.throws(() => assertPrimaryEdition('<h1>CareerForge</h1>', '<h1>Builder</h1>'), /primary device-only edition/);
  assert.throws(() => assertPrimaryEdition('<h1>CareerForge</h1>', '<div data-editor-edition="sites"></div>'), /primary device-only edition/);
  assert.throws(() => assertPrimaryEdition('Browser workspace edition:', primaryNotice), /primary device-only edition/);
  assert.throws(() => assertPrimaryEdition('<h1>CareerForge</h1>', 'Browser workspace edition:'), /primary device-only edition/);
});

test('static inventory requires real routes/assets and refuses private or source documents', t => {
  const tempRoot = fs.realpathSync(os.tmpdir());
  const directory = fs.mkdtempSync(path.join(tempRoot, 'hostinger-build-test-'));
  // Only this uniquely created fixture is removed; application/source paths are never cleanup targets.
  t.after(() => { if (fs.realpathSync(directory) !== directory || path.dirname(directory) !== tempRoot || !path.basename(directory).startsWith('hostinger-build-test-')) throw new Error('Unsafe fixture cleanup path'); fs.rmSync(directory, { recursive: true, force: true }); });
  const put = (name, content = 'synthetic static fixture') => { const file = path.join(directory, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
  for (const name of ['index.html', '.htaccess', 'builder/index.html', 'cover-letter/index.html', 'dashboard/index.html', 'job-tracker/index.html', 'privacy/index.html', '_next/static/chunk.js']) put(name);
  const result = inventory(directory);
  assert.equal(result.files.length, 8); assert.ok(result.files.every(file => /^[a-f0-9]{64}$/.test(file.sha256)));
  put('application-helper/careerforge-auto-apply.zip', Buffer.from('PK reviewed helper fixture'));
  assert.equal(inventory(directory).files.length, 9);
  put('unknown.zip'); assert.throws(() => inventory(directory), /Unexpected static/); fs.unlinkSync(path.join(directory, 'unknown.zip'));
  put('legacy.pdf'); assert.throws(() => inventory(directory), /Unexpected static/); fs.unlinkSync(path.join(directory, 'legacy.pdf'));
  put('.env'); assert.throws(() => inventory(directory), /Private or secret/); fs.unlinkSync(path.join(directory, '.env'));
  fs.unlinkSync(path.join(directory, 'builder/index.html')); assert.throws(() => inventory(directory), /Missing static/);
});

test('health verification uses TLS origin without cookies/redirects and refuses server storage or unhealthy service', async () => {
  const good = { status: 'healthy', storage_mode: 'local', server_persistence: false };
  const verified = await verifyBackend(origin, async (url, init) => { assert.equal(url, origin + '/api/health'); assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit'); return Response.json(good); });
  assert.equal(verified.storage_mode, 'local');
  for (const body of [{ ...good, storage_mode: 'server' }, { ...good, server_persistence: true }, { ...good, status: 'starting' }]) await assert.rejects(verifyBackend(origin, async () => Response.json(body)), /must report healthy/);
  await assert.rejects(verifyBackend(origin, async () => new Response('', { status: 503 })), /health check failed/);
});
