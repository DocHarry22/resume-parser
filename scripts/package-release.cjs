#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const FRONTEND_LIMIT = 50_000_000;
const BACKEND_LIMIT = 50_000_000;
const FRONTEND_ROOT_FILES = new Set([
  'package.json', 'package-lock.json', 'next.config.js', 'next.config.mjs', 'next.config.ts',
  'next-env.d.ts', 'tsconfig.json', 'tailwind.config.ts', 'tailwind.config.js',
  'postcss.config.js', 'postcss.config.mjs',
]);
const FRONTEND_DIRS = new Set(['app', 'components', 'lib', 'store', 'types', 'public']);
const FRONTEND_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts', '.json', '.css', '.scss',
  '.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.txt',
  '.woff', '.woff2', '.ttf', '.otf',
]);
const BACKEND_ROOT_FILES = new Set(['Dockerfile', 'requirements.txt', 'docker-compose.yml', '.dockerignore', '.env.example']);
const TAXONOMIES = new Set(['data/section_headings.json', 'data/skills_taxonomy.json']);
const TOOL_SOURCES = new Set(['scripts/package-release.cjs', 'scripts/package-release.test.cjs', 'docs/RELEASE_PACKAGING.md']);
const OMIT_DIRS = new Set(['node_modules', '.next', '.next-sites', 'out', 'build', 'dist', '__pycache__', '.pytest_cache', '.runtime']);
const PRIVATE_DIRS = new Set(['.git', '.aws', '.ssh', '.codex', '.agents', 'uploads', 'private', 'workspaces']);
const PRIVATE_NAMES = /^(?:credentials(?:\..+)?|service[-_]account(?:\..+)?|id_(?:rsa|dsa|ecdsa|ed25519)(?:\..+)?|\.npmrc|\.netrc|\.workspace-key)$/i;
const PRIVATE_EXTENSIONS = /\.(?:pem|key|p12|pfx|kdbx|sqlite3?|db|bak)$/i;
const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

function validatePath(filename) {
  if (!filename || filename.includes('\\') || filename.startsWith('/') || /^[A-Za-z]:/.test(filename) || /[\x00-\x1f\x7f:]/.test(filename)) throw new Error(`Unsafe archive path: ${JSON.stringify(filename)}`);
  const parts = filename.split('/');
  if (parts.some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part) || /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i.test(part))) throw new Error(`Nonportable archive path: ${JSON.stringify(filename)}`);
  return filename;
}

function rejectPrivatePath(filename) {
  const parts = filename.split('/');
  if (parts.some(part => PRIVATE_DIRS.has(part.toLowerCase())) || PRIVATE_NAMES.test(parts.at(-1)) || PRIVATE_EXTENSIONS.test(filename) || parts.some(part => /^\.env(?:\..*)?$/i.test(part) && part !== '.env.example')) throw new Error(`Private or secret file is not releasable: ${filename}`);
}

function classify(filename, target) {
  if (filename === 'LICENSE') return { destination: 'LICENSE' };
  if (target === 'frontend') {
    if (!filename.startsWith('frontend/')) return null;
    const relative = filename.slice('frontend/'.length);
    const parts = relative.split('/');
    if (parts.some(part => OMIT_DIRS.has(part)) || /\.(?:tsbuildinfo|log|pyc)$/i.test(relative)) return null;
    // Asset provenance is repository documentation, not a deployed browser asset.
    if (relative === 'public/home/README.md') return null;
    // Legacy downloadable sample resumes are not used by the implemented gallery.
    if (relative.startsWith('public/') && /\.pdf$/i.test(relative)) return null;
    if (!FRONTEND_ROOT_FILES.has(relative) && !FRONTEND_DIRS.has(parts[0])) return null;
    validatePath(filename); rejectPrivatePath(filename);
    if (relative !== 'public/application-helper/careerforge-auto-apply.zip' && !FRONTEND_ROOT_FILES.has(relative) && !FRONTEND_EXTENSIONS.has(path.posix.extname(relative).toLowerCase())) throw new Error(`Review unsupported frontend source before release: ${filename}`);
    return { destination: relative };
  }
  if (filename.startsWith('app/')) {
    if (filename.split('/').some(part => OMIT_DIRS.has(part)) || /\.py[co]$/i.test(filename)) return null;
    validatePath(filename); rejectPrivatePath(filename);
    if (!filename.endsWith('.py')) throw new Error(`Review unsupported backend source before release: ${filename}`);
    return { destination: filename };
  }
  if (BACKEND_ROOT_FILES.has(filename) || TAXONOMIES.has(filename)) {
    validatePath(filename); rejectPrivatePath(filename);
    return { destination: filename };
  }
  return null;
}

