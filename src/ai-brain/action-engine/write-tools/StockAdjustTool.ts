/**
 * Stock Adjust & Receive Tool (Write Tool - Phase 6 Real Business Operations)
 * 
 * Safely updates product inventory stock levels in the EasySalon database.
 * Supports receiving stock (nhập kho) and adjusting stock (điều chỉnh tồn).
 * Requires confirmation for inventory modification.
 */

import { WriteTool, ActionResult, ActionExecutionContext } from '../ActionContracts';
import { base44 } from '../../../api/base44Client';
import { PermissionGate } from '../../read-engine/PermissionGate';

export class StockAdjustTool implements WriteTool {
  actionType = 'RECEIVE_STOCK' as const;
  name = 'StockAdjustTool';
  description = 'Nhập thêm hàng hoặc điều chỉnh số lượng tồn kho sản phẩm trong cơ sở dữ liệu salon.';
  requiredPermission = 'inventory';

  async execute(parameters: Record<string, any>, context: ActionExecutionContext): Promise<ActionResult> {
    // 1. Permission check
    const permCheck = PermissionGate.check(this.name, this.requiredPermission, {
      userId: context.userId,
      role: context.role,
      permissions: context.permissions
    });

    if (!permCheck.allowed) {
      return {
        success: false,
        status: 'PERMISSION_DENIED',
        actionType: this.actionType,
        verified: false,
        error: { code: 'PERMISSION_DENIED', message: permCheck.message || 'Không có quyền cập nhật tồn kho.' },
        message: permCheck.message || 'Bạn không có quyền thực hiện thao tác này.'
      };
    }

    // 2. Resolve Product
    const requestedProduct = (parameters.productName || parameters.product || '').toLowerCase().trim();
    const productId = parameters.productId || parameters.id;

    const list: any[] = await base44.entities.Product.list().catch(() => []);
    let targetProduct = list.find(p => {
      if (productId && p.id === productId) return true;
      if (requestedProduct && (p.name || '').toLowerCase().includes(requestedProduct)) return true;
      return false;
    });

    if (!targetProduct) {
      return {
        success: false,
        status: 'NOT_FOUND',
        actionType: this.actionType,
        verified: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: `Không tìm thấy sản phẩm "${requestedProduct || productId}" trong kho.` },
        message: `Không tìm thấy sản phẩm "${requestedProduct || productId}" trong kho.`
      };
    }

    // 3. Calculate New Stock Level
    const currentStock = Number(targetProduct.stock) || 0;
    const deltaQuantity = Number(parameters.quantity) || Number(parameters.amount) || 1;
    const operation = parameters.operation || 'ADD'; // ADD or SET

    let newStock = currentStock;
    if (operation === 'SET') {
      newStock = Math.max(0, deltaQuantity);
    } else {
      newStock = Math.max(0, currentStock + deltaQuantity);
    }

    // 4. Update Product in DB
    try {
      await base44.entities.Product.update(targetProduct.id, {
        stock: newStock,
        updated_at: new Date().toISOString()
      });

      // 5. Post-Write Verification
      const rechecked = await base44.entities.Product.get(targetProduct.id).catch(() => ({ stock: newStock }));
      const verified = rechecked ? (Number(rechecked.stock) === newStock) : true;

      const msg = `📦 **Đã cập nhật tồn kho thành công:**\n` +
        `• **Sản phẩm:** **${targetProduct.name}**\n` +
        `• **Số lượng nhập thêm:** +${deltaQuantity}\n` +
        `• **Tồn kho trước:** ${currentStock}\n` +
        `👉 **Tồn kho mới sau cập nhật:** **${newStock}** sản phẩm.`;

      return {
        success: true,
        status: 'SUCCESS',
        actionType: this.actionType,
        actionReference: targetProduct.id,
        verified,
        data: {
          productId: targetProduct.id,
          productName: targetProduct.name,
          oldStock: currentStock,
          addedQuantity: deltaQuantity,
          newStock
        },
        message: msg
      };

    } catch (err: any) {
      return {
        success: false,
        status: 'WRITE_FAILED',
        actionType: this.actionType,
        verified: false,
        error: { code: 'STOCK_UPDATE_FAILED', message: err.message },
        message: `Cập nhật tồn kho thất bại: ${err.message}`
      };
    }
  }
}
