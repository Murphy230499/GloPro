/**
 * Comprehensive Example Conversations demonstrating all 10 Cashier Agent Tools
 */

export interface IToolExampleConversation {
  toolName: string;
  userPrompt: string;
  agentResponse: string;
  executedToolCall: {
    name: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  };
}

export const CASHIER_AGENT_EXAMPLES: IToolExampleConversation[] = [
  // 1. Create Invoice
  {
    toolName: 'cashier_create_invoice',
    userPrompt: 'Tạo hóa đơn tính tiền mới cho khách hàng Chị Lan SĐT 0912345678',
    agentResponse: '🧾 **Đã tạo hóa đơn thu ngân mới (Mã: INV-892301)** cho khách hàng Chị Lan.\n⚠️ *Hành động tài chính này đã được xác nhận bảo mật*.',
    executedToolCall: {
      name: 'cashier_create_invoice',
      input: { customerName: 'Chị Lan', customerPhone: '0912345678' },
      output: { success: true, invoiceNumber: 'INV-892301' }
    }
  },

  // 2. Add Service
  {
    toolName: 'cashier_add_service',
    userPrompt: 'Thêm dịch vụ "Cắt nhuộm tóc thời trang" giá 450.000đ vào hóa đơn INV-892301',
    agentResponse: '💇‍♀️ **Đã thêm dịch vụ**: Cắt nhuộm tóc thời trang (450.000đ) vào hóa đơn INV-892301.\n• **Tạm tính hiện tại**: 450.000đ',
    executedToolCall: {
      name: 'cashier_add_service',
      input: { invoiceId: 'INV-892301', serviceName: 'Cắt nhuộm tóc thời trang', unitPrice: 450000, quantity: 1 },
      output: { success: true, subtotal: 450000 }
    }
  },

  // 3. Add Product
  {
    toolName: 'cashier_add_product',
    userPrompt: 'Thêm sản phẩm Dầu gội xả Keratin 500ml giá 250.000đ vào hóa đơn INV-892301',
    agentResponse: '🧴 **Đã thêm sản phẩm**: Dầu gội xả Keratin 500ml (250.000đ).\n• **Tạm tính hóa đơn**: 700.000đ',
    executedToolCall: {
      name: 'cashier_add_product',
      input: { invoiceId: 'INV-892301', productName: 'Dầu gội xả Keratin 500ml', unitPrice: 250000, quantity: 1 },
      output: { success: true, subtotal: 700000 }
    }
  },

  // 4. Apply Discount
  {
    toolName: 'cashier_apply_discount',
    userPrompt: 'Giảm giá 10% cho hóa đơn INV-892301 chương trình tri ân khách hàng',
    agentResponse: '🏷️ **Đã áp dụng giảm giá 10%** (-70.000đ).\n• **Tổng tiền cần thanh toán**: 630.000đ',
    executedToolCall: {
      name: 'cashier_apply_discount',
      input: { invoiceId: 'INV-892301', discountType: 'percentage', discountValue: 10, reason: 'Tri ân khách hàng' },
      output: { success: true, discountAmount: 70000, totalAmount: 630000 }
    }
  },

  // 5. Apply Voucher
  {
    toolName: 'cashier_apply_voucher',
    userPrompt: 'Áp mã voucher GLOPROVIP vào hóa đơn INV-892301',
    agentResponse: '🎟️ **Đã kích hoạt Voucher GLOPROVIP** (-100.000đ).\n• **Tổng tiền cần thanh toán**: 530.000đ',
    executedToolCall: {
      name: 'cashier_apply_voucher',
      input: { invoiceId: 'INV-892301', voucherCode: 'GLOPROVIP' },
      output: { success: true, voucherDiscount: 100000, totalAmount: 530000 }
    }
  },

  // 6. Split Payment
  {
    toolName: 'cashier_split_payment',
    userPrompt: 'Chia hóa đơn INV-892301 thanh toán 300.000đ tiền mặt và 230.000đ chuyển khoản',
    agentResponse: '💳 **Đã phân chia phương thức thanh toán**:\n1. Tiền mặt: 300.000đ\n2. Chuyển khoản ngân hàng: 230.000đ\n• **Tổng đã thu**: 530.000đ (Đủ)',
    executedToolCall: {
      name: 'cashier_split_payment',
      input: {
        invoiceId: 'INV-892301',
        splits: [
          { method: 'cash', amount: 300000 },
          { method: 'transfer', amount: 230000 }
        ]
      },
      output: { success: true, paidAmount: 530000 }
    }
  },

  // 7. Multiple Payment Methods
  {
    toolName: 'cashier_multiple_payment_methods',
    userPrompt: 'Thanh toán hóa đơn INV-892301 kết hợp 50.000đ từ điểm thưởng và 480.000đ quẹt thẻ',
    agentResponse: '💳 **Đã ghi nhận đa phương thức thanh toán** (Tích điểm + Quẹt thẻ).',
    executedToolCall: {
      name: 'cashier_multiple_payment_methods',
      input: {
        invoiceId: 'INV-892301',
        payments: [
          { method: 'point', amount: 50000 },
          { method: 'card', amount: 480000, referenceNumber: 'POS99281' }
        ]
      },
      output: { success: true }
    }
  },

  // 8. Checkout
  {
    toolName: 'cashier_checkout',
    userPrompt: 'Xác nhận hoàn tất thanh toán và đóng hóa đơn INV-892301',
    agentResponse: '✅ **Thanh toán thành công & Khóa hóa đơn INV-892301**.\nTrạng thái chuyển sang: **Đã thanh toán (Paid)**.',
    executedToolCall: {
      name: 'cashier_checkout',
      input: { invoiceId: 'INV-892301', confirmPayment: true },
      output: { success: true, status: 'paid' }
    }
  },

  // 9. Refund (Critical Risk)
  {
    toolName: 'cashier_refund',
    userPrompt: 'Hoàn lại 100.000đ cho hóa đơn INV-892301 do khách hàng không dùng sản phẩm kèm theo',
    agentResponse: '🚨 **YÊU CẦU HOÀN TIỀN NGUY CƠ CAO**: Yêu cầu xác nhận phê duyệt cấp quản lý trước khi hoàn tiền 100.000đ vào tài khoản khách hàng.',
    executedToolCall: {
      name: 'cashier_refund',
      input: { invoiceId: 'INV-892301', refundAmount: 100000, reason: 'Không dùng sản phẩm kèm theo', refundMethod: 'transfer' },
      output: { success: false, status: 'AWAITING_HUMAN_CONFIRMATION' }
    }
  },

  // 10. Print Invoice
  {
    toolName: 'cashier_print_invoice',
    userPrompt: 'In hóa đơn tính tiền khổ 80mm cho khách hàng',
    agentResponse: '🖨️ **Đã gửi lệnh in thành công** tới máy in hóa đơn nhiệt POS 80mm.',
    executedToolCall: {
      name: 'cashier_print_invoice',
      input: { invoiceId: 'INV-892301', format: 'thermal_80mm' },
      output: { success: true }
    }
  }
];
