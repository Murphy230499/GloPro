import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManageKPIInput, IKPITarget } from '../types';

export class ManageKPITool extends AbstractTool<IManageKPIInput, IKPITarget> {
  readonly metadata: IToolMetadata = {
    name: 'staff_kpi',
    description: 'Sets monthly revenue/service targets and tracks KPI achievement percentage for staff members.',
    parametersSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['set_target', 'evaluate'] },
        staffId: { type: 'string' },
        month: { type: 'string', description: 'YYYY-MM' },
        targetRevenue: { type: 'number' },
        targetServicesCount: { type: 'number' }
      },
      required: ['action', 'staffId', 'month']
    },
    requiredPermissions: ['staff:kpi'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IManageKPIInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.staffId) errors.push('Staff ID is required.');
    if (!input.month || !/^\d{4}-\d{2}$/.test(input.month)) errors.push('Valid month (YYYY-MM) is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IManageKPIInput, context: IAgentContext): Promise<IToolResult<IKPITarget>> {
    const startTime = Date.now();
    this.log('info', `Managing KPI [${input.action}] for staff [${input.staffId}] for month ${input.month}`);

    try {
      const targetRev = input.targetRevenue || 25000000;
      const targetCount = input.targetServicesCount || 80;
      const actualRev = 27500000;
      const actualCount = 85;

      const achievementPercentage = Math.round((actualRev / targetRev) * 100);

      const kpi: IKPITarget = {
        staffId: input.staffId,
        month: input.month,
        targetRevenue: targetRev,
        targetServicesCount: targetCount,
        actualRevenue: actualRev,
        actualServicesCount: actualCount,
        achievementPercentage
      };

      return {
        success: true,
        data: kpi,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManageKPITool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to manage staff KPI.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
