/**
 * Action Executor
 * 
 * Executes confirmed write actions safely.
 * Enforces:
 * 1. Idempotency check (double submit protection)
 * 2. Stale State Re-check (detects conflicts that occurred while awaiting user confirmation)
 * 3. Write Tool execution
 * 4. Audit logging
 */

import { PendingAction, ActionResult, ActionExecutionContext } from './ActionContracts';
import { ActionRegistry } from './ActionRegistry';
import { IdempotencyGuard } from './IdempotencyGuard';
import { ActionPreconditionValidator } from './ActionPreconditionValidator';
import { ConfirmationGate } from './ConfirmationGate';
import { ActionAuditLog } from './ActionAuditLog';

export class ActionExecutor {
  /**
   * Executes a confirmed pending action
   */
  static async executeConfirmedAction(
    pending: PendingAction,
    context: ActionExecutionContext = {}
  ): Promise<ActionResult> {
    const startTime = Date.now();

    // 1. Idempotency Check (Double submit prevention)
    const idempotencyKey = pending.idempotencyKey || IdempotencyGuard.generateKey(
      context.userId || 'anon',
      pending.actionType,
      pending.referenceId
    );

    const existingResult = IdempotencyGuard.check(idempotencyKey);
    if (existingResult) {
      ActionAuditLog.log({
        event: 'AI_IDEMPOTENCY_BLOCKED',
        actionType: pending.actionType,
        actionReference: pending.referenceId,
        status: 'ALREADY_APPLIED',
        actorId: context.userId,
        actorRole: context.role,
        reason: 'Duplicate execution attempt blocked by IdempotencyGuard'
      });
      return existingResult;
    }

    // 2. STALE DATA RE-CHECK (Critical Safety Guard)
    // Re-verify that target state hasn't changed since preview was generated
    const staleCheck = await ActionPreconditionValidator.recheckStaleState(
      pending.actionType,
      pending.parameters
    );

    if (!staleCheck.valid) {
      ActionAuditLog.log({
        event: 'AI_STALE_STATE_DETECTED',
        actionType: pending.actionType,
        actionReference: pending.referenceId,
        status: staleCheck.status,
        actorId: context.userId,
        actorRole: context.role,
        reason: staleCheck.message
      });

      // Clear pending action because state has changed
      ConfirmationGate.consumePendingAction(pending.referenceId);

      return {
        success: false,
        status: staleCheck.status,
        actionType: pending.actionType,
        actionReference: pending.referenceId,
        verified: false,
        error: { code: staleCheck.status, message: staleCheck.message || 'Trạng thái dữ liệu đã thay đổi.' },
        message: `⚠️ **Không thể thực hiện:** ${staleCheck.message}\n\nVui lòng tạo lại yêu cầu mới.`
      };
    }

    // 3. Locate Write Tool in Action Registry
    const tool = ActionRegistry.get(pending.actionType);
    if (!tool) {
      return {
        success: false,
        status: 'WRITE_FAILED',
        actionType: pending.actionType,
        actionReference: pending.referenceId,
        verified: false,
        error: { code: 'TOOL_NOT_FOUND', message: `Không tìm thấy công cụ ghi cho ${pending.actionType}` },
        message: 'Công cụ thực thi chưa được đăng ký trong hệ thống.'
      };
    }

    // 4. Execute Write Tool
    let result: ActionResult;
    try {
      result = await tool.execute(pending.parameters, {
        ...context,
        userId: pending.actorId || context.userId,
        role: pending.actorRole || context.role,
        sessionId: pending.sessionId || context.sessionId
      });
      result.actionReference = pending.referenceId;
    } catch (err: any) {
      result = {
        success: false,
        status: 'WRITE_FAILED',
        actionType: pending.actionType,
        actionReference: pending.referenceId,
        verified: false,
        error: { code: 'EXECUTION_EXCEPTION', message: err.message },
        message: `Lỗi bất ngờ trong quá trình ghi dữ liệu: ${err.message}`
      };
    }

    // 5. Consume Pending Action
    ConfirmationGate.consumePendingAction(pending.referenceId);

    // 6. Record in Idempotency Guard if execution succeeded
    if (result.success && result.verified) {
      IdempotencyGuard.record(idempotencyKey, result);
    }

    // 7. Audit Log
    ActionAuditLog.log({
      event: result.success ? 'AI_ACTION_VERIFIED' : 'AI_ACTION_FAILED',
      actionType: pending.actionType,
      actionReference: pending.referenceId,
      status: result.status,
      actorId: context.userId,
      actorRole: context.role,
      durationMs: Date.now() - startTime,
      reason: result.error?.message
    });

    return result;
  }
}
