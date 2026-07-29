import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IGetCustomerStatisticsInput, ICustomer } from '../types';
import { base44 } from '@/api/base44Client';

export interface ICustomerStatistics {
  totalCustomers: number;
  tierDistribution: Record<string, number>;
  totalSpentAllCustomers: number;
  averageSpentPerCustomer: number;
  totalDebt: number;
}

export class GetCustomerStatisticsTool extends AbstractTool<IGetCustomerStatisticsInput, ICustomerStatistics> {
  readonly metadata: IToolMetadata = {
    name: 'customer_statistics',
    description: 'Computes analytical metrics, tier breakdown, total spending, and outstanding debt for all customer profiles.',
    parametersSchema: {
      type: 'object',
      properties: {
        timeframe: { type: 'string', enum: ['day', 'week', 'month', 'year', 'all'] },
        tierFilter: { type: 'string' }
      }
    },
    requiredPermissions: ['customer:analytics'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IGetCustomerStatisticsInput): IToolValidationResult {
    return { valid: true };
  }

  async execute(input: IGetCustomerStatisticsInput, context: IAgentContext): Promise<IToolResult<ICustomerStatistics>> {
    const startTime = Date.now();
    this.log('info', 'Computing customer statistics metrics');

    try {
      let list: ICustomer[] = [];
      try {
        list = (await base44.entities.Customer.list()) as ICustomer[];
      } catch (e) {
        list = JSON.parse(localStorage.getItem('glopro_customers') || '[]');
      }

      const totalCustomers = list.length;
      const tierDistribution: Record<string, number> = { 'Đồng': 0, 'Bạc': 0, 'Vàng': 0, 'Kim Cương': 0 };
      let totalSpentAllCustomers = 0;
      let totalDebt = 0;

      list.forEach(c => {
        const tier = c.tier || 'Đồng';
        tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
        totalSpentAllCustomers += c.totalSpent || 0;
        totalDebt += c.debtAmount || 0;
      });

      const averageSpentPerCustomer = totalCustomers > 0 ? Math.round(totalSpentAllCustomers / totalCustomers) : 0;

      const stats: ICustomerStatistics = {
        totalCustomers,
        tierDistribution,
        totalSpentAllCustomers,
        averageSpentPerCustomer,
        totalDebt
      };

      return {
        success: true,
        data: stats,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'GetCustomerStatisticsTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to compute customer statistics.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
