import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IGetCustomerHistoryInput } from '../types';
import { base44 } from '@/api/base44Client';

export class GetCustomerHistoryTool extends AbstractTool<IGetCustomerHistoryInput, { appointments: any[]; invoices: any[] }> {
  readonly metadata: IToolMetadata = {
    name: 'customer_history',
    description: 'Retrieves visit history, appointment logs, and invoice payment receipts for a customer.',
    parametersSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'ID of customer' },
        limit: { type: 'number', description: 'Max records to fetch' }
      },
      required: ['customerId']
    },
    requiredPermissions: ['customer:read'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IGetCustomerHistoryInput): IToolValidationResult {
    if (!input || !input.customerId) {
      return { valid: false, errors: ['Customer ID is required to fetch history.'] };
    }
    return { valid: true };
  }

  async execute(input: IGetCustomerHistoryInput, context: IAgentContext): Promise<IToolResult<{ appointments: any[]; invoices: any[] }>> {
    const startTime = Date.now();
    this.log('info', `Fetching history for customer ID: ${input.customerId}`);

    try {
      let appointments: any[] = [];
      let invoices: any[] = [];

      try {
        appointments = await base44.entities.Appointment.list();
        invoices = await base44.entities.Invoice.list();
      } catch (e) {
        appointments = JSON.parse(localStorage.getItem('glopro_appointments') || '[]');
        invoices = JSON.parse(localStorage.getItem('glopro_invoices') || '[]');
      }

      const custAppts = appointments.filter((a: any) => String(a.customer_id) === String(input.customerId) || a.customer_name);
      const custInvoices = invoices.filter((i: any) => String(i.customer_id) === String(input.customerId) || i.customer_name);

      const limit = input.limit || 10;
      return {
        success: true,
        data: {
          appointments: custAppts.slice(0, limit),
          invoices: custInvoices.slice(0, limit)
        },
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'GetCustomerHistoryTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to fetch customer history.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
