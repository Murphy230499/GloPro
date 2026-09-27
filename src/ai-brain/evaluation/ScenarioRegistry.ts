/**
 * ScenarioRegistry (Phase 5 Benchmark)
 * 
 * Aggregates all evaluation scenarios across categories into a single registry
 * guaranteeing >= 100 realistic Vietnamese scenarios.
 */

import { EvaluationScenario } from './EvaluationCase';
import { INTENT_SCENARIOS } from './scenarios/intent.scenarios';
import { ENTITY_SCENARIOS } from './scenarios/entity.scenarios';
import { DATETIME_SCENARIOS } from './scenarios/datetime.scenarios';
import { CONTEXT_SCENARIOS } from './scenarios/context.scenarios';
import { CORRECTION_SCENARIOS, CANCELLATION_SCENARIOS } from './scenarios/correction.scenarios';
import { AMBIGUITY_SCENARIOS, MULTISTEP_SCENARIOS, SAFETY_SCENARIOS } from './scenarios/ambiguity.scenarios';

// Phase 5.5 Adversarial Scenarios
import { INTENT_CONFUSION_SCENARIOS } from './adversarial/intent_confusion.scenarios';
import { ENTITY_AMBIGUITY_SCENARIOS } from './adversarial/entity_ambiguity.scenarios';
import { DATETIME_AMBIGUITY_SCENARIOS } from './adversarial/datetime_ambiguity.scenarios';
import { CONTEXT_TRAPS_SCENARIOS } from './adversarial/context_traps.scenarios';
import { CORRECTION_TRAPS_SCENARIOS } from './adversarial/correction_traps.scenarios';
import { MULTISTEP_TRAPS_SCENARIOS } from './adversarial/multistep_traps.scenarios';
import { BUSINESS_LOGIC_TRAPS_SCENARIOS } from './adversarial/business_logic_traps.scenarios';
import { HALLUCINATION_SCENARIOS } from './adversarial/hallucination.scenarios';
import { PROMPT_INJECTION_SCENARIOS } from './adversarial/prompt_injection.scenarios';
import { SECURITY_TAMPERING_SCENARIOS } from './adversarial/security_tampering.scenarios';
import { DESTRUCTIVE_ACTION_SCENARIOS } from './adversarial/destructive_action.scenarios';
import { HOLDOUT_SCENARIOS } from './adversarial/holdout.scenarios';

export class ScenarioRegistry {
  // Phase 5 Baseline Benchmark (120 Scenarios)
  private static baselineScenarios: EvaluationScenario[] = [
    ...INTENT_SCENARIOS,       // 20
    ...ENTITY_SCENARIOS,       // 20
    ...DATETIME_SCENARIOS,     // 15
    ...CONTEXT_SCENARIOS,      // 15
    ...CORRECTION_SCENARIOS,   // 10
    ...CANCELLATION_SCENARIOS, // 10
    ...AMBIGUITY_SCENARIOS,    // 10
    ...MULTISTEP_SCENARIOS,    // 10
    ...SAFETY_SCENARIOS        // 10
  ];

  // Phase 5.5 Adversarial Red-Team Benchmark (230 Scenarios)
  private static adversarialScenarios: EvaluationScenario[] = [
    ...INTENT_CONFUSION_SCENARIOS,     // 25
    ...ENTITY_AMBIGUITY_SCENARIOS,     // 25
    ...DATETIME_AMBIGUITY_SCENARIOS,   // 20
    ...CONTEXT_TRAPS_SCENARIOS,        // 25
    ...CORRECTION_TRAPS_SCENARIOS,     // 15
    ...MULTISTEP_TRAPS_SCENARIOS,      // 20
    ...BUSINESS_LOGIC_TRAPS_SCENARIOS, // 25
    ...HALLUCINATION_SCENARIOS,        // 15
    ...PROMPT_INJECTION_SCENARIOS,     // 15
    ...SECURITY_TAMPERING_SCENARIOS,   // 10
    ...DESTRUCTIVE_ACTION_SCENARIOS,   // 5
    ...HOLDOUT_SCENARIOS               // 30
  ];

  /**
   * Returns Phase 5 baseline benchmark scenarios (120)
   */
  static getAll(): EvaluationScenario[] {
    return this.baselineScenarios;
  }

  /**
   * Returns Phase 5.5 adversarial benchmark scenarios (230)
   */
  static getAdversarial(): EvaluationScenario[] {
    return this.adversarialScenarios;
  }

  /**
   * Returns development adversarial scenarios (200, excluding holdouts)
   */
  static getDevelopmentAdversarial(): EvaluationScenario[] {
    return this.adversarialScenarios.filter(s => !s.isHoldout);
  }

  /**
   * Returns holdout scenarios only (30)
   */
  static getHoldout(): EvaluationScenario[] {
    return this.adversarialScenarios.filter(s => Boolean(s.isHoldout));
  }

  /**
   * Returns all scenarios combined (350)
   */
  static getAllCombined(): EvaluationScenario[] {
    return [...this.baselineScenarios, ...this.adversarialScenarios];
  }

  static getByCategory(category: string): EvaluationScenario[] {
    return this.getAllCombined().filter(s => s.category === category);
  }

  static count(): number {
    return this.baselineScenarios.length;
  }

  static countAdversarial(): number {
    return this.adversarialScenarios.length;
  }
}
