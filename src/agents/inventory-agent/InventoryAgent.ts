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

import { CheckStockTool } from './tools/CheckStockTool';
import { StockInTool } from './tools/StockInTool';
import { StockOutTool } from './tools/StockOutTool';
import { ManageSupplierTool } from './tools/ManageSupplierTool';
import { ManagePurchaseOrderTool } from './tools/ManagePurchaseOrderTool';
import { CheckExpiryTool } from './tools/CheckExpiryTool';
import { CheckLowStockAlertsTool } from './tools/CheckLowStockAlertsTool';
import { GetInventoryReportTool } from './tools/GetInventoryReportTool';

export class InventoryAgent extends BaseAgent {
  readonly metadata: IAgentMetadata = {
    id: 'agent_inventory_warehouse',
    name: 'Inventory & Warehouse Specialist Agent',
    description: 'Specialized AI agent for inspecting stock counts, logging stock in/out movements, supplier management, purchase order approvals, expiry date tracking, low stock alerts, and inventory valuation reports.',
    version: '1.0.0',
    capabilities: [
      'inventory_check_stock',
      'inventory_stock_in',
      'inventory_stock_out',
      'inventory_supplier',
      'inventory_purchase_order',
      'inventory_expiry',
      'inventory_low_stock_alerts',
      'inventory_report'
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

    // Auto-register all 8 specialized Inventory Tools
    const tools = [
      new CheckStockTool(logger),
      new StockInTool(logger),
      new StockOutTool(logger),
      new ManageSupplierTool(logger),
      new ManagePurchaseOrderTool(logger),
      new CheckExpiryTool(logger),
      new CheckLowStockAlertsTool(logger),
      new GetInventoryReportTool(logger)
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

    let responseContent = 'Tôi có thể giúp bạn kiểm kho, nhập/xuất kho, quản lý nhà cung cấp, đặt hàng PO, kiểm tra hạn sử dụng mỹ phẩm, cảnh báo hàng sắp hết và xuất báo cáo tồn kho. Bạn cần tôi hỗ trợ việc gì?';

    // 1. CHECK STOCK
    if (text.includes('kho') || text.includes('tồn kho') || text.includes('sản phẩm') || text.includes('mỹ phẩm')) {
      const stockRes = await this.toolExecutor.execute('inventory_check_stock', { query: text.includes('gội') ? 'gội' : '' }, context);
      executedCalls.push({ toolName: 'inventory_check_stock', args: {}, result: stockRes });

      if (stockRes.success && Array.isArray(stockRes.data) && stockRes.data.length > 0) {
        const items = stockRes.data.map(p => `• **${p.name}** (SKU: ${p.sku}) | Tồn kho: **${p.quantityInStock} ${p.unit}** (Ngưỡng tối thiểu: ${p.minThreshold})`).join('\n');
        responseContent = `📦 **Báo cáo Tồn kho Mỹ phẩm & Hóa chất Salon**:\n\n${items}`;
      }
    }
    // 2. LOW STOCK ALERTS
    else if (text.includes('cảnh báo') || text.includes('hết hàng') || text.includes('sắp hết')) {
      const alertRes = await this.toolExecutor.execute('inventory_low_stock_alerts', {}, context);
      executedCalls.push({ toolName: 'inventory_low_stock_alerts', args: {}, result: alertRes });

      if (alertRes.success && Array.isArray(alertRes.data) && alertRes.data.length > 0) {
        const items = alertRes.data.map(p => `⚠️ **${p.name}** (SKU: ${p.sku}): Chỉ còn **${p.quantityInStock} ${p.unit}** trong kho (Dưới ngưỡng ${p.minThreshold})`).join('\n');
        responseContent = `🚨 **CẢNH BÁO MẶT HÀNG SẮP HẾT KHO**:\n\n${items}\n\n👉 *Khuyên dùng*: Tạo đơn đặt hàng PO tới Nhà cung cấp để nhập thêm.`;
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
