const { clickResumeAction } = require("../../scripts/playwright-runtime.cjs");
// Run against the local frontend and backend: node tests/editor-e2e.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require('C:/Users/game/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }

async function main() {
  const output = path.resolve(__dirname, '../../docs/qa');
  fs.mkdirSync(output, { recursive: true });
  const browser = await playwright.chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  const consoleErrors = [];
  const failedRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') consoleErrors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) failedRequests.push({ url: response.url(), status: response.status() }); });
  const report = [];
  try {
    await page.goto(process.env.EDITOR_URL || 'http://127.0.0.1:3000/builder?new=1', { waitUntil: 'networkidle', timeout: 120000 });
    const title = page.getByRole('textbox', { name: 'Resume title', exact: true });
    await title.waitFor({ timeout: 60000 });
    assert.equal(await page.getByLabel(/^Full Name/).inputValue(), '');
    assert.equal(await page.locator('.resume-document').innerText().then(text => text.includes('Alexandra')), false);
    await title.fill('QA resume');
    await page.waitForTimeout(850);
    await title.fill('Tailored QA resume');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    assert.equal(await title.inputValue(), 'QA resume');
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    assert.equal(await title.inputValue(), 'Tailored QA resume');
    report.push('Blank initial document, editable title, undo and redo passed');

    await page.getByLabel(/^Full Name/).fill('QA Candidate');
    await page.getByLabel(/^Email/).fill('qa@example.test');
    await page.getByLabel('Phone', { exact: true }).fill('+27 21 555 0123');
    await page.getByLabel('Editing section').selectOption('summary');
    await page.getByLabel(/^Professional Summary/).fill('QA engineer with experience building reliable services, accessible interfaces, and clear documentation. Led practical improvements to release quality and helped teams ship dependable software.');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.getByLabel(/^Full Name/).inputValue(), 'QA Candidate');
    assert.match(await page.locator('.resume-document').innerText(), /QA engineer with experience/);
    report.push('Contact and summary update live and survive a reload');

    await page.getByRole('button', { name: 'Modern template', exact: true }).click();
    await page.getByRole('dialog', { name: 'Choose resume template' }).getByRole('button', { name: /^Elegant / }).click();
    await page.getByRole('button', { name: 'Apply Changes', exact: true }).click();
    assert.equal(await page.locator('.resume-document').getAttribute('data-template'), 'elegant');
    assert.match(await page.locator('.resume-document').innerText(), /QA Candidate/);
    await page.screenshot({ path: path.join(output, 'editor-desktop.png'), fullPage: true });
    report.push('Template changes preserve content');

    await page.getByRole('button', { name: 'Design & sections', exact: true }).click();
    await page.getByLabel('Text size', { exact: true }).fill('14');
    await page.getByLabel(/^Paper/).selectOption('Letter');
    await page.getByRole('button', { name: 'Content', exact: true }).click();
    await page.getByLabel('Editing section').selectOption('custom');
    await page.getByRole('button', { name: '+ Licences', exact: true }).click();
    await page.getByLabel('Licences', { exact: true }).fill('Valid professional licence');
    assert.match(await page.locator('.resume-document').innerText(), /Valid professional licence/);
    const originalId = new URL(page.url()).searchParams.get('id');
    await clickResumeAction(page, "Duplicate");
    assert.notEqual(new URL(page.url()).searchParams.get('id'), originalId);
    assert.match(await title.inputValue(), /\(copy\)$/);
    report.push('Typography, paper selection, optional sections and independent duplication passed');

    for (const [width, height, label] of [[390, 844, 'mobile'], [768, 1024, 'tablet']]) {
      await page.setViewportSize({ width, height });
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
      assert.ok(dimensions.scroll <= dimensions.width + 1, `${label} editor overflows: ${JSON.stringify(dimensions)}`);
      await page.getByRole('button', { name: 'Preview', exact: true }).click();
      const previewDimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
      assert.ok(previewDimensions.scroll <= previewDimensions.width + 1, `${label} preview overflows`);
      await page.screenshot({ path: path.join(output, `editor-${label}.png`), fullPage: true });
    }
    report.push('Mobile and tablet edit/preview controls fit the viewport');
    await page.setViewportSize({ width: 1440, height: 1050 });

    for (const [name, filename] of [['Download PDF', 'editor-export.pdf'], ['DOCX', 'editor-export.docx'], ['TXT', 'editor-export.txt'], ['JSON backup', 'editor-backup.json']]) {
      const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
      await clickResumeAction(page, name);
      const download = await downloadPromise;
      await download.saveAs(path.join(output, filename));
      assert.ok(fs.statSync(path.join(output, filename)).size > 50, `${filename} is empty`);
    }
    assert.match(fs.readFileSync(path.join(output, 'editor-export.txt'), 'utf8'), /QA Candidate/i);
    assert.match(fs.readFileSync(path.join(output, 'editor-export.txt'), 'utf8'), /Valid professional licence/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(output, 'editor-backup.json'), 'utf8')).design.pageSize, 'Letter');
    report.push('PDF, editable DOCX, TXT and complete JSON backup download');

    await page.getByLabel('Licences', { exact: true }).fill(`Valid professional licence\n${Array.from({ length: 70 }, (_, index) => `Evidence paragraph ${index + 1}: Built reliable services, documented decisions, tested accessibility and helped teams deliver dependable software.`).join('\n')}\nFINAL MULTIPAGE CONTENT SENTINEL`);
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: path.join(output, 'editor-print-design.pdf'), preferCSSPageSize: true, printBackground: true });
    await page.emulateMedia({ media: 'screen' });
    report.push('Selected preview design generates a multipage print PDF without a one-page crop');

    const fixture = 'QA Import Candidate\nqa.import@example.test\n+27 21 555 0199\n\nProfessional Summary\nExperienced engineer building reliable software and accessible interfaces.\n\nWork Experience\nSoftware Engineer\nQuality Company\n2020 - Present\n- Built reliable services for teams\n- Improved delivery and documentation\n\nEducation\nBachelor of Science\nQuality University\n2019\n\nSkills\nPython, JavaScript, TypeScript\n';
    await page.getByLabel('Import resume', { exact: true }).setInputFiles({ name: 'qa-import-resume.txt', mimeType: 'text/plain', buffer: Buffer.from(fixture) });
    await page.getByText('Resume imported into a new document.', { exact: false }).waitFor({ timeout: 60000 });
    assert.match(await page.getByLabel(/^Email/).inputValue(), /qa.import@example.test/);
    assert.match(await page.locator('.resume-document').innerText(), /reliable software|reliable services/);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.match(await page.getByLabel(/^Email/).inputValue(), /qa.import@example.test/);
    report.push('TXT import populates editable fields, preserves the earlier document and restores after reload');
    assert.deepEqual(errors, [], 'Browser runtime errors');
    fs.writeFileSync(path.join(output, 'editor-e2e-results.json'), JSON.stringify({ passed: true, checks: report, runtimeErrors: errors, consoleErrors, failedRequests }, null, 2));
    console.log(report.map(line => `PASS ${line}`).join('\n'));
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'editor-failure.png'), fullPage: true }).catch(() => {});
    fs.writeFileSync(path.join(output, 'editor-e2e-results.json'), JSON.stringify({ passed: false, checks: report, runtimeErrors: errors, consoleErrors, failedRequests, error: error.stack }, null, 2));
    throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
