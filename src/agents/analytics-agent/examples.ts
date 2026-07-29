/**
 * Comprehensive Example Conversations demonstrating all 8 Analytics Agent Tools
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

export const ANALYTICS_AGENT_EXAMPLES: IToolExampleConversation[] = [
  // 1. Revenue
  {
    toolName: 'analytics_revenue',
    userPrompt: 'Phân tích tổng doanh thu salon trong tháng này',
    agentResponse: '📈 **Báo cáo Doanh thu**: Tổng **125.000.000đ** (Dịch vụ: 102.000.000đ, Bán lẻ sản phẩm: 23.000.000đ) - Tăng trưởng +14.2% so với tháng trước.',
    executedToolCall: {
      name: 'analytics_revenue',
      input: { timeframe: 'month' },
      output: { success: true, totalRevenue: 125000000 }
    }
  },

  // 2. Profit
  {
    toolName: 'analytics_profit',
    userPrompt: 'Báo cáo chi tiết lợi nhuận ròng và biên lợi nhuận salon tháng này',
    agentResponse: '💵 **Báo cáo Lợi nhuận Ròng**: Doanh thu 125.000.000đ trừ Vốn hàng (18.5tr), Lương (45tr), Chi phí vận hành (15tr) -> **LỢI NHUẬN RÒNG: 46.500.000đ** (Biên lợi nhuận ròng: **37%**).',
    executedToolCall: {
      name: 'analytics_profit',
      input: { timeframe: 'month' },
      output: { success: true, netProfit: 46500000 }
    }
  },

  // 3. Employee Analysis
  {
    toolName: 'analytics_employee',
    userPrompt: 'Xếp hạng năng suất và doanh thu của các thợ làm tóc salon',
    agentResponse: '🏆 **Bảng Xếp Hạng Năng Suất Nhân Viên**:\n1. **Minh Thu**: 27.500.000đ (85 lượt khách | Rating 4.9★)\n2. **Trần Văn B**: 19.800.000đ (62 lượt khách | Rating 4.8★)',
    executedToolCall: {
      name: 'analytics_employee',
      input: { timeframe: 'month' },
      output: { success: true, averageRevenuePerStaff: 23650000 }
    }
  },

  // 4. Customer Analysis
  {
    toolName: 'analytics_customer',
    userPrompt: 'Phân tích tỷ lệ giữ chân khách hàng và giá trị vòng đời khách hàng (LTV)',
    agentResponse: '👥 **Phân tích Khách hàng**: Giá trị vòng đời trung bình (LTV) đạt **3.450.000đ/khách**, Tỷ lệ giữ chân khách hàng đạt **84.5%**.',
    executedToolCall: {
      name: 'analytics_customer',
      input: { timeframe: 'month' },
      output: { success: true, averageLTV: 3450000 }
    }
  },

  // 5. Service Analysis
  {
    toolName: 'analytics_service',
    userPrompt: 'Top dịch vụ mang lại doanh thu & biên lợi nhuận cao nhất salon',
    agentResponse: '💇‍♀️ **Top Dịch Vụ Sinh Lời**:\n1. **Gội đầu dưỡng sinh**: 142 lượt (Doanh thu: 21.3tr | Lãi 78.5%)\n2. **Uốn tóc Hàn Quốc**: 48 lượt (Doanh thu: 28.8tr | Lãi 65.0%)',
    executedToolCall: {
      name: 'analytics_service',
      input: { timeframe: 'month' },
      output: { success: true, topServicesCount: 2 }
    }
  },

  // 6. Business Insights
  {
    toolName: 'analytics_insights',
    userPrompt: 'Đề xuất giải pháp AI để tối ưu hóa doanh thu và lấp đầy khung giờ trống salon',
    agentResponse: '💡 **Đề xuất Đột phá AI**:\n• **Cơ hội**: 65% khách gội đầu sẵn sàng mua Combo Ủ Keratin -> Tạo gói Upsell Combo tại POS.\n• **Khung giờ vắng**: Chạy Happy Hour giảm 25% buổi trưa (13:00 - 15:00).',
    executedToolCall: {
      name: 'analytics_insights',
      input: { category: 'all' },
      output: { success: true, insightsCount: 2 }
    }
  },

  // 7. Forecast
  {
    toolName: 'analytics_forecast',
    userPrompt: 'Dự báo doanh thu và lượng khách hàng salon trong tháng tới',
    agentResponse: '🔮 **Dự báo Doanh thu AI**: Dự kiến tháng tới đạt **138.000.000đ** (Độ tin cậy 89.5%) với khoảng **420 lượt khách**.',
    executedToolCall: {
      name: 'analytics_forecast',
      input: { targetMonthsAhead: 1 },
      output: { success: true, predictedRevenue: 138000000 }
    }
  },

  // 8. Trend Detection
  {
    toolName: 'analytics_trends',
    userPrompt: 'Phát hiện xu hướng làm đẹp và khung giờ cao điểm khách đông nhất',
    agentResponse: '🔥 **Xu hướng & Giờ Cao Điểm**:\n• Service Trend: Nhuộm Nâu Tây Ánh Khói, Gội đầu thảo dược.\n• Giờ cao điểm: 10:00 - 11:30 & 17:00 - 19:30 Thứ 7, CN.',
    executedToolCall: {
      name: 'analytics_trends',
      input: { timeframe: 'month' },
      output: { success: true }
    }
  }
];
