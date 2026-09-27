/**
 * Action Preview Generator
 * 
 * Creates structured preview cards strictly from backend verified data.
 * Does NOT rely on LLM text or unverified memory.
 */

import { ActionType, ActionPreviewData } from './ActionContracts';

export class ActionPreview {
  static createPreview(actionType: ActionType, params: Record<string, any>): ActionPreviewData {
    switch (actionType) {
      case 'CREATE_CUSTOMER': {
        return {
          action: 'CREATE_CUSTOMER',
          title: 'Tạo hồ sơ khách hàng mới',
          summary: `Chuẩn bị thêm khách hàng **${params.name}** vào hệ thống salon.`,
          items: [
            { label: 'Họ và tên', value: params.name },
            { label: 'Số điện thoại', value: params.phone },
            ...(params.email ? [{ label: 'Email', value: params.email }] : []),
            ...(params.birthday ? [{ label: 'Ngày sinh', value: params.birthday }] : []),
            ...(params.address ? [{ label: 'Địa chỉ', value: params.address }] : []),
            ...(params.gender ? [{ label: 'Giới tính', value: params.gender === 'male' ? 'Nam' : (params.gender === 'female' ? 'Nữ' : 'Khác') }] : []),
            ...(params.note ? [{ label: 'Ghi chú', value: params.note }] : [])
          ],
          statusText: 'Chờ xác nhận để lưu'
        };
      }

      case 'UPDATE_CUSTOMER': {
        const diffItems: ActionPreviewData['items'] = [];
        if (params.name && params.oldName) {
          diffItems.push({ label: 'Họ và tên', value: params.name, oldValue: params.oldName });
        }
        if (params.phone && params.oldPhone) {
          diffItems.push({ label: 'Số điện thoại', value: params.phone, oldValue: params.oldPhone });
        }
        if (params.address !== undefined && params.oldAddress !== undefined) {
          diffItems.push({ label: 'Địa chỉ', value: params.address || '(Để trống)', oldValue: params.oldAddress || '(Chưa có)' });
        }
        if (params.note !== undefined && params.oldNote !== undefined) {
          diffItems.push({ label: 'Ghi chú', value: params.note || '(Để trống)', oldValue: params.oldNote || '(Chưa có)' });
        }

        return {
          action: 'UPDATE_CUSTOMER',
          title: 'Cập nhật thông tin khách hàng',
          summary: `Chuẩn bị thay đổi thông tin của khách hàng **${params.oldName || params.name}**.`,
          items: diffItems.length > 0 ? diffItems : [{ label: 'Khách hàng', value: params.name || params.id }],
          statusText: 'Chờ xác nhận cập nhật'
        };
      }

      case 'CREATE_APPOINTMENT': {
        const priceFormatted = params.servicePrice ? `${Number(params.servicePrice).toLocaleString('vi-VN')} đ` : 'Theo giá dịch vụ';
        return {
          action: 'CREATE_APPOINTMENT',
          title: 'Đặt lịch hẹn làm đẹp',
          summary: `Chuẩn bị tạo lịch hẹn cho khách **${params.customerName}** vào lúc **${params.time}** ngày **${params.date}**.`,
          items: [
            { label: 'Khách hàng', value: `${params.customerName} (${params.customerPhone})` },
            { label: 'Dịch vụ', value: params.serviceName },
            { label: 'Nhân viên phụ trách', value: params.staffName || 'Salon tự sắp xếp' },
            { label: 'Thời gian hẹn', value: `${params.time} ngày ${params.date}` },
            { label: 'Thời lượng dự kiến', value: `${params.durationMinutes || 45} phút` },
            { label: 'Đơn giá dịch vụ', value: priceFormatted },
            ...(params.note ? [{ label: 'Ghi chú', value: params.note }] : [])
          ],
          warnings: params.warnings || [],
          statusText: 'Sẵn sàng đặt lịch'
        };
      }

      case 'CANCEL_APPOINTMENT': {
        return {
          action: 'CANCEL_APPOINTMENT',
          title: 'Hủy lịch hẹn của khách hàng',
          summary: `Chuẩn bị hủy lịch hẹn của khách **${params.customerName}** vào **${params.time || ''} ${params.date}**.`,
          items: [
            { label: 'Khách hàng', value: `${params.customerName} (${params.customerPhone})` },
            { label: 'Dịch vụ', value: params.serviceName || 'Dịch vụ làm đẹp' },
            { label: 'Thời gian', value: `${params.time || ''} ngày ${params.date}` },
            { label: 'Lý do hủy', value: params.reason || 'Khách yêu cầu hủy' }
          ],
          warnings: ['⚠️ Thao tác hủy lịch hẹn không thể hoàn tác sau khi xác nhận.'],
          statusText: 'Chờ xác nhận hủy'
        };
      }

      case 'CREATE_INVOICE': {
        const totalFmt = params.totalAmount ? `${Number(params.totalAmount).toLocaleString('vi-VN')} đ` : 'Chờ tính toán';
        return {
          action: 'CREATE_INVOICE',
          title: 'Tạo hóa đơn thanh toán',
          summary: `Chuẩn bị tạo hóa đơn mới cho khách hàng **${params.customerName}**.`,
          items: [
            { label: 'Khách hàng', value: params.customerName },
            ...(params.serviceName ? [{ label: 'Dịch vụ', value: params.serviceName }] : []),
            ...(params.productName ? [{ label: 'Sản phẩm', value: `${params.productName} (x${params.quantity || 1})` }] : []),
            { label: 'Tổng tiền thanh toán', value: totalFmt }
          ],
          statusText: 'Chờ xác nhận lập hóa đơn'
        };
      }

      case 'CHECKOUT_INVOICE': {
        const amountFmt = params.paidAmount ? `${Number(params.paidAmount).toLocaleString('vi-VN')} đ` : 'Toàn bộ';
        return {
          action: 'CHECKOUT_INVOICE',
          title: 'Thanh toán & Chốt hóa đơn',
          summary: `Chuẩn bị xác nhận thanh toán cho hóa đơn **${params.invoiceCode || params.invoiceId}**.`,
          items: [
            { label: 'Hóa đơn', value: params.invoiceCode || params.invoiceId },
            { label: 'Số tiền thanh toán', value: amountFmt },
            { label: 'Phương thức', value: params.paymentMethod === 'transfer' ? 'Chuyển khoản' : (params.paymentMethod === 'card' ? 'Quẹt thẻ' : 'Tiền mặt') },
            ...(params.tipAmount ? [{ label: 'Tiền tip kèm theo', value: `${Number(params.tipAmount).toLocaleString('vi-VN')} đ (tách chứng từ thu hộ)` }] : [])
          ],
          warnings: ['⚠️ Tiền sẽ được hạch toán vào sổ quỹ thu ngân sau khi xác nhận.'],
          statusText: 'Chờ xác nhận thanh toán'
        };
      }

      case 'TIP_OPERATION': {
        const amountFmt = `${Number(params.amount).toLocaleString('vi-VN')} đ`;
        return {
          action: 'TIP_OPERATION',
          title: 'Ghi nhận tiền tip thu hộ',
          summary: `Chuẩn bị thu hộ tiền tip **${amountFmt}** cho kỹ thuật viên **${params.staffName}**.`,
          items: [
            { label: 'Kỹ thuật viên thụ hưởng', value: params.staffName },
            { label: 'Số tiền tip', value: amountFmt },
            { label: 'Hình thức thu', value: params.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt' },
            { label: 'Bản chất hạch toán', value: 'Thu hộ chi hộ (KHÔNG tính vào doanh thu salon)' }
          ],
          statusText: 'Chờ xác nhận thu tip'
        };
      }

      case 'RECEIVE_STOCK':
      case 'ADJUST_STOCK': {
        return {
          action: 'RECEIVE_STOCK',
          title: 'Nhập kho & Cập nhật tồn kho',
          summary: `Chuẩn bị cập nhật số lượng tồn cho sản phẩm **${params.productName}**.`,
          items: [
            { label: 'Sản phẩm', value: params.productName },
            { label: 'Số lượng nhập thêm', value: `+${params.quantity || params.amount || 1}` },
            { label: 'Kho / Chi nhánh', value: params.branchName || 'Chi nhánh hiện tại' }
          ],
          statusText: 'Chờ xác nhận nhập kho'
        };
      }

      default: {
        return {
          action: actionType,
          title: 'Xác nhận thao tác',
          summary: 'Chuẩn bị thực thi thao tác trên phần mềm salon.',
          items: Object.entries(params).map(([k, v]) => ({ label: k, value: String(v) })),
          statusText: 'Chờ xác nhận'
        };
      }
    }
  }

  /**
   * Formats preview data into natural human-readable Vietnamese text for AI response
   */
  static formatTextSummary(preview: ActionPreviewData): string {
    let text = `📋 **XEM TRƯỚC THAO TÁC (${preview.title.toUpperCase()}):**\n\n`;
    preview.items.forEach(it => {
      if (it.oldValue !== undefined) {
        text += `• **${it.label}:** ~~${it.oldValue}~~ ➔ **${it.value}**\n`;
      } else {
        text += `• **${it.label}:** **${it.value}**\n`;
      }
    });

    if (preview.warnings && preview.warnings.length > 0) {
      text += `\n` + preview.warnings.map(w => `${w}`).join('\n') + `\n`;
    }

    text += `\n💬 *Bạn có xác nhận thực hiện thao tác này không?* (Trả lời **"Đồng ý"** để thực hiện hoặc **"Hủy"** để bỏ qua).`;
    return text;
  }
}
