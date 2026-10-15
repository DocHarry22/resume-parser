// Real scanner contract regression against the disposable local CI backend.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { chromium, browserChannel, baseUrl } = require('../../scripts/playwright-runtime.cjs');
const output = path.resolve(__dirname, '../../docs/qa/scanner');
const report = { baseUrl, checks: [], pageErrors: [] };
let browser;
(async () => {
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseUrl).hostname), 'This test must use a local disposable frontend/backend.');
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const sheet = pdf.addPage([595, 842]);
  sheet.drawText('Scanner Regression Candidate', { x: 50, y: 780, size: 16, font });
  sheet.drawText('scanner-regression@example.test', { x: 50, y: 750, size: 11, font });
  // Deliberately no experience, skills or education: BASIC must not require
  // analyses that the scoring service only returns in ATS/EXPERT modes.
  const buffer = Buffer.from(await pdf.save());
  browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => report.pageErrors.push(error.message));
  await page.goto(baseUrl + '/resume-scanner/', { waitUntil: 'networkidle', timeout: 120000 });
  await page.locator('#scanner-upload input[type=file]').setInputFiles({ name: 'scanner-sparse.pdf', mimeType: 'application/pdf', buffer });
  const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/parse-and-score', { timeout: 120000 });
  await page.getByRole('button', { name: 'Scan Resume', exact: true }).click();
  const response = await responsePromise;
  assert.equal(response.status(), 200);
  const result = await response.json();
  assert.equal(result.score.mode, 'basic');
  assert.equal(result.score.experience, null);
  assert.equal(result.score.skills, null);
  assert.equal(result.score.detailed_metrics.experience, undefined);
  assert.equal(result.score.detailed_metrics.skills, undefined);
  assert.equal(result.score.detailed_metrics.length, undefined);
  assert.ok(Number.isFinite(result.score.detailed_metrics.layout.word_count));
  await page.getByRole('button', { name: 'Edit this resume', exact: true }).waitFor();
  await page.getByText('Detailed Metrics', { exact: true }).click();
  const details = page.locator('details').filter({ hasText: 'Detailed Metrics' });
  await details.getByText('Word Count:', { exact: true }).waitFor();
  const measuredValue = async label => details.getByText(label, { exact: true }).evaluate(element => element.nextElementSibling.textContent);
  assert.equal(await measuredValue('Word Count:'), String(result.score.detailed_metrics.layout.word_count));
  assert.equal(await measuredValue('Estimated Pages:'), result.score.detailed_metrics.layout.estimated_pages.toFixed(1));
  assert.equal(await details.getByText('Total Roles:', { exact: true }).count(), 0);
  assert.equal(await details.getByText('Total Skills:', { exact: true }).count(), 0);
  assert.doesNotMatch(await details.innerText(), /NaN|undefined|Optimal/);
  report.checks.push('Real BASIC sparse PDF result renders current layout/structure metrics without omitted analyses');
  fs.mkdirSync(output, { recursive: true });
  await page.screenshot({ path: path.join(output, 'basic-result.png'), fullPage: true });
  await page.getByRole('button', { name: 'Edit this resume', exact: true }).click();
  await page.getByLabel('Resume title', { exact: true }).waitFor();
  assert.equal(await page.getByLabel(/^Full Name/).inputValue(), result.resume.name || '');
  assert.equal(await page.getByLabel(/^Email/).inputValue(), result.resume.contact.email || '');
  report.checks.push('Scanner handoff opens parsed content in the editable browser document');
  assert.deepEqual(report.pageErrors, []);
  report.passed = true;
})().catch(error => {
  report.passed = false; report.error = error.stack; console.error(error); process.exitCode = 1;
}).finally(async () => {
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
  if (browser) await browser.close();
});
