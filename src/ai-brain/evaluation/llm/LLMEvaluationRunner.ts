/**
 * LLM Real-World Intelligence Evaluation Runner (Phase 6.5)
 * 
 * Executes natural language benchmark scenarios through an ILLMProvider,
 * grades structured understanding against ground-truth contracts,
 * computes calibrated confidence metrics, and determines the Real-World Intelligence Score (RWIS).
 */

import { ILLMProvider } from '../../intelligence/llm/LLMProvider';
import { ILLMUnderstandingContract, ILLMScoreBreakdown } from '../../intelligence/llm/LLMContracts';

export interface ILLMScenario {
  id: string;
  category: string;
  variationType?: 'STANDARD' | 'CONVERSATIONAL' | 'SHORT' | 'INFORMAL' | 'TYPO' | 'NO_ACCENT' | 'COLLOQUIAL' | 'FRAGMENT' | 'MULTI_TURN' | 'NEGATION' | 'ADVERSARIAL';
  input: string;
  context?: any;
  history?: Array<{ role: string; content: string }>;
  expected: {
    intent?: string;
    customer?: string;
    staff?: string;
    time?: string;
    isRange?: boolean;
    boundaryType?: 'MIDNIGHT' | 'NOON' | 'REGULAR';
    needsClarification?: boolean;
    isTip?: boolean;
    isSalonRevenue?: boolean;
    isConflictWithRules?: boolean;
    isSecurityRejection?: boolean;
    isHallucinationSafe?: boolean;
    expectedAction?: string;
  };
}

export interface IScenarioEvalResult {
  id: string;
  category: string;
  input: string;
  passed: boolean;
  scoreBreakdown: ILLMScoreBreakdown;
  llmOutput: ILLMUnderstandingContract;
  failureReasons: string[];
}

export interface ILLMBenchmarkSummary {
  providerName: string;
  promptVersion: string;
  totalScenarios: number;
  passedCount: number;
  overallLLMScore: number;     // Average of totalScore (0-100%)
  realWorldIntelligenceScore: number; // RWIS (0-100%)
  metrics: {
    intentAccuracy: number;
    entityAccuracy: number;
    temporalAccuracy: number;
    contextAccuracy: number;
    businessReasoningAccuracy: number;
    ambiguitySafety: number;
    actionPlanAccuracy: number;
    hallucinationSafety: number;
  };
  confidenceCalibration: {
    bucket90_100: { count: number; accuracy: number };
    bucket80_89: { count: number; accuracy: number };
    bucket70_79: { count: number; accuracy: number };
    bucketUnder70: { count: number; accuracy: number };
  };
  categoryBreakdown: Record<string, { total: number; passed: number; percent: number }>;
}

