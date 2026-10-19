const { clickResumeAction } = require("../../scripts/playwright-runtime.cjs");
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const temporary = path.resolve(__dirname, '../../.runtime/tailoring-browser');
fs.mkdirSync(temporary, { recursive: true }); process.env.TEMP = process.env.TMP = temporary;
const { chromium, browserChannel } = require('../../scripts/playwright-runtime.cjs');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3104';
const out = path.resolve(__dirname, '../../docs/qa/resume-tailoring'); fs.mkdirSync(out, { recursive: true });
const resumeKey = 'resume_studio_documents_v1', jobKey = 'resume-studio.jobs.v1';
const fixture = { id: 'tailor-source', template: 'technical', colorTheme: 'teal', updatedAt: '2026-10-19T08:00:00Z',
  resume: { title: 'My engineering resume', contact: { full_name: 'Tailoring Candidate', email: 'candidate@example.test' }, summary: { summary: 'Process engineer using Python, SQL and process safety reviews.' }, experience: [{ company: 'Example Works', position: 'Engineer', start_date: '2024', current: true, description: ['Reviewed plant operations.'], achievements: [] }], education: [], skills: [{ category: 'Technical', skills: ['Python', 'SQL'] }], projects: [], certifications: [], languages: [], achievements: [], volunteer: [], publications: [], custom_sections: {} },
  design: { font: 'mono', fontSize: 12, lineHeight: 1.5, spacing: 24, pageSize: 'A4', sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'achievements', 'volunteer', 'publications', 'custom'], hiddenSections: [] } };
