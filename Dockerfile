# Backend-only image; private documents never enter the build context.
# The primary recipe defaults to the tested medium model; only pinned profiles are allowed.
ARG SPACY_MODEL=en_core_web_md
FROM python:3.12-slim AS dependencies
ARG SPACY_MODEL
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN python -m venv /opt/venv && python -m pip install --no-cache-dir --upgrade "pip>=26.2.1" && python -m pip install --no-cache-dir -r requirements.txt
RUN case "$SPACY_MODEL" in \
      en_core_web_md) model_sha=6a0f857a2b4d219c6fa17d455f82430b365bf53171a2d919b9376e5dc9be032e ;; \
      en_core_web_sm) model_sha=86cc141f63942d4b2c5fcee06630fd6f904788d2f0ab005cce45aadb8fb73889 ;; \
      *) echo "Unsupported SPACY_MODEL build profile" >&2; exit 64 ;; \
    esac && \
    python -m pip install --no-cache-dir "https://github.com/explosion/spacy-models/releases/download/${SPACY_MODEL}-3.7.1/${SPACY_MODEL}-3.7.1-py3-none-any.whl#sha256=$model_sha" && \
    SPACY_MODEL="$SPACY_MODEL" python -c "import os, spacy; nlp = spacy.load(os.environ['SPACY_MODEL']); assert nlp.meta['version'] == '3.7.1'; assert 'ner' in nlp.pipe_names; print('Verified build model:', os.environ['SPACY_MODEL'])"

FROM python:3.12-slim AS runtime
ARG SPACY_MODEL
ENV VIRTUAL_ENV=/opt/venv PATH="/opt/venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 LOG_LEVEL=INFO DATA_DIR=/var/lib/resume-parser TAXONOMY_DIR=/app/data SPACY_MODEL=${SPACY_MODEL}
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates fonts-dejavu-core libstdc++6 libgomp1 && rm -rf /var/lib/apt/lists/* && groupadd --system --gid 10001 resumeapp && useradd --system --uid 10001 --gid resumeapp --home-dir /app resumeapp && mkdir -p /app/data /var/lib/resume-parser && chown -R resumeapp:resumeapp /app /var/lib/resume-parser
COPY --from=dependencies /opt/venv /opt/venv
WORKDIR /app
COPY --chown=resumeapp:resumeapp app/ /app/app/
COPY --chown=resumeapp:resumeapp data/section_headings.json data/skills_taxonomy.json /app/data/
USER resumeapp
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=5).read()"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-server-header", "--limit-concurrency", "20", "--timeout-keep-alive", "5"]
