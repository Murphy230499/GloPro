/**
 * ActionOrchestrator (Phase 4)
 * 
 * Orchestrates multi-step action plans (DAG) with topological sorting,
 * dependency parameter injection, conditional branching, partial failure recovery,
 * and strict dispatch through ActionExecutor to enforce Phase 3 safety gates.
 */

import {
  ActionPlan,
  PlannedAction,
  ActionResult,
  PlanExecutionResult,
  ActionExecutionContext,
  ActionStatus,
  PendingAction
} from './ActionContracts';
import { ActionExecutor } from './ActionExecutor';
import { ActionAuditLog } from './ActionAuditLog';
import { AgentContextManager } from '../context/AgentContextManager';
import { base44 } from '../../api/base44Client';
import { checkSchedulingConflict } from '../../agents/appointment-agent/conflictDetector';

export class ActionOrchestrator {
  /**
   * Topologically sorts actions in an ActionPlan to ensure dependencies execute first.
   * Throws an error or returns null if a circular dependency is detected.
   */
  static topologicalSort(plan: ActionPlan): PlannedAction[] | null {
    const actionsMap = new Map<string, PlannedAction>();
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    for (const action of plan.actions) {
      actionsMap.set(action.actionId, action);
      inDegree.set(action.actionId, 0);
      adjList.set(action.actionId, []);
    }

    for (const dep of plan.dependencies) {
      for (const parentId of dep.dependsOn) {
        if (adjList.has(parentId)) {
          adjList.get(parentId)!.push(dep.actionId);
          inDegree.set(dep.actionId, (inDegree.get(dep.actionId) || 0) + 1);
        }
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(id);
      }
    }

    const sorted: PlannedAction[] = [];
    while (queue.length > 0) {
      const currId = queue.shift()!;
      sorted.push(actionsMap.get(currId)!);

      for (const neighborId of adjList.get(currId) || []) {
        inDegree.set(neighborId, inDegree.get(neighborId)! - 1);
        if (inDegree.get(neighborId) === 0) {
          queue.push(neighborId);
        }
      }
    }

    if (sorted.length !== plan.actions.length) {
      // Circular dependency detected!
      return null;
    }

    return sorted;
  }

