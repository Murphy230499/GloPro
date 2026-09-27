/**
 * Supabase Agent Session Store (Phase 7 Stage 1)
 * 
 * Production PostgreSQL persistence adapter for AgentSession using Supabase.
 * Enforces:
 * 1. Server-side tenant, actor, and branch boundary validation
 * 2. Database-level optimistic concurrency (UPDATE ... WHERE id = ? AND version = ?)
 * 3. Strict TTL expiration checking (rejects stale contexts)
 * 4. PII & secret filtering prior to persistence
 */

import { supabase as defaultSupabase } from '../../lib/supabaseClient';
import {
  AgentSession,
  CreateSessionParams,
  IAgentSessionStore,
  TrustedActorContext,
  SessionPersistenceError,
  StaleSessionVersionError,
  ActorIsolationError,
  TenantIsolationError,
  BranchIsolationError,
  DEFAULT_SESSION_TTL_MS,
  validateSessionStateSize
} from './AgentSessionContracts';
import { SessionContext } from './AgentContextManager';
import { randomUUID } from 'crypto';

export class SupabaseAgentSessionStore implements IAgentSessionStore {
  name = 'SupabaseAgentSessionStore';
  private client: any;
  private tableName = 'agent_sessions';

  constructor(client: any = defaultSupabase) {
    this.client = client;
  }

  /**
   * Retrieves an active session by ID, validating actor and tenant authorization
   */
  async getSession(sessionId: string, trusted: TrustedActorContext): Promise<AgentSession | null> {
    if (!sessionId) return null;

    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error) {
        throw new SessionPersistenceError(`Failed to fetch session ${sessionId}: ${error.message}`, error);
      }

      if (!data) return null;

      const session = this.mapRecordToSession(data);

      // Verify Tenant Isolation
      if (session.tenantId !== trusted.tenantId) {
        throw new TenantIsolationError(trusted.tenantId, session.tenantId);
      }

      // Verify Actor Isolation (unless system override role)
      if (session.actorId !== trusted.actorId && trusted.role !== 'system_admin') {
        throw new ActorIsolationError(trusted.actorId, session.actorId);
      }

      // Verify Branch Isolation if both session and trusted context specify a branch
      if (session.branchId && trusted.branchId && session.branchId !== trusted.branchId) {
        throw new BranchIsolationError(trusted.branchId, session.branchId);
      }

