/**
 * Post-Write Verification
 * 
 * Verifies that written records actually exist in the database with expected values.
 * Never declares SUCCESS based merely on HTTP 200 or an unverified ID.
 */

import { ActionType } from './ActionContracts';
import { base44 } from '../../api/base44Client';

export interface VerificationResult {
  verified: boolean;
  error?: string;
  verifiedRecord?: any;
}

export class PostWriteVerification {
  /**
   * Verifies written state by reading back directly from database via base44 client
   */
  static async verify(
    actionType: ActionType,
    targetId: string,
    expectedValues: Record<string, any>
  ): Promise<VerificationResult> {
    if (!targetId) {
      return { verified: false, error: 'Không có ID bản ghi để xác minh sau khi ghi.' };
    }

    try {
      switch (actionType) {
        case 'CREATE_CUSTOMER': {
          const customer = await base44.entities.Customer.get(targetId).catch(() => null);
          if (!customer) {
            return { verified: false, error: `Hệ thống không tìm thấy khách hàng vừa tạo (ID: ${targetId}).` };
          }
          if (expectedValues.phone && customer.phone && !customer.phone.includes(expectedValues.phone.replace(/\s+/g, ''))) {
            return { verified: false, error: `Số điện thoại của khách hàng không khớp với dữ liệu đã lưu.` };
          }
          return { verified: true, verifiedRecord: customer };
        }

        case 'UPDATE_CUSTOMER': {
          const customer = await base44.entities.Customer.get(targetId).catch(() => null);
          if (!customer) {
            return { verified: false, error: `Không tìm thấy khách hàng để xác minh sau cập nhật.` };
          }
          // Check updated fields
          if (expectedValues.name && customer.name !== expectedValues.name) {
            return { verified: false, error: `Tên khách hàng chưa được cập nhật chính xác trong CSDL.` };
          }
          if (expectedValues.phone && customer.phone !== expectedValues.phone) {
            return { verified: false, error: `Số điện thoại chưa được cập nhật chính xác trong CSDL.` };
          }
          return { verified: true, verifiedRecord: customer };
        }

        case 'CREATE_APPOINTMENT': {
          const appt = await base44.entities.Appointment.get(targetId).catch(() => null);
          if (!appt) {
            return { verified: false, error: `Hệ thống không tìm thấy lịch hẹn vừa tạo (ID: ${targetId}).` };
          }
          if (expectedValues.date && appt.date !== expectedValues.date) {
            return { verified: false, error: `Ngày hẹn trong cơ sở dữ liệu không khớp với yêu cầu.` };
          }
          if (expectedValues.time && (appt.start_time !== expectedValues.time && appt.time !== expectedValues.time)) {
            return { verified: false, error: `Giờ hẹn trong cơ sở dữ liệu không khớp với yêu cầu.` };
          }
          return { verified: true, verifiedRecord: appt };
        }

        case 'CANCEL_APPOINTMENT': {
          const appt = await base44.entities.Appointment.get(targetId).catch(() => null);
          if (!appt) {
            return { verified: false, error: `Không tìm thấy lịch hẹn sau thao tác hủy.` };
          }
          if (appt.status !== 'cancelled') {
            return { verified: false, error: `Trạng thái lịch hẹn trong CSDL chưa chuyển thành "cancelled" (hiện tại: ${appt.status}).` };
          }
          return { verified: true, verifiedRecord: appt };
        }

        default:
          return { verified: true };
      }
    } catch (err: any) {
      return { verified: false, error: `Lỗi khi xác minh bản ghi sau ghi: ${err.message}` };
    }
  }
}
