#!/usr/bin/env node
'use strict';

// Build the same frontend in a separate physical directory. In Next 15,
// output:'export' repurposes distDir as the final export destination and still
// writes its intermediate files to .next; a different distDir alone is unsafe
// while the primary frontend is running. See scripts/README.md.
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const runtime = path.join(root, '.runtime');
const dependencies = path.join(frontend, 'node_modules');
const nextCli = path.join(dependencies, 'next', 'dist', 'bin', 'next');
const prepareScript = path.join(__dirname, 'prepare-sites.cjs');
const hostingFile = path.join(root, 'sites', 'careerforge', '.openai', 'hosting.json');
const sourceDirectories = ['app', 'components', 'lib', 'types', 'store', 'public'];
const requiredFiles = ['package.json', 'package-lock.json', 'next.config.js', 'postcss.config.js', 'tailwind.config.ts', 'tsconfig.json'];
const optionalFiles = ['next-env.d.ts', '.eslintrc.json', '.eslintrc.cjs', 'eslint.config.js', 'eslint.config.mjs', 'middleware.ts', 'middleware.js'];
const ignoredNames = new Set(['node_modules', '.git', '.next', '.next-sites', 'out', 'data', 'resumes', 'cover_letters', 'workspaces', '.openai', '.runtime', 'tests', 'tempss']);

async function exists(file) {
  try { await fs.access(file); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

async function readIdentity() {
  const manifest = JSON.parse(await fs.readFile(hostingFile, 'utf8'));
  if (typeof manifest.project_id !== 'string' || !manifest.project_id.trim()) {
    throw new Error('Persist the existing Sites project identity in sites/careerforge/.openai/hosting.json before building.');
  }
  return manifest.project_id;
}

async function copyFilter(file) {
  const basename = path.basename(file);
  // Never copy private environment files, existing build/data directories,
  // document uploads, or symlinks that could escape the curated source tree.
  if (ignoredNames.has(basename.toLowerCase()) || basename.toLowerCase().startsWith('.env')) return false;
  if (/\.(pdf|docx?|pem|key|pfx|p12)$/i.test(basename)) return false;
  return !(await fs.lstat(file)).isSymbolicLink();
}

function childEnvironment() {
  // Keep OS/runtime essentials, rather than forwarding provider keys, private
  // application variables, NODE_OPTIONS hooks, or public API-origin settings.
  const permitted = /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|USERPROFILE|HOME|HOMEDRIVE|HOMEPATH|APPDATA|LOCALAPPDATA|TEMP|TMP|TMPDIR|PROGRAMFILES|PROGRAMFILES\(X86\)|PROGRAMDATA|SYSTEMDRIVE|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE|TERM|CI|NO_COLOR|FORCE_COLOR)$/i;
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (permitted.test(key) && value !== undefined) env[key] = value;
  }
  return { ...env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', STATIC_EXPORT: '1', NEXT_PUBLIC_SITE_MODE: '1', NEXT_PUBLIC_API_BASE_URL: '' };
}

function runNode(args, cwd, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit', shell: false, windowsHide: true });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`Sites build command failed (${signal || `exit ${code}`}).`)));
  });
}

function assertScratchPath(directory) {
  const relative = path.relative(runtime, path.resolve(directory));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || relative.includes(path.sep) || !path.basename(directory).startsWith('sites-build-')) {
    throw new Error('Refusing to remove a path outside the unique .runtime/sites-build-* directory.');
  }
}

async function removeScratch(directory) {
  assertScratchPath(directory);
  const [actualRoot, actualRuntime, actualDirectory] = await Promise.all([fs.realpath(root), fs.realpath(runtime), fs.realpath(directory)]);
  const runtimeRelative = path.relative(actualRoot, actualRuntime);
  if (!runtimeRelative || runtimeRelative.startsWith('..') || path.isAbsolute(runtimeRelative) || path.relative(actualRuntime, path.dirname(actualDirectory)) !== '' || (await fs.lstat(directory)).isSymbolicLink()) {
    throw new Error('Refusing cleanup: resolved scratch directory is outside the intended workspace/runtime directory.');
  }
  const link = path.join(directory, 'node_modules');
  if (await exists(link)) {
    if (!(await fs.lstat(link)).isSymbolicLink()) throw new Error('Refusing cleanup: scratch node_modules is not the expected junction/symlink.');
    await fs.unlink(link); // Detach dependencies before deleting generated files.
  }
  await fs.rm(directory, { recursive: true, force: true });
}

async function main() {
  const args = new Set(process.argv.slice(2));
  for (const argument of args) if (!['--check', '--keep-workdir'].includes(argument)) throw new Error(`Unknown option: ${argument}. Use --check or --keep-workdir.`);
  const identity = await readIdentity();
  await fs.access(nextCli);
  await fs.access(prepareScript);
  for (const file of requiredFiles) await fs.access(path.join(frontend, file));
  for (const directory of sourceDirectories.filter(directory => directory !== 'public')) await fs.access(path.join(frontend, directory));
  if (args.has('--check')) {
    console.log(JSON.stringify({ check: 'passed', project_id: identity, source: frontend, scratch_parent: runtime, shared_dependencies: dependencies, final_target: path.join(root, 'sites', 'careerforge', 'dist'), build_runs: false }));
    return;
  }

  await fs.mkdir(runtime, { recursive: true });
  const workdir = await fs.mkdtemp(path.join(runtime, 'sites-build-'));
  assertScratchPath(workdir);
  let completed = false;
  console.log(`Building Sites in isolated source copy: ${workdir}`);
  try {
    for (const directory of sourceDirectories) {
      const source = path.join(frontend, directory);
      if (await exists(source)) await fs.cp(source, path.join(workdir, directory), { recursive: true, dereference: false, filter: copyFilter });
    }
    for (const file of [...requiredFiles, ...optionalFiles]) {
      const source = path.join(frontend, file);
      if (await exists(source)) {
        if ((await fs.lstat(source)).isSymbolicLink()) throw new Error(`Build configuration must be a regular file: ${file}`);
        await fs.copyFile(source, path.join(workdir, file));
      }
    }
    await fs.symlink(dependencies, path.join(workdir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    const env = childEnvironment();
    await runNode([nextCli, 'build', workdir], workdir, env);
    const exported = path.join(workdir, '.next-sites');
    await fs.access(path.join(exported, 'index.html'));
    await fs.access(path.join(exported, '_next'));
    if (await readIdentity() !== identity) throw new Error('Sites identity changed during the build; packaging stopped to preserve the selected project.');
    await runNode([prepareScript, exported], root, env);
    if (await readIdentity() !== identity) throw new Error('Sites identity changed while packaging.');
    completed = true;
    console.log(JSON.stringify({ status: 'prepared', project_id: identity, target: path.join(root, 'sites', 'careerforge', 'dist'), primary_build_untouched: true }));
  } finally {
    if (completed && !args.has('--keep-workdir')) {
      try { await removeScratch(workdir); }
      catch (error) { console.warn(`Sites package is ready; scratch cleanup failed: ${error.message} Retained: ${workdir}`); }
    } else {
      console.log(`Isolated build files retained for inspection: ${workdir}`);
    }
  }
}

main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
