/**
 * Customer Create Tool (Write Tool)
 * 
 * Safely creates a new customer profile via existing service abstraction (base44.entities.Customer).
 * Validates permissions and executes post-write verification before declaring success.
 */

import { WriteTool, ActionResult, ActionExecutionContext } from '../ActionContracts';
import { base44 } from '../../../api/base44Client';
import { PermissionGate } from '../../read-engine/PermissionGate';
import { PostWriteVerification } from '../PostWriteVerification';
import { ActionPreconditionValidator } from '../ActionPreconditionValidator';

export class CustomerCreateTool implements WriteTool {
  actionType = 'CREATE_CUSTOMER' as const;
  name = 'CustomerCreateTool';
  description = 'Tạo hồ sơ khách hàng mới vào cơ sở dữ liệu salon.';
  requiredPermission = 'customers';

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
        error: { code: 'PERMISSION_DENIED', message: permCheck.message || 'Không có quyền tạo khách hàng.' },
        message: permCheck.message || 'Bạn không có quyền thực hiện thao tác tạo khách hàng.'
      };
    }

    // 2. Precondition validation
    const valResult = await ActionPreconditionValidator.validateCreateCustomer(parameters);
    if (!valResult.valid) {
      return {
        success: false,
        status: valResult.status,
        actionType: this.actionType,
        verified: false,
        error: { code: valResult.status, message: valResult.message || 'Dữ liệu không hợp lệ.' },
        message: valResult.message || 'Không thể tạo khách hàng do dữ liệu không hợp lệ.'
      };
    }

    // 3. Prepare clean payload
    const rawGender = (parameters.gender || '').toLowerCase();
    const cleanGender = rawGender.includes('nam') ? 'male' : (rawGender.includes('nữ') ? 'female' : 'other');

    const payload = {
      name: parameters.name.trim(),
      phone: parameters.phone.replace(/\s+/g, ''),
      email: parameters.email || null,
      address: parameters.address || null,
      gender: cleanGender,
      birthday: parameters.birthday || parameters.birth_date || null,
      note: parameters.note || 'Tạo qua EasySalon AI',
      points: 0,
      total_spent: 0,
      visit_count: 0
    };

    // 4. Execute mutation
    let createdRecord: any;
    try {
      createdRecord = await base44.entities.Customer.create(payload);
    } catch (err: any) {
      return {
        success: false,
        status: 'WRITE_FAILED',
        actionType: this.actionType,
        verified: false,
        error: { code: 'DB_INSERT_ERROR', message: err.message },
        message: `Lỗi khi lưu khách hàng vào cơ sở dữ liệu: ${err.message}`
      };
    }

    if (!createdRecord || !createdRecord.id) {
      return {
        success: false,
        status: 'UNKNOWN_RESULT',
        actionType: this.actionType,
        verified: false,
        error: { code: 'NO_RETURNED_ID', message: 'Backend không trả về ID khách hàng sau khi tạo.' },
        message: 'Yêu cầu đã được gửi nhưng trạng thái lưu dữ liệu chưa thể xác nhận. Vui lòng kiểm tra lại.'
      };
    }

    // 5. Post-write verification (Read-back)
    const verification = await PostWriteVerification.verify('CREATE_CUSTOMER', createdRecord.id, payload);
    if (!verification.verified) {
      return {
        success: false,
        status: 'VERIFICATION_FAILED',
        actionType: this.actionType,
        verified: false,
        error: { code: 'VERIFICATION_FAILED', message: verification.error || 'Xác minh thất bại' },
        message: `Đã gửi lệnh tạo nhưng không thể xác minh bản ghi trong hệ thống: ${verification.error}`
      };
    }

    return {
      success: true,
      status: 'SUCCESS',
      actionType: this.actionType,
      data: verification.verifiedRecord || createdRecord,
      verified: true,
      message: `👤 **Đã tạo thành công hồ sơ khách hàng mới (Đã xác minh CSDL):**\n• **Họ và tên:** **${payload.name}**\n• **Số điện thoại:** \`${payload.phone}\`\n• **Mã khách hàng:** \`${createdRecord.id}\``
    };
  }
}