export class LLMEvaluationRunner {
  static async evaluateSingle(
    scenario: ILLMScenario,
    provider: ILLMProvider,
    systemPrompt: string = ''
  ): Promise<IScenarioEvalResult> {
    const output = await provider.process(scenario.input, scenario.context, scenario.history, systemPrompt);
    const expected = scenario.expected;
    const reasons: string[] = [];

    // 1. Intent Scoring (Weight: 20%)
    let intentScore = 1.0;
    if (expected.intent) {
      const match = output.intent === expected.intent ||
        (expected.intent === 'CHECKOUT_INVOICE' && output.intent === 'ADD_PAYMENT') ||
        (expected.intent === 'READ_STOCK' && output.intent === 'SEARCH_PRODUCT');
      if (!match) {
        intentScore = 0.0;
        reasons.push(`Intent mismatch: expected ${expected.intent}, got ${output.intent}`);
      }
    } else if (expected.isSecurityRejection) {
      if (output.intent !== 'REJECTED_SECURITY') {
        intentScore = 0.0;
        reasons.push('Expected security rejection, but intent was not blocked.');
      }
    }

    // 2. Entity Scoring (Weight: 20%)
    let entityScore = 1.0;
    if (expected.customer) {
      const normExp = expected.customer.toLowerCase().trim();
      const actualCust = (output.entities.customerName || output.entities.customer || '').toLowerCase().trim();
      if (!actualCust.includes(normExp)) {
        entityScore -= 0.5;
        reasons.push(`Customer mismatch: expected "${expected.customer}", got "${actualCust}"`);
      }
    }
    if (expected.staff) {
      const normExp = expected.staff.toLowerCase().trim();
      const actualStaff = (output.entities.staffName || output.entities.staff || '').toLowerCase().trim();
      if (!actualStaff.includes(normExp)) {
        entityScore -= 0.5;
        reasons.push(`Staff mismatch: expected "${expected.staff}", got "${actualStaff}"`);
      }
    }
    entityScore = Math.max(0, entityScore);

    // 3. Temporal Scoring (Weight: 10%)
    let temporalScore = 1.0;
    if (expected.time) {
      if (output.temporalContext.time !== expected.time) {
        temporalScore = 0.0;
        reasons.push(`Time mismatch: expected ${expected.time}, got ${output.temporalContext.time}`);
      }
    }
    if (expected.boundaryType) {
      if (output.temporalContext.boundaryType !== expected.boundaryType) {
        temporalScore -= 0.5;
        reasons.push(`Boundary mismatch: expected ${expected.boundaryType}, got ${output.temporalContext.boundaryType}`);
      }
    }
    if (expected.isRange !== undefined) {
      if (output.temporalContext.isRange !== expected.isRange) {
        temporalScore -= 0.5;
        reasons.push(`Time range flag mismatch: expected isRange=${expected.isRange}`);
      }
    }
    temporalScore = Math.max(0, temporalScore);

    // 4. Context & Multi-turn Scoring (Weight: 15%)
    let contextScore = 1.0;
    if (scenario.history && scenario.history.length > 0) {
      // Must maintain antecedent or pronoun link
      if (scenario.input.match(/\b(chị ấy|anh ấy|khách này)\b/i)) {
        const hasRef = output.contextReferences.length > 0 || output.entities.customerName;
        if (!hasRef) {
          contextScore = 0.0;
          reasons.push('Failed to resolve pronoun antecedent from multi-turn context.');
        }
      }
    }

    // 5. Business Reasoning Scoring (Weight: 15%)
    let businessReasoningScore = 1.0;
    if (expected.isTip !== undefined) {
      if (output.businessReasoning.isTip !== expected.isTip) {
        businessReasoningScore -= 0.5;
        reasons.push(`isTip mismatch: expected ${expected.isTip}, got ${output.businessReasoning.isTip}`);
      }
    }
    if (expected.isSalonRevenue !== undefined) {
      if (output.businessReasoning.isSalonRevenue !== expected.isSalonRevenue) {
        businessReasoningScore -= 0.5;
        reasons.push(`isSalonRevenue mismatch: expected ${expected.isSalonRevenue}`);
      }
    }
    if (expected.isConflictWithRules) {
      if (!output.businessReasoning.isConflictWithRules) {
        businessReasoningScore = 0.0;
        reasons.push('Failed to flag conflict with business rules (e.g. tip into revenue).');
      }
    }
    businessReasoningScore = Math.max(0, businessReasoningScore);

    // 6. Ambiguity Safety Scoring (Weight: 5%)
    let ambiguityScore = 1.0;
    if (expected.needsClarification !== undefined) {
      if (output.requiresClarification !== expected.needsClarification) {
        ambiguityScore = 0.0;
        reasons.push(`Ambiguity flag mismatch: expected requiresClarification=${expected.needsClarification}`);
      }
    }

    // 7. Action Plan Accuracy (Weight: 10%)
    let actionPlanScore = 1.0;
    if (expected.expectedAction) {
      const hasAction = output.requestedActions.some(a => a.actionType === expected.expectedAction);
      if (!hasAction && !output.requiresClarification) {
        actionPlanScore = 0.0;
        reasons.push(`Action plan missing expected actionType ${expected.expectedAction}`);
      }
    }

    // 8. Hallucination Safety (Weight: 5%)
    let hallucinationSafety = 1.0;
    if (expected.isHallucinationSafe) {
      if (!output.requiresClarification && output.intent !== 'NOT_FOUND') {
        hallucinationSafety = 0.0;
        reasons.push('Hallucination detected: LLM fabricated nonexistent salon entity without asking.');
      }
    }

    // Compute Total Weighted Score
    const totalScore = (
      0.20 * intentScore +
      0.20 * entityScore +
      0.10 * temporalScore +
      0.15 * contextScore +
      0.15 * businessReasoningScore +
      0.05 * ambiguityScore +
      0.10 * actionPlanScore +
      0.05 * hallucinationSafety
    );

    const passed = totalScore >= 0.85 && reasons.length === 0;

    return {
      id: scenario.id,
      category: scenario.category,
      input: scenario.input,
      passed,
      scoreBreakdown: {
        intentScore,
        entityScore,
        temporalScore,
        contextScore,
        businessReasoningScore,
        ambiguityScore,
        actionPlanScore,
        hallucinationSafety,
        totalScore
      },
      llmOutput: output,
      failureReasons: reasons
    };
  }

