/**
 * UnderstandingValidator (Phase 5 Intelligence)
 * 
 * Pre-action Self-Check stage before generating any ActionPlan or executing writes.
 * 
 * Pipeline:
 * USER REQUEST
 *   ↓
 * INTERPRETATION & TIME RESOLUTION
 *   ↓
 * ENTITY RESOLUTION & BUSINESS CONTEXT
 *   ↓
 * UNDERSTANDING VALIDATOR (Self-Check)
 *   ↓
 * ACTION PLAN
 * 
 * Checks:
 * 1. Is intent valid & supported?
 * 2. Are required entities resolved?
 * 3. Are ambiguous entities unresolved?
 * 4. Is date/time valid?
 * 5. Are there contradictions between query and context?
 * 6. Does confidence score meet HIGH threshold to proceed?
 */

import { ConfidenceScorer, ComputedConfidence } from './ConfidenceScorer';

export interface UnderstandingValidationInput {
  intent: string;
  entities: Record<string, any>;
  missingInformation: string[];
  ambiguities: string[];
  rawQuery: string;
  confidenceComponents?: {
    intentConfidence?: number;
    entityConfidence?: number;
    timeConfidence?: number;
    contextConfidence?: number;
    ruleConfidence?: number;
  };
}

export interface UnderstandingValidationResult {
  valid: boolean;
  status: 'VALID' | 'NEED_CLARIFICATION' | 'AMBIGUOUS' | 'UNSUPPORTED' | 'INVALID_DATE_TIME';
  confidence: ComputedConfidence;
  message?: string;
  canProceedToPlanning: boolean;
}

export class UnderstandingValidator {
  private static readonly SUPPORTED_WRITE_INTENTS = [
    'CREATE_CUSTOMER',
    'UPDATE_CUSTOMER',
    'CREATE_APPOINTMENT',
    'CANCEL_APPOINTMENT',
    'UPDATE_APPOINTMENT'
  ];

  private static readonly SUPPORTED_READ_INTENTS = [
    'QUERY_REVENUE',
    'QUERY_STAFF_REVENUE',
    'SEARCH_CUSTOMER',
    'SEARCH_STAFF',
    'SEARCH_SERVICE',
    'SEARCH_PRODUCT',
    'SEARCH_APPOINTMENT',
    'TIP_OPERATION',
    'NAVIGATION',
    'GENERAL_CONVERSATION'
  ];

  /**
   * Validates the Agent's understanding before taking action
   */
  static validate(input: UnderstandingValidationInput): UnderstandingValidationResult {
    const { intent, entities, missingInformation, ambiguities, rawQuery } = input;

    // 1. Check supported operations
    const isSupported = 
      this.SUPPORTED_WRITE_INTENTS.includes(intent) || 
      this.SUPPORTED_READ_INTENTS.includes(intent);

    if (!isSupported && intent !== 'UNKNOWN') {
      return {
        valid: false,
        status: 'UNSUPPORTED',
        confidence: ConfidenceScorer.compute({ intentConfidence: 0.5, ruleConfidence: 0 }),
        message: `Hệ thống chưa hỗ trợ thực hiện tự động nghiệp vụ "${intent}".`,
        canProceedToPlanning: false
      };
    }

    // 2. Check for Ambiguities (multiple matches)
    if (ambiguities && ambiguities.length > 0) {
      return {
        valid: false,
        status: 'AMBIGUOUS',
        confidence: ConfidenceScorer.compute({ entityConfidence: 0.5 }),
        message: 'Có nhiều thực thể trùng khớp cần xác định rõ.',
        canProceedToPlanning: false
      };
    }

    // 3. Check for Missing Required Information
    if (missingInformation && missingInformation.length > 0) {
      return {
        valid: false,
        status: 'NEED_CLARIFICATION',
        confidence: ConfidenceScorer.compute({ entityConfidence: 0.6 }),
        message: `Còn thiếu thông tin: ${missingInformation.join(', ')}.`,
        canProceedToPlanning: false
      };
    }

    // 4. Check Date/Time Consistency (if appointment)
    if (intent === 'CREATE_APPOINTMENT' || intent === 'UPDATE_APPOINTMENT') {
      const date = entities.date || entities.newDate;
      const time = entities.time || entities.newTime;

      if (date && typeof date === 'string') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (date < todayStr) {
          return {
            valid: false,
            status: 'INVALID_DATE_TIME',
            confidence: ConfidenceScorer.compute({ timeConfidence: 0.3, ruleConfidence: 0 }),
            message: `Ngày hẹn ${date} đã trôi qua trong quá khứ. Vui lòng chọn ngày hiện tại hoặc tương lai.`,
            canProceedToPlanning: false
          };
        }
      }

      if (time && typeof time === 'string') {
        if (!/^\d{1,2}:\d{2}$/.test(time)) {
          return {
            valid: false,
            status: 'INVALID_DATE_TIME',
            confidence: ConfidenceScorer.compute({ timeConfidence: 0.4 }),
            message: `Giờ hẹn "${time}" không đúng định dạng HH:MM.`,
            canProceedToPlanning: false
          };
        }
      }
    }

    // 5. Compute deterministic confidence
    const conf = ConfidenceScorer.compute(input.confidenceComponents || {});

    return {
      valid: conf.canProceed,
      status: conf.canProceed ? 'VALID' : 'NEED_CLARIFICATION',
      confidence: conf,
      canProceedToPlanning: conf.canProceed
    };
  }
}
