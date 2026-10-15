# Isolated Sites build verification

Status: PASS for the final reviewed application source `14dce884309c0f9dfc83d01471bedec7778f91c9`, including guest-session bootstrap, separate JSON-import/server document identities and legacy draft deletion. This records local packaging and preview validation; the parent task owns subsequent native synchronization and publication.

The actual `node scripts/build-sites.cjs` command completed successfully using bundled Node, checkout-local TMP/TEMP and existing frontend dependencies. It compiled in 16.6 seconds, passed type checking, generated 17 static pages and packaged `sites/careerforge/dist` from a separate physical source copy under `.runtime/sites-build-E7PuAt`. The source revision recorded by the packager is the final revision above.

The preserved project identity is `appgprj_6ad0d2b816bc8191b1964e7bc48c2f93`. No Site was created, no source repository was pushed and no native save/deploy/publish call was made by this validation.

Primary preservation was independently verified before and after the build:

- Primary BUILD_ID remained `ZF0WlnsJ74-kmsE6Mk2tD`.
- All 17 JavaScript/CSS assets found across the homepage, editor, dashboard and template gallery returned HTTP 200 before and after, with identical SHA256 hashes and nonempty bodies.
- The selected Sites project ID was unchanged.
- The packaged StudioBuilder source matched the final reviewed frontend source byte for byte.
- The isolated scratch directory was removed after its dependency junction was detached.
- The existing static preview on `http://127.0.0.1:4173` returned HTTP 200.

The existing `scripts/sites-smoke.cjs` run passed all 19 check groups against the final package. It observed zero backend API requests, browser runtime exceptions, console errors or failed responses. The Sites guard still runs before guest bootstrap. TXT/DOCX/JSON downloads, browser persistence, desktop/mobile layouts and primary-app fallback controls passed. The PDF control invoked browser printing; this check does not establish additional PDF fidelity.

Expected Next static-export warnings explain that rewrites and headers are not applied to static output. Sites does not depend on those rewrites because backend operations are guarded and no API requests occurred during smoke checks.

Evidence: `isolated-sites-build.log`, `isolated-sites-smoke.log`, `isolated-sites-build-before.json`, `isolated-sites-build-after.json` and `sites-results.json`. The independent original browser/API regression verifies separate documents after server import, JSON restore and save; the static edition browser check verifies its supported local paths.
