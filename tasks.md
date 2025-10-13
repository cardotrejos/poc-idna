# iDNA MVP Tasks Backlog (October 2025)

Progress Log (newest first)
- 2025-10-13 — Journey dashboard + Stories + Progress API + TS fixes
  - Completed: UI-01 Journey dashboard shell (progress ring, 5-step tracker, CTA cards)
  - Completed: API-02 Life stories CRUD (list/create/update/delete with ownership checks)
  - Completed: INT-02 Replace mocks on journey — dashboard wired to real progress (orpc.progress.getMy) with invalidation on uploads/stories
  - Completed: /stories page (basic) — prompt selector, textarea editor, list with timestamps and delete
  - Completed: TypeScript errors resolved in Admin pages and API routers (admin assessments/students)
  - Notes: UI-03 Life story editor still needs rich text and autosave to meet full DoD
- 2025-10-11 — Auth parity, Documents + Assessments, R2 fixed, seed users
  - Completed: Auth redirect parity with schedule-agent (login/dashboard), header/sidebar cleanup
  - Completed: Removed Todos (UI + API) and dropped DB table via migration 0002_drop_todo
  - Completed: Documents E2E — uploader, lists (student/admin/coach), view + delete, sidebar link
  - Completed: Assessments hub — types seeded (16Personalities, RIASEC, Keirsey, StrengthsProfile, HEXACO), upload, view, per-type status
  - Completed: Coach/Admin pages (students list, student documents); header links for roles
  - Completed: R2 upload 403 resolved (token scope); storage adapter supports virtual-host style; added diagnostics
  - Completed: Seed admin/coach users (cardotrejos+1, cardotrejos+2)
  - Notes: Documents delete is hard-delete (DB + R2). Soft-delete can be added later if needed
- 2025-10-11 — Removed Todos; added Assessments hub to sidebar
  - Completed: removed /todos route and API router binding; sidebar now links to /dashboard/assessments
  - Completed: Assessments page shows types, per-type uploads, and opens signed preview URLs
  - Notes: student results still render on the Dashboard via AssessmentList; API todo router file kept but unused
- 2025-10-11 — Documents upload + listings
  - Completed: DocumentUploader component (drag/drop JPG/PNG/PDF), category select
  - Completed: API routes /uploads/documents (upload) and /uploads/documents/:id/url (signed preview)
  - Completed: orpc.documents.{listMy,listForStudent}; My Documents page at /dashboard/documents
  - Completed: Admin/Coach student docs view at /admin/students/[id]/documents
  - Notes: status shown as "uploaded" (no review flow yet)
- 2025-10-11 — Per-type uploads list on Assessment Hub
  - Completed: shows last uploads (status badge, date) and a View action that opens a presigned URL
  - Notes: capped to 5 entries per card; “View” uses signed URL endpoint with credentials

Next Session Ideas
- [ ] AH-UX-01 Show more/less toggle if a type has >5 uploads.
- [ ] AH-UX-02 Allow students to delete their own uploads (with confirm + backend delete + R2 cleanup).
- [ ] AH-UX-03 In-place per-file upload progress (progress bars) during batch upload.
- 2025-10-11 — Multiple file selection per type
  - Completed: multi-select + multi-drop, preview grid with remove buttons, batch upload
  - Notes: uploads sent sequentially to maintain predictable server load
- 2025-10-11 — Uploader preview before submission
  - Completed: image/PDF preview with Upload/Clear buttons; accessible labels
  - Notes: Preview uses object URLs and is revoked on clear/upload; preserves 10MB + type limits
- 2025-10-11 — Per-type guidance on Assessment Hub
  - Completed: inline instructions block under each type; reads `fieldsJson.instructions` when present, otherwise shows default steps
  - Notes: Edit instructions via DB `assessment_types.fields_json.instructions`