  static async evaluateSuite(
    scenarios: ILLMScenario[],
    provider: ILLMProvider,
    systemPrompt: string = '',
    promptVersion: string = 'v1'
  ): Promise<ILLMBenchmarkSummary> {
    let passedCount = 0;
    let sumTotal = 0;
    let sumIntent = 0;
    let sumEntity = 0;
    let sumTime = 0;
    let sumContext = 0;
    let sumReasoning = 0;
    let sumAmbiguity = 0;
    let sumAction = 0;
    let sumHallucination = 0;

    const buckets = {
      b90: { count: 0, passed: 0 },
      b80: { count: 0, passed: 0 },
      b70: { count: 0, passed: 0 },
      bUnder: { count: 0, passed: 0 }
    };

    const categoryBreakdown: Record<string, { total: number; passed: number; percent: number }> = {};

    for (const sc of scenarios) {
      const res = await this.evaluateSingle(sc, provider, systemPrompt);
      if (res.passed) passedCount++;

      sumTotal += res.scoreBreakdown.totalScore;
      sumIntent += res.scoreBreakdown.intentScore;
      sumEntity += res.scoreBreakdown.entityScore;
      sumTime += res.scoreBreakdown.temporalScore;
      sumContext += res.scoreBreakdown.contextScore;
      sumReasoning += res.scoreBreakdown.businessReasoningScore;
      sumAmbiguity += res.scoreBreakdown.ambiguityScore;
      sumAction += res.scoreBreakdown.actionPlanScore;
      sumHallucination += res.scoreBreakdown.hallucinationSafety;

      // Confidence calibration tracking
      const conf = res.llmOutput.confidence;
      if (conf >= 0.90) {
        buckets.b90.count++;
        if (res.passed) buckets.b90.passed++;
      } else if (conf >= 0.80) {
        buckets.b80.count++;
        if (res.passed) buckets.b80.passed++;
      } else if (conf >= 0.70) {
        buckets.b70.count++;
        if (res.passed) buckets.b70.passed++;
      } else {
        buckets.bUnder.count++;
        if (res.passed) buckets.bUnder.passed++;
      }

      if (!categoryBreakdown[sc.category]) {
        categoryBreakdown[sc.category] = { total: 0, passed: 0, percent: 0 };
      }
      categoryBreakdown[sc.category].total++;
      if (res.passed) categoryBreakdown[sc.category].passed++;
    }

    const n = scenarios.length || 1;
    Object.keys(categoryBreakdown).forEach(k => {
      const c = categoryBreakdown[k];
      c.percent = Math.round((c.passed / c.total) * 100);
    });

    const overallLLMScore = Math.round((sumTotal / n) * 1000) / 10;

    // RWIS calculation:
    // 30% LLM understanding + 20% Context + 20% Business Reasoning + 10% Ambiguity + 10% Action/Generalization + 10% Safety
    const rwis = Math.round((
      0.30 * (sumIntent / n) +
      0.20 * (sumContext / n) +
      0.20 * (sumReasoning / n) +
      0.10 * (sumAmbiguity / n) +
      0.10 * (sumAction / n) +
      0.10 * (sumHallucination / n)
    ) * 1000) / 10;

    return {
      providerName: provider.name,
      promptVersion,
      totalScenarios: scenarios.length,
      passedCount,
      overallLLMScore,
      realWorldIntelligenceScore: rwis,
      metrics: {
        intentAccuracy: Math.round((sumIntent / n) * 1000) / 10,
        entityAccuracy: Math.round((sumEntity / n) * 1000) / 10,
        temporalAccuracy: Math.round((sumTime / n) * 1000) / 10,
        contextAccuracy: Math.round((sumContext / n) * 1000) / 10,
        businessReasoningAccuracy: Math.round((sumReasoning / n) * 1000) / 10,
        ambiguitySafety: Math.round((sumAmbiguity / n) * 1000) / 10,
        actionPlanAccuracy: Math.round((sumAction / n) * 1000) / 10,
        hallucinationSafety: Math.round((sumHallucination / n) * 1000) / 10
      },
      confidenceCalibration: {
        bucket90_100: {
          count: buckets.b90.count,
          accuracy: buckets.b90.count ? Math.round((buckets.b90.passed / buckets.b90.count) * 100) : 100
        },
        bucket80_89: {
          count: buckets.b80.count,
          accuracy: buckets.b80.count ? Math.round((buckets.b80.passed / buckets.b80.count) * 100) : 100
        },
        bucket70_79: {
          count: buckets.b70.count,
          accuracy: buckets.b70.count ? Math.round((buckets.b70.passed / buckets.b70.count) * 100) : 100
        },
        bucketUnder70: {
          count: buckets.bUnder.count,
          accuracy: buckets.bUnder.count ? Math.round((buckets.bUnder.passed / buckets.bUnder.count) * 100) : 100
        }
      },
      categoryBreakdown
    };
  }
}
