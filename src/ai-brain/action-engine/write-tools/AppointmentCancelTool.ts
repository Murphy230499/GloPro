/**
 * Appointment Cancel Tool (Write Tool)
 * 
 * Safely cancels an existing appointment via existing service abstraction (base44.entities.Appointment).
 * Verifies cancellation status in database before declaring success.
 */

import { WriteTool, ActionResult, ActionExecutionContext } from '../ActionContracts';
import { base44 } from '../../../api/base44Client';
import { PermissionGate } from '../../read-engine/PermissionGate';
import { PostWriteVerification } from '../PostWriteVerification';
import { ActionPreconditionValidator } from '../ActionPreconditionValidator';

export class AppointmentCancelTool implements WriteTool {
  actionType = 'CANCEL_APPOINTMENT' as const;
  name = 'AppointmentCancelTool';
  description = 'Hủy lịch hẹn của khách hàng.';
  requiredPermission = 'appointments';

  async execute(parameters: Record<string, any>, context: ActionExecutionContext): Promise<ActionResult> {
    // 1. Permission check
    const permCheck = PermissionGate.check(this.name, this.requiredPermission, {
      userId: context.userId,
      role: context.role,
      permissions: context.permissions
    });

    if (!permCheck.allowed) {
      return {
        success: false,
        status: 'PERMISSION_DENIED',
        actionType: this.actionType,
        verified: false,
        error: { code: 'PERMISSION_DENIED', message: permCheck.message || 'Không có quyền hủy lịch hẹn.' },
        message: permCheck.message || 'Bạn không có quyền thực hiện thao tác hủy lịch hẹn.'
      };
    }

    // 2. Precondition validation
    const valResult = await ActionPreconditionValidator.validateCancelAppointment(parameters);
    if (!valResult.valid) {
      return {
        success: false,
        status: valResult.status,
        actionType: this.actionType,
        verified: false,
        error: { code: valResult.status, message: valResult.message || 'Không thể hủy lịch hẹn.' },
        message: valResult.message || 'Không thể hủy lịch hẹn.'
      };
    }

    const appointmentId = valResult.resolvedData?.appointmentId || parameters.appointmentId;
    const current = valResult.resolvedData?.appointment || (await base44.entities.Appointment.get(appointmentId).catch(() => null));

    if (!current) {
      return {
        success: false,
        status: 'NOT_FOUND',
        actionType: this.actionType,
        verified: false,
        error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Không tìm thấy lịch hẹn trong CSDL.' },
        message: 'Lịch hẹn không tồn tại trong hệ thống để hủy.'
      };
    }

    // 3. Execute cancellation mutation
    const updatePayload = {
      ...current,
      status: 'cancelled',
      note: (current.note || '') + ` (Đã hủy qua AI: ${parameters.reason || 'Khách yêu cầu'})`
    };

    let updatedRecord: any;
    try {
      updatedRecord = await base44.entities.Appointment.update(appointmentId, updatePayload);
    } catch (err: any) {
      return {
        success: false,
        status: 'WRITE_FAILED',
        actionType: this.actionType,
        verified: false,
        error: { code: 'DB_CANCEL_ERROR', message: err.message },
        message: `Lỗi khi cập nhật trạng thái hủy lịch: ${err.message}`
      };
    }

    // 4. Post-write verification (Read-back)
    const verification = await PostWriteVerification.verify('CANCEL_APPOINTMENT', appointmentId, {});
    if (!verification.verified) {
      return {
        success: false,
        status: 'VERIFICATION_FAILED',
        actionType: this.actionType,
        verified: false,
        error: { code: 'VERIFICATION_FAILED', message: verification.error || 'Xác minh hủy thất bại' },
        message: `Đã gửi lệnh hủy nhưng xác minh trạng thái CSDL thất bại: ${verification.error}`
      };
    }

    return {
      success: true,
      status: 'SUCCESS',
      actionType: this.actionType,
      data: verification.verifiedRecord || updatedRecord,
      verified: true,
      message: `✅ **Đã hủy lịch hẹn thành công (Đã xác minh CSDL):**\n• **Khách hàng:** **${current.customer_name}** (\`${current.customer_phone}\`)\n• **Thời gian:** ${current.start_time || ''} ngày ${current.date}\n• **Lý do hủy:** ${parameters.reason || 'Khách yêu cầu'}`
    };
  }
}
