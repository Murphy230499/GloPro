/**
 * In-Memory Agent Session Store (Phase 7 Stage 1)
 * 
 * In-memory adapter strictly conforming to the IAgentSessionStore interface,
 * with complete tenant isolation, actor binding, optimistic concurrency, and TTL rules.
 */

import { randomUUID } from 'crypto';
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

export class InMemoryAgentSessionStore implements IAgentSessionStore {
  name = 'InMemoryAgentSessionStore';
  private sessions: Map<string, AgentSession> = new Map();

  async getSession(sessionId: string, trusted: TrustedActorContext): Promise<AgentSession | null> {
    if (!sessionId) return null;
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.tenantId !== trusted.tenantId) {
      throw new TenantIsolationError(trusted.tenantId, session.tenantId);
    }
    if (session.actorId !== trusted.actorId && trusted.role !== 'system_admin') {
      throw new ActorIsolationError(trusted.actorId, session.actorId);
    }
    if (session.branchId && trusted.branchId && session.branchId !== trusted.branchId) {
      throw new BranchIsolationError(trusted.branchId, session.branchId);
    }
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return null;
    }

    return JSON.parse(JSON.stringify(session));
  }

  async getSessionByConversation(conversationId: string, trusted: TrustedActorContext): Promise<AgentSession | null> {
    if (!conversationId) return null;
    for (const session of this.sessions.values()) {
      if (session.tenantId === trusted.tenantId && session.conversationId === conversationId) {
        if (session.actorId !== trusted.actorId && trusted.role !== 'system_admin') {
          throw new ActorIsolationError(trusted.actorId, session.actorId);
        }
        if (new Date(session.expiresAt).getTime() < Date.now()) {
          return null;
        }
        return JSON.parse(JSON.stringify(session));
      }
    }
    return null;
  }

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

    const session: AgentSession = {
      id,
      conversationId: params.conversationId,
      actorId: params.actorId,
      tenantId: params.tenantId,
      branchId: params.branchId,
      state: initialState,
      version: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt,
      lastTraceId: params.traceId
    };

    this.sessions.set(id, JSON.parse(JSON.stringify(session)));
    return session;
  }

  async updateSession(
    session: AgentSession,
    expectedVersion: number,
    trusted: TrustedActorContext
  ): Promise<AgentSession> {
    if (session.tenantId !== trusted.tenantId) {
      throw new TenantIsolationError(trusted.tenantId, session.tenantId);
    }
    if (session.actorId !== trusted.actorId && trusted.role !== 'system_admin') {
      throw new ActorIsolationError(trusted.actorId, session.actorId);
    }

    validateSessionStateSize(session.state);

    const existing = this.sessions.get(session.id);
    if (!existing) {
      throw new SessionPersistenceError(`Session ${session.id} not found for update`);
    }

    if (existing.version !== expectedVersion) {
      throw new StaleSessionVersionError(expectedVersion, existing.version);
    }

    const now = new Date();
    const updated: AgentSession = {
      ...session,
      version: expectedVersion + 1,
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + DEFAULT_SESSION_TTL_MS).toISOString()
    };

    this.sessions.set(session.id, JSON.parse(JSON.stringify(updated)));
    return updated;
  }

  async deleteSession(sessionId: string, trusted: TrustedActorContext): Promise<boolean> {
    const existing = await this.getSession(sessionId, trusted);
    if (!existing) return false;
    this.sessions.delete(sessionId);
    return true;
  }

  async touchSession(sessionId: string, trusted: TrustedActorContext, ttlMs: number = DEFAULT_SESSION_TTL_MS): Promise<boolean> {
    const existing = await this.getSession(sessionId, trusted);
    if (!existing) return false;
    existing.expiresAt = new Date(Date.now() + ttlMs).toISOString();
    existing.updatedAt = new Date().toISOString();
    this.sessions.set(sessionId, existing);
    return true;
  }

  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let count = 0;
    for (const [id, s] of this.sessions.entries()) {
      if (new Date(s.expiresAt).getTime() < now) {
        this.sessions.delete(id);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.sessions.clear();
  }
}
