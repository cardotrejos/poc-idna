# iDNA MVP Tasks Backlog (October 2025)

Legend: `[]` Todo, `[~]` In‑Progress, `[x]` Done. Sizes: S (≤2h), M (≤6h). Estimates are rough. Tasks are grouped by epics and sized small–medium. Each task lists acceptance criteria and key paths.

Notes & Assumptions
- Monorepo layout: Next.js app under `apps/web`, Hono server under `apps/server`, shared libs under `packages/*` (api, auth, db).
- Database: Postgres with Drizzle (`packages/db`).
- Auth: `better-auth` (email/password already scaffolded) with Google OAuth to be enabled.
- Storage: S3‑compatible (e.g., AWS S3) or Supabase Storage; abstracted behind a storage service.
- oRPC endpoints live in `apps/server/src/api/` via `packages/api` router conventions.
- We are including Automatic Assessment Image Processing (AI SDK) in MVP with a staff review gate.

---

## Foundation & Tooling

- [ ] FT-01 Ultracite setup across workspaces (S)
  - DoD: `npx ultracite init` at repo root; add scripts `check`/`fix`; zero errors on initial run; document usage in README.
  - Paths: `package.json`, `biome.json`, `README.md`.

- [ ] FT-02 Repo lint/format CI (S)
  - DoD: Add CI job to run `ultracite check` and typecheck on PRs; fails on a11y/TS violations.
  - Paths: `.github/workflows/ci.yml` (or `turbo` pipeline).

- [ ] FT-03 Environment scaffolding (S)
  - DoD: `.env.example` synchronized across apps; required keys listed; dev `.env` bootstrapped.
  - Paths: `apps/web/.env.example`, `apps/server/.env.example`, `packages/*/.env.example`.

- [ ] FT-04 Design tokens and theme primitives (S)
  - DoD: Centralize colors/spacing/typography; export via `@idna/ui` or local `apps/web/src/lib/theme`.
  - Paths: `apps/web/src/lib/`, `apps/web/src/index.css`.

---

## Authentication & Access Control

- [ ] AUTH-01 Google OAuth provider (S)
  - DoD: Enable Google in `better-auth`; callback works locally; user record persisted in `user` table.
  - Paths: `packages/auth/src/index.ts`, `apps/web/src/lib/auth-client.ts`.

- [ ] AUTH-02 Session & role model (S)
  - DoD: Add roles enum (student, coach, admin); assign default=student; expose role in session context.
  - Paths: `packages/db/src/schema/auth.ts`, `packages/api/src/context.ts`.

- [ ] AUTH-03 Coach access rules (M)
  - DoD: Server guards so coaches can only access assigned students; unit tests for allow/deny.
  - Paths: `apps/server/src/api/`, `packages/api/src/routers/*`.

---

## Database & Schema (Drizzle)

- [x] DB-01 Core entities (M)
  - DoD: Tables for `students`, `coaches`, `coach_assignments`, with created/updated timestamps.
  - Paths: `packages/db/src/schema/*.ts`.

- [x] DB-02 Life stories (S)
  - DoD: `stories` (id, student_id, prompt_key, content_richtext, is_draft, word_count, created_at, updated_at).
  - Paths: `packages/db/src/schema/stories.ts`.

- [x] DB-03 Documents (S)
  - DoD: `documents` (id, student_id, category enum, storage_key, filename, size_bytes, mime, uploaded_at).
  - Paths: `packages/db/src/schema/documents.ts`.

- [x] DB-04 Assessments catalog (S)
  - DoD: `assessment_types` (id, slug, name, required:boolean, fields_json schema, provider_url).
  - Paths: `packages/db/src/schema/assessments.ts`.

- [x] DB-05 Assessment submissions (M)
  - DoD: `assessment_uploads` (id, student_id, type_id, storage_key, status enum: uploaded|processing|needs_review|approved|rejected, submitted_at).
  - Paths: `packages/db/src/schema/assessments.ts`.

