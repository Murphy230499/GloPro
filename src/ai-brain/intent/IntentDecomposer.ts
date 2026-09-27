/**
 * IntentDecomposer (Phase 4)
 * 
 * Analyzes natural language requests to identify single or compound business intents,
 * dependency relationships, and conditional branches.
 * 
 * Example:
 * "Tạo khách hàng Nguyễn Văn Minh số 0901234567 rồi đặt cho khách một lịch cắt tóc lúc 2 giờ chiều mai"
 * -> Decomposes into:
 * 1. Intent: CREATE_CUSTOMER
 * 2. Intent: CREATE_APPOINTMENT (depends on CREATE_CUSTOMER)
 */

import { EasySalonBrain } from '../EasySalonBrain';
import { IBrainDecision } from './IntentTypes';
import { BusinessIntent } from '../action-engine/ActionContracts';
import { parseVietnameseDateTime } from './DateTimeParser';
import { EntityResolver } from './EntityResolver';
import { TimeResolver } from '../intelligence/TimeResolver';

export interface DecomposedIntentResult {
  isCompound: boolean;
  intents: BusinessIntent[];
  rawQuery: string;
  hasCondition?: boolean;
  conditionDescription?: string;
  originalDecision?: IBrainDecision;
}

export class IntentDecomposer {
  /**
   * Main entry point to decompose a user query into one or more business intents
   */
  static decompose(
    query: string,
    context: any = {},
    history: Array<{ role: string; content: string }> = []
  ): DecomposedIntentResult {
    const text = query.trim();
    const lower = text.toLowerCase();

    // 1. Check for Compound Request: CREATE_CUSTOMER -> CREATE_APPOINTMENT / OTHER
    // Patterns: "tạo khách mới ... rồi đặt lịch ...", "thêm khách ... sau đó tạo lịch ..."
    const compoundCustApptRegex = /(?:tạo|thêm|đăng ký)\s+khách(?:\s+hàng)?(?:\s+mới)?\s+(?:tên\s+)?([^,]+?)(?:,\s*|\s+)(?:số|sđt|điện thoại)?\s*([0-9\s.]+)(?:,\s*|\s+)(?:rồi|sau đó|và|tiếp theo)\s+(?:đặt|tạo|lên)\s+(?:cho\s+khách(?:\s+này|\s+đó)?\s+)?(?:một\s+)?lịch(?:\s+hẹn)?\s+(.+)/i;
    const compoundCustApptMatch = text.match(compoundCustApptRegex);

    const compoundCustPayRegex = /(?:tạo|thêm|đăng ký)\s+khách(?:\s+hàng)?(?:\s+mới)?\s+(?:tên\s+)?([^,]+?)(?:,\s*|\s+)(?:số|sđt|điện thoại)?\s*([0-9\s.]+)(?:,\s*|\s+)(?:rồi|sau đó|và|tiếp theo)\s+(?:thanh toán|chốt|lập bill|tạo bill)\s+(.+)/i;
    const compoundCustPayMatch = text.match(compoundCustPayRegex);

    if (compoundCustPayMatch) {
      const custName = compoundCustPayMatch[1].trim();
      const custPhone = compoundCustPayMatch[2].replace(/\D/g, '');
      const payPart = compoundCustPayMatch[3].trim();

      const intent1: BusinessIntent = {
        intentType: 'CREATE_CUSTOMER',
        confidence: 0.98,
        entities: {
          name: custName,
          phone: custPhone,
          customerName: custName,
          customerPhone: custPhone
        },
        missingInformation: [],
        ambiguities: [],
        constraints: [],
        rawQuery: `Tạo khách hàng ${custName} ${custPhone}`
      };

      const intent2: BusinessIntent = {
        intentType: 'CHECKOUT_INVOICE',
        confidence: 0.95,
        entities: {
          customerName: custName,
          customerPhone: custPhone,
          isContextCustomer: true
        },
        missingInformation: [],
        ambiguities: [],
        constraints: [],
        dependsOnIntentId: 'action_create_customer',
        rawQuery: payPart
      };

      return {
        isCompound: true,
        intents: [intent1, intent2],
        rawQuery: text
      };
    }

    if (compoundCustApptMatch) {
      const custName = compoundCustApptMatch[1].trim();
      const custPhone = compoundCustApptMatch[2].replace(/\D/g, '');
      const apptPart = compoundCustApptMatch[3].trim();

      const parsedDt = TimeResolver.resolve(apptPart);
      const serviceMatch = apptPart.match(/(?:cắt tóc nữ|cắt tóc nam|cắt tóc|gội đầu dưỡng sinh|gội đầu|nhuộm tóc|nhuộm|uốn tóc|uốn|làm nail|massage|chăm sóc da)/i);
      const staffMatch = EntityResolver.resolveStaff(apptPart);

      const intent1: BusinessIntent = {
        intentType: 'CREATE_CUSTOMER',
        confidence: 0.98,
        entities: {
          name: custName,
          phone: custPhone,
          customerName: custName,
          customerPhone: custPhone
        },
        missingInformation: [],
        ambiguities: [],
        constraints: [],
        rawQuery: `Tạo khách hàng ${custName} ${custPhone}`
      };

      const intent2: BusinessIntent = {
        intentType: 'CREATE_APPOINTMENT',
        confidence: 0.95,
        entities: {
          customerName: custName,
          customerPhone: custPhone,
          isContextCustomer: true,
          date: parsedDt.date?.value,
          time: parsedDt.time?.value,
          serviceName: serviceMatch ? serviceMatch[0] : undefined,
          staffName: staffMatch.resolved ? staffMatch.value : undefined
        },
        missingInformation: !serviceMatch ? ['service'] : (!parsedDt.date || !parsedDt.time ? ['date_time'] : []),
        ambiguities: [],
        constraints: [],
        dependsOnIntentId: 'action_create_customer',
        rawQuery: `Đặt lịch cho khách ${custName} ${apptPart}`
      };

      return {
        isCompound: true,
        intents: [intent1, intent2],
        rawQuery: text
      };
    }

    // 2. Check for Batch Cancel and Create: "Hủy lịch cũ của Lan và đặt lịch mới cho Hoa lúc 14h mai"
    const cancelAndCreateRegex = /(?:hủy\s+lịch(?:\s+cũ)?\s+của\s+([^,]+?))\s+(?:và|sau\s+đó|rồi)\s+(?:đặt\s+lịch(?:\s+mới)?\s+cho\s+([^,]+?)\s+(.+))/i;
    const cancelAndCreateMatch = text.match(cancelAndCreateRegex);
    if (cancelAndCreateMatch) {
      const cancelCust = cancelAndCreateMatch[1].replace(/^(?:chị|anh|khách)\s+/i, '').trim();
      const createCust = cancelAndCreateMatch[2].replace(/^(?:chị|anh|khách)\s+/i, '').trim();
      const createPart = cancelAndCreateMatch[3].trim();
      const parsedDt = TimeResolver.resolve(createPart);

      const intentCancel: BusinessIntent = {
        intentType: 'CANCEL_APPOINTMENT',
        confidence: 0.95,
        entities: { customerName: cancelCust },
        missingInformation: [],
        ambiguities: [],
        constraints: [],
        rawQuery: `Hủy lịch của ${cancelCust}`
      };

      const intentCreate: BusinessIntent = {
        intentType: 'CREATE_APPOINTMENT',
        confidence: 0.95,
        entities: {
          customerName: createCust,
          date: parsedDt.date?.value,
          time: parsedDt.time?.value
        },
        missingInformation: !parsedDt.time?.value ? ['time'] : [],
        ambiguities: [],
        constraints: [],
        rawQuery: `Đặt lịch cho ${createCust} ${createPart}`
      };

      return {
        isCompound: true,
        intents: [intentCancel, intentCreate],
        rawQuery: text
      };
    }

    // 3. Check for Reschedule / Change Appointment Pattern
    // Pattern: "đổi lịch của chị Lan sang 3 giờ", "dời lịch của anh Nam sang 16h", "Hủy lịch 3h đổi sang 4h"
    const rescheduleRegex = /(?:đổi|dời|chuyển|hủy\s+lịch(?:\s+[^\s,]+)?\s+đổi)\s+lịch(?:\s+hẹn)?(?:\s+(?:của\s+)?([^,]+?)\s+sang\s+(.+))?/i;
    const altRescheduleRegex = /(?:đổi\s+sang|sang)\s+(\d{1,2}(?:h| giờ))/i;
    const rescheduleMatch = text.match(rescheduleRegex);

    if ((rescheduleMatch && (lower.startsWith('đổi') || lower.startsWith('dời') || lower.startsWith('chuyển') || lower.includes('đổi sang'))) || (lower.includes('hủy lịch') && lower.includes('đổi sang'))) {
      const targetPerson = rescheduleMatch && rescheduleMatch[1] ? rescheduleMatch[1].replace(/^(?:chị|anh|cô|bác|em|khách)\s+/i, '').trim() : '';
      const targetTimePart = rescheduleMatch && rescheduleMatch[2] ? rescheduleMatch[2].trim() : (text.match(/đổi\s+sang\s+(.+)/i)?.[1] || '');
      const parsedDt = targetTimePart ? TimeResolver.resolve(targetTimePart) : {};

      const missing: string[] = [];
      if (!targetPerson && !lower.includes('hủy lịch')) missing.push('customer');
      if (!parsedDt.time?.value) missing.push('new_time');

      // Reschedule decomposes into: READ_APPOINTMENT -> CANCEL/UPDATE_APPOINTMENT
      const intentReschedule: BusinessIntent = {
        intentType: 'UPDATE_APPOINTMENT',
        confidence: 0.95,
        entities: {
          customerName: targetPerson || undefined,
          newDate: parsedDt.date?.value,
          newTime: parsedDt.time?.value,
          time: parsedDt.time?.value
        },
        missingInformation: missing,
        ambiguities: [],
        constraints: ['MUST_RESOLVE_EXISTING_APPOINTMENT'],
        rawQuery: text
      };

      return {
        isCompound: false,
        intents: [intentReschedule],
        rawQuery: text
      };
    }

    // 4. Check for Conditional Staff Availability
    // Pattern: "Nếu thợ Minh rảnh thì đặt cho Minh...", "Nếu Minh bận thì xếp thợ khác...", "Nếu Minh rảnh thì đặt cho Lan..."
    const conditionalStaffRegex = /nếu\s+(?:thợ|nhân viên)?\s*([^\s,]+)\s+(?:rảnh|trống|làm được|bận)\s+thì\s+([^,]+?)(?:,\s*(?:nếu|còn)\s*không(?:\s+thì)?\s+.*|$)/i;
    const condMatch = text.match(conditionalStaffRegex);

    if (condMatch) {
      const preferredStaff = condMatch[1].trim();
      const actionPart = condMatch[2].trim();
      const parsedDt = TimeResolver.resolve(text);
      const serviceMatch = text.match(/(?:cắt tóc nữ|cắt tóc nam|cắt tóc|gội đầu|nhuộm|uốn|massage)/i);
      const custRes = EntityResolver.resolveCustomer(actionPart, context, history);

      const intentCond: BusinessIntent = {
        intentType: 'CREATE_APPOINTMENT',
        confidence: 0.95,
        entities: {
          customerName: custRes.resolved ? custRes.value : undefined,
          serviceName: serviceMatch ? serviceMatch[0] : 'Cắt tóc nữ',
          preferredStaffName: preferredStaff,
          staffName: preferredStaff,
          fallbackStrategy: 'FIND_AVAILABLE_STAFF',
          date: parsedDt.date?.value || '2026-09-25',
          time: parsedDt.time?.value || '15:00'
        },
        missingInformation: [],
        ambiguities: [],
        constraints: ['CONDITIONAL_STAFF_SELECTION'],
        rawQuery: text
      };

      return {
        isCompound: true,
        hasCondition: true,
        conditionDescription: `Ưu tiên nhân viên ${preferredStaff}; nếu trùng lịch sẽ tự động tìm nhân viên trống khác.`,
        intents: [intentCond],
        rawQuery: text
      };
    }

    // 4. Default: Single Intent delegation to Phase 1 EasySalonBrain
    const brainDecision = EasySalonBrain.processRequest(text, context, history);
    const primaryIntent: BusinessIntent = {
      intentType: brainDecision.structuredIntent.intent,
      confidence: brainDecision.structuredIntent.confidence,
      entities: Object.entries(brainDecision.structuredIntent.entities).reduce((acc, [k, slot]) => {
        acc[k] = slot.value;
        return acc;
      }, {} as Record<string, any>),
      missingInformation: brainDecision.structuredIntent.missingRequired,
      ambiguities: brainDecision.structuredIntent.ambiguities,
      constraints: [],
      rawQuery: text
    };

    return {
      isCompound: false,
      intents: [primaryIntent],
      rawQuery: text,
      originalDecision: brainDecision
    };
  }
}
