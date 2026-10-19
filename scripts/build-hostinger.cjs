#!/usr/bin/env node
'use strict';

// Primary static edition. Never build in frontend or invoke the Sites packager.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync, spawn } = require('node:child_process');
const { classify, validatePath, rejectPrivatePath, scanSecrets, parseTree } = require('./package-release.cjs');
const root = fs.realpathSync(path.resolve(__dirname, '..'));
const runtime = path.join(root, '.runtime');
const frontend = path.join(root, 'frontend');
const LIMIT = 50_000_000;
const EXTRA_CONFIG = new Set(['.eslintrc.json', '.eslintrc.cjs', 'eslint.config.js', 'eslint.config.mjs', 'middleware.ts', 'middleware.js']);
const OMIT = new Set(['node_modules', '.git', '.next', '.next-sites', 'out', 'build', 'dist', 'data', 'resumes', 'cover_letters', 'workspaces', 'uploads', 'private', '.openai', '.runtime', 'tests', 'tempss']);
const STATIC_EXTENSIONS = new Set(['.html', '.css', '.js', '.json', '.txt', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.webmanifest', '.xml']);
const TOOL_FILES = new Set(['scripts/build-hostinger.cjs', 'scripts/build-hostinger.test.cjs', 'scripts/package-release.cjs', 'scripts/README.md']);
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 64_000_000, windowsHide: true });
const gitText = args => git(args).toString('utf8').trim();

function apiOrigin(value) {
  // Only the exact native Render origin supplied by the caller. No URL rewriting,
  // credentials, paths, ports, query strings, redirects, or arbitrary hostnames.
  if (typeof value !== 'string' || !/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.onrender\.com\/?$/i.test(value)) throw new Error('Provide an exact HTTPS <service>.onrender.com origin without credentials, port, path, query, or fragment.');
  return new URL(value).origin;
}

function options(argv, env = process.env) {
  let check = false, origin = env.HOSTINGER_API_ORIGIN || null;
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--check') check = true;
    else if (argv[index] === '--api-origin' && argv[index + 1]) origin = argv[++index];
    else throw new Error('Usage: node scripts/build-hostinger.cjs [--check] [--api-origin https://service.onrender.com]');
  }
  return { check, origin: origin ? apiOrigin(origin) : null };
}

function selectSource(filename) {
  if (!filename.startsWith('frontend/')) return null;
  const relative = filename.slice('frontend/'.length), parts = relative.split('/');
  if (parts.some(part => OMIT.has(part.toLowerCase()) || part.toLowerCase().startsWith('.env')) || /\.(pdf|docx?|pem|key|pfx|p12|map)$/i.test(relative)) return null;
  if (EXTRA_CONFIG.has(relative)) { validatePath(relative); rejectPrivatePath(relative); return { destination: relative }; }
  return classify(filename, 'frontend');
}

function childEnvironment(origin, input = process.env) {
  const permitted = /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|USERPROFILE|HOME|HOMEDRIVE|HOMEPATH|APPDATA|LOCALAPPDATA|TEMP|TMP|TMPDIR|PROGRAMFILES|PROGRAMFILES\(X86\)|PROGRAMDATA|SYSTEMDRIVE|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE|TERM|CI|NO_COLOR|FORCE_COLOR)$/i;
  const env = {};
  for (const [key, value] of Object.entries(input)) if (permitted.test(key) && value !== undefined) env[key] = value;
  return { ...env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', STATIC_EXPORT: '1', NEXT_PUBLIC_STORAGE_MODE: 'local', NEXT_PUBLIC_API_BASE_URL: apiOrigin(origin) };
}

function guardOutput(directory) {
  const relative = path.relative(root, path.resolve(directory));
  if (relative !== '.runtime' && !relative.startsWith('.runtime' + path.sep)) throw new Error('Output must remain inside this repository .runtime directory.');
  let current = root;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    let entry;
    try { entry = fs.lstatSync(current); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error('Output parent is not an ordinary directory: ' + current);
  }
}

