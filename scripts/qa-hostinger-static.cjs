#!/usr/bin/env node
'use strict';

// LOCAL static files at a simulated canonical origin. Never passes a request to
// the actual primary site; only the manifest's exact Render API can use network.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { apiOrigin, inventory } = require('./build-hostinger.cjs');
const canonical = 'https://resume.docheng.co.za';
const root = fs.realpathSync(path.resolve(__dirname, '..'));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml' };

function configuration(argv) {
  let source, check = false;
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--dist' && argv[index + 1]) source = argv[++index];
    else if (argv[index] === '--check') check = true;
    else throw new Error('Usage: node scripts/qa-hostinger-static.cjs --dist .runtime/hostinger-release/<commit>/dist [--check]');
  }
  if (!source) throw new Error('--dist is required; no public site is used as a fallback.');
  if (fs.lstatSync(path.resolve(source)).isSymbolicLink()) throw new Error('The artifact directory must not be a link.');
  const dist = fs.realpathSync(path.resolve(source)), relative = path.relative(path.join(root, '.runtime', 'hostinger-release'), dist);
  if (!/^[a-f0-9]{40,64}[\\/]dist$/.test(relative)) throw new Error('Use a reviewed local artifact under .runtime/hostinger-release/<commit>/dist.');
  const manifest = JSON.parse(fs.readFileSync(path.join(path.dirname(dist), 'manifest.json'), 'utf8'));
  assert.equal(manifest.commit, relative.split(/[\\/]/)[0]);
  assert.equal(manifest.edition, 'primary-browser-local');
  const listing = inventory(dist);
  const files = new Map(listing.files.map(file => [file.path, file]));
  assert.deepEqual([...files.keys()].sort(), manifest.files.map(file => file.path).sort());
  for (const file of manifest.files) assert.equal(files.get(file.path).sha256, file.sha256, file.path);
  return { check, dist, manifest, files, api: apiOrigin(manifest.apiOrigin) };
}

function localFile(settings, pathname) {
  if (!pathname.startsWith('/') || /%(?:2f|5c|00)/i.test(pathname) || /[\\\x00-\x1f]/.test(pathname)) return null;
  let decoded; try { decoded = decodeURIComponent(pathname); } catch { return null; }
  if (decoded.split('/').some(part => part.startsWith('.') || part === '..') || /[\\\x00-\x1f]/.test(decoded)) return null;
  const relative = decoded.replace(/^\/+/, '');
  const candidates = [relative || 'index.html', relative + (relative.endsWith('/') || !relative ? '' : '/') + 'index.html'];
  for (const candidate of candidates) {
    const known = settings.files.get(candidate);
    if (!known || !MIME[path.extname(candidate).toLowerCase()]) continue;
    const actual = fs.realpathSync(known.absolute), inside = path.relative(settings.dist, actual);
    if (!inside || inside.startsWith('..' + path.sep) || inside === '..' || path.isAbsolute(inside) || fs.lstatSync(known.absolute).isSymbolicLink()) return null;
    return { file: actual, mime: MIME[path.extname(candidate).toLowerCase()], directoryRedirect: candidate === relative + '/index.html' && !pathname.endsWith('/') };
  }
  return null;
}

