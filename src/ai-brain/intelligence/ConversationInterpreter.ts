/**
 * ConversationInterpreter (Phase 5 Intelligence)
 * 
 * High-level coordinator that interprets natural salon dialogue across multi-turn exchanges,
 * accumulates context, detects corrections, cancellations, and follow-ups.
 */

import { AgentContextManager, InteractionType } from '../context/AgentContextManager';
import { RobustEntityResolver } from './EntityResolver';
import { TimeResolver } from './TimeResolver';
import { AmbiguityDetector } from './AmbiguityDetector';
import { UnderstandingValidator } from './UnderstandingValidator';
import { EasySalonBrain } from '../EasySalonBrain';

export interface InterpretationResult {
  interactionType: InteractionType;
  intent: string;
  entities: Record<string, any>;
  missingInformation: string[];
  ambiguities: string[];
  isReadyForAction: boolean;
  clarificationMessage?: string;
  needsClarification: boolean;
  confidence: number;
}

export class ConversationInterpreter {
  /**
   * Interprets message within active session context
   */
  static interpret(
    message: string,
    sessionId: string = 'session_default',
    context: any = {},
    history: Array<{ role: string; content: string }> = []
  ): InterpretationResult {
    const raw = message.trim();
    const lower = raw.toLowerCase();

    // 1. Detect Interaction Type
    const interactionType = AgentContextManager.classifyInteraction(raw, sessionId);

    // 2. Handle CANCELLATION / ABORT
    if (interactionType === 'CANCELLATION') {
      return {
        interactionType: 'CANCELLATION',
        intent: 'ABORT_OPERATION',
        entities: {},
        missingInformation: [],
        ambiguities: [],
        isReadyForAction: false,
        needsClarification: false,
        clarificationMessage: 'Đã hủy thao tác theo yêu cầu.',
        confidence: 1.0
      };
    }

    // 3. Handle CORRECTION ("Không, 4 giờ", "Không phải Lan, chị Hoa", "Đổi sang thợ Minh", "Không làm cắt tóc, đổi sang nhuộm")
    const isCorrectionPattern = 
      interactionType === 'CORRECTION' || 
      lower.startsWith('không,') || 
      lower.startsWith('không phải') || 
      lower.includes('đổi sang') || 
      lower.includes('chứ không phải');

    if (isCorrectionPattern) {
      const sess = AgentContextManager.getSession(sessionId);

      // A. Time Correction ("Không phải 15h mà là 14h", "Đặt 17h chứ không phải 15h", "Không, 4 giờ")
      const targetTimePart = lower.includes('mà là') ? lower.split('mà là')[1] : 
                             (lower.includes('chứ không phải') ? lower.split('chứ không phải')[0] : raw);
      const parsedTime = TimeResolver.resolve(targetTimePart);

      // Phone correction ("Không phải số đó, số mới là 0933445566")
      const phoneCorrectionMatch = raw.match(/(?:số\s+mới\s+là|sđt\s+mới|đổi\s+số\s+thành)\s*(\d{10})/i);
      if (phoneCorrectionMatch) {
        return {
          interactionType: 'CORRECTION',
          intent: 'UPDATE_CUSTOMER',
          entities: { phone: phoneCorrectionMatch[1] },
          missingInformation: [],
          ambiguities: [],
          isReadyForAction: true,
          needsClarification: false,
          confidence: 0.98
        };
      }

      // B. Customer Correction ("Không phải Lan, chị Hoa", "Đổi sang chị Trang nhé không phải Lan")
      const custMatch = raw.match(/(?:không phải\s+[^\s,]+,?\s*|đổi sang\s+)(?:chị|anh|cô|bác|em|khách)?\s*([A-ZÀ-Ỹa-zà-ỹ\s]+?)(?:\s+nhé|\s+nha|\s+ạ|\s+không\s+phải|$)/i);

      // C. Staff Correction ("Đổi thợ sang Minh")
      const staffMatch = raw.match(/(?:đổi\s+thợ\s+sang|thay\s+thợ\s+bằng)\s+([A-ZÀ-Ỹa-zà-ỹ\s]+)/i);

      // D. Service Correction ("Không làm cắt tóc, đổi sang nhuộm")
      let newService: string | undefined;
      const changeServiceMatch = raw.match(/(?:đổi sang|làm sang|chuyển sang)\s+(cắt tóc nữ|cắt tóc nam|cắt tóc|gội đầu dưỡng sinh|gội đầu|nhuộm tóc|nhuộm|uốn tóc|uốn|làm nail|massage)/i);
      if (changeServiceMatch) {
        newService = changeServiceMatch[1].trim();
      }

      const entities: Record<string, any> = {};
      if (parsedTime.time?.value) {
        let correctedTime = parsedTime.time.value;
        if (correctedTime === '04:00' && !lower.includes('sáng')) correctedTime = '16:00';
        entities.time = correctedTime;
      }
      if (custMatch && custMatch[1] && !parsedTime.time?.value && !newService) entities.customer = custMatch[1].trim();
      if (staffMatch && staffMatch[1]) entities.staff = staffMatch[1].trim();
      if (newService) entities.service = newService;

      return {
        interactionType: 'CORRECTION',
        intent: 'UPDATE_APPOINTMENT',
        entities,
        missingInformation: [],
        ambiguities: [],
        isReadyForAction: true,
        needsClarification: false,
        confidence: 0.98
      };
    }

    // 4. Handle Pronouns ("khách này", "lịch này", "chị ấy")
    const pronounResolution = AgentContextManager.resolvePronoun(raw, sessionId);

    // 5. Parse Date & Time
    const dt = TimeResolver.resolve(raw);

    // 6. Base Intent Classification
    // 6. Detect Intent (Unified delegation to EasySalonBrain)
    const brainDecision = EasySalonBrain.processRequest(raw, context);
    let intent = brainDecision.structuredIntent.intent;

    // 7. Accumulate multi-turn context
    const entities: Record<string, any> = {};
    const sess = AgentContextManager.getSession(sessionId);

    // Customer resolution
    if (pronounResolution.resolvedCustomer) {
      entities.customer = pronounResolution.resolvedCustomer.name;
      entities.customerId = pronounResolution.resolvedCustomer.id;
      entities.customerPhone = pronounResolution.resolvedCustomer.phone;
    } else {
      const custMatch = raw.match(/(?:cho\s+|của\s+|chị\s+|anh\s+|cô\s+|bác\s+)([A-ZÀ-Ỹa-zà-ỹ\s]{2,20}?)(?=\s+(?:lúc|vào|ngày|hôm|mai|chiều|sáng|cắt|gội|làm|\d)|$)/i);
      if (custMatch && custMatch[1]) {
        const cleaned = RobustEntityResolver.cleanNamePrefixes(custMatch[1]);
        if (!/^(?:khách\s+(?:này|đó)|anh\s+ấy|chị\s+ấy|người\s+này|người\s+đó|đó|này|ấy)$/i.test(cleaned.trim())) {
          entities.customer = cleaned;
        }
      } else if (brainDecision.structuredIntent.entities.customer?.value) {
        entities.customer = brainDecision.structuredIntent.entities.customer.value;
      } else if (sess.currentCustomer?.name) {
        // Inherit from context if follow-up
        entities.customer = sess.currentCustomer.name;
        entities.customerId = sess.currentCustomer.id;
      }
    }

    // Staff resolution
    if (pronounResolution.resolvedStaff) {
      entities.staff = pronounResolution.resolvedStaff.name;
      entities.staffId = pronounResolution.resolvedStaff.id;
    } else {
      const xepMatch = raw.match(/xếp\s+([A-ZÀ-Ỹa-zà-ỹ\s]{2,15}?)\s+làm\s+cho/i);
      if (xepMatch && xepMatch[1]) {
        entities.staff = xepMatch[1].trim();
      } else {
        const staffMatch = raw.match(/(?:với\s+|thợ\s+|nhân viên\s+)([A-ZÀ-Ỹa-zà-ỹ\s]{2,20}?)(?=\s+(?:lúc|ngày|\d)|$)/i);
        if (staffMatch && staffMatch[1]) {
          const cleanedStaff = staffMatch[1].trim();
          if (!/^(?:này|đó|cũ|cho|khác|nào)/i.test(cleanedStaff)) {
            entities.staff = cleanedStaff;
          }
        } else if (sess.currentStaff?.name) {
          entities.staff = sess.currentStaff.name;
        }
      }
    }

    // Date & Time
    if (dt.date?.value) entities.date = dt.date.value;
    else if (sess.currentAppointment?.date) entities.date = sess.currentAppointment.date;

    if (dt.time?.value) entities.time = dt.time.value;
    else if (sess.currentAppointment?.time) entities.time = sess.currentAppointment.time;

    // 8. Run through Ambiguity Detector
    if (intent === 'CREATE_APPOINTMENT') {
      const diag = AmbiguityDetector.diagnoseAppointment({
        customer: { value: entities.customer, resolved: Boolean(entities.customer) },
        service: { value: entities.service, resolved: Boolean(entities.service) },
        date: { value: entities.date, resolved: Boolean(entities.date) },
        time: { value: entities.time, isExact: dt.time?.isExact, isRange: dt.time?.isRange, rangeLabel: dt.time?.rangeLabel }
      });

      if (diag.needsClarification) {
        return {
          interactionType: 'CLARIFICATION',
          intent,
          entities,
          missingInformation: diag.missingFields,
          ambiguities: diag.isAmbiguous ? [diag.ambiguityType || 'AMBIGUOUS'] : [],
          isReadyForAction: false,
          clarificationMessage: diag.clarificationMessage,
          needsClarification: true,
          confidence: 0.80
        };
      }
    }

    // 9. Self-Check with UnderstandingValidator
    const validation = UnderstandingValidator.validate({
      intent,
      entities,
      missingInformation: [],
      ambiguities: [],
      rawQuery: raw
    });

    return {
      interactionType: 'NEW_INTENT',
      intent,
      entities,
      missingInformation: [],
      ambiguities: [],
      isReadyForAction: validation.canProceedToPlanning,
      needsClarification: !validation.canProceedToPlanning,
      clarificationMessage: validation.message,
      confidence: validation.confidence.score
    };
  }
}
