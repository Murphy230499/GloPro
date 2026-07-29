import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManagePurchaseOrderInput, IPurchaseOrder } from '../types';

export class ManagePurchaseOrderTool extends AbstractTool<IManagePurchaseOrderInput, IPurchaseOrder> {
  readonly metadata: IToolMetadata = {
    name: 'inventory_purchase_order',
    description: 'Creates, approves, or cancels purchasing orders to suppliers for salon inventory restocking. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'approve', 'cancel'] },
        supplierId: { type: 'string' },
        supplierName: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productName: { type: 'string' },
              quantity: { type: 'number' },
              unitPrice: { type: 'number' }
            },
            required: ['productName', 'quantity', 'unitPrice']
          }
        }
      },
      required: ['action', 'supplierName', 'items']
    },
    requiredPermissions: ['inventory:po'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: true
  };

  override validate(input: IManagePurchaseOrderInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.supplierName) errors.push('Supplier name is required.');
    if (!input.items || input.items.length === 0) errors.push('Purchase order must contain at least one item.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IManagePurchaseOrderInput, context: IAgentContext): Promise<IToolResult<IPurchaseOrder>> {
    const startTime = Date.now();
    this.log('info', `Processing purchase order [${input.action}] for supplier [${input.supplierName}]`);

    try {
      const orderItems = input.items.map(it => ({
        ...it,
        total: it.quantity * it.unitPrice
      }));
      const totalAmount = orderItems.reduce((acc, it) => acc + it.total, 0);

      const po: IPurchaseOrder = {
        id: `po_${Date.now()}`,
        orderNumber: `PO-${Date.now().toString().slice(-6)}`,
        supplierId: input.supplierId || 'sup_1',
        supplierName: input.supplierName,
        items: orderItems,
        totalAmount,
        status: input.action === 'approve' ? 'received' : 'ordered',
        created_at: new Date().toISOString()
      };

      await this.audit('PURCHASE_ORDER', input, context, { success: true, data: po, executionTimeMs: 0 });

      return {
        success: true,
        data: po,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManagePurchaseOrderTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process purchase order.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
