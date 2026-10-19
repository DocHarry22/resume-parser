const { clickResumeAction } = require("../../scripts/playwright-runtime.cjs");
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const temporary = path.resolve(__dirname, '../../.runtime/history-browser');
fs.mkdirSync(temporary, { recursive: true }); process.env.TEMP = process.env.TMP = temporary;
const { chromium, browserChannel } = require('../../scripts/playwright-runtime.cjs');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3104';
const out = path.resolve(__dirname, '../../docs/qa/resume-history'); fs.mkdirSync(out, { recursive: true });
const resumeKey = 'resume_studio_documents_v1', jobKey = 'resume-studio.jobs.v1';
const fixture = { id: 'history-source', template: 'technical', colorTheme: 'teal', updatedAt: '2026-10-19T08:00:00Z',
  resume: { title: 'Engineering resume', contact: { full_name: 'History Candidate', email: 'candidate@example.test' }, summary: { summary: 'Process engineer using Python and SQL.' }, experience: [{ company: 'Example Works', position: 'Engineer', start_date: '2024', current: true, description: ['Reviewed plant operations.'], achievements: [] }], education: [], skills: [{ category: 'Technical', skills: ['Python', 'SQL'] }], projects: [], certifications: [], languages: [], achievements: [], volunteer: [], publications: [], custom_sections: {} },
  design: { font: 'mono', fontSize: 12, lineHeight: 1.5, spacing: 24, pageSize: 'A4', sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'achievements', 'volunteer', 'publications', 'custom'], hiddenSections: [] },
  tailoring: { sourceResumeId: 'original-source', jobId: 'history-job', role: 'Process Engineer', company: 'Atlas Example', description: 'Python, SQL and process safety experience.', terms: ['Python', 'SQL', 'process safety'] } };
