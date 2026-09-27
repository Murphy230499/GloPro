/**
 * Agent Session Store Factory (Phase 7 Stage 1)
 * 
 * Manages active session store provider with pluggable backend resolution:
 * - SupabaseAgentSessionStore (default production store)
 * - FilePersistentSessionStore (local disk-backed persistence for restart testing)
 * - InMemoryAgentSessionStore (isolated unit tests)
 */

import { IAgentSessionStore } from './AgentSessionContracts';
import { SupabaseAgentSessionStore } from './SupabaseAgentSessionStore';
import { FilePersistentSessionStore } from './FilePersistentSessionStore';
import { InMemoryAgentSessionStore } from './InMemoryAgentSessionStore';

export class AgentSessionStoreFactory {
  private static instance: IAgentSessionStore | null = null;

  static getStore(): IAgentSessionStore {
    if (!this.instance) {
      const storeType = process.env.AGENT_SESSION_STORE || 'supabase';
      if (storeType === 'file') {
        this.instance = new FilePersistentSessionStore();
      } else if (storeType === 'memory') {
        this.instance = new InMemoryAgentSessionStore();
      } else {
        this.instance = new SupabaseAgentSessionStore();
      }
    }
    return this.instance;
  }

  static setStore(store: IAgentSessionStore | null): void {
    this.instance = store;
  }
}