- [x] DB-06 Assessment results (M)
  - DoD: `assessment_results` (id, upload_id, type_id, results_json, confidence_pct, reviewed_by, reviewed_at).
  - Paths: `packages/db/src/schema/assessments.ts`.

- [x] DB-07 AI usage/audit (S)
  - DoD: `ai_calls` (id, provider, model, tokens_in, tokens_out, cost_minor_units, status, created_at) linked to upload_id.
  - Paths: `packages/db/src/schema/ai.ts`.

- [x] DB-08 Progress tracking (S)
  - DoD: `progress` (student_id PK, completed_profile:boolean, uploaded_assessments:int, uploaded_documents:int, stories_count:int, percent_complete:int).
  - Paths: `packages/db/src/schema/progress.ts`.

- [x] DB-09 Migrations & scripts (S)
  - DoD: Generate and run migrations; `bun run db:generate`, `db:push`, `db:migrate` work from root.
  - Paths: `packages/db/drizzle.config.ts`, root scripts.

---

## Storage & Files

- [ ] STOR-01 Storage provider abstraction (S)
  - DoD: Interface `StorageService` with `put`, `getSignedUrl`, `delete`; S3 implementation.
  - Paths: `apps/server/src/lib/storage.ts`.

- [ ] STOR-02 Frontend upload widget (S)
  - DoD: Drag‑and‑drop + picker; 10 MB limit; mime whitelist (jpg/png/pdf); previews; a11y complete.
  - Paths: `apps/web/src/components/upload/*`.

---

## API (oRPC/Hono)

- [ ] API-01 Context wiring (S)
  - DoD: Expose session and role in oRPC context; health route green.
  - Paths: `packages/api/src/context.ts`, `packages/api/src/index.ts`.

- [ ] API-02 Life stories CRUD (S)
  - DoD: `list/create/update/delete` with validation; ownership checks; returns paginated results.
  - Paths: `packages/api/src/routers/stories.ts`, server binding in `apps/server/src/api/`.

- [ ] API-03 Documents list & delete (S)
  - DoD: List metadata; soft delete; signed URL generation for view.
  - Paths: `packages/api/src/routers/documents.ts`.

- [ ] API-04 Assessments catalogue (S)
  - DoD: List assessment types; mark required/optional; link to provider_url.
  - Paths: `packages/api/src/routers/assessments.ts`.

- [ ] API-05 Assessment upload intake (M)
  - DoD: Create `assessment_upload` record, accept file, store via `StorageService`, return status `uploaded`.
  - Paths: `apps/server/src/api/assessments/upload.ts`.

- [ ] API-06 AI processing trigger (S)
  - DoD: On successful upload, enqueue background job (or call inline in dev) to start AI extraction; idempotent.
  - Paths: `apps/server/src/api/assessments/upload.ts`, `apps/server/src/jobs/ai_ingest.ts`.

- [ ] API-07 Results read & status (S)
  - DoD: Endpoint to fetch results for a student; include status + confidence.
  - Paths: `packages/api/src/routers/assessmentResults.ts`.

- [ ] API-08 Coach roster (S)
  - DoD: List students assigned to coach; simple pagination and search.
  - Paths: `packages/api/src/routers/coach.ts`.

---

## Automatic Assessment Image Processing (AI SDK)

- [ ] AI-01 Provider interface (S)
  - DoD: Define `AssessmentExtractor` with `extract(upload: Buffer, type: AssessmentType): Promise<ExtractedResult>`; adapters for OpenAI Vision and AWS Textract; provider chosen via env.
  - Paths: `apps/server/src/ai/providers/*`.

- [ ] AI-02 Structured schema & prompts (M)
  - DoD: JSON schemas per assessment (e.g., 16Personalities, Big Five, DISC); system prompts/instructions to produce strict JSON; unit tests against sample images.
  - Paths: `apps/server/src/ai/schemas/*`, `apps/server/test/ai/*`.

