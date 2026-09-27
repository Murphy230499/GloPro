/**
 * Staff Read Tool
 * 
 * Retrieves real staff data from EasySalon database.
 * Detects ambiguity when multiple staff have similar names.
 * READ-ONLY.
 */

import { ReadTool, ToolContext, ToolResult } from '../contracts/ToolContracts';
import { base44 } from '../../../api/base44Client';

export class StaffReadTool implements ReadTool {
  name = 'StaffReadTool';
  description = 'Tra cứu danh sách nhân viên, thợ làm trong salon theo tên hoặc ID.';
  requiredPermission = 'staff';

  inputSchema = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Tên nhân viên cần tìm' },
      id: { type: 'string', description: 'ID nhân viên chính xác' },
      role: { type: 'string', description: 'Vị trí: Thợ chính, Thợ phụ, v.v.' }
    }
  };

  async execute(input: { name?: string; id?: string; role?: string }, context: ToolContext): Promise<ToolResult> {
    try {
      // 1. Get by ID
      if (input.id) {
        const staff = await base44.entities.Staff.get(input.id).catch(() => null);
        if (!staff) {
          return {
            success: true,
            status: 'NOT_FOUND',
            toolName: this.name,
            data: null,
            message: `Không tìm thấy nhân viên với ID "${input.id}".`
          };
        }
        return {
          success: true,
          status: 'SUCCESS',
          toolName: this.name,
          data: this.formatStaff(staff),
          metadata: { total: 1, source: 'Staff.get' },
          message: `Tìm thấy thông tin nhân viên ${staff.full_name || staff.name}.`
        };
      }

      // 2. Fetch list from DB
      const list = await base44.entities.Staff.list().catch(() => []);
      const q = (input.name || '').toLowerCase().trim();

      if (!q || q === 'all' || q === 'tất cả') {
        const activeStaff = list.filter(s => s.is_active !== false).map(s => this.formatStaff(s));
        return {
          success: true,
          status: activeStaff.length === 0 ? 'EMPTY_RESULT' : 'SUCCESS',
          toolName: this.name,
          data: activeStaff,
          metadata: { total: activeStaff.length, source: 'Staff.list' },
          message: `Salon hiện có ${activeStaff.length} nhân viên đang hoạt động.`
        };
      }

      // 3. Match staff
      const matched = list.filter(s => {
        const fullName = (s.full_name || s.name || '').toLowerCase();
        const role = (s.role || '').toLowerCase();
        return fullName.includes(q) || role.includes(q);
      });

      if (matched.length === 0) {
        return {
          success: true,
          status: 'NOT_FOUND',
          toolName: this.name,
          data: [],
          metadata: { total: 0, query: q },
          message: `Không tìm thấy nhân viên nào khớp với "${q}".`
        };
      }

      // 4. Multiple matches -> Ambiguity
      if (matched.length > 1) {
        const candidates = matched.map(s => this.formatStaff(s));
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
          message: `Tìm thấy ${matched.length} nhân viên khớp với tên "${q}".`
        };
      }

      // 5. Exactly 1 match
      const staff = this.formatStaff(matched[0]);
      return {
        success: true,
        status: 'SUCCESS',
        toolName: this.name,
        data: staff,
        metadata: { total: 1, isAmbiguous: false },
        message: `Tìm thấy nhân viên **${staff.name}** (${staff.role}).`
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'TOOL_ERROR',
        toolName: this.name,
        error: { code: 'STAFF_READ_ERROR', message: err.message },
        message: `Lỗi khi tra cứu nhân viên: ${err.message}`
      };
    }
  }

  private formatStaff(s: any) {
    return {
      id: s.id,
      name: s.full_name || s.name,
      role: s.role || 'Thợ chính',
      phone: s.phone || 'Chưa có',
      is_active: s.is_active !== false,
      branch_ids: s.branch_ids || []
    };
  }
}
