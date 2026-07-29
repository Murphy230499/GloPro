/**
 * Comprehensive Example Conversations demonstrating all 11 Customer Agent Tools
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

export const CUSTOMER_AGENT_EXAMPLES: IToolExampleConversation[] = [
  // 1. Search Customer
  {
    toolName: 'customer_search',
    userPrompt: 'Tìm giúp tôi khách hàng tên Chị Lan hoặc SĐT 0912345678',
    agentResponse: '🔍 **Tìm thấy 1 kết quả khách hàng phù hợp**:\n• **Chị Lan** (SĐT: 0912345678 | Hạng: Vàng | Tích điểm: 450đ)',
    executedToolCall: {
      name: 'customer_search',
      input: { query: 'Chị Lan' },
      output: { success: true, count: 1 }
    }
  },

  // 2. Create Customer
  {
    toolName: 'customer_create',
    userPrompt: 'Tạo khách hàng mới Nguyễn Văn A SĐT 0987654321',
    agentResponse: '🎉 **Đã tạo thành công hồ sơ khách hàng mới**:\n• **Họ tên**: Nguyễn Văn A\n• **Số điện thoại**: 0987654321\n• **Hạng thẻ**: Đồng',
    executedToolCall: {
      name: 'customer_create',
      input: { name: 'Nguyễn Văn A', phone: '0987654321', tier: 'Đồng' },
      output: { success: true, id: 'cust_101' }
    }
  },

  // 3. Update Customer
  {
    toolName: 'customer_update',
    userPrompt: 'Cập nhật địa chỉ cho khách cust_101 thành 123 Nguyễn Trãi, Quận 1',
    agentResponse: '✅ **Đã cập nhật thành công địa chỉ mới** cho khách hàng cust_101.',
    executedToolCall: {
      name: 'customer_update',
      input: { customerId: 'cust_101', address: '123 Nguyễn Trãi, Quận 1' },
      output: { success: true }
    }
  },

  // 4. Delete Customer (High Risk)
  {
    toolName: 'customer_delete',
    userPrompt: 'Xóa hồ sơ khách hàng cust_999 do tạo nhầm trùng lặp',
    agentResponse: '⚠️ **Thao tác nguy cơ cao**: Yêu cầu xác nhận của quản lý trước khi xóa vĩnh viễn hồ sơ cust_999.',
    executedToolCall: {
      name: 'customer_delete',
      input: { customerId: 'cust_999', reason: 'Tạo nhầm trùng lặp' },
      output: { success: false, status: 'AWAITING_HUMAN_CONFIRMATION' }
    }
  },

  // 5. Merge Customers (Critical Risk)
  {
    toolName: 'customer_merge',
    userPrompt: 'Gộp hồ sơ khách phụ cust_202 vào hồ sơ chính cust_101',
    agentResponse: '⚠️ **Thao tác quan trọng**: Yêu cầu xác nhận phê duyệt để gộp toàn bộ lịch sử chi tiêu & điểm thưởng từ cust_202 sang cust_101.',
    executedToolCall: {
      name: 'customer_merge',
      input: { primaryCustomerId: 'cust_101', secondaryCustomerId: 'cust_202', mergePoints: true },
      output: { success: false, status: 'AWAITING_HUMAN_CONFIRMATION' }
    }
  },

  // 6. Customer History
  {
    toolName: 'customer_history',
    userPrompt: 'Cho tôi xem lịch sử đến làm dịch vụ của khách cust_101',
    agentResponse: '📜 **Lịch sử hoạt động của khách hàng cust_101**:\n• 15/07/2026: Gội đầu dưỡng sinh (HD00123 - 150.000đ)\n• 02/06/2026: Cắt uốn tạo kiểu (HD00098 - 450.000đ)',
    executedToolCall: {
      name: 'customer_history',
      input: { customerId: 'cust_101', limit: 5 },
      output: { success: true, appointmentsCount: 2 }
    }
  },

  // 7. Manage Membership Tier
  {
    toolName: 'customer_membership',
    userPrompt: 'Nâng hạng thẻ cho khách cust_101 lên hạng Kim Cương',
    agentResponse: '💎 **Đã nâng hạng thành công**: Khách hàng cust_101 hiện đã đạt **Hạng Kim Cương**!',
    executedToolCall: {
      name: 'customer_membership',
      input: { customerId: 'cust_101', newTier: 'Kim Cương' },
      output: { success: true, tier: 'Kim Cương' }
    }
  },

  // 8. Manage Loyalty Points
  {
    toolName: 'customer_loyalty_points',
    userPrompt: 'Cộng 100 điểm thưởng cho khách cust_101 lý do sinh nhật',
    agentResponse: '🎁 **Đã cộng 100 điểm thưởng** thành công cho khách hàng cust_101 (Lý do: Sinh nhật).',
    executedToolCall: {
      name: 'customer_loyalty_points',
      input: { customerId: 'cust_101', action: 'add', points: 100, reason: 'Sinh nhật' },
      output: { success: true, newTotalPoints: 550 }
    }
  },

  // 9. Manage Customer Notes
  {
    toolName: 'customer_notes',
    userPrompt: 'Thêm ghi chú "Khách dị ứng với thuốc nhuộm chứa Amoniac" cho khách cust_101',
    agentResponse: '📝 **Đã lưu ghi chú đặc biệt** vào hồ sơ khách hàng cust_101.',
    executedToolCall: {
      name: 'customer_notes',
      input: { customerId: 'cust_101', action: 'add', noteText: 'Khách dị ứng với thuốc nhuộm chứa Amoniac' },
      output: { success: true }
    }
  },

  // 10. Manage Customer Debt
  {
    toolName: 'customer_debt',
    userPrompt: 'Ghi nợ 200.000đ cho khách cust_101 dịch vụ mua thêm mỹ phẩm',
    agentResponse: '💰 **Đã ghi nhận công nợ**: Khách hàng cust_101 hiện nợ 200.000đ.',
    executedToolCall: {
      name: 'customer_debt',
      input: { customerId: 'cust_101', action: 'record_debt', amount: 200000, note: 'Mua thêm mỹ phẩm' },
      output: { success: true, currentDebt: 200000 }
    }
  },

  // 11. Customer Statistics
  {
    toolName: 'customer_statistics',
    userPrompt: 'Báo cáo thống kê tổng quan phân hạng khách hàng salon',
    agentResponse: '📊 **Thống kê Khách hàng**: Tổng số 120 khách hàng. Hạng Đồng (70), Bạc (30), Vàng (15), Kim Cương (5).',
    executedToolCall: {
      name: 'customer_statistics',
      input: { timeframe: 'all' },
      output: { success: true, totalCustomers: 120 }
    }
  }
];
