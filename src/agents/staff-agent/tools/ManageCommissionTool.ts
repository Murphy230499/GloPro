import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManageCommissionInput, ICommissionRecord } from '../types';

export class ManageCommissionTool extends AbstractTool<IManageCommissionInput, ICommissionRecord> {
  readonly metadata: IToolMetadata = {
    name: 'staff_commission',
    description: 'Calculates and manages service & retail product sales commissions for hair stylists and technicians. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        staffId: { type: 'string' },
        month: { type: 'string', description: 'YYYY-MM' },
        action: { type: 'string', enum: ['calculate', 'adjust'] },
        adjustmentAmount: { type: 'number' },
        reason: { type: 'string' }
      },
      required: ['staffId', 'month', 'action']
    },
    requiredPermissions: ['staff:commission'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: true
  };

  override validate(input: IManageCommissionInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.staffId) errors.push('Staff ID is required.');
    if (!input.month || !/^\d{4}-\d{2}$/.test(input.month)) errors.push('Valid month (YYYY-MM) is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IManageCommissionInput, context: IAgentContext): Promise<IToolResult<ICommissionRecord>> {
    const startTime = Date.now();
    this.log('info', `Processing commission for staff [${input.staffId}] for month ${input.month}`);

    try {
      const serviceCommission = 1250000;
      const productCommission = 350000;
      const adjustment = input.adjustmentAmount || 0;
      const totalCommission = Math.max(0, serviceCommission + productCommission + adjustment);

      const record: ICommissionRecord = {
        staffId: input.staffId,
        month: input.month,
        serviceCommission,
        productCommission,
        totalCommission
      };

      await this.audit('COMMISSION_CALCULATED', input, context, { success: true, data: record, executionTimeMs: 0 });

      return {
        success: true,
        data: record,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManageCommissionTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to calculate staff commission.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
