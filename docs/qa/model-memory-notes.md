# Optional small-model memory profile

The default root Dockerfile still installs `en_core_web_md` 3.7.1 and retains its existing Uvicorn command. An optional allowlisted build argument selects `en_core_web_sm` 3.7.1. Each model wheel has a fixed official SHA256; unknown model names fail the build. The selected runtime `SPACY_MODEL` is inherited from the same build argument, preventing an image/model mismatch.

`deploy/Dockerfile.free` is the standalone recipe for hosts whose creation API cannot supply Docker build arguments. It is an exact twin of the root recipe except for the default model argument. The dedicated CI job compares their bytes after that one replacement, so dependency pins, model checksums, runtime protections and the start command cannot silently drift. No recipe generation happens during deployment. Both use the existing restricted build context and only copy app code, requirements and the two public taxonomies.

## Measurements and limits

These are synthetic measurements from separate Windows processes, not Linux container memory guarantees. The input repeats `Alex Morgan builds Python services at Example Limited. ` exactly 1,000 times: 55,000 characters. No private document was used.

| Measurement | Medium 3.7.1 | Small 3.7.1 |
| --- | ---: | ---: |
| App/model idle RSS | 358.2 MiB | 163.8 MiB |
| Peak RSS after 11,000 characters | 395.7 MiB | 197.5 MiB |
| Peak RSS after 55,000 characters | 523.7 MiB | 313.7 MiB |
| Static vector table | 20,000 x 300 | none |

Evidence is in `model-memory-windows-md.json` and `model-memory-windows-sm.json`. It includes the exact phrase, counts, interpreter command, source revision, model version and scope. The original inline probe also observed approximately 522.4 MiB medium-model peak for the same 55,000-character input; the reusable script's result above is the recorded reproduction. Process working set, private committed memory and container cgroup accounting are different measurements and must not be substituted for one another.

The isolated small-model installation used the official wheel below, checked its SHA256, and installed with `pip --no-deps --target .runtime/small-model-evaluation/packages`. It did not modify the tested backend environment. A fresh subprocess used `PYTHONPATH` pointing to that ignored target and `SPACY_MODEL=en_core_web_sm`.

- Small wheel: `https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl`
- SHA256: `86cc141f63942d4b2c5fcee06630fd6f904788d2f0ab005cce45aadb8fb73889`
- Probe: `.backend-venv/Scripts/python.exe scripts/low-memory-smoke.py --windows-probe`

Local stateless HTTP checks passed against an isolated Windows small-model fixture: real PERSON name extraction, contact/company parsing, a numeric score, memory-only editor import, PDF/DOCX/TXT/JSON for a normal document and a 55,000-character document, final-content retention, and rejection beyond the 60,000-character cap. Private-record routes returned 503 and no workspace cookie was minted. These local HTTP checks had no Linux CPU or memory enforcement. They do not establish free-host performance.

## Dedicated Linux CI

The new `.github/workflows/low-memory.yml` builds the standalone small-model recipe and runs only disposable local fixtures. It uses a real Docker memory limit of 512 MiB, total memory-plus-swap of 512 MiB (no additional swap), and 0.1 CPU. It sets one processing request at a time, 2 MB uploads, 60,000 extracted characters, 20 PDF pages, 8 MB DOCX expanded data, and one BLAS/OpenMP thread. It preserves the tested image start command and one Uvicorn worker.

The stateless fixture has `STORAGE_MODE=local`, ephemeral tmpfs only, and no provider credentials. The smoke checks verify:

- Actual small-model health metadata, package version, startup log and real PERSON extraction.
- Server record operations disabled, no guest cookies, and zero private data files.
- Typical parsing, scoring, editor import and four genuine export formats.
- A 55,000-character parse and larger exports with the final marker retained, including a multipage PDF and editable DOCX.
- An input over the configured 60,000-character limit is rejected.
- Actual cgroup current/peak memory plus Docker's enforced limits and OOM state. The lightweight memory probe never loads a second NLP model into the API container.

Results, limits, timings, cgroup peak, runtime log and final container state are uploaded as `small-model-512mb-evidence`. Label checks restrict cleanup to the job's disposable container. No image is pushed and no hosting service is created.

**Linux resource-limit verification is pending until this workflow runs successfully on the exact reviewed commit.** Docker is unavailable locally. Even a passing synthetic job is not a production load test, a guarantee against memory exhaustion, or proof of permanent free hosting. Browser/proxy configuration and the provider's free-tier limits still need separate checks.

## Model quality and free-service boundaries

The app uses named entities, tokenization, sentence boundaries and readability calculations. Its job match is keyword overlap; current source has no static-vector similarity call. The small model therefore supports the required operations, but extraction and sentence predictions can differ. Its generic published entity F1 is about 84.56 versus 85.22 for the medium model, which is not a resume-specific quality guarantee. See the official [small-model metadata](https://raw.githubusercontent.com/explosion/spacy-models/master/meta/en_core_web_sm-3.7.1.json) and [medium-model metadata](https://raw.githubusercontent.com/explosion/spacy-models/master/meta/en_core_web_md-3.7.1.json).

This profile uses browser-local document persistence and a stateless Python processor. It requires no Supabase or external database. It provides no server document recovery or cross-device account. The existing two Render Node services are reported as Free; their build hardware label does not establish paid service plans. Payment-method presence is unverified. Any Render overage risk is conditional on the account's actual billing configuration; do not promise a zero total bill merely because compute is Free. See [Render's free-service limits](https://render.com/docs/free).
