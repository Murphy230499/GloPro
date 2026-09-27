/**
 * Product Read Tool
 * 
 * Retrieves real product and inventory data from EasySalon database.
 * READ-ONLY.
 */

import { ReadTool, ToolContext, ToolResult } from '../contracts/ToolContracts';
import { base44 } from '../../../api/base44Client';

export class ProductReadTool implements ReadTool {
  name = 'ProductReadTool';
  description = 'Tra cứu sản phẩm bán lẻ, mỹ phẩm, tồn kho và đơn giá.';
  requiredPermission = 'products';

  inputSchema = {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Tên sản phẩm cần tìm' },
      id: { type: 'string', description: 'ID sản phẩm' }
    }
  };

  async execute(input: { query?: string; id?: string }, context: ToolContext): Promise<ToolResult> {
    try {
      if (input.id) {
        const prod = await base44.entities.Product.get(input.id).catch(() => null);
        if (!prod) {
          return {
            success: true,
            status: 'NOT_FOUND',
            toolName: this.name,
            data: null,
            message: `Không tìm thấy sản phẩm với ID "${input.id}".`
          };
        }
        return {
          success: true,
          status: 'SUCCESS',
          toolName: this.name,
          data: this.formatProduct(prod),
          metadata: { total: 1, source: 'Product.get' },
          message: `Sản phẩm **${prod.name}**: Giá ${(Number(prod.price) || 0).toLocaleString('vi-VN')} đ (Tồn: ${prod.stock || 0}).`
        };
      }

      const list = await base44.entities.Product.list().catch(() => []);
      const q = (input.query || '').toLowerCase().trim();

      if (!q || q === 'all' || q === 'tất cả') {
        const active = list.filter(p => p.is_active !== false).map(p => this.formatProduct(p));
        return {
          success: true,
          status: active.length === 0 ? 'EMPTY_RESULT' : 'SUCCESS',
          toolName: this.name,
          data: active,
          metadata: { total: active.length, source: 'Product.list' },
          message: `Salon hiện có ${active.length} sản phẩm trong kho.`
        };
      }

      const matched = list.filter(p => {
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        return nameMatch || catMatch;
      });

      if (matched.length === 0) {
        return {
          success: true,
          status: 'NOT_FOUND',
          toolName: this.name,
          data: [],
          metadata: { total: 0, query: q },
          message: `Không tìm thấy sản phẩm nào khớp với "${q}".`
        };
      }

      const products = matched.map(p => this.formatProduct(p));
      return {
        success: true,
        status: 'SUCCESS',
        toolName: this.name,
        data: products,
        metadata: {
          total: matched.length,
          isAmbiguous: matched.length > 1,
          candidates: matched.length > 1 ? products : undefined
        },
        message: `Tìm thấy ${matched.length} sản phẩm khớp với "${q}".`
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'TOOL_ERROR',
        toolName: this.name,
        error: { code: 'PRODUCT_READ_ERROR', message: err.message },
        message: `Lỗi khi tra cứu sản phẩm: ${err.message}`
      };
    }
  }

  private formatProduct(p: any) {
    return {
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      stock: p.stock || 0,
      min_stock: p.min_stock || 0,
      category: p.category || 'Mỹ phẩm',
      is_active: p.is_active !== false
    };
  }
}
