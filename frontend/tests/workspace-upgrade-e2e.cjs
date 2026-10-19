const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const runtime = path.resolve(__dirname, '../../.runtime/workspace-browser');
fs.mkdirSync(runtime, { recursive: true });
process.env.TEMP = process.env.TMP = runtime;
const { chromium, browserChannel } = require('../../scripts/playwright-runtime.cjs');
const base = process.env.BASE_URL || 'http://127.0.0.1:3100';
const output = path.resolve(__dirname, '../../docs/qa/workspace-upgrade');
fs.mkdirSync(output, { recursive: true });
const reportFile = path.join(output, 'report.json');
const results = process.env.CASE_FILTER && fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, 'utf8')).filter(result => !new RegExp(process.env.CASE_FILTER).test(result.name)) : [];
const fixture = {
  id: 'workspace-fixture', template: 'modern', colorTheme: 'blue', updatedAt: '2026-10-19T10:00:00Z',
  resume: { title: 'Engineering resume', contact: { full_name: 'Test Candidate', email: 'test@example.test' }, summary: { summary: 'Chemical engineer with experience in process improvement.' }, experience: [{ company: 'Example Works', position: 'Process engineer', current: true, start_date: '2024', description: ['Improved a process'], achievements: [] }], education: [{ institution: 'Example University', degree: 'BEng', honors: [] }], skills: [], projects: [], certifications: [], languages: [], achievements: [], volunteer: [], publications: [], custom_sections: {} },
  design: { font: 'template', fontSize: 12, lineHeight: 1.5, spacing: 24, pageSize: 'A4', sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'achievements', 'volunteer', 'publications', 'custom'], hiddenSections: [] },
};
(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const run = async (name, task, seed = true) => {
    if (process.env.CASE_FILTER && !new RegExp(process.env.CASE_FILTER).test(name)) return;
    console.log('RUN', name);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    if (seed) await context.addInitScript(doc => { if (!localStorage.getItem('resume_studio_documents_v1')) localStorage.setItem('resume_studio_documents_v1', JSON.stringify([doc])); }, fixture);
    const page = await context.newPage(); page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(120000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    try { await task(page, context); assert.deepEqual(errors, []); results.push({ name, status: 'passed' }); console.log('PASS', name); }
    catch (error) { results.push({ name, status: 'failed', error: error.message }); console.log('FAIL', name, error.message); await page.screenshot({ path: path.join(output, `failure-${results.length}.png`) }).catch(() => {}); }
    finally { await context.close(); fs.writeFileSync(reportFile, JSON.stringify(results, null, 2)); }
  };
  const go = async (page, route) => { await page.goto(base + route, { waitUntil: 'networkidle' }); await page.locator('main[data-workspace-ready=true]').waitFor(); };
  await run('empty dashboard has truthful counts and real creation action', async page => {
    await go(page, '/dashboard'); await page.getByRole('heading', { name: 'Welcome to your workspace.' }).waitFor();
    assert.equal(await page.locator('.wk-metrics strong').allTextContents().then(items => items.join(',')), '0,0,0,0');
    assert.equal(await page.getByRole('link', { name: 'Create your first resume', exact: true }).getAttribute('href'), '/builder?new=1');
    assert.equal(await page.locator('.home-header').count(), 0);
  }, false);
  await run('dashboard actual completion, tabs, saved preview and follow-up', async page => {
    await go(page, '/dashboard'); await page.getByRole('heading', { name: 'Hi Test!' }).waitFor();
    assert.equal(await page.locator('.wk-score b').textContent(), '80%');
    assert.equal(await page.getByRole('link', { name: 'Highlight your skills', exact: true }).getAttribute('href'), '/builder?id=workspace-fixture');
    await page.getByRole('tab', { name: 'Resume Building' }).focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.getByRole('tab', { name: 'Job Search' }).getAttribute('aria-selected'), 'true');
    await page.getByRole('heading', { name: 'Every opportunity. One clear overview.' }).waitFor();
    await page.keyboard.press('End'); await page.getByRole('heading', { name: 'Small steps. Stronger applications.' }).waitFor();
    await page.getByRole('tab', { name: 'Resume Building' }).click();
    await page.evaluate(() => { localStorage.setItem('resume-studio.jobs.v1', JSON.stringify([{ id: 'job-1', role: 'Engineer', company: 'Example Works', url: '', stage: 'Applied', appliedOn: '2026-10-10', followUpOn: '2020-01-01', notes: '', updatedAt: '2026-10-19' }])); window.dispatchEvent(new Event('career-jobs-change')); });
    await page.getByText('Follow up with Example Works', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, 'dashboard-desktop.png'), fullPage: true });
  });
  await run('documents rename duplicate search download delete survive reload', async page => {
    await go(page, '/documents'); console.log('documents loaded'); await page.getByRole('button', { name: 'Rename Engineering resume', exact: true }).click();
    await page.getByLabel('Document title', { exact: true }).fill('Process engineering CV'); await page.getByRole('button', { name: 'Save title' }).click();
    console.log('document renamed');
    await page.getByRole('button', { name: 'Duplicate Process engineering CV', exact: true }).click();
    await page.getByRole('heading', { name: 'Process engineering CV (copy)', exact: true }).waitFor();
    console.log('document duplicated');
    await page.getByLabel('Search documents').fill('(copy)'); assert.equal(await page.locator('.wk-document-card').count(), 1);
    await page.getByRole('button', { name: 'List view', exact: true }).click(); assert.equal(await page.locator('.wk-document-list .wk-document-card').count(), 1);
    const downloaded = page.waitForEvent('download'); await page.getByRole('button', { name: 'Back up Process engineering CV (copy)', exact: true }).click(); const download = await downloaded;
    console.log('download received'); const file = path.join(output, 'resume-backup.json'); await download.saveAs(file); const backup = JSON.parse(fs.readFileSync(file, 'utf8')); assert.equal(backup.resume.contact.full_name, 'Test Candidate'); assert.notEqual(backup.id, fixture.id);
    page.once('dialog', dialog => dialog.accept()); await page.getByRole('button', { name: 'Delete Process engineering CV (copy)', exact: true }).click();
    console.log('document deleted');
    await page.getByRole('heading', { name: 'No matching documents.', exact: true }).waitFor();
    await page.reload({ waitUntil: 'networkidle' }); await page.getByRole('heading', { name: 'Process engineering CV', exact: true }).waitFor();
    assert.equal(await page.locator('.wk-document-card').count(), 1);
  });
  await run('interview notebook saves immediately, timer and export work', async page => {
    await go(page, '/interview-prep'); await page.getByLabel('Your practice notes').fill('A real project example with my role and actions.');
    await page.getByRole('button', { name: /Rehearse/ }).click(); await page.waitForTimeout(1100); await page.getByRole('button', { name: /Pause/ }).click();
    assert.match(await page.getByRole('button', { name: /Rehearse/ }).textContent(), /0:01|0:02/);
    await page.getByRole('button', { name: 'Next question' }).click(); assert.equal(await page.getByLabel('Your practice notes').inputValue(), '');
    await page.reload({ waitUntil: 'networkidle' }); assert.equal(await page.getByLabel('Your practice notes').inputValue(), 'A real project example with my role and actions.');
    const downloaded = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download answers' }).click(); const file = await (await downloaded).path(); assert.match(fs.readFileSync(file, 'utf8'), /A real project example/);
  });
  await run('mobile navigation traps focus, closes and has no page overflow', async page => {
    await page.setViewportSize({ width: 390, height: 844 }); await go(page, '/dashboard');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: 'Open workspace menu' }).click(); const drawer = page.getByRole('dialog', { name: 'Career workspace navigation' }); await drawer.waitFor();
    await drawer.getByRole('link', { name: 'Back to website', exact: true }).focus(); await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'CareerForge home');
    await page.keyboard.press('Escape'); assert.equal(await page.getByRole('button', { name: 'Open workspace menu' }).evaluate(node => node === document.activeElement), true);
    await page.getByRole('button', { name: 'Open workspace menu' }).click(); await page.getByRole('navigation', { name: 'Workspace', exact: true }).getByRole('link', { name: 'Documents', exact: true }).click();
    await page.getByRole('heading', { name: 'Your documents', exact: true }).waitFor(); assert.equal(await page.getByRole('dialog').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(output, 'documents-mobile.png'), fullPage: true });
  });
  await run('interview notes preserve other tabs, unsaved drafts and invalid storage', async (page, context) => {
    await go(page, '/interview-prep'); const other = await context.newPage(); await go(other, '/interview-prep');
    await page.getByLabel('Your practice notes').fill('First tab introduction');
    await other.getByRole('button', { name: /2\. Why do you want this role/ }).click();
    await other.getByLabel('Your practice notes').fill('Second tab motivation');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('careerforge.interview-practice.v1'))), { 0: 'First tab introduction', 1: 'Second tab motivation' });
    await page.reload({ waitUntil: 'networkidle' }); assert.equal(await page.getByLabel('Your practice notes').inputValue(), 'First tab introduction');
    await page.evaluate(() => { window.originalPracticeSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'careerforge.interview-practice.v1') throw new DOMException('Quota', 'QuotaExceededError'); return window.originalPracticeSet.call(this, key, value); }; });
    await page.getByLabel('Your practice notes').fill('Unsaved introduction');
    await page.getByRole('button', { name: 'Next question' }).click(); await page.getByLabel('Your practice notes').fill('Unsaved motivation');
    await page.evaluate(() => { Storage.prototype.setItem = window.originalPracticeSet; });
    await page.getByLabel('Your practice notes').fill('Recovered motivation');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('careerforge.interview-practice.v1'))), { 0: 'Unsaved introduction', 1: 'Recovered motivation' });
    await other.evaluate(() => localStorage.setItem('careerforge.interview-practice.v1', '{broken'));
    await page.locator('main').getByRole('alert').waitFor(); await page.getByLabel('Your practice notes').fill('Keep this only in the current draft');
    assert.equal(await page.evaluate(() => localStorage.getItem('careerforge.interview-practice.v1')), '{broken');
    await other.close();
  });
  await run('corrupt data is preserved; public routes keep normal navigation', async page => {
    await go(page, '/dashboard'); await page.evaluate(() => localStorage.setItem('resume_studio_documents_v1', '{broken'));
    await page.reload({ waitUntil: 'networkidle' }); await page.locator('main').getByRole('alert').waitFor(); assert.equal(await page.evaluate(() => localStorage.getItem('resume_studio_documents_v1')), '{broken');
    await page.goto(base + '/', { waitUntil: 'networkidle' }); await page.locator('.home-header').waitFor(); assert.equal(await page.locator('.wk-shell').count(), 0);
    await page.goto(base + '/builder?new=1', { waitUntil: 'networkidle' }); await page.locator('.home-header').waitFor();
  });
  await browser.close();
  if (results.some(result => result.status !== 'passed')) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
