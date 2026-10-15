const path = require('node:path');

function loadPlaywright() {
  if (process.env.PLAYWRIGHT_MODULE) return require(process.env.PLAYWRIGHT_MODULE);
  try {
    // QA entry points live outside frontend, where this project installs Playwright.
    return require(require.resolve('playwright', { paths: [path.resolve(__dirname, '../frontend')] }));
  } catch (localError) {
    try {
      return require('C:/Users/game/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
    } catch {
      throw new Error('Playwright is unavailable. Run npm ci in frontend, then install a browser with npx playwright install chromium. Set PLAYWRIGHT_CHANNEL=chromium to use it.', { cause: localError });
    }
  }
}

module.exports = {
  ...loadPlaywright(),
  browserChannel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
  baseUrl: (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
};
