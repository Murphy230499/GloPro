import { IConversationMemory, IChatMessage } from '../contracts/memory.types';

export class ConversationMemory implements IConversationMemory {
  private readonly store = new Map<string, IChatMessage[]>();

  async addMessage(sessionId: string, msg: Omit<IChatMessage, 'id' | 'timestamp'>): Promise<IChatMessage> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}_${Math.random()}`;
    const fullMsg: IChatMessage = {
      ...msg,
      id,
      timestamp: new Date()
    };
    const list = this.store.get(sessionId) || [];
    list.push(fullMsg);
    this.store.set(sessionId, list);
    return fullMsg;
  }

  async getMessages(sessionId: string, limit?: number): Promise<IChatMessage[]> {
    const list = this.store.get(sessionId) || [];
    return limit ? list.slice(-limit) : list;
  }

  async clear(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }
}
