export interface IChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface IConversationMemory {
  addMessage(sessionId: string, message: Omit<IChatMessage, 'id' | 'timestamp'>): Promise<IChatMessage>;
  getMessages(sessionId: string, limit?: number): Promise<IChatMessage[]>;
  clear(sessionId: string): Promise<void>;
}
