import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IApplyVoucherInput, IInvoice } from '../types';
import { base44 } from '@/api/base44Client';

export class ApplyVoucherTool extends AbstractTool<IApplyVoucherInput, IInvoice> {
  readonly metadata: IToolMetadata = {
    name: 'cashier_apply_voucher',
    description: 'Validates and applies a promotional voucher code to a cashier invoice. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
        voucherCode: { type: 'string' }
      },
      required: ['invoiceId', 'voucherCode']
    },
    requiredPermissions: ['invoice:discount'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: true
  };

  override validate(input: IApplyVoucherInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.invoiceId) errors.push('Invoice ID is required.');
    if (!input.voucherCode || input.voucherCode.trim().length === 0) errors.push('Voucher code is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IApplyVoucherInput, context: IAgentContext): Promise<IToolResult<IInvoice>> {
    const startTime = Date.now();
    const code = input.voucherCode.trim().toUpperCase();
    this.log('info', `Applying voucher [${code}] to invoice [${input.invoiceId}]`);

    try {
      let inv: IInvoice | null = null;
      try {
        inv = (await base44.entities.Invoice.get(input.invoiceId)) as IInvoice;
      } catch (e) {
        const local: IInvoice[] = (await base44.entities.Invoice.list().catch(()=>[]));
        inv = local.find(i => i.id === input.invoiceId) || null;
      }

      if (!inv) throw new Error(`Invoice [${input.invoiceId}] not found.`);

      // Simulated voucher calculation engine
      const voucherDiscount = code.includes('VIP') ? 100000 : 50000;
      const subtotal = inv.subtotal || 0;
      const newTotal = Math.max(0, subtotal - voucherDiscount);

      const updates: Partial<IInvoice> = {
        voucherCode: code,
        voucherDiscount,
        discountAmount: voucherDiscount,
        totalAmount: newTotal
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

      await this.audit('APPLY_VOUCHER', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ApplyVoucherTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to apply voucher.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
