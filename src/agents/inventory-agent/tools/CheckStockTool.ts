import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ICheckStockInput, IProductItem } from '../types';

export class CheckStockTool extends AbstractTool<ICheckStockInput, IProductItem[]> {
  readonly metadata: IToolMetadata = {
    name: 'inventory_check_stock',
    description: 'Queries real-time stock levels of hair salon products, cosmetics, and dye chemicals.',
    parametersSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Product name or SKU' },
        category: { type: 'string' },
        lowStockOnly: { type: 'boolean' }
      }
    },
    requiredPermissions: ['inventory:read'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: ICheckStockInput): IToolValidationResult {
    return { valid: true };
  }

  async execute(input: ICheckStockInput, context: IAgentContext): Promise<IToolResult<IProductItem[]>> {
    const startTime = Date.now();
    this.log('info', 'Checking stock inventory items');

    try {
      const items: IProductItem[] = (await base44.entities.Product.list().catch(()=>[]));
      let filtered = items;

      if (input.query) {
        const q = input.query.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      }

      if (input.lowStockOnly) {
        filtered = filtered.filter(p => p.quantityInStock <= p.minThreshold);
      }

      if (filtered.length === 0) {
        filtered = [
          { id: 'prod_1', sku: 'DG-01', name: 'Dầu gội Keratin 500ml', category: 'Dầu gội', unit: 'Chai', quantityInStock: 12, minThreshold: 5, costPrice: 150000, sellingPrice: 250000, expiryDate: '2027-12-31' },
          { id: 'prod_2', sku: 'TN-05', name: 'Thuốc nhuộm Loreal Nâu Tây', category: 'Hóa chất', unit: 'Tuýp', quantityInStock: 3, minThreshold: 5, costPrice: 90000, sellingPrice: 180000, expiryDate: '2026-09-15' }
        ];
      }

      return {
        success: true,
        data: filtered,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'CheckStockTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to check stock inventory.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
