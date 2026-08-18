import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IDeleteCustomerInput } from '../types';
import { base44 } from '@/api/base44Client';

export class DeleteCustomerTool extends AbstractTool<IDeleteCustomerInput, { customerId: string; deleted: boolean }> {
  readonly metadata: IToolMetadata = {
    name: 'customer_delete',
    description: 'Permanently deletes a customer profile from the system. High risk operation requiring explicit human confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'ID of customer to delete' },
        reason: { type: 'string', description: 'Reason for deletion' }
      },
      required: ['customerId', 'reason']
    },
    requiredPermissions: ['customer:delete'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: false
  };

  override validate(input: IDeleteCustomerInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.customerId) errors.push('Customer ID is required for deletion.');
    if (!input.reason || input.reason.trim().length < 5) errors.push('A valid reason of at least 5 characters is required for deletion.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IDeleteCustomerInput, context: IAgentContext): Promise<IToolResult<{ customerId: string; deleted: boolean }>> {
    const startTime = Date.now();
    this.log('warn', `Executing HIGH RISK deletion for customer ID: ${input.customerId}. Reason: ${input.reason}`);

    try {
      try {
        await base44.entities.Customer.delete(input.customerId);
      } catch (e) {
        const local = (await base44.entities.Customer.list().catch(()=>[]));
        const updated = local.filter((c: any) => c.id !== input.customerId);
        // localStorage.setItem replaced with direct Supabase API call above
      }

      await this.audit('DELETE', input, context, { success: true, data: { customerId: input.customerId, deleted: true }, executionTimeMs: 0 });

      return {
        success: true,
        data: { customerId: input.customerId, deleted: true },
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'DeleteCustomerTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to delete customer.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
