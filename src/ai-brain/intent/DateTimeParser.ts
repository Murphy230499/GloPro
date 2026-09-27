/**
 * Vietnamese Natural Language Date & Time Parser
 * 
 * Accurately parses Vietnamese date/time expressions and strictly
 * distinguishes between EXACT TIME INSTANTS (e.g. "15h", "15:30", "3 giờ chiều")
 * and VAGUE TIME RANGES (e.g. "sáng mai", "chiều mai", "tối nay").
 */

export interface IParsedDateTime {
  date?: {
    value: string; // YYYY-MM-DD
    raw: string;
    resolved: boolean;
  };
  time?: {
    value: string | null; // HH:MM
    raw: string;
    isExact: boolean;
    isRange: boolean;
    rangeLabel?: string;
  };
}

export function parseVietnameseDateTime(text: string, baseDate: Date = new Date()): IParsedDateTime {
  const lower = text.toLowerCase();
  const result: IParsedDateTime = {};

  // 1. PARSE DATE
  let targetDate = new Date(baseDate);
  let dateFound = false;
  let dateRaw = '';

  if (lower.includes('hôm nay') || lower.includes('hom nay')) {
    dateFound = true;
    dateRaw = 'hôm nay';
  } else if (lower.includes('ngày mai') || lower.includes('chiều mai') || lower.includes('sáng mai') || lower.includes('tối mai') || lower.includes('mai')) {
    targetDate.setDate(targetDate.getDate() + 1);
    dateFound = true;
    dateRaw = 'ngày mai';
  } else if (lower.includes('ngày kia') || lower.includes('ngày mốt') || lower.includes('mốt')) {
    targetDate.setDate(targetDate.getDate() + 2);
    dateFound = true;
    dateRaw = 'ngày kia';
  } else {
    // Check Day of week: "thứ 2" -> "thứ 7", "chủ nhật"
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
      let targetDow = 0; // CN
      if (dowMatch[1]) {
        targetDow = dowMap[dowMatch[1].toLowerCase()] ?? 1;
      }
      const currentDow = targetDate.getDay();
      let diff = targetDow - currentDow;
      if (diff <= 0) diff += 7; // Next occurrence
      targetDate.setDate(targetDate.getDate() + diff);
      dateFound = true;
      dateRaw = dowMatch[0];
    } else {
      // Check DD/MM or DD-MM format
      const explicitDateMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?\b/);
      if (explicitDateMatch) {
        const day = parseInt(explicitDateMatch[1], 10);
        const month = parseInt(explicitDateMatch[2], 10) - 1;
        const year = explicitDateMatch[3] ? parseInt(explicitDateMatch[3], 10) : targetDate.getFullYear();
        targetDate = new Date(year, month, day);
        dateFound = true;
        dateRaw = explicitDateMatch[0];
      }
    }
  }

  if (dateFound) {
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    result.date = {
      value: `${yyyy}-${mm}-${dd}`,
      raw: dateRaw,
      resolved: true
    };
  }

  // 2. PARSE TIME (EXACT vs RANGE)
  // Check exact 24h format: HH:MM or HHhMM
  const exactTimeMatch = text.match(/\b(?:lúc\s*)?(\d{1,2})(?:[:h](\d{2}))?\s*(?:h|giờ|g)?\s*(sáng|trưa|chiều|tối|đêm)?\b/i);
  
  // Distinguish time range words: "sáng mai", "chiều mai", "chiều nay", "sáng", "chiều", "tối"
  const isAfternoonRange = /(?:buổi\s*)?chiều(?:\s*mai|\s*nay)?\b/i.test(lower) && !/\d+\s*(?:h|giờ|:)/i.test(lower);
  const isMorningRange = /(?:buổi\s*)?sáng(?:\s*mai|\s*nay)?\b/i.test(lower) && !/\d+\s*(?:h|giờ|:)/i.test(lower);
  const isEveningRange = /(?:buổi\s*)?tối(?:\s*mai|\s*nay)?\b/i.test(lower) && !/\d+\s*(?:h|giờ|:)/i.test(lower);

  if (isAfternoonRange) {
    result.time = {
      value: null,
      raw: 'chiều',
      isExact: false,
      isRange: true,
      rangeLabel: 'buổi chiều (từ 13:00 đến 18:00)'
    };
  } else if (isMorningRange) {
    result.time = {
      value: null,
      raw: 'sáng',
      isExact: false,
      isRange: true,
      rangeLabel: 'buổi sáng (từ 08:30 đến 12:00)'
    };
  } else if (isEveningRange) {
    result.time = {
      value: null,
      raw: 'tối',
      isExact: false,
      isRange: true,
      rangeLabel: 'buổi tối (từ 18:00 đến 21:00)'
    };
  } else if (exactTimeMatch && (text.includes(':') || text.includes('h') || text.includes('giờ') || text.includes('lúc'))) {
    let hour = parseInt(exactTimeMatch[1], 10);
    const minute = exactTimeMatch[2] ? parseInt(exactTimeMatch[2], 10) : 0;
    const period = (exactTimeMatch[3] || '').toLowerCase();

    // Context adjustments (e.g. 3 giờ chiều -> 15:00)
    if ((period === 'chiều' || period === 'tối') && hour < 12) {
      hour += 12;
    } else if (period === 'sáng' && hour === 12) {
      hour = 0;
    } else if (!period && hour >= 1 && hour <= 6 && lower.includes('chiều')) {
      hour += 12;
    }

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      const hhStr = String(hour).padStart(2, '0');
      const mmStr = String(minute).padStart(2, '0');
      result.time = {
        value: `${hhStr}:${mmStr}`,
        raw: exactTimeMatch[0],
        isExact: true,
        isRange: false
      };
    }
  }

  return result;
}
