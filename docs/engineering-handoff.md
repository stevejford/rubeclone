 # Engineering Handoff — SDK-first Unification (PR‑1)
 
 Date: 2025-09-28
 Status: Approved to implement
 Decision: Use @composio/core SDK as the single integration surface and deprecate lib/composio.ts
 
 ## Goals
 - G1: Zero NaN/invalid IDs reaching DB/queries.
 - G2: One integration facade wrapping @composio/core for connect/callback/status/tools.
 - G3: Centralized validation/permission guards for routes.
 - G4: Tests + logging to verify flows end-to-end.
 
 ## Prerequisites
 - Node ≥ v19; Next 14 project.
 - Ensure env: NEXTAUTH_URL=http://localhost:3001 and dev server on 3001.
 - COMPOSIO_API_KEY set in .env.local (do not commit).
 - Pin SDK: @composio/core@^0.1.53 (already in package.json).
 
 ## Task Breakdown (PR‑1)
 
 1) Utilities (IDs)
 - Add file: lib/utils/ids.ts
   - export function parseIdStrict(value: unknown, name: string): number
     - Converts strings/numbers, requires integer > 0; throws with `${name} must be a positive integer`.
   - export const zId = () => z.preprocess(v => Number(v), z.number().int().positive())
   - export const idParamSchema = z.string().regex(/^\d+$/).transform(s => Number(s))
 
 2) Route Guards
 - Add file: lib/api/guards.ts
   - export async function requireSession(req: NextRequest): Promise<{ userId: number }>
   - export async function requireWorkspaceMember(req: NextRequest, params: { id: string }): Promise<{ userId: number; workspaceId: number }>
   - export async function requireWorkspaceAdmin(req: NextRequest, params: { id: string }): Promise<{ userId: number; workspaceId: number }>
   - Each uses parseIdStrict/idParamSchema, calls getServerSession(getAuthOptions()), and centralizes membership/role checks (via queries.ts helpers).
 
 3) DB Hardening
 - File: lib/db/queries.ts
   - In createWorkspace(...): normalize and validate owner_id with existing parseId, but reject undefined/NaN early; add descriptive error logging before insert.
   - Ensure all exported fns that accept workspaceId/userId continue to use parseId and never pass raw values to SQL builders.
 
 4) API Schema Fixes
 - File: app/api/composio/connect/route.ts
   - Replace z.string().transform(Number) with zId() in schema.
   - Use guards where helpful; ensure toolkit still validated via isValidToolkit.
 - Files: app/api/workspaces/[id]/route.ts and app/api/workspaces/[id]/tools/route.ts
   - Replace ad‑hoc parseInt with idParamSchema/parseIdStrict and/or guards.
 
 5) Composio SDK Facade
 - Add file: lib/composioClient.ts
   - export type ComposioConnectionResult = { redirectUrl: string; state: string; connectionId?: string }
   - export type ComposioConnectionStatus = { isConnected: boolean; connectionId?: string; connectedAccount?: string; lastSync?: Date; status: 'connected'|'disconnected'|'error'|'expired' }
   - export class ComposioClient {
       constructor(apiKey = aiConfig().composio.apiKey)
       ensureAuthConfig(app: string): Promise<{ id: string }>
       linkOAuth(userId: string, app: string, callbackUrl: string, state: string): Promise<ComposioConnectionResult>
       initiateApiKey(userId: string, app: string, kv: Record<string,string>): Promise<{ connectionId: string }>
       getConnectionStatus(userId: string, toolkit: string): Promise<ComposioConnectionStatus>
       encodeState(userId: string, workspaceId: string, toolkit: string, source: 'workspace'|'marketplace'): string
       decodeState(state: string): { userId: string; workspaceId: string; toolkit: string; source: 'workspace'|'marketplace'; timestamp: number }
     }
   - Internals: use @composio/core methods (authConfigs.create/list, connectedAccounts.link/initiate, connectedAccounts.list) per the installed version.
 
 6) Connect/Callback Migration
 - app/api/composio/connect/route.ts
   - Import and use new ComposioClient facade; remove lib/composio-mcp specific calls for link initiation.
   - Use client.encodeState to generate state; return redirectUrl and state.
 - app/api/composio/callback/route.ts
   - Import and use the same facade; use client.decodeState for validation.
   - Complete connection via SDK (if applicable with current version) or, if not required, rely on status + enableWorkspaceTool with connection metadata.
   - Preserve marketplace postMessage success/close and workspace redirect behavior.
 
 7) Deprecate Custom HTTP Client
 - Remove direct uses of lib/composio.ts in routes/components.
 - Keep file until PR‑2 for safe rollback; add a deprecation header comment.
 
 8) Logging
 - Add simple requestId (Date.now()+Math.random()) per request in routes; log { route, requestId, userId, workspaceId } at key steps.
 - Log parseIdStrict rejections and guard denials with context.
 
 ## Acceptance Criteria
 - No `NaN`/invalid IDs reach DB: inserting/updating workspaces or workspace_tools never triggers "invalid input syntax for type integer".
 - /api/composio/connect returns a valid redirectUrl/state; popup flow completes and updates workspace_tools; marketplace closes via postMessage.
 - API key flow validates → connects → tool enabled with connection metadata.
 - Only @composio/core facade is used by connect/callback.
 - Unit tests pass; build succeeds.
 
 ## Test Plan
 - Unit
   - ids: parseIdStrict, zId, idParamSchema (valid/invalid cases).
   - guards: requireWorkspaceMember/Admin with mocked queries and sessions.
 - Integration (local)
   - Start dev on 3001; ensure NEXTAUTH_URL set.
   - Marketplace: trigger OAuth, receive popup, complete callback, verify tool enabled.
   - API key: test, connect, verify tool enabled.
 - Smoke
   - Switch workspaces repeatedly; verify no NaN errors in server console or DB.
 
 ## Commands
 - npm run type-check
 - npm run build
 - npm run dev
 
 ## Rollback Plan
 - If SDK facade blocks progress, temporarily switch connect/callback back to previous working path, but keep ID/guard hardening.
 - Keep lib/composio.ts until PR‑2; feature flag the facade if needed.
 
 ## Notes
 - Keep env files out of git. Validate COMPOSIO_API_KEY at startup; fail fast with a clear error.
 - Ensure origin checks remain in OAuth dialog (already implemented).
 
 ---
 
 For broader context and phased roadmap, see docs/refactor-plan-composio.md.