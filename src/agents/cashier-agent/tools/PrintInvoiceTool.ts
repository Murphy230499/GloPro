import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IPrintInvoiceInput, IInvoice } from '../types';
import { base44 } from '@/api/base44Client';

export interface IPrintInvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  formattedReceiptText: string;
  format: string;
}

export class PrintInvoiceTool extends AbstractTool<IPrintInvoiceInput, IPrintInvoiceResult> {
  readonly metadata: IToolMetadata = {
    name: 'cashier_print_invoice',
    description: 'Formats and sends invoice details to thermal receipt printer or PDF preview generator.',
    parametersSchema: {
      type: 'object',
      properties: {
        invoiceId: { type: 'string' },
        format: { type: 'string', enum: ['thermal_80mm', 'a5', 'pdf'] }
      },
      required: ['invoiceId']
    },
    requiredPermissions: ['invoice:read'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IPrintInvoiceInput): IToolValidationResult {
    if (!input || !input.invoiceId) {
      return { valid: false, errors: ['Invoice ID is required for printing.'] };
    }
    return { valid: true };
  }

  async execute(input: IPrintInvoiceInput, context: IAgentContext): Promise<IToolResult<IPrintInvoiceResult>> {
    const startTime = Date.now();
    const fmt = input.format || 'thermal_80mm';

    this.log('info', `Printing invoice [${input.invoiceId}] in format ${fmt}`);

    try {
      let inv: IInvoice | null = null;
      try {
        inv = (await base44.entities.Invoice.get(input.invoiceId)) as IInvoice;
      } catch (e) {
        const local: IInvoice[] = JSON.parse(localStorage.getItem('glopro_invoices') || '[]');
        inv = local.find(i => i.id === input.invoiceId) || null;
      }

      if (!inv) throw new Error(`Invoice [${input.invoiceId}] not found.`);

      const receiptLines = [
        '========================================',
        '           GLOPRO SALON & SPA           ',
        '========================================',
        `HÓA ĐƠN THANH TOÁN: ${inv.invoiceNumber}`,
        `Khách hàng: ${inv.customerName} (${inv.customerPhone})`,
        `Ngày: ${new Date(inv.created_at || Date.now()).toLocaleString('vi-VN')}`,
        '----------------------------------------',
        ...(inv.items || []).map(i => `${i.name} (${i.quantity}x) : ${i.totalPrice.toLocaleString('vi-VN')}đ`),
        '----------------------------------------',
        `Tạm tính: ${inv.subtotal.toLocaleString('vi-VN')}đ`,
        `Giảm giá: -${(inv.discountAmount || 0).toLocaleString('vi-VN')}đ`,
        `TỔNG CỘNG: ${inv.totalAmount.toLocaleString('vi-VN')}đ`,
        '========================================',
        '      Cảm ơn quý khách & Hẹn gặp lại!    '
      ];

      const result: IPrintInvoiceResult = {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        formattedReceiptText: receiptLines.join('\n'),
        format: fmt
      };

      return {
        success: true,
        data: result,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'PrintInvoiceTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to print invoice.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