      // Check Expiration
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        // Expired session is not active
        return null;
      }

      return session;
    } catch (err: any) {
      if (err instanceof TenantIsolationError || err instanceof ActorIsolationError || err instanceof BranchIsolationError) {
        throw err;
      }
      throw new SessionPersistenceError(`Error in getSession: ${err.message}`, err);
    }
  }

  /**
   * Retrieves an active session by conversationId within the tenant scope
   */
  async getSessionByConversation(conversationId: string, trusted: TrustedActorContext): Promise<AgentSession | null> {
    if (!conversationId) return null;

    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('tenant_id', trusted.tenantId)
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (error) {
        throw new SessionPersistenceError(`Failed to fetch session by conversation: ${error.message}`, error);
      }

      if (!data) return null;

      const session = this.mapRecordToSession(data);

      if (session.actorId !== trusted.actorId && trusted.role !== 'system_admin') {
        throw new ActorIsolationError(trusted.actorId, session.actorId);
      }

      if (new Date(session.expiresAt).getTime() < Date.now()) {
        return null;
      }

      return session;
    } catch (err: any) {
      if (err instanceof TenantIsolationError || err instanceof ActorIsolationError || err instanceof BranchIsolationError) {
        throw err;
      }
      throw new SessionPersistenceError(`Error in getSessionByConversation: ${err.message}`, err);
    }
  }

  /**
   * Creates a new persistent session
   */
  async createSession(params: CreateSessionParams): Promise<AgentSession> {
    const id = params.id || randomUUID();
    const now = new Date();
    const ttl = params.ttlMs || DEFAULT_SESSION_TTL_MS;
    const expiresAt = new Date(now.getTime() + ttl).toISOString();

    const initialState: SessionContext = {
      sessionId: id,
      actorId: params.actorId,
      branchId: params.branchId,
      recentEntities: [],
      recentActions: [],
      updatedAt: now.getTime(),
      ...params.initialState
    };

    validateSessionStateSize(initialState);

    const record = {
      id,
      conversation_id: params.conversationId,
      actor_id: params.actorId,
      tenant_id: params.tenantId,
      branch_id: params.branchId || null,
      state_json: initialState,
      version: 1,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      expires_at: expiresAt,
      last_trace_id: params.traceId || null
    };

    const { data, error } = await this.client
      .from(this.tableName)
      .insert(record)
      .select()
      .single();

    if (error) {
      throw new SessionPersistenceError(`Failed to create session in Supabase: ${error.message}`, error);
    }

    return this.mapRecordToSession(data);
  }

  /**
   * Updates session with optimistic concurrency control
   */
  async updateSession(
    session: AgentSession,
    expectedVersion: number,
    trusted: TrustedActorContext
  ): Promise<AgentSession> {
    // 1. Boundary Verification
    if (session.tenantId !== trusted.tenantId) {
      throw new TenantIsolationError(trusted.tenantId, session.tenantId);
    }
    if (session.actorId !== trusted.actorId && trusted.role !== 'system_admin') {
      throw new ActorIsolationError(trusted.actorId, session.actorId);
    }

    // 2. Validate state security & size limit
    validateSessionStateSize(session.state);

    const now = new Date();
    const newVersion = expectedVersion + 1;
    const expiresAt = new Date(now.getTime() + DEFAULT_SESSION_TTL_MS).toISOString();

    // 3. Atomic conditional update via database
    const { data, error } = await this.client
      .from(this.tableName)
      .update({
        state_json: session.state,
        version: newVersion,
        updated_at: now.toISOString(),
        expires_at: expiresAt,
        last_trace_id: session.lastTraceId || null
      })
      .eq('id', session.id)
      .eq('version', expectedVersion)
      .select();

    if (error) {
      throw new SessionPersistenceError(`Failed to update session: ${error.message}`, error);
    }

    // If 0 rows updated, the version check failed (concurrent update)
    if (!data || data.length === 0) {
      const { data: current } = await this.client
        .from(this.tableName)
        .select('version')
        .eq('id', session.id)
        .maybeSingle();

      const actualVersion = current?.version ?? -1;
      throw new StaleSessionVersionError(expectedVersion, actualVersion);
    }

    return this.mapRecordToSession(data[0]);
  }

  /**
   * Deletes session
   */
  async deleteSession(sessionId: string, trusted: TrustedActorContext): Promise<boolean> {
    const existing = await this.getSession(sessionId, trusted);
    if (!existing) return false;

    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', sessionId);

    if (error) {
      throw new SessionPersistenceError(`Failed to delete session: ${error.message}`, error);
    }
    return true;
  }

  /**
   * Extends session TTL
   */
  async touchSession(sessionId: string, trusted: TrustedActorContext, ttlMs: number = DEFAULT_SESSION_TTL_MS): Promise<boolean> {
    const existing = await this.getSession(sessionId, trusted);
    if (!existing) return false;

    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    const { error } = await this.client
      .from(this.tableName)
      .update({ expires_at: expiresAt, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      throw new SessionPersistenceError(`Failed to touch session: ${error.message}`, error);
    }
    return true;
  }

  /**
   * Cleans up expired sessions
   */
  async cleanupExpired(): Promise<number> {
    const nowIso = new Date().toISOString();
    const { data, error } = await this.client
      .from(this.tableName)
      .delete()
      .lt('expires_at', nowIso)
      .select('id');

    if (error) {
      throw new SessionPersistenceError(`Failed to cleanup expired sessions: ${error.message}`, error);
    }
    return data ? data.length : 0;
  }

  private mapRecordToSession(record: any): AgentSession {
    return {
      id: record.id,
      conversationId: record.conversation_id,
      actorId: record.actor_id,
      tenantId: record.tenant_id,
      branchId: record.branch_id || undefined,
      state: typeof record.state_json === 'string' ? JSON.parse(record.state_json) : (record.state_json || {}),
      version: Number(record.version) || 1,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      expiresAt: record.expires_at,
      lastTraceId: record.last_trace_id || undefined
    };
  }
}
