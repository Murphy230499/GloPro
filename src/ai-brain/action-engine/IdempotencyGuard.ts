/**
 * Idempotency Guard
 * 
 * Prevents duplicate action execution (double submit protection).
 * Caches executed action results for a sliding window (e.g., 5 minutes)
 * to return previous execution results instead of re-executing writes.
 */

import { ActionResult } from './ActionContracts';

interface IdempotentRecord {
  result: ActionResult;
  executedAt: number;
}

export class IdempotencyGuard {
  private static executedActions: Map<string, IdempotentRecord> = new Map();
  private static TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Generates a deterministic idempotency key for an action execution
   */
  static generateKey(actorId: string, actionType: string, referenceId: string): string {
    return `${actorId || 'anon'}_${actionType}_${referenceId}`;
  }

  /**
   * Checks if an action with this key was already executed
   */
  static check(key: string): ActionResult | null {
    this.cleanExpired();
    const existing = this.executedActions.get(key);
    if (existing) {
      return {
        ...existing.result,
        status: 'ALREADY_APPLIED',
        message: `Thao tác này đã được thực thi trước đó. ${existing.result.message}`
      };
    }
    return null;
  }

  /**
   * Stores an executed action result
   */
  static record(key: string, result: ActionResult): void {
    this.cleanExpired();
    this.executedActions.set(key, {
      result,
      executedAt: Date.now()
    });
  }

  private static cleanExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.executedActions.entries()) {
      if (now - record.executedAt > this.TTL_MS) {
        this.executedActions.delete(key);
      }
    }
  }

  /**
   * For testing purposes only
   */
  static clear(): void {
    this.executedActions.clear();
  }
}
