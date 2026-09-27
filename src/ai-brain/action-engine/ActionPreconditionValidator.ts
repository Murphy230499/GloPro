/**
 * Action Precondition Validator
 * 
 * Validates business rules, existence of required entities, duplicate checks,
 * and detects scheduling conflicts before an action can be planned or executed.
 * 
 * Includes Stale Data Protection (recheckStaleState) immediately before mutation.
 */

import { ActionType, ActionStatus } from './ActionContracts';
import { base44 } from '../../api/base44Client';
import { checkSchedulingConflict } from '../../agents/appointment-agent/conflictDetector';

export interface PreconditionValidationResult {
  valid: boolean;
  status: ActionStatus;
  message?: string;
  conflictDetails?: any;
  resolvedData?: Record<string, any>;
}

export class ActionPreconditionValidator {
  /**
   * Validates prerequisites for customer creation
   */
  static async validateCreateCustomer(params: Record<string, any>): Promise<PreconditionValidationResult> {
    const phone = (params.phone || '').replace(/\s+/g, '');
    if (!phone || !/^0\d{9,10}$/.test(phone)) {
      return {
        valid: false,
        status: 'VALIDATION_ERROR',
        message: `Số điện thoại "${params.phone || ''}" không hợp lệ. Vui lòng cung cấp số điện thoại 10 số bắt đầu bằng số 0.`
      };
    }

    if (!params.name || params.name.trim().length < 2) {
      return {
        valid: false,
        status: 'VALIDATION_ERROR',
        message: 'Họ tên khách hàng không được để trống (tối thiểu 2 ký tự).'
      };
    }

    // Check duplicate customer by phone
    const customers = await base44.entities.Customer.list().catch(() => []);
    const duplicate = customers.find(c => (c.phone || '').replace(/\s+/g, '') === phone);
    if (duplicate) {
      return {
        valid: false,
        status: 'CONFLICT',
        message: `Khách hàng với số điện thoại \`${phone}\` đã tồn tại trên hệ thống (${duplicate.name}). Bạn có muốn cập nhật thông tin khách hàng này không?`
      };
    }

    return { valid: true, status: 'SUCCESS' };
  }

  /**
   * Validates prerequisites for customer update
   */
  static async validateUpdateCustomer(params: Record<string, any>): Promise<PreconditionValidationResult> {
    if (!params.id && !params.phone) {
      return {
        valid: false,
        status: 'VALIDATION_ERROR',
        message: 'Cần xác định khách hàng qua ID hoặc số điện thoại để cập nhật.'
      };
    }

    const customers = await base44.entities.Customer.list().catch(() => []);
    let target = null;

    if (params.id) {
      target = customers.find(c => c.id === params.id);
    } else if (params.phone) {
      const cleanP = params.phone.replace(/\s+/g, '');
      const matches = customers.filter(c => (c.phone || '').replace(/\s+/g, '') === cleanP);
      if (matches.length > 1) {
        return {
          valid: false,
          status: 'AMBIGUOUS',
          message: `Tìm thấy ${matches.length} khách hàng có cùng số điện thoại. Vui lòng xác định bằng ID.`
        };
      }
      target = matches[0];
    }

    if (!target) {
      return {
        valid: false,
        status: 'NOT_FOUND',
        message: 'Không tìm thấy khách hàng trong cơ sở dữ liệu để cập nhật.'
      };
    }

    // Check if new phone is duplicate of someone else
    if (params.newPhone && params.newPhone !== target.phone) {
      const cleanNew = params.newPhone.replace(/\s+/g, '');
      const otherDuplicate = customers.find(c => c.id !== target.id && (c.phone || '').replace(/\s+/g, '') === cleanNew);
      if (otherDuplicate) {
        return {
          valid: false,
          status: 'CONFLICT',
          message: `Số điện thoại mới \`${params.newPhone}\` đã thuộc về khách hàng khác (${otherDuplicate.name}).`
        };
      }
    }

    return {
      valid: true,
      status: 'SUCCESS',
      resolvedData: {
        customerId: target.id,
        currentRecord: target
      }
    };
  }

