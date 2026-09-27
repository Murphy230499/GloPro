/**
 * AmbiguityDetector (Phase 5 Intelligence)
 * 
 * Accurately diagnoses missing or ambiguous parameters in natural Vietnamese user requests
 * and formats human-like, non-generic clarification questions.
 * 
 * Example:
 * Instead of: "Bạn có thể cung cấp thêm thông tin không?"
 * Asks: "Bạn muốn đặt lịch cho Lan nào? Mình tìm thấy 2 khách hàng phù hợp:"
 * Or: "Bạn muốn đặt dịch vụ nào và vào mấy giờ ngày mai?"
 */

export interface AmbiguityDiagnosis {
  isAmbiguous: boolean;
  needsClarification: boolean;
  missingFields: string[];
  ambiguityType?: 'MULTIPLE_CUSTOMERS' | 'MULTIPLE_STAFF' | 'MULTIPLE_SERVICES' | 'TIME_IS_RANGE' | 'UNRESOLVED_PRONOUN' | 'MISSING_DATE_TIME';
  clarificationMessage?: string;
  candidates?: Array<{ id: string; name: string; phone?: string }>;
}

export class AmbiguityDetector {
  /**
   * Diagnoses appointment creation requirements
   */
  static diagnoseAppointment(params: {
    customer?: { value?: string; resolved?: boolean; candidates?: any[] };
    service?: { value?: string; resolved?: boolean; candidates?: any[] };
    date?: { value?: string; resolved?: boolean };
    time?: { value?: string | null; isExact?: boolean; isRange?: boolean; rangeLabel?: string };
    staff?: { value?: string; resolved?: boolean; candidates?: any[] };
  }): AmbiguityDiagnosis {
    const missing: string[] = [];

    // 1. Check Multiple Candidates (Disambiguation)
    if (params.customer?.candidates && params.customer.candidates.length > 1) {
      const candList = params.customer.candidates.map((c, i) => `${i + 1}. **${c.name}** (SĐT: \`${c.phone || c.data?.phone || 'Chưa có'}\`)`).join('\n');
      return {
        isAmbiguous: true,
        needsClarification: true,
        missingFields: ['customer_choice'],
        ambiguityType: 'MULTIPLE_CUSTOMERS',
        clarificationMessage: `Tìm thấy ${params.customer.candidates.length} khách hàng phù hợp. Bạn muốn chọn ai?\n${candList}`,
        candidates: params.customer.candidates
      };
    }

    if (params.staff?.candidates && params.staff.candidates.length > 1) {
      const candList = params.staff.candidates.map((s, i) => `${i + 1}. **${s.name}**`).join('\n');
      return {
        isAmbiguous: true,
        needsClarification: true,
        missingFields: ['staff_choice'],
        ambiguityType: 'MULTIPLE_STAFF',
        clarificationMessage: `Tìm thấy ${params.staff.candidates.length} nhân viên phù hợp. Bạn muốn chọn ai?\n${candList}`,
        candidates: params.staff.candidates
      };
    }

    // 2. Check Time Range (e.g. "chiều mai" without exact hour)
    if (params.time?.isRange && !params.time.isExact) {
      const custName = params.customer?.value || 'khách';
      return {
        isAmbiguous: true,
        needsClarification: true,
        missingFields: ['exact_time'],
        ambiguityType: 'TIME_IS_RANGE',
        clarificationMessage: `Bạn muốn đặt lịch cho ${custName} vào khung giờ cụ thể nào trong ${params.time.rangeLabel || 'buổi này'}?`
      };
    }

    // 3. Check Required Fields
    if (!params.customer?.value && !params.customer?.resolved) missing.push('khách hàng');
    if (!params.service?.value && !params.service?.resolved) missing.push('dịch vụ');
    if (!params.date?.value) missing.push('ngày hẹn');
    if (!params.time?.value) missing.push('giờ hẹn');

    if (missing.length > 0) {
      let prompt = 'Để đặt lịch chính xác, vui lòng cho biết thêm: ';
      const parts: string[] = [];
      if (missing.includes('khách hàng')) parts.push('bạn muốn đặt lịch cho khách hàng nào');
      if (missing.includes('dịch vụ')) parts.push('khách muốn làm dịch vụ gì');
      if (missing.includes('ngày hẹn')) parts.push('vào ngày nào');
      if (missing.includes('giờ hẹn')) parts.push('vào mấy giờ');

      prompt += parts.join(', ') + '?';

      return {
        isAmbiguous: false,
        needsClarification: true,
        missingFields: missing,
        clarificationMessage: prompt
      };
    }

    return {
      isAmbiguous: false,
      needsClarification: false,
      missingFields: []
    };
  }

  /**
   * Diagnoses customer creation requirements
   */
  static diagnoseCustomerCreation(params: { name?: string; phone?: string }): AmbiguityDiagnosis {
    const missing: string[] = [];
    if (!params.name || params.name.trim().length < 2) missing.push('họ tên');
    if (!params.phone || !/^(0|\+84)\d{9,10}$/.test(params.phone.replace(/\s+/g, ''))) missing.push('số điện thoại');

    if (missing.length > 0) {
      return {
        isAmbiguous: false,
        needsClarification: true,
        missingFields: missing,
        clarificationMessage: `Để tạo hồ sơ khách hàng mới, vui lòng cung cấp đầy đủ: ${missing.join(' và ')}.`
      };
    }

    return {
      isAmbiguous: false,
      needsClarification: false,
      missingFields: []
    };
  }
}
