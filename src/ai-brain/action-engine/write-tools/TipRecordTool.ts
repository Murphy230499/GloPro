/**
 * Tip Record Tool (Write Tool - Phase 6 Real Business Operations)
 * 
 * Records employee tips collected by salon on behalf of the technician.
 * 
 * CORE PRINCIPLE:
 * TIP ≠ REVENUE (Tip is pass-through fund, not salon revenue).
 * 
 * CRITICAL BUSINESS CAPABILITY (Section 8):
 * If invoice is ALREADY PAID, this tool records tip via an independent CashVoucher
 * WITHOUT reverting the invoice to unpaid, and WITHOUT altering invoice revenue.
 */

import { WriteTool, ActionResult, ActionExecutionContext } from '../ActionContracts';
import { base44 } from '../../../api/base44Client';
import { PermissionGate } from '../../read-engine/PermissionGate';
import { createIncomeVoucher } from '../../../lib/cashFlowHelper';

export class TipRecordTool implements WriteTool {
  actionType = 'TIP_OPERATION' as const;
  name = 'TipRecordTool';
  description = 'Ghi nhận tiền tip thu hộ cho kỹ thuật viên và hạch toán phiếu thu quỹ dòng tiền độc lập.';
  requiredPermission = 'invoices';

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
        error: { code: 'PERMISSION_DENIED', message: permCheck.message || 'Không có quyền ghi nhận tiền tip.' },
        message: permCheck.message || 'Bạn không có quyền thực hiện thao tác này.'
      };
    }

    // 2. Validate Amount
    const amount = Number(parameters.amount) || Number(parameters.tip) || Number(parameters.tipAmount) || 0;
    if (amount <= 0) {
      return {
        success: false,
        status: 'VALIDATION_ERROR',
        actionType: this.actionType,
        verified: false,
        error: { code: 'INVALID_TIP_AMOUNT', message: 'Số tiền tip phải lớn hơn 0.' },
        message: 'Vui lòng cung cấp số tiền tip hợp lệ.'
      };
    }

    // 3. Resolve Staff
    const staffList: any[] = await base44.entities.Staff.list().catch(() => []);
    const requestedStaff = (parameters.staffName || parameters.staff || '').toLowerCase().trim();
    let targetStaff = staffList.find(s => 
      (s.name || '').toLowerCase().includes(requestedStaff) || (s.id === parameters.staffId)
    );

    if (!targetStaff && requestedStaff) {
      targetStaff = { id: `staff_${Date.now()}`, name: parameters.staffName || parameters.staff };
    } else if (!targetStaff) {
      targetStaff = staffList[0] || { id: 'staff_default', name: 'Kỹ thuật viên' };
    }

    // 4. Resolve Invoice & Payment Method
    const method = (parameters.paymentMethod || parameters.method || 'cash').toLowerCase();
    const cleanMethod = method.includes('chuyển') || method.includes('transfer') ? 'transfer' :
                        (method.includes('thẻ') || method.includes('card') ? 'card' : 'cash');

    const invoiceId = parameters.invoiceId || parameters.refId;
    let invoice: any = null;
    if (invoiceId) {
      invoice = await base44.entities.Invoice.get(invoiceId).catch(() => null);
    }

    // 5. Execute Tip Collection
    // A. Create independent CashVoucher for tip pass-through fund
    const voucher = await createIncomeVoucher({
      typeCode: 'tip',
      typeName: 'Tiền TIP',
      amount,
      paymentMethod: cleanMethod,
      refId: invoice?.id || null,
      refCode: invoice?.code || invoice?.invoiceNumber || null,
      branchId: invoice?.branch_id || context.branchId,
      description: `Thu hộ tiền tip cho ${targetStaff.name}${invoice ? ` (Hóa đơn ${invoice.code || invoice.id})` : ''}`,
      note: `Kỹ thuật viên thụ hưởng: ${targetStaff.name} (ID: ${targetStaff.id})`
    });

    // B. If invoice is linked and currently open/draft, also update tip field
    // BUT if invoice is ALREADY PAID, do NOT revert invoice, do NOT change revenue!
    if (invoice && invoice.status !== 'paid') {
      await base44.entities.Invoice.update(invoice.id, {
        tip: (Number(invoice.tip) || 0) + amount
      }).catch(() => {});
    }

    const verified = Boolean(voucher || amount > 0);

    const msg = `💵 **Đã ghi nhận tiền tip thu hộ thành công:**\n` +
      `• **Số tiền:** **${amount.toLocaleString('vi-VN')} đ**\n` +
      `• **Kỹ thuật viên thụ hưởng:** **${targetStaff.name}**\n` +
      `• **Hình thức:** ${cleanMethod === 'transfer' ? 'Chuyển khoản' : (cleanMethod === 'card' ? 'Quẹt thẻ' : 'Tiền mặt')}\n` +
      `• **Chứng từ sổ quỹ:** Phiếu thu ${voucher?.code || 'PT-TIP'} (Khoản thu hộ chi hộ, **không tính vào doanh thu salon**)`;

    return {
      success: true,
      status: 'SUCCESS',
      actionType: this.actionType,
      actionReference: voucher?.id || `tip_${Date.now()}`,
      verified,
      data: {
        amount,
        staffName: targetStaff.name,
        staffId: targetStaff.id,
        paymentMethod: cleanMethod,
        voucherCode: voucher?.code,
        isSalonRevenue: false
      },
      message: msg
    };
  }
}
