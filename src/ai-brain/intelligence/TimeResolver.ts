/**
 * TimeResolver (Phase 5 Intelligence)
 * 
 * Deterministic natural-language Vietnamese time & date interpretation.
 * Normalizes expressions into standardized YYYY-MM-DD and HH:MM formats
 * using salon/application timezone and deterministic date logic.
 * 
 * Understands:
 * - hôm nay, ngày mai, ngày mốt, ngày kia
 * - thứ 2, thứ hai tuần sau, thứ 6 tới, chủ nhật
 * - cuối tuần, tuần sau
 * - sáng nay, chiều nay, tối nay, sáng mai, chiều mai, tối mai
 * - 3h, 3 giờ, 3h chiều, 15h, 3 rưỡi, 3h30, 15:30
 * - khoảng 3h, sau 4h, trước 5h
 */

export interface NormalizedDateTimeResult {
  date?: {
    value: string; // YYYY-MM-DD
    raw: string;
    resolved: boolean;
    isRelative: boolean;
  };
  time?: {
    value: string | null; // HH:MM
    raw: string;
    isExact: boolean;
    isRange: boolean;
    rangeLabel?: string;
    approximate?: boolean;
    modifier?: 'after' | 'before' | 'around';
  };
  isValid: boolean;
  confidence: number;
}

export class TimeResolver {
  /**
   * Resolves Vietnamese date/time expression deterministically
   */
  static resolve(
    text: string, 
    baseDate: Date = new Date(),
    timezone: string = 'Asia/Ho_Chi_Minh'
  ): NormalizedDateTimeResult {
    const raw = text.trim();
    const lower = raw.toLowerCase();
    const result: NormalizedDateTimeResult = {
      isValid: true,
      confidence: 0.95
    };

    // 1. DATE PARSING
    let targetDate = new Date(baseDate);
    let dateFound = false;
    let dateRaw = '';
    let isRelative = false;

    if (lower.includes('hôm nay') || lower.includes('hom nay')) {
      dateFound = true;
      dateRaw = 'hôm nay';
      isRelative = true;
    } else if (
      lower.includes('ngày mai') || 
      lower.includes('sáng mai') || 
      lower.includes('chiều mai') || 
      lower.includes('tối mai') || 
      /\bmai\b/i.test(lower)
    ) {
      targetDate.setDate(targetDate.getDate() + 1);
      dateFound = true;
      dateRaw = 'ngày mai';
      isRelative = true;
    } else if (lower.includes('ngày kia') || lower.includes('ngày mốt') || /\bmốt\b/i.test(lower)) {
      targetDate.setDate(targetDate.getDate() + 2);
      dateFound = true;
      dateRaw = 'ngày kia';
      isRelative = true;
    } else if (lower.includes('cuối tuần') || lower.includes('cuoi tuan')) {
      // Find upcoming Saturday
      const currentDow = targetDate.getDay();
      let diff = 6 - currentDow; // 6 is Saturday
      if (diff <= 0) diff += 7;
      targetDate.setDate(targetDate.getDate() + diff);
      dateFound = true;
      dateRaw = 'cuối tuần';
      isRelative = true;
    } else {
      // Day of week: "thứ 2", "thứ hai tuần sau", "chủ nhật tuần này"
      const isNextWeek = lower.includes('tuần sau') || lower.includes('tuan sau') || lower.includes('tới');
      const dowMatch = lower.match(/(?:thứ|t)\s*([2-7]|hai|ba|tư|bốn|năm|sáu|bảy)|chủ nhật|cn/i);

      if (dowMatch) {
        const dowMap: Record<string, number> = {
          '2': 1, 'hai': 1,
          '3': 2, 'ba': 2,
          '4': 3, 'tư': 3, 'bốn': 3,
          '5': 4, 'năm': 4,
          '6': 5, 'sáu': 5,
          '7': 6, 'bảy': 6
        };
        let targetDow = 0; // CN (Sunday = 0)
        if (dowMatch[1]) {
          targetDow = dowMap[dowMatch[1].toLowerCase()] ?? 1;
        }

        const currentDow = targetDate.getDay();
        let diff = targetDow - currentDow;
        if (diff <= 0) diff += 7; // Next occurrence
        if (isNextWeek && diff < 7) diff += 7;

        targetDate.setDate(targetDate.getDate() + diff);
        dateFound = true;
        dateRaw = dowMatch[0] + (isNextWeek ? ' tuần sau' : '');
        isRelative = true;
      } else {
        // Explicit date DD/MM or YYYY-MM-DD
        const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
        if (isoMatch) {
          result.date = {
            value: isoMatch[0],
            raw: isoMatch[0],
            resolved: true,
            isRelative: false
          };
          dateFound = true;
        } else {
          const slashMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?\b/);
          if (slashMatch) {
            const day = parseInt(slashMatch[1], 10);
            const month = parseInt(slashMatch[2], 10) - 1;
            const year = slashMatch[3] ? parseInt(slashMatch[3], 10) : targetDate.getFullYear();
            targetDate = new Date(year, month, day);
            dateFound = true;
            dateRaw = slashMatch[0];
            isRelative = false;
          }
        }
      }
    }

    if (dateFound && !result.date) {
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      result.date = {
        value: `${yyyy}-${mm}-${dd}`,
        raw: dateRaw,
        resolved: true,
        isRelative
      };
    }

    // 2. TIME PARSING
    // Check modifiers: "sau 4h", "trước 5h", "khoảng 3h", "tầm 3h"
    let modifier: 'after' | 'before' | 'around' | undefined;
    let approximate = false;

