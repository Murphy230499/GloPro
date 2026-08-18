import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IAddServiceToInvoiceInput, IInvoice, IInvoiceItem } from '../types';
import { base44 } from '@/api/base44Client';

export class AddServiceToInvoiceTool extends AbstractTool<IAddServiceToInvoiceInput, IInvoice> {
  readonly metadata: IToolMetadata = {
    name: 'cashier_add_service',
    description: 'Adds a hair/spa service item to a cashier invoice. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
        serviceName: { type: 'string' },
        unitPrice: { type: 'number' },
        quantity: { type: 'number' },
        staffName: { type: 'string' }
      },
      required: ['invoiceId', 'serviceName', 'unitPrice']
    },
    requiredPermissions: ['invoice:update'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: true
  };

  override validate(input: IAddServiceToInvoiceInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.invoiceId) errors.push('Invoice ID is required.');
    if (!input.serviceName) errors.push('Service name is required.');
    if (typeof input.unitPrice !== 'number' || input.unitPrice < 0) errors.push('Unit price must be a non-negative number.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IAddServiceToInvoiceInput, context: IAgentContext): Promise<IToolResult<IInvoice>> {
    const startTime = Date.now();
    const qty = input.quantity || 1;
    this.log('info', `Adding service [${input.serviceName}] (${input.unitPrice}đ x ${qty}) to invoice [${input.invoiceId}]`);

    try {
      let inv: IInvoice | null = null;
      try {
        inv = (await base44.entities.Invoice.get(input.invoiceId)) as IInvoice;
      } catch (e) {
        const local: IInvoice[] = (await base44.entities.Invoice.list().catch(()=>[]));
        inv = local.find(i => i.id === input.invoiceId) || null;
      }

      if (!inv) throw new Error(`Invoice [${input.invoiceId}] not found.`);

      const newItem: IInvoiceItem = {
        id: `item_${Date.now()}_${Math.random()}`,
        type: 'service',
        name: input.serviceName,
        quantity: qty,
        unitPrice: input.unitPrice,
        totalPrice: input.unitPrice * qty,
        staffName: input.staffName || 'Staff'
      };

      const updatedItems = [...(inv.items || []), newItem];
      const newSubtotal = updatedItems.reduce((acc, it) => acc + it.totalPrice, 0);
      const newTotal = Math.max(0, newSubtotal - (inv.discountAmount || 0));

      const updates: Partial<IInvoice> = {
        items: updatedItems,
        subtotal: newSubtotal,
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

      await this.audit('ADD_SERVICE', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'AddServiceToInvoiceTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to add service to invoice.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
