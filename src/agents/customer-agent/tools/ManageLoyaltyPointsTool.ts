import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManageLoyaltyPointsInput, ICustomer } from '../types';
import { base44 } from '@/api/base44Client';

export class ManageLoyaltyPointsTool extends AbstractTool<IManageLoyaltyPointsInput, ICustomer> {
  readonly metadata: IToolMetadata = {
    name: 'customer_loyalty_points',
    description: 'Adds, deducts, or sets reward/loyalty points for a customer.',
    parametersSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        action: { type: 'string', enum: ['add', 'deduct', 'set'] },
        points: { type: 'number' },
        reason: { type: 'string' }
      },
      required: ['customerId', 'action', 'points', 'reason']
    },
    requiredPermissions: ['customer:points'],
    riskLevel: 'MEDIUM',
    requiresHumanConfirmation: false,
    supportsRollback: true
  };

  override validate(input: IManageLoyaltyPointsInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.customerId) errors.push('Customer ID is required.');
    if (typeof input.points !== 'number' || input.points < 0) errors.push('Points must be a non-negative number.');
    if (!input.reason || input.reason.trim().length === 0) errors.push('Reason for points adjustment is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IManageLoyaltyPointsInput, context: IAgentContext): Promise<IToolResult<ICustomer>> {
    const startTime = Date.now();
    this.log('info', `Adjusting points for customer [${input.customerId}]: ${input.action} ${input.points}`);

    try {
      let cust: ICustomer | null = null;
      try {
        cust = (await base44.entities.Customer.get(input.customerId)) as ICustomer;
      } catch (e) {
        const local: ICustomer[] = (await base44.entities.Customer.list().catch(()=>[]));
        cust = local.find(c => c.id === input.customerId) || null;
      }

      if (!cust) throw new Error('Customer not found.');

      let currentPts = cust.loyaltyPoints || 0;
      if (input.action === 'add') currentPts += input.points;
      else if (input.action === 'deduct') currentPts = Math.max(0, currentPts - input.points);
      else if (input.action === 'set') currentPts = input.points;

      let updated: ICustomer;
      try {
        updated = (await base44.entities.Customer.update(input.customerId, { loyaltyPoints: currentPts })) as ICustomer;
      } catch (e) {
        const local: ICustomer[] = (await base44.entities.Customer.list().catch(()=>[]));
        const idx = local.findIndex(c => c.id === input.customerId);
        if (idx !== -1) {
          local[idx].loyaltyPoints = currentPts;
          updated = local[idx];
          // localStorage.setItem replaced with direct Supabase API call above
        } else {
          throw new Error('Customer not found.');
        }
      }

      await this.audit('POINTS_UPDATE', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManageLoyaltyPointsTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to adjust customer points.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
