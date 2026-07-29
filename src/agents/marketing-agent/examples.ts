/**
 * Comprehensive Example Conversations demonstrating all 8 Marketing Agent Tools
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

export const MARKETING_AGENT_EXAMPLES: IToolExampleConversation[] = [
  // 1. Customer Segmentation
  {
    toolName: 'marketing_segmentation',
    userPrompt: 'Phân tích tập khách hàng VIP chi tiêu trên 5 triệu đồng tại salon',
    agentResponse: '🎯 **Kết quả Phân khúc Khách hàng**: Tìm thấy **18 khách hàng VIP** (Chi tiêu tích lũy >= 5.000.000đ).',
    executedToolCall: {
      name: 'marketing_segmentation',
      input: { segmentType: 'vip', minSpent: 5000000 },
      output: { success: true, customerCount: 18 }
    }
  },

  // 2. SMS Broadcast
  {
    toolName: 'marketing_send_sms',
    userPrompt: 'Gửi SMS Brandname "GLOPRO_SALON" thông báo khuyến mãi cho 18 khách VIP',
    agentResponse: '📲 **Đã phát tin nhắn SMS Brandname thành công** tới 18 khách hàng VIP.',
    executedToolCall: {
      name: 'marketing_send_sms',
      input: { recipientPhones: ['0912345678'], message: 'GLOPRO Tri an khach VIP giam 20% tuan nay', brandname: 'GLOPRO_SALON' },
      output: { success: true, sentCount: 18 }
    }
  },

  // 3. Email Campaign
  {
    toolName: 'marketing_send_email',
    userPrompt: 'Gửi Email Newsletter tháng 7 giới thiệu dịch vụ Gội đầu dưỡng sinh cao cấp',
    agentResponse: '📧 **Đã gửi chiến dịch Email Marketing thành công** tới danh sách 45 khách hàng.',
    executedToolCall: {
      name: 'marketing_send_email',
      input: { recipientEmails: ['khach1@gmail.com'], subject: 'Trải nghiệm Gội đầu dưỡng sinh cao cấp tại GloPro Salon', bodyContent: '<html>...</html>' },
      output: { success: true, sentCount: 45 }
    }
  },

  // 4. Zalo Notification (ZNS)
  {
    toolName: 'marketing_send_zalo',
    userPrompt: 'Gửi tin nhắn Zalo ZNS mã template ZNS_BDAY cho khách hàng có sinh nhật',
    agentResponse: '💬 **Đã truyền gửi tin nhắn Zalo ZNS thành công** qua Zalo Official Account.',
    executedToolCall: {
      name: 'marketing_send_zalo',
      input: { recipientPhones: ['0912345678'], templateId: 'ZNS_BDAY', templateData: { customer_name: 'Chị Lan' } },
      output: { success: true, deliveredCount: 1 }
    }
  },

  // 5. Issue Voucher (Money Action)
  {
    toolName: 'marketing_issue_voucher',
    userPrompt: 'Phát hành mã voucher VIP2026 giảm 100.000đ áp dụng tới ngày 31/08/2026',
    agentResponse: '🎟️ **Đã phát hành Mã Voucher VIP2026** (Giảm 100.000đ, Hạn dùng: 31/08/2026).\n⚠️ *Thao tác phát hành ưu đãi tài chính này đã được xác nhận bảo mật*.',
    executedToolCall: {
      name: 'marketing_issue_voucher',
      input: { code: 'VIP2026', discountType: 'fixed', discountValue: 100000, expiryDate: '2026-08-31' },
      output: { success: true, code: 'VIP2026' }
    }
  },

  // 6. Launch Campaign (Bulk Action)
  {
    toolName: 'marketing_launch_campaign',
    userPrompt: 'Khởi chạy chiến dịch Marketing Omnichannel "Tri ân Khách hàng Thân thiết"',
    agentResponse: '🚀 **Đã khởi chạy Chiến dịch Marketing Omnichannel thành công**.\n⚠️ *Thao tác truyền thông diện rộng đã được cấp quản lý xác nhận*.',
    executedToolCall: {
      name: 'marketing_launch_campaign',
      input: { name: 'Tri ân Khách hàng Thân thiết', channel: 'omnichannel', segmentType: 'regular', messageContent: 'Tri an giam 15%' },
      output: { success: true, targetCount: 45 }
    }
  },

  // 7. Birthday Automation
  {
    toolName: 'marketing_birthday',
    userPrompt: 'Quét và tự động gửi quà tặng chúc mừng sinh nhật cho khách có sinh nhật tháng này',
    agentResponse: '🎂 **Tự động hóa Sinh nhật**: Đã tìm thấy **14 khách hàng** sinh nhật tháng này và tự động gửi tin nhắn chúc mừng kèm Voucher 100k!',
    executedToolCall: {
      name: 'marketing_birthday',
      input: { month: 7, giftVoucherValue: 100000 },
      output: { success: true, birthdayCustomersCount: 14 }
    }
  },

  // 8. Win-back Inactive Customers
  {
    toolName: 'marketing_inactive_customers',
    userPrompt: 'Tự động phát hiện và kích hoạt chiến dịch Win-Back đối với khách lâu chưa quay lại quá 60 ngày',
    agentResponse: '🔄 **Chiến dịch Kích hoạt lại (Win-Back)**: Đã phát hiện **24 khách hàng** trên 60 ngày chưa quay lại và tự động gửi ưu đãi giảm 20% qua Zalo!',
    executedToolCall: {
      name: 'marketing_inactive_customers',
      input: { inactiveDaysThreshold: 60, offerDiscountPercentage: 20 },
      output: { success: true, inactiveCustomersFound: 24 }
    }
  }
];
