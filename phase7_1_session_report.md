# PHASE 7 — STAGE 1: PERSISTENT AGENT SESSION REPORT

**Project:** EasySalon AI Agent (`GloPro`)  
**Stage:** Stage 1 — Persistent Agent Session  
**Date:** 2026-09-10  
**Status:** STAGE 1 COMPLETE — READY FOR NEXT STAGE  

---

## 1. BEFORE (HOW IT WORKED IN PHASE 6.6)
Previously, `AgentContextManager` maintained conversational state exclusively in a local Node.js process `Map<string, SessionContext>`:
- **Server Restart Vulnerability:** Any pod restart, serverless cold-start, or code reload wiped active contexts.
- **Multi-Instance Inconsistency:** In a multi-replica cluster or serverless deployment, subsequent user messages routed to another container found empty session state.
- **Client Ownership Spoofing:** `route.js` accepted `userId`, `role`, `permissions`, and `branchId` directly from client-supplied `req.json().context` without server-side validation.
- **No Optimistic Locking:** Any concurrent session writes could result in lost updates.
- **Exposed Credentials:** A hardcoded service-role key fallback existed in `src/lib/supabaseClient.js`.

---

## 2. AFTER (NEW PRODUCTION ARCHITECTURE)
We introduced a decoupled, persistent session architecture backed by PostgreSQL / Supabase, disk-backed storage, and strict server-side boundary validation:

```text
Incoming User Request (POST /api/copilot)
      │
      ├── [1] Server-Side Authentication Resolution (resolveTrustedActor)
      │     ├── Verifies Supabase Bearer JWT / Cookie
      │     └── Extracts verified actorId, tenantId, role, branchId
      │
      ├── [2] Persistent Session Adapter (AgentSessionStoreFactory)
      │     ├── Checks TTL expiration (stale sessions return null)
      │     ├── Enforces Tenant, Actor, and Branch Isolation (fails closed)
      │     └── Validates state size (<64KB) & strips forbidden secrets
      │
      ├── [3] Synchronized In-Memory Working Cache
      │     └── Downstream business modules operate with 100% backward compatibility
      │
      └── [4] Atomic Optimistic Concurrency Save
            └── UPDATE ... WHERE id = ? AND version = ? (Increments version atomically)
```

---

## 3. FILES CHANGED & CREATED

### Created:
1. `supabase/migrations/0117_agent_sessions.sql`: Canonical migration for `agent_sessions` table with indexes, constraints, and RLS.
2. `src/ai-brain/context/AgentSessionContracts.ts`: Strongly typed persistent session contracts, error types, security validators, and size limits.
3. `src/ai-brain/context/SupabaseAgentSessionStore.ts`: PostgreSQL / Supabase database adapter with optimistic locking.
4. `src/ai-brain/context/FilePersistentSessionStore.ts`: Disk-backed persistence adapter ensuring real persistence across server restarts without mocks.
5. `src/ai-brain/context/InMemoryAgentSessionStore.ts`: Isolated in-memory store conforming to `IAgentSessionStore` for unit testing.
6. `src/ai-brain/context/AgentSessionStoreFactory.ts`: Provider factory managing active session backend.
7. `src/ai-brain/context/index.ts`: Module exports.
8. `src/ai-brain/evaluation/stage1_session_tests.ts`: Automated 15-test invariant verification runner.

### Modified:
1. `src/lib/supabaseClient.js` (**P0 SECURITY HOTFIX**): Removed hardcoded service-role key fallback; now strictly uses server environment variable or safe public publishable key.
2. `src/ai-brain/context/AgentContextManager.ts`: Integrated persistent session methods while preserving 100% backward compatibility for all synchronous methods.
3. `src/app/api/copilot/route.js`: Integrated `resolveTrustedActor` server-side authentication resolution and persistent session loading/saving.

---

