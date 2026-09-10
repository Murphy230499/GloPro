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

  async processQuery(rawQuery: string, copilotState: ICopilotState): Promise<{ response: IAgentResponse; contextResolution: IResolvedContextualQuery; navigateTo?: string }> {
    // 1. Resolve Contextual References without asking unnecessary questions!
    const contextResolution = resolveContextualReferences(rawQuery, copilotState);
    this.logger.info(`Copilot Query Resolved: "${rawQuery}" -> "${contextResolution.resolvedQuery}"`);

    // 2. Extract recent conversation history from memory
    const recentHistory = this.memory.getRecentMessages(6).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    // 3. Prepare payload for Gemini API Route
    const payload = {
      message: contextResolution.resolvedQuery,
      history: recentHistory,
      context: {
        currentPage: copilotState.currentPage,
        salonBranch: copilotState.salonBranch,
        currentUser: copilotState.currentUser,
        selectedCustomer: copilotState.selectedCustomer,
        selectedInvoice: copilotState.selectedInvoice,
        selectedAppointment: copilotState.selectedAppointment,
        selectedEmployee: copilotState.selectedEmployee,
        currentFilters: copilotState.currentFilters,
        currentSearch: copilotState.currentSearch
      }
    };

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      let responseContent = data.content || 'Đã xử lý xong.';

      // Prepend Context Badge to Response if context was automatically resolved
      if (contextResolution.contextApplied.length > 0) {
        const badge = `💡 *[Ngữ cảnh nhận diện: ${contextResolution.contextApplied.join(' | ')}]*\n\n`;
        responseContent = badge + responseContent;
      }

      // Record in memory
      this.memory.addMessage('user', contextResolution.resolvedQuery);
      this.memory.addMessage('assistant', responseContent);

      const agentResponse: IAgentResponse = {
        sessionId: `copilot_session_${Date.now()}`,
        content: responseContent,
        toolCallsExecuted: (data.executedTools || []).map((t: any) => ({
          toolName: t.name,
          args: t.args || {},
          result: t.result
        })),
        metadata: {
          model: data.model || 'gemini-2.5-pro',
          navigateTo: data.navigateTo
        }
      };

      return {
        response: agentResponse,
        contextResolution,
        navigateTo: data.navigateTo
      };
    } catch (apiErr: any) {
      this.logger.warn(`Gemini API Route failed, falling back to local agents: ${apiErr.message}`);

      // Fallback to local rule-based agents if API route is unreachable
      const agentContext = this.contextManager.createContext({
        sessionId: `copilot_session_${Date.now()}`,
        userId: copilotState.currentUser.id,
        tenantId: copilotState.salonBranch.id,
        roles: [copilotState.currentUser.role],
        permissions: copilotState.currentPermissions || ['*'],
        metadata: payload.context
      });

      const selectedAgent = (await this.agentRouter.route(contextResolution.resolvedQuery, agentContext)) || this.agentRegistry.getAgent('agent_customer_management')!;
      const fallbackResp = await selectedAgent.execute(contextResolution.resolvedQuery, agentContext);

      return {
        response: fallbackResp,
        contextResolution
      };
    }
  }
}
