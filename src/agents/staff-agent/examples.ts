/**
 * Comprehensive Example Conversations demonstrating all 8 Staff Agent Tools
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

export const STAFF_AGENT_EXAMPLES: IToolExampleConversation[] = [
  // 1. Attendance
  {
    toolName: 'staff_attendance',
    userPrompt: 'Chấm công vào ca hôm nay lúc 08:30 cho thợ Minh Thu',
    agentResponse: '🟢 **Chấm công vào ca thành công**: Thợ Minh Thu đã điểm danh lúc 08:30 (Đúng giờ).',
    executedToolCall: {
      name: 'staff_attendance',
      input: { action: 'check_in', staffId: 'staff_001', time: '08:30' },
      output: { success: true, status: 'on_time' }
    }
  },

  // 2. Commission (Money Action)
  {
    toolName: 'staff_commission',
    userPrompt: 'Tính hoa hồng làm dịch vụ & bán mỹ phẩm tháng 07/2026 cho nhân viên staff_001',
    agentResponse: '💰 **Tính hoa hồng thành công**: Tổng hoa hồng đạt **1.600.000đ** (Hoa hồng dịch vụ: 1.250.000đ, Hoa hồng sản phẩm: 350.000đ).\n⚠️ *Thao tác tài chính này đã được xác nhận bảo mật*.',
    executedToolCall: {
      name: 'staff_commission',
      input: { staffId: 'staff_001', month: '2026-07', action: 'calculate' },
      output: { success: true, totalCommission: 1600000 }
    }
  },

  // 3. Salary (Money Action)
  {
    toolName: 'staff_salary',
    userPrompt: 'Lập bảng lương tháng 07/2026 cho nhân viên Minh Thu (staff_001)',
    agentResponse: '💵 **Bảng tính Lương Tháng 07/2026**:\n• Lương cơ bản: 8.000.000đ\n• Hoa hồng: 1.600.000đ\n• Thưởng KPI: 500.000đ\n• Khấu trừ: -100.000đ\n---------------------\n• **THỰC LĨNH**: **10.000.000đ**',
    executedToolCall: {
      name: 'staff_salary',
      input: { staffId: 'staff_001', month: '2026-07', action: 'calculate' },
      output: { success: true, netSalary: 10000000 }
    }
  },

  // 4. Schedule
  {
    toolName: 'staff_schedule',
    userPrompt: 'Xếp ca làm việc ca Sáng (08:00 - 14:00) ngày 2026-07-23 cho nhân viên Minh Thu',
    agentResponse: '📅 **Đã xếp ca làm việc thành công**: Nhân viên Minh Thu làm Ca Sáng (08:00 - 14:00) ngày 23/07/2026.',
    executedToolCall: {
      name: 'staff_schedule',
      input: { action: 'assign_shift', staffId: 'staff_001', date: '2026-07-23', shiftType: 'morning' },
      output: { success: true }
    }
  },

  // 5. Performance
  {
    toolName: 'staff_performance',
    userPrompt: 'Đánh giá chỉ số hiệu suất làm việc tháng này của thợ Minh Thu',
    agentResponse: '⭐ **Báo cáo Hiệu suất**: Đánh giá khách hàng đạt **4.85/5.0★**, hoàn thành 68 lượt dịch vụ, tỷ lệ khách quay lại đạt **88.5%**.',
    executedToolCall: {
      name: 'staff_performance',
      input: { staffId: 'staff_001', timeframe: 'month' },
      output: { success: true, ratingScore: 4.85 }
    }
  },

  // 6. Leave
  {
    toolName: 'staff_leave',
    userPrompt: 'Đăng ký nghỉ phép ngày 25/07/2026 lý do giải quyết công việc gia đình',
    agentResponse: '📝 **Đã gửi đơn xin nghỉ phép**: Đơn nghỉ ngày 25/07/2026 đã được chuyển tới Quản lý salon chờ phê duyệt.',
    executedToolCall: {
      name: 'staff_leave',
      input: { action: 'request', staffId: 'staff_001', startDate: '2026-07-25', endDate: '2026-07-25', reason: 'Công việc gia đình' },
      output: { success: true, status: 'pending' }
    }
  },

  // 7. KPI
  {
    toolName: 'staff_kpi',
    userPrompt: 'Kiểm tra tỷ lệ hoàn thành mục tiêu KPI tháng 07/2026 của thợ Minh Thu',
    agentResponse: '🎯 **Đánh giá KPI**: Đã hoàn thành **110%** chỉ tiêu doanh thu tháng (Thực tế: 27.500.000đ / Chỉ tiêu: 25.000.000đ).',
    executedToolCall: {
      name: 'staff_kpi',
      input: { action: 'evaluate', staffId: 'staff_001', month: '2026-07' },
      output: { success: true, achievementPercentage: 110 }
    }
  },

  // 8. Revenue
  {
    toolName: 'staff_revenue',
    userPrompt: 'Xem tổng doanh thu đóng góp của thợ Minh Thu trong tháng 07/2026',
    agentResponse: '📈 **Báo cáo Doanh thu Đóng góp**: Tổng **27.500.000đ** (Doanh thu làm dịch vụ: 22.500.000đ, Bán sản phẩm: 5.000.000đ) - **Xếp hạng #1 Salon**.',
    executedToolCall: {
      name: 'staff_revenue',
      input: { staffId: 'staff_001', month: '2026-07' },
      output: { success: true, totalRevenue: 27500000, rankInSalon: 1 }
    }
  }
];
