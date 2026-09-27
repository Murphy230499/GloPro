/**
 * Appointment Create Tool (Write Tool)
 * 
 * Safely creates a salon appointment via existing service abstraction (base44.entities.Appointment).
 * Enforces schedule conflict checks, validates permissions, and runs post-write verification.
 */

import { WriteTool, ActionResult, ActionExecutionContext } from '../ActionContracts';
import { base44 } from '../../../api/base44Client';
import { PermissionGate } from '../../read-engine/PermissionGate';
import { PostWriteVerification } from '../PostWriteVerification';
import { ActionPreconditionValidator } from '../ActionPreconditionValidator';

export class AppointmentCreateTool implements WriteTool {
  actionType = 'CREATE_APPOINTMENT' as const;
  name = 'AppointmentCreateTool';
  description = 'Đặt lịch hẹn mới cho khách hàng tại salon.';
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
        error: { code: 'PERMISSION_DENIED', message: permCheck.message || 'Không có quyền tạo lịch hẹn.' },
        message: permCheck.message || 'Bạn không có quyền thực hiện thao tác đặt lịch hẹn.'
      };
    }

    // 2. Precondition validation (Double booking conflict check & stale state)
    const valResult = await ActionPreconditionValidator.validateCreateAppointment(parameters);
    if (!valResult.valid) {
      return {
        success: false,
        status: valResult.status,
        actionType: this.actionType,
        verified: false,
        error: { code: valResult.status, message: valResult.message || 'Không thể tạo lịch hẹn.' },
        message: valResult.message || 'Không thể đặt lịch hẹn do vi phạm điều kiện tiền đề.'
      };
    }

    const resolved = valResult.resolvedData || {};

    let branchId = context.branchId || parameters.branchId || parameters.branch_id;
    if (!branchId) {
      const branches = await base44.entities.Branch.list().catch(() => []);
      const mainBranch = branches.find(b => b.id && b.id !== '00000000-0000-0000-0000-000000000000') || branches[0];
      branchId = mainBranch?.id;
    }

    // 3. Prepare payload for existing appointment adapter
    const payload = {
      customer_name: parameters.customerName || parameters.customer_name,
      customer_phone: parameters.customerPhone || parameters.customer_phone,
      service_name: resolved.serviceName || parameters.serviceName || parameters.service_name,
      staff_name: resolved.staffName || parameters.staffName || parameters.staff_name || 'Salon tự sắp xếp',
      branch_id: branchId,
      date: parameters.date,
      start_time: parameters.time || parameters.start_time,
      status: 'confirmed',
      note: parameters.note || 'Đặt qua EasySalon AI',
      created_at: new Date().toISOString()
    };

    // 4. Execute mutation
    let createdRecord: any;
    try {
      createdRecord = await base44.entities.Appointment.create(payload);
    } catch (err: any) {
      return {
        success: false,
        status: 'WRITE_FAILED',
        actionType: this.actionType,
        verified: false,
        error: { code: 'DB_INSERT_ERROR', message: err.message },
        message: `Lỗi khi lưu lịch hẹn vào cơ sở dữ liệu: ${err.message}`
      };
    }

    if (!createdRecord || !createdRecord.id) {
      return {
        success: false,
        status: 'UNKNOWN_RESULT',
        actionType: this.actionType,
        verified: false,
        error: { code: 'NO_RETURNED_ID', message: 'Backend không trả về ID lịch hẹn.' },
        message: 'Lệnh đặt lịch đã gửi nhưng chưa thể xác nhận trạng thái từ server.'
      };
    }

    // 5. Post-write verification (Read-back)
    const verification = await PostWriteVerification.verify('CREATE_APPOINTMENT', createdRecord.id, {
      date: payload.date,
      time: payload.start_time
    });

    if (!verification.verified) {
      return {
        success: false,
        status: 'VERIFICATION_FAILED',
        actionType: this.actionType,
        verified: false,
        error: { code: 'VERIFICATION_FAILED', message: verification.error || 'Xác minh lịch hẹn thất bại' },
        message: `Lịch hẹn có thể chưa được lưu chính xác: ${verification.error}`
      };
    }

    return {
      success: true,
      status: 'SUCCESS',
      actionType: this.actionType,
      data: verification.verifiedRecord || createdRecord,
      verified: true,
      message: `📅 **Đã đặt lịch hẹn thành công (Đã xác minh CSDL):**\n• **Khách hàng:** **${payload.customer_name}** (\`${payload.customer_phone}\`)\n• **Dịch vụ:** **${payload.service_name}**\n• **Thời gian:** **${payload.start_time}** ngày **${payload.date}**\n• **Nhân viên:** **${payload.staff_name}**\n• **Mã lịch hẹn:** \`${createdRecord.id}\``
    };
  }
}
