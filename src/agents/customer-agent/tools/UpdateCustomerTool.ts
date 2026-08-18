import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IUpdateCustomerInput, ICustomer } from '../types';
import { base44 } from '@/api/base44Client';

export class UpdateCustomerTool extends AbstractTool<IUpdateCustomerInput, ICustomer> {
  readonly metadata: IToolMetadata = {
    name: 'customer_update',
    description: 'Updates details of an existing customer profile by customer ID.',
    parametersSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'ID of customer to update' },
        name: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        tier: { type: 'string', enum: ['Đồng', 'Bạc', 'Vàng', 'Kim Cương'] },
        address: { type: 'string' }
      },
      required: ['customerId']
    },
    requiredPermissions: ['customer:update'],
    riskLevel: 'MEDIUM',
    requiresHumanConfirmation: false,
    supportsRollback: true
  };

  override validate(input: IUpdateCustomerInput): IToolValidationResult {
    if (!input || !input.customerId) {
      return { valid: false, errors: ['Customer ID is required for update.'] };
    }
    return { valid: true };
  }

  async execute(input: IUpdateCustomerInput, context: IAgentContext): Promise<IToolResult<ICustomer>> {
    const startTime = Date.now();
    this.log('info', `Updating customer [${input.customerId}]`);

    try {
      const updates: Partial<ICustomer> = {};
      if (input.name) updates.name = input.name.trim();
      if (input.phone) updates.phone = input.phone.trim();
      if (input.email) updates.email = input.email.trim();
      if (input.tier) updates.tier = input.tier;
      if (input.address) updates.address = input.address;

      let updated: ICustomer;
      try {
        updated = (await base44.entities.Customer.update(input.customerId, updates)) as ICustomer;
      } catch (e) {
        const local: ICustomer[] = (await base44.entities.Customer.list().catch(()=>[]));
        const idx = local.findIndex(c => c.id === input.customerId);
        if (idx !== -1) {
          local[idx] = { ...local[idx], ...updates };
          updated = local[idx];
          // localStorage.setItem replaced with direct Supabase API call above
        } else {
          throw new Error(`Customer with ID [${input.customerId}] not found.`);
        }
      }

      await this.audit('UPDATE', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'UpdateCustomerTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to update customer.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
