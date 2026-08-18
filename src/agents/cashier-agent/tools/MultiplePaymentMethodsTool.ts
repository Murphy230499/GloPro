import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IMultiplePaymentMethodsInput, IInvoice } from '../types';
import { base44 } from '@/api/base44Client';

export class MultiplePaymentMethodsTool extends AbstractTool<IMultiplePaymentMethodsInput, IInvoice> {
  readonly metadata: IToolMetadata = {
    name: 'cashier_multiple_payment_methods',
    description: 'Processes combined payment using cash, bank transfer, credit card, and loyalty points. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string', enum: ['cash', 'transfer', 'card', 'point'] },
              amount: { type: 'number' },
              referenceNumber: { type: 'string' }
            },
            required: ['method', 'amount']
          }
        }
      },
      required: ['invoiceId', 'payments']
    },
    requiredPermissions: ['invoice:payment'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: true
  };

  override validate(input: IMultiplePaymentMethodsInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.invoiceId) errors.push('Invoice ID is required.');
    if (!input.payments || input.payments.length === 0) errors.push('At least one payment method is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IMultiplePaymentMethodsInput, context: IAgentContext): Promise<IToolResult<IInvoice>> {
    const startTime = Date.now();
    this.log('info', `Applying multiple payment methods for invoice [${input.invoiceId}]`);

    try {
      let inv: IInvoice | null = null;
      try {
        inv = (await base44.entities.Invoice.get(input.invoiceId)) as IInvoice;
      } catch (e) {
        const local: IInvoice[] = (await base44.entities.Invoice.list().catch(()=>[]));
        inv = local.find(i => i.id === input.invoiceId) || null;
      }

      if (!inv) throw new Error(`Invoice [${input.invoiceId}] not found.`);

      const totalPaid = input.payments.reduce((acc, p) => acc + p.amount, 0);

      const updates: Partial<IInvoice> = {
        payments: input.payments,
        paidAmount: totalPaid,
        changeAmount: Math.max(0, totalPaid - inv.totalAmount)
      };

      let updated: IInvoice;
      try {
        updated = (await base44.entities.Invoice.update(input.invoiceId, updates)) as IInvoice;
      } catch (e) {
        const local: IInvoice[] = (await base44.entities.Invoice.list().catch(()=>[]));
        const idx = local.findIndex(i => i.id === input.invoiceId);
        if (idx !== -1) {
          local[idx] = { ...local[idx], ...updates };
          updated = local[idx];
          // localStorage.setItem replaced with direct Supabase API call above
        } else throw new Error('Invoice not found.');
      }

      await this.audit('MULTIPLE_PAYMENTS', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'MultiplePaymentMethodsTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process payment methods.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
