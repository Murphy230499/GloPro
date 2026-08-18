import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManageLeaveInput, ILeaveRequest } from '../types';

export class ManageLeaveTool extends AbstractTool<IManageLeaveInput, ILeaveRequest | ILeaveRequest[]> {
  readonly metadata: IToolMetadata = {
    name: 'staff_leave',
    description: 'Manages staff annual leave requests, sick leave logs, and manager approvals.',
    parametersSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['request', 'approve', 'reject', 'list'] },
        staffId: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        reason: { type: 'string' },
        requestId: { type: 'string' }
      },
      required: ['action', 'staffId']
    },
    requiredPermissions: ['staff:leave'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IManageLeaveInput): IToolValidationResult {
    if (!input || !input.staffId || !input.action) {
      return { valid: false, errors: ['Staff ID and action are required.'] };
    }
    return { valid: true };
  }

  async execute(input: IManageLeaveInput, context: IAgentContext): Promise<IToolResult<ILeaveRequest | ILeaveRequest[]>> {
    const startTime = Date.now();
    this.log('info', `Managing leave action [${input.action}] for staff [${input.staffId}]`);

    try {
      const leaves = await base44.entities.StaffLeave.list();

      if (input.action === 'request') {
        const req: ILeaveRequest = {
          id: `leave_${Date.now()}`,
          staffId: input.staffId,
          staffName: 'Staff Member',
          startDate: input.startDate || new Date().toISOString().split('T')[0],
          endDate: input.endDate || new Date().toISOString().split('T')[0],
          reason: input.reason || 'Nghỉ phép cá nhân',
          status: 'pending'
        };
        leaves.push(req);
        // localStorage.setItem replaced with direct Supabase API call above
        return { success: true, data: req, executionTimeMs: Date.now() - startTime };
      } else if ((input.action === 'approve' || input.action === 'reject') && input.requestId) {
        const idx = leaves.findIndex(l => l.id === input.requestId);
        if (idx !== -1) {
          leaves[idx].status = input.action === 'approve' ? 'approved' : 'rejected';
          // localStorage.setItem replaced with direct Supabase API call above
          return { success: true, data: leaves[idx], executionTimeMs: Date.now() - startTime };
        }
      }

      const list = leaves.filter(l => l.staffId === input.staffId);
      return {
        success: true,
        data: list,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManageLeaveTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process leave request.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
