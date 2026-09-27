/**
 * Customer Update Tool (Write Tool)
 * 
 * Safely updates an existing customer profile.
 * Executes pre-condition checks, updates via existing abstraction, and verifies changes.
 */

import { WriteTool, ActionResult, ActionExecutionContext } from '../ActionContracts';
import { base44 } from '../../../api/base44Client';
import { PermissionGate } from '../../read-engine/PermissionGate';
import { PostWriteVerification } from '../PostWriteVerification';
import { ActionPreconditionValidator } from '../ActionPreconditionValidator';

export class CustomerUpdateTool implements WriteTool {
  actionType = 'UPDATE_CUSTOMER' as const;
  name = 'CustomerUpdateTool';
  description = 'Cập nhật thông tin khách hàng hiện có trong salon.';
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
        error: { code: 'PERMISSION_DENIED', message: permCheck.message || 'Không có quyền sửa khách hàng.' },
        message: permCheck.message || 'Bạn không có quyền thực hiện thao tác cập nhật khách hàng.'
      };
    }

    // 2. Precondition validation
    const valResult = await ActionPreconditionValidator.validateUpdateCustomer(parameters);
    if (!valResult.valid) {
      return {
        success: false,
        status: valResult.status,
        actionType: this.actionType,
        verified: false,
        error: { code: valResult.status, message: valResult.message || 'Dữ liệu không hợp lệ.' },
        message: valResult.message || 'Không thể cập nhật khách hàng.'
      };
    }

    const customerId = valResult.resolvedData?.customerId || parameters.id;
    const current = valResult.resolvedData?.currentRecord || (await base44.entities.Customer.get(customerId).catch(() => null));

    if (!current) {
      return {
        success: false,
        status: 'NOT_FOUND',
        actionType: this.actionType,
        verified: false,
        error: { code: 'CUSTOMER_NOT_FOUND', message: 'Không tìm thấy khách hàng để cập nhật.' },
        message: 'Khách hàng không còn tồn tại trong hệ thống.'
      };
    }

    // 3. Build update payload
    const updatePayload: Record<string, any> = { ...current };
    const expectedValues: Record<string, any> = {};

    if (parameters.name && parameters.name !== current.name) {
      updatePayload.name = parameters.name.trim();
      expectedValues.name = updatePayload.name;
    }
    if (parameters.phone && parameters.phone.replace(/\s+/g, '') !== (current.phone || '').replace(/\s+/g, '')) {
      updatePayload.phone = parameters.phone.replace(/\s+/g, '');
      expectedValues.phone = updatePayload.phone;
    }
    if (parameters.address !== undefined) {
      updatePayload.address = parameters.address;
    }
    if (parameters.note !== undefined) {
      updatePayload.note = parameters.note;
    }

    // 4. Execute mutation
    let updatedRecord: any;
    try {
      updatedRecord = await base44.entities.Customer.update(customerId, updatePayload);
    } catch (err: any) {
      return {
        success: false,
        status: 'WRITE_FAILED',
        actionType: this.actionType,
        verified: false,
        error: { code: 'DB_UPDATE_ERROR', message: err.message },
        message: `Lỗi khi cập nhật khách hàng: ${err.message}`
      };
    }

    // 5. Post-write verification
    const verification = await PostWriteVerification.verify('UPDATE_CUSTOMER', customerId, expectedValues);
    if (!verification.verified) {
      return {
        success: false,
        status: 'VERIFICATION_FAILED',
        actionType: this.actionType,
        verified: false,
        error: { code: 'VERIFICATION_FAILED', message: verification.error || 'Xác minh cập nhật thất bại' },
        message: `Đã gửi lệnh cập nhật nhưng xác minh CSDL thất bại: ${verification.error}`
      };
    }

    return {
      success: true,
      status: 'SUCCESS',
      actionType: this.actionType,
      data: verification.verifiedRecord || updatedRecord,
      verified: true,
      message: `✅ **Đã cập nhật thông tin khách hàng thành công (Đã xác minh CSDL):**\n• **Khách hàng:** **${updatePayload.name || current.name}**\n• **SĐT mới:** \`${updatePayload.phone || current.phone}\``
    };
  }
}
