/**
 * Confirmation Gate
 * 
 * Enforces explicit human confirmation before executing any database mutation.
 * Guarantees that:
 * 1. Confirmations are bound to authenticated actor & session (User A cannot confirm for User B).
 * 2. Pending actions expire after TTL (10 minutes).
 * 3. Parameters are locked server-side (prevents client-side tampering).
 */

import { ActionType, ActionPreviewData, PendingAction, ActionExecutionContext, ActionPlan } from './ActionContracts';
import { AgentContextManager } from '../context/AgentContextManager';

export interface ConfirmationDecision {
  confirmed: boolean;
  cancelled: boolean;
  pendingAction?: PendingAction;
  pendingPlan?: ActionPlan;
  isCorrection?: boolean;
  correctionField?: string;
  correctionValue?: any;
  error?: string;
  statusCode?: string;
}

export class ConfirmationGate {
  private static pendingActions: Map<string, PendingAction> = new Map();
  private static pendingPlans: Map<string, ActionPlan> = new Map();
  private static TTL_MS = 10 * 60 * 1000; // 10 minutes

  /**
   * Registers a validated action plan as pending user confirmation
   */
  static createPendingAction(
    actionType: ActionType,
    parameters: Record<string, any>,
    preview: ActionPreviewData,
    context: ActionExecutionContext = {}
  ): PendingAction {
    this.cleanExpired();

    const referenceId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = `${context.userId || 'anon'}_${actionType}_${referenceId}`;

    const pendingAction: PendingAction = {
      referenceId,
      actionType,
      parameters: { ...parameters }, // Shallow clone to lock parameters server-side
      preview,
      actorId: context.userId,
      actorRole: context.role,
      sessionId: context.sessionId,
      conversationId: context.conversationId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.TTL_MS,
      idempotencyKey
    };

    this.pendingActions.set(referenceId, pendingAction);
    if (context.sessionId) {
      const ctx = AgentContextManager.getSession(context.sessionId);
      ctx.pendingAction = pendingAction;
    }
    return pendingAction;
  }

  /**
   * Registers a validated multi-step ActionPlan as pending user confirmation
   */
  static createPendingPlan(plan: ActionPlan, context: ActionExecutionContext = {}): ActionPlan {
    this.cleanExpired();
    plan.createdAt = plan.createdAt || Date.now();
    plan.expiresAt = plan.expiresAt || (Date.now() + this.TTL_MS);
    plan.actorId = plan.actorId || context.userId;
    plan.actorRole = plan.actorRole || context.role;
    plan.sessionId = plan.sessionId || context.sessionId;
    plan.status = 'PENDING_CONFIRMATION';

    this.pendingPlans.set(plan.planId, plan);
    if (context.sessionId) {
      AgentContextManager.setPendingPlan(context.sessionId, plan);
    }
    return plan;
  }

  static getPendingPlan(planId: string): ActionPlan | undefined {
    return this.pendingPlans.get(planId);
  }

  static consumePendingPlan(planId: string): ActionPlan | undefined {
    const p = this.pendingPlans.get(planId);
    if (p) this.pendingPlans.delete(planId);
    return p;
  }

