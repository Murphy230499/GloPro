import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IMergeCustomersInput, ICustomer } from '../types';
import { base44 } from '@/api/base44Client';

export class MergeCustomersTool extends AbstractTool<IMergeCustomersInput, ICustomer> {
  readonly metadata: IToolMetadata = {
    name: 'customer_merge',
    description: 'Merges a secondary duplicate customer profile into a primary customer profile, consolidating points, debt, notes, and visit history.',
    parametersSchema: {
      type: 'object',
      properties: {
        primaryCustomerId: { type: 'string', description: 'ID of target primary customer profile to keep' },
        secondaryCustomerId: { type: 'string', description: 'ID of duplicate secondary customer profile to merge & remove' },
        mergeNotes: { type: 'boolean', description: 'Merge notes history' },
        mergePoints: { type: 'boolean', description: 'Merge accumulated loyalty points' }
      },
      required: ['primaryCustomerId', 'secondaryCustomerId']
    },
    requiredPermissions: ['customer:merge'],
    riskLevel: 'CRITICAL',
    requiresHumanConfirmation: true,
    supportsRollback: false
  };

  override validate(input: IMergeCustomersInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.primaryCustomerId || !input.secondaryCustomerId) {
      errors.push('Both primaryCustomerId and secondaryCustomerId are required for merging.');
    }
    if (input.primaryCustomerId === input.secondaryCustomerId) {
      errors.push('Primary and secondary customer IDs cannot be identical.');
    }
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IMergeCustomersInput, context: IAgentContext): Promise<IToolResult<ICustomer>> {
    const startTime = Date.now();
    this.log('warn', `Merging customer [${input.secondaryCustomerId}] into [${input.primaryCustomerId}]`);

    try {
      let list: ICustomer[] = [];
      try {
        list = (await base44.entities.Customer.list()) as ICustomer[];
      } catch (e) {
        list = (await base44.entities.Customer.list().catch(()=>[]));
      }

      const primary = list.find(c => c.id === input.primaryCustomerId);
      const secondary = list.find(c => c.id === input.secondaryCustomerId);

      if (!primary || !secondary) {
        throw new Error('One or both customer profiles could not be found for merging.');
      }

      const mergedPayload: Partial<ICustomer> = {
        loyaltyPoints: (primary.loyaltyPoints || 0) + (input.mergePoints !== false ? (secondary.loyaltyPoints || 0) : 0),
        totalSpent: (primary.totalSpent || 0) + (secondary.totalSpent || 0),
        visitCount: (primary.visitCount || 0) + (secondary.visitCount || 0),
        debtAmount: (primary.debtAmount || 0) + (secondary.debtAmount || 0),
        notes: Array.from(new Set([...(primary.notes || []), ...(secondary.notes || [])]))
      };

      let updated: ICustomer;
      try {
        updated = (await base44.entities.Customer.update(primary.id, mergedPayload)) as ICustomer;
        await base44.entities.Customer.delete(secondary.id);
      } catch (e) {
        const local: ICustomer[] = (await base44.entities.Customer.list().catch(()=>[]));
        const idx = local.findIndex(c => c.id === primary.id);
        if (idx !== -1) {
          local[idx] = { ...local[idx], ...mergedPayload };
          updated = local[idx];
        }
        const filtered = local.filter(c => c.id !== secondary.id);
        // localStorage.setItem replaced with direct Supabase API call above
        updated = local[idx] || primary;
      }

      await this.audit('MERGE', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'MergeCustomersTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to merge customers.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
