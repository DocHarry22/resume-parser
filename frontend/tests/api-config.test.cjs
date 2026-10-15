const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function library(fetch, options = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../lib/apiConfig.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const context = {
    exports: {}, fetch, Response,
    process: { env: {
      NEXT_PUBLIC_API_BASE_URL: options.baseUrl || '',
      NEXT_PUBLIC_SITE_MODE: options.sites ? '1' : '',
    } },
    navigator: options.locks ? { locks: options.locks } : {},
  };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

function guestServer(options = {}) {
  const calls = [];
  const documents = new Map();
  let cookie, nextWorkspace = 0, nextDocument = 0, failures = options.failures || 0;
  const json = (value, status = 200) => new Response(JSON.stringify(value), {
    status, headers: { 'Content-Type': 'application/json' },
  });
  const fetch = async (url, init = {}) => {
    const route = new URL(url, 'https://app.example.test').pathname.replace(/\/+$/, '');
    const method = (init.method || 'GET').toUpperCase();
    const bootstrap = route === '/api/workspace' && init.cache === 'no-store';
    const protectedRoute = ['/api/builder', '/api/cover-letters', '/api/workspace', '/api/ai']
      .some(prefix => route === prefix || route.startsWith(prefix + '/'));
    // Browser requests capture the cookie at dispatch, before delayed Set-Cookie responses.
    const sentCookie = cookie;
    const workspace = protectedRoute ? sentCookie || 'workspace-' + (++nextWorkspace) : undefined;
    calls.push({ route, method, init, bootstrap, sentCookie, workspace });
    await new Promise(resolve => setTimeout(resolve, 3));
    if (bootstrap && failures > 0) {
      failures -= 1;
      if (options.networkError) throw new TypeError('Network unavailable');
      return json({ detail: 'Workspace temporarily unavailable' }, 503);
    }
    if (protectedRoute && !sentCookie) cookie = workspace;
    if (route === '/api/workspace' && method === 'DELETE') {
      for (const [id, owner] of documents) if (owner === workspace) documents.delete(id);
      cookie = undefined;
      return json({ success: true });
    }
    if (route === '/api/builder/create' && method === 'POST') {
      const id = 'document-' + (++nextDocument);
      documents.set(id, workspace);
      return json({ resume: { id } });
    }
    if (route.startsWith('/api/builder/document-') && method === 'GET') {
      const id = route.split('/').pop();
      return documents.get(id) === workspace ? json({ id }) : json({ detail: 'Not found' }, 404);
    }
    return json({ workspace, success: true });
  };
  return { fetch, calls, documents, cookie: () => cookie };
}

function sharedLocks() {
  const queues = new Map(), names = [];
  return {
    names,
    request(name, callback) {
      const previous = queues.get(name) || Promise.resolve();
      names.push(name);
      const result = previous.then(callback);
      queues.set(name, result.then(() => undefined, () => undefined));
      return result;
    },
  };
}

test('concurrent initial lists and saves share a cookie; every document remains readable', async () => {
  const server = guestServer(), api = library(server.fetch);
  const results = await Promise.all([
    api.apiFetch('/api/cover-letters'), api.apiFetch('/api/builder/list/all'),
    api.apiRequest('/api/builder/create', { method: 'POST', body: 'first' }),
    api.apiRequest('/api/builder/create', { method: 'POST', body: 'second' }),
    api.apiFetch('/api/ai/status'),
  ]);
  assert.equal(server.calls.filter(call => call.bootstrap).length, 1);
  assert.equal(server.calls[0].route, '/api/workspace');
  assert.equal(server.calls[0].init.credentials, 'include');
  for (const call of server.calls.filter(call => !call.bootstrap)) {
    assert.ok(call.sentCookie, 'Protected requests must wait for the cookie');
    assert.equal(call.workspace, server.cookie());
  }
  for (const saved of [results[2], results[3]]) {
    assert.equal((await api.apiFetch('/api/builder/' + saved.resume.id)).status, 200);
  }
});

test('Web Locks coordinate separate tabs using the same browser cookie jar', async () => {
  const server = guestServer(), locks = sharedLocks();
  const firstTab = library(server.fetch, { locks }), secondTab = library(server.fetch, { locks });
  const [first, second] = await Promise.all([
    firstTab.apiRequest('/api/builder/create', { method: 'POST' }),
    secondTab.apiRequest('/api/builder/create', { method: 'POST' }),
  ]);
  assert.equal(locks.names.length, 2);
  assert.equal(new Set(locks.names).size, 1);
  assert.equal(server.calls.filter(call => call.bootstrap).length, 2);
  assert.equal(server.calls.filter(call => call.bootstrap && !call.sentCookie).length, 1);
  assert.equal((await firstTab.apiFetch('/api/builder/' + first.resume.id)).status, 200);
  assert.equal((await secondTab.apiFetch('/api/builder/' + second.resume.id)).status, 200);
});

test('bootstrap HTTP errors have separate readable bodies and permit a subsequent retry', async () => {
  const server = guestServer({ failures: 1 }), api = library(server.fetch);
  const first = await Promise.allSettled([
    api.apiRequest('/api/builder/create', { method: 'POST' }), api.apiRequest('/api/cover-letters'),
  ]);
  assert.ok(first.every(result => result.status === 'rejected' && result.reason.message === 'Workspace temporarily unavailable'));
  assert.equal(server.calls.length, 1, 'Do not dispatch mutations after failed bootstrap');
  assert.equal((await api.apiFetch('/api/builder/create', { method: 'POST' })).status, 200);
  assert.equal(server.calls.filter(call => call.bootstrap).length, 2);
});

test('network errors reset bootstrap and preserve the apiRequest service error', async () => {
  const server = guestServer({ failures: 1, networkError: true }), api = library(server.fetch);
  await assert.rejects(api.apiRequest('/api/cover-letters'), /document service is unavailable/);
  assert.equal((await api.apiFetch('/api/cover-letters')).status, 200);
  assert.equal(server.calls.filter(call => call.bootstrap).length, 2);
});

test('deleting the workspace clears bootstrap before the next concurrent saves', async () => {
  const server = guestServer(), api = library(server.fetch);
  await api.apiFetch('/api/builder/create', { method: 'POST' });
  const previousCookie = server.cookie();
  assert.equal((await api.apiFetch('/api/workspace?confirm=1', { method: 'DELETE' })).status, 200);
  assert.equal(server.cookie(), undefined);
  const [first, second] = await Promise.all([
    api.apiRequest('/api/builder/create', { method: 'POST' }),
    api.apiRequest('/api/builder/create', { method: 'POST' }),
  ]);
  assert.notEqual(server.cookie(), previousCookie);
  assert.equal(server.calls.filter(call => call.bootstrap).length, 2);
  assert.equal((await api.apiFetch('/api/builder/' + first.resume.id)).status, 200);
  assert.equal((await api.apiFetch('/api/builder/' + second.resume.id)).status, 200);
});

test('Sites guard runs before network calls or Web Locks', async () => {
  let fetched = 0, locked = 0;
  const api = library(async () => { fetched += 1; throw new Error('No network'); }, {
    sites: true, locks: { request() { locked += 1; throw new Error('No bootstrap'); } },
  });
  const responses = await Promise.all([
    api.apiFetch('/api/builder/create', { method: 'POST' }), api.apiFetch('/api/workspace'),
  ]);
  assert.ok(responses.every(response => response.status === 503));
  assert.equal(fetched, 0);
  assert.equal(locked, 0);
});

test('public processing avoids bootstrap; protected calls preserve request inputs', async () => {
  const server = guestServer(), api = library(server.fetch, { baseUrl: 'https://api.example.test///' });
  await api.apiFetch('/api/parse-and-score?mode=ats', { method: 'POST', body: 'upload' });
  assert.equal(server.calls.length, 1);
  assert.equal(server.calls[0].bootstrap, false);
  const body = new FormData(), controller = new AbortController();
  body.set('title', 'Original request');
  await api.apiFetch('api/builder/create', {
    method: 'POST', body, signal: controller.signal, credentials: 'omit', headers: { 'X-Test': 'preserved' },
  });
  const request = server.calls.at(-1);
  assert.equal(request.method, 'POST');
  assert.equal(request.init.body, body);
  assert.equal(request.init.signal, controller.signal);
  assert.equal(request.init.headers['X-Test'], 'preserved');
  assert.equal(request.init.credentials, 'include');
  assert.equal(api.apiUrl('/api/workspace'), 'https://api.example.test/api/workspace');
});
