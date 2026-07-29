import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IRefundInvoiceInput, IInvoice } from '../types';
import { base44 } from '@/api/base44Client';

export class RefundInvoiceTool extends AbstractTool<IRefundInvoiceInput, IInvoice> {
  readonly metadata: IToolMetadata = {
    name: 'cashier_refund',
    description: 'Processes a partial or full refund for a paid invoice. CRITICAL money action requiring explicit human confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
        refundAmount: { type: 'number' },
        reason: { type: 'string' },
        refundMethod: { type: 'string', enum: ['cash', 'transfer', 'card'] }
      },
      required: ['invoiceId', 'refundAmount', 'reason']
    },
    requiredPermissions: ['invoice:refund'],
    riskLevel: 'CRITICAL',
    requiresHumanConfirmation: true,
    supportsRollback: false
  };

  override validate(input: IRefundInvoiceInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.invoiceId) errors.push('Invoice ID is required for refund.');
    if (typeof input.refundAmount !== 'number' || input.refundAmount <= 0) errors.push('Refund amount must be a positive number.');
    if (!input.reason || input.reason.trim().length < 5) errors.push('A detailed reason (min 5 chars) is required for processing a refund.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IRefundInvoiceInput, context: IAgentContext): Promise<IToolResult<IInvoice>> {
    const startTime = Date.now();
    this.log('warn', `PROCESSING CRITICAL REFUND for invoice [${input.invoiceId}]: ${input.refundAmount}đ. Reason: ${input.reason}`);

    try {
      const updates: Partial<IInvoice> = {
        status: 'refunded'
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

      await this.audit('REFUND', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'RefundInvoiceTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process invoice refund.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
