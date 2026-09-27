/**
 * Contextual Entity Resolver
 * 
 * Resolves natural Vietnamese entity mentions ("chị Lan", "anh Nam", "của Lan")
 * and contextual pronouns ("khách này", "anh ấy", "lịch này", "hóa đơn này")
 * strictly using the active screen state and conversation memory.
 */

export interface IResolutionResult {
  resolved: boolean;
  value?: string;
  id?: string;
  source?: 'direct' | 'active_context' | 'history' | 'unresolved';
}

export class EntityResolver {
  /**
   * Resolves customer reference from text, context, or conversation history
   */
  static resolveCustomer(
    text: string, 
    context: any = {}, 
    history: Array<{ role: string; content: string }> = []
  ): IResolutionResult {
    // Strip trailing punctuation
    const cleanText = text.trim().replace(/[.!?]+$/, '').trim();
    const lower = cleanText.toLowerCase();

    // 1. Check contextual pronouns
    const isPronoun = /(?:^|[\s,.:;!?])(khách này|khách đó|anh này|chị này|ông này|bà này|anh ấy|chị ấy|người này|người đó|vị khách này)(?:$|[\s,.:;!?])/i.test(lower);

    if (isPronoun) {
      // Prioritize active screen selection
      if (context.selectedCustomer?.name) {
        return {
          resolved: true,
          value: context.selectedCustomer.name,
          id: context.selectedCustomer.id,
          source: 'active_context'
        };
      }

      // Check context.activeContextEntities
      if (context.activeContextEntities && Array.isArray(context.activeContextEntities)) {
        const cust = context.activeContextEntities.find((e: any) => e.type === 'customer');
        if (cust?.name) {
          return {
            resolved: true,
            value: cust.name,
            id: cust.id,
            source: 'active_context'
          };
        }
      }

      // Check recent conversation history for last mentioned customer
      for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i]?.content || '';
        const match = msg.match(/(?:khách hàng|khách|chị|anh|bác)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)*)/);
        if (match && match[1]) {
          return {
            resolved: true,
            value: match[1].trim(),
            source: 'history'
          };
        }
      }

      // Pronoun used without context
      return {
        resolved: false,
        source: 'unresolved'
      };
    }

    // 2. Direct name extraction
    // Matches "tìm khách X", "khách hàng X", "cho X", "của X", "chị X", "anh X"
    const directMatch = cleanText.match(/(?:tìm\s+khách(?:\s+hàng)?\s+|khách(?:\s+hàng)?\s+|cho\s+|của\s+|chị\s+|anh\s+|cô\s+|chú\s+)([A-ZÀ-Ỹa-zà-ỹ0-9\s]{2,30}?)(?=\s+(?:lúc|vào|ngày|hôm|mai|chiều|sáng|tối|làm|cắt|gội|nhuộm|đặt|hủy|tip|\d{1,2}h|\d{9,11})|$)/i);
    if (directMatch && directMatch[1]) {
      const cleanName = directMatch[1]
        .replace(/^(?:khách(?:\s+hàng)?|chị|anh|cô|chú|bác|cho|của)\s+/gi, '')
        .trim();
      if (cleanName.length >= 2) {
        return {
          resolved: true,
          value: cleanName,
          source: 'direct'
        };
      }
    }

    // Check phone number format
    const phoneMatch = cleanText.match(/(0\d{9})/);
    if (phoneMatch) {
      return {
        resolved: true,
        value: phoneMatch[1],
        source: 'direct'
      };
    }

    return { resolved: false, source: 'unresolved' };
  }

  /**
   * Resolves appointment reference from text or active screen state
   */
  static resolveAppointment(text: string, context: any = {}): IResolutionResult {
    const lower = text.toLowerCase();
    const isPronoun = /\b(lịch này|lịch hẹn này|lịch đó|cuộc hẹn này)\b/i.test(lower);

    if (isPronoun) {
      if (context.selectedAppointment?.id) {
        return {
          resolved: true,
          value: `Lịch hẹn ID ${context.selectedAppointment.id}`,
          id: context.selectedAppointment.id,
          source: 'active_context'
        };
      }
      return { resolved: false, source: 'unresolved' };
    }

    return { resolved: false, source: 'unresolved' };
  }

  /**
   * Resolves staff reference from text ("cho Nam", "nhân viên Thu", "thợ Minh", "của Nam")
   */
  static resolveStaff(text: string): IResolutionResult {
    const cleanText = text.trim().replace(/[.!?]+$/, '').trim();
    // Matches "xếp Minh", "cho Nam", "của Nam", "nhân viên Nam", "thợ Nam"
    const match = cleanText.match(/(?:xếp|nhân\s*viên|thợ|kỹ\s*thuật\s*viên|cho|của)\s+([A-ZÀ-Ỹa-zà-ỹ\s]{2,20}?)(?=\s+(?:làm|lúc|ngày|bao\s*nhiêu|tip|\d)|$)/i);
    if (match && match[1]) {
      const clean = match[1].replace(/^(?:xếp|nhân\s*viên|thợ|chính|phụ|cho|của)\s+/gi, '').trim();
      const ignoredWords = ['hôm', 'mai', 'tôi', 'mình', 'salon', 'tiền', 'khách'];
      if (clean.length >= 2 && !ignoredWords.includes(clean.toLowerCase())) {
        return {
          resolved: true,
          value: clean,
          source: 'direct'
        };
      }
    }
    return { resolved: false, source: 'unresolved' };
  }
}
