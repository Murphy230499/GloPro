/**
 * EasySalon Business Rules Engine
 * 
 * Centralized, extensible business rules registry for salon operations.
 * Validates intents and entity parameters before any tool or action can be executed.
 */

export interface IRuleValidationResult {
  valid: boolean;
  missingFields: string[];
  ambiguities: string[];
  clarificationMessage?: string;
  ruleViolated?: string;
}

export interface IBusinessRule {
  id: string;
  name: string;
  category: 'appointment' | 'customer' | 'service' | 'invoice' | 'tip' | 'staff';
  description: string;
  validate(intent: string, entities: Record<string, any>, context?: any): IRuleValidationResult;
}

export class BusinessRulesRegistry {
  private rules: Map<string, IBusinessRule> = new Map();

  register(rule: IBusinessRule): void {
    this.rules.set(rule.id, rule);
  }

  getRulesByCategory(category: string): IBusinessRule[] {
    return Array.from(this.rules.values()).filter(r => r.category === category);
  }

  validate(intent: string, entities: Record<string, any>, context?: any): IRuleValidationResult {
    const missingFields: string[] = [];
    const ambiguities: string[] = [];
    const clarificationParts: string[] = [];

    for (const rule of this.rules.values()) {
      const result = rule.validate(intent, entities, context);
      if (!result.valid) {
        if (result.missingFields) missingFields.push(...result.missingFields);
        if (result.ambiguities) ambiguities.push(...result.ambiguities);
        if (result.clarificationMessage) clarificationParts.push(result.clarificationMessage);
      }
    }

    const uniqueMissing = Array.from(new Set(missingFields));
    const uniqueAmbiguities = Array.from(new Set(ambiguities));

    return {
      valid: uniqueMissing.length === 0 && uniqueAmbiguities.length === 0,
      missingFields: uniqueMissing,
      ambiguities: uniqueAmbiguities,
      clarificationMessage: clarificationParts.join(' ')
    };
  }
}

// -------------------------------------------------------------
// 1. APPOINTMENT BUSINESS RULES
// -------------------------------------------------------------

export const AppointmentCompletenessRule: IBusinessRule = {
  id: 'rule_appointment_completeness',
  name: 'Appointment Mandatory Information Rule',
  category: 'appointment',
  description: 'Một lịch hẹn bắt buộc phải xác định: Khách hàng, Dịch vụ, Ngày hẹn và Giờ hẹn chính xác.',
  validate(intent: string, entities: Record<string, any>): IRuleValidationResult {
    if (intent !== 'CREATE_APPOINTMENT') return { valid: true, missingFields: [], ambiguities: [] };

    const missing: string[] = [];
    const questions: string[] = [];

    const customer = entities.customer?.value;
    const service = entities.service?.value;
    const date = entities.date?.value;
    const time = entities.time?.value;
    const isTimeRange = entities.time?.isRange;

    if (!customer) {
      missing.push('customer');
      questions.push('bạn muốn đặt lịch cho khách hàng nào');
    }

    if (!service) {
      missing.push('service');
      questions.push('khách muốn làm dịch vụ gì');
    }

    if (!date) {
      missing.push('date');
      questions.push('vào ngày nào');
    }

    if (!time || isTimeRange) {
      missing.push('time');
      if (isTimeRange && entities.time?.rangeLabel) {
        questions.push(`vào khung giờ cụ thể nào trong ${entities.time.rangeLabel}`);
      } else {
        questions.push('vào giờ nào');
      }
    }

    if (missing.length > 0) {
      const customerName = customer ? `cho ${customer} ` : '';
      return {
        valid: false,
        missingFields: missing,
        ambiguities: isTimeRange ? ['time_is_range_not_exact'] : [],
        clarificationMessage: `Để đặt lịch ${customerName}chính xác, vui lòng cho biết thêm: ${questions.join(', ')}?`,
        ruleViolated: 'rule_appointment_completeness'
      };
    }

    return { valid: true, missingFields: [], ambiguities: [] };
  }
};