function inventory(directory) {
  const files = [], seen = new Set(); let total = 0;
  const walk = (folder, prefix = '') => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const name = validatePath(prefix + entry.name), absolute = path.join(folder, entry.name);
      rejectPrivatePath(name);
      if (entry.isSymbolicLink() || fs.lstatSync(absolute).isSymbolicLink()) throw new Error('Static export contains a symlink: ' + name);
      if (entry.isDirectory()) { if (OMIT.has(entry.name.toLowerCase())) throw new Error('Unexpected static directory: ' + name); walk(absolute, name + '/'); continue; }
      if (!entry.isFile() || (name !== '.htaccess' && name !== 'application-helper/careerforge-auto-apply.zip' && !STATIC_EXTENSIONS.has(path.extname(name).toLowerCase()))) throw new Error('Unexpected static export file: ' + name);
      const folded = name.toLowerCase(); if (seen.has(folded)) throw new Error('Case-colliding static path: ' + name); seen.add(folded);
      const content = fs.readFileSync(absolute); total += content.length;
      if (total >= LIMIT) throw new Error('Static export exceeds the 50,000,000-byte limit.');
      if (/\.(?:html|css|js|json|txt|xml|svg)$/i.test(name) || name === '.htaccess') scanSecrets(name, content);
      files.push({ path: name, bytes: content.length, sha256: sha256(content), absolute });
    }
  };
  walk(directory);
  files.sort((a, b) => a.path.localeCompare(b.path));
  for (const required of ['index.html', '.htaccess', 'builder/index.html', 'cover-letter/index.html', 'dashboard/index.html', 'job-tracker/index.html', 'privacy/index.html']) if (!files.some(file => file.path === required)) throw new Error('Missing static export file: ' + required);
  if (!files.some(file => file.path.startsWith('_next/') && file.path.endsWith('.js'))) throw new Error('Missing Next static script assets.');
  return { files, total };
}

async function verifyBackend(origin, request = fetch) {
  origin = apiOrigin(origin);
  const response = await request(origin + '/api/health', { redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('The supplied backend health check failed (' + response.status + ').');
  const body = await response.json();
  if (body.status !== 'healthy' || body.storage_mode !== 'local' || body.server_persistence !== false) throw new Error('The backend must report healthy, storage_mode local and server_persistence false before packaging.');
  return { url: origin + '/api/health', storage_mode: body.storage_mode, server_persistence: body.server_persistence, verifiedAt: new Date().toISOString() };
}

function assertPrimaryEdition(homepage, builder) {
  // The homepage explains storage in its footer; the notice appears on app pages.
  if (!builder.includes('Saved only in this browser on this device.') || [homepage, builder].some(html => html.includes('Browser workspace edition:'))) throw new Error('Export did not render the primary device-only edition.');
}

function runBuild(cli, workdir, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, 'build', workdir], { cwd: workdir, env, stdio: 'inherit', shell: false, windowsHide: true });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error('Isolated Hostinger build failed: ' + (signal || code))));
  });
}

