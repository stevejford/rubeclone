# Rubeclone Refactor Proposal

Last updated: 2025-09-28

## Executive Summary

The codebase is close to feature-complete for the AI Tool Marketplace and Composio integration, but reliability is blocked by NaN/invalid workspace IDs flowing into DB mutations and by duplicated/partially divergent Composio integration layers. This plan hardens ID handling end-to-end, unifies integration surfaces, and reduces cross‑layer drift and duplication. Outcome: eliminate NaN write paths, simplify API surfaces, and improve maintainability/testability.

## Key Findings (from code review + issues.md)

1) NaN workspace IDs reach the database
- Evidence: issues.md shows `invalid input syntax for type integer: "NaN"` on INSERTs to `workspaces`.
- Code risks:
  - `lib/db/queries.ts#createWorkspace` passes `owner_id` directly (`workspaceData.owner_id || workspaceData.ownerId`) without normalization. If caller sends `NaN`/undefined/empty string, this can persist to SQL.
  - Several API schemas use `z.string().transform(Number)` which returns `NaN` for non‑numeric input and then proceeds unless explicitly checked.
  - Some routes validate `params.id` with `parseInt`, but this is not consistently enforced at the schema boundary.

2) Two Composio integration paths are active
- Files: `lib/composio.ts` (HTTP client) and `lib/composio-mcp.ts` (@composio/core SDK).
- API usage is mixed: `/api/composio/connect` uses MCP client; `/api/composio/callback` uses HTTP client (`completeConnection`). This split increases chance of state/contract drift.

3) Cross‑layer duplication and normalization drift
- Repeated permission checks and ID parsing across API routes.
- Frontend normalizers (e.g., use-workspace.ts) adapt snake_case to camelCase on the fly.

## Refactor Goals

- G1: Zero NaN paths for IDs (compile- and run-time enforcement).
- G2: Single source of truth for Composio flows (initiate, complete, status).
- G3: Centralized request validation, permission checks, and ID parsing utilities.
- G4: Stronger typing at the boundary (zod + branded ID types) and consistent field naming on the frontend.

## Recommended Changes

### A. ID Handling and Validation

1) Export and reuse a single `parseIdStrict` utility
- Create `lib/utils/ids.ts` with:
  - `parseIdStrict(value, name): number` → throws if not a positive integer.
  - `zId()` helper: `z.preprocess(v => Number(v), z.number().int().positive())` for zod schemas.
- Replace all manual `parseInt`/`Number()` in API routes with `parseIdStrict`.

2) Harden DB mutation entry points
- In `lib/db/queries.ts#createWorkspace`, run `owner_id: parseId(owner_id)` and throw a descriptive error when invalid. Do not pass through any unvalidated ID.
- Ensure all functions that accept `workspaceId`/`userId` validate via `parseId` before building SQL values (even if callers validated earlier).

3) Strengthen API schemas
- Replace `z.string().transform(Number)` with `z.preprocess` pattern and `refine(Number.isFinite, 'Invalid numeric ID')`.
- Example:
  ```ts
  const idSchema = z.preprocess(v => Number(v), z.number().int().positive())
  const connectRequestSchema = z.object({
    workspaceId: idSchema,
    toolkit: z.string().min(1).max(50),
    source: z.enum(['marketplace','workspace']).default('workspace')
  })
  ```

4) Add a thin route helper
- `lib/api/withWorkspace.ts` exposing `requireWorkspaceMember(req, params)` and `requireWorkspaceAdmin(req, params)` that:
  - Validates `params.id` with `parseIdStrict`.
  - Loads session once.
  - Checks membership/role centralizing the permission logic currently duplicated in multiple routes.

### B. Composio Integration Unification

5) Choose one integration surface (recommended: `lib/composio.ts` HTTP client) and deprecate the other
- Rationale: One code path reduces state handling discrepancies. The HTTP client already models initiate/complete/status flows and multi‑tenant user IDs.
- Actions:
  - Update `/api/composio/connect` to call `initiateConnection` from `lib/composio.ts` (not `lib/composio-mcp.ts`).
  - Update any MCP‑only APIs (e.g., default tools, auth config creation) to live behind `lib/composio.ts` to keep a single facade.
  - If MCP SDK is preferred, invert: port `completeConnection` and `getConnectionStatus` to `lib/composio-mcp.ts` and remove the HTTP client.

