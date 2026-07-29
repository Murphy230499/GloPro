import { IContextManager, IAgentContext } from '../contracts/context.types';

export class ContextManager implements IContextManager {
  private readonly contexts = new Map<string, IAgentContext>();

  createContext(params: Partial<IAgentContext>): IAgentContext {
    const sessionId = params.sessionId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session_${Date.now()}_${Math.random()}`);
    const context: IAgentContext = {
      sessionId,
      userId: params.userId || 'anonymous',
      tenantId: params.tenantId || 'default',
      roles: params.roles || [],
      permissions: params.permissions || [],
      metadata: params.metadata || {},
      createdAt: new Date()
    };
    this.contexts.set(context.sessionId, context);
    return context;
  }

  updateContext(sessionId: string, updates: Partial<IAgentContext>): IAgentContext {
    const existing = this.contexts.get(sessionId);
    if (!existing) {
      throw new Error(`Context not found for session: ${sessionId}`);
    }
    const updated: IAgentContext = {
      ...existing,
      ...updates,
      metadata: { ...existing.metadata, ...(updates.metadata || {}) }
    };
    this.contexts.set(sessionId, updated);
    return updated;
  }

  getContext(sessionId: string): IAgentContext | undefined {
    return this.contexts.get(sessionId);
  }

  destroyContext(sessionId: string): void {
    this.contexts.delete(sessionId);
  }
}