async function main(argv = process.argv.slice(2)) {
  const settings = options(argv), commit = gitText(['rev-parse', '--verify', 'HEAD^{commit}']);
  if (!/^[a-f0-9]{40,64}$/.test(commit) || fs.realpathSync(gitText(['rev-parse', '--show-toplevel'])) !== root) throw new Error('Use this script from its own committed Git repository.');
  const selected = parseTree(git(['ls-tree', '-r', '-z', '--full-tree', commit])).map(entry => ({ ...entry, selected: selectSource(entry.source) })).filter(entry => entry.selected);
  const changed = () => [...git(['diff', '--name-only', '-z', 'HEAD', '--']).toString('utf8').split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).toString('utf8').split('\0')].filter(Boolean).filter(file => TOOL_FILES.has(file) || selectSource(file));
  const assertStable = () => { if (gitText(['rev-parse', 'HEAD']) !== commit || changed().length) throw new Error('Relevant frontend/tooling source must remain clean at the same committed HEAD throughout the build.'); };
  const cli = path.join(frontend, 'node_modules', 'next', 'dist', 'bin', 'next'); fs.accessSync(cli);
  for (const required of ['package.json', 'package-lock.json', 'next.config.js', 'tsconfig.json', 'app/layout.tsx', 'app/page.tsx', 'lib/apiConfig.ts']) if (!selected.some(entry => entry.selected.destination === required)) throw new Error('Missing committed build input: ' + required);
  for (const entry of selected) {
    if (entry.type !== 'blob' || !/^100(?:644|755)$/.test(entry.mode)) throw new Error('Build source must be a regular committed file: ' + entry.source);
    scanSecrets(entry.source, git(['show', `${commit}:${entry.source}`]));
  }
  const destination = path.join(runtime, 'hostinger-release', commit);
  guardOutput(destination);
  if (settings.check) {
    console.log(JSON.stringify({ check: 'passed', commit, sourceFiles: selected.length, relevantSourceClean: changed().length === 0, apiOrigin: settings.origin, apiVerificationRequiredBeforeBuild: true, target: destination, buildRuns: false, networkCalls: false, filesWritten: false, sitesIdentityUsed: false, primaryBuildUntouched: true }, null, 2)); return;
  }
  if (!settings.origin) throw new Error('Supply the native-verified backend origin with --api-origin or HOSTINGER_API_ORIGIN. --check works without one.');
  assertStable();
  if (fs.existsSync(destination)) throw new Error('Release output already exists; no files were overwritten: ' + destination);
  const backend = await verifyBackend(settings.origin);
  guardOutput(runtime); fs.mkdirSync(runtime, { recursive: true });
  const workdir = fs.mkdtempSync(path.join(runtime, 'hostinger-build-')); guardOutput(workdir);
  console.log('Building primary Hostinger edition in isolated copy: ' + workdir);
  try {
    for (const entry of selected) {
      const target = path.join(workdir, entry.selected.destination); fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, git(['show', `${commit}:${entry.source}`]), { flag: 'wx' });
    }
    fs.symlinkSync(path.join(frontend, 'node_modules'), path.join(workdir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    await runBuild(cli, workdir, childEnvironment(settings.origin));
    const exported = path.join(workdir, '.next-sites');
    fs.writeFileSync(path.join(exported, '.htaccess'), 'DirectoryIndex index.html\nOptions -Indexes\nErrorDocument 404 /404.html\n<IfModule mod_headers.c>\n  Header always set X-Content-Type-Options "nosniff"\n  Header always set Referrer-Policy "strict-origin-when-cross-origin"\n  Header always set X-Frame-Options "SAMEORIGIN"\n</IfModule>\n', { flag: 'wx' });
    const listing = inventory(exported);
    const homepage = fs.readFileSync(path.join(exported, 'index.html'), 'utf8');
    assertPrimaryEdition(homepage, fs.readFileSync(path.join(exported, 'builder', 'index.html'), 'utf8'));
    if (!listing.files.some(file => file.path.endsWith('.js') && fs.readFileSync(file.absolute, 'utf8').includes(settings.origin))) throw new Error('Expected exact backend origin is missing from the compiled browser scripts.');
    const JSZip = require(require.resolve('jszip', { paths: [frontend] })), zip = new JSZip();
    const timestamp = Math.max(Number(gitText(['show', '-s', '--format=%ct', commit])) * 1000, Date.UTC(1980, 0, 1));
    for (const file of listing.files) zip.file(file.path, fs.readFileSync(file.absolute), { createFolders: false, date: new Date(timestamp) });
    const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
    if (archive.length >= LIMIT) throw new Error('Deployment ZIP exceeds the 50,000,000-byte limit.');
    assertStable(); guardOutput(destination); fs.mkdirSync(destination, { recursive: true });
    fs.cpSync(exported, path.join(destination, 'dist'), { recursive: true, dereference: false });
    const filename = `careerforge-hostinger-static-${commit.slice(0, 12)}.zip`, digest = sha256(archive);
    const manifest = { schemaVersion: 1, commit, generatedAt: new Date().toISOString(), edition: 'primary-browser-local', apiOrigin: settings.origin, backend, buildEnvironment: { STATIC_EXPORT: '1', NEXT_PUBLIC_STORAGE_MODE: 'local', NEXT_PUBLIC_SITE_MODE: null }, sourceFiles: selected.map(entry => ({ path: entry.source, gitBlob: entry.blob })), artifact: { filename, bytes: archive.length, uncompressedBytes: listing.total, sha256: digest, fileCount: listing.files.length }, files: listing.files.map(({ absolute, ...file }) => file), primaryBuildUntouched: true, sitesIdentityUsed: false };
    fs.writeFileSync(path.join(destination, filename), archive, { flag: 'wx' });
    const manifestContent = JSON.stringify(manifest, null, 2) + '\n', manifestSha256 = sha256(manifestContent);
    fs.writeFileSync(path.join(destination, 'manifest.json'), manifestContent, { flag: 'wx' });
    fs.writeFileSync(path.join(destination, 'SHA256SUMS.txt'), `${digest}  ${filename}\n${manifestSha256}  manifest.json\n`, { flag: 'wx' });
    console.log(JSON.stringify({ status: 'prepared', commit, destination, ...manifest.artifact, manifestSha256, backend }, null, 2));
  } finally { console.log('Isolated build retained for inspection: ' + workdir); }
}

if (require.main === module) main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
module.exports = { apiOrigin, options, selectSource, childEnvironment, inventory, verifyBackend, assertPrimaryEdition };