function scanSecrets(filename, content) {
  const text = content.toString('utf8');
  const patterns = [
    ['private key', /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/],
    ['provider credential', /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{35,})\b/],
    ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
    ['credential-bearing URL', /https?:\/\/[^\s/:"'<>]+:[^\s/@"'<>]+@/i],
  ];
  for (const [rule, pattern] of patterns) if (pattern.test(text)) throw new Error(`Possible ${rule} in ${filename}; review before release. No value was printed.`);
  if (filename === '.env.example') {
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && /(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|ACCESS_KEY|API_KEY)/.test(match[1]) && match[2].replace(/^['"]|['"]$/g, '').trim()) throw new Error(`Nonempty sensitive example setting ${match[1]} in .env.example. Leave it blank before release.`);
    }
  }
}

function parseTree(buffer) {
  return buffer.toString('utf8').split('\0').filter(Boolean).map(record => {
    const match = record.match(/^(\d{6}) (\w+) ([a-f0-9]+)\t([\s\S]+)$/);
    if (!match) throw new Error('Unexpected Git tree record.');
    return { mode: match[1], type: match[2], blob: match[3], source: match[4] };
  });
}

function insideRoot(root, destination) {
  const relative = path.relative(root, destination);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function assertOutputParents(root, directory) {
  if (!insideRoot(root, directory)) throw new Error('Release output must remain below this repository.');
  let current = root;
  for (const part of path.relative(root, directory).split(path.sep)) {
    current = path.join(current, part);
    if (fs.existsSync(current) && (!fs.lstatSync(current).isDirectory() || fs.lstatSync(current).isSymbolicLink())) throw new Error(`Release output path is not an ordinary directory: ${current}`);
  }
}

async function packageRelease(targets) {
  const root = fs.realpathSync(path.resolve(__dirname, '..'));
  const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 64_000_000, windowsHide: true });
  const gitText = args => git(args).toString('utf8').trim();
  if (fs.realpathSync(gitText(['rev-parse', '--show-toplevel'])) !== root) throw new Error('Run the committed packager from the root of its own Git repository.');
  const commit = gitText(['rev-parse', '--verify', 'HEAD^{commit}']);
  if (!/^[a-f0-9]{40,64}$/.test(commit)) throw new Error('HEAD is not a valid commit.');
  const assertClean = () => {
    if (gitText(['rev-parse', '--verify', 'HEAD^{commit}']) !== commit) throw new Error('HEAD changed during packaging; retry after the release commit is stable.');
    const changed = [...git(['diff', '--name-only', '-z', 'HEAD', '--']).toString('utf8').split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).toString('utf8').split('\0')].filter(Boolean);
    const relevant = [...new Set(changed)].filter(filename => TOOL_SOURCES.has(filename) || targets.some(target => classify(filename, target)));
    if (relevant.length) throw new Error(`Relevant source is uncommitted. Commit it before packaging:\n${relevant.map(filename => `  ${filename}`).join('\n')}`);
  };
  assertClean();
  const tree = parseTree(git(['ls-tree', '-r', '-z', '--full-tree', commit]));
  for (const required of ['scripts/package-release.cjs', 'docs/RELEASE_PACKAGING.md']) if (!tree.some(entry => entry.source === required && entry.type === 'blob' && /^100(?:644|755)$/.test(entry.mode))) throw new Error(`Release tooling is not committed: ${required}`);
  const timestamp = Number(gitText(['show', '-s', '--format=%ct', commit]));
  if (!Number.isFinite(timestamp)) throw new Error('Invalid commit timestamp.');
  const JSZip = require(require.resolve('jszip', { paths: [path.join(root, 'frontend')] }));
  const artifacts = [];
  for (const target of targets) {
    const selected = tree.map(entry => ({ ...entry, selected: classify(entry.source, target) })).filter(entry => entry.selected);
    if (!selected.length) throw new Error(`No committed ${target} source was selected.`);
    const zip = new JSZip(); const files = []; const seen = new Set(); let total = 0;
    selected.sort((a, b) => Buffer.compare(Buffer.from(a.selected.destination), Buffer.from(b.selected.destination)));
    for (const entry of selected) {
      if (entry.type !== 'blob' || !/^100(?:644|755)$/.test(entry.mode)) throw new Error(`Symlinks, submodules and special files are not releasable: ${entry.source} (mode ${entry.mode})`);
      const destination = validatePath(entry.selected.destination);
      const folded = destination.toLowerCase(); if (seen.has(folded)) throw new Error(`Case-colliding archive path: ${destination}`); seen.add(folded);
      const content = git(['show', `${commit}:${entry.source}`]);
      total += content.length;
      if (total >= (target === 'frontend' ? FRONTEND_LIMIT : BACKEND_LIMIT)) throw new Error(`${target} uncompressed source exceeds the 50,000,000-byte release limit.`);
      scanSecrets(entry.source, content);
      zip.file(destination, content, { binary: true, createFolders: false, date: new Date(Math.max(timestamp * 1000, Date.UTC(1980, 0, 1))), unixPermissions: parseInt(entry.mode, 8) });
      files.push({ source: entry.source, path: destination, gitBlob: entry.blob, bytes: content.length, sha256: sha256(content) });
    }
    const required = target === 'frontend' ? ['package.json', 'package-lock.json', 'next.config.js', 'app/layout.tsx', 'app/page.tsx'] : ['Dockerfile', 'requirements.txt', 'app/main.py', ...TAXONOMIES];
    for (const filename of required) if (!files.some(file => file.path === filename)) throw new Error(`Missing required ${target} release file: ${filename}`);
    const content = await zip.generateAsync({ type: 'nodebuffer', platform: 'UNIX', compression: 'DEFLATE', compressionOptions: { level: 9 } });
    if (content.length >= (target === 'frontend' ? FRONTEND_LIMIT : BACKEND_LIMIT)) throw new Error(`${target} ZIP exceeds the 50,000,000-byte release limit.`);
    artifacts.push({ target, filename: `careerforge-${target}-source-${commit.slice(0, 12)}.zip`, bytes: content.length, uncompressedBytes: total, sha256: sha256(content), files, content });
  }
  assertClean();
  const parent = path.join(root, '.runtime', 'release'); const directory = path.join(parent, commit);
  assertOutputParents(root, directory);
  try { git(['check-ignore', '-q', '--', '.runtime/release/packaging-check']); } catch { throw new Error('.runtime/release must be ignored by Git before packaging.'); }
  if (fs.existsSync(directory)) throw new Error(`Release destination already exists; no files were overwritten: ${directory}`);
  fs.mkdirSync(parent, { recursive: true }); assertOutputParents(root, parent); fs.mkdirSync(directory);
  const manifest = {
    schemaVersion: 1, commit, committedAt: new Date(timestamp * 1000).toISOString(), generatedAt: new Date().toISOString(),
    source: 'Committed Git blobs only; no working-tree file content',
    omissions: ['secrets and real environment files', 'uploads and private documents', 'build output and installed dependencies', 'legacy public sample PDFs', 'tests and QA evidence'],
    artifacts: artifacts.map(({ content, ...metadata }) => metadata),
  };
  for (const artifact of artifacts) fs.writeFileSync(path.join(directory, artifact.filename), artifact.content, { flag: 'wx' });
  fs.writeFileSync(path.join(directory, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  fs.writeFileSync(path.join(directory, 'SHA256SUMS.txt'), artifacts.map(artifact => `${artifact.sha256}  ${artifact.filename}`).join('\n') + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ commit, directory, artifacts: artifacts.map(({ content, files, ...metadata }) => ({ ...metadata, fileCount: files.length })) }, null, 2));
}

function options(argv) {
  if (argv.length === 0) return ['frontend', 'backend'];
  if (argv.length === 2 && argv[0] === '--target' && ['frontend', 'backend', 'all'].includes(argv[1])) return argv[1] === 'all' ? ['frontend', 'backend'] : [argv[1]];
  throw new Error('Usage: node scripts/package-release.cjs [--target frontend|backend|all]');
}

if (require.main === module) {
  if (process.argv.slice(2).includes('--help')) console.log('Usage: node scripts/package-release.cjs [--target frontend|backend|all]\nRead clean committed HEAD only. Write source ZIPs and hashes below .runtime/release/<commit>. No deployment or hosting changes.');
  else Promise.resolve().then(() => packageRelease(options(process.argv.slice(2)))).catch(error => { console.error(`Release packaging stopped: ${error.message}`); process.exitCode = 1; });
}

module.exports = { validatePath, rejectPrivatePath, classify, scanSecrets, parseTree, insideRoot, options };
