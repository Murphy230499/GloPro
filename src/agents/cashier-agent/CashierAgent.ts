import {
  BaseAgent,
  IAgentMetadata,
  IAgentResponse,
  IAgentContext,
  IPromptBuilder,
  IToolExecutor,
  IConversationMemory,
  IEventBus,
  ILogger,
  IToolRegistry
} from '@/ai-core';

import { CreateInvoiceTool } from './tools/CreateInvoiceTool';
import { AddServiceToInvoiceTool } from './tools/AddServiceToInvoiceTool';
import { AddProductToInvoiceTool } from './tools/AddProductToInvoiceTool';
import { ApplyDiscountTool } from './tools/ApplyDiscountTool';
import { ApplyVoucherTool } from './tools/ApplyVoucherTool';
import { SplitPaymentTool } from './tools/SplitPaymentTool';
import { MultiplePaymentMethodsTool } from './tools/MultiplePaymentMethodsTool';
import { CheckoutInvoiceTool } from './tools/CheckoutInvoiceTool';
import { RefundInvoiceTool } from './tools/RefundInvoiceTool';
import { PrintInvoiceTool } from './tools/PrintInvoiceTool';

export class CashierAgent extends BaseAgent {
  readonly metadata: IAgentMetadata = {
    id: 'agent_cashier_pos',
    name: 'Cashier & POS Financial Billing Agent',
    description: 'Specialized AI agent for creating invoices, adding services & products, applying discounts & vouchers, processing split/multiple payment methods, checkout, refunds, and printing receipts with strict human confirmation enforcement on all money actions.',
    version: '1.0.0',
    capabilities: [
      'cashier_create_invoice',
      'cashier_add_service',
      'cashier_add_product',
      'cashier_apply_discount',
      'cashier_apply_voucher',
      'cashier_split_payment',
      'cashier_multiple_payment_methods',
      'cashier_checkout',
      'cashier_refund',
      'cashier_print_invoice'
    ]
  };

  constructor(
    promptBuilder: IPromptBuilder,
    toolExecutor: IToolExecutor,
    memory: IConversationMemory,
    eventBus: IEventBus,
    logger: ILogger,
    toolRegistry: IToolRegistry
  ) {
    super(promptBuilder, toolExecutor, memory, eventBus, logger);

    // Auto-register all 10 specialized Cashier Tools
    const tools = [
      new CreateInvoiceTool(logger),
      new AddServiceToInvoiceTool(logger),
      new AddProductToInvoiceTool(logger),
      new ApplyDiscountTool(logger),
      new ApplyVoucherTool(logger),
      new SplitPaymentTool(logger),
      new MultiplePaymentMethodsTool(logger),
      new CheckoutInvoiceTool(logger),
      new RefundInvoiceTool(logger),
      new PrintInvoiceTool(logger)
    ];

    tools.forEach(tool => {
      if (!toolRegistry.hasTool(tool.metadata.name)) {
        toolRegistry.register(tool);
      }
    });
  }

  protected async runAgentLoop(prompt: string, query: string, context: IAgentContext): Promise<IAgentResponse> {
    const text = query.toLowerCase();
    const executedCalls: Array<{ toolName: string; args: Record<string, unknown>; result: unknown }> = [];

    let responseContent = 'Tôi có thể giúp bạn tạo hóa đơn, thêm dịch vụ/sản phẩm, áp dụng giảm giá/voucher, chia tiền thanh toán, hoàn tiền và in hóa đơn POS. Tất cả hành động liên quan tới tiền đều yêu cầu quản lý xác nhận!';

    // CREATE INVOICE / BILLING
    if (text.includes('tạo hóa đơn') || text.includes('tính tiền') || text.includes('báo giá')) {
      const nameMatch = query.replace(/(?:tạo|hóa đơn|tính tiền|báo giá|cho|khách)/gi, '').trim() || 'Khách vãng lai';
      const invRes = await this.toolExecutor.execute('cashier_create_invoice', {
        customerName: nameMatch,
        customerPhone: '0988000111'
      }, context);

      executedCalls.push({ toolName: 'cashier_create_invoice', args: { customerName: nameMatch }, result: invRes });

      if (invRes.success && invRes.data) {
        const inv = invRes.data as any;
        responseContent = `🧾 **Đã khởi tạo hóa đơn thu ngân mới**:\n• **Mã hóa đơn**: ${inv.invoiceNumber}\n• **Khách hàng**: ${inv.customerName}\n• **Trạng thái**: Bản nháp (Draft)\n\n⚠️ *Lưu ý*: Các thao tác thêm tiền/giảm giá sẽ gửi yêu cầu phê duyệt bảo mật trước khi thực thi.`;
      } else {
        responseContent = `⚠️ Yêu cầu tạo hóa đơn đã gửi phê duyệt bảo mật tài chính.`;
      }
    }

    return {
      sessionId: context.sessionId,
      content: responseContent,
      toolCallsExecuted: executedCalls,
      metadata: { agentId: this.metadata.id }
    };
  }
}
