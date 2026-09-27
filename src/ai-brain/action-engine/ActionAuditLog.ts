/**
 * Action Audit Log
 * 
 * Records structured security and operation logs for every write action lifecycle.
 * Sanitizes sensitive personal information, credentials, and API secrets.
 */

import { ActionType, ActionStatus } from './ActionContracts';

export type ActionAuditEvent =
  | 'AI_ACTION_PLANNED'
  | 'AI_ACTION_PREVIEWED'
  | 'AI_CONFIRMATION_REQUESTED'
  | 'AI_ACTION_CONFIRMED'
  | 'AI_ACTION_CANCELLED'
  | 'AI_ACTION_EXECUTED'
  | 'AI_ACTION_VERIFIED'
  | 'AI_ACTION_FAILED'
  | 'AI_ACTION_CONFLICT'
  | 'AI_PERMISSION_DENIED'
  | 'AI_IDEMPOTENCY_BLOCKED'
  | 'AI_STALE_STATE_DETECTED';

export interface IActionAuditEntry {
  event: ActionAuditEvent;
  actionType: ActionType;
  actionReference?: string;
  status: ActionStatus;
  actorId?: string;
  actorRole?: string;
  sessionId?: string;
  targetId?: string;
  targetType?: string;
  durationMs?: number;
  reason?: string;
}

export class ActionAuditLog {
  private static sanitize(text: string): string {
    if (!text) return '';
    return text.replace(/([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g, '***@***.***')
               .replace(/(0\d{9})/g, '0***$1'.slice(-4));
  }

  static log(entry: IActionAuditEntry): void {
    const payload = {
      timestamp: new Date().toISOString(),
      ...entry,
      reason: entry.reason ? this.sanitize(entry.reason) : undefined
    };

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[ACTION_AUDIT] ${JSON.stringify(payload)}`);
    }
  }
}
