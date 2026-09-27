/**
 * EasySalon Ambiguity Gate
 * 
 * Strict decision gate that enforces business rules and verifies
 * all required parameters before allowing any AI action or tool execution.
 */

import { IStructuredIntent, IBrainDecision } from './IntentTypes';
import { defaultBusinessRulesRegistry } from '../rules/BusinessRules';

export class AmbiguityGate {
  /**
   * Evaluates structured intent against salon business rules.
   */
  static evaluate(structuredIntent: IStructuredIntent): IBrainDecision {
    const { intent, entities } = structuredIntent;

    // 1. Run through centralized Business Rules Registry
    const ruleResult = defaultBusinessRulesRegistry.validate(intent, entities);

    if (!ruleResult.valid) {
      structuredIntent.needsClarification = true;
      structuredIntent.missingRequired = ruleResult.missingFields;
      structuredIntent.ambiguities = ruleResult.ambiguities;
      structuredIntent.clarificationQuestion = ruleResult.clarificationMessage;

      // If multiple matches need disambiguation
      if (ruleResult.ambiguities.includes('multiple_customers_found') || ruleResult.ambiguities.includes('multiple_services_found')) {
        return {
          type: 'DISAMBIGUATE',
          structuredIntent,
          message: ruleResult.clarificationMessage
        };
      }

      // If required parameters are missing
      return {
        type: 'CLARIFY',
        structuredIntent,
        message: ruleResult.clarificationMessage
      };
    }

    // 2. Specific intent validations
    if (intent === 'CREATE_APPOINTMENT') {
      const timeSlot = entities.time;
      if (timeSlot?.isRange) {
        const rangeMsg = `Chị ${entities.customer?.value || 'Lan'} muốn đặt lịch vào khung giờ cụ thể nào trong ${timeSlot.rangeLabel || 'buổi chiều'} ạ?`;
        structuredIntent.needsClarification = true;
        structuredIntent.missingRequired = ['time'];
        structuredIntent.ambiguities = ['time_is_range_not_exact'];
        structuredIntent.clarificationQuestion = rangeMsg;
        return {
          type: 'CLARIFY',
          structuredIntent,
          message: rangeMsg
        };
      }
    }

    // 3. Unresolved pronoun check
    if (entities.customer && !entities.customer.resolved && entities.customer.rawText?.includes('này')) {
      const clarifyMsg = 'Bạn đang muốn thực hiện thao tác cho khách hàng nào ạ?';
      structuredIntent.needsClarification = true;
      structuredIntent.missingRequired = ['customer'];
      structuredIntent.clarificationQuestion = clarifyMsg;
      return {
        type: 'CLARIFY',
        structuredIntent,
        message: clarifyMsg
      };
    }

    // All business checks passed
    structuredIntent.needsClarification = false;
    return {
      type: 'PROCEED',
      structuredIntent
    };
  }
}
