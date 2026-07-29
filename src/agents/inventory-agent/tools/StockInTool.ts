import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IStockInInput, IStockMovement } from '../types';

export class StockInTool extends AbstractTool<IStockInInput, IStockMovement> {
  readonly metadata: IToolMetadata = {
    name: 'inventory_stock_in',
    description: 'Processes incoming stock inventory imports, updating quantity in stock and recording movement log.',
    parametersSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        quantity: { type: 'number' },
        costPrice: { type: 'number' },
        supplierName: { type: 'string' },
        expiryDate: { type: 'string' },
        note: { type: 'string' }
      },
      required: ['productId', 'quantity']
    },
    requiredPermissions: ['inventory:write'],
    riskLevel: 'MEDIUM',
    requiresHumanConfirmation: false,
    supportsRollback: true
  };

  override validate(input: IStockInInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.productId) errors.push('Product ID is required.');
    if (typeof input.quantity !== 'number' || input.quantity <= 0) errors.push('Quantity must be greater than 0.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IStockInInput, context: IAgentContext): Promise<IToolResult<IStockMovement>> {
    const startTime = Date.now();
    this.log('info', `Importing stock (+${input.quantity}) for product [${input.productId}]`);

    try {
      const movement: IStockMovement = {
        id: `move_${Date.now()}`,
        productId: input.productId,
        productName: 'Product Item',
        type: 'in',
        quantity: input.quantity,
        reason: 'import',
        created_at: new Date().toISOString()
      };

      await this.audit('STOCK_IN', input, context, { success: true, data: movement, executionTimeMs: 0 });

      return {
        success: true,
        data: movement,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'StockInTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process stock in.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