    if (/\b(?:sau|hơn)\s+(\d{1,2})/i.test(lower)) {
      modifier = 'after';
    } else if (/\b(?:trước)\s+(\d{1,2})/i.test(lower)) {
      modifier = 'before';
    } else if (/\b(?:khoảng|tầm|chừng|cỡ)\s+(\d{1,2})/i.test(lower)) {
      modifier = 'around';
      approximate = true;
    }

    // Special Vietnamese format: "3 rưỡi", "3h rưỡi", "15 rưỡi", "3ruoi"
    const ruoiMatch = lower.match(/(?:^|\s|[.,!?])(?:lúc\s*)?(\d{1,2})\s*(?:h|giờ)?\s*(?:rưỡi|ruoi)\s*(sáng|trưa|chiều|tối)?(?!\w)/i);
    if (ruoiMatch) {
      let h = parseInt(ruoiMatch[1], 10);
      const period = (ruoiMatch[2] || '').toLowerCase();
      if ((period === 'chiều' || period === 'tối' || lower.includes('chiều') || lower.includes('tối')) && h < 12) {
        h += 12;
      } else if (!period && h >= 1 && h <= 5 && !lower.includes('sáng')) {
        h += 12; // Salon standard business assumption: 1h-5h is afternoon (13:00 - 17:00)
      }
      const hh = String(h).padStart(2, '0');
      result.time = {
        value: `${hh}:30`,
        raw: ruoiMatch[0].trim(),
        isExact: true,
        isRange: false,
        approximate
      };
      return result;
    }

    // Time ranges without exact hour: "chiều", "sáng", "tối"
    const hasSpecificHour = 
      /\d+\s*(?:h|giờ|g|:)(?!\w)/i.test(lower) || 
      /\b\d{1,2}:\d{2}\b/.test(lower) || 
      /\b\d{1,2}h\d{2}\b/i.test(lower) || 
      /\b\d{1,2}\s*giờ/i.test(lower);

    if (!hasSpecificHour) {
      if (/(?:buổi\s*)?chiều(?:\s*mai|\s*nay)?\b/i.test(lower)) {
        result.time = {
          value: null,
          raw: 'chiều',
          isExact: false,
          isRange: true,
          rangeLabel: 'buổi chiều (từ 13:00 đến 18:00)'
        };
        return result;
      }
      if (/(?:buổi\s*)?sáng(?:\s*mai|\s*nay)?\b/i.test(lower)) {
        result.time = {
          value: null,
          raw: 'sáng',
          isExact: false,
          isRange: true,
          rangeLabel: 'buổi sáng (từ 08:30 đến 12:00)'
        };
        return result;
      }
      if (/(?:buổi\s*)?tối(?:\s*mai|\s*nay)?\b/i.test(lower)) {
        result.time = {
          value: null,
          raw: 'tối',
          isExact: false,
          isRange: true,
          rangeLabel: 'buổi tối (từ 18:00 đến 21:00)'
        };
        return result;
      }
    }

    // Exact hour match: "3h", "15h", "15:00", "3h30", "3 giờ chiều", "3 giờ 15", "lúc 10h"
    // If text has correction markers ("à thôi", "thôi", "mà là", "sang"), prioritize the latest mentioned target time
    let exactMatch: RegExpMatchArray | null = null;
    if (lower.includes('à thôi') || lower.includes('mà là') || lower.includes('đổi sang')) {
      const parts = lower.split(/(?:à\s*thôi|mà\s*là|đổi\s*sang)/i);
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        exactMatch = lastPart.match(/\b(\d{1,2})h(\d{2})?(?:\s*(sáng|trưa|chiều|tối|đêm))?(?!\w)/i) ||
                     lastPart.match(/\b(\d{1,2})\s*giờ(?:\s*(\d{2}))?(?:\s*(sáng|trưa|chiều|tối|đêm))?(?!\w)/i) ||
                     lastPart.match(/\b(\d{1,2}):(\d{2})\b/);
      }
    }

    if (!exactMatch) {
      exactMatch = text.match(/\blúc\s+(\d{1,2})(?:[:h](\d{2}))?\s*(?:h|giờ|g)?(?:\s*(sáng|trưa|chiều|tối|đêm))?(?!\w)/i);
    }
    if (!exactMatch) {
      exactMatch = text.match(/\b(\d{1,2})h(\d{2})?(?:\s*(sáng|trưa|chiều|tối|đêm))?(?!\w)/i) ||
                   text.match(/\b(\d{1,2})\s*giờ(?:\s*(\d{2}))?(?:\s*(sáng|trưa|chiều|tối|đêm))?(?!\w)/i) ||
                   text.match(/\b(\d{1,2}):(\d{2})\b/);
    }

    if (exactMatch && (text.includes(':') || /\d+h/i.test(text) || text.includes('giờ') || text.includes('lúc') || exactMatch[2])) {
      let h = parseInt(exactMatch[1], 10);
      const m = exactMatch[2] ? parseInt(exactMatch[2], 10) : 0;
      const period = (exactMatch[3] || '').toLowerCase();

      // Afternoon / Evening conversion: "3h chiều" -> 15:00, "4 giờ chiều" -> 16:00
      if ((period === 'đêm' || lower.includes('đêm')) && h === 12) {
        h = 0;
      } else if ((period === 'chiều' || period === 'tối' || lower.includes('chiều') || lower.includes('tối')) && h < 12) {
        h += 12;
      } else if (period === 'sáng' && h === 12) {
        h = 0;
      } else if (!period && h >= 1 && h <= 5 && !lower.includes('sáng')) {
        // Salon standard business assumption: 1h-5h in appointment context is afternoon (13:00 - 17:00)
        h += 12;
      }

      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        result.time = {
          value: `${hh}:${mm}`,
          raw: exactMatch[0],
          isExact: true,
          isRange: false,
          approximate,
          modifier
        };
      }
    }

    return result;
  }
}
