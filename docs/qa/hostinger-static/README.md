# Local static artifact and live API verification

This evidence tests **local static files at a simulated browser origin**, not a deployed Hostinger site. The browser opens `https://resume.docheng.co.za`, but Playwright fulfills canonical-origin requests from the reviewed artifact's local `dist` directory. Only the artifact's exact Render API origin can use the network, for four explicitly allowed processing operations with synthetic documents.

The final run passed all seven checks against frontend artifact commit `194f9e8798fb04c6ebe9bf4ffe0e940cf98bcea5`. All 275 canonical responses carried verified local markers, with no missing local paths, unexpected requests, or browser page errors. The four live processing responses returned HTTP 200 with exact canonical CORS, `no-store`, and no cookies. The deployed backend remains commit `368088a3313a8263d8a94f1dbfa31c59ed24a011`; the intervening fix changed frontend rendering only.

The final transport serves directory indexes directly with HTTP 200. Every canonical response must carry the artifact commit in `X-QA-Local-Static`; missing markers, unexpected external requests, or missing local files fail the check. This deliberately avoids intercepted redirect chains. Actual Hostinger deployment, Apache `DirectorySlash` redirects, production headers, and public-site behavior remain unverified by this simulation.

## Reading the evidence

- `results.json` is the latest attempt. Its `passed` flag, `sourceCommit`, `artifactSha256`, and scope identify what was actually tested. A failed or superseded run does not establish release readiness.
- `harness-first-failure.json` preserves the first transport attempt. It failed after a reload involving a mocked directory redirect. **Canonical network behavior was inconclusive**, although no live API requests were sent. Its originally configured passthrough flag was not proof that redirect requests stayed intercepted.
- `results-pre-scanner-fix.json` and `scanner-before-fix.png` preserve a real application failure exposed by the corrected direct-file transport. All 84 canonical responses had verified local markers; current PDF export, TXT import, and BASIC scoring returned HTTP 200 with canonical CORS, `no-store`, and no cookies. The scanner then crashed because the UI assumed experience metrics existed in a BASIC response. That response also uses `layout` rather than the UI's assumed `length` group. The narrow frontend fix was committed, rebuilt, and passed the final full browser run above.
- `resume-current.pdf`, `letter-current.pdf`, `scan-response.json`, and mobile screenshots are synthetic outputs from the latest run that produced them. Use `results.json` to determine whether that run completed. Historical files are explicitly named above.

The reusable runner is `scripts/qa-hostinger-static.cjs`. Its `--check` path validates the local artifact, path containment, MIME mapping and exclusions without starting a browser or contacting any service. The browser suite checks a 2 MiB + 1 byte upload rejection before network, local save/reload, current exports, TXT import, scanner rendering, local letters, mobile layouts, exact canonical CORS, `credentials: omit`, and absence of server-workspace requests/cookies. The runner records the fixture reload URL and each canonical response marker.

No hosting write or publication is performed by this runner. The generated `.htaccess` is checked as an artifact file; these browser results do not verify how a real Hostinger server applies it.

Reproduce the recorded run from the repository root, with Playwright installed and the reviewed artifact available:

```powershell
node scripts/qa-hostinger-static.cjs --dist .runtime/hostinger-release/194f9e8798fb04c6ebe9bf4ffe0e940cf98bcea5/dist --check
node scripts/qa-hostinger-static.cjs --dist .runtime/hostinger-release/194f9e8798fb04c6ebe9bf4ffe0e940cf98bcea5/dist
```

The second command makes four sequential synthetic requests to the live API. Coordinate it with other live checks; the first command performs no network requests.
