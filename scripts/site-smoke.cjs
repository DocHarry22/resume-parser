const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, browserChannel, baseUrl } = require('./playwright-runtime.cjs');
(async () => {
  const dir = path.resolve(process.env.QA_OUTPUT || 'docs/qa');
  await fs.mkdir(dir, { recursive: true });
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const results = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    for (const [name, width, height] of [['desktop',1440,1000], ['tablet',820,1180], ['mobile',390,844]]) {
      await page.setViewportSize({ width, height });
      for (const [route, label] of [['/','home'], ['/tools?view=templates','templates'], ['/privacy','privacy'], ['/resources/guides','guide']]) {
        const response = await page.goto(baseUrl + route, { waitUntil: 'networkidle', timeout: 90000 });
        assert.equal(response.status(), 200);
        await page.getByRole('main').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, label + ' overflow ' + name);
        await page.screenshot({ path: path.join(dir, label + '-' + name + '.png'), fullPage: true });
        results.push({ route, viewport: name, status: 'PASS' });
      }
    }
    await page.goto(baseUrl + '/tools?view=templates', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Professional', exact: true }).click();
    const professional = page.getByRole('link', { name: 'Use Professional template', exact: true });
    assert.equal(await professional.count(), 1);
    const destination = new URL(await professional.getAttribute('href'), baseUrl);
    assert.ok(['/builder', '/builder/'].includes(destination.pathname));
    assert.equal(destination.searchParams.get('template'), 'professional');
    assert.ok(destination.searchParams.get('color'));
    assert.equal(await page.locator('.template-card').count(), 2);
    results.push({ check: 'template category filter and selected template/color destination', status: 'PASS' });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify(results));
  } catch (error) {
    results.push({ status: 'FAIL', message: error.message });
    await page.screenshot({ path: path.join(dir, 'site-smoke-failure.png'), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await fs.writeFile(path.join(dir, 'site-smoke-results.json'), JSON.stringify({ results, errors }, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