  /**
   * Evaluates user intent to see if it confirms, cancels, corrects, or ignores a pending action/plan
   */
  static evaluateUserResponse(
    message: string,
    context: ActionExecutionContext = {},
    explicitReferenceId?: string
  ): ConfirmationDecision {
    // 1. Locate pending plan or action
    let pendingPlan: ActionPlan | undefined;
    let pendingAction: PendingAction | undefined;

    if (explicitReferenceId) {
      pendingPlan = this.pendingPlans.get(explicitReferenceId);
      pendingAction = this.pendingActions.get(explicitReferenceId);
    } else {
      // Find latest pending plan
      const allPlans = Array.from(this.pendingPlans.values()).filter(p => {
        if (context.sessionId && (!p.sessionId || p.sessionId !== context.sessionId)) return false;
        if (context.userId && (!p.actorId || p.actorId !== context.userId)) return false;
        return true;
      });
      pendingPlan = allPlans[allPlans.length - 1];

      // Find latest pending action
      const allActions = Array.from(this.pendingActions.values()).filter(p => {
        if (context.sessionId && (!p.sessionId || p.sessionId !== context.sessionId)) return false;
        if (context.userId && (!p.actorId || p.actorId !== context.userId)) return false;
        return true;
      });
      pendingAction = allActions[allActions.length - 1];
    }

    const pending = pendingPlan || pendingAction;
    if (!pending) {
      return {
        confirmed: false,
        cancelled: false,
        error: 'Không tìm thấy thao tác nào đang chờ xác nhận.',
        statusCode: 'NO_PENDING_ACTION'
      };
    }

    // 2. Security Check: Actor and Session Binding
    if (context.userId && pending.actorId && context.userId !== pending.actorId) {
      return {
        confirmed: false,
        cancelled: false,
        error: 'Bạn không có quyền xác nhận thao tác do người dùng khác tạo.',
        statusCode: 'PERMISSION_DENIED'
      };
    }

    // 3. Check expiration
    if (Date.now() > pending.expiresAt) {
      if (pendingPlan) this.pendingPlans.delete(pendingPlan.planId);
      if (pendingAction) this.pendingActions.delete(pendingAction.referenceId);
      return {
        confirmed: false,
        cancelled: false,
        error: 'Thao tác này đã hết hạn chờ xác nhận (quá 10 phút). Vui lòng yêu cầu lại.',
        statusCode: 'EXPIRED'
      };
    }

    const lower = message.toLowerCase().trim();

    // 4. Check for User Correction to Pending Plan / Action
    if (context.sessionId) {
      const interaction = AgentContextManager.classifyInteraction(message, context.sessionId);
      if (interaction === 'CORRECTION') {
        const corr = AgentContextManager.applyCorrection(context.sessionId, message);
        if (corr.corrected) {
          return {
            confirmed: false,
            cancelled: false,
            isCorrection: true,
            correctionField: corr.updatedField,
            correctionValue: corr.newValue,
            pendingPlan,
            pendingAction
          };
        }
      }
    }

    // 5. Affirmative confirmation keywords
    const affirmativeKeywords = [
      'đồng ý', 'xác nhận', 'ok', 'oke', 'okie', 'tạo đi', 'lưu đi', 'hủy đi',
      'chắc chắn', 'đồng ý nhé', 'tạo luôn', 'làm đi', 'yes', 'confirm', 'duyệt',
      'chấp nhận', 'tiến hành', 'tôi đồng ý', 'tôi xác nhận', 'xác nhận tạo', 'xác nhận hủy'
    ];
    const isAffirmative = affirmativeKeywords.some(kw => {
      const idx = lower.indexOf(kw);
      if (idx === -1) return false;
      if (idx > 0 && !/[\s,.;:!?]/.test(lower[idx - 1])) return false;
      const endIdx = idx + kw.length;
      if (endIdx < lower.length && !/[\s,.;:!?]/.test(lower[endIdx])) return false;
      return true;
    });

    // 6. Rejection keywords
    const rejectionKeywords = [
      'không', 'hủy', 'thôi', 'bỏ qua', 'đừng tạo', 'đừng hủy', 'không cần',
      'hủy bỏ', 'cancel', 'no', 'dừng lại', 'từ chối', 'không đồng ý', 'tôi không muốn'
    ];
    const isRejection = rejectionKeywords.some(kw => {
      const idx = lower.indexOf(kw);
      if (idx === -1) return false;
      if (idx > 0 && !/[\s,.;:!?]/.test(lower[idx - 1])) return false;
      const endIdx = idx + kw.length;
      if (endIdx < lower.length && !/[\s,.;:!?]/.test(lower[endIdx])) return false;
      return true;
    });

    if (isAffirmative) {
      return { confirmed: true, cancelled: false, pendingAction, pendingPlan };
    }

    if (isRejection) {
      if (pendingPlan) this.pendingPlans.delete(pendingPlan.planId);
      if (pendingAction) this.pendingActions.delete(pendingAction.referenceId);
      return { confirmed: false, cancelled: true, pendingAction, pendingPlan };
    }

    return { confirmed: false, cancelled: false, pendingAction, pendingPlan };
  }

  /**
   * Consumes and removes a pending action once it is executed
   */
  static consumePendingAction(referenceId: string): PendingAction | undefined {
    const action = this.pendingActions.get(referenceId);
    if (action) {
      this.pendingActions.delete(referenceId);
    }
    return action;
  }

  /**
   * Cancels any pending action for a session (e.g. when user changes topic)
   */
  static cancelPendingActionForSession(sessionId?: string, userId?: string): void {
    if (!sessionId && !userId) return;
    for (const [ref, action] of this.pendingActions.entries()) {
      if ((sessionId && action.sessionId === sessionId) || (userId && action.actorId === userId)) {
        this.pendingActions.delete(ref);
      }
    }
    for (const [id, plan] of this.pendingPlans.entries()) {
      if ((sessionId && plan.sessionId === sessionId) || (userId && plan.actorId === userId)) {
        this.pendingPlans.delete(id);
      }
    }
  }

  private static cleanExpired(): void {
    const now = Date.now();
    for (const [ref, action] of this.pendingActions.entries()) {
      if (now > action.expiresAt) {
        this.pendingActions.delete(ref);
      }
    }
    for (const [id, plan] of this.pendingPlans.entries()) {
      if (now > plan.expiresAt) {
        this.pendingPlans.delete(id);
      }
    }
  }

  /**
   * For testing
   */
  static clear(): void {
    this.pendingActions.clear();
    this.pendingPlans.clear();
  }
}