// -------------------------------------------------------------
// 2. CUSTOMER BUSINESS RULES
// -------------------------------------------------------------

export const CustomerCreationRule: IBusinessRule = {
  id: 'rule_customer_creation',
  name: 'Customer Creation Mandatory Fields',
  category: 'customer',
  description: 'Tạo khách hàng mới bắt buộc phải có Họ tên và Số điện thoại 10 số.',
  validate(intent: string, entities: Record<string, any>): IRuleValidationResult {
    if (intent !== 'CREATE_CUSTOMER') return { valid: true, missingFields: [], ambiguities: [] };

    const missing: string[] = [];
    const questions: string[] = [];

    if (!entities.name?.value || String(entities.name.value).trim().length < 2) {
      missing.push('name');
      questions.push('Họ tên khách hàng');
    }

    const phone = entities.phone?.value;
    if (!phone) {
      missing.push('phone');
      questions.push('Số điện thoại liên hệ (10 chữ số)');
    }

    if (missing.length > 0) {
      return {
        valid: false,
        missingFields: missing,
        ambiguities: [],
        clarificationMessage: `Để tạo hồ sơ khách hàng mới, vui lòng cung cấp thêm: ${questions.join(' và ')} ạ.`,
        ruleViolated: 'rule_customer_creation'
      };
    }

    return { valid: true, missingFields: [], ambiguities: [] };
  }
};

export const CustomerMultipleMatchRule: IBusinessRule = {
  id: 'rule_customer_multiple_match',
  name: 'Multiple Customer Matches Disambiguation',
  category: 'customer',
  description: 'Nếu tìm thấy nhiều khách hàng trùng tên, không được tự ý chọn mà phải hỏi người dùng chọn.',
  validate(intent: string, entities: Record<string, any>): IRuleValidationResult {
    if (entities.customer?.matches && Array.isArray(entities.customer.matches) && entities.customer.matches.length > 1) {
      const list = entities.customer.matches.map((c: any, i: number) => 
        `${i + 1}. **${c.name}** (SĐT: \`${c.phone || 'Chưa có'}\`${c.tier ? ` - Hạng: ${c.tier}` : ''})`
      ).join('\n');

      return {
        valid: false,
        missingFields: ['customer_selection'],
        ambiguities: ['multiple_customers_found'],
        clarificationMessage: `Tìm thấy ${entities.customer.matches.length} khách hàng phù hợp. Bạn muốn chọn ai?\n${list}`,
        ruleViolated: 'rule_customer_multiple_match'
      };
    }
    return { valid: true, missingFields: [], ambiguities: [] };
  }
};

// -------------------------------------------------------------
// 3. SERVICE BUSINESS RULES
// -------------------------------------------------------------

export const ServiceAmbiguityRule: IBusinessRule = {
  id: 'rule_service_ambiguity',
  name: 'Service Name Ambiguity Disambiguation',
  category: 'service',
  description: 'Nếu tên dịch vụ mơ hồ và có nhiều dịch vụ con tương tự, bắt buộc phải hỏi lại.',
  validate(intent: string, entities: Record<string, any>): IRuleValidationResult {
    if (entities.service?.matches && Array.isArray(entities.service.matches) && entities.service.matches.length > 1) {
      const list = entities.service.matches.slice(0, 4).map((s: any, i: number) => 
        `${i + 1}. **${s.name}** (${(Number(s.price) || 0).toLocaleString('vi-VN')} đ)`
      ).join('\n');

      return {
        valid: false,
        missingFields: ['service_selection'],
        ambiguities: ['multiple_services_found'],
        clarificationMessage: `Salon có các gói dịch vụ sau, bạn muốn chọn gói nào:\n${list}`,
        ruleViolated: 'rule_service_ambiguity'
      };
    }
    return { valid: true, missingFields: [], ambiguities: [] };
  }
};

// -------------------------------------------------------------
// 4. INVOICE BUSINESS RULES
// -------------------------------------------------------------