- [ ] AI-03 Ingest job worker (M)
  - DoD: Job reads `assessment_uploads` with `uploaded` status, downloads file, calls provider, validates JSON, writes `assessment_results`, updates status `needs_review`.
  - Paths: `apps/server/src/jobs/ai_ingest.ts`.

- [ ] AI-04 Confidence & fallback (S)
  - DoD: If confidence < threshold or schema invalid → remain `needs_review`; else mark `needs_review` with low‑confidence flag for staff.
  - Paths: `apps/server/src/ai/normalize.ts`.

- [ ] AI-05 Cost & usage tracking (S)
  - DoD: Record tokens/cost in `ai_calls`; daily/weekly summary endpoint for admins.
  - Paths: `packages/db/src/schema/ai.ts`, `packages/api/src/routers/aiUsage.ts`.

- [ ] AI-06 PII redaction pass (S)
  - DoD: Optional OCR redaction of names/emails if present; store redaction flags; config toggle via env.
  - Paths: `apps/server/src/ai/redact.ts`.

---

## Staff Review Console (Admin)

- [ ] AR-01 Admin route & auth gate (S)
  - DoD: `/admin` layout; only admin role can access.
  - Paths: `apps/web/src/app/admin/layout.tsx`.

- [ ] AR-02 Review queue list (S)
  - DoD: Table of `assessment_uploads` with status, student, type, submitted_at, confidence; filters.
  - Paths: `apps/web/src/app/admin/assessments/page.tsx`.

- [ ] AR-03 Side‑by‑side review (M)
  - DoD: Viewer shows original image/PDF preview and parsed JSON rendered nicely; edit form with validation; Approve/Reject.
  - Paths: `apps/web/src/app/admin/assessments/[id]/page.tsx`.

- [ ] AR-04 Audit trail (S)
  - DoD: Persist reviewer id, changes diff, timestamp; visible in activity panel.
  - Paths: `packages/db/src/schema/ai.ts`, `apps/web/src/components/admin/Activity.tsx`.

---

## Student UI

- [ ] UI-01 Journey dashboard shell (M)
  - DoD: 5‑step tracker, completion ring, CTA cards with sample data; responsive on tablet/desktop; a11y complete.
  - Paths: `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/components/journey/*`.

- [ ] UI-02 Assessment hub (M)
  - DoD: List assessment types, external links, instructions modal per card, upload button with status chips.
  - Paths: `apps/web/src/app/assessments/page.tsx`, `apps/web/src/components/assessments/*`.

- [ ] UI-03 Life story editor (M)
  - DoD: Prompt selector, basic rich text (bold/italic/bullets), autosave draft, list with previews and timestamps.
  - Paths: `apps/web/src/app/stories/*`.

- [ ] UI-04 Document uploads (S)
  - DoD: Category picker, upload control, thumbnails, deletion with confirmation; 10 MB enforcement.
  - Paths: `apps/web/src/app/documents/*`.

- [ ] UI-05 iDNA dashboard (M)
  - DoD: Assessment cards, story highlights, documents panel, next steps, overall completion; charts with placeholder data.
  - Paths: `apps/web/src/app/idna/page.tsx`, `apps/web/src/components/charts/*`.

- [ ] UI-06 Coach view (S)
  - DoD: Read‑only student dashboard; “Coach View: [Student]” header; no edit/upload controls.
  - Paths: `apps/web/src/app/coach/[studentId]/page.tsx`.

---

## Frontend ↔ Backend Wiring

- [ ] INT-01 Client API utils (S)
  - DoD: `apps/web/src/utils/api.ts` exposes typed clients for routers; error boundaries in pages.
  - Paths: `apps/web/src/utils/api.ts`.

