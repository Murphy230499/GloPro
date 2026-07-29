import {
  Logger,
  EventBus,
  AuditLog,
  ToolRegistry,
  AgentRegistry,
  ContextManager,
  ConversationMemory,
  PermissionManager,
  ConfirmationManager,
  ToolExecutor,
  AgentRouter,
  PromptBuilder,
  IAgentResponse
} from '@/ai-core';

import { CustomerAgent } from '@/agents/customer-agent/CustomerAgent';
import { AppointmentAgent } from '@/agents/appointment-agent/AppointmentAgent';
import { CashierAgent } from '@/agents/cashier-agent/CashierAgent';
import { StaffAgent } from '@/agents/staff-agent/StaffAgent';
import { InventoryAgent } from '@/agents/inventory-agent/InventoryAgent';
import { MarketingAgent } from '@/agents/marketing-agent/MarketingAgent';
import { AnalyticsAgent } from '@/agents/analytics-agent/AnalyticsAgent';

import { ICopilotState, resolveContextualReferences, IResolvedContextualQuery } from './CopilotState';

export class CopilotEngine {
  private readonly logger: Logger;
  private readonly eventBus: EventBus;
  private readonly auditLog: AuditLog;
  private readonly toolRegistry: ToolRegistry;
  private readonly agentRegistry: AgentRegistry;
  private readonly contextManager: ContextManager;
  private readonly memory: ConversationMemory;
  private readonly permissionManager: PermissionManager;
  private readonly confirmationManager: ConfirmationManager;
  private readonly toolExecutor: ToolExecutor;
  private readonly promptBuilder: PromptBuilder;
  private readonly agentRouter: AgentRouter;

  constructor() {
    this.logger = new Logger();
    this.eventBus = new EventBus();
    this.auditLog = new AuditLog();
    this.toolRegistry = new ToolRegistry(this.logger);
    this.agentRegistry = new AgentRegistry(this.logger);
    this.contextManager = new ContextManager();
    this.memory = new ConversationMemory();
    this.permissionManager = new PermissionManager(this.logger);
    this.confirmationManager = new ConfirmationManager(this.eventBus, this.logger);

    this.toolExecutor = new ToolExecutor(
      this.toolRegistry,
      this.permissionManager,
      this.confirmationManager,
      this.auditLog,
      this.logger,
      this.eventBus
    );

    this.promptBuilder = new PromptBuilder(this.toolRegistry);

    // Instantiate and register all 7 Specialized AI Agents
    const customerAgent = new CustomerAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry);
    const appointmentAgent = new AppointmentAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry);
    const cashierAgent = new CashierAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry);
    const staffAgent = new StaffAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry);
    const inventoryAgent = new InventoryAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry);
    const marketingAgent = new MarketingAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry);
    const analyticsAgent = new AnalyticsAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry);

    this.agentRegistry.register(customerAgent);
    this.agentRegistry.register(appointmentAgent);
    this.agentRegistry.register(cashierAgent);
    this.agentRegistry.register(staffAgent);
    this.agentRegistry.register(inventoryAgent);
    this.agentRegistry.register(marketingAgent);
    this.agentRegistry.register(analyticsAgent);

    this.agentRouter = new AgentRouter(this.agentRegistry, this.logger);
  }

  getConfirmationManager(): ConfirmationManager {
    return this.confirmationManager;
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  async processQuery(rawQuery: string, copilotState: ICopilotState): Promise<{ response: IAgentResponse; contextResolution: IResolvedContextualQuery }> {
    // 1. Resolve Contextual References without asking unnecessary questions!
    const contextResolution = resolveContextualReferences(rawQuery, copilotState);
    this.logger.info(`Copilot Query Resolved: "${rawQuery}" -> "${contextResolution.resolvedQuery}"`);

    // 2. Build or Update Runtime Session Context
    const agentContext = this.contextManager.createContext({
      sessionId: `copilot_session_${Date.now()}`,
      userId: copilotState.currentUser.id,
      tenantId: copilotState.salonBranch.id,
      roles: [copilotState.currentUser.role],
      permissions: copilotState.currentPermissions || ['*'],
      metadata: {
        currentPage: copilotState.currentPage,
        selectedCustomer: copilotState.selectedCustomer,
        selectedInvoice: copilotState.selectedInvoice,
        selectedAppointment: copilotState.selectedAppointment,
        selectedEmployee: copilotState.selectedEmployee,
        currentFilters: copilotState.currentFilters,
        currentSearch: copilotState.currentSearch
      }
    });

    // 3. Intelligently Route to the best specialized agent
    const text = contextResolution.resolvedQuery.toLowerCase();
    let selectedAgent = this.agentRegistry.getAgent('agent_customer_management');

    if (text.includes('lịch') || text.includes('hẹn') || text.includes('đặt') || text.includes('rảnh')) {
      selectedAgent = this.agentRegistry.getAgent('agent_appointment_management');
    } else if (text.includes('hóa đơn') || text.includes('tính tiền') || text.includes('thanh toán') || text.includes('gộp') || text.includes('voucher') || text.includes('giảm giá')) {
      selectedAgent = this.agentRegistry.getAgent('agent_cashier_pos');
    } else if (text.includes('lương') || text.includes('chấm công') || text.includes('hoa hồng') || text.includes('nhân viên') || text.includes('nghỉ phép')) {
      selectedAgent = this.agentRegistry.getAgent('agent_staff_hr');
    } else if (text.includes('kho') || text.includes('sản phẩm') || text.includes('nhập kho') || text.includes('xuất kho') || text.includes('hạn dùng') || text.includes('nhà cung cấp')) {
      selectedAgent = this.agentRegistry.getAgent('agent_inventory_warehouse');
    } else if (text.includes('chiến dịch') || text.includes('marketing') || text.includes('sms') || text.includes('zalo') || text.includes('sinh nhật') || text.includes('phân khúc')) {
      selectedAgent = this.agentRegistry.getAgent('agent_marketing_engagement');
    } else if (text.includes('doanh thu') || text.includes('lợi nhuận') || text.includes('báo cáo') || text.includes('dự báo') || text.includes('thống kê') || text.includes('xu hướng')) {
      selectedAgent = this.agentRegistry.getAgent('agent_analytics_bi');
    }

    if (!selectedAgent) {
      selectedAgent = (await this.agentRouter.route(contextResolution.resolvedQuery, agentContext)) || this.agentRegistry.getAgent('agent_customer_management')!;
    }

    // 4. Execute Agent Execution Loop
    const response = await selectedAgent.execute(contextResolution.resolvedQuery, agentContext);

    // 5. Prepend Context Badge to Response if context was automatically resolved
    if (contextResolution.contextApplied.length > 0) {
      const badge = `💡 *[AI Context: ${contextResolution.contextApplied.join(' | ')}]*\n\n`;
      response.content = badge + response.content;
    }

    return { response, contextResolution };
  }
}
