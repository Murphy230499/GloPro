/**
 * Inventory Read Tool (Phase 6 Real Business Operations)
 * 
 * Retrieves real inventory, warehouse stock levels, low-stock alerts,
 * and inventory asset valuation from the EasySalon database.
 * READ-ONLY.
 */

import { ReadTool, ToolContext, ToolResult } from '../contracts/ToolContracts';
import { base44 } from '../../../api/base44Client';

export class InventoryReadTool implements ReadTool {
  name = 'InventoryReadTool';
  description = 'Tra cứu lượng tồn kho sản phẩm thực tế, cảnh báo sắp hết hàng và định giá tài sản kho hàng.';
  requiredPermission = 'inventory';

  inputSchema = {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['stock_level', 'low_stock', 'valuation', 'all'], description: 'Loại truy vấn kho' },
      productName: { type: 'string', description: 'Tên sản phẩm cần kiểm tra tồn kho' },
      productId: { type: 'string', description: 'ID sản phẩm' },
      branchId: { type: 'string', description: 'Chi nhánh kho cần xem' }
    }
  };

  async execute(input: { type?: string; productName?: string; productId?: string; branchId?: string }, context: ToolContext): Promise<ToolResult> {
    try {
      const products: any[] = await base44.entities.Product.list().catch(() => []);
      const q = (input.productName || '').toLowerCase().trim();
      const branchId = input.branchId || context.branchId;

      // 1. SPECIFIC PRODUCT STOCK
      if (input.productId || q) {
        const matched = products.filter(p => {
          if (input.productId && p.id === input.productId) return true;
          if (q && (p.name || '').toLowerCase().includes(q)) return true;
          return false;
        });

        if (matched.length === 0) {
          return {
            success: true,
            status: 'NOT_FOUND',
            toolName: this.name,
            data: [],
            message: `Không tìm thấy sản phẩm nào khớp với "${q || input.productId}" trong kho.`
          };
        }

        const formatted = matched.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category || 'Mỹ phẩm',
          stock: Number(p.stock) || 0,
          minStock: Number(p.min_stock) || 5,
          unitPrice: Number(p.price) || 0,
          costPrice: Number(p.cost_price) || Math.round((Number(p.price) || 0) * 0.6),
          isLowStock: (Number(p.stock) || 0) <= (Number(p.min_stock) || 5)
        }));

        const first = formatted[0];
        const statusText = first.isLowStock ? '⚠️ **Cảnh báo sắp hết hàng!**' : '✅ Tồn kho an toàn';
        const msg = `📦 **Kho hàng — Sản phẩm ${first.name}:**\n` +
          `• **Số lượng tồn hiện tại:** **${first.stock}** sản phẩm\n` +
          `• **Định mức tối thiểu:** ${first.minStock} sản phẩm\n` +
          `• **Giá bán niêm yết:** ${first.unitPrice.toLocaleString('vi-VN')} đ\n` +
          `• **Trạng thái:** ${statusText}`;

        return {
          success: true,
          status: 'SUCCESS',
          toolName: this.name,
          data: formatted,
          metadata: { total: formatted.length, isAmbiguous: formatted.length > 1 },
          message: msg
        };
      }

      // 2. LOW STOCK ALERTS
      if (input.type === 'low_stock') {
        const lowStockItems = products
          .filter(p => p.stock !== undefined && (Number(p.stock) || 0) <= (Number(p.min_stock) || 5))
          .map(p => ({
            id: p.id,
            name: p.name,
            stock: Number(p.stock) || 0,
            minStock: Number(p.min_stock) || 5,
            price: Number(p.price) || 0
          }));

        if (lowStockItems.length === 0) {
          return {
            success: true,
            status: 'EMPTY_RESULT',
            toolName: this.name,
            data: [],
            message: 'Tất cả sản phẩm trong kho hiện đều ở mức tồn an toàn, không có cảnh báo sắp hết hàng.'
          };
        }

        let msg = `🚨 **Cảnh báo tồn kho (${lowStockItems.length} sản phẩm chạm hoặc dưới mức tối thiểu):**\n`;
        lowStockItems.slice(0, 5).forEach((it, idx) => {
          msg += ` ${idx + 1}. **${it.name}**: còn **${it.stock}** (tối thiểu ${it.minStock})\n`;
        });
        if (lowStockItems.length > 5) {
          msg += ` ... và ${lowStockItems.length - 5} sản phẩm khác.`;
        }

        return {
          success: true,
          status: 'SUCCESS',
          toolName: this.name,
          data: lowStockItems,
          metadata: { total: lowStockItems.length },
          message: msg
        };
      }

      // 3. INVENTORY VALUATION & OVERVIEW
      const totalStock = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
      const totalValuation = products.reduce((acc, p) => {
        const cost = Number(p.cost_price) || Math.round((Number(p.price) || 0) * 0.6);
        return acc + ((Number(p.stock) || 0) * cost);
      }, 0);

      const overviewData = {
        totalProducts: products.length,
        totalStockUnits: totalStock,
        totalAssetValuation: totalValuation,
        formattedValuation: `${totalValuation.toLocaleString('vi-VN')} đ`
      };

      return {
        success: true,
        status: 'SUCCESS',
        toolName: this.name,
        data: overviewData,
        metadata: { total: products.length },
        message: `📊 **Tổng quan kho hàng:** Hiện có **${products.length}** mặt hàng (${totalStock} đơn vị sản phẩm). Tổng giá trị tài sản tồn kho: **${overviewData.formattedValuation}**.`
      };

    } catch (err: any) {
      return {
        success: false,
        status: 'TOOL_ERROR',
        toolName: this.name,
        error: { code: 'INVENTORY_READ_ERROR', message: err.message },
        message: `Lỗi khi tra cứu tồn kho: ${err.message}`
      };
    }
  }
}
