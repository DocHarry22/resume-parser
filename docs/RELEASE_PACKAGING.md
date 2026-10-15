# Exact-commit release source packages

`scripts/package-release.cjs` prepares source archives for a Node-hosted Next frontend and a separately hosted Python/Docker API. It does not publish, deploy, provision hosting, change DNS, or contact a hosting account.

Run it after the reviewed release source and this tooling have been committed. The packager refuses relevant staged, unstaged, or untracked source changes and reads file contents with `git show <commit>:<path>`. Build folders, installed dependencies, and working-tree file contents are never used as release source.

## Create the packages

From the repository root, with frontend dependencies installed:

```powershell
node --test scripts/package-release.test.cjs
git status --short
git rev-parse HEAD
node scripts/package-release.cjs
```

The last command packages both targets from the same `HEAD`. To package one target, use `--target frontend` or `--target backend`. A single-target run checks relevant source for that target, plus the packaging tool and instructions. There is no alternate-ref or arbitrary-output option.

Output stays inside the ignored `.runtime/release/<full-commit>/` directory:

- `careerforge-frontend-source-<12-character-commit>.zip`
- `careerforge-backend-source-<12-character-commit>.zip`
- `release-manifest.json`, with the full commit, archive SHA256/size, uncompressed size, and each included Git path/blob/content hash.
- `SHA256SUMS.txt`, with the two archive hashes.

An existing destination is refused rather than overwritten. Failed source validation produces no archives. After successful packaging, compare the manifest commit with the approved release commit and verify the archive hash before uploading. For example:

```powershell
Get-FileHash -Algorithm SHA256 .runtime/release/<full-commit>/careerforge-frontend-source-<short-commit>.zip
```

On Linux, run `sha256sum -c SHA256SUMS.txt` from the release directory. File timestamps inside the ZIP use the commit timestamp, and file order is stable. The manifest records the actual hash; no claim is made that a different dependency/runtime version will produce identical compressed bytes.

## Included source and exclusions

| Target | Included committed source | Archive root |
|---|---|---|
| Frontend | Package/lock/config/type files; `app`, `components`, `lib`, `store`, `types`; supported public assets; license | `package.json`, `app/`, etc. No enclosing `frontend/` directory. |
| Backend | `Dockerfile`, `.dockerignore`, requirements, Python files under `app`, compose, safe `.env.example`, license | `Dockerfile`, `app/`, `requirements.txt`, etc. |
| Backend taxonomy data | Exactly `data/section_headings.json` and `data/skills_taxonomy.json` | `data/` contains only those two files. |

The allowlists omit tests/QA evidence, old `frontend/public` sample PDFs, the `tempss` sample directory, real environment files, private uploads/documents, server workspace data, local signing keys, caches, dependencies, and built output. An allowlisted secret path, symlink/submodule, path traversal, Windows-ambiguous path, duplicate case-folded archive path, or unsupported source type stops packaging. Both raw source and compressed frontend ZIP must stay below 50,000,000 bytes. The same bound also applies to the backend source archive.

Credential checks reject private-key blocks, common provider/access-token formats, credential-bearing HTTP URLs, and nonempty sensitive assignments in `.env.example`, without printing the value. These checks supplement the source allowlist; they do not substitute for reviewing configuration and source before release.

## Frontend handoff for Node hosting

The frontend ZIP is Next source, not a static website ZIP. It needs a hosting service that runs Node applications. Uploading it into an existing static-site slot does not add that capability or host the Python API.

For a compatible Node hosting target:

1. Extract/upload the frontend ZIP so `package.json` is at the project root. Use a supported Node 22 or 24 runtime.
2. Configure `API_PROXY_TARGET` to the real, verified API origin before the build. Next rewrites capture this setting during the build. Use an HTTPS API origin when it is on another host; a private origin is appropriate only when the hosting topology actually supports it.
3. Leave `STATIC_EXPORT` and `NEXT_PUBLIC_SITE_MODE` unset for the primary Node application. Leave `NEXT_PUBLIC_API_BASE_URL` unset to use the same-origin `/api` proxy. Do not put provider keys or workspace secrets into frontend public variables.
4. Install, build, and start using the root package scripts:

```text
npm ci
npm run build
npm start
```

Set the platform's Node build command to `npm run build` and its start command to `npm start`. The host must provide the runtime port in the way its Next/Node launcher supports. This source package contains no `.next` output; the target must complete the build. Keep the previous deployed release available until the new application, proxy, document saves, and downloads have been checked.

## Backend handoff for Docker-capable hosting

The backend ZIP requires a Docker-capable host or a separately configured Python application platform. An unrelated existing Node service cannot run this Docker/Python package without an explicitly configured compatible target. The packager does not create or modify such a target.

On a Docker-capable host, extract the backend ZIP and configure a private `.env` there. Use `.env.example` only as a template. Configure a stable private workspace secret, exact frontend `CORS_ORIGINS`, HTTPS secure cookies, and any optional server-only AI settings. Never add the resulting `.env` to source or upload it inside a source archive.

The supplied compose file keeps the API bound to loopback and stores documents in a persistent named volume. Place an HTTPS reverse proxy in front of it if external API access is required. Then, from the extracted backend root:

```text
docker compose --env-file .env build
docker compose --env-file .env up -d
docker compose ps
```

The Docker build installs the pinned Python dependencies and spaCy model. Its health endpoint is `/api/health`, on container port 8000. Confirm the API identity and health before configuring the frontend proxy. Preserve the persistent `resume-data` volume and workspace signing key during updates or rollback; do not use `docker compose down -v` for a release rollback.

These are deployment handoff instructions. A generated archive and successful local QA do not establish that the target hosting plan supports Node/Python, that a container was built on that host, or that the primary domain has been updated. See [the deployment report](DEPLOYMENT_REPORT.md) and [QA instructions](qa/RUNNING.md) for observed access limits, completed verification, and further checks.
