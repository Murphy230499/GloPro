/**
 * Appointment Read Tool
 * 
 * Retrieves real appointment bookings from EasySalon database.
 * Supports filtering by customer, staff, date/date range, and status.
 * STRICTLY READ-ONLY. No mutations.
 */

import { ReadTool, ToolContext, ToolResult } from '../contracts/ToolContracts';
import { base44 } from '../../../api/base44Client';

export class AppointmentReadTool implements ReadTool {
  name = 'AppointmentReadTool';
  description = 'Tra cứu danh sách lịch hẹn theo ngày, khách hàng, nhân viên hoặc trạng thái.';
  requiredPermission = 'appointments';

  inputSchema = {
    type: 'object',
    properties: {
      date: { type: 'string', description: 'Ngày cần xem (YYYY-MM-DD)' },
      fromDate: { type: 'string', description: 'Từ ngày (YYYY-MM-DD)' },
      toDate: { type: 'string', description: 'Đến ngày (YYYY-MM-DD)' },
      customerPhone: { type: 'string', description: 'Số điện thoại khách hàng' },
      customerId: { type: 'string', description: 'ID khách hàng' },
      staffName: { type: 'string', description: 'Tên nhân viên phụ trách' },
      staffId: { type: 'string', description: 'ID nhân viên phụ trách' },
      status: { type: 'string', description: 'Trạng thái: pending, confirmed, completed, cancelled' }
    }
  };

  async execute(input: {
    date?: string;
    fromDate?: string;
    toDate?: string;
    customerPhone?: string;
    customerId?: string;
    staffName?: string;
    staffId?: string;
    status?: string;
  }, context: ToolContext): Promise<ToolResult> {
    try {
      const list = await base44.entities.Appointment.list().catch(() => []);
      const branchId = context.branchId;

      let filtered = list;

      // Filter by branch if active
      if (branchId && branchId !== 'all') {
        filtered = filtered.filter(a => !a.branch_id || a.branch_id === branchId);
      }

      // Filter by single date
      if (input.date) {
        filtered = filtered.filter(a => (a.date || a.created_at || '').startsWith(input.date!));
      }

      // Filter by date range
      if (input.fromDate && input.toDate) {
        filtered = filtered.filter(a => {
          const d = a.date || a.created_at || '';
          return d >= input.fromDate! && d <= input.toDate!;
        });
      }

      // Filter by customer phone
      if (input.customerPhone) {
        const cleanPhone = input.customerPhone.replace(/\s+/g, '');
        filtered = filtered.filter(a => (a.customer_phone || '').replace(/\s+/g, '').includes(cleanPhone));
      }

      // Filter by customer ID
      if (input.customerId) {
        filtered = filtered.filter(a => a.customer_id === input.customerId);
      }

      // Filter by staff
      if (input.staffName) {
        const qStaff = input.staffName.toLowerCase();
        filtered = filtered.filter(a => (a.staff_name || '').toLowerCase().includes(qStaff));
      }
      if (input.staffId) {
        filtered = filtered.filter(a => a.staff_id === input.staffId);
      }

      // Filter by status
      if (input.status) {
        filtered = filtered.filter(a => a.status === input.status);
      }

      const formatted = filtered.map(a => this.formatAppointment(a));

      if (formatted.length === 0) {
        let msg = 'Không tìm thấy lịch hẹn nào phù hợp';
        if (input.date) msg += ` vào ngày ${input.date}`;
        if (input.customerPhone) msg += ` của SĐT ${input.customerPhone}`;
        return {
          success: true,
          status: 'EMPTY_RESULT',
          toolName: this.name,
          data: [],
          metadata: { total: 0 },
          message: `${msg}.`
        };
      }

      return {
        success: true,
        status: 'SUCCESS',
        toolName: this.name,
        data: formatted,
        metadata: { total: formatted.length, source: 'Appointment.list' },
        message: `Tìm thấy ${formatted.length} lịch hẹn thỏa điều kiện.`
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'TOOL_ERROR',
        toolName: this.name,
        error: { code: 'APPOINTMENT_READ_ERROR', message: err.message },
        message: `Lỗi khi tra cứu lịch hẹn: ${err.message}`
      };
    }
  }

  private formatAppointment(a: any) {
    return {
      id: a.id,
      customer_name: a.customer_name,
      customer_phone: a.customer_phone,
      service_name: a.service_name,
      staff_name: a.staff_name || 'Chưa chỉ định',
      date: a.date,
      time: a.start_time || a.time || '',
      status: a.status,
      note: a.note || ''
    };
  }
}
