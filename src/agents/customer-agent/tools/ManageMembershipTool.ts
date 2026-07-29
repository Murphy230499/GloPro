import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManageMembershipInput, ICustomer } from '../types';
import { base44 } from '@/api/base44Client';

export class ManageMembershipTool extends AbstractTool<IManageMembershipInput, ICustomer> {
  readonly metadata: IToolMetadata = {
    name: 'customer_membership',
    description: 'Upgrades or modifies customer membership tier (Đồng, Bạc, Vàng, Kim Cương).',
    parametersSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'Customer ID' },
        newTier: { type: 'string', enum: ['Đồng', 'Bạc', 'Vàng', 'Kim Cương'] },
        reason: { type: 'string' }
      },
      required: ['customerId', 'newTier']
    },
    requiredPermissions: ['customer:update'],
    riskLevel: 'MEDIUM',
    requiresHumanConfirmation: false,
    supportsRollback: true
  };

  override validate(input: IManageMembershipInput): IToolValidationResult {
    const validTiers = ['Đồng', 'Bạc', 'Vàng', 'Kim Cương'];
    if (!input || !input.customerId || !validTiers.includes(input.newTier)) {
      return { valid: false, errors: ['Valid customerId and tier (Đồng, Bạc, Vàng, Kim Cương) are required.'] };
    }
    return { valid: true };
  }

  async execute(input: IManageMembershipInput, context: IAgentContext): Promise<IToolResult<ICustomer>> {
    const startTime = Date.now();
    this.log('info', `Updating membership tier for customer [${input.customerId}] to ${input.newTier}`);

    try {
      let updated: ICustomer;
      try {
        updated = (await base44.entities.Customer.update(input.customerId, { tier: input.newTier })) as ICustomer;
      } catch (e) {
        const local: ICustomer[] = JSON.parse(localStorage.getItem('glopro_customers') || '[]');
        const idx = local.findIndex(c => c.id === input.customerId);
        if (idx !== -1) {
          local[idx].tier = input.newTier;
          updated = local[idx];
          localStorage.setItem('glopro_customers', JSON.stringify(local));
        } else {
          throw new Error('Customer not found.');
        }
      }

      await this.audit('MEMBERSHIP_UPDATE', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManageMembershipTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to update membership tier.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
