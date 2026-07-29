import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManageScheduleInput, IShiftSchedule } from '../types';

export class ManageScheduleTool extends AbstractTool<IManageScheduleInput, IShiftSchedule | IShiftSchedule[]> {
  readonly metadata: IToolMetadata = {
    name: 'staff_schedule',
    description: 'Manages staff shift assignments, working schedules, and shift swap requests between team members.',
    parametersSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['assign_shift', 'swap_shift', 'get_schedule'] },
        staffId: { type: 'string' },
        date: { type: 'string' },
        shiftType: { type: 'string', enum: ['morning', 'afternoon', 'full_day', 'night'] },
        targetStaffIdForSwap: { type: 'string' }
      },
      required: ['action', 'staffId', 'date']
    },
    requiredPermissions: ['staff:schedule'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IManageScheduleInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.staffId || !input.date) errors.push('Staff ID and date are required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IManageScheduleInput, context: IAgentContext): Promise<IToolResult<IShiftSchedule | IShiftSchedule[]>> {
    const startTime = Date.now();
    this.log('info', `Managing schedule action [${input.action}] for staff [${input.staffId}] on ${input.date}`);

    try {
      const schedules: IShiftSchedule[] = JSON.parse(localStorage.getItem('glopro_schedules') || '[]');

      if (input.action === 'assign_shift') {
        const shift: IShiftSchedule = {
          id: `shift_${Date.now()}`,
          staffId: input.staffId,
          staffName: 'Staff Member',
          date: input.date,
          shiftType: input.shiftType || 'full_day',
          startTime: input.shiftType === 'morning' ? '08:00' : '13:00',
          endTime: input.shiftType === 'morning' ? '14:00' : '21:00'
        };
        schedules.push(shift);
        localStorage.setItem('glopro_schedules', JSON.stringify(schedules));
        return { success: true, data: shift, executionTimeMs: Date.now() - startTime };
      }

      const list = schedules.filter(s => s.staffId === input.staffId || s.date === input.date);
      return {
        success: true,
        data: list,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManageScheduleTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process staff schedule.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
