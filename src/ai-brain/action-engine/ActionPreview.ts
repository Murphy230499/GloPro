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

      case 'CREATE_PRODUCT': {
        const priceFmt = `${Number(params.price || 0).toLocaleString('vi-VN')} đ`;
        const costFmt = params.cost_price ? `${Number(params.cost_price).toLocaleString('vi-VN')} đ` : 'Tự động tính theo tỷ lệ vốn';
        return {
          action: 'CREATE_PRODUCT',
          title: 'Thêm sản phẩm mới vào kho',
          summary: `Chuẩn bị thêm sản phẩm **${params.name}** vào danh mục hàng hóa.`,
          items: [
            { label: 'Tên sản phẩm', value: params.name },
            { label: 'Giá bán lẻ', value: priceFmt },
            { label: 'Giá nhập / Giá vốn', value: costFmt },
            { label: 'Số lượng tồn ban đầu', value: `${params.stock || 20} sản phẩm` },
            { label: 'Danh mục', value: params.category || 'Mỹ phẩm' }
          ],
          statusText: 'Chờ xác nhận tạo sản phẩm'
        };
      }

      case 'CREATE_SERVICE': {
        const priceFmt = `${Number(params.price || 0).toLocaleString('vi-VN')} đ`;
        return {
          action: 'CREATE_SERVICE',
          title: 'Tạo dịch vụ làm đẹp mới',
          summary: `Chuẩn bị thêm dịch vụ **${params.name}** vào bảng giá salon.`,
          items: [
            { label: 'Tên dịch vụ', value: params.name },
            { label: 'Giá niêm yết', value: priceFmt },
            { label: 'Thời lượng thực hiện', value: `${params.duration_minutes || 45} phút` },
            { label: 'Danh mục', value: params.category || 'Dịch vụ Salon' }
          ],
          statusText: 'Chờ xác nhận tạo dịch vụ'
        };
      }

      case 'CREATE_STAFF': {
        return {
          action: 'CREATE_STAFF',
          title: 'Thêm nhân viên mới',
          summary: `Chuẩn bị tạo hồ sơ nhân viên cho **${params.name}**.`,
          items: [
            { label: 'Họ tên nhân viên', value: params.name },
            { label: 'Số điện thoại', value: params.phone || 'Chưa cập nhật' },
            { label: 'Vị trí / Chức danh', value: params.role || 'Thợ chính' }
          ],
          statusText: 'Chờ xác nhận thêm nhân viên'
        };
      }

      case 'SET_STAFF_COMMISSION': {
        const staffLabel = (params.staff_name === 'all' || !params.staff_name) ? 'Tất cả nhân viên' : params.staff_name;
        const itemLabel = (params.item_name === 'all' || !params.item_name) ? 'Tất cả dịch vụ/sản phẩm' : params.item_name;
        const valFmt = params.commission_type === 'percent'
          ? `${params.commission_value}% doanh thu`
          : `${Number(params.commission_value || 0).toLocaleString('vi-VN')} đ / lần phục vụ`;

        return {
          action: 'SET_STAFF_COMMISSION',
          title: 'Cài đặt hoa hồng nhân viên',
          summary: `Chuẩn bị thiết lập mức hoa hồng **${valFmt}** cho **${staffLabel}**.`,
          items: [
            { label: 'Nhân viên áp dụng', value: staffLabel },
            { label: 'Dịch vụ / Sản phẩm', value: itemLabel },
            { label: 'Mức hoa hồng', value: valFmt },
            { label: 'Quy cách tính', value: params.commission_type === 'percent' ? 'Tính theo % doanh thu hoá đơn' : 'Cố định mỗi lượt phục vụ' }
          ],
          statusText: 'Chờ xác nhận cài hoa hồng'
        };
      }

      case 'CREATE_VOUCHER': {
        const valFmt = params.discount_type === 'percent'
          ? `Giảm ${params.discount_value}%`
          : `Giảm ${Number(params.discount_value || 0).toLocaleString('vi-VN')} đ`;

        return {
          action: 'CREATE_VOUCHER',
          title: 'Tạo mã Voucher / Khuyến mãi mới',
          summary: `Chuẩn bị phát hành mã giảm giá **${params.code}**.`,
          items: [
            { label: 'Mã Voucher', value: params.code },
            { label: 'Mức giảm giá', value: valFmt },
            ...(params.min_spend ? [{ label: 'Đơn hàng tối thiểu', value: `${Number(params.min_spend).toLocaleString('vi-VN')} đ` }] : []),
            { label: 'Chương trình', value: params.title || `Voucher ${params.code}` }
          ],
          statusText: 'Chờ xác nhận phát hành voucher'
        };
      }

      case 'CREATE_CASH_INCOME': {
        const amountFmt = `${Number(params.amount || 0).toLocaleString('vi-VN')} đ`;
        return {
          action: 'CREATE_CASH_INCOME',
          title: 'Lập Phiếu Thu tiền vào Sổ quỹ',
          summary: `Chuẩn bị ghi nhận phiếu thu **${amountFmt}** vào quỹ salon.`,
          items: [
            { label: 'Số tiền thu', value: amountFmt },
            { label: 'Khoản thu', value: params.type_name || 'Thu tiền bán hàng / dịch vụ' },
            { label: 'Người nộp tiền', value: params.payer_name || 'Khách hàng' },
            { label: 'Hình thức', value: params.payment_method === 'transfer' ? 'Chuyển khoản / Quét QR' : 'Tiền mặt' },
            ...(params.note ? [{ label: 'Ghi chú', value: params.note }] : [])
          ],
          warnings: ['⚠️ Tiền sẽ được cộng trực tiếp vào số dư Sổ quỹ sau khi xác nhận.'],
          statusText: 'Chờ xác nhận lập phiếu thu'
        };
      }

      case 'CREATE_CASH_EXPENSE': {
        const amountFmt = `${Number(params.amount || 0).toLocaleString('vi-VN')} đ`;
        return {
          action: 'CREATE_CASH_EXPENSE',
          title: 'Lập Phiếu Chi tiền từ Sổ quỹ',
          summary: `Chuẩn bị chi xuất **${amountFmt}** từ quỹ salon.`,
          items: [
            { label: 'Số tiền chi', value: amountFmt },
            { label: 'Khoản chi / Mục đích', value: params.type_name || 'Chi phí hoạt động' },
            { label: 'Người nhận tiền', value: params.receiver_name || 'Nhân viên / Nhà cung cấp' },
            { label: 'Hình thức chi', value: params.payment_method === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt' },
            ...(params.note ? [{ label: 'Ghi chú', value: params.note }] : [])
          ],
          warnings: ['⚠️ Tiền sẽ được trừ trực tiếp khỏi số dư Sổ quỹ sau khi xác nhận.'],
          statusText: 'Chờ xác nhận lập phiếu chi'
        };
      }

      case 'CREATE_STOCK_RECEIPT': {
        const totalFmt = `${Number(params.total_amount || 0).toLocaleString('vi-VN')} đ`;
        return {
          action: 'CREATE_STOCK_RECEIPT',
          title: 'Lập Phiếu Nhập kho hàng hóa',
          summary: `Chuẩn bị nhập lô hàng trị giá **${totalFmt}** vào kho salon.`,
          items: [
            { label: 'Nhà cung cấp', value: params.supplier_name || 'Nhà cung cấp' },
            { label: 'Sản phẩm nhập', value: params.items_summary || `${params.items?.length || 1} mặt hàng` },
            { label: 'Tổng giá trị nhập', value: totalFmt },
            { label: 'Thanh toán ngay', value: `${Number(params.paid_amount || 0).toLocaleString('vi-VN')} đ` },
            { label: 'Công nợ còn lại', value: `${Math.max(0, Number(params.total_amount || 0) - Number(params.paid_amount || 0)).toLocaleString('vi-VN')} đ` }
          ],
          warnings: ['⚠️ Số lượng tồn kho các mặt hàng sẽ được tự động cộng thêm sau khi xác nhận.'],
          statusText: 'Chờ xác nhận nhập kho'
        };
      }

      case 'CREATE_SUPPLIER': {
        return {
          action: 'CREATE_SUPPLIER',
          title: 'Thêm Nhà cung cấp mới',
          summary: `Chuẩn bị lưu thông tin đối tác **${params.name}**.`,
          items: [
            { label: 'Tên nhà cung cấp', value: params.name },
            { label: 'Số điện thoại', value: params.phone || 'Chưa cập nhật' },
            { label: 'Địa chỉ', value: params.address || 'Chưa cập nhật' },
            ...(params.tax_code ? [{ label: 'Mã số thuế', value: params.tax_code }] : [])
          ],
          statusText: 'Chờ xác nhận lưu nhà cung cấp'
        };
      }

      case 'CREATE_SHIFT': {
        const shiftMap = { morning: 'Ca Sáng (08:00 - 14:00)', afternoon: 'Ca Chiều (13:30 - 18:30)', evening: 'Ca Tối (18:00 - 22:00)', full_day: 'Ca Cả Ngày' };
        return {
          action: 'CREATE_SHIFT',
          title: 'Xếp ca làm việc nhân viên',
          summary: `Chuẩn bị xếp ca cho nhân viên **${params.staff_name}**.`,
          items: [
            { label: 'Nhân viên', value: params.staff_name },
            { label: 'Ngày làm việc', value: params.date || 'Hôm nay' },
            { label: 'Ca làm việc', value: shiftMap[params.shift_type] || params.shift_type || 'Ca Cả Ngày' }
          ],
          statusText: 'Chờ xác nhận xếp ca'
        };
      }

      case 'CREATE_ROOM': {
        return {
          action: 'CREATE_ROOM',
          title: 'Thêm Phòng / Khu vực mới',
          summary: `Chuẩn bị thêm khu vực **${params.name}** vào salon.`,
          items: [
            { label: 'Tên phòng', value: params.name },
            { label: 'Phân loại', value: params.type || 'Phòng làm đẹp chung' },
            { label: 'Sức chứa', value: `${params.capacity || 4} chỗ/giường` }
          ],
          statusText: 'Chờ xác nhận thêm phòng'
        };
      }

      case 'CREATE_BED': {
        return {
          action: 'CREATE_BED',
          title: 'Thêm Giường / Ghế phục vụ',
          summary: `Chuẩn bị thêm vị trí **${params.name}** vào hệ thống.`,
          items: [
            { label: 'Tên ghế / giường', value: params.name },
            { label: 'Thuộc phòng', value: params.room_name || 'Khu vực chính' },
            { label: 'Trạng thái ban đầu', value: 'Sẵn sàng phục vụ' }
          ],
          statusText: 'Chờ xác nhận thêm ghế/giường'
        };
      }

      case 'CREATE_PROMOTION': {
        const valFmt = params.value_type === 'percent'
          ? `Giảm ${params.value}%`
          : `Giảm ${Number(params.value || 0).toLocaleString('vi-VN')} đ`;
        return {
          action: 'CREATE_PROMOTION',
          title: 'Tạo Chương trình Khuyến mãi (CTKM)',
          summary: `Chuẩn bị tạo chương trình **${params.name}**.`,
          items: [
            { label: 'Tên chương trình', value: params.name },
            { label: 'Mức ưu đãi', value: valFmt },
            ...(params.min_spend ? [{ label: 'Đơn hàng tối thiểu', value: `${Number(params.min_spend).toLocaleString('vi-VN')} đ` }] : []),
            ...(params.expiry_date ? [{ label: 'Hạn áp dụng', value: params.expiry_date }] : []),
            { label: 'Phạm vi', value: params.scope === 'service' ? 'Chỉ áp dụng dịch vụ' : (params.scope === 'product' ? 'Chỉ áp dụng sản phẩm' : 'Toàn bộ hóa đơn') }
          ],
          statusText: 'Chờ xác nhận tạo CTKM'
        };
      }

      case 'CREATE_DEPOSIT': {
        const payMethodLabel = params.payment_method === 'transfer' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt';
        return {
          action: 'CREATE_DEPOSIT',
          title: 'Nạp tiền cọc / Thẻ tài khoản khách',
          summary: `Chuẩn bị ghi nhận nạp **${Number(params.amount || 0).toLocaleString('vi-VN')} đ** cho khách hàng **${params.customer_name}**.`,
          items: [
            { label: 'Khách hàng', value: params.customer_name },
            { label: 'Số tiền nạp', value: `${Number(params.amount || 0).toLocaleString('vi-VN')} đ` },
            { label: 'Phương thức', value: payMethodLabel },
            { label: 'Ghi chú', value: params.note || 'Nạp tiền cọc / tài khoản' }
          ],
          statusText: 'Chờ xác nhận nạp tiền cọc'
        };
      }

      case 'CREATE_STOCK_OUT': {
        const reasonMap = {
          consumption: 'Tiêu hao dịch vụ / Sử dụng nội bộ',
          damage: 'Xuất hủy do hư hỏng / hết date',
          other: 'Xuất kho khác'
        };
        return {
          action: 'CREATE_STOCK_OUT',
          title: 'Lập phiếu Xuất kho / Tiêu hao',
          summary: `Chuẩn bị xuất **${params.quantity} ${params.unit || 'sản phẩm'}** **${params.product_name}**.`,
          items: [
            { label: 'Mặt hàng xuất', value: params.product_name },
            { label: 'Số lượng xuất', value: `${params.quantity} ${params.unit || 'sp'}` },
            { label: 'Lý do xuất', value: reasonMap[params.reason] || params.reason || 'Tiêu hao nội bộ' },
            { label: 'Tác động tồn kho', value: `Trừ ${params.quantity} vào kho thực tế` }
          ],
          statusText: 'Chờ xác nhận xuất kho'
        };
      }

      case 'CREATE_SERVICE_PACKAGE': {
        return {
          action: 'CREATE_SERVICE_PACKAGE',
          title: 'Tạo Gói Dịch vụ mới',
          summary: `Chuẩn bị tạo gói dịch vụ **${params.name}**.`,
          items: [
            { label: 'Tên gói dịch vụ', value: params.name },
            { label: 'Giá bán', value: `${Number(params.price || 0).toLocaleString('vi-VN')} đ` },
            { label: 'Số lần sử dụng', value: `${params.usage_count || 1} buổi / lượt` },
            { label: 'Trạng thái', value: 'Sẵn sàng bán tại POS' }
          ],
          statusText: 'Chờ xác nhận tạo gói'
        };
      }

      case 'CREATE_TREATMENT': {
        return {
          action: 'CREATE_TREATMENT',
          title: 'Tạo Liệu trình mới',
          summary: `Chuẩn bị tạo liệu trình **${params.name}**.`,
          items: [
            { label: 'Tên liệu trình', value: params.name },
            { label: 'Giá trọn gói', value: `${Number(params.price || 0).toLocaleString('vi-VN')} đ` },
            { label: 'Tổng số buổi', value: `${params.total_sessions || 1} buổi` },
            { label: 'Mô tả', value: params.description || 'Liệu trình chăm sóc chuyên sâu' }
          ],
          statusText: 'Chờ xác nhận tạo liệu trình'
        };
      }

      case 'CREATE_SERVICE_COMBO': {
        return {
          action: 'CREATE_SERVICE_COMBO',
          title: 'Tạo Combo Dịch vụ mới',
          summary: `Chuẩn bị tạo combo dịch vụ **${params.name}**.`,
          items: [
            { label: 'Tên combo', value: params.name },
            { label: 'Giá combo ưu đãi', value: `${Number(params.combo_price || params.price || 0).toLocaleString('vi-VN')} đ` },
            { label: 'Mô tả ưu đãi', value: params.description || 'Gói combo tiết kiệm dịch vụ' }
          ],
          statusText: 'Chờ xác nhận tạo combo dịch vụ'
        };
      }

      case 'CREATE_PRODUCT_COMBO': {
        return {
          action: 'CREATE_PRODUCT_COMBO',
          title: 'Tạo Combo Sản phẩm mới',
          summary: `Chuẩn bị tạo combo sản phẩm **${params.name}**.`,
          items: [
            { label: 'Tên combo sản phẩm', value: params.name },
            { label: 'Giá combo', value: `${Number(params.combo_price || params.price || 0).toLocaleString('vi-VN')} đ` },
            { label: 'Mô tả sản phẩm', value: params.description || 'Bộ đôi / Bộ ba sản phẩm ưu đãi' }
          ],
          statusText: 'Chờ xác nhận tạo combo sản phẩm'
        };
      }

      case 'CREATE_PREPAID_CARD': {
        return {
          action: 'CREATE_PREPAID_CARD',
          title: 'Tạo Thẻ Tiền Mặt (Prepaid Card) mới',
          summary: `Chuẩn bị phát hành loại thẻ **${params.name}**.`,
          items: [
            { label: 'Tên thẻ tiền mặt', value: params.name },
            { label: 'Mệnh giá trong thẻ', value: `${Number(params.face_value || 0).toLocaleString('vi-VN')} đ` },
            { label: 'Giá bán thực tế', value: `${Number(params.selling_price || 0).toLocaleString('vi-VN')} đ` },
            { label: 'Mã phôi thẻ', value: params.card_code || 'Tự động tạo' },
            { label: 'Thời hạn', value: params.expiry_months ? `${params.expiry_months} tháng` : 'Vô thời hạn' }
          ],
          statusText: 'Chờ xác nhận phát hành thẻ tiền mặt'
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
    let text = `📋 XEM TRƯỚC THAO TÁC (${preview.title.toUpperCase()}):\n\n`;
    preview.items.forEach(it => {
      if (it.oldValue !== undefined) {
        text += `• ${it.label}: ${it.oldValue} ➔ ${it.value}\n`;
      } else {
        text += `• ${it.label}: ${it.value}\n`;
      }
    });

    if (preview.warnings && preview.warnings.length > 0) {
      text += `\n` + preview.warnings.map(w => `${w}`).join('\n') + `\n`;
    }

    text += `\n💬 Bạn có xác nhận thực hiện thao tác này không? (Trả lời "Đồng ý" để thực hiện hoặc "Hủy" để bỏ qua).`;
    return text;
  }
}