async function main(argv = process.argv.slice(2)) {
  const settings = configuration(argv);
  assert.equal(localFile(settings, '/.htaccess'), null);
  assert.equal(localFile(settings, '/../manifest.json'), null);
  assert.equal(localFile(settings, '/%2e%2e/manifest.json'), null);
  assert.equal(localFile(settings, '/%2fetc/passwd'), null);
  assert.equal(localFile(settings, '/missing-qa-file'), null);
  assert.equal(localFile(settings, '/').mime, 'text/html; charset=utf-8');
  assert.ok(localFile(settings, '/builder/'));
  if (settings.check) { console.log(JSON.stringify({ check: 'passed', scope: 'LOCAL STATIC ARTIFACT ONLY', sourceCommit: settings.manifest.commit, dist: settings.dist, simulatedBrowserOrigin: canonical, liveApiOrigin: settings.api, networkCalls: false, browserStarted: false, hostingWrites: false }, null, 2)); return; }
  const { chromium, browserChannel } = require('./playwright-runtime.cjs');
  const output = path.join(root, 'docs', 'qa', 'hostinger-static'); fs.mkdirSync(output, { recursive: true });
  const report = { scope: 'LOCAL STATIC ARTIFACT at simulated canonical origin; NOT DEPLOYED', sourceCommit: settings.manifest.commit, artifactSha256: settings.manifest.artifact.sha256, dist: settings.dist, simulatedBrowserOrigin: canonical, liveApiOrigin: settings.api, startedAt: new Date().toISOString(), canonicalNetworkPassThrough: false, checks: [], apiRequests: [], fetches: [], apiResponses: [], pageErrors: [], violations: [], missingLocalPaths: [], canonicalResponses: [], localResponses: 0 };
  const note = value => { report.checks.push(value); console.log(value); };
  const permitted = new Set(['/api/exports/resume/pdf', '/api/exports/resume/import', '/api/exports/cover-letter/pdf', '/api/parse-and-score']);
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, acceptDownloads: true, serviceWorkers: 'block' });
    await context.exposeBinding('__qaRecordFetch', (_, data) => { report.fetches.push(data); });
    await context.addInitScript(() => {
      const original = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const address = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        window.__qaRecordFetch({ url: new URL(address, location.href).href, credentials: init?.credentials || (input instanceof Request ? input.credentials : 'same-origin') }).catch(() => undefined);
        return original(input, init);
      };
    });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin === canonical) {
        const file = ['GET', 'HEAD'].includes(request.method()) ? localFile(settings, url.pathname) : null;
        if (!file) { report.missingLocalPaths.push(url.pathname); await route.fulfill({ status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-QA-Local-Static': settings.manifest.commit }, body: 'Local artifact file not found.' }); return; }
        // Fulfill directory indexes directly: a browser redirect chain must not
        // get any opportunity to leave this local-only test transport.
        report.localResponses++;
        await route.fulfill({ status: 200, headers: { 'Content-Type': file.mime, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-QA-Local-Static': settings.manifest.commit }, body: request.method() === 'HEAD' ? Buffer.alloc(0) : fs.readFileSync(file.file) }); return;
      }
      if (url.origin === settings.api && permitted.has(url.pathname) && ['POST', 'OPTIONS'].includes(request.method())) {
        if (request.method() === 'POST') report.apiRequests.push({ path: url.pathname, method: request.method(), cookieSent: Boolean(request.headers().cookie) });
        await route.continue(); return;
      }
      report.violations.push({ origin: url.origin, path: url.pathname, method: request.method() }); await route.abort('blockedbyclient');
    });
    const page = await context.newPage(); page.setDefaultTimeout(35000); page.setDefaultNavigationTimeout(120000);
    page.on('pageerror', error => report.pageErrors.push(error.message));
    const canonicalChecks = [];
    page.on('response', response => { if (new URL(response.url()).origin === canonical) canonicalChecks.push((async () => { const headers = await response.allHeaders(); const verified = headers['x-qa-local-static'] === settings.manifest.commit; report.canonicalResponses.push({ path: new URL(response.url()).pathname, status: response.status(), localMarkerVerified: verified }); if (!verified) report.violations.push({ canonicalResponseWithoutLocalMarker: response.url() }); })()); });
    const go = route => page.goto(canonical + route, { waitUntil: 'networkidle' });
    const responseFor = pathname => page.waitForResponse(response => new URL(response.url()).origin === settings.api && new URL(response.url()).pathname === pathname && response.request().method() === 'POST', { timeout: 120000 });
    const verifyResponse = async response => { assert.ok(response.ok(), response.url() + ' ' + response.status()); const headers = await response.allHeaders(); assert.equal(headers['access-control-allow-origin'], canonical); assert.match(headers['cache-control'] || '', /no-store/); assert.equal(headers['set-cookie'], undefined); report.apiResponses.push({ path: new URL(response.url()).pathname, status: response.status(), corsOrigin: headers['access-control-allow-origin'], cacheControl: headers['cache-control'], setCookie: false }); };
    const download = async (name, action) => { const [file] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), action()]); const destination = path.join(output, name); await file.saveAs(destination); assert.ok(fs.statSync(destination).size > 20); return destination; };
    await go('/builder/?new=1');
    await page.getByLabel('Resume title', { exact: true }).waitFor();
    assert.equal(await page.getByLabel(/^Full Name/).inputValue(), '');
    assert.equal(await page.getByRole('button', { name: 'Save session copy', exact: true }).count(), 0);
    const beforeOversize = report.apiRequests.length;
    await page.getByLabel('Import resume', { exact: true }).setInputFiles({ name: 'oversized-qa.txt', mimeType: 'text/plain', buffer: Buffer.alloc(2 * 1024 * 1024 + 1, 65) });
    await page.getByRole('alert').filter({ hasText: 'Choose a resume no larger than 2 MB.' }).waitFor();
    assert.equal(report.apiRequests.length, beforeOversize);
    assert.equal(report.fetches.filter(item => new URL(item.url).origin === settings.api).length, 0);
    await page.getByRole('button', { name: 'Dismiss message', exact: true }).click();
    note('A 2 MiB + 1 byte synthetic import is rejected before any live API fetch');
    await page.getByLabel('Resume title', { exact: true }).fill('Static artifact QA');
    await page.getByLabel(/^Full Name/).fill('STATIC SAVED RESUME');
    await page.getByLabel(/^Email/).fill('static-qa@example.test');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    report.fixtureReloadUrl = page.url();
    assert.equal(await page.getByLabel(/^Full Name/).inputValue(), 'STATIC SAVED RESUME');
    await page.getByLabel(/^Full Name/).fill('STATIC LIVE CURRENT EXPORT');
    const [resumeResponse, resumePdf] = await Promise.all([responseFor('/api/exports/resume/pdf'), download('resume-current.pdf', () => page.getByRole('button', { name: 'Download PDF', exact: true }).click())]);
    await verifyResponse(resumeResponse);
    assert.equal(resumeResponse.request().postDataJSON().contact.full_name, 'STATIC LIVE CURRENT EXPORT');
    note('Local primary static artifact starts blank and saves/reloads in browser; current PDF uses the live Render API with canonical CORS');
    await page.waitForTimeout(1600);
    const [importResponse] = await Promise.all([responseFor('/api/exports/resume/import'), page.getByLabel('Import resume', { exact: true }).setInputFiles({ name: 'static-import.txt', mimeType: 'text/plain', buffer: Buffer.from('Jane Smith\nstatic-import@example.test\n\nSUMMARY\nSoftware engineer building practical Python tools.\n\nSKILLS\nPython, SQL, communication') })]);
    await verifyResponse(importResponse); const parsed = await importResponse.json(); assert.equal(parsed.resume.id, null); assert.equal(parsed.server_persistence, false);
    await page.getByText('Resume imported into a new document.', { exact: false }).waitFor();
    assert.equal(await page.getByLabel(/^Email/).inputValue(), 'static-import@example.test');
    note('TXT import populates the editable browser document without a server identity');
    await page.waitForTimeout(1600);
    await go('/resume-scanner/');
    await page.locator('input[type=file]').setInputFiles(resumePdf);
    const [scanResponse] = await Promise.all([responseFor('/api/parse-and-score'), page.getByRole('button', { name: 'Scan Resume', exact: true }).click()]);
    await verifyResponse(scanResponse); const scanned = await scanResponse.json(); fs.writeFileSync(path.join(output, 'scan-response.json'), JSON.stringify(scanned, null, 2) + '\n'); report.scanContract = { mode: scanned.score?.mode, detailedMetricGroups: Object.keys(scanned.score?.detailed_metrics || {}) }; await page.getByRole('button', { name: 'Edit this resume', exact: true }).waitFor();
    note('Scanner submits the small current PDF to the live service and renders feedback with no-store responses');
    await page.waitForTimeout(1600);
    await go('/cover-letter/'); await page.locator('main[data-letter-ready=true]').waitFor();
    await page.getByRole('button', { name: 'Create cover letter', exact: true }).click();
    await page.getByLabel('Cover letter title').fill('Static local letter');
    await page.getByRole('button', { name: 'Your Information', exact: true }).click();
    await page.getByLabel('full name', { exact: true }).fill('Zoë Naïdø');
    await page.getByLabel('email', { exact: true }).fill('static-qa@example.test');
    await page.getByRole('button', { name: 'Write Content', exact: true }).click();
    await page.getByLabel('Opening paragraph').fill('Saved local letter.');
    await page.getByRole('button', { name: 'Save in browser', exact: true }).click();
    await page.getByText('Cover letter saved only in this browser on this device.', { exact: true }).waitFor();
    await page.getByLabel('Opening paragraph').fill('STATIC LIVE UNSAVED LETTER');
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const [letterResponse] = await Promise.all([responseFor('/api/exports/cover-letter/pdf'), download('letter-current.pdf', () => page.getByRole('button', { name: /Download PDF$/ }).click())]);
    await verifyResponse(letterResponse); assert.equal(letterResponse.request().postDataJSON().content.opening_paragraph, 'STATIC LIVE UNSAVED LETTER');
    await page.getByRole('button', { name: '← All cover letters', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('heading', { name: 'Static local letter', exact: true }).waitFor();
    note('Letters persist in browser storage; current PDF uses the stateless live service without a save/list/delete request');
    for (const [route, ready] of [['/dashboard/', 'main[data-workspace-ready=true]'], ['/job-tracker/', 'main[data-workspace-ready=true]'], ['/templates/', 'main'], ['/cover-letter/', 'main[data-letter-ready=true]'], ['/builder/', 'input[aria-label="Resume title"]']]) {
      await go(route); await page.locator(ready).waitFor();
      await page.setViewportSize({ width: 390, height: 844 });
      const width = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth })); assert.ok(width.document <= width.viewport + 1, route + ' overflow');
      await page.screenshot({ path: path.join(output, route.split('/').filter(Boolean).join('-') + '-mobile.png'), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1050 });
    }
    note('Gallery, dashboard, job tracker, letters and builder load entirely from local static files; mobile390 has no overflow');
    await Promise.all(canonicalChecks);
    assert.deepEqual(report.violations, []); assert.deepEqual(report.pageErrors, []); assert.deepEqual(report.missingLocalPaths, []);
    assert.equal(report.apiRequests.length, 4); assert.ok(report.apiRequests.every(request => !request.cookieSent));
    const processing = report.fetches.filter(item => new URL(item.url).origin === settings.api);
    assert.equal(processing.length, 4); assert.ok(processing.every(item => item.credentials === 'omit'));
    assert.equal((await context.cookies()).filter(cookie => /workspace/i.test(cookie.name)).length, 0);
    note('Four live processing calls use credentials omit; no workspace cookie, persisted server route, page error, or real canonical-host passthrough');
    report.passed = true;
  } catch (error) { report.passed = false; report.error = error.stack; const page = browser.contexts()[0]?.pages()[0]; if (page) { report.failedPage = { url: page.url(), text: (await page.locator('body').innerText().catch(() => '')).slice(0, 5000) }; await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => undefined); } throw error; }
  finally { report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n'); await browser.close(); }
}

if (require.main === module) main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
module.exports = { configuration, localFile };