export const InvoiceCompletenessRule: IBusinessRule = {
  id: 'rule_invoice_completeness',
  name: 'Invoice Creation Completeness Rule',
  category: 'invoice',
  description: 'Không được tạo hóa đơn khi chưa có khách hàng hoặc chưa có số tiền / danh sách món.',
  validate(intent: string, entities: Record<string, any>): IRuleValidationResult {
    if (intent !== 'CREATE_INVOICE') return { valid: true, missingFields: [], ambiguities: [] };

    const missing: string[] = [];
    if (!entities.customer?.value) missing.push('customer');
    if (!entities.amount?.value && !entities.items?.value) missing.push('amount_or_items');

    if (missing.length > 0) {
      return {
        valid: false,
        missingFields: missing,
        ambiguities: [],
        clarificationMessage: 'Vui lòng cung cấp tên khách hàng và số tiền hoặc dịch vụ/sản phẩm cần tạo bill.',
        ruleViolated: 'rule_invoice_completeness'
      };
    }
    return { valid: true, missingFields: [], ambiguities: [] };
  }
};

// -------------------------------------------------------------
// 5. TIP ACCOUNTING RULE
// -------------------------------------------------------------

export const TipAccountingPrincipleRule: IBusinessRule = {
  id: 'rule_tip_accounting',
  name: 'Tip Is Pass-Through Not Revenue Rule',
  category: 'tip',
  description: 'Tiền tip là khoản thu hộ cho nhân viên, KHÔNG được cộng vào doanh thu salon.',
  validate(intent: string, entities: Record<string, any>): IRuleValidationResult {
    if (intent === 'TIP_OPERATION') {
      const staff = entities.staff?.value;
      const amount = entities.amount?.value;
      if (!amount) {
        return {
          valid: false,
          missingFields: ['amount'],
          ambiguities: [],
          clarificationMessage: `Bạn muốn tip bao nhiêu tiền cho ${staff ? `nhân viên ${staff}` : 'nhân viên'}?`,
          ruleViolated: 'rule_tip_accounting'
        };
      }
    }
    return { valid: true, missingFields: [], ambiguities: [] };
  }
};

// -------------------------------------------------------------
// 6. APPOINTMENT CANCELLATION & RESCHEDULE RULES
// -------------------------------------------------------------

export const CancelAppointmentCompletenessRule: IBusinessRule = {
  id: 'rule_cancel_appointment_completeness',
  name: 'Cancel Appointment Target Rule',
  category: 'appointment',
  description: 'Hủy lịch hẹn bắt buộc phải xác định được khách hàng hoặc ID lịch hẹn.',
  validate(intent: string, entities: Record<string, any>): IRuleValidationResult {
    if (intent === 'CANCEL_APPOINTMENT' && !entities.customer?.value && !entities.customer?.id) {
      return {
        valid: false,
        missingFields: ['customer'],
        ambiguities: [],
        clarificationMessage: 'Bạn muốn hủy lịch hẹn của khách hàng nào ạ?',
        ruleViolated: 'rule_cancel_appointment_completeness'
      };
    }
    return { valid: true, missingFields: [], ambiguities: [] };
  }
};

export const StaffAssignmentCompletenessRule: IBusinessRule = {
  id: 'rule_staff_assignment_completeness',
  name: 'Staff Assignment Target Rule',
  category: 'staff',
  description: 'Yêu cầu xếp nhân viên bắt buộc phải có thông tin lịch hẹn hoặc khách hàng cụ thể.',
  validate(intent: string, entities: Record<string, any>): IRuleValidationResult {
    if (intent === 'SEARCH_STAFF' || intent === 'CREATE_APPOINTMENT') {
      if (entities.staff?.value && !entities.customer?.value && !entities.time?.value && !entities.service?.value) {
        return {
          valid: false,
          missingFields: ['appointment_details'],
          ambiguities: ['ambiguous_staff_action'],
          clarificationMessage: `Bạn muốn xếp thợ ${entities.staff.value} làm dịch vụ gì và vào thời gian nào ạ?`,
          ruleViolated: 'rule_staff_assignment_completeness'
        };
      }
    }
    return { valid: true, missingFields: [], ambiguities: [] };
  }
};

