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

import { SearchCustomerTool } from './tools/SearchCustomerTool';
import { CreateCustomerTool } from './tools/CreateCustomerTool';
import { UpdateCustomerTool } from './tools/UpdateCustomerTool';
import { DeleteCustomerTool } from './tools/DeleteCustomerTool';
import { MergeCustomersTool } from './tools/MergeCustomersTool';
import { GetCustomerHistoryTool } from './tools/GetCustomerHistoryTool';
import { ManageMembershipTool } from './tools/ManageMembershipTool';
import { ManageLoyaltyPointsTool } from './tools/ManageLoyaltyPointsTool';
import { ManageCustomerNotesTool } from './tools/ManageCustomerNotesTool';
import { ManageCustomerDebtTool } from './tools/ManageCustomerDebtTool';
import { GetCustomerStatisticsTool } from './tools/GetCustomerStatisticsTool';

export class CustomerAgent extends BaseAgent {
  readonly metadata: IAgentMetadata = {
    id: 'agent_customer_management',
    name: 'Customer Management Specialist Agent',
    description: 'Specialized AI agent for searching, creating, updating, deleting, merging, analyzing, and managing customer profiles, loyalty points, membership tiers, notes, and debt.',
    version: '1.0.0',
    capabilities: [
      'customer_search',
      'customer_create',
      'customer_update',
      'customer_delete',
      'customer_merge',
      'customer_history',
      'customer_membership',
      'customer_loyalty_points',
      'customer_notes',
      'customer_debt',
      'customer_statistics'
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

    // Auto-register all 11 specialized Customer Tools into the Tool Registry
    const tools = [
      new SearchCustomerTool(logger),
      new CreateCustomerTool(logger),
      new UpdateCustomerTool(logger),
      new DeleteCustomerTool(logger),
      new MergeCustomersTool(logger),
      new GetCustomerHistoryTool(logger),
      new ManageMembershipTool(logger),
      new ManageLoyaltyPointsTool(logger),
      new ManageCustomerNotesTool(logger),
      new ManageCustomerDebtTool(logger),
      new GetCustomerStatisticsTool(logger)
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

    let responseContent = 'Tôi có thể giúp bạn tìm kiếm, tạo mới, cập nhật, xóa, gộp hoặc phân tích dữ liệu khách hàng. Bạn cần tôi hỗ trợ việc gì?';

    // 1. SEARCH CUSTOMER
    if (text.includes('tìm') || text.includes('tra cứu') || text.includes('search')) {
      const qMatch = query.replace(/(?:tìm|tra cứu|khách hàng|thông tin|hồ sơ|search|cho tôi)/gi, '').trim();
      const searchRes = await this.toolExecutor.execute('customer_search', { query: qMatch || 'a' }, context);
      executedCalls.push({ toolName: 'customer_search', args: { query: qMatch }, result: searchRes });

      if (searchRes.success && Array.isArray(searchRes.data) && searchRes.data.length > 0) {
        const items = searchRes.data.map(c => `• **${c.name}** (SĐT: ${c.phone} | Hạng: ${c.tier || 'Đồng'} | Tích điểm: ${c.loyaltyPoints || 0}đ)`).join('\n');
        responseContent = `🔍 **Tìm thấy ${searchRes.data.length} kết quả khách hàng phù hợp**:\n\n${items}`;
      } else {
        responseContent = `🔍 Không tìm thấy hồ sơ khách hàng nào phù hợp với từ khóa "${qMatch}".`;
      }
    }
    // 2. CREATE CUSTOMER
    else if (text.includes('tạo') || text.includes('thêm')) {
      const phoneMatch = query.match(/(0\d{9})/);
      const nameClean = query.replace(/(?:tạo|thêm|khách hàng|hồ sơ|sđt|số điện thoại|\d{10})/gi, '').trim();

      if (!nameClean || !phoneMatch) {
        responseContent = '⚠️ **Vui lòng cung cấp đầy đủ Tên và Số điện thoại 10 số** của khách hàng để tạo mới hồ sơ!';
      } else {
        const createRes = await this.toolExecutor.execute('customer_create', { name: nameClean, phone: phoneMatch[1] }, context);
        executedCalls.push({ toolName: 'customer_create', args: { name: nameClean, phone: phoneMatch[1] }, result: createRes });

        if (createRes.success) {
          responseContent = `🎉 **Đã tạo thành công hồ sơ khách hàng mới**:\n• **Họ tên**: ${nameClean}\n• **Số điện thoại**: ${phoneMatch[1]}\n• **Hạng thẻ**: Đồng (Tích lũy ban đầu: 0 điểm)`;
        } else {
          responseContent = `❌ Không thể tạo khách hàng: ${createRes.error}`;
        }
      }
    }
    // 3. STATISTICS
    else if (text.includes('thống kê') || text.includes('báo cáo') || text.includes('tổng quan')) {
      const statsRes = await this.toolExecutor.execute('customer_statistics', {}, context);
      executedCalls.push({ toolName: 'customer_statistics', args: {}, result: statsRes });

      if (statsRes.success && statsRes.data) {
        const s = statsRes.data as any;
        responseContent = `📊 **Báo cáo Thống kê Khách hàng Salon & Spa**:\n\n• **Tổng số khách hàng**: **${s.totalCustomers}** khách\n• **Phân hạng thẻ**: Đồng (${s.tierDistribution['Đồng'] || 0}), Bạc (${s.tierDistribution['Bạc'] || 0}), Vàng (${s.tierDistribution['Vàng'] || 0}), Kim Cương (${s.tierDistribution['Kim Cương'] || 0})\n• **Tổng chi tiêu tích lũy**: **${(s.totalSpentAllCustomers || 0).toLocaleString('vi-VN')}đ**\n• **Chi tiêu trung bình/khách**: **${(s.averageSpentPerCustomer || 0).toLocaleString('vi-VN')}đ**\n• **Tổng dư nợ chưa thanh toán**: **${(s.totalDebt || 0).toLocaleString('vi-VN')}đ**`;
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
