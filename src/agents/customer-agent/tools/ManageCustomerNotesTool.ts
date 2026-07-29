import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManageCustomerNotesInput, ICustomer } from '../types';
import { base44 } from '@/api/base44Client';

export class ManageCustomerNotesTool extends AbstractTool<IManageCustomerNotesInput, ICustomer> {
  readonly metadata: IToolMetadata = {
    name: 'customer_notes',
    description: 'Adds or removes internal notes, service preferences, or allergy warnings for a customer.',
    parametersSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        action: { type: 'string', enum: ['add', 'remove'] },
        noteText: { type: 'string' }
      },
      required: ['customerId', 'action', 'noteText']
    },
    requiredPermissions: ['customer:update'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IManageCustomerNotesInput): IToolValidationResult {
    if (!input || !input.customerId || !input.noteText || input.noteText.trim().length === 0) {
      return { valid: false, errors: ['Customer ID and non-empty noteText are required.'] };
    }
    return { valid: true };
  }

  async execute(input: IManageCustomerNotesInput, context: IAgentContext): Promise<IToolResult<ICustomer>> {
    const startTime = Date.now();
    this.log('info', `Managing notes for customer [${input.customerId}]`);

    try {
      let cust: ICustomer | null = null;
      try {
        cust = (await base44.entities.Customer.get(input.customerId)) as ICustomer;
      } catch (e) {
        const local: ICustomer[] = JSON.parse(localStorage.getItem('glopro_customers') || '[]');
        cust = local.find(c => c.id === input.customerId) || null;
      }

      if (!cust) throw new Error('Customer not found.');

      let currentNotes = cust.notes || [];
      if (input.action === 'add') {
        currentNotes.push(input.noteText.trim());
      } else if (input.action === 'remove') {
        currentNotes = currentNotes.filter(n => n !== input.noteText.trim());
      }

      let updated: ICustomer;
      try {
        updated = (await base44.entities.Customer.update(input.customerId, { notes: currentNotes })) as ICustomer;
      } catch (e) {
        const local: ICustomer[] = JSON.parse(localStorage.getItem('glopro_customers') || '[]');
        const idx = local.findIndex(c => c.id === input.customerId);
        if (idx !== -1) {
          local[idx].notes = currentNotes;
          updated = local[idx];
          localStorage.setItem('glopro_customers', JSON.stringify(local));
        } else {
          throw new Error('Customer not found.');
        }
      }

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManageCustomerNotesTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to update customer notes.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
