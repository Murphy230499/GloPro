/**
 * Grounding Engine
 * 
 * Master orchestrator for Read & Grounding operations:
 * Intent -> Read Planner -> Tool Selection -> Permission Check -> Tool Execution -> Result Validation -> Grounded Context.
 * 
 * Guarantees zero hallucinated database records and strictly enforces permissions and disambiguation.
 */

import { IStructuredIntent } from '../intent/IntentTypes';
import { IGroundedContext, ToolContext, ToolResult } from './contracts/ToolContracts';
import { ReadPlanner } from './ReadPlanner';
import { ToolRegistry } from './ToolRegistry';
import { PermissionGate } from './PermissionGate';
import { ToolResultValidator } from './ToolResultValidator';
import { Observability } from './Observability';

export class GroundingEngine {
  /**
   * Processes a read request and grounds it in verified system data.
   */
  static async groundRequest(
    query: string,
    structuredIntent: IStructuredIntent,
    context: ToolContext = {},
    history: Array<{ role: string; content: string }> = []
  ): Promise<IGroundedContext> {
    const startTime = Date.now();

    // 1. GENERATE READ PLAN
    const plan = ReadPlanner.plan(query, structuredIntent, context, history);

    // A. Handle Rejections (database dump, prompt injection)
    if (plan.rejected) {
      Observability.logToolExecution({
        event: 'AI_READ_TOOL_EXECUTION',
        tool: 'SecurityGuard',
        status: 'REJECTED',
        success: false,
        durationMs: Date.now() - startTime,
        userId: context.userId,
        userRole: context.role,
        errorMessage: plan.rejectionReason
      });

      return {
        grounded: true,
        state: 'KNOWN',
        sources: [{ tool: 'SecurityGuard', queriedAt: new Date().toISOString(), status: 'REJECTED' }],
        data: null,
        summary: `🛡️ **Từ chối yêu cầu:** ${plan.rejectionReason}`,
        error: plan.rejectionReason
      };
    }

    // B. Handle Contextual Missing Information (e.g. "khách này" without context)
    if (plan.needsClarification) {
      return {
        grounded: false,
        state: 'UNKNOWN',
        sources: [],
        data: null,
        summary: plan.clarificationMessage || 'Vui lòng cung cấp thêm thông tin.',
        error: 'CLARIFICATION_REQUIRED'
      };
    }

    // C. If no read steps planned, return ungrounded state
    if (!plan.steps || plan.steps.length === 0) {
      return {
        grounded: false,
        state: 'UNKNOWN',
        sources: [],
        data: null,
        summary: 'Không tìm thấy công cụ đọc dữ liệu phù hợp với yêu cầu này.',
        error: 'NO_PLAN'
      };
    }

    // 2. EXECUTE PLANNED STEPS SEQUENTIALLY WITH GROUNDING
    const sources: IGroundedContext['sources'] = [];
    let accumulatedData: any = null;
    let finalSummary = '';
    let resolvedStaff: any = null;
    let resolvedCustomer: any = null;

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const stepStartTime = Date.now();

      // Resolve dynamic parameters from previous step if applicable
      if (resolvedStaff && step.toolName === 'RevenueReadTool') {
        step.parameters.staffId = resolvedStaff.id;
        step.parameters.staffName = resolvedStaff.name;
      }
      if (resolvedCustomer && step.parameters.customerId === undefined) {
        step.parameters.customerId = resolvedCustomer.id;
      }

      // Check tool registration
      const tool = ToolRegistry.get(step.toolName);
      if (!tool) {
        Observability.logToolExecution({
          event: 'AI_READ_TOOL_EXECUTION',
          tool: step.toolName,
          status: 'NO_AVAILABLE_TOOL',
          success: false,
          durationMs: Date.now() - stepStartTime,
          errorMessage: `Công cụ "${step.toolName}" chưa được đăng ký trong hệ thống.`
        });

        return {
          grounded: false,
          state: 'UNKNOWN',
          sources,
          data: null,
          summary: `❌ Không tìm thấy công cụ "${step.toolName}" được cấp phép.`,
          error: 'NO_AVAILABLE_TOOL'
        };
      }

      // 3. PERMISSION GATE CHECK
      const permCheck = PermissionGate.check(tool.name, tool.requiredPermission, context);
      if (!permCheck.allowed) {
        Observability.logToolExecution({
          event: 'AI_PERMISSION_DENIED',
          tool: tool.name,
          status: 'PERMISSION_DENIED',
          success: false,
          durationMs: Date.now() - stepStartTime,
          userId: context.userId,
          userRole: context.role,
          errorMessage: permCheck.reason
        });

        return {
          grounded: true,
          state: 'KNOWN',
          sources: [{ tool: tool.name, queriedAt: new Date().toISOString(), status: 'PERMISSION_DENIED' }],
          data: null,
          permissionDenied: true,
          summary: permCheck.message || 'Bạn không có quyền truy cập thông tin này.',
          error: 'PERMISSION_DENIED'
        };
      }

      // 4. EXECUTE TOOL
      let rawResult: any;
      try {
        rawResult = await tool.execute(step.parameters, context);
      } catch (execErr: any) {
        rawResult = {
          success: false,
          status: 'TOOL_ERROR',
          toolName: tool.name,
          error: { code: 'EXECUTION_EXCEPTION', message: execErr.message },
          message: `Lỗi hệ thống khi gọi ${tool.name}: ${execErr.message}`
        };
      }

      // 5. VALIDATE TOOL RESULT
      const validatedResult = ToolResultValidator.validate(rawResult, tool.name);

      Observability.logToolExecution({
        event: 'AI_READ_TOOL_EXECUTION',
        tool: tool.name,
        intent: structuredIntent.intent,
        status: validatedResult.status,
        success: validatedResult.success,
        durationMs: Date.now() - stepStartTime,
        recordsCount: validatedResult.metadata?.total,
        userId: context.userId,
        userRole: context.role
      });

      sources.push({
        tool: tool.name,
        queriedAt: new Date().toISOString(),
        status: validatedResult.status
      });

      // Handle Failures & Errors safely
      if (!validatedResult.success || validatedResult.status === 'TOOL_ERROR' || validatedResult.status === 'INVALID_RESULT') {
        return {
          grounded: false,
          state: 'UNKNOWN',
          sources,
          data: null,
          summary: validatedResult.message || 'Không thể truy xuất dữ liệu từ phần mềm lúc này.',
          error: validatedResult.status
        };
      }

      // Handle Not Found
      if (validatedResult.status === 'NOT_FOUND') {
        return {
          grounded: true,
          state: 'KNOWN',
          sources,
          data: null,
          summary: validatedResult.message || 'Không tìm thấy dữ liệu phù hợp trong hệ thống EasySalon.'
        };
      }

      // Handle Ambiguity / Multiple Matches -> STOP and require Disambiguation
      if (validatedResult.metadata?.isAmbiguous) {
        const candidates = validatedResult.metadata.candidates || validatedResult.data || [];
        const isStaff = tool.name === 'StaffReadTool';

        let disambiguationMsg = `🔍 **Tìm thấy ${candidates.length} ${isStaff ? 'nhân viên' : 'khách hàng'} phù hợp. Bạn muốn chọn ai?**\n`;
        candidates.forEach((c: any, idx: number) => {
          if (isStaff) {
            disambiguationMsg += `${idx + 1}. **${c.name}** (${c.role || 'Thợ'} - SĐT: \`${c.phone || 'Chưa có'}\`)\n`;
          } else {
            disambiguationMsg += `${idx + 1}. **${c.name}** (SĐT: \`${c.phone}\` - Hạng: ${c.tier || 'Chuẩn'})\n`;
          }
        });

        Observability.logToolExecution({
          event: 'AI_AMBIGUITY_DETECTED',
          tool: tool.name,
          status: 'DISAMBIGUATE',
          success: true,
          durationMs: Date.now() - stepStartTime,
          recordsCount: candidates.length
        });

        return {
          grounded: true,
          state: 'KNOWN',
          sources,
          data: candidates,
          requiresDisambiguation: true,
          candidates,
          summary: disambiguationMsg.trim()
        };
      }

      // Entity resolution for intermediate step (e.g. StaffReadTool -> 1 match)
      if (tool.name === 'StaffReadTool') {
        resolvedStaff = validatedResult.data;
      }
      if (tool.name === 'CustomerReadTool') {
        resolvedCustomer = validatedResult.data;
      }

      accumulatedData = validatedResult.data;
      finalSummary = validatedResult.message || finalSummary;
    }

    return {
      grounded: true,
      state: 'KNOWN',
      sources,
      data: accumulatedData,
      summary: finalSummary
    };
  }
}
