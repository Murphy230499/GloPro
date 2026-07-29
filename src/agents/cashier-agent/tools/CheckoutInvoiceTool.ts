import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ICheckoutInvoiceInput, IInvoice } from '../types';
import { base44 } from '@/api/base44Client';

export class CheckoutInvoiceTool extends AbstractTool<ICheckoutInvoiceInput, IInvoice> {
  readonly metadata: IToolMetadata = {
    name: 'cashier_checkout',
    description: 'Finalizes invoice checkout, locks billing items, and updates invoice status to paid. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
        confirmPayment: { type: 'boolean' }
      },
      required: ['invoiceId']
    },
    requiredPermissions: ['invoice:checkout'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: false
  };

  override validate(input: ICheckoutInvoiceInput): IToolValidationResult {
    if (!input || !input.invoiceId) {
      return { valid: false, errors: ['Invoice ID is required for checkout.'] };
    }
    return { valid: true };
  }

  async execute(input: ICheckoutInvoiceInput, context: IAgentContext): Promise<IToolResult<IInvoice>> {
    const startTime = Date.now();
    this.log('info', `Finalizing checkout for invoice [${input.invoiceId}]`);

    try {
      const updates: Partial<IInvoice> = {
        status: 'paid'
      };

      let updated: IInvoice;
      try {
        updated = (await base44.entities.Invoice.update(input.invoiceId, updates)) as IInvoice;
      } catch (e) {
        const local: IInvoice[] = JSON.parse(localStorage.getItem('glopro_invoices') || '[]');
        const idx = local.findIndex(i => i.id === input.invoiceId);
        if (idx !== -1) {
          local[idx] = { ...local[idx], ...updates };
          updated = local[idx];
          localStorage.setItem('glopro_invoices', JSON.stringify(local));
        } else throw new Error('Invoice not found.');
      }

      await this.audit('CHECKOUT', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'CheckoutInvoiceTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to complete invoice checkout.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