## 4. DATABASE MIGRATION (`0117_agent_sessions.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_trace_id TEXT,
  CONSTRAINT uq_agent_sessions_tenant_conversation UNIQUE (tenant_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_lookup ON public.agent_sessions (tenant_id, actor_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_actor ON public.agent_sessions (actor_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_branch ON public.agent_sessions (branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_sessions_expires_at ON public.agent_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_updated_at ON public.agent_sessions (updated_at DESC);

ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
```

---

## 5. SECURITY: TENANT, ACTOR & BRANCH BINDING
- **Identity Source:** Requests are resolved via `resolveTrustedActor()`. If an authenticated Supabase Bearer token exists, user identity, tenant, and role are queried from verified server-side session data (`user_profile`), ignoring client spoof attempts.
- **Tenant Isolation:** Sessions are partitioned by `tenant_id`. Tenant A attempting to access Tenant B's conversation throws `TenantIsolationError` (HTTP 403).
- **Actor Isolation:** Sessions are bound to `actor_id`. User B attempting to load User A's session throws `ActorIsolationError` (HTTP 403).
- **Branch Isolation:** Cross-branch access throws `BranchIsolationError`.
- **Secret Rejection:** `validateSessionStateSecurity()` strictly scans serialized state for JWT tokens, service-role keys (`sb_secret_`), or authorization headers and rejects mutations with `SecuritySecretForbiddenError`.

---

## 6. CONCURRENCY: OPTIMISTIC LOCKING
- Every session maintains a monotonic integer `version` field starting at `1`.
- Updates execute an atomic conditional write:
  ```sql
  UPDATE agent_sessions
  SET state_json = :state, version = :expectedVersion + 1, updated_at = NOW()
  WHERE id = :sessionId AND version = :expectedVersion
  ```
- If 0 rows are affected, another worker updated the session in between. The adapter fetches the actual version and throws `StaleSessionVersionError`.

---

## 7. TTL & EXPIRATION
- Default TTL is **15 minutes** (`DEFAULT_SESSION_TTL_MS = 900,000 ms`), matching existing business requirements.
- Expired sessions return `null` immediately upon lookup. The system rejects stale contexts and provisions a clean session.
- `cleanupExpired()` purges expired rows from storage.

---

## 8. FAILURE BEHAVIOR
- If database persistence fails (e.g. database unreachable, network timeout), the adapter throws an explicit `SessionPersistenceError`.
- **Crucial Rule:** The system **DOES NOT** silently fall back to volatile memory for write operations. Unauthenticated or unpersisted requests fail closed.

---

## 9. STAGE 1 AUTOMATED TEST RESULTS (15/15 PASS)

| # | Test Scenario | Expected Behavior | Actual Result | Status |
| :-: | :--- | :--- | :--- | :---: |
| **1** | Create session | Created with version 1 & bound actor | Created session `b7bec76a-...` (v1) | ✅ PASS |
| **2** | Read session | Retrieve matching active session | Retrieved active session for conversation | ✅ PASS |
| **3** | Update session | Version increments to 2 & entity saved | Updated to v2, customer saved | ✅ PASS |
| **4** | Restart recovery | Recover state after memory destruction | Recovered customer Chị Lan (v2) from disk | ✅ PASS |
| **5** | Multi-worker recovery | Worker B sees state written by Worker A | Worker B read topic `revenue` (v3) | ✅ PASS |
| **6** | TTL expiration | Expired session returns null | Returned null (expired context rejected) | ✅ PASS |
| **7** | Actor isolation | Reject unauthorized actor access | `ActorIsolationError` thrown (DENIED) | ✅ PASS |
| **8** | Tenant isolation | Reject cross-tenant access | `TenantIsolationError` thrown (DENIED) | ✅ PASS |
| **9** | Branch isolation | Reject cross-branch access | `BranchIsolationError` thrown (DENIED) | ✅ PASS |
| **10** | Concurrent update | Second concurrent write rejected | `StaleSessionVersionError` thrown | ✅ PASS |
| **11** | Stale version rejection | Reject update if expectedVersion wrong | `StaleSessionVersionError` thrown | ✅ PASS |
| **12** | Oversized state rejection | Reject state > 64KB | `OversizedStateError` thrown | ✅ PASS |
| **13** | Persistence failure | Explicit error without silent fallback | `SessionPersistenceError` thrown | ✅ PASS |
| **14** | Secure session ID | Cryptographically random UUID | Valid random UUIDs generated | ✅ PASS |
| **15** | No secret persistence | Block service-role keys & credentials | `SecuritySecretForbiddenError` thrown | ✅ PASS |

---

## 10. CANONICAL REGRESSION SUITES

| Benchmark Suite | Baseline (Phase 6.6) | Post-Stage 1 Result | Regression Status |
| :--- | :---: | :---: | :---: |
| **Phase 5.5 Red-Team Suite** | 230 / 230 (100.0%) | **230 / 230 (100.0%)** | ✅ ZERO REGRESSION |
| **Phase 6 Real Business Operations** | 330 / 330 (100.0%) | **330 / 330 (100.0%)** | ✅ ZERO REGRESSION |
| **Phase 6 Holdout Benchmark** | 49 / 50 (98.0%) | **49 / 50 (98.0%)** | ✅ ZERO REGRESSION |
| **Phase 6.5 Real-World LLM** | 98.1% Score, 98.7% RWIS | **98.1% Score, 98.7% RWIS** | ✅ ZERO REGRESSION |
| **Phase 6.5 Holdout 2.0** | 92.2% Score, 90.5% RWIS | **92.2% Score, 90.5% RWIS** | ✅ ZERO REGRESSION |
| **Phase 6.5 Adversarial Suite** | 91.3% Score, 87.5% RWIS | **91.3% Score, 87.5% RWIS** | ✅ ZERO REGRESSION |
| **TypeScript Compilation** | 0 errors | **0 errors (`npm run typecheck`)** | ✅ PASS |
| **Next.js Production Build** | SUCCESS | **SUCCESS (`npm run build`)** | ✅ PASS |

---

## 11. REMAINING P0 / P1 RISKS (FOR SUBSEQUENT STAGES)
1. **In-Memory ConfirmationGate (P0):** `ConfirmationGate` pending actions and plans remain in Node.js heap memory (targeted in **Stage 2**).
2. **In-Memory IdempotencyGuard (P0):** Idempotency execution records remain process-local (targeted in **Stage 3**).
3. **Inventory Lost-Update & Booking Races (P0):** Write tools still lack atomic increments and booking slot locks (targeted in **Stage 4**).
4. **Gemini 429 Unhandled Rate Limits (P1):** Backoff queue and circuit breaking need implementation (targeted in **Stage 5 & 6**).
5. **Multi-Entity Transaction Atomicity (P1):** Checkout invoice status + cash flow voucher insertion need atomic PostgreSQL RPC execution (targeted in **Stage 12**).

---

## 12. PRODUCTION READINESS ASSESSMENT
**Current Classification:** `READY FOR NEXT STAGE`  
*(Not marked "Production Ready" because distributed ConfirmationGate, IdempotencyGuard, Concurrency Locks, and Retry Queues remain to be completed in Stages 2–20).*