// -------------------------------------------------------------
// 7. PAYMENT & INVENTORY BUSINESS RULES (Phase 6)
// -------------------------------------------------------------

export const PaymentValidationRule: IBusinessRule = {
  id: 'rule_payment_validation',
  name: 'Payment Validation & Method Rule',
  category: 'invoice',
  description: 'Thanh toán bắt buộc phải xác định số tiền hợp lệ và phương thức thanh toán được hỗ trợ (CASH, BANK_TRANSFER, CARD).',
  validate(intent: string, entities: Record<string, any>): IRuleValidationResult {
    if (intent === 'ADD_PAYMENT' || intent === 'CHECKOUT_INVOICE') {
      const method = (entities.paymentMethod?.value || entities.method?.value || '').toLowerCase();
      const validMethods = ['cash', 'tiền mặt', 'bank_transfer', 'transfer', 'chuyển khoản', 'card', 'thẻ', 'qr'];
      if (method && !validMethods.some(m => method.includes(m))) {
        return {
          valid: false,
          missingFields: [],
          ambiguities: ['unsupported_payment_method'],
          clarificationMessage: `Phương thức thanh toán "${method}" không được hỗ trợ. Vui lòng chọn Tiền mặt, Chuyển khoản hoặc Thẻ.`,
          ruleViolated: 'rule_payment_validation'
        };
      }
      if (entities.amount?.value && Number(entities.amount.value) < 0) {
        return {
          valid: false,
          missingFields: ['valid_amount'],
          ambiguities: [],
          clarificationMessage: 'Số tiền thanh toán phải lớn hơn 0.',
          ruleViolated: 'rule_payment_validation'
        };
      }
    }
    return { valid: true, missingFields: [], ambiguities: [] };
  }
};

export const StockAdjustmentRule: IBusinessRule = {
  id: 'rule_stock_adjustment',
  name: 'Stock Adjustment & Receive Rule',
  category: 'invoice',
  description: 'Thao tác kho bắt buộc phải có sản phẩm cụ thể và số lượng điều chỉnh hợp lệ (> 0).',
  validate(intent: string, entities: Record<string, any>): IRuleValidationResult {
    if (intent === 'RECEIVE_STOCK' || intent === 'ADJUST_STOCK' || intent === 'ISSUE_STOCK') {
      const missing: string[] = [];
      if (!entities.product?.value && !entities.service?.value) missing.push('product');
      if (!entities.quantity?.value && !entities.amount?.value) missing.push('quantity');

      if (missing.length > 0) {
        return {
          valid: false,
          missingFields: missing,
          ambiguities: [],
          clarificationMessage: 'Vui lòng cho biết tên sản phẩm và số lượng cần nhập/xuất kho.',
          ruleViolated: 'rule_stock_adjustment'
        };
      }
    }
    return { valid: true, missingFields: [], ambiguities: [] };
  }
};

// Default singleton registry with all salon rules registered
export const defaultBusinessRulesRegistry = new BusinessRulesRegistry();
defaultBusinessRulesRegistry.register(AppointmentCompletenessRule);
defaultBusinessRulesRegistry.register(CustomerCreationRule);
defaultBusinessRulesRegistry.register(CustomerMultipleMatchRule);
defaultBusinessRulesRegistry.register(ServiceAmbiguityRule);
defaultBusinessRulesRegistry.register(InvoiceCompletenessRule);
defaultBusinessRulesRegistry.register(TipAccountingPrincipleRule);
defaultBusinessRulesRegistry.register(CancelAppointmentCompletenessRule);
defaultBusinessRulesRegistry.register(StaffAssignmentCompletenessRule);
defaultBusinessRulesRegistry.register(PaymentValidationRule);
defaultBusinessRulesRegistry.register(StockAdjustmentRule);
