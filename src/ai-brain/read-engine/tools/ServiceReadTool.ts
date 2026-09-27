/**
 * Service Read Tool
 * 
 * Retrieves real service catalog data from EasySalon database.
 * Detects ambiguity when multiple services match the user query.
 * READ-ONLY.
 */

import { ReadTool, ToolContext, ToolResult } from '../contracts/ToolContracts';
import { base44 } from '../../../api/base44Client';

export class ServiceReadTool implements ReadTool {
  name = 'ServiceReadTool';
  description = 'Tra cứu danh mục dịch vụ, bảng giá, thời lượng thực hiện tại salon.';
  requiredPermission = 'services';

  inputSchema = {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Tên dịch vụ cần tìm' },
      id: { type: 'string', description: 'ID dịch vụ' }
    }
  };

  async execute(input: { query?: string; id?: string }, context: ToolContext): Promise<ToolResult> {
    try {
      if (input.id) {
        const service = await base44.entities.Service.get(input.id).catch(() => null);
        if (!service) {
          return {
            success: true,
            status: 'NOT_FOUND',
            toolName: this.name,
            data: null,
            message: `Không tìm thấy dịch vụ với ID "${input.id}".`
          };
        }
        return {
          success: true,
          status: 'SUCCESS',
          toolName: this.name,
          data: this.formatService(service),
          metadata: { total: 1, source: 'Service.get' },
          message: `Dịch vụ **${service.name}**: ${(Number(service.price) || 0).toLocaleString('vi-VN')} đ (${service.duration_minutes || 45} phút).`
        };
      }

      const list = await base44.entities.Service.list().catch(() => []);
      const q = (input.query || '').toLowerCase().trim();

      if (!q || q === 'all' || q === 'tất cả') {
        const active = list.filter(s => s.is_active !== false).map(s => this.formatService(s));
        return {
          success: true,
          status: active.length === 0 ? 'EMPTY_RESULT' : 'SUCCESS',
          toolName: this.name,
          data: active,
          metadata: { total: active.length, source: 'Service.list' },
          message: `Salon hiện có ${active.length} dịch vụ đang phục vụ.`
        };
      }

      const matched = list.filter(s => {
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const catMatch = (s.category || '').toLowerCase().includes(q);
        return nameMatch || catMatch;
      });

      if (matched.length === 0) {
        return {
          success: true,
          status: 'NOT_FOUND',
          toolName: this.name,
          data: [],
          metadata: { total: 0, query: q },
          message: `Không tìm thấy dịch vụ nào khớp với "${q}".`
        };
      }

      if (matched.length > 1) {
        const candidates = matched.map(s => this.formatService(s));
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
          message: `Tìm thấy ${matched.length} dịch vụ tương tự "${q}".`
        };
      }

      const single = this.formatService(matched[0]);
      return {
        success: true,
        status: 'SUCCESS',
        toolName: this.name,
        data: single,
        metadata: { total: 1, isAmbiguous: false },
        message: `Dịch vụ **${single.name}**: ${(Number(single.price) || 0).toLocaleString('vi-VN')} đ (${single.duration_minutes} phút).`
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'TOOL_ERROR',
        toolName: this.name,
        error: { code: 'SERVICE_READ_ERROR', message: err.message },
        message: `Lỗi khi tra cứu dịch vụ: ${err.message}`
      };
    }
  }

  private formatService(s: any) {
    return {
      id: s.id,
      name: s.name,
      price: Number(s.price) || 0,
      duration_minutes: s.duration_minutes || 45,
      category: s.category || 'Dịch vụ',
      is_active: s.is_active !== false
    };
  }
}
