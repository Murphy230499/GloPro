/**
 * Agent Session Contracts & Interfaces (Phase 7 Stage 1)
 * 
 * Defines the persistent session abstraction separating process-local memory from
 * distributed persistence with strict tenant isolation, actor binding,
 * optimistic concurrency versioning, TTL expiration, and secret protection.
 */

import { SessionContext } from './AgentContextManager';

export interface TrustedActorContext {
  actorId: string;
  tenantId: string;
  branchId?: string;
  role?: string;
  permissions?: string[] | string;
}

export interface AgentSession {
  id: string;               // Secure random UUID
  conversationId: string;   // Unique within tenant scope
  actorId: string;          // Bound authenticated user
  tenantId: string;         // Bound salon/tenant
  branchId?: string;        // Optional branch binding
  state: SessionContext;    // Structured conversational context
  version: number;          // Optimistic concurrency counter (1, 2, 3...)
  createdAt: string;        // ISO 8601 string
  updatedAt: string;        // ISO 8601 string
  expiresAt: string;        // ISO 8601 string
  lastTraceId?: string;     // Distributed trace ID
}

export interface CreateSessionParams {
  id?: string;
  conversationId: string;
  actorId: string;
  tenantId: string;
  branchId?: string;
  initialState?: Partial<SessionContext>;
  ttlMs?: number;
  traceId?: string;
}

export interface IAgentSessionStore {
  name: string;

  /**
   * Retrieves a session, strictly validating actor, tenant, and branch bindings.
   * Returns null if session does not exist or has expired.
   */
  getSession(sessionId: string, trusted: TrustedActorContext): Promise<AgentSession | null>;

  /**
   * Retrieves an active session by conversationId within the tenant's scope.
   */
  getSessionByConversation(conversationId: string, trusted: TrustedActorContext): Promise<AgentSession | null>;

  /**
   * Creates a brand-new persistent session with version 1.
   */
  createSession(params: CreateSessionParams): Promise<AgentSession>;

  /**
   * Updates an existing session with optimistic concurrency control.
   * If stored version != expectedVersion, throws StaleSessionVersionError.
   */
  updateSession(session: AgentSession, expectedVersion: number, trusted: TrustedActorContext): Promise<AgentSession>;

  /**
   * Deletes a session after verifying tenant and actor binding.
   */
  deleteSession(sessionId: string, trusted: TrustedActorContext): Promise<boolean>;

  /**
   * Extends session expiration timestamp.
   */
  touchSession(sessionId: string, trusted: TrustedActorContext, ttlMs?: number): Promise<boolean>;

  /**
   * Purges expired sessions from the store.
   */
  cleanupExpired(): Promise<number>;
}

// ---------------------- ERROR TYPES ----------------------

export class SessionPersistenceError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(`[SessionPersistenceError] ${message}`);
    this.name = 'SessionPersistenceError';
  }
}

export class StaleSessionVersionError extends Error {
  constructor(public readonly expectedVersion: number, public readonly actualVersion: number) {
    super(`[StaleSessionVersionError] Stale session write rejected. Expected version ${expectedVersion}, found ${actualVersion}.`);
    this.name = 'StaleSessionVersionError';
  }
}

export class ActorIsolationError extends Error {
  constructor(public readonly actorId: string, public readonly sessionActorId: string) {
    super(`[ActorIsolationError] Actor ${actorId} is not authorized to access session owned by ${sessionActorId}.`);
    this.name = 'ActorIsolationError';
  }
}

export class TenantIsolationError extends Error {
  constructor(public readonly tenantId: string, public readonly sessionTenantId: string) {
    super(`[TenantIsolationError] Tenant ${tenantId} is not authorized to access session owned by ${sessionTenantId}.`);
    this.name = 'TenantIsolationError';
  }
}

export class BranchIsolationError extends Error {
  constructor(public readonly branchId: string, public readonly sessionBranchId: string) {
    super(`[BranchIsolationError] Branch ${branchId} is not authorized to access session bound to ${sessionBranchId}.`);
    this.name = 'BranchIsolationError';
  }
}

export class OversizedStateError extends Error {
  constructor(public readonly actualBytes: number, public readonly maxBytes: number) {
    super(`[OversizedStateError] Session state size (${actualBytes} bytes) exceeds safety limit of ${maxBytes} bytes.`);
    this.name = 'OversizedStateError';
  }
}

export class SecuritySecretForbiddenError extends Error {
  constructor(public readonly secretPattern: string) {
    super(`[SecuritySecretForbiddenError] Attempted to persist forbidden secret pattern: ${secretPattern}`);
    this.name = 'SecuritySecretForbiddenError';
  }
}

// ---------------------- SAFETY LIMITS & SANITIZATION ----------------------

export const MAX_SERIALIZED_STATE_BYTES = 65536; // 64 KB limit
export const DEFAULT_SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

const FORBIDDEN_SECRET_PATTERNS = [
  /sb_secret_[a-zA-Z0-9_\-]+/i,
  /service_role/i,
  /eyJ[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]{20,}/, // JWT pattern
  /Bearer\s+[a-zA-Z0-9_\.\-]+/i,
  /password\s*[:=]\s*["'][^"']+["']/i
];

/**
 * Validates that session state contains NO secrets, tokens, or service credentials
 */
export function validateSessionStateSecurity(state: any): void {
  const json = JSON.stringify(state);
  for (const pattern of FORBIDDEN_SECRET_PATTERNS) {
    if (pattern.test(json)) {
      throw new SecuritySecretForbiddenError(pattern.toString());
    }
  }
}

/**
 * Validates serialized state size to prevent unbounded memory growth
 */
export function validateSessionStateSize(state: any): string {
  validateSessionStateSecurity(state);
  const serialized = JSON.stringify(state);
  const bytes = Buffer.byteLength(serialized, 'utf8');
  if (bytes > MAX_SERIALIZED_STATE_BYTES) {
    throw new OversizedStateError(bytes, MAX_SERIALIZED_STATE_BYTES);
  }
  return serialized;
}
