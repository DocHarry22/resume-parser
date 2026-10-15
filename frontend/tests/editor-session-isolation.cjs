// Regression: changing local documents must never reuse another document's server ID.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, browserChannel, baseUrl } = require('../../scripts/playwright-runtime.cjs');

async function main() {
  const output = path.resolve(__dirname, '../../docs/qa');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  const checks = [];
  try {
    await page.goto(`${baseUrl}/builder?new=1`, { waitUntil: 'networkidle' });
    const input = page.getByLabel('Import resume', { exact: true });
    const originalFile = Buffer.from('QA Original Applicant A\noriginal.a@example.test\n\nProfessional Summary\nOriginal applicant A summary that must remain unchanged.\n\nSkills\nPython, Testing\n');
    const importedResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/builder/import' && response.request().method() === 'POST');
    await input.setInputFiles({ name: 'original-a.txt', mimeType: 'text/plain', buffer: originalFile });
    const imported = await (await importedResponse).json();
    assert.ok(imported.resume?.id);
    const originalId = imported.resume.id;
    await page.getByText('Resume imported into a new document.', { exact: false }).waitFor();
    assert.equal(await page.getByLabel(/^Email/).inputValue(), 'original.a@example.test');
    const originalBefore = (await (await context.request.get(`${baseUrl}/api/builder/${originalId}`)).json()).resume;

    const restored = { resume: { title: 'Restored applicant B', contact: { full_name: 'QA Restored Applicant B', email: 'restored.b@example.test' }, summary: { summary: 'A different applicant and an independently restored backup.' } } };
    await input.setInputFiles({ name: 'restored-b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(restored)) });
    await page.getByLabel(/^Email/).waitFor();
    await page.waitForFunction(() => document.querySelector('input[type="email"]')?.value === 'restored.b@example.test');

    // Delay creation enough to assert document switching cannot race the server response.
    await page.route('**/api/builder/create', async route => { await new Promise(resolve => setTimeout(resolve, 250)); await route.continue(); });
    async function saveAsNew() {
      const createdResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/builder/create' && response.request().method() === 'POST', { timeout: 15000 });
      await page.getByRole('button', { name: 'Save session copy', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: 'Duplicate', exact: true }).isDisabled(), true);
      const saved = await (await createdResponse).json();
      assert.ok(saved.resume?.id);
      await page.getByText('Saved to this browser and your current server session.', { exact: false }).waitFor();
      await page.waitForFunction(() => !Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Save session copy')?.disabled);
      return saved.resume.id;
    }

    const restoredId = await saveAsNew();
    assert.notEqual(restoredId, originalId);
    const originalAfter = (await (await context.request.get(`${baseUrl}/api/builder/${originalId}`)).json()).resume;
    assert.deepEqual(originalAfter, originalBefore, 'Restoring B must not overwrite imported A');
    const savedRestored = (await (await context.request.get(`${baseUrl}/api/builder/${restoredId}`)).json()).resume;
    assert.equal(savedRestored.contact.email, 'restored.b@example.test');
    checks.push('TXT A → JSON B → session save creates separate B and leaves A byte-for-byte unchanged');
    checks.push('Duplicate is disabled while a server save is in flight');

    await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
    const duplicateId = await saveAsNew();
    assert.notEqual(duplicateId, restoredId);
    const duplicate = (await (await context.request.get(`${baseUrl}/api/builder/${duplicateId}`)).json()).resume;
    assert.match(duplicate.title, /\(copy\)$/);
    assert.equal(duplicate.contact.email, 'restored.b@example.test');
    checks.push('Duplicate resets the server pointer and saves to its own server document');

    await page.getByRole('button', { name: 'Design & sections', exact: true }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete this resume from browser', exact: true }).click();
    await page.getByRole('button', { name: 'Content', exact: true }).click();
    await page.getByLabel(/^Full Name/).fill('QA New Applicant D');
    await page.getByLabel(/^Email/).fill('new.d@example.test');
    const newId = await saveAsNew();
    assert.notEqual(newId, duplicateId);
    assert.equal((await (await context.request.get(`${baseUrl}/api/builder/${duplicateId}`)).json()).resume.contact.email, 'restored.b@example.test');
    checks.push('Delete/new resets the pointer without overwriting the deleted local copy’s server document');

    await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"unrelated":"data"}') });
    await page.getByRole('alert').filter({ hasText: 'recognised resume' }).waitFor();
    const updatedResponse = page.waitForResponse(response => new URL(response.url()).pathname === `/api/builder/${newId}` && response.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save session copy', exact: true }).click();
    assert.equal((await updatedResponse).status(), 200);
    checks.push('Failed restore retains the active document and its correct server pointer');

    await page.evaluate(() => {
      localStorage.setItem('resume_duplicate', JSON.stringify({ title: 'Legacy QA duplicate', contact: { full_name: 'Legacy QA Applicant', email: 'legacy.qa@example.test' } }));
      localStorage.setItem('unrelated-user-preference', 'retained');
    });
    await page.goto(`${baseUrl}/privacy`, { waitUntil: 'networkidle' });
    const privacyDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download browser data', exact: true }).click();
    const backupPath = path.join(output, 'editor-privacy-legacy-backup.json');
    await (await privacyDownload).saveAs(backupPath);
    const privacyBackup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    assert.equal(privacyBackup.resume_duplicate.contact.email, 'legacy.qa@example.test');
    assert.equal(Object.hasOwn(privacyBackup, 'unrelated-user-preference'), false);
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete browser data', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'CareerForge data removed' }).waitFor();
    const afterPrivacyDelete = await page.evaluate(() => ({ legacy: localStorage.getItem('resume_duplicate'), current: localStorage.getItem('resume_studio_documents_v1'), unrelated: localStorage.getItem('unrelated-user-preference') }));
    assert.equal(afterPrivacyDelete.legacy, null);
    assert.equal(afterPrivacyDelete.current, null);
    assert.equal(afterPrivacyDelete.unrelated, 'retained');
    checks.push('Privacy UI exports and deletes legacy duplicate data while preserving unrelated browser preferences');
    assert.deepEqual(runtimeErrors, []);
    fs.writeFileSync(path.join(output, 'editor-session-isolation-results.json'), JSON.stringify({ passed: true, checks, runtimeErrors }, null, 2));
    console.log(checks.map(check => `PASS ${check}`).join('\n'));
  } catch (error) {
    fs.writeFileSync(path.join(output, 'editor-session-isolation-results.json'), JSON.stringify({ passed: false, checks, runtimeErrors, error: error.stack }, null, 2));
    await page.screenshot({ path: path.join(output, 'editor-session-isolation-failure.png'), fullPage: true }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
