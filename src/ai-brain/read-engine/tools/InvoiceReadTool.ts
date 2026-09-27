/**
 * Invoice Read Tool
 * 
 * Retrieves real invoices and orders from EasySalon database.
 * Supports filtering by customer, staff, date, and status.
 * STRICTLY READ-ONLY. No mutations.
 */

import { ReadTool, ToolContext, ToolResult } from '../contracts/ToolContracts';
import { base44 } from '../../../api/base44Client';

export class InvoiceReadTool implements ReadTool {
  name = 'InvoiceReadTool';
  description = 'Tra cứu thông tin hóa đơn, đơn hàng, lịch sử mua hàng của khách hoặc nhân viên phụ trách.';
  requiredPermission = 'invoices';

  inputSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID hóa đơn' },
      invoiceCode: { type: 'string', description: 'Mã số hóa đơn (HD...)' },
      customerName: { type: 'string', description: 'Tên khách hàng' },
      customerPhone: { type: 'string', description: 'Số điện thoại khách hàng' },
      customerId: { type: 'string', description: 'ID khách hàng' },
      staffName: { type: 'string', description: 'Tên nhân viên' },
      date: { type: 'string', description: 'Ngày hóa đơn (YYYY-MM-DD)' },
      status: { type: 'string', description: 'Trạng thái: paid, unpaid, cancelled' }
    }
  };

  async execute(input: {
    id?: string;
    invoiceCode?: string;
    customerName?: string;
    customerPhone?: string;
    customerId?: string;
    staffName?: string;
    date?: string;
    status?: string;
  }, context: ToolContext): Promise<ToolResult> {
    try {
      if (input.id) {
        const inv = await base44.entities.Invoice.get(input.id).catch(() => null);
        if (!inv) {
          return {
            success: true,
            status: 'NOT_FOUND',
            toolName: this.name,
            data: null,
            message: `Không tìm thấy hóa đơn ID "${input.id}".`
          };
        }
        return {
          success: true,
          status: 'SUCCESS',
          toolName: this.name,
          data: this.formatInvoice(inv),
          metadata: { total: 1, source: 'Invoice.get' },
          message: `Tìm thấy hóa đơn của khách **${inv.customer_name}** (Tổng: ${(Number(inv.total) || 0).toLocaleString('vi-VN')} đ).`
        };
      }

      const list = await base44.entities.Invoice.list().catch(() => []);
      let filtered = list;

      if (context.branchId && context.branchId !== 'all') {
        filtered = filtered.filter(i => !i.branch_id || i.branch_id === context.branchId);
      }

      if (input.invoiceCode) {
        filtered = filtered.filter(i => (i.invoice_code || '').toLowerCase().includes(input.invoiceCode!.toLowerCase()));
      }

      if (input.customerId) {
        filtered = filtered.filter(i => i.customer_id === input.customerId);
      }

      if (input.customerPhone) {
        const p = input.customerPhone.replace(/\s+/g, '');
        filtered = filtered.filter(i => (i.customer_phone || '').replace(/\s+/g, '').includes(p));
      }

      if (input.customerName) {
        const qName = input.customerName.toLowerCase();
        filtered = filtered.filter(i => (i.customer_name || '').toLowerCase().includes(qName));
      }

      if (input.staffName) {
        const qStaff = input.staffName.toLowerCase();
        filtered = filtered.filter(i => {
          return (i.items || []).some((it: any) => (it.staff_name || '').toLowerCase().includes(qStaff));
        });
      }

      if (input.date) {
        filtered = filtered.filter(i => (i.date || i.created_date || i.created_at || '').startsWith(input.date!));
      }

      if (input.status) {
        filtered = filtered.filter(i => i.status === input.status);
      }

      const formatted = filtered.map(i => this.formatInvoice(i));

      if (formatted.length === 0) {
        return {
          success: true,
          status: 'EMPTY_RESULT',
          toolName: this.name,
          data: [],
          metadata: { total: 0 },
          message: 'Không tìm thấy hóa đơn nào phù hợp với yêu cầu tra cứu.'
        };
      }

      return {
        success: true,
        status: 'SUCCESS',
        toolName: this.name,
        data: formatted,
        metadata: { total: formatted.length, source: 'Invoice.list' },
        message: `Tìm thấy ${formatted.length} hóa đơn.`
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'TOOL_ERROR',
        toolName: this.name,
        error: { code: 'INVOICE_READ_ERROR', message: err.message },
        message: `Lỗi khi tra cứu hóa đơn: ${err.message}`
      };
    }
  }

  private formatInvoice(i: any) {
    return {
      id: i.id,
      invoice_code: i.invoice_code || i.id,
      customer_name: i.customer_name || 'Khách vãng lai',
      customer_phone: i.customer_phone || '',
      date: i.date || i.created_date || i.created_at,
      total: Number(i.total) || Number(i.final_amount) || 0,
      subtotal: Number(i.subtotal) || 0,
      discount: Number(i.discount) || 0,
      tip: Number(i.tip) || 0,
      status: i.status || 'paid',
      items: i.items || [],
      payment_methods: i.payment_methods || []
    };
  }
}
