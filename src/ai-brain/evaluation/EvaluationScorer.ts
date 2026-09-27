/**
 * EvaluationScorer (Phase 5 Evaluation Framework)
 * 
 * Computes accuracy metrics across categories:
 * - Intent Accuracy
 * - Entity Accuracy
 * - Time Accuracy
 * - Context Accuracy
 * - Ambiguity Safety
 * - Safety Accuracy
 * - Hallucination Rate
 * - Overall Accuracy
 */

import { EvaluationResult } from './EvaluationCase';

export interface EvaluationMetricsSummary {
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  overallAccuracy: number;
  intentAccuracy: number;
  entityAccuracy: number;
  timeAccuracy: number;
  contextAccuracy: number;
  ambiguitySafety: number;
  safetyAccuracy: number;
  hallucinationRate: number;
  categoryBreakdown: Record<string, { total: number; passed: number; accuracy: number }>;
}

export class EvaluationScorer {
  static computeSummary(results: EvaluationResult[]): EvaluationMetricsSummary {
    const total = results.length;
    if (total === 0) {
      return {
        totalScenarios: 0,
        passedCount: 0,
        failedCount: 0,
        overallAccuracy: 0,
        intentAccuracy: 0,
        entityAccuracy: 0,
        timeAccuracy: 0,
        contextAccuracy: 0,
        ambiguitySafety: 0,
        safetyAccuracy: 0,
        hallucinationRate: 0,
        categoryBreakdown: {}
      };
    }

    let passedTotal = 0;
    let intentPassed = 0;
    let entityPassed = 0;
    let timePassed = 0;
    let contextPassed = 0;
    let ambiguityPassed = 0;
    let safetyPassed = 0;
    let hallucinatedCount = 0;

    const categoryStats: Record<string, { total: number; passed: number }> = {};

    for (const res of results) {
      if (res.passed) passedTotal++;
      if (res.intentPassed) intentPassed++;
      if (res.entityPassed) entityPassed++;
      if (res.timePassed) timePassed++;
      if (res.contextPassed) contextPassed++;
      if (res.ambiguityPassed) ambiguityPassed++;
      if (res.safetyPassed) safetyPassed++;
      if (res.hallucinated) hallucinatedCount++;

      if (!categoryStats[res.category]) {
        categoryStats[res.category] = { total: 0, passed: 0 };
      }
      categoryStats[res.category].total++;
      if (res.passed) categoryStats[res.category].passed++;
    }

    const roundPercent = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 100);

    const categoryBreakdown: Record<string, { total: number; passed: number; accuracy: number }> = {};
    for (const [cat, stat] of Object.entries(categoryStats)) {
      categoryBreakdown[cat] = {
        total: stat.total,
        passed: stat.passed,
        accuracy: roundPercent(stat.passed, stat.total)
      };
    }

    return {
      totalScenarios: total,
      passedCount: passedTotal,
      failedCount: total - passedTotal,
      overallAccuracy: roundPercent(passedTotal, total),
      intentAccuracy: roundPercent(intentPassed, total),
      entityAccuracy: roundPercent(entityPassed, total),
      timeAccuracy: roundPercent(timePassed, total),
      contextAccuracy: roundPercent(contextPassed, total),
      ambiguitySafety: roundPercent(ambiguityPassed, total),
      safetyAccuracy: roundPercent(safetyPassed, total),
      hallucinationRate: roundPercent(hallucinatedCount, total),
      categoryBreakdown
    };
  }
}