  /**
   * Validates prerequisites for appointment creation (existence, slot availability, double-booking conflict)
   */
  static async validateCreateAppointment(params: Record<string, any>): Promise<PreconditionValidationResult> {
    // 1. Date & Time Validation
    if (!params.date || !/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
      return {
        valid: false,
        status: 'VALIDATION_ERROR',
        message: 'Ngày hẹn không hợp lệ (định dạng yêu cầu: YYYY-MM-DD).'
      };
    }

    if (!params.time || !/^\d{1,2}:\d{2}$/.test(params.time)) {
      return {
        valid: false,
        status: 'VALIDATION_ERROR',
        message: 'Giờ hẹn không hợp lệ (định dạng yêu cầu: HH:MM, ví dụ 15:00).'
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (params.date < todayStr) {
      return {
        valid: false,
        status: 'VALIDATION_ERROR',
        message: `Ngày hẹn ${params.date} đã trôi qua trong quá khứ. Vui lòng chọn ngày hôm nay hoặc tương lai.`
      };
    }

    // 2. Service existence & duration
    const services = await base44.entities.Service.list().catch(() => []);
    let targetService = null;
    if (params.serviceId) {
      targetService = services.find(s => s.id === params.serviceId);
    } else if (params.serviceName) {
      const qServ = params.serviceName.toLowerCase().trim();
      const matched = services.filter(s => (s.name || '').toLowerCase().includes(qServ));
      const uniqueNames = new Set(matched.map(s => (s.name || '').trim().toLowerCase()));
      if (uniqueNames.size > 1) {
        return {
          valid: false,
          status: 'AMBIGUOUS',
          message: `Tìm thấy ${matched.length} dịch vụ tương tự "${params.serviceName}". Vui lòng chọn chính xác dịch vụ.`
        };
      }
      targetService = matched[0];
    }

    const durationMinutes = targetService?.duration_minutes || params.durationMinutes || 45;
    const servicePrice = targetService?.price || params.servicePrice || 0;
    const serviceName = targetService?.name || params.serviceName;

    // 3. Staff check (if specified)
    const staffList = await base44.entities.Staff.list().catch(() => []);
    let targetStaff = null;
    if (params.staffId) {
      targetStaff = staffList.find(s => s.id === params.staffId);
    } else if (params.staffName && params.staffName !== 'Salon tự sắp xếp' && params.staffName !== 'Nhân viên mặc định') {
      const qStaff = params.staffName.toLowerCase().trim();
      const branchStaff = params.branchId
        ? staffList.filter(s => s.branch_id === params.branchId || (Array.isArray(s.branch_ids) && s.branch_ids.includes(params.branchId)))
        : staffList;

      const candidates = branchStaff.length > 0 ? branchStaff : staffList;
      const matched = candidates.filter(s => {
        const full = (s.full_name || s.name || '').toLowerCase();
        return full.includes(qStaff);
      });

      // Prioritize exact given name match (Vietnamese call name = last word)
      const exactGiven = matched.filter(s => {
        const words = (s.full_name || s.name || '').trim().toLowerCase().split(/\s+/);
        return words[words.length - 1] === qStaff;
      });

      if (exactGiven.length === 1) {
        targetStaff = exactGiven[0];
      } else {
        const pool = exactGiven.length > 1 ? exactGiven : matched;
        const uniqueStaff = new Set(pool.map(s => (s.full_name || s.name || '').trim().toLowerCase()));
        if (uniqueStaff.size > 1) {
          return {
            valid: false,
            status: 'AMBIGUOUS',
            message: `Tìm thấy ${pool.length} nhân viên có tên "${params.staffName}". Vui lòng chọn nhân viên cụ thể.`
          };
        }
        targetStaff = pool[0];
      }
    }

    const assignedStaffName = targetStaff ? (targetStaff.full_name || targetStaff.name) : (params.staffName || 'Salon tự sắp xếp');

    // 4. Double-Booking Conflict Detection
    const appointments = await base44.entities.Appointment.list().catch(() => []);
    if (targetStaff || (assignedStaffName && assignedStaffName !== 'Salon tự sắp xếp')) {
      const conflict = checkSchedulingConflict(
        appointments,
        assignedStaffName,
        params.date,
        params.time,
        durationMinutes
      );

      if (conflict.hasConflict) {
        const altSlots = conflict.suggestedTimeSlots?.join(', ') || '16:00, 16:30';
        return {
          valid: false,
          status: 'CONFLICT',
          message: `⚠️ **Trùng lịch hẹn!** Nhân viên **${assignedStaffName}** đã có lịch làm vào khoảng thời gian này ngày **${params.date}**.\n\nGợi ý các khung giờ còn trống: **${altSlots}**.`,
          conflictDetails: conflict
        };
      }
    }

    return {
      valid: true,
      status: 'SUCCESS',
      resolvedData: {
        serviceId: targetService?.id,
        serviceName,
        servicePrice,
        durationMinutes,
        staffId: targetStaff?.id,
        staffName: assignedStaffName
      }
    };
  }

  /**
   * Validates prerequisites for appointment cancellation
   */
  static async validateCancelAppointment(params: Record<string, any>): Promise<PreconditionValidationResult> {
    const appointments = await base44.entities.Appointment.list().catch(() => []);
    let target = null;

    if (params.appointmentId) {
      target = appointments.find(a => a.id === params.appointmentId);
    } else if (params.customerPhone) {
      const cleanP = params.customerPhone.replace(/\s+/g, '');
      const matches = appointments.filter(a =>
        (a.customer_phone || '').replace(/\s+/g, '') === cleanP &&
        (!params.date || a.date === params.date)
      );
      if (matches.length > 1) {
        const activeMatches = matches.filter(a => a.status !== 'cancelled');
        if (activeMatches.length > 1) {
          return {
            valid: false,
            status: 'AMBIGUOUS',
            message: `Tìm thấy ${activeMatches.length} lịch hẹn của khách hàng này. Vui lòng chỉ định ngày hoặc giờ cụ thể để hủy.`
          };
        }
        target = activeMatches[0] || matches[0];
      } else {
        target = matches[0];
      }
    }

    if (!target) {
      return {
        valid: false,
        status: 'NOT_FOUND',
        message: 'Không tìm thấy lịch hẹn phù hợp để hủy trong hệ thống.'
      };
    }

    // Check already cancelled
    if (target.status === 'cancelled') {
      return {
        valid: false,
        status: 'ALREADY_APPLIED',
        message: `Lịch hẹn này đã được hủy trước đó vào lúc ${target.start_time || ''} ngày ${target.date}.`
      };
    }

    // Check completed
    if (target.status === 'completed') {
      return {
        valid: false,
        status: 'PRECONDITION_FAILED',
        message: `Lịch hẹn này đã hoàn thành dịch vụ (${target.date}), không thể hủy theo quy định salon.`
      };
    }

    return {
      valid: true,
      status: 'SUCCESS',
      resolvedData: {
        appointmentId: target.id,
        appointment: target
      }
    };
  }

  /**
   * STALE DATA RE-CHECK (Critical Safety Guard)
   * Re-evaluates state immediately before executing write to catch conflicts that occurred while awaiting user confirmation
   */
  static async recheckStaleState(actionType: ActionType, params: Record<string, any>): Promise<PreconditionValidationResult> {
    switch (actionType) {
      case 'CREATE_APPOINTMENT':
        return this.validateCreateAppointment(params);
      case 'CANCEL_APPOINTMENT':
        return this.validateCancelAppointment(params);
      case 'UPDATE_CUSTOMER':
        return this.validateUpdateCustomer(params);
      case 'CREATE_CUSTOMER':
        return this.validateCreateCustomer(params);
      default:
        return { valid: true, status: 'SUCCESS' };
    }
  }
}
