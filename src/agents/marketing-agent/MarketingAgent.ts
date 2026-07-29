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

import { CustomerSegmentationTool } from './tools/CustomerSegmentationTool';
import { SendSMSTool } from './tools/SendSMSTool';
import { SendEmailTool } from './tools/SendEmailTool';
import { SendZaloNotificationTool } from './tools/SendZaloNotificationTool';
import { IssueVoucherTool } from './tools/IssueVoucherTool';
import { LaunchCampaignTool } from './tools/LaunchCampaignTool';
import { ManageBirthdayCampaignTool } from './tools/ManageBirthdayCampaignTool';
import { WinBackInactiveCustomersTool } from './tools/WinBackInactiveCustomersTool';

export class MarketingAgent extends BaseAgent {
  readonly metadata: IAgentMetadata = {
    id: 'agent_marketing_engagement',
    name: 'Marketing & Customer Engagement Specialist Agent',
    description: 'Specialized AI agent for customer segmentation (VIP, New, Inactive), SMS Brandname, Email Marketing, Zalo ZNS templates, promotional vouchers, omnichannel marketing campaigns, birthday greetings, and win-back automation.',
    version: '1.0.0',
    capabilities: [
      'marketing_segmentation',
      'marketing_send_sms',
      'marketing_send_email',
      'marketing_send_zalo',
      'marketing_issue_voucher',
      'marketing_launch_campaign',
      'marketing_birthday',
      'marketing_inactive_customers'
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

    // Auto-register all 8 specialized Marketing Tools
    const tools = [
      new CustomerSegmentationTool(logger),
      new SendSMSTool(logger),
      new SendEmailTool(logger),
      new SendZaloNotificationTool(logger),
      new IssueVoucherTool(logger),
      new LaunchCampaignTool(logger),
      new ManageBirthdayCampaignTool(logger),
      new WinBackInactiveCustomersTool(logger)
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

    let responseContent = 'Tôi có thể giúp bạn phân khúc khách hàng (VIP, Khách lâu chưa quay lại), phát hành mã voucher, chạy chiến dịch gửi SMS/Zalo/Email, tự động chúc mừng sinh nhật và kích hoạt lại khách hàng cũ. Bạn cần tôi hỗ trợ chiến dịch gì?';

    // 1. SEGMENTATION & INACTIVE CUSTOMERS
    if (text.includes('phân khúc') || text.includes('khách lâu') || text.includes('inactive') || text.includes('quay lại')) {
      const segRes = await this.toolExecutor.execute('marketing_segmentation', { segmentType: 'inactive' }, context);
      executedCalls.push({ toolName: 'marketing_segmentation', args: { segmentType: 'inactive' }, result: segRes });

      if (segRes.success && segRes.data) {
        const seg = segRes.data as any;
        responseContent = `🎯 **Phân tích Phân khúc Khách hàng Salon**:\n• Phân nhóm: **Khách lâu chưa quay lại (>60 ngày)**\n• Số lượng khách hàng: **${seg.customerCount}** người\n\n👉 *Khuyên dùng*: Chạy chiến dịch Win-Back tặng Voucher giảm giá 20% qua Zalo ZNS để kích hoạt khách quay lại làm dịch vụ.`;
      }
    }
    // 2. BIRTHDAY
    else if (text.includes('sinh nhật') || text.includes('chúc mừng')) {
      const bdayRes = await this.toolExecutor.execute('marketing_birthday', {}, context);
      executedCalls.push({ toolName: 'marketing_birthday', args: {}, result: bdayRes });

      if (bdayRes.success && bdayRes.data) {
        const b = bdayRes.data as any;
        responseContent = `🎂 **Báo cáo Chiến dịch Sinh nhật Tháng ${b.month}**:\n• Tìm thấy: **${b.birthdayCustomersCount} khách hàng** có sinh nhật trong tháng.\n• Đã tự động gửi lời chúc & Voucher quà tặng 100k tới Zalo của 100% khách hàng!`;
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
