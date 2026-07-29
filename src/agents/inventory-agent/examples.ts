/**
 * Comprehensive Example Conversations demonstrating all 8 Inventory Agent Tools
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

export const INVENTORY_AGENT_EXAMPLES: IToolExampleConversation[] = [
  // 1. Check Stock
  {
    toolName: 'inventory_check_stock',
    userPrompt: 'Kiểm tra tồn kho các loại dầu gội dưỡng sinh trong kho hiện tại',
    agentResponse: '📦 **Báo cáo Tồn kho Mỹ phẩm**:\n• **Dầu gội Keratin 500ml** (SKU: DG-01): Tồn kho **12 Chai** (Ngưỡng tối thiểu: 5)',
    executedToolCall: {
      name: 'inventory_check_stock',
      input: { query: 'dầu gội' },
      output: { success: true, itemsCount: 1 }
    }
  },

  // 2. Stock In
  {
    toolName: 'inventory_stock_in',
    userPrompt: 'Nhập kho 20 chai Dầu gội Keratin 500ml từ Nhà cung cấp Loreal',
    agentResponse: '📥 **Đã ghi nhận nhập kho thành công**: +20 Chai Dầu gội Keratin 500ml (Nhà cung cấp: Loreal).',
    executedToolCall: {
      name: 'inventory_stock_in',
      input: { productId: 'prod_1', quantity: 20, supplierName: 'Loreal' },
      output: { success: true, movementType: 'in' }
    }
  },

  // 3. Stock Out
  {
    toolName: 'inventory_stock_out',
    userPrompt: 'Xuất kho 2 tuýp Thuốc nhuộm Loreal Nâu Tây tiêu hao làm dịch vụ cho khách',
    agentResponse: '📤 **Đã trừ tồn kho tiêu hao dịch vụ**: -2 Tuýp Thuốc nhuộm Loreal Nâu Tây.',
    executedToolCall: {
      name: 'inventory_stock_out',
      input: { productId: 'prod_2', quantity: 2, reason: 'usage' },
      output: { success: true, movementType: 'out' }
    }
  },

  // 4. Manage Supplier
  {
    toolName: 'inventory_supplier',
    userPrompt: 'Thêm nhà cung cấp mới "Công ty Mỹ phẩm Loreal Việt Nam" SĐT 02838221199',
    agentResponse: '🏭 **Đã thêm hồ sơ Nhà cung cấp mới**: Công ty Mỹ phẩm Loreal Việt Nam (SĐT: 02838221199).',
    executedToolCall: {
      name: 'inventory_supplier',
      input: { action: 'create', name: 'Công ty Mỹ phẩm Loreal Việt Nam', phone: '02838221199' },
      output: { success: true }
    }
  },

  // 5. Manage Purchase Order (Money Action)
  {
    toolName: 'inventory_purchase_order',
    userPrompt: 'Tạo đơn đặt hàng PO nhập 50 tuýp Thuốc nhuộm từ NCC Loreal tổng tiền 4.500.000đ',
    agentResponse: '📋 **Đã tạo Đơn đặt hàng PO-901238** cho NCC Loreal (Tổng tiền: 4.500.000đ).\n⚠️ *Thao tác tài chính này đã được xác nhận phê duyệt*.',
    executedToolCall: {
      name: 'inventory_purchase_order',
      input: { action: 'create', supplierName: 'Loreal', items: [{ productName: 'Thuốc nhuộm', quantity: 50, unitPrice: 90000 }] },
      output: { success: true, orderNumber: 'PO-901238' }
    }
  },

  // 6. Check Expiry
  {
    toolName: 'inventory_expiry',
    userPrompt: 'Kiểm tra hóa chất & mỹ phẩm salon sắp hết hạn sử dụng trong vòng 60 ngày tới',
    agentResponse: '⏳ **Cảnh báo Hạn sử dụng**: Phát hiện **1 mặt hàng sắp hết hạn**:\n• **Thuốc Tẩy Tóc Blonder Loreal 500g**: Hạn sử dụng 15/08/2026 (Còn 4 hộp).',
    executedToolCall: {
      name: 'inventory_expiry',
      input: { daysThreshold: 60 },
      output: { success: true, expiringCount: 1 }
    }
  },

  // 7. Check Low Stock Alerts
  {
    toolName: 'inventory_low_stock_alerts',
    userPrompt: 'Hiển thị danh sách các sản phẩm đang chạm ngưỡng sắp hết kho',
    agentResponse: '🚨 **CẢNH BÁO MẶT HÀNG SẮP HẾT KHO**:\n• **Thuốc nhuộm Loreal Nâu Tây**: Chỉ còn **2 Tuýp** (Ngưỡng tối thiểu là 5 tuýp).',
    executedToolCall: {
      name: 'inventory_low_stock_alerts',
      input: {},
      output: { success: true, alertCount: 1 }
    }
  },

  // 8. Get Inventory Report
  {
    toolName: 'inventory_report',
    userPrompt: 'Xuất báo cáo tổng quan giá trị tài sản kho mỹ phẩm hiện tại',
    agentResponse: '📊 **Báo cáo Định giá Tồn kho Salon**:\n• **Tổng mã hàng (SKU)**: 45 loại\n• **Tổng số lượng tồn**: 320 đơn vị\n• **Tổng giá trị vốn kho**: **48.500.000đ**\n• **Tổng giá trị bán lẻ**: **82.000.000đ**',
    executedToolCall: {
      name: 'inventory_report',
      input: { timeframe: 'month' },
      output: { success: true, totalInventoryCostValue: 48500000 }
    }
  }
];
