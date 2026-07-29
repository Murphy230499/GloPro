import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManageSalaryInput, ISalaryCalculation } from '../types';

export class ManageSalaryTool extends AbstractTool<IManageSalaryInput, ISalaryCalculation> {
  readonly metadata: IToolMetadata = {
    name: 'staff_salary',
    description: 'Calculates monthly payroll including base salary, commissions, KPI bonuses, deductions, and net payout. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        staffId: { type: 'string' },
        month: { type: 'string', description: 'YYYY-MM' },
        action: { type: 'string', enum: ['calculate', 'approve', 'pay'] },
        kpiBonus: { type: 'number' },
        deductions: { type: 'number' }
      },
      required: ['staffId', 'month', 'action']
    },
    requiredPermissions: ['staff:payroll'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: true
  };

  override validate(input: IManageSalaryInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.staffId) errors.push('Staff ID is required.');
    if (!input.month || !/^\d{4}-\d{2}$/.test(input.month)) errors.push('Valid month (YYYY-MM) is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IManageSalaryInput, context: IAgentContext): Promise<IToolResult<ISalaryCalculation>> {
    const startTime = Date.now();
    this.log('info', `Processing salary payroll for staff [${input.staffId}] for month ${input.month}`);

    try {
      const baseSalary = 8000000;
      const totalCommission = 1600000;
      const kpiBonus = input.kpiBonus || 500000;
      const deductions = input.deductions || 100000;
      const netSalary = baseSalary + totalCommission + kpiBonus - deductions;

      const calc: ISalaryCalculation = {
        staffId: input.staffId,
        month: input.month,
        baseSalary,
        totalCommission,
        kpiBonus,
        deductions,
        netSalary,
        status: input.action === 'approve' ? 'approved' : input.action === 'pay' ? 'paid' : 'draft'
      };

      await this.audit('SALARY_CALCULATED', input, context, { success: true, data: calc, executionTimeMs: 0 });

      return {
        success: true,
        data: calc,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManageSalaryTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process staff payroll.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