- 2025-10-11 — Assessment Hub upload UI
  - Completed: STOR-02 (drag-and-drop uploader), API-04 (assessments list), student upload status on page
  - Notes: File types JPG/PNG/PDF, 10MB max; opens external provider link in new tab with rel=noopener; status inferred from my uploads
- 2025-10-11 — Student dashboard shows results
  - Completed: INT-04 (approved results render on dashboard with confidence + timestamps)
  - Notes: Uses orpc.studentAssessments.listApproved; JSON preview is collapsed block; shows 0 results if none approved
- 2025-10-11 — Role-based UI gating
  - Completed: UI-Role-01 hook + header update; Admin link shown only for admins
  - Next up: INT-04 (render approved results on student dashboard)
  - Notes: Uses auth session.role; no visible changes for non-admins
- 2025-10-11 — Staff Review Console shipped
  - Completed: AR-01 (admin auth gate), AR-02 (review queue), AR-03 (detail view + edit/approve/reject)
  - Completed earlier in session: STOR-01 (R2 storage), API-05 (upload intake), API-09 (preview URL), INT-03 (upload→AI), AI-01 (provider iface), AI-02 (schemas + basic tests), AUTH-01..03
  - Next up: UI-Role-01 (role-based UI gating), INT-04 (render approved results on student dashboard)
  - Notes: Configure R2_* and GOOGLE_GENERATIVE_AI_API_KEY in apps/server/.env; admin role required for /admin

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

- [x] AUTH-01 Google OAuth provider (S)
  - DoD: Enable Google in `better-auth`; callback works locally; user record persisted in `user` table.
  - Paths: `packages/auth/src/index.ts`, `apps/web/src/lib/auth-client.ts`.

- [x] AUTH-02 Session & role model (S)
  - DoD: Add roles enum (student, coach, admin); assign default=student; expose role in session context.
  - Paths: `packages/db/src/schema/auth.ts`, `packages/api/src/context.ts`.

- [x] AUTH-03 Coach access rules (M)
  - DoD: Server guards so coaches can only access assigned students; unit tests for allow/deny.
  - Paths: `packages/api/src/guards.ts`, `packages/api/src/context.ts`.

## UI Guardrails

- [x] UI-Role-01 Role-based UI gating (S)
  - DoD: Hide coach/admin-only nav and actions when `session.user.role` lacks required role; add simple hook `useHasRole` and conditional rendering; add smoke test.
  - Paths: `apps/web/src/components/header.tsx`, `apps/web/src/lib/auth-client.ts`, `apps/web/src/hooks/use-has-role.ts`.

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

- [x] STOR-01 Storage provider abstraction (S)
  - DoD: Interface `StorageService` with `put`, `getSignedUrl`, `delete`; S3 implementation.
  - Paths: `apps/server/src/lib/storage.ts`.

- [x] STOR-02 Frontend upload widget (S)
  - DoD: Drag‑and‑drop + picker; 10 MB limit; mime whitelist (jpg/png/pdf); previews; a11y complete.
  - Paths: `apps/web/src/components/upload/*`.

---

## API (oRPC/Hono)

- [x] API-01 Context wiring (S)
  - DoD: Expose session and role in oRPC context; health route green.
  - Paths: `packages/api/src/context.ts`, `packages/api/src/index.ts`.

- [x] API-02 Life stories CRUD (S)
  - DoD: `list/create/update/delete` with validation; ownership checks; returns paginated results.
  - Paths: `packages/api/src/routers/stories.ts`, server binding in `apps/server/src/api/`.

- [x] API-03 Documents list & delete (S)
  - DoD: List metadata; soft delete; signed URL generation for view.
  - Paths: `packages/api/src/routers/documents.ts`.

- [x] API-04 Assessments catalogue (S)
  - DoD: List assessment types; mark required/optional; link to provider_url.
  - Paths: `packages/api/src/routers/assessments.ts`.

- [x] API-05 Assessment upload intake (M)
  - DoD: Create `assessment_upload` record, accept file, store via `StorageService`, return status `uploaded`.
  - Paths: `apps/server/src/api/assessments/upload.ts`.

