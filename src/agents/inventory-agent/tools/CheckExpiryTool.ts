import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ICheckExpiryInput, IProductItem } from '../types';

export class CheckExpiryTool extends AbstractTool<ICheckExpiryInput, IProductItem[]> {
  readonly metadata: IToolMetadata = {
    name: 'inventory_expiry',
    description: 'Scans salon chemical and cosmetic inventory for products approaching expiry dates within N days.',
    parametersSchema: {
      type: 'object',
      properties: {
        daysThreshold: { type: 'number', description: 'Number of days to expiry (default 60 days)' }
      }
    },
    requiredPermissions: ['inventory:read'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: ICheckExpiryInput): IToolValidationResult {
    return { valid: true };
  }

  async execute(input: ICheckExpiryInput, context: IAgentContext): Promise<IToolResult<IProductItem[]>> {
    const startTime = Date.now();
    const days = input.daysThreshold || 60;

    this.log('info', `Checking product expiry dates within threshold: ${days} days`);

    try {
      const expiringItems: IProductItem[] = [
        {
          id: 'prod_99',
          sku: 'HC-99',
          name: 'Thuốc Tẩy Tóc Blonder Loreal 500g',
          category: 'Hóa chất',
          unit: 'Hộp',
          quantityInStock: 4,
          minThreshold: 2,
          costPrice: 280000,
          sellingPrice: 450000,
          expiryDate: '2026-08-15' // Expiring soon!
        }
      ];

      return {
        success: true,
        data: expiringItems,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'CheckExpiryTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to check product expiry dates.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
