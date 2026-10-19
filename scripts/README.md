# Sites build isolation

Run from the repository root:

```text
node scripts/build-sites.cjs --check
node scripts/build-sites.cjs
```

`--check` validates the saved Sites identity, installed Next CLI, and required frontend inputs. It does not build, copy, package, or change the current primary/Sites artifacts. `node --check scripts/build-sites.cjs` checks JavaScript syntax independently.

The real build creates a unique physical source copy under `.runtime/sites-build-*`. It copies only the frontend `app`, `components`, `lib`, `types`, `store`, optional `public` assets, and named package/configuration files. It omits private environment files, uploaded document files (including old public PDFs), data/build directories, and source symlinks. A Windows junction (or directory symlink elsewhere) points `node_modules` to the existing frontend dependencies; no package installation occurs.

The copied frontend runs the existing Next CLI with `STATIC_EXPORT=1` and `NEXT_PUBLIC_SITE_MODE=1`. Application/provider environment variables and a configured personal API origin are not inherited. Both `.next` intermediates and the `.next-sites` final export belong to the isolated directory, so the primary frontend's `.next` is untouched and its server can remain running.

This physical isolation matters with the installed Next 15: `output: 'export'` treats custom `distDir` as the **final export directory**, then resets its intermediate directory to `.next`. Running a static build in the primary frontend folder therefore overwrites the primary build even when `distDir` is `.next-sites`.

After the isolated export succeeds, the script calls `prepare-sites.cjs` with the absolute exported directory. This prepares `sites/careerforge/dist` using the already persisted `.openai/hosting.json` project identity. It does not create another Sites project or publish the package. Keep the frontend source stable during the operation because the packager also includes a source snapshot from the repository.

Successful builds remove their scratch directory after detaching the dependency junction. `--keep-workdir` preserves it for inspection. Failed builds are retained automatically and print their location. The script verifies the scratch path stays within its unique `.runtime/sites-build-*` directory before recursive cleanup.

Do not run `STATIC_EXPORT=1 next build` directly in `frontend` while a primary server uses its `.next` directory. For an existing collision, preserve the successful static export, stop the primary server, rebuild the primary with the Sites flags unset, and restart it.

# Primary Hostinger static package

```text
node --check scripts/build-hostinger.cjs
node --test scripts/build-hostinger.test.cjs
node scripts/build-hostinger.cjs --check
node scripts/build-hostinger.cjs --check --api-origin https://careerforge-resume-api-free.onrender.com
```

These checks do not build, contact the backend, write output, or use the Sites identity. `--check` reports whether the relevant source is committed and clean; an actual build requires that condition. The exact native Render origin may also be supplied through `HOSTINGER_API_ORIGIN`. Only an HTTPS `<service>.onrender.com` origin is accepted, without credentials, ports, paths, queries, or fragments. The real build additionally requires a successful, nonredirected `/api/health` response reporting `healthy`, `storage_mode: local`, and `server_persistence: false`.

After the backend is independently verified live and the source/tooling is committed:

```text
node scripts/build-hostinger.cjs --api-origin https://careerforge-resume-api-free.onrender.com
```

This creates a physical source copy below ignored `.runtime/hostinger-build-*` from the clean committed frontend Git tree, using the same curated frontend directories and named configuration files. Source symlinks are rejected; environment files, private uploads, document samples, dependencies, tests, and existing build output are excluded. The existing installed frontend dependencies are linked into the isolated copy. No installation occurs and provider credentials, `NODE_OPTIONS`, the Sites mode flag, and inherited API origins are not forwarded.

The isolated build sets `STATIC_EXPORT=1`, `NEXT_PUBLIC_STORAGE_MODE=local`, and the exact validated API origin. `NEXT_PUBLIC_SITE_MODE` remains unset. The script does not invoke `prepare-sites.cjs`, read/write `.openai` identity, or modify `frontend/.next`, the Sites export, Git source, or hosting.

Successful output is `.runtime/hostinger-release/<full-commit>/dist` plus a root-level deployment ZIP, `manifest.json` with per-file sizes/hashes and backend verification, and `SHA256SUMS.txt` covering both ZIP and manifest. The ZIP contains `index.html`, exported route directories, `_next` assets and a minimal static `.htaccess`; it contains no source package, environment, document upload, or installed dependencies. Both ZIP and uncompressed static files must remain below 50,000,000 bytes. Existing release destinations are never overwritten. Build copies remain in `.runtime` for inspection, including after failure.

This prepares a reviewable primary-site artifact only. It performs no upload or publication. A verified backup and the separate hosting deployment workflow still apply before replacing the existing site.