- [x] API-09 Assessment preview URL (S)
  - DoD: GET `/uploads/assessments/:id/url` returns presigned URL; access limited to self, assigned coach, or admin.
  - Paths: `apps/server/src/api/assessments/preview.ts`.

- [ ] API-06 AI processing trigger (S)
  - DoD: On successful upload, enqueue background job (or call inline in dev) to start AI extraction; idempotent.
  - Paths: `apps/server/src/api/assessments/upload.ts`, `apps/server/src/jobs/ai_ingest.ts`.

- [ ] API-07 Results read & status (S)
  - DoD: Endpoint to fetch results for a student; include status + confidence.
  - Paths: `packages/api/src/routers/assessmentResults.ts`.

- [x] API-08 Coach roster (S)
  - DoD: List students assigned to coach; simple pagination and search.
  - Paths: `packages/api/src/routers/coachStudents.ts`, `packages/api/src/routers/adminStudents.ts`.

---

## Automatic Assessment Image Processing (AI SDK)

- [x] AI-01 Provider interface (S)
  - DoD: Define `AssessmentExtractor` with `extract(upload: Buffer, type: AssessmentType): Promise<ExtractedResult>`; adapters for OpenAI Vision and AWS Textract; provider chosen via env.
  - Paths: `apps/server/src/ai/providers/*`.

- [x] AI-02 Structured schema & prompts (M)
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

- [x] AR-01 Admin route & auth gate (S)
  - DoD: `/admin` layout; only admin role can access.
  - Paths: `apps/web/src/app/admin/layout.tsx`.

- [x] AR-02 Review queue list (S)
  - DoD: Table of `assessment_uploads` with status, student, type, submitted_at, confidence; filters.
  - Paths: `apps/web/src/app/admin/assessments/page.tsx`.

- [x] AR-03 Side‑by‑side review (M)
  - DoD: Viewer shows original image/PDF preview and parsed JSON rendered nicely; edit form with validation; Approve/Reject.
  - Paths: `apps/web/src/app/admin/assessments/[id]/page.tsx`.

- [ ] AR-04 Audit trail (S)
  - DoD: Persist reviewer id, changes diff, timestamp; visible in activity panel.
  - Paths: `packages/db/src/schema/ai.ts`, `apps/web/src/components/admin/Activity.tsx`.

---

## Student UI

- [x] UI-01 Journey dashboard shell (M)
  - DoD: 5‑step tracker, completion ring, CTA cards with sample data; responsive on tablet/desktop; a11y complete.
  - Paths: `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/components/journey/*`.

- [x] UI-02 Assessment hub (M)
  - DoD: List assessment types, external links, instructions modal per card, upload button with status chips.
  - Paths: `apps/web/src/app/dashboard/assessments/page.tsx`, `apps/web/src/components/assessments/*`.

- [~] UI-03 Life story editor (M)
  - DoD: Prompt selector, basic rich text (bold/italic/bullets), autosave draft, list with previews and timestamps.
  - Status: Partial — prompt selector + textarea + list + delete are in; rich text and autosave pending.
  - Paths: `apps/web/src/app/stories/*`.

- [x] UI-04 Document uploads (S)
  - DoD: Category picker, upload control, thumbnails, deletion with confirmation; 10 MB enforcement.
  - Paths: `apps/web/src/app/dashboard/documents/page.tsx`, `apps/web/src/components/upload/DocumentUploader.tsx`.

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

- [x] INT-02 Replace mocks on journey (S)
  - DoD: Dashboard pulls real progress from `progress` endpoint; optimistic updates on completion.
  - Paths: `apps/web/src/app/dashboard/page.tsx`.

- [x] INT-03 Upload flow E2E (M)
  - DoD: Upload → storage → create `assessment_upload` → AI job → status updates; UI shows pending/needs_review/approved.
  - Paths: UI + API + jobs (see above).

- [x] INT-04 Results rendering (S)
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
