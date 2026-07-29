import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ICreateInvoiceInput, IInvoice } from '../types';
import { base44 } from '@/api/base44Client';

export class CreateInvoiceTool extends AbstractTool<ICreateInvoiceInput, IInvoice> {
  readonly metadata: IToolMetadata = {
    name: 'cashier_create_invoice',
    description: 'Creates a new cashier billing invoice for a customer. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        customerName: { type: 'string' },
        customerPhone: { type: 'string' }
      },
      required: ['customerName', 'customerPhone']
    },
    requiredPermissions: ['invoice:create'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: true
  };

  override validate(input: ICreateInvoiceInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.customerName) errors.push('Customer name is required.');
    if (!input.customerPhone) errors.push('Customer phone number is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: ICreateInvoiceInput, context: IAgentContext): Promise<IToolResult<IInvoice>> {
    const startTime = Date.now();
    this.log('info', `Creating invoice for customer: ${input.customerName} (${input.customerPhone})`);

    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const payload: Partial<IInvoice> = {
        invoiceNumber,
        customerId: input.customerId || `cust_${Date.now()}`,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        items: [],
        subtotal: 0,
        discountAmount: 0,
        totalAmount: 0,
        payments: [],
        paidAmount: 0,
        changeAmount: 0,
        status: 'draft',
        created_at: new Date().toISOString()
      };

      let created: IInvoice;
      try {
        created = (await base44.entities.Invoice.create(payload)) as IInvoice;
      } catch (e) {
        const local = JSON.parse(localStorage.getItem('glopro_invoices') || '[]');
        created = { id: `inv_${Date.now()}`, ...payload } as IInvoice;
        local.push(created);
        localStorage.setItem('glopro_invoices', JSON.stringify(local));
      }

      await this.audit('CREATE_INVOICE', input, context, { success: true, data: created, executionTimeMs: 0 });

      return {
        success: true,
        data: created,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'CreateInvoiceTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to create invoice.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
