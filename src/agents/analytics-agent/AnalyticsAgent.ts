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

import { AnalyzeRevenueTool } from './tools/AnalyzeRevenueTool';
import { AnalyzeProfitTool } from './tools/AnalyzeProfitTool';
import { AnalyzeEmployeePerformanceTool } from './tools/AnalyzeEmployeePerformanceTool';
import { AnalyzeCustomerMetricsTool } from './tools/AnalyzeCustomerMetricsTool';
import { AnalyzeServicePerformanceTool } from './tools/AnalyzeServicePerformanceTool';
import { GenerateBusinessInsightsTool } from './tools/GenerateBusinessInsightsTool';
import { ForecastRevenueTool } from './tools/ForecastRevenueTool';
import { DetectTrendsTool } from './tools/DetectTrendsTool';

export class AnalyticsAgent extends BaseAgent {
  readonly metadata: IAgentMetadata = {
    id: 'agent_analytics_bi',
    name: 'Analytics & Business Intelligence Specialist Agent',
    description: 'Specialized AI agent for analyzing revenue, gross/net profit margins, employee productivity rankings, customer LTV & retention, top-performing services, AI strategic business insights, revenue forecasting, and market trend detection.',
    version: '1.0.0',
    capabilities: [
      'analytics_revenue',
      'analytics_profit',
      'analytics_employee',
      'analytics_customer',
      'analytics_service',
      'analytics_insights',
      'analytics_forecast',
      'analytics_trends'
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

    // Auto-register all 8 specialized Analytics Tools
    const tools = [
      new AnalyzeRevenueTool(logger),
      new AnalyzeProfitTool(logger),
      new AnalyzeEmployeePerformanceTool(logger),
      new AnalyzeCustomerMetricsTool(logger),
      new AnalyzeServicePerformanceTool(logger),
      new GenerateBusinessInsightsTool(logger),
      new ForecastRevenueTool(logger),
      new DetectTrendsTool(logger)
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

    let responseContent = 'Tôi có thể giúp bạn phân tích doanh thu, lợi nhuận ròng, năng suất nhân viên, LTV khách hàng, biên lợi nhuận dịch vụ, đưa ra đề xuất kinh doanh, dự báo doanh thu tương lai và phát hiện xu hướng thị trường. Bạn cần tôi phân tích chỉ số nào?';

    // 1. REVENUE & PROFIT
    if (text.includes('doanh thu') || text.includes('lợi nhuận') || text.includes('lãi')) {
      const revRes = await this.toolExecutor.execute('analytics_revenue', {}, context);
      const profitRes = await this.toolExecutor.execute('analytics_profit', {}, context);

      executedCalls.push(
        { toolName: 'analytics_revenue', args: {}, result: revRes },
        { toolName: 'analytics_profit', args: {}, result: profitRes }
      );

      if (revRes.success && profitRes.success) {
        const r = revRes.data as any;
        const p = profitRes.data as any;
        responseContent = `📈 **Báo cáo Tài chính & Lợi nhuận Salon**:\n\n• **Tổng doanh thu**: **${r.totalRevenue.toLocaleString('vi-VN')}đ** (Tăng trưởng: +${r.growthPercentage}%)\n  - Doanh thu Dịch vụ: ${r.serviceRevenue.toLocaleString('vi-VN')}đ\n  - Bán lẻ Sản phẩm: ${r.productSalesRevenue.toLocaleString('vi-VN')}đ\n\n• **Chi phí**: Vốn hàng (${p.cogsMaterialCost.toLocaleString('vi-VN')}đ), Lương nhân viên (${p.laborPayrollExpense.toLocaleString('vi-VN')}đ), Vận hành (${p.overheadExpenses.toLocaleString('vi-VN')}đ)\n• **LỢI NHUẬN RÒNG**: **${p.netProfit.toLocaleString('vi-VN')}đ** (Biên lợi nhuận ròng: **${p.netProfitMarginPercentage}%**)`;
      }
    }
    // 2. FORECAST & INSIGHTS
    else if (text.includes('dự báo') || text.includes('xu hướng') || text.includes('đề xuất')) {
      const forecastRes = await this.toolExecutor.execute('analytics_forecast', {}, context);
      const trendRes = await this.toolExecutor.execute('analytics_trends', {}, context);

      executedCalls.push(
        { toolName: 'analytics_forecast', args: {}, result: forecastRes },
        { toolName: 'analytics_trends', args: {}, result: trendRes }
      );

      if (forecastRes.success && trendRes.success) {
        const f = forecastRes.data as any;
        const t = trendRes.data as any;
        responseContent = `🔮 **Dự báo Doanh thu & Phát hiện Xu hướng AI**:\n\n• **Dự báo doanh thu tháng tới**: **${f.predictedRevenue.toLocaleString('vi-VN')}đ** (Độ tin cậy: ${f.confidenceScore}%)\n• **Dự báo lượt khách**: **${f.predictedCustomerCount} lượt**\n\n🔥 **Dịch vụ đang thành Trend**: ${t.trendingServices.join(', ')}\n⏰ **Khung giờ cao điểm**: ${t.peakHours.join(' & ')}`;
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