const job = { id: 'tailor-job', role: 'Process Engineer', company: 'Atlas Example', description: 'Python, SQL, process safety and HAZOP experience.', location: 'Johannesburg', salary: 'R50,000', notes: 'Contact the hiring team.', stage: 'Saved', url: 'https://example.test/careers', appliedOn: '', followUpOn: '', resumeId: fixture.id, updatedAt: '2026-10-19T08:00:00Z' };
const report = { baseUrl, startedAt: new Date().toISOString(), results: [] };
(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const run = async (name, task, seed = true) => {
    console.log('RUN', name);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    if (seed) await context.addInitScript(({ fixture, job, resumeKey, jobKey }) => { if (!/^https?:$/.test(location.protocol)) return; if (!localStorage.getItem(resumeKey)) localStorage.setItem(resumeKey, JSON.stringify([fixture])); if (!localStorage.getItem(jobKey)) localStorage.setItem(jobKey, JSON.stringify([job])); }, { fixture, job, resumeKey, jobKey });
    const page = await context.newPage(); page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(60000);
    const errors = [], apiRequests = []; context.on('page', page => page.on('pageerror', error => errors.push(error.message))); page.on('pageerror', error => errors.push(error.message)); context.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
    try { await task(page, context); assert.deepEqual(errors, []); assert.deepEqual(apiRequests, []); report.results.push({ name, status: 'passed' }); console.log('PASS', name); }
    catch (error) { console.error('FAIL', name, error.message); report.results.push({ name, status: 'failed', error: error.message }); await page.screenshot({ path: path.join(out, `failure-${report.results.length}.png`), fullPage: true }).catch(() => {}); }
    finally { await context.close(); report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2)); }
  };
  const go = async (page, route) => { await page.goto(baseUrl + route, { waitUntil: 'networkidle' }); await page.locator('main[data-workspace-ready=true]').waitFor(); };
  const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), resumeKey);
  const create = async page => { await page.getByLabel('Terms to check', { exact: true }).fill('Python\nSQL\nprocess safety\nHAZOP'); await page.getByRole('button', { name: 'Create tailored copy', exact: true }).click(); await page.getByRole('link', { name: 'Open resume editor', exact: true }).waitFor(); return new URL(page.url()).searchParams.get('resume'); };

  await run('tracked job to independent tailored copy, linked application and edited coverage', async page => {
    await go(page, '/job-tracker'); await page.getByRole('link', { name: 'Tailor resume for Process Engineer at Atlas Example', exact: true }).click(); await page.locator('main[data-workspace-ready=true]').waitFor();
    assert.equal(await page.getByLabel('Saved resume', { exact: true }).inputValue(), fixture.id); assert.equal(await page.getByLabel('Target role').inputValue(), job.role);
    await page.getByLabel('Terms to check', { exact: true }).fill('Python\nSQL\nprocess safety\nHAZOP'); assert.equal(await page.locator('.tailor-match-count').textContent(), '3/4');
    const id = await create(page); assert.notEqual(id, fixture.id); const all = await saved(page); assert.equal(all.length, 2); assert.deepEqual(all.find(item => item.id === fixture.id).resume.summary, fixture.resume.summary); const copy = all.find(item => item.id === id); assert.deepEqual(copy.design, fixture.design); assert.equal(copy.tailoring.sourceResumeId, fixture.id);
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key))[0].resumeId, jobKey), fixture.id);
    await page.getByRole('button', { name: 'Use for this application', exact: true }).click(); const linked = await page.evaluate(key => JSON.parse(localStorage.getItem(key))[0], jobKey); assert.equal(linked.resumeId, id); assert.equal(linked.notes, job.notes); assert.equal(linked.salary, job.salary);
    await page.getByRole('link', { name: 'Edit summary', exact: true }).click(); await page.getByLabel(/^Professional Summary/).fill('Process engineer using Python, SQL, process safety and HAZOP reviews.'); await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.locator('.studio-tailoring-banner').getByRole('link', { name: 'Review term coverage', exact: true }).click(); await page.locator('main[data-workspace-ready=true]').waitFor(); assert.equal(await page.locator('.tailor-match-count').textContent(), '4/4');
    assert.deepEqual((await saved(page)).find(item => item.id === fixture.id).resume.summary, fixture.resume.summary);
    await page.reload({ waitUntil: 'networkidle' }); assert.equal(await page.locator('.tailor-match-count').textContent(), '4/4'); assert.equal(await page.getByLabel('Target role').inputValue(), job.role);
    await page.getByLabel('Target role').fill('Senior Process Engineer'); await page.getByRole('link', { name: 'Open resume editor', exact: true }).click(); await page.locator('main').getByRole('alert').waitFor(); assert.ok(page.url().includes('/tailor'));
    await page.getByRole('button', { name: 'Save target details', exact: true }).click(); assert.equal((await saved(page)).length, 2);
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); }); await page.screenshot({ path: path.join(out, 'tailoring-desktop.png'), fullPage: true });
  });
  await run('builder shortcut flushes current edits and supports a pasted target', async page => {
    await page.goto(baseUrl + '/builder?id=' + fixture.id, { waitUntil: 'networkidle' }); await page.getByLabel(/^Full Name/).fill('LATEST UNSAVED CANDIDATE');
    await clickResumeAction(page, "Tailor for a job", 'link'); await page.locator('main[data-workspace-ready=true]').waitFor(); assert.equal((await saved(page)).find(item => item.id === fixture.id).resume.contact.full_name, 'LATEST UNSAVED CANDIDATE');
    await page.getByLabel('Target role').fill('Engineering Analyst'); await page.getByLabel('Company', { exact: true }).fill('Manual opportunity'); await page.getByLabel('Job description', { exact: true }).fill('Python Python SQL analysis with excellent teamwork and skills.');
    await page.getByRole('button', { name: 'Use suggestions', exact: true }).click(); assert.match(await page.getByLabel('Terms to check', { exact: true }).inputValue(), /python/);
    const id = await create(page); const copy = (await saved(page)).find(item => item.id === id); assert.equal(copy.tailoring.jobId, ''); assert.equal(copy.resume.contact.full_name, 'LATEST UNSAVED CANDIDATE'); assert.equal(await page.getByRole('button', { name: 'Use for this application', exact: true }).count(), 0);
  });
  await run('storage failures preserve the original and linking failure keeps the saved copy', async page => {
    await go(page, '/tailor?job=' + job.id); const original = await page.evaluate(key => localStorage.getItem(key), resumeKey);
    await page.evaluate(key => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(item, value) { if (item === key) throw new DOMException('Storage full', 'QuotaExceededError'); return window.originalSetItem.call(this, item, value); }; }, resumeKey);
    await page.getByRole('button', { name: 'Create tailored copy', exact: true }).click(); await page.locator('main').getByRole('alert').waitFor(); assert.equal(await page.evaluate(key => localStorage.getItem(key), resumeKey), original);
    await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; }); const id = await create(page); assert.ok(id);
    await page.evaluate(key => localStorage.setItem(key, '{broken'), jobKey); await page.getByRole('button', { name: 'Use for this application', exact: true }).click(); await page.locator('main').getByRole('alert').waitFor(); assert.equal((await saved(page)).length, 2); assert.equal(await page.evaluate(key => localStorage.getItem(key), jobKey), '{broken');
  });
  await run('conflicting target edits in two tabs are detected without discarding newer content', async (page, context) => {
    await go(page, '/tailor?job=' + job.id); const id = await create(page); const other = await context.newPage(); await go(other, '/tailor?resume=' + id);
    await page.getByLabel('Target role').fill('Pending first-tab target'); await other.getByLabel('Target role').fill('Saved second-tab target'); await other.getByRole('button', { name: 'Save target details', exact: true }).click();
    await page.getByRole('button', { name: 'Save target details', exact: true }).click(); await page.locator('main').getByRole('alert').filter({ hasText: 'another tab' }).waitFor(); assert.equal((await saved(page)).find(item => item.id === id).tailoring.role, 'Saved second-tab target');
    await page.getByLabel('Saved resume', { exact: true }).selectOption(fixture.id); await page.getByLabel('Saved resume', { exact: true }).selectOption(id); assert.equal(await page.getByLabel('Target role').inputValue(), 'Saved second-tab target'); await other.close();
  });
  await run('mobile tailoring and section shortcut fit the viewport', async page => {
    await page.setViewportSize({ width: 390, height: 844 }); await go(page, '/tailor?job=' + job.id); await create(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); }); await page.screenshot({ path: path.join(out, 'tailoring-390.png'), fullPage: true });
    await page.getByRole('link', { name: 'Edit skills', exact: true }).click(); assert.equal(await page.getByRole('combobox', { name: /Editing section/ }).inputValue(), 'skills'); assert.ok(await page.locator('.studio-tailoring-banner').isVisible()); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  });
  await run('empty and unreadable libraries have useful recovery paths without writes', async page => {
    await go(page, '/tailor'); await page.getByRole('heading', { name: 'Start with your experience.', exact: true }).waitFor();
    await page.evaluate(key => localStorage.setItem(key, '{broken'), resumeKey); await page.reload({ waitUntil: 'networkidle' }); await page.locator('main').getByRole('alert').waitFor(); assert.equal(await page.evaluate(key => localStorage.getItem(key), resumeKey), '{broken'); assert.equal(await page.getByRole('button', { name: 'Create tailored copy', exact: true }).count(), 0);
  }, false);
  await browser.close(); if (report.results.some(item => item.status !== 'passed')) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
