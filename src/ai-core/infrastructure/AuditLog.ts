import { IAuditLog, IAuditEntry } from '../contracts/security.types';

export class AuditLog implements IAuditLog {
  private readonly entries: IAuditEntry[] = [];

  async record(entry: IAuditEntry): Promise<void> {
    const fullEntry: IAuditEntry = {
      ...entry,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `audit_${Date.now()}_${Math.random()}`,
      timestamp: entry.timestamp || new Date()
    };
    this.entries.push(fullEntry);
  }

  async query(filter: Partial<IAuditEntry>): Promise<IAuditEntry[]> {
    return this.entries.filter(e => {
      if (filter.sessionId && e.sessionId !== filter.sessionId) return false;
      if (filter.userId && e.userId !== filter.userId) return false;
      if (filter.eventType && e.eventType !== filter.eventType) return false;
      return true;
    });
  }
}
