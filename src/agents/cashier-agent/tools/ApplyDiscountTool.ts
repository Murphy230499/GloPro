import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IApplyDiscountInput, IInvoice } from '../types';
import { base44 } from '@/api/base44Client';

export class ApplyDiscountTool extends AbstractTool<IApplyDiscountInput, IInvoice> {
  readonly metadata: IToolMetadata = {
    name: 'cashier_apply_discount',
    description: 'Applies a custom percentage or fixed currency discount to a cashier invoice. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
        discountType: { type: 'string', enum: ['percentage', 'fixed'] },
        discountValue: { type: 'number' },
        reason: { type: 'string' }
      },
      required: ['invoiceId', 'discountType', 'discountValue']
    },
    requiredPermissions: ['invoice:discount'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: true
  };

  override validate(input: IApplyDiscountInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.invoiceId) errors.push('Invoice ID is required.');
    if (typeof input.discountValue !== 'number' || input.discountValue <= 0) errors.push('Discount value must be greater than 0.');
    if (input.discountType === 'percentage' && input.discountValue > 100) errors.push('Percentage discount cannot exceed 100%.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IApplyDiscountInput, context: IAgentContext): Promise<IToolResult<IInvoice>> {
    const startTime = Date.now();
    this.log('info', `Applying ${input.discountType} discount (${input.discountValue}) to invoice [${input.invoiceId}]`);

    try {
      let inv: IInvoice | null = null;
      try {
        inv = (await base44.entities.Invoice.get(input.invoiceId)) as IInvoice;
      } catch (e) {
        const local: IInvoice[] = JSON.parse(localStorage.getItem('glopro_invoices') || '[]');
        inv = local.find(i => i.id === input.invoiceId) || null;
      }

      if (!inv) throw new Error(`Invoice [${input.invoiceId}] not found.`);

      const subtotal = inv.subtotal || 0;
      let discAmount = 0;
      if (input.discountType === 'percentage') {
        discAmount = Math.round((subtotal * input.discountValue) / 100);
      } else {
        discAmount = Math.min(subtotal, input.discountValue);
      }

      const newTotal = Math.max(0, subtotal - discAmount);

      const updates: Partial<IInvoice> = {
        discountAmount: discAmount,
        discountPercentage: input.discountType === 'percentage' ? input.discountValue : undefined,
        totalAmount: newTotal
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

      await this.audit('APPLY_DISCOUNT', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ApplyDiscountTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to apply discount.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
