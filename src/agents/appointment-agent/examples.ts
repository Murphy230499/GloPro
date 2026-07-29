/**
 * Comprehensive Example Conversations demonstrating all 8 Appointment Agent Tools
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

export const APPOINTMENT_AGENT_EXAMPLES: IToolExampleConversation[] = [
  // 1. Book Appointment with Conflict Check
  {
    toolName: 'appointment_book',
    userPrompt: 'Đặt lịch hẹn cho Chị Hoa dịch vụ Gội đầu dưỡng sinh lúc 15:00 hôm nay với nhân viên Minh Thu',
    agentResponse: '🎉 **Đã kiểm tra hệ thống & Đặt lịch hẹn thành công!**\n• **Khách hàng**: Chị Hoa (0988123456)\n• **Thời gian**: 15:00 hôm nay (2026-07-22)\n• **Nhân viên**: Minh Thu (Thợ chính - *Không bị trùng lịch*)',
    executedToolCall: {
      name: 'appointment_book',
      input: { customerName: 'Chị Hoa', customerPhone: '0988123456', serviceName: 'Gội đầu dưỡng sinh', staffName: 'Minh Thu', date: '2026-07-22', startTime: '15:00' },
      output: { success: true, id: 'appt_501' }
    }
  },

  // 2. Reschedule Appointment
  {
    toolName: 'appointment_reschedule',
    userPrompt: 'Đổi lịch hẹn appt_501 của Chị Hoa sang 16:30 chiều nay',
    agentResponse: '✅ **Đã đổi lịch hẹn thành công**: Lịch hẹn appt_501 đã được cập nhật sang **16:30** chiều nay (Đã xác nhận thợ Minh Thu rảnh giờ này).',
    executedToolCall: {
      name: 'appointment_reschedule',
      input: { appointmentId: 'appt_501', newDate: '2026-07-22', newStartTime: '16:30', reason: 'Khách bận đột xuất' },
      output: { success: true }
    }
  },

  // 3. Cancel Appointment
  {
    toolName: 'appointment_cancel',
    userPrompt: 'Hủy lịch hẹn appt_501 do khách bận việc gia đình',
    agentResponse: '🚫 **Đã hủy lịch hẹn**: Khung giờ 16:30 của thợ Minh Thu đã được giải phóng trên hệ thống.',
    executedToolCall: {
      name: 'appointment_cancel',
      input: { appointmentId: 'appt_501', reason: 'Khách bận việc gia đình' },
      output: { success: true, status: 'cancelled' }
    }
  },

  // 4. Find Available Employee
  {
    toolName: 'appointment_find_employee',
    userPrompt: 'Kiểm tra xem chiều nay lúc 14:00 có những nhân viên nào rảnh lịch?',
    agentResponse: '🔎 **Danh sách Nhân viên rảnh lịch lúc 14:00 hôm nay**:\n• **Minh Thu** (Thợ chính) - 🟢 Sẵn sàng\n• **Trần Văn B** (Thợ phụ) - 🟢 Sẵn sàng',
    executedToolCall: {
      name: 'appointment_find_employee',
      input: { date: '2026-07-22', startTime: '14:00', durationMinutes: 45 },
      output: { success: true, count: 2 }
    }
  },

  // 5. Waiting List
  {
    toolName: 'appointment_waiting_list',
    userPrompt: 'Thêm Chị Mai SĐT 0905123456 vào danh sách chờ khung giờ 15:00',
    agentResponse: '📝 **Đã ghi nhận vào Danh sách chờ**: Chị Mai (0905123456) sẽ được ưu tiên xếp lịch ngay khi có khách hủy lịch lúc 15:00.',
    executedToolCall: {
      name: 'appointment_waiting_list',
      input: { action: 'add', customerName: 'Chị Mai', customerPhone: '0905123456', preferredTime: '15:00' },
      output: { success: true }
    }
  },

  // 6. Send Reminder
  {
    toolName: 'appointment_send_reminder',
    userPrompt: 'Gửi tin nhắn nhắc lịch hẹn appt_501 qua Zalo cho khách hàng',
    agentResponse: '📲 **Đã gửi tin nhắn nhắc lịch thành công** tới Zalo của khách hàng (SĐT: 0988123456).',
    executedToolCall: {
      name: 'appointment_send_reminder',
      input: { appointmentId: 'appt_501', channel: 'zalo' },
      output: { success: true, sent: true }
    }
  },

  // 7. Check-In
  {
    toolName: 'appointment_check_in',
    userPrompt: 'Check-in cho khách Chị Hoa lịch hẹn appt_501 đã tới salon',
    agentResponse: '🟢 **Check-in thành công**: Lịch hẹn appt_501 đã cập nhật trạng thái **Checked-in** (Khách đã có mặt tại salon).',
    executedToolCall: {
      name: 'appointment_check_in',
      input: { appointmentId: 'appt_501' },
      output: { success: true, status: 'checked_in' }
    }
  },

  // 8. Check-Out
  {
    toolName: 'appointment_check_out',
    userPrompt: 'Hoàn tất dịch vụ và check-out lịch hẹn appt_501 khách thanh toán chuyển khoản',
    agentResponse: '✅ **Check-out thành công**: Đã cập nhật trạng thái lịch hẹn appt_501 thành **Hoàn tất (Completed)**.',
    executedToolCall: {
      name: 'appointment_check_out',
      input: { appointmentId: 'appt_501', paymentMethod: 'transfer' },
      output: { success: true, status: 'completed' }
    }
  }
];
