/**
 * Customer Read Tool
 * 
 * Retrieves real customer data from EasySalon database.
 * Detects ambiguity when multiple customers match the query.
 * READ-ONLY.
 */

import { ReadTool, ToolContext, ToolResult } from '../contracts/ToolContracts';
import { base44 } from '../../../api/base44Client';

export class CustomerReadTool implements ReadTool {
  name = 'CustomerReadTool';
  description = 'Tra cứu hồ sơ khách hàng bằng họ tên, số điện thoại hoặc ID.';
  requiredPermission = 'customers';

  inputSchema = {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Tên, SĐT, hoặc email cần tìm' },
      id: { type: 'string', description: 'ID khách hàng chính xác' },
      phone: { type: 'string', description: 'Số điện thoại chính xác' }
    }
  };

  async execute(input: { query?: string; id?: string; phone?: string }, context: ToolContext): Promise<ToolResult> {
    try {
      // 1. Lookup by ID
      if (input.id) {
        const customer = await base44.entities.Customer.get(input.id).catch(() => null);
        if (!customer) {
          return {
            success: true,
            status: 'NOT_FOUND',
            toolName: this.name,
            data: null,
            message: `Không tìm thấy khách hàng với ID "${input.id}".`
          };
        }
        return {
          success: true,
          status: 'SUCCESS',
          toolName: this.name,
          data: this.formatCustomer(customer),
          metadata: { total: 1, source: 'Customer.get' },
          message: `Tìm thấy thông tin khách hàng ${customer.name}.`
        };
      }

      // 2. Fetch list from DB
      const list = await base44.entities.Customer.list().catch(() => []);
      const q = (input.phone || input.query || '').toLowerCase().trim();

      if (!q || q === 'all' || q === 'tất cả') {
        const sample = list.slice(0, 10).map(c => this.formatCustomer(c));
        return {
          success: true,
          status: list.length === 0 ? 'EMPTY_RESULT' : 'SUCCESS',
          toolName: this.name,
          data: sample,
          metadata: { total: list.length, source: 'Customer.list' },
          message: `Hệ thống hiện có tổng cộng ${list.length} khách hàng.`
        };
      }

      // 3. Filter candidates
      const matched = list.filter(c => {
        const nameMatch = c.name && c.name.toLowerCase().includes(q);
        const phoneMatch = c.phone && c.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
        const emailMatch = c.email && c.email.toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch;
      });

      if (matched.length === 0) {
        return {
          success: true,
          status: 'NOT_FOUND',
          toolName: this.name,
          data: [],
          metadata: { total: 0, query: q },
          message: `Không tìm thấy khách hàng nào khớp với "${q}".`
        };
      }

      // 4. Check for ambiguity (multiple matches)
      if (matched.length > 1) {
        const candidates = matched.map(c => this.formatCustomer(c));
        return {
          success: true,
          status: 'SUCCESS',
          toolName: this.name,
          data: candidates,
          metadata: {
            total: matched.length,
            isAmbiguous: true,
            candidates
          },
          message: `Tìm thấy ${matched.length} khách hàng khớp với "${q}".`
        };
      }

      // 5. Exactly 1 match
      const customer = this.formatCustomer(matched[0]);
      return {
        success: true,
        status: 'SUCCESS',
        toolName: this.name,
        data: customer,
        metadata: { total: 1, isAmbiguous: false },
        message: `Tìm thấy khách hàng **${customer.name}** (SĐT: \`${customer.phone}\`).`
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'TOOL_ERROR',
        toolName: this.name,
        error: { code: 'CUSTOMER_READ_ERROR', message: err.message },
        message: `Lỗi khi tra cứu khách hàng: ${err.message}`
      };
    }
  }

  private formatCustomer(c: any) {
    return {
      id: c.id,
      name: c.name,
      phone: c.phone || 'Chưa có',
      email: c.email || null,
      tier: c.tier || 'Chuẩn',
      points: c.points || c.loyalty_points || 0,
      total_spent: c.total_spent || 0,
      visit_count: c.visit_count || 0,
      birthday: c.birthday || null,
      address: c.address || null
    };
  }
}