6) Single state/metadata format
- Ensure the exact same state encoding/decoding is used for both initiate and callback. Currently, `connect` and `callback` use different helpers. Consolidate to one function exported from the chosen integration module.

### C. Frontend Consistency and Safety

7) Strongly type workspace IDs in client code
- Introduce a `WorkspaceId` branded type and ensure hooks/components accept `WorkspaceId | string` but convert immediately using `Number()` and guard (`if (!Number.isInteger(...)) return;`).
- In `WorkspaceProvider`, when restoring from `localStorage`, validate before calling `switchWorkspace`.

8) Normalize server payloads at the boundary
- Prefer returning camelCase fields from API routes to eliminate repeated client-side normalization (e.g., `tool_slug` → `toolSlug`). If DB columns are snake_case, map at route layer.

### D. Reliability, Observability, and DX

9) Add structured logging for ID flow
- Add a `requestId` per request and log `{route, requestId, userId, workspaceId, phase}` at key steps (parse → authorize → query). This will pinpoint the NaN source quickly if it reoccurs.

10) Add tests covering invalid ID inputs
- Unit: `parseIdStrict`, `idSchema`.
- API: POST/GET/DELETE under `/api/workspaces/:id/...` reject non‑numeric, negative, empty, or missing IDs.

11) Kill duplicated permission logic
- Implement `withWorkspaceAuth(req, params, role: 'member'|'admin')` and use across routes to reduce drift.

## Targeted Code Changes (high-impact)

1) lib/db/queries.ts → createWorkspace
- Before:
  ```ts
  owner_id: workspaceData.owner_id || workspaceData.ownerId
  ```
- After:
  ```ts
  const ownerId = parseId(workspaceData.owner_id ?? workspaceData.ownerId)
  owner_id = ownerId
  ```
  And fail fast with a clear error message on invalid.

2) API schemas using Number transform
- Replace:
  ```ts
  z.string().transform(Number)
  ```
  With:
  ```ts
  z.preprocess(v => Number(v), z.number().int().positive())
  ```
  And, if necessary, `.refine(Number.isFinite, 'Invalid numeric ID')`.

3) Unify Composio flows
- `/api/composio/connect` should call the same module that `/api/composio/callback` completes with.
- Export `generateSecureState` from that module and reuse.

4) Route helpers
- Add `lib/api/guards.ts` with `requireSession()`, `requireWorkspaceMember()`, `requireWorkspaceAdmin()` to remove repetition and ensure consistent parsing & authorization.

## Rollout Plan

1. Implement `parseIdStrict` + schema updates; patch `createWorkspace` and any mutation paths to require validated IDs.
2. Replace Number transforms in connect/connect-api-key schemas.
3. Introduce route helpers and refactor 2–3 routes first (`workspaces/:id`, `workspaces/:id/tools`).
4. Unify Composio integration (pick HTTP client or MCP SDK) and update connect/callback to use the same.
5. Add minimal unit and API tests for ID validation and a single happy-path connect flow.

## Risks & Mitigations

- Risk: Changing schema validation may reject previously accepted but invalid requests.
  - Mitigation: Log rejections with request details, add temporary warnings.
- Risk: Integration unification may require small UI changes (OAuth dialog expects redirect URL timing).
  - Mitigation: Keep identical return shapes; add e2e check for OAuth popup handshake.

## Mapping to issues.md

- (1) NaN Workspace ID DB errors → Addressed by A.1–A.3, D.9–D.10, Targeted change #1–#2.
- (2) Workspace management issues → Route helpers, stricter ID types, and consistent payload normalization.
- (3–8) OAuth fixes already landed → Protected by unification and tests.

---

If you want, I can implement the high‑impact patches (parseIdStrict utility, createWorkspace hardening, zod schema fixes, and connect/callback unification) in a PR.
