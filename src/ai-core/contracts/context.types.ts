export interface IAgentContext {
  sessionId: string;
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface IContextManager {
  createContext(params: Partial<IAgentContext>): IAgentContext;
  updateContext(sessionId: string, updates: Partial<IAgentContext>): IAgentContext;
  getContext(sessionId: string): IAgentContext | undefined;
  destroyContext(sessionId: string): void;
}
