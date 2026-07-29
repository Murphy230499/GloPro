import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManageCustomerDebtInput, ICustomer } from '../types';
import { base44 } from '@/api/base44Client';

export class ManageCustomerDebtTool extends AbstractTool<IManageCustomerDebtInput, ICustomer> {
  readonly metadata: IToolMetadata = {
    name: 'customer_debt',
    description: 'Records new outstanding debt or processes debt payments for a customer.',
    parametersSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        action: { type: 'string', enum: ['record_debt', 'pay_debt'] },
        amount: { type: 'number' },
        note: { type: 'string' }
      },
      required: ['customerId', 'action', 'amount']
    },
    requiredPermissions: ['customer:finance'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: false,
    supportsRollback: true
  };

  override validate(input: IManageCustomerDebtInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.customerId) errors.push('Customer ID is required.');
    if (typeof input.amount !== 'number' || input.amount <= 0) errors.push('Amount must be a positive number.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IManageCustomerDebtInput, context: IAgentContext): Promise<IToolResult<ICustomer>> {
    const startTime = Date.now();
    this.log('info', `Managing debt for customer [${input.customerId}]: ${input.action} ${input.amount}`);

    try {
      let cust: ICustomer | null = null;
      try {
        cust = (await base44.entities.Customer.get(input.customerId)) as ICustomer;
      } catch (e) {
        const local: ICustomer[] = JSON.parse(localStorage.getItem('glopro_customers') || '[]');
        cust = local.find(c => c.id === input.customerId) || null;
      }

      if (!cust) throw new Error('Customer not found.');

      let currentDebt = cust.debtAmount || 0;
      if (input.action === 'record_debt') {
        currentDebt += input.amount;
      } else if (input.action === 'pay_debt') {
        currentDebt = Math.max(0, currentDebt - input.amount);
      }

      let updated: ICustomer;
      try {
        updated = (await base44.entities.Customer.update(input.customerId, { debtAmount: currentDebt })) as ICustomer;
      } catch (e) {
        const local: ICustomer[] = JSON.parse(localStorage.getItem('glopro_customers') || '[]');
        const idx = local.findIndex(c => c.id === input.customerId);
        if (idx !== -1) {
          local[idx].debtAmount = currentDebt;
          updated = local[idx];
          localStorage.setItem('glopro_customers', JSON.stringify(local));
        } else {
          throw new Error('Customer not found.');
        }
      }

      await this.audit('DEBT_UPDATE', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManageCustomerDebtTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to update customer debt.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
