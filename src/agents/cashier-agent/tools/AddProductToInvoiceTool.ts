import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IAddProductToInvoiceInput, IInvoice, IInvoiceItem } from '../types';
import { base44 } from '@/api/base44Client';

export class AddProductToInvoiceTool extends AbstractTool<IAddProductToInvoiceInput, IInvoice> {
  readonly metadata: IToolMetadata = {
    name: 'cashier_add_product',
    description: 'Adds a retail product item (shampoo, hair wax, serum) to a cashier invoice. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
        productName: { type: 'string' },
        unitPrice: { type: 'number' },
        quantity: { type: 'number' }
      },
      required: ['invoiceId', 'productName', 'unitPrice']
    },
    requiredPermissions: ['invoice:update'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: true
  };

  override validate(input: IAddProductToInvoiceInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.invoiceId) errors.push('Invoice ID is required.');
    if (!input.productName) errors.push('Product name is required.');
    if (typeof input.unitPrice !== 'number' || input.unitPrice < 0) errors.push('Unit price must be a non-negative number.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IAddProductToInvoiceInput, context: IAgentContext): Promise<IToolResult<IInvoice>> {
    const startTime = Date.now();
    const qty = input.quantity || 1;
    this.log('info', `Adding product [${input.productName}] (${input.unitPrice}đ x ${qty}) to invoice [${input.invoiceId}]`);

    try {
      let inv: IInvoice | null = null;
      try {
        inv = (await base44.entities.Invoice.get(input.invoiceId)) as IInvoice;
      } catch (e) {
        const local: IInvoice[] = JSON.parse(localStorage.getItem('glopro_invoices') || '[]');
        inv = local.find(i => i.id === input.invoiceId) || null;
      }

      if (!inv) throw new Error(`Invoice [${input.invoiceId}] not found.`);

      const newItem: IInvoiceItem = {
        id: `prod_${Date.now()}_${Math.random()}`,
        type: 'product',
        name: input.productName,
        quantity: qty,
        unitPrice: input.unitPrice,
        totalPrice: input.unitPrice * qty
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
        const local: IInvoice[] = JSON.parse(localStorage.getItem('glopro_invoices') || '[]');
        const idx = local.findIndex(i => i.id === input.invoiceId);
        if (idx !== -1) {
          local[idx] = { ...local[idx], ...updates };
          updated = local[idx];
          localStorage.setItem('glopro_invoices', JSON.stringify(local));
        } else throw new Error('Invoice not found.');
      }

      await this.audit('ADD_PRODUCT', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'AddProductToInvoiceTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to add product to invoice.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
