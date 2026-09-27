/**
 * Revenue Read Tool
 * 
 * Reuses EasySalon's existing financial and reporting engine logic (reportsEngine.js, RevenueTab, StaffTab).
 * Retrieves real revenue statistics by date, period, staff, and top sellers.
 * 
 * STRICT BUSINESS RULE:
 * - Tip is an employee pass-through fee and is NOT calculated into salon revenue.
 * - STRICTLY READ-ONLY.
 */

import { ReadTool, ToolContext, ToolResult } from '../contracts/ToolContracts';
import { base44 } from '../../../api/base44Client';
import { filterByDateRange } from '../../../lib/reportsEngine';

export class RevenueReadTool implements ReadTool {
  name = 'RevenueReadTool';
  description = 'Tra cứu doanh thu thực tế của salon theo ngày, tuần, tháng, quý, năm, hoặc doanh thu theo nhân viên.';
  requiredPermission = 'reports';

  inputSchema = {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['today', 'period', 'staff', 'top_items'], description: 'Loại báo cáo doanh thu' },
      period: { type: 'string', enum: ['day', 'week', 'month', 'quarter', 'year'], description: 'Chu kỳ báo cáo' },
      date: { type: 'string', description: 'Ngày cụ thể (YYYY-MM-DD)' },
      startDate: { type: 'string', description: 'Từ ngày (YYYY-MM-DD)' },
      endDate: { type: 'string', description: 'Đến ngày (YYYY-MM-DD)' },
      staffName: { type: 'string', description: 'Tên nhân viên cần tra cứu doanh thu' },
      staffId: { type: 'string', description: 'ID nhân viên' }
    }
  };

  async execute(input: {
    type?: 'today' | 'period' | 'staff' | 'top_items';
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    date?: string;
    startDate?: string;
    endDate?: string;
    staffName?: string;
    staffId?: string;
  }, context: ToolContext): Promise<ToolResult> {
    try {
      const [invoices, appointments] = await Promise.all([
        base44.entities.Invoice.list().catch(() => []),
        base44.entities.Appointment.list().catch(() => [])
      ]);

      const branchId = context.branchId;
      let branchInvoices = invoices;
      let branchAppointments = appointments;

      if (branchId && branchId !== 'all') {
        branchInvoices = invoices.filter(i => !i.branch_id || i.branch_id === branchId);
        branchAppointments = appointments.filter(a => !a.branch_id || a.branch_id === branchId);
      }

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // A. STAFF REVENUE
      if (input.type === 'staff' || input.staffName || input.staffId) {
        return this.calculateStaffRevenue(branchInvoices, input.staffName, input.staffId, input.period || 'month');
      }

      // B. TOP SELLING SERVICES / PRODUCTS
      if (input.type === 'top_items') {
        return this.calculateTopItems(branchInvoices, input.period || 'month');
      }

      // C. TODAY SUMMARY
      if (input.type === 'today' || input.date === todayStr || (!input.type && !input.period && !input.startDate)) {
        const targetDate = input.date || todayStr;
        const todayInvs = branchInvoices.filter(i => {
          const d = i.date || i.created_date || i.created_at || '';
          return d.startsWith(targetDate);
        });

        const totalRevenue = todayInvs.reduce((sum, inv) => sum + (Number(inv.total) || Number(inv.final_amount) || 0), 0);
        const totalDiscount = todayInvs.reduce((sum, inv) => sum + (Number(inv.discount) || 0), 0);
        const totalTip = todayInvs.reduce((sum, inv) => sum + (Number(inv.tip) || 0), 0);

        const todayAppts = branchAppointments.filter(a => (a.date || a.created_at || '').startsWith(targetDate));
        const completedAppts = todayAppts.filter(a => a.status === 'completed').length;
        const pendingAppts = todayAppts.filter(a => a.status === 'pending' || a.status === 'confirmed').length;

        const data = {
          date: targetDate,
          totalRevenue,
          formattedRevenue: `${totalRevenue.toLocaleString('vi-VN')} đ`,
          totalDiscount,
          totalTip,
          invoiceCount: todayInvs.length,
          appointmentCount: todayAppts.length,
          completedAppointments: completedAppts,
          pendingAppointments: pendingAppts
        };

        let message = `📊 **Tình hình kinh doanh hôm nay (${new Date(targetDate).toLocaleDateString('vi-VN')}):**\n` +
          `• **Doanh thu thuần:** **${data.formattedRevenue}**\n` +
          `• **Số hóa đơn:** **${todayInvs.length}** đơn\n` +
          `• **Lịch hẹn trong ngày:** **${todayAppts.length}** lịch (${completedAppts} hoàn thành, ${pendingAppts} đang chờ)`;

        if (totalTip > 0) {
          message += `\n• **Tiền tip thu hộ:** ${totalTip.toLocaleString('vi-VN')} đ *(không tính vào doanh thu)*`;
        }

        return {
          success: true,
          status: 'SUCCESS',
          toolName: this.name,
          data,
          metadata: { total: todayInvs.length, source: 'Invoice.list' },
          message
        };
      }

      // D. PERIOD / DATE RANGE REVENUE
      let startDateStr = input.startDate;
      let endDateStr = input.endDate || todayStr;
      let periodLabel = 'khoảng thời gian đã chọn';

      if (input.period === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        startDateStr = d.toISOString().split('T')[0];
        periodLabel = '7 ngày qua';
      } else if (input.period === 'month') {
        startDateStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        periodLabel = `tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
      } else if (input.period === 'quarter') {
        const q = Math.floor(now.getMonth() / 3);
        startDateStr = new Date(now.getFullYear(), q * 3, 1).toISOString().split('T')[0];
        periodLabel = `quý ${q + 1}/${now.getFullYear()}`;
      } else if (input.period === 'year') {
        startDateStr = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        periodLabel = `năm ${now.getFullYear()}`;
      }

      const periodInvoices = filterByDateRange(branchInvoices, { startDate: startDateStr, endDate: endDateStr });
      const totalRevenue = periodInvoices.reduce((sum, inv) => sum + (Number(inv.total) || Number(inv.final_amount) || 0), 0);
      const totalSubtotal = periodInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0);
      const totalDiscount = periodInvoices.reduce((sum, inv) => sum + (Number(inv.discount) || 0), 0);
      const aov = periodInvoices.length > 0 ? Math.round(totalRevenue / periodInvoices.length) : 0;

      const data = {
        period: input.period || 'custom',
        periodLabel,
        startDate: startDateStr,
        endDate: endDateStr,
        totalRevenue,
        formattedRevenue: `${totalRevenue.toLocaleString('vi-VN')} đ`,
        totalSubtotal,
        totalDiscount,
        invoiceCount: periodInvoices.length,
        aov
      };

      const message = `📈 **Báo cáo doanh thu ${periodLabel}:**\n` +
        `• **Tổng doanh thu:** **${data.formattedRevenue}**\n` +
        `• **Số lượng hóa đơn:** **${periodInvoices.length}** đơn\n` +
        `• **Giá trị trung bình/đơn (AOV):** **${aov.toLocaleString('vi-VN')} đ**`;

      return {
        success: true,
        status: 'SUCCESS',
        toolName: this.name,
        data,
        metadata: { total: periodInvoices.length, source: 'reportsEngine' },
        message
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'TOOL_ERROR',
        toolName: this.name,
        error: { code: 'REVENUE_READ_ERROR', message: err.message },
        message: `Lỗi khi tổng hợp doanh thu: ${err.message}`
      };
    }
  }

  private calculateStaffRevenue(invoices: any[], staffName?: string, staffId?: string, period: string = 'month'): ToolResult {
    const q = (staffName || '').toLowerCase().trim();
    let serviceRevenue = 0;
    let productRevenue = 0;
    let totalRevenue = 0;
    let matchedInvoicesCount = 0;

    invoices.forEach(inv => {
      let invMatched = false;
      (inv.items || []).forEach((it: any) => {
        const idMatches = staffId && it.staff_id === staffId;
        const nameMatches = q && (it.staff_name || '').toLowerCase().includes(q);

        if (idMatches || nameMatches) {
          invMatched = true;
          const val = (Number(it.price) || 0) * (Number(it.qty) || 1);
          totalRevenue += val;
          if (it.type === 'product') {
            productRevenue += val;
          } else {
            serviceRevenue += val;
          }
        }
      });
      if (invMatched) matchedInvoicesCount++;
    });

    const displayName = staffName || 'nhân viên';
    const data = {
      staffName: displayName,
      staffId: staffId || null,
      totalRevenue,
      formattedRevenue: `${totalRevenue.toLocaleString('vi-VN')} đ`,
      serviceRevenue,
      productRevenue,
      invoicesCount: matchedInvoicesCount
    };

    const message = `🧑‍💼 **Báo cáo doanh số của nhân viên ${displayName}:**\n` +
      `• **Tổng doanh thu trực tiếp:** **${data.formattedRevenue}**\n` +
      `• **Doanh thu dịch vụ làm:** ${(serviceRevenue).toLocaleString('vi-VN')} đ\n` +
      `• **Doanh thu bán sản phẩm:** ${(productRevenue).toLocaleString('vi-VN')} đ\n` +
      `• **Số lượt hóa đơn phục vụ:** ${matchedInvoicesCount} lượt`;

    return {
      success: true,
      status: 'SUCCESS',
      toolName: this.name,
      data,
      metadata: { total: matchedInvoicesCount },
      message
    };
  }

  private calculateTopItems(invoices: any[], period: string): ToolResult {
    const itemMap: Record<string, { revenue: number; qty: number; type: string }> = {};

    invoices.forEach(inv => {
      (inv.items || []).forEach((it: any) => {
        if (!it.name) return;
        const name = it.name;
        const rev = (Number(it.price) || 0) * (Number(it.qty) || 1);
        const qty = Number(it.qty) || 1;
        if (!itemMap[name]) {
          itemMap[name] = { revenue: 0, qty: 0, type: it.type || 'service' };
        }
        itemMap[name].revenue += rev;
        itemMap[name].qty += qty;
      });
    });

    const sorted = Object.entries(itemMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, val], idx) => ({
        rank: idx + 1,
        name,
        revenue: val.revenue,
        qty: val.qty,
        type: val.type
      }));

    let message = `🏆 **Top 5 Dịch vụ & Sản phẩm bán chạy nhất:**\n` +
      sorted.map(s => `• Top ${s.rank}: **${s.name}** - Doanh thu: **${s.revenue.toLocaleString('vi-VN')} đ** (${s.qty} lượt)`).join('\n');

    return {
      success: true,
      status: 'SUCCESS',
      toolName: this.name,
      data: sorted,
      metadata: { total: sorted.length },
      message
    };
  }
}
