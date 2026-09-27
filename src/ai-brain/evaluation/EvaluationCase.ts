/**
 * EvaluationCase Contract (Phase 5 Evaluation Framework)
 * 
 * Defines standard structured evaluation test cases for measuring Agent intelligence.
 */

export type EvaluationCategory =
  | 'INTENT_UNDERSTANDING'
  | 'ENTITY_RESOLUTION'
  | 'DATETIME_UNDERSTANDING'
  | 'CONTEXT_TRACKING'
  | 'CORRECTION'
  | 'CANCELLATION'
  | 'AMBIGUITY'
  | 'MULTISTEP'
  | 'SAFETY'
  // Phase 5.5 Adversarial Categories
  | 'INTENT_CONFUSION'
  | 'ENTITY_AMBIGUITY'
  | 'DATETIME_AMBIGUITY'
  | 'CONTEXT_TRAP'
  | 'CORRECTION_TRAP'
  | 'MULTISTEP_TRAP'
  | 'BUSINESS_LOGIC_TRAP'
  | 'HALLUCINATION'
  | 'PROMPT_INJECTION'
  | 'SECURITY_TAMPERING'
  | 'DESTRUCTIVE_ACTION'
  | 'HOLDOUT';

export type EvaluationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FailureClassification =
  | 'INTENT_ERROR'
  | 'ENTITY_ERROR'
  | 'TIME_ERROR'
  | 'CONTEXT_ERROR'
  | 'AMBIGUITY_ERROR'
  | 'HALLUCINATION'
  | 'BUSINESS_LOGIC_ERROR'
  | 'SECURITY_BYPASS'
  | 'AUTHORIZATION_ERROR'
  | 'TENANT_ISOLATION_ERROR'
  | 'BRANCH_ISOLATION_ERROR'
  | 'CONFIRMATION_BYPASS'
  | 'STALE_STATE_ERROR'
  | 'IDEMPOTENCY_ERROR'
  | 'MULTISTEP_ERROR'
  | 'PARTIAL_FAILURE_ERROR'
  | 'UNSUPPORTED_ACTION_ERROR'
  | 'TEST_DESIGN_ERROR';

export interface ExpectedInterpretation {
  intent?: string;
  customer?: string | null;
  staff?: string | null;
  service?: string | null;
  date?: string | null;
  time?: string | null;
  amount?: number | null;
  missingInformation?: string[];
  isAmbiguous?: boolean;
  needsClarification?: boolean;
  isUnsupported?: boolean;
  isRejected?: boolean;
  actionTypes?: string[];
  requiresConfirmation?: boolean;
}

export interface EvaluationScenario {
  id: string;
  category: EvaluationCategory;
  input: string;
  description: string;
  severity?: EvaluationSeverity;
  isHoldout?: boolean;
  conversationHistory?: Array<{ role: string; content: string }>;
  context?: {
    sessionId?: string;
    selectedCustomer?: any;
    selectedAppointment?: any;
    currentUser?: { id?: string; role?: string; tenantId?: string; branchId?: string };
    activeContextEntities?: Array<{ type: string; id?: string; name: string; phone?: string; data?: any }>;
    databaseSnapshot?: {
      customers?: any[];
      staff?: any[];
      services?: any[];
      appointments?: any[];
    };
    targetTenantId?: string;
    targetBranchId?: string;
  };
  expected: ExpectedInterpretation;
}

export interface EvaluationResult {
  scenarioId: string;
  category: EvaluationCategory;
  input: string;
  passed: boolean;
  severity?: EvaluationSeverity;
  isHoldout?: boolean;
  intentPassed: boolean;
  entityPassed: boolean;
  timePassed: boolean;
  contextPassed: boolean;
  ambiguityPassed: boolean;
  safetyPassed: boolean;
  hallucinated: boolean;
  failureClassification?: FailureClassification;
  actual: Record<string, any>;
  expected: ExpectedInterpretation;
  failureReasons: string[];
}
