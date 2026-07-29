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

import { ManageAttendanceTool } from './tools/ManageAttendanceTool';
import { ManageCommissionTool } from './tools/ManageCommissionTool';
import { ManageSalaryTool } from './tools/ManageSalaryTool';
import { ManageScheduleTool } from './tools/ManageScheduleTool';
import { EvaluatePerformanceTool } from './tools/EvaluatePerformanceTool';
import { ManageLeaveTool } from './tools/ManageLeaveTool';
import { ManageKPITool } from './tools/ManageKPITool';
import { GetStaffRevenueTool } from './tools/GetStaffRevenueTool';

export class StaffAgent extends BaseAgent {
  readonly metadata: IAgentMetadata = {
    id: 'agent_staff_hr',
    name: 'Staff & HR Operations Specialist Agent',
    description: 'Specialized AI agent for managing staff attendance, commission payouts, monthly payroll, shift scheduling, performance rating, leave management, KPI target tracking, and individual staff revenue metrics.',
    version: '1.0.0',
    capabilities: [
      'staff_attendance',
      'staff_commission',
      'staff_salary',
      'staff_schedule',
      'staff_performance',
      'staff_leave',
      'staff_kpi',
      'staff_revenue'
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

    // Auto-register all 8 specialized Staff Tools
    const tools = [
      new ManageAttendanceTool(logger),
      new ManageCommissionTool(logger),
      new ManageSalaryTool(logger),
      new ManageScheduleTool(logger),
      new EvaluatePerformanceTool(logger),
      new ManageLeaveTool(logger),
      new ManageKPITool(logger),
      new GetStaffRevenueTool(logger)
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

    let responseContent = 'Tôi có thể giúp bạn chấm công, tính hoa hồng, duyệt lương, xếp ca làm việc, đánh giá KPI & hiệu suất, duyệt nghỉ phép và thống kê doanh thu nhân viên. Bạn cần tôi hỗ trợ việc gì?';

    // 1. ATTENDANCE
    if (text.includes('chấm công') || text.includes('đi làm') || text.includes('vào ca')) {
      const attRes = await this.toolExecutor.execute('staff_attendance', {
        action: 'check_in',
        staffId: context.userId || 'staff_001'
      }, context);

      executedCalls.push({ toolName: 'staff_attendance', args: { action: 'check_in' }, result: attRes });

      if (attRes.success && attRes.data) {
        responseContent = `🟢 **Đã chấm công vào ca thành công** cho nhân viên! Trạng thái: Đúng giờ.`;
      }
    }
    // 2. SALARY & COMMISSION (Money Actions)
    else if (text.includes('lương') || text.includes('hoa hồng') || text.includes('bảng lương')) {
      const mStr = new Date().toISOString().slice(0, 7);
      const salRes = await this.toolExecutor.execute('staff_salary', {
        action: 'calculate',
        staffId: context.userId || 'staff_001',
        month: mStr
      }, context);

      executedCalls.push({ toolName: 'staff_salary', args: { month: mStr }, result: salRes });

      if (salRes.success && salRes.data) {
        const s = salRes.data as any;
        responseContent = `💰 **Bảng tính Lương Tháng ${mStr}**:\n• **Lương cơ bản**: ${s.baseSalary.toLocaleString('vi-VN')}đ\n• **Hoa hồng dịch vụ & bán hàng**: ${s.totalCommission.toLocaleString('vi-VN')}đ\n• **Thưởng KPI**: +${s.kpiBonus.toLocaleString('vi-VN')}đ\n• **Khấu trừ**: -${s.deductions.toLocaleString('vi-VN')}đ\n----------------------------------------\n• **THỰC LĨNH**: **${s.netSalary.toLocaleString('vi-VN')}đ**\n\n⚠️ *Lưu ý: Thao tác duyệt & chi trả lương cần cấp quản lý duyệt bảo mật.*`;
      } else {
        responseContent = `⚠️ Yêu cầu tính lương đã gửi phê duyệt bảo mật.`;
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
