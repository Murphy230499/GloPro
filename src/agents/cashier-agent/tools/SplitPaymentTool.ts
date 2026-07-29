import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ISplitPaymentInput, IInvoice } from '../types';
import { base44 } from '@/api/base44Client';

export class SplitPaymentTool extends AbstractTool<ISplitPaymentInput, IInvoice> {
  readonly metadata: IToolMetadata = {
    name: 'cashier_split_payment',
    description: 'Splits an invoice payment across multiple customers or payment methods. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
        splits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string', enum: ['cash', 'transfer', 'card', 'point'] },
              amount: { type: 'number' }
            },
            required: ['method', 'amount']
          }
        }
      },
      required: ['invoiceId', 'splits']
    },
    requiredPermissions: ['invoice:payment'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: true
  };

  override validate(input: ISplitPaymentInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.invoiceId) errors.push('Invoice ID is required.');
    if (!input.splits || input.splits.length === 0) errors.push('At least one payment split is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: ISplitPaymentInput, context: IAgentContext): Promise<IToolResult<IInvoice>> {
    const startTime = Date.now();
    this.log('info', `Splitting payment for invoice [${input.invoiceId}] into ${input.splits.length} parts`);

    try {
      let inv: IInvoice | null = null;
      try {
        inv = (await base44.entities.Invoice.get(input.invoiceId)) as IInvoice;
      } catch (e) {
        const local: IInvoice[] = JSON.parse(localStorage.getItem('glopro_invoices') || '[]');
        inv = local.find(i => i.id === input.invoiceId) || null;
      }

      if (!inv) throw new Error(`Invoice [${input.invoiceId}] not found.`);

      const totalSplitsAmount = input.splits.reduce((acc, s) => acc + s.amount, 0);

      const updates: Partial<IInvoice> = {
        payments: input.splits,
        paidAmount: totalSplitsAmount,
        changeAmount: Math.max(0, totalSplitsAmount - inv.totalAmount)
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

      await this.audit('SPLIT_PAYMENT', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'SplitPaymentTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to split payment.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
