/**
 * Action Contracts & Types (Phase 3)
 * 
 * Defines standard interfaces for write actions, previews,
 * pending confirmation state, idempotency, and verification.
 */

export type ActionType =
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'CREATE_APPOINTMENT'
  | 'CANCEL_APPOINTMENT'
  | 'CREATE_INVOICE'
  | 'UPDATE_INVOICE'
  | 'ADD_PAYMENT'
  | 'CHECKOUT_INVOICE'
  | 'TIP_OPERATION'
  | 'RECEIVE_STOCK'
  | 'ADJUST_STOCK';

export type ActionStatus =
  | 'SUCCESS'
  | 'PENDING_CONFIRMATION'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'PRECONDITION_FAILED'
  | 'AMBIGUOUS'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'ALREADY_APPLIED'
  | 'WRITE_FAILED'
  | 'VERIFICATION_FAILED'
  | 'PARTIAL_SUCCESS'
  | 'UNKNOWN_RESULT'
  | 'EXPIRED'
  | 'REJECTED';


export interface ActionPreviewItem {
  label: string;
  value: string | number;
  oldValue?: string | number;
}

export interface ActionPreviewData {
  action: ActionType;
  title: string;
  summary: string;
  items: ActionPreviewItem[];
  warnings?: string[];
  statusText?: string;
}

export interface PendingAction {
  referenceId: string;
  actionType: ActionType;
  parameters: Record<string, any>;
  preview: ActionPreviewData;
  actorId?: string;
  actorRole?: string;
  sessionId?: string;
  conversationId?: string;
  createdAt: number;
  expiresAt: number; // Timestamp ms
  idempotencyKey: string;
}

export interface ActionResult {
  success: boolean;
  status: ActionStatus;
  actionType: ActionType;
  actionReference?: string;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  verified: boolean;
  message: string;
  preview?: ActionPreviewData;
}

export interface ActionExecutionContext {
  userId?: string;
  role?: string;
  permissions?: string[] | { type: string; blocked?: string[]; role?: string } | 'all';
  sessionId?: string;
  conversationId?: string;
  branchId?: string;
  branchName?: string;
}

export interface WriteTool {
  actionType: ActionType;
  name: string;
  description: string;
  requiredPermission: string;

  execute(
    parameters: Record<string, any>,
    context: ActionExecutionContext
  ): Promise<ActionResult>;
}

// -------------------------------------------------------------
// PHASE 4: MULTI-STEP REASONING, DAG & ACTION ORCHESTRATION CONTRACTS
// -------------------------------------------------------------

export interface BusinessIntent {
  intentType: string;
  confidence?: number;
  entities: Record<string, any>;
  missingInformation: string[];
  ambiguities: string[];
  constraints: string[];
  dependsOnIntentId?: string;
  rawQuery?: string;
}

export interface ActionCondition {
  type: 'IF_STAFF_AVAILABLE' | 'IF_CUSTOMER_EXISTS' | 'IF_ACTION_SUCCESS' | 'EXPRESSION';
  expression?: string;
  field?: string;
  expectedValue?: any;
  fallbackParameters?: Record<string, any>;
}

export interface PlannedAction {
  actionId: string;
  actionType: ActionType;
  title: string;
  parameters: Record<string, any>;
  dependsOn: string[]; // List of actionIds that must succeed first
  condition?: ActionCondition;
  status: ActionStatus;
  preview?: ActionPreviewData;
  result?: ActionResult;
  isRead?: boolean;
}

export interface ActionDependency {
  actionId: string;
  dependsOn: string[];
}

export interface ActionPlan {
  planId: string;
  intentId?: string;
  title: string;
  summary: string;
  actions: PlannedAction[];
  dependencies: ActionDependency[];
  requiresConfirmation: boolean;
  status: ActionStatus;
  createdAt: number;
  expiresAt: number; // 10-minute default TTL
  actorId?: string;
  actorRole?: string;
  sessionId?: string;
  conversationId?: string;
  idempotencyKey?: string;
  rawUserQuery?: string;
}

export interface PlanExecutionResult {
  planId: string;
  success: boolean;
  status: ActionStatus;
  actionResults: Record<string, ActionResult>;
  executedActionIds: string[];
  skippedActionIds: string[];
  failedActionIds: string[];
  verified: boolean;
  message: string;
  summary: string;
  auditTrail: Array<{
    actionId: string;
    actionType: string;
    status: ActionStatus;
    timestamp: number;
    error?: string;
  }>;
}

