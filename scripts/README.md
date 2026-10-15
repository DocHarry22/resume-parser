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