  /**
   * Executes an approved ActionPlan through sequential, dependency-aware orchestration
   */
  static async executePlan(
    plan: ActionPlan,
    context: ActionExecutionContext = {}
  ): Promise<PlanExecutionResult> {
    const startTime = Date.now();
    ActionAuditLog.log('AI_PLAN_VALIDATED', {
      planId: plan.planId,
      title: plan.title,
      totalActions: plan.actions.length,
      actorRole: context.role
    });

    // 1. Topological sort
    const sortedActions = this.topologicalSort(plan);
    if (!sortedActions) {
      ActionAuditLog.log('AI_ACTION_FAILED', {
        planId: plan.planId,
        status: 'VALIDATION_ERROR',
        reason: 'Circular dependency detected in action graph'
      });
      return {
        planId: plan.planId,
        success: false,
        status: 'VALIDATION_ERROR',
        actionResults: {},
        executedActionIds: [],
        skippedActionIds: plan.actions.map(a => a.actionId),
        failedActionIds: [],
        verified: false,
        message: '❌ **Lỗi cấu trúc kế hoạch:** Phát hiện phụ thuộc vòng (circular dependency) trong các bước hành động.',
        summary: 'Kế hoạch bị từ chối do lỗi cấu trúc đồ thị.',
        auditTrail: []
      };
    }

    const actionResults: Record<string, ActionResult> = {};
    const executedActionIds: string[] = [];
    const skippedActionIds: string[] = [];
    const failedActionIds: string[] = [];
    const auditTrail: PlanExecutionResult['auditTrail'] = [];

    // 2. Sequential Execution
    for (const action of sortedActions) {
      // Check if any prerequisite dependency failed
      const hasFailedDep = action.dependsOn.some(depId => failedActionIds.includes(depId) || skippedActionIds.includes(depId));
      if (hasFailedDep) {
        skippedActionIds.push(action.actionId);
        action.status = 'PRECONDITION_FAILED';
        auditTrail.push({
          actionId: action.actionId,
          actionType: action.actionType,
          status: 'PRECONDITION_FAILED',
          timestamp: Date.now(),
          error: 'Bị bỏ qua do bước phụ thuộc trước đó không thành công.'
        });
        continue;
      }

      // Dynamic parameter resolution from previous step results (piping)
      const resolvedParams = { ...action.parameters };
      for (const depId of action.dependsOn) {
        const prevRes = actionResults[depId];
        if (prevRes?.success && prevRes.data) {
          if (action.actionType === 'CREATE_APPOINTMENT') {
            if (!resolvedParams.customerId && prevRes.data.id) {
              resolvedParams.customerId = prevRes.data.id;
            }
            if (!resolvedParams.customerPhone && prevRes.data.phone) {
              resolvedParams.customerPhone = prevRes.data.phone;
            }
            if (!resolvedParams.customerName && prevRes.data.name) {
              resolvedParams.customerName = prevRes.data.name;
            }
          }
        }
      }

      // Handle conditional staff availability evaluation (if action has condition)
      if (action.condition?.type === 'IF_STAFF_AVAILABLE') {
        const staffName = resolvedParams.staffName || action.parameters.preferredStaffName;
        const appts = await base44.entities.Appointment.list().catch(() => []);
        const conflict = checkSchedulingConflict(
          appts,
          staffName,
          resolvedParams.date,
          resolvedParams.time,
          45
        );

        if (conflict.hasConflict) {
          // Trigger fallback strategy
          const allStaff = await base44.entities.Staff.list().catch(() => []);
          const freeStaff = allStaff.find(s => {
            const name = s.full_name || s.name;
            return name && !checkSchedulingConflict(appts, name, resolvedParams.date, resolvedParams.time, 45).hasConflict;
          });

          if (freeStaff) {
            resolvedParams.staffName = freeStaff.full_name || freeStaff.name;
            action.title += ` (Tự động đổi sang ${resolvedParams.staffName} do thợ chính bận)`;
          }
        }
      }

      // Convert PlannedAction to PendingAction format for ActionExecutor
      const stepPending: PendingAction = {
        referenceId: `${plan.planId}_${action.actionId}`,
        actionType: action.actionType,
        parameters: resolvedParams,
        preview: action.preview || {
          action: action.actionType,
          title: action.title,
          summary: '',
          items: []
        },
        actorId: context.userId || plan.actorId,
        actorRole: context.role || plan.actorRole,
        sessionId: context.sessionId || plan.sessionId,
        createdAt: Date.now(),
        expiresAt: plan.expiresAt,
        idempotencyKey: `idem_${plan.planId}_${action.actionId}`
      };

      ActionAuditLog.log('AI_ACTION_STARTED', {
        planId: plan.planId,
        actionId: action.actionId,
        actionType: action.actionType,
        actorRole: context.role
      });

      // Execute strictly through ActionExecutor to enforce Phase 3 gates!
      const execResult = await ActionExecutor.executeConfirmedAction(stepPending, context);
      actionResults[action.actionId] = execResult;
      action.result = execResult;
      action.status = execResult.status;

      if (execResult.success && execResult.verified) {
        executedActionIds.push(action.actionId);
        auditTrail.push({
          actionId: action.actionId,
          actionType: action.actionType,
          status: execResult.status,
          timestamp: Date.now()
        });

        // Record entity to AgentContextManager for multi-turn pronoun tracking
        if (context.sessionId && execResult.data) {
          if (action.actionType === 'CREATE_CUSTOMER') {
            AgentContextManager.recordEntity(context.sessionId, {
              type: 'customer',
              id: execResult.data.id,
              name: execResult.data.name,
              phone: execResult.data.phone
            });
          } else if (action.actionType === 'CREATE_APPOINTMENT') {
            AgentContextManager.recordEntity(context.sessionId, {
              type: 'appointment',
              id: execResult.data.id,
              name: `Lịch hẹn ${execResult.data.date} ${execResult.data.start_time}`,
              data: execResult.data
            });
          }
        }
      } else {
        failedActionIds.push(action.actionId);
        auditTrail.push({
          actionId: action.actionId,
          actionType: action.actionType,
          status: execResult.status,
          timestamp: Date.now(),
          error: execResult.message || execResult.error?.message
        });
      }
    }

    // 3. Determine Overall Plan Status & Formulate Response Message
    const totalCount = plan.actions.length;
    const successCount = executedActionIds.length;
    const failedCount = failedActionIds.length;

    let overallStatus: ActionStatus = 'SUCCESS';
    let responseMsg = '';

    if (successCount === totalCount) {
      overallStatus = 'SUCCESS';
      responseMsg = `✅ **Đã hoàn thành toàn bộ ${totalCount} thao tác:**\n` +
        plan.actions.map((a, i) => `• Bước ${i + 1}: ${a.title} — **Thành công**`).join('\n');
      ActionAuditLog.log('AI_PLAN_COMPLETED', { planId: plan.planId, status: 'SUCCESS', executedCount: totalCount });
    } else if (successCount > 0 && failedCount > 0) {
      overallStatus = 'PARTIAL_SUCCESS';
      const firstFailedResult = actionResults[failedActionIds[0]];
      responseMsg = `⚠️ **Hoàn thành một phần (${successCount}/${totalCount} bước):**\n` +
        plan.actions.map(a => {
          if (executedActionIds.includes(a.actionId)) return `• ✅ ${a.title}: **Đã tạo và xác minh thành công.**`;
          if (failedActionIds.includes(a.actionId)) return `• ❌ ${a.title}: **Không thể thực hiện** (${actionResults[a.actionId]?.message || 'Lỗi điều kiện'}).`;
          return `• ⏭️ ${a.title}: **Đã tạm dừng** do bước trước không thành công.`;
        }).join('\n');
      ActionAuditLog.log('AI_PLAN_PARTIAL_SUCCESS', {
        planId: plan.planId,
        successCount,
        failedCount,
        firstFailure: firstFailedResult?.error?.message
      });
    } else {
      const firstFail = actionResults[failedActionIds[0]];
      overallStatus = firstFail?.status || 'WRITE_FAILED';
      responseMsg = `❌ **Không thể thực hiện kế hoạch:** ${firstFail?.message || 'Vi phạm điều kiện thực thi.'}`;
      ActionAuditLog.log('AI_ACTION_FAILED', { planId: plan.planId, status: overallStatus, failedCount });
    }

    return {
      planId: plan.planId,
      success: overallStatus === 'SUCCESS',
      status: overallStatus,
      actionResults,
      executedActionIds,
      skippedActionIds,
      failedActionIds,
      verified: overallStatus === 'SUCCESS',
      message: responseMsg,
      summary: `Thực hiện ${successCount}/${totalCount} thao tác.`,
      auditTrail
    };
  }
}
