# Architecture, gaps and next gates
## Implemented architecture
The Next.js frontend keeps original resume models and templates. A same-origin /api rewrite points to API_PROXY_TARGET (server setting); NEXT_PUBLIC_API_BASE_URL is optional for a separately hosted authorized API. No browser API keys are used. Guest documents use a signed cookie, workspace-specific directories, bounded storage and atomic writes. spaCy parsing/scoring stay in FastAPI. Files are checked by extension/signature/expanded ZIP size; request bodies are bounded.

The Sites target is built from the same frontend using STATIC_EXPORT=1 and NEXT_PUBLIC_SITE_MODE=1. It supports browser editing, previews, backups, local text/editable DOCX and print/PDF where supported. It cannot run spaCy/FastAPI: Sites' documented runtime is JavaScript/TypeScript on Workers. Cross-origin access and account continuity must be verified before connecting processing. Unsupported actions navigate to the primary app rather than expose personal APIs.

## Accounts and durable infrastructure
Prefer a canonical managed PostgreSQL account/document service when the production backend host is verified. Evaluate Supabase Auth/Postgres against extending the existing backend: managed verification/recovery/RLS reduces custom-auth burden; it introduces a new external service, migrations, key management and ownership policies. No Supabase project, account or connection was provisioned in this run. This is an architecture evaluation, not evidence of an integration.

Before account rollout: select/confirm the existing database and authentication provider, create ownership-linked documents/version rows, test cross-user ID manipulation, implement email verification/reset/logout/deletion/data export, and migrate guest documents only with explicit ownership proof. Preserve existing shared files until their owner mapping is validated. Keep guest recovery limitations visible until migration completes.

For current guest deployment: set WORKSPACE_SECRET to a stable random secret; mount DATA_DIR on durable storage; set COOKIE_SECURE=true behind HTTPS; keep exact CORS_ORIGINS and SameSite policy appropriate to the verified origins. Disk workspaces are single-service persistence, not a database substitute. Distribute rate limiting and quotas at the reverse proxy before public scale. Define/operate retention and abuse controls; do not claim automatic expired-data deletion until a tested job exists.

An unactivated Render candidate is a single 1 CPU/2GB Docker service with a 1GB persistent data disk. Current published compute and disk rates imply about USD25.25/month before taxes, usage overages or any workspace-plan charges. This is a planning estimate, not an approved purchase or performance benchmark. Confirm the current account quote, volume permissions, load behavior and backup/restore before provisioning. Free Render filesystems are ephemeral and cannot meet the guest-storage durability requirement. Sources checked15October2026: https://render.com/pricing and https://render.com/docs/disks. No Render service or disk was created.

## AI and billing
AI_API_KEY, AI_MODEL and HTTPS AI_BASE_URL stay server-side. AI remains unavailable without explicit configuration. A configured provider is an external data processor: require consent, verify outputs and evaluate contractual/privacy obligations before rollout. Unsupported numeric-claim rejection is a safeguard, not a proof that generated facts are true.

Billing remains disabled. Choose an authorized South African merchant provider and confirm supported ZAR recurring payments, webhook signing, idempotency, refunds/cancellation, sandbox transactions and reconciliation before activation. Product prices and VAT treatment require the owner's business decisions and appropriate tax review. No price, tax status or successful transaction is fabricated.

## Prioritized remaining work
P0: verified production backup/restore; an approved Python host with durable storage; verified Hostinger frontend runtime/API wiring; full account ownership; live-domain E2E; deployment secret checks. Native Hostinger inspection now confirms an active cloud plan and static export, no Git auto-deployment and no Node builds; no production Python backend was identified on Hostinger or in the selected Render workspace.
P1:30 original templates with visual/export QA; per-field import confidence + OCR; persisted version history; exact-layout DOCX/PDF parity; rich text and section/entry drag-and-drop; broad unicode/long-document rendering fixtures.
P2: job calendar/account sync; JD URL/file ingestion with SSRF-safe retrieval; interview and STAR coaching; privacy-controlled sharing; localization.
P3: approved subscriptions/merchant integration and consent-based team/recruiter tools.

## Verification sources
Current Sites documentation: https://learn.chatgpt.com/docs/sites?surface=web.
Next.js security maintenance update checked15 October2026: https://nextjs.org/blog/nextjs-security-update-october-14-2026 (15.5.28 selected to preserve React18 compatibility while moving off14.0.4).
AI provider API reference: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create.