- [ ] INT-02 Replace mocks on journey (S)
  - DoD: Dashboard pulls real progress from `progress` endpoint; optimistic updates on completion.
  - Paths: `apps/web/src/app/dashboard/page.tsx`.

- [ ] INT-03 Upload flow E2E (M)
  - DoD: Upload → storage → create `assessment_upload` → AI job → status updates; UI shows pending/needs_review/approved.
  - Paths: UI + API + jobs (see above).

- [ ] INT-04 Results rendering (S)
  - DoD: Approved results appear on student dashboard cards; confidence badge; last updated stamp.
  - Paths: `apps/web/src/components/assessments/AssessmentCard.tsx`.

---

## Deployment & Ops

- [ ] OPS-01 Frontend hosting (M)
  - DoD: Deploy `apps/web` (e.g., AWS Amplify); env vars set; preview deployments enabled; HTTPS.
  - Paths: Amplify config files, project settings.

- [ ] OPS-02 Backend hosting (M)
  - DoD: Deploy `apps/server` (e.g., AWS Elastic Beanstalk or similar); healthcheck; logs streaming; autoscale min=1.
  - Paths: `apps/server/Dockerfile` or EB config.

- [ ] OPS-03 Worker process (S)
  - DoD: Separate process for `ai_ingest` job (EB worker or PM2); documented start command.
  - Paths: `apps/server/package.json` scripts, Procfile.

- [ ] OPS-04 Secrets management (S)
  - DoD: All secrets from env store; no secrets in repo; rotation notes in README.
  - Paths: `.env*`, deployment env config.

- [ ] OPS-05 Observability (S)
  - DoD: Error monitoring and request logging (PII‑safe); AI job metrics dashboard: queue depth, success rate, avg cost.
  - Paths: `apps/server/src/lib/logger.ts`, metrics wiring.

---

## QA, Accessibility, Compliance

- [ ] QA-01 E2E happy paths (M)
  - DoD: Playwright tests for student journey, upload + AI processing + review, and coach view access.
  - Paths: `apps/web/tests/e2e/*`.

- [ ] QA-02 A11y sweep (S)
  - DoD: Ultracite/axe scans pass; no forbidden ARIA/roles; keyboard traps eliminated; tab order correct.
  - Paths: UI components.

- [ ] QA-03 Security baseline (S)
  - DoD: RLS/row‑level checks simulated via tests; S3 buckets private; signed URLs time‑limited; no `console.*` in production build.
  - Paths: server tests, config.

- [ ] QA-04 Performance sanity (S)
  - DoD: Largest pages < 200 KB JS after gzip; charts lazy‑loaded; image components use `next/image`.
  - Paths: Next.js config, components.

---

## Documentation

- [ ] DOC-01 Runbook (S)
  - DoD: README sections for setup, scripts, env, local dev, and deployment.
  - Paths: `README.md`.

- [ ] DOC-02 AI pipeline ADR (S)
  - DoD: Architecture Decision Record documenting provider choice, schema strategy, cost controls, and fallback plan.
  - Paths: `docs/adr/0001-ai-pipeline.md`.

- [ ] DOC-03 Data model overview (S)
  - DoD: Mermaid ER diagram and table glossary.
  - Paths: `docs/data-model.md`.

---

## Backlog (Future/Nice‑to‑Have)

- [ ] BL-01 Mobile optimization pass.
- [ ] BL-02 Export to PDF/CSV.
- [ ] BL-03 Advanced analytics and cohort comparisons.
- [ ] BL-04 Additional auth providers (Apple/Microsoft) if needed.

---

## Quick Start Order of Execution
1) FT‑01, FT‑03 → DB‑01..DB‑09 → AUTH‑01..03 → STOR‑01 → API‑01..05 → UI‑01..04 → AI‑01..03 → INT‑03
2) AR‑01..03 → INT‑04 → UI‑05..06 → OPS‑01..03 → QA‑01..04 → DOC‑01..03
