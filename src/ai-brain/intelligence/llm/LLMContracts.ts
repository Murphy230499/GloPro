/**
 * LLM Understanding Contracts & Schemas (Phase 6.5)
 * 
 * Defines the structured JSON contract that LLMs must produce,
 * strictly separating user-spoken facts, inferred assumptions, unknowns,
 * temporal boundaries, and business reasoning.
 */

export type AssumptionCategory = 'FACT' | 'INFERRED_ASSUMPTION' | 'UNKNOWN';

export interface IAssumptionItem {
  text: string;
  category: AssumptionCategory;
  rationale: string;
}

export interface IContextReference {
  pronoun: string;
  resolvedTo: string;
  entityType: 'customer' | 'staff' | 'appointment' | 'invoice';
}

export interface ITemporalContext {
  date?: string;             // YYYY-MM-DD
  time?: string;             // HH:mm (e.g., 15:00)
  isRange?: boolean;
  rangeLabel?: string;       // e.g. "chiều mai (13:00 - 18:00)"
  boundaryType?: 'MIDNIGHT' | 'NOON' | 'REGULAR'; // 12h đêm = 00:00 (MIDNIGHT), 12h trưa = 12:00 (NOON)
}

export interface IAmbiguityItem {
  field: string;
  question: string;
  reason: string;
}

export interface IRequestedAction {
  actionType: string;
  parameters: Record<string, any>;
  sequenceOrder?: number;
}

export interface IBusinessReasoning {
  metricType?: 'REVENUE' | 'TIP' | 'PAYMENT' | 'CASH_FLOW' | 'STAFF_REVENUE' | 'COMMISSION' | 'PAYROLL' | 'STOCK';
  isTip: boolean;
  isSalonRevenue: boolean;
  rationale: string;
  isConflictWithRules?: boolean;
}

export interface ILLMUnderstandingContract {
  intent: string;
  entities: Record<string, any>;
  temporalContext: ITemporalContext;
  contextReferences: IContextReference[];
  assumptions: IAssumptionItem[];
  ambiguities: IAmbiguityItem[];
  requestedActions: IRequestedAction[];
  businessReasoning: IBusinessReasoning;
  confidence: number;          // Calibrated 0.0 - 1.0
  requiresClarification: boolean;
  rawThoughtProcess?: string;  // Internal LLM reasoning trace
}

/**
 * Scoring breakdown metrics for LLM Real-World Intelligence
 */
export interface ILLMScoreBreakdown {
  intentScore: number;          // Weight 0.20
  entityScore: number;          // Weight 0.20
  temporalScore: number;        // Weight 0.10
  contextScore: number;         // Weight 0.15
  businessReasoningScore: number; // Weight 0.15
  ambiguityScore: number;       // Weight 0.05
  actionPlanScore: number;      // Weight 0.10
  hallucinationSafety: number;  // Weight 0.05
  totalScore: number;           // 0.0 to 1.0
}
