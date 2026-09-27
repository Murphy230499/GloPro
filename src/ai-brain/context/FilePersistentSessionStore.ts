/**
 * File-Persistent Agent Session Store (Phase 7 Stage 1)
 * 
 * Disk-backed persistence adapter ensuring real persistence across Node.js server restarts,
 * multi-worker process recreation, and cold starts without using mocks.
 */

import * as fs from 'fs';
import * as path from 'path';
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

export class FilePersistentSessionStore implements IAgentSessionStore {
  name = 'FilePersistentSessionStore';
  private filePath: string;

  constructor(customPath?: string) {
    this.filePath = customPath || path.resolve(process.cwd(), '.agent_sessions_store.json');
    this.ensureFileExists();
  }

  private ensureFileExists(): void {
    if (!fs.existsSync(this.filePath)) {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify({ sessions: {} }, null, 2), 'utf8');
    }
  }

  private readData(): { sessions: Record<string, AgentSession> } {
    try {
      this.ensureFileExists();
      const content = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(content || '{"sessions":{}}');
    } catch (err: any) {
      throw new SessionPersistenceError(`Failed to read persistent session file: ${err.message}`, err);
    }
  }

  private writeData(data: { sessions: Record<string, AgentSession> }): void {
    try {
      const tmpPath = `${this.filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.filePath);
    } catch (err: any) {
      throw new SessionPersistenceError(`Failed to write persistent session file: ${err.message}`, err);
    }
  }

  async getSession(sessionId: string, trusted: TrustedActorContext): Promise<AgentSession | null> {
    if (!sessionId) return null;
    const data = this.readData();
    const session = data.sessions[sessionId];
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

    return session;
  }

  async getSessionByConversation(conversationId: string, trusted: TrustedActorContext): Promise<AgentSession | null> {
    if (!conversationId) return null;
    const data = this.readData();
    const session = Object.values(data.sessions).find(
      s => s.tenantId === trusted.tenantId && s.conversationId === conversationId
    );
    if (!session) return null;

    if (session.actorId !== trusted.actorId && trusted.role !== 'system_admin') {
      throw new ActorIsolationError(trusted.actorId, session.actorId);
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return null;
    }

    return session;
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

    const data = this.readData();
    data.sessions[id] = session;
    this.writeData(data);

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

    const data = this.readData();
    const existing = data.sessions[session.id];
    if (!existing) {
      throw new SessionPersistenceError(`Session ${session.id} not found for update`);
    }

    // Optimistic Concurrency check
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

    data.sessions[session.id] = updated;
    this.writeData(data);

    return updated;
  }

  async deleteSession(sessionId: string, trusted: TrustedActorContext): Promise<boolean> {
    const existing = await this.getSession(sessionId, trusted);
    if (!existing) return false;

    const data = this.readData();
    delete data.sessions[sessionId];
    this.writeData(data);
    return true;
  }

  async touchSession(sessionId: string, trusted: TrustedActorContext, ttlMs: number = DEFAULT_SESSION_TTL_MS): Promise<boolean> {
    const existing = await this.getSession(sessionId, trusted);
    if (!existing) return false;

    const data = this.readData();
    data.sessions[sessionId].expiresAt = new Date(Date.now() + ttlMs).toISOString();
    data.sessions[sessionId].updatedAt = new Date().toISOString();
    this.writeData(data);
    return true;
  }

  async cleanupExpired(): Promise<number> {
    const data = this.readData();
    const now = Date.now();
    let count = 0;

    for (const [id, s] of Object.entries(data.sessions)) {
      if (new Date(s.expiresAt).getTime() < now) {
        delete data.sessions[id];
        count++;
      }
    }

    if (count > 0) {
      this.writeData(data);
    }
    return count;
  }
}
