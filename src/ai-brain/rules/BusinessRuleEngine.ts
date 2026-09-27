/**
 * BusinessRuleEngine (Phase 4)
 * 
 * Centralized, decoupled salon business rule evaluator.
 * Guarantees that neither LLMs nor client callers can bypass salon operational policies.
 */

import { checkSchedulingConflict } from '../../agents/appointment-agent/conflictDetector';

export interface RuleViolation {
  ruleCode: string;
  field?: string;
  message: string;
  severity: 'BLOCKING' | 'WARNING';
}

export interface RuleEvaluationResult {
  passed: boolean;
  violations: RuleViolation[];
  primaryError?: string;
  suggestedAlternatives?: string[];
}

export class BusinessRuleEngine {
  /**
   * Evaluates rules for Appointment Creation
   */
  static evaluateAppointmentCreation(
    params: Record<string, any>,
    existingAppointments: any[] = [],
    availableStaff: any[] = []
  ): RuleEvaluationResult {
    const violations: RuleViolation[] = [];

    // Rule 1: Customer identification required
    if (!params.customerId && !params.customerName && !params.customer_name && !params.isContextCustomer) {
      violations.push({
        ruleCode: 'APPT_CUSTOMER_REQUIRED',
        field: 'customer',
        message: 'Lịch hẹn bắt buộc phải có thông tin khách hàng.',
        severity: 'BLOCKING'
      });
    }

    // Rule 2: Service identification required
    if (!params.serviceId && !params.serviceName && !params.service_name) {
      violations.push({
        ruleCode: 'APPT_SERVICE_REQUIRED',
        field: 'service',
        message: 'Lịch hẹn bắt buộc phải chỉ định dịch vụ cần làm.',
        severity: 'BLOCKING'
      });
    }

    // Rule 3: Valid date & time required
    if (!params.date || !/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
      violations.push({
        ruleCode: 'APPT_INVALID_DATE_FORMAT',
        field: 'date',
        message: 'Ngày hẹn không hợp lệ (yêu cầu định dạng: YYYY-MM-DD).',
        severity: 'BLOCKING'
      });
    }

    if (!params.time || !/^\d{1,2}:\d{2}$/.test(params.time)) {
      violations.push({
        ruleCode: 'APPT_INVALID_TIME_FORMAT',
        field: 'time',
        message: 'Giờ hẹn không hợp lệ (yêu cầu định dạng: HH:MM).',
        severity: 'BLOCKING'
      });
    }

    // Rule 4: Date cannot be in the past
    const todayStr = new Date().toISOString().split('T')[0];
    if (params.date && params.date < todayStr) {
      violations.push({
        ruleCode: 'APPT_DATE_IN_PAST',
        field: 'date',
        message: `Ngày hẹn ${params.date} đã trôi qua trong quá khứ. Vui lòng chọn ngày hôm nay hoặc tương lai.`,
        severity: 'BLOCKING'
      });
    }

    // Rule 5: Double-Booking Conflict Check (if staff is specified)
    const staffName = params.staffName || params.staff_name;
    let suggestedSlots: string[] = [];

    if (staffName && staffName !== 'Salon tự sắp xếp' && params.date && params.time) {
      const duration = Number(params.durationMinutes || params.duration_minutes || 45);
      const conflict = checkSchedulingConflict(
        existingAppointments,
        staffName,
        params.date,
        params.time,
        duration
      );

      if (conflict.hasConflict) {
        suggestedSlots = conflict.suggestedTimeSlots || ['14:00', '16:30'];
        violations.push({
          ruleCode: 'APPT_STAFF_DOUBLE_BOOKED',
          field: 'staff',
          message: `Nhân viên "${staffName}" đã có lịch hẹn trùng vào khung giờ ${params.time} ngày ${params.date}.`,
          severity: 'BLOCKING'
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      primaryError: violations[0]?.message,
      suggestedAlternatives: suggestedSlots
    };
  }

  /**
   * Evaluates rules for Appointment Cancellation
   */
  static evaluateAppointmentCancellation(appointment: any): RuleEvaluationResult {
    const violations: RuleViolation[] = [];

    if (!appointment) {
      violations.push({
        ruleCode: 'APPT_NOT_FOUND',
        message: 'Không tìm thấy lịch hẹn cần hủy.',
        severity: 'BLOCKING'
      });
      return { passed: false, violations, primaryError: violations[0].message };
    }

    // Rule: Cancelled appointment cannot be cancelled again
    if (appointment.status === 'cancelled') {
      violations.push({
        ruleCode: 'APPT_ALREADY_CANCELLED',
        message: 'Lịch hẹn này đã được hủy trước đó.',
        severity: 'BLOCKING'
      });
    }

    // Rule: Completed appointment cannot be cancelled
    if (appointment.status === 'completed') {
      violations.push({
        ruleCode: 'APPT_CANNOT_CANCEL_COMPLETED',
        message: 'Lịch hẹn này đã hoàn thành dịch vụ, không thể hủy.',
        severity: 'BLOCKING'
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      primaryError: violations[0]?.message
    };
  }

  /**
   * Evaluates rules for Customer Creation
   */
  static evaluateCustomerCreation(
    params: Record<string, any>,
    existingCustomers: any[] = []
  ): RuleEvaluationResult {
    const violations: RuleViolation[] = [];

    if (!params.name && !params.customerName) {
      violations.push({
        ruleCode: 'CUST_NAME_REQUIRED',
        field: 'name',
        message: 'Tên khách hàng không được để trống.',
        severity: 'BLOCKING'
      });
    }

    const phone = (params.phone || params.customerPhone || '').replace(/\D/g, '');
    if (!phone || phone.length < 9 || phone.length > 11) {
      violations.push({
        ruleCode: 'CUST_INVALID_PHONE_FORMAT',
        field: 'phone',
        message: 'Số điện thoại khách hàng không hợp lệ (yêu cầu 10 chữ số).',
        severity: 'BLOCKING'
      });
    } else {
      // Check duplicate phone
      const duplicate = existingCustomers.find(c => (c.phone || '').replace(/\D/g, '') === phone);
      if (duplicate) {
        violations.push({
          ruleCode: 'CUST_DUPLICATE_PHONE',
          field: 'phone',
          message: `Số điện thoại "${phone}" đã thuộc về khách hàng ${duplicate.name || ''}.`,
          severity: 'BLOCKING'
        });
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      primaryError: violations[0]?.message
    };
  }
}
