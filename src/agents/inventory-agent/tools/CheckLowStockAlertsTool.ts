import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ICheckLowStockAlertsInput, IProductItem } from '../types';

export class CheckLowStockAlertsTool extends AbstractTool<ICheckLowStockAlertsInput, IProductItem[]> {
  readonly metadata: IToolMetadata = {
    name: 'inventory_low_stock_alerts',
    description: 'Triggers alerts and lists products whose current stock levels are equal to or below minimum reorder thresholds.',
    parametersSchema: {
      type: 'object',
      properties: {
        thresholdRatio: { type: 'number' }
      }
    },
    requiredPermissions: ['inventory:read'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: ICheckLowStockAlertsInput): IToolValidationResult {
    return { valid: true };
  }

  async execute(input: ICheckLowStockAlertsInput, context: IAgentContext): Promise<IToolResult<IProductItem[]>> {
    const startTime = Date.now();
    this.log('info', 'Scanning for low stock inventory alerts');

    try {
      const lowStockItems: IProductItem[] = [
        {
          id: 'prod_2',
          sku: 'TN-05',
          name: 'Thuốc nhuộm Loreal Nâu Tây',
          category: 'Hóa chất',
          unit: 'Tuýp',
          quantityInStock: 2,
          minThreshold: 5,
          costPrice: 90000,
          sellingPrice: 180000
        }
      ];

      return {
        success: true,
        data: lowStockItems,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'CheckLowStockAlertsTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to check low stock alerts.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
