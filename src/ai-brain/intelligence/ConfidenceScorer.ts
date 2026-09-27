/**
 * ConfidenceScorer (Phase 5 Intelligence)
 * 
 * Computes deterministic confidence scores for user request understanding.
 * Formula:
 * finalConfidence = weighted(
 *   intentWeight * intentConfidence +
 *   entityWeight * entityConfidence +
 *   timeWeight * timeConfidence +
 *   contextWeight * contextConfidence +
 *   ruleWeight * ruleConfidence
 * )
 * 
 * Confidence Tiers:
 * HIGH (>= 0.85): Can proceed to planning/preview if all required data is resolved
 * MEDIUM (0.65 - 0.84): May require confirmation or disambiguation
 * LOW (< 0.65): Must stop and ask user for clarification
 */

export interface ConfidenceScoreComponents {
  intentConfidence: number;
  entityConfidence: number;
  timeConfidence: number;
  contextConfidence: number;
  ruleConfidence: number;
}

export interface ComputedConfidence {
  score: number;
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  breakdown: ConfidenceScoreComponents;
  canProceed: boolean;
  requiresClarification: boolean;
}

export class ConfidenceScorer {
  private static readonly WEIGHTS = {
    intent: 0.30,
    entity: 0.25,
    time: 0.20,
    context: 0.15,
    rule: 0.10
  };

  /**
   * Computes the deterministic overall confidence
   */
  static compute(components: Partial<ConfidenceScoreComponents>): ComputedConfidence {
    const full: ConfidenceScoreComponents = {
      intentConfidence: components.intentConfidence ?? 0.90,
      entityConfidence: components.entityConfidence ?? 0.90,
      timeConfidence: components.timeConfidence ?? 0.90,
      contextConfidence: components.contextConfidence ?? 0.95,
      ruleConfidence: components.ruleConfidence ?? 1.0
    };

    const finalScore = 
      full.intentConfidence * this.WEIGHTS.intent +
      full.entityConfidence * this.WEIGHTS.entity +
      full.timeConfidence * this.WEIGHTS.time +
      full.contextConfidence * this.WEIGHTS.context +
      full.ruleConfidence * this.WEIGHTS.rule;

    const rounded = Math.round(finalScore * 100) / 100;

    let tier: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
    if (rounded < 0.65) {
      tier = 'LOW';
    } else if (rounded < 0.85) {
      tier = 'MEDIUM';
    }

    return {
      score: rounded,
      tier,
      breakdown: full,
      canProceed: tier === 'HIGH',
      requiresClarification: tier === 'LOW'
    };
  }
}
