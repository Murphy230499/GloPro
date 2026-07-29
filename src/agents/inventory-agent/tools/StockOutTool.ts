import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IStockOutInput, IStockMovement } from '../types';

export class StockOutTool extends AbstractTool<IStockOutInput, IStockMovement> {
  readonly metadata: IToolMetadata = {
    name: 'inventory_stock_out',
    description: 'Processes stock export, internal salon service usage deductions, or damaged/expired item write-offs.',
    parametersSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        quantity: { type: 'number' },
        reason: { type: 'string', enum: ['sale', 'usage', 'damaged', 'expired'] },
        note: { type: 'string' }
      },
      required: ['productId', 'quantity', 'reason']
    },
    requiredPermissions: ['inventory:write'],
    riskLevel: 'MEDIUM',
    requiresHumanConfirmation: false,
    supportsRollback: true
  };

  override validate(input: IStockOutInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.productId) errors.push('Product ID is required.');
    if (typeof input.quantity !== 'number' || input.quantity <= 0) errors.push('Quantity must be greater than 0.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IStockOutInput, context: IAgentContext): Promise<IToolResult<IStockMovement>> {
    const startTime = Date.now();
    this.log('info', `Deducting stock (-${input.quantity}) for product [${input.productId}]. Reason: ${input.reason}`);

    try {
      const movement: IStockMovement = {
        id: `move_${Date.now()}`,
        productId: input.productId,
        productName: 'Product Item',
        type: 'out',
        quantity: input.quantity,
        reason: input.reason,
        created_at: new Date().toISOString()
      };

      await this.audit('STOCK_OUT', input, context, { success: true, data: movement, executionTimeMs: 0 });

      return {
        success: true,
        data: movement,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'StockOutTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process stock out.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