const job = { id: 'history-job', role: 'Process Engineer', company: 'Atlas Example', description: fixture.tailoring.description, location: 'Johannesburg', salary: '', notes: 'Keep these notes.', stage: 'Applied', url: '', appliedOn: '2026-10-19', followUpOn: '', resumeId: fixture.id, updatedAt: fixture.updatedAt };
const report = { baseUrl, startedAt: new Date().toISOString(), results: [] };
(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const run = async (name, task, seed = true) => {
    console.log('RUN', name);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    if (seed) await context.addInitScript(({ fixture, job, resumeKey, jobKey }) => { if (!/^https?:$/.test(location.protocol)) return; if (!localStorage.getItem(resumeKey)) localStorage.setItem(resumeKey, JSON.stringify([fixture])); if (!localStorage.getItem(jobKey)) localStorage.setItem(jobKey, JSON.stringify([job])); }, { fixture, job, resumeKey, jobKey });
    const page = await context.newPage(); page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(60000);
    const errors = [], apiRequests = [];
    context.on('page', next => next.on('pageerror', error => errors.push(error.message))); page.on('pageerror', error => errors.push(error.message));
    context.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
    try { await task(page, context); assert.deepEqual(errors, []); assert.deepEqual(apiRequests, []); report.results.push({ name, status: 'passed' }); console.log('PASS', name); }
    catch (error) { console.error('FAIL', name, error.stack); report.results.push({ name, status: 'failed', error: error.message }); await page.screenshot({ path: path.join(out, `failure-${report.results.length}.png`), fullPage: true }).catch(() => {}); }
    finally { await context.close(); report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2)); }
  };
  const go = async (page, route = '/history?resume=' + fixture.id) => { await page.goto(baseUrl + route, { waitUntil: 'networkidle' }); await page.locator('main[data-workspace-ready=true]').waitFor(); };
  const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), resumeKey);
  const source = async page => (await saved(page)).find(item => item.id === fixture.id);
  const checkpoint = async (page, name = 'Before the application') => { await page.getByLabel('Checkpoint name').fill(name); await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click(); await page.getByRole('button', { name: 'Already current', exact: true }).waitFor(); };
  const select = (page, name) => page.locator('.history-version').filter({ has: page.getByText(name, { exact: true }) }).click();
  const confirm = async (page, action, accept = true) => { page.once('dialog', dialog => accept ? dialog.accept() : dialog.dismiss()); await action(); };
  const edit = async (page, text) => { await page.goto(baseUrl + '/builder?id=' + fixture.id + '&section=summary', { waitUntil: 'networkidle' }); await page.getByLabel(/^Professional Summary/).fill(text); await page.getByRole('button', { name: 'Save', exact: true }).click(); };

  await run('editor checkpoint, content and design diff, safe restore and undo restore', async page => {
    await page.goto(baseUrl + '/builder?id=' + fixture.id, { waitUntil: 'networkidle' }); await page.getByLabel(/^Full Name/).fill('Latest Candidate');
    await clickResumeAction(page, "Version history", 'link'); await page.locator('main[data-workspace-ready=true]').waitFor(); assert.equal((await source(page)).resume.contact.full_name, 'Latest Candidate');
    await checkpoint(page); const original = await source(page); const originalId = original.versions[0].id;
    await edit(page, 'Newer work with Python, SQL and process safety.'); await page.getByRole('button', { name: 'Design & sections', exact: true }).click(); await page.getByLabel('Font', { exact: true }).selectOption('serif');
    await clickResumeAction(page, "Version history", 'link'); await page.locator('.history-change').first().waitFor(); assert.match(await page.locator('.history-changes').textContent(), /Newer work with Python/); assert.match(await page.locator('.history-changes').textContent(), /Serif|serif/);
    await page.getByLabel('Filter changes by section').selectOption('Design'); assert.ok((await page.locator('.history-change').allTextContents()).every(text => text.includes('Design'))); await page.getByLabel('Filter changes by section').selectOption('All changes');
    await confirm(page, () => page.getByRole('button', { name: 'Restore checkpoint', exact: true }).click(), false); assert.equal((await source(page)).versions.length, 1);
    await confirm(page, () => page.getByRole('button', { name: 'Restore checkpoint', exact: true }).click()); await page.getByText('Checkpoint restored.', { exact: false }).waitFor();
    let current = await source(page); assert.equal(current.id, fixture.id); assert.equal(current.resume.summary.summary, fixture.resume.summary.summary); assert.equal(current.design.font, 'mono'); assert.equal(current.versions.length, 2); assert.equal(current.versions[0].kind, 'before-restore'); assert.equal(current.versions[1].id, originalId);
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), jobKey), [job]);
    await select(page, 'Before restore · Before the application'); await confirm(page, () => page.getByRole('button', { name: 'Restore checkpoint', exact: true }).click()); current = await source(page); assert.equal(current.versions.length, 3); assert.equal(current.design.font, 'serif'); assert.match(current.resume.summary.summary, /Newer work/);
    await select(page, 'Before the application'); await page.screenshot({ path: path.join(out, 'history-desktop.png'), fullPage: true });
  });
  await run('JSON download restores history independently and checkpoint copy/delete keep current draft', async page => {
    await go(page); await checkpoint(page, 'Original draft'); await edit(page, 'Edited after checkpoint.'); await go(page);
    const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Back up with history', exact: true }).click(); const download = await downloadPromise; const backupPath = path.join(temporary, 'history-backup.json'); await download.saveAs(backupPath);
    const backup = JSON.parse(fs.readFileSync(backupPath)); assert.equal(backup.versions.length, 1); assert.equal(backup.versions[0].snapshot.resume.summary.summary, fixture.resume.summary.summary);
    await page.getByRole('button', { name: 'Open as new copy', exact: true }).click(); const before = await source(page); assert.equal(before.resume.summary.summary, 'Edited after checkpoint.'); const copy = (await saved(page)).find(item => item.id !== fixture.id); assert.equal(copy.resume.summary.summary, fixture.resume.summary.summary); assert.deepEqual(copy.versions, []);
    await confirm(page, () => page.getByRole('button', { name: 'Delete checkpoint Original draft', exact: true }).click()); assert.equal((await source(page)).versions.length, 0); assert.equal((await source(page)).resume.summary.summary, before.resume.summary.summary);
    await page.getByRole('link', { name: 'Open resume editor', exact: true }).click(); await page.getByLabel('Import resume', { exact: true }).setInputFiles(backupPath); await page.getByText('Resume imported into a new document.', { exact: false }).waitFor(); await page.getByRole('button', { name: 'Save', exact: true }).click();
    const restoredId = new URL(page.url()).searchParams.get('id'); assert.notEqual(restoredId, fixture.id); const restored = (await saved(page)).find(item => item.id === restoredId); assert.equal(restored.versions.length, 1); assert.equal(restored.versions[0].snapshot.id, restoredId); assert.equal(restored.resume.summary.summary, 'Edited after checkpoint.');
  });
  await run('two tabs preserve checkpoints and clean editors adopt restores', async (page, context) => {
    await page.goto(baseUrl + '/builder?id=' + fixture.id + '&section=summary', { waitUntil: 'networkidle' }); const other = await context.newPage(); await go(other); await checkpoint(other, 'Before editing'); await page.bringToFront();
    await page.getByLabel(/^Professional Summary/).fill('Latest content from the open editor.'); await page.getByRole('button', { name: 'Save', exact: true }).click(); assert.equal((await source(page)).versions.length, 1);
    await other.bringToFront(); await other.locator('.history-change').first().waitFor(); await confirm(other, () => other.getByRole('button', { name: 'Restore checkpoint', exact: true }).click()); await page.bringToFront();
    await page.waitForFunction(text => document.querySelector('textarea')?.value === text, fixture.resume.summary.summary); await page.getByRole('button', { name: 'Save', exact: true }).click(); assert.equal((await source(page)).resume.summary.summary, fixture.resume.summary.summary); assert.equal((await source(page)).versions.length, 2);
    await other.close();
  });
  await run('dirty editor conflict can be backed up before loading latest saved version', async (page, context) => {
    await go(page); await checkpoint(page, 'Original'); await edit(page, 'Persisted current draft.'); const other = await context.newPage(); await go(other); await page.bringToFront();
    // Change saved state while this tab has edits pending, before its autosave.
    await page.getByLabel(/^Professional Summary/).fill('UNSAVED tab draft'); await other.evaluate(key => { const docs = JSON.parse(localStorage.getItem(key)); docs[0].resume.summary.summary = 'NEWER saved draft'; localStorage.setItem(key, JSON.stringify(docs)); }, resumeKey);
    await page.getByRole('button', { name: 'Load latest saved version', exact: true }).waitFor(); assert.equal(await page.getByLabel(/^Professional Summary/).inputValue(), 'UNSAVED tab draft'); assert.equal((await source(page)).resume.summary.summary, 'NEWER saved draft');
    const downloadPromise = page.waitForEvent('download'); await clickResumeAction(page, "JSON backup"); const download = await downloadPromise; const backupPath = path.join(temporary, 'unsaved-draft.json'); await download.saveAs(backupPath); const backup = JSON.parse(fs.readFileSync(backupPath)); assert.equal(backup.resume.summary.summary, 'UNSAVED tab draft'); assert.equal(backup.versions.length, 1);
    await confirm(page, () => page.getByRole('button', { name: 'Load latest saved version', exact: true }).click(), false); assert.equal(await page.getByLabel(/^Professional Summary/).inputValue(), 'UNSAVED tab draft');
    await confirm(page, () => page.getByRole('button', { name: 'Load latest saved version', exact: true }).click()); assert.equal(await page.getByLabel(/^Professional Summary/).inputValue(), 'NEWER saved draft'); assert.equal((await source(page)).versions.length, 1); await other.close();
  });
  await run('restore quota failure is atomic and invalid history cannot be overwritten', async page => {
    await go(page); await checkpoint(page); await edit(page, 'Draft retained when storage is full.'); await go(page); const before = await page.evaluate(key => localStorage.getItem(key), resumeKey);
    await page.evaluate(key => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(item, value) { if (item === key) throw new DOMException('Storage full', 'QuotaExceededError'); return window.originalSetItem.call(this, item, value); }; }, resumeKey);
    await confirm(page, () => page.getByRole('button', { name: 'Restore checkpoint', exact: true }).click()); await page.locator('main').getByRole('alert').waitFor(); assert.equal(await page.evaluate(key => localStorage.getItem(key), resumeKey), before);
    await page.evaluate(key => { Storage.prototype.setItem = window.originalSetItem; const docs = JSON.parse(localStorage.getItem(key)); docs[0].versions[0].createdAt = 'bad timestamp'; localStorage.setItem(key, JSON.stringify(docs)); }, resumeKey);
    const broken = await page.evaluate(key => localStorage.getItem(key), resumeKey); await page.reload({ waitUntil: 'networkidle' }); await page.locator('main').getByRole('alert').waitFor(); assert.equal(await page.getByRole('button', { name: 'Save checkpoint', exact: true }).count(), 0); assert.equal(await page.evaluate(key => localStorage.getItem(key), resumeKey), broken);
  });
  await run('history at 390px and empty library fit the viewport', async page => {
    await go(page); await checkpoint(page, 'A checkpoint with a long application name'); await edit(page, 'A new draft with a field to compare.'); await go(page); await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: path.join(out, 'history-390.png'), fullPage: true });
    await page.evaluate(key => localStorage.setItem(key, '[]'), resumeKey); await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('heading', { name: 'A place for your next draft.', exact: true }).waitFor(); assert.ok(await page.getByRole('link', { name: 'Create a resume', exact: true }).isVisible());
  });
  await browser.close(); if (report.results.some(item => item.status !== 'passed')) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
