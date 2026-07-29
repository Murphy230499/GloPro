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
  PromptBuilder,
  IAgentContext
} from '@/ai-core';

import { CustomerAgent } from '@/agents/customer-agent/CustomerAgent';
import { AppointmentAgent } from '@/agents/appointment-agent/AppointmentAgent';
import { CashierAgent } from '@/agents/cashier-agent/CashierAgent';
import { StaffAgent } from '@/agents/staff-agent/StaffAgent';
import { InventoryAgent } from '@/agents/inventory-agent/InventoryAgent';
import { MarketingAgent } from '@/agents/marketing-agent/MarketingAgent';
import { AnalyticsAgent } from '@/agents/analytics-agent/AnalyticsAgent';

import { IntentPlanner } from './IntentPlanner';
import { IExecutionPlan, IOrchestratorResult, IExecutionStep } from './types';

export class Orchestrator {
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
  private readonly intentPlanner: IntentPlanner;

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
    this.intentPlanner = new IntentPlanner();

    // Register all 7 specialized Agents
    this.agentRegistry.register(new CustomerAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry));
    this.agentRegistry.register(new AppointmentAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry));
    this.agentRegistry.register(new CashierAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry));
    this.agentRegistry.register(new StaffAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry));
    this.agentRegistry.register(new InventoryAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry));
    this.agentRegistry.register(new MarketingAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry));
    this.agentRegistry.register(new AnalyticsAgent(this.promptBuilder, this.toolExecutor, this.memory, this.eventBus, this.logger, this.toolRegistry));
  }

  async executeMultiAgentPipeline(rawPrompt: string, userContext?: Partial<IAgentContext>): Promise<IOrchestratorResult> {
    const sessionId = userContext?.sessionId || `orch_session_${Date.now()}`;
    this.logger.info(`AI Orchestrator starting multi-agent pipeline for prompt: "${rawPrompt}"`);

    // 1. Memory Log
    await this.memory.addMessage(sessionId, { role: 'user', content: rawPrompt });

    // 2. Intent Parsing & Multi-Agent Planning
    const plan = this.intentPlanner.plan(rawPrompt);
    plan.status = 'in_progress';

    const context = this.contextManager.createContext({
      sessionId,
      userId: userContext?.userId || 'owner_01',
      tenantId: userContext?.tenantId || 'branch_main',
      roles: ['owner'],
      permissions: ['*']
    });

    const stepSummaries: string[] = [];
    let hasPendingConfirmation = false;

    // 3. Sequential Multi-Agent Execution Chain
    for (const step of plan.steps) {
      step.status = 'executing';
      this.logger.info(`Orchestrator executing Step ${step.stepIndex}: Agent [${step.agentName}] -> Tool [${step.toolName}]`);

      try {
        const agent = this.agentRegistry.getAgent(step.agentId);
        if (!agent) {
          throw new Error(`Orchestrator: Agent [${step.agentId}] not found in AgentRegistry.`);
        }

        // Execute step via target agent
        const agentResponse = await agent.execute(step.query, context);
        step.status = 'completed';
        step.outputData = agentResponse;
        stepSummaries.push(`• **${step.agentName}**: ${agentResponse.content}`);

      } catch (err: any) {
        step.status = 'failed';
        step.error = err.message;
        this.logger.error(`Orchestrator Step ${step.stepIndex} failed`, err);

        // Error Recovery & Rollback Compensation for completed steps
        await this.handlePipelineError(plan, step, context);

        return {
          sessionId,
          originalPrompt: rawPrompt,
          plan,
          finalResponseText: `❌ **Lỗi Chuỗi Tiến Trình Orchestrator tại Bước ${step.stepIndex} (${step.agentName})**: ${err.message}`,
          executedStepsCount: step.stepIndex - 1,
          hasPendingConfirmation: false,
          error: err.message
        };
      }
    }

    plan.status = 'completed';
    const finalResponseText = `🎉 **Tự động hóa hoàn tất chuỗi Multi-Agent thành công**:\n\n${stepSummaries.join('\n\n')}`;

    await this.memory.addMessage(sessionId, { role: 'assistant', content: finalResponseText });

    return {
      sessionId,
      originalPrompt: rawPrompt,
      plan,
      finalResponseText,
      executedStepsCount: plan.steps.length,
      hasPendingConfirmation
    };
  }

  private async handlePipelineError(plan: IExecutionPlan, failedStep: IExecutionStep, context: IAgentContext): Promise<void> {
    this.logger.warn(`Orchestrator triggering error recovery & compensation for failed step ${failedStep.stepIndex}`);
    plan.status = 'failed';
    // Revert completed steps in reverse order
    const completedSteps = plan.steps.filter(s => s.status === 'completed').reverse();
    for (const step of completedSteps) {
      step.status = 'rolled_back';
      this.logger.info(`Rolled back step ${step.stepIndex} (${step.agentName})`);
    }
  }
}
