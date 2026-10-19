const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
const runtime = process.env.QA_RUNTIME || path.resolve(__dirname, '../../.runtime/playwright-temp');
fs.mkdirSync(runtime, { recursive: true });
process.env.TEMP = process.env.TMP = runtime;
const { chromium, browserChannel } = require('../../scripts/playwright-runtime.cjs');
const base = process.env.BASE_URL || 'http://127.0.0.1:3100';
const output = process.env.QA_OUTPUT || path.resolve(__dirname, '../../docs/qa/template-designs');
fs.mkdirSync(output, { recursive: true });
function load(name) {
  const source = fs.readFileSync(path.join(__dirname, '../components/resumeio', name + '.ts'), 'utf8');
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports, require: id => load(id.replace('./', '')), crypto: webcrypto, structuredClone });
  return exports;
}
const { RESUME_TEMPLATES } = load('templateCatalog');
const { templateSample } = load('templateSample');
const { createDocument } = load('resumeDocument');
const report = { baseUrl: base, checks: [], pageErrors: [], passed: false };
let browser;
(async () => {
  browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(30000); page.setDefaultNavigationTimeout(120000);
  page.on('pageerror', error => report.pageErrors.push(error.message));
  const go = route => page.goto(base + route, { waitUntil: 'networkidle' });
  const check = text => { report.checks.push(text); console.log('PASS', text); };
  if (process.env.PRINT_ONLY) {
    await go('/builder?new=1');
    await page.getByLabel('Resume title', { exact: true }).waitFor();
    const cases = [...RESUME_TEMPLATES.map(template => [template.id, false]), ...['modern','professional','executive'].map(id => [id, true])];
    for (const [id, long] of cases) {
      if (process.env.CASE_FILTER && !new RegExp(process.env.CASE_FILTER).test(id + (long ? '-long' : ''))) continue;
      const document = createDocument(); document.id = 'print-qa-' + id + (long ? '-long' : ''); document.template = id; document.resume = structuredClone(templateSample);
      if (long) document.resume.custom_sections = { Evidence: Array.from({ length: 55 }, (_, index) => `Evidence ${index+1}: Delivered reliable systems and documented project outcomes for the team.`).join('\n') + '\nFINAL TEMPLATE CONTENT SENTINEL' };
      await page.evaluate(document => localStorage.setItem('resume_studio_documents_v1', JSON.stringify([document])), document);
      await go('/builder?id=' + document.id);
      await page.getByLabel('Resume title', { exact: true }).waitFor();
      if (long) await page.getByText('FINAL TEMPLATE CONTENT SENTINEL', { exact: false }).waitFor();
      await page.emulateMedia({ media: 'print' });
      await page.pdf({ path: path.join(output, id + (long ? '-long' : '') + '.pdf'), preferCSSPageSize: true, printBackground: true });
      await page.emulateMedia({ media: 'screen' });
      check(id + (long ? ' long' : '') + ' print rendered');
    }
    assert.deepEqual(report.pageErrors, []); report.passed = true; return;
  }
  if (!process.env.LETTERS_ONLY) {
  await go('/templates'); await page.locator('[data-gallery-ready=true]').waitFor();
  for (const [category, count] of [['All',8],['Modern',2],['Professional',2],['Classic',2],['Minimal',1],['Creative',1]]) {
    await page.getByRole('button', { name: category, exact: true }).click();
    await page.waitForFunction(count => document.querySelectorAll('.template-card').length === count, count);
  }
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.screenshot({ path: path.join(output, 'gallery-desktop.png'), fullPage: true });
  await page.getByRole('link', { name: 'Use Technical template', exact: true }).click();
  await page.getByLabel('Resume title', { exact: true }).waitFor();
  await page.locator('.resume-document[data-template=technical]').waitFor();
  assert.equal(await page.locator('.resume-document').evaluate(element => element.style.getPropertyValue('--resume-accent')), '#0d9488');
  check('All eight gallery designs and category filters work; card navigation carries the displayed color');

  const document = createDocument(); document.id = 'template-design-qa'; document.resume = templateSample;
  const expected = ['Alex Morgan','Example Studio','Example University','Project planning','English','Project Management Fundamentals'];
  for (const template of RESUME_TEMPLATES) {
    document.id = 'template-design-qa-' + template.id;
    document.template = template.id; document.colorTheme = template.color;
    await page.evaluate(document => localStorage.setItem('resume_studio_documents_v1', JSON.stringify([document])), document);
    await go('/builder?id=' + document.id + '&template=' + template.id + '&color=' + template.color);
    const preview = page.locator('.resume-document');
    assert.equal(await preview.getAttribute('data-template'), template.id);
    for (const text of expected) assert.ok((await preview.textContent()).toLowerCase().includes(text.toLowerCase()), template.id + ': missing ' + text);
    assert.equal(await preview.locator('[data-section]').count(), 6, template.id + ': section duplicated or omitted');
    await preview.screenshot({ path: path.join(output, template.id + '.png') });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await preview.getAttribute('data-template'), template.id);
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: path.join(output, template.id + '.pdf'), preferCSSPageSize: true, printBackground: true });
    await page.emulateMedia({ media: 'screen' });
    check(template.name + ' preserves all content, saves/reloads and prints');
  }
  await page.getByRole('button', { name: 'Technical template', exact: true }).click();
  const selector = page.getByRole('dialog', { name: 'Choose resume template' });
  assert.equal(await selector.locator('.resume-document').count(), 8);
  assert.equal(await page.locator('.print-content').count(), 1, 'Thumbnails must not join the printed document');
  await selector.getByRole('button', { name: /^Classic / }).click();
  await selector.getByRole('button', { name: 'Red', exact: true }).click();
  await selector.getByRole('button', { name: 'Apply Changes', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.print-content .resume-document')?.dataset.template === 'classic');
  assert.match(await page.locator('.print-content .resume-document').evaluate(element => getComputedStyle(element).fontFamily), /Georgia/);
  assert.equal(await page.locator('.print-content .resume-identity h1').evaluate(element => getComputedStyle(element).color), 'rgb(220, 38, 38)');
  await page.getByRole('button', { name: 'Design & sections', exact: true }).click();
  for (const [font, family] of [['sans','Arial'],['mono','Courier'],['template','Georgia']]) {
    await page.getByLabel('Font', { exact: true }).selectOption(font);
    await page.waitForFunction(family => getComputedStyle(document.querySelector('.print-content .resume-document')).fontFamily.includes(family), family);
  }
  await page.getByLabel('Show Skills', { exact: true }).uncheck();
  await page.locator('.print-content [data-section=skills]').waitFor({ state: 'detached' });
  await page.getByLabel('Show Skills', { exact: true }).check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  check('The selector uses eight real previews; font overrides and section visibility work without printing thumbnails');
  for (const id of ['modern','professional','executive']) {
    document.id = 'template-long-qa-' + id;
    document.template = id; document.resume = structuredClone(templateSample);
    document.resume.custom_sections = { Evidence: Array.from({ length: 55 }, (_, i) => `Evidence ${i+1}: Delivered reliable systems and documented project outcomes for the team.`).join('\n') + '\nFINAL TEMPLATE CONTENT SENTINEL' };
    await page.evaluate(document => localStorage.setItem('resume_studio_documents_v1', JSON.stringify([document])), document);
    await go('/builder?id=' + document.id + '&template=' + id);
    await page.getByLabel('Resume title', { exact: true }).waitFor();
    await page.getByText('FINAL TEMPLATE CONTENT SENTINEL', { exact: false }).waitFor();
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: path.join(output, id + '-long.pdf'), preferCSSPageSize: true, printBackground: true });
    await page.emulateMedia({ media: 'screen' });
  }
  check('Long documents print in sidebar, timeline and executive formats');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: path.join(output, 'builder-mobile.png'), fullPage: true });
  await go('/templates'); await page.locator('[data-gallery-ready=true]').waitFor(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: path.join(output, 'gallery-mobile.png'), fullPage: true });
  check('Gallery and scaled builder preview fit a mobile viewport');
  }

  await page.setViewportSize({ width: 1440, height: 1050 });
  await go('/cover-letter'); await page.locator('main[data-letter-ready=true]').waitFor();
  await page.getByRole('button', { name: 'Create cover letter', exact: true }).click();
  await page.getByRole('button', { name: 'Your Information', exact: true }).click();
  await page.getByLabel('full name', { exact: true }).fill('Alex Morgan');
  await page.getByLabel('email', { exact: true }).fill('alex.morgan@example.test');
  await page.getByRole('button', { name: 'Choose Template', exact: true }).click();
  for (const [id, name] of [['professional','Professional'],['modern','Modern'],['minimal','Minimal'],['creative','Creative'],['executive','Executive'],['tech','Tech']]) {
    await page.getByRole('button', { name: 'Choose Template', exact: true }).click();
    await page.getByRole('button', { name: new RegExp('^'+name+' ') }).click();
    await page.getByRole('button', { name: 'Your Information', exact: true }).click();
    const letter = page.locator('[data-live-letter-preview="'+id+'"]');
    assert.ok((await letter.textContent()).toLowerCase().includes('alex morgan'));
    assert.ok((await letter.innerText()).includes('alex.morgan@example.test'));
    await letter.evaluate(element => { element.parentElement.style.maxHeight = 'none'; element.parentElement.style.overflow = 'visible'; });
    await letter.screenshot({ path: path.join(output, 'letter-'+id+'.png') });
  }
  await page.getByRole('button', { name: 'Choose Template', exact: true }).click();
  await page.screenshot({ path: path.join(output, 'letter-templates.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  check('All six cover letter thumbnails and real letterheads retain sender details on desktop and mobile');
  assert.deepEqual(report.pageErrors, []);
  report.passed = true;
})().catch(error => { report.error = error.stack; console.error(error); process.exitCode = 1; }).finally(async () => {
  report.completedAt = new Date().toISOString();
  fs.writeFileSync(path.join(output, process.env.QA_REPORT || 'results.json'), JSON.stringify(report, null, 2));
  if (browser) await browser.close();
});
