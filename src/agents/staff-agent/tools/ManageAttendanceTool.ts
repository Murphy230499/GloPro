import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManageAttendanceInput, IAttendanceRecord } from '../types';

export class ManageAttendanceTool extends AbstractTool<IManageAttendanceInput, IAttendanceRecord | IAttendanceRecord[]> {
  readonly metadata: IToolMetadata = {
    name: 'staff_attendance',
    description: 'Tracks employee daily attendance, shift check-in/check-out times, late arrivals, and absence records.',
    parametersSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['check_in', 'check_out', 'log_absent', 'get_summary'] },
        staffId: { type: 'string' },
        date: { type: 'string' },
        time: { type: 'string' },
        note: { type: 'string' }
      },
      required: ['action', 'staffId']
    },
    requiredPermissions: ['staff:attendance'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IManageAttendanceInput): IToolValidationResult {
    if (!input || !input.staffId || !input.action) {
      return { valid: false, errors: ['Staff ID and action are required.'] };
    }
    return { valid: true };
  }

  async execute(input: IManageAttendanceInput, context: IAgentContext): Promise<IToolResult<IAttendanceRecord | IAttendanceRecord[]>> {
    const startTime = Date.now();
    const dateStr = input.date || new Date().toISOString().split('T')[0];
    const timeStr = input.time || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    this.log('info', `Managing attendance [${input.action}] for staff [${input.staffId}] on ${dateStr}`);

    try {
      const records: IAttendanceRecord[] = JSON.parse(localStorage.getItem('glopro_attendance') || '[]');

      if (input.action === 'check_in') {
        const record: IAttendanceRecord = {
          id: `att_${Date.now()}`,
          staffId: input.staffId,
          date: dateStr,
          checkInTime: timeStr,
          status: parseInt(timeStr.split(':')[0]) >= 9 ? 'late' : 'on_time',
          note: input.note
        };
        records.push(record);
        localStorage.setItem('glopro_attendance', JSON.stringify(records));
        return { success: true, data: record, executionTimeMs: Date.now() - startTime };
      } else if (input.action === 'check_out') {
        const idx = records.findIndex(r => r.staffId === input.staffId && r.date === dateStr);
        if (idx !== -1) {
          records[idx].checkOutTime = timeStr;
          localStorage.setItem('glopro_attendance', JSON.stringify(records));
          return { success: true, data: records[idx], executionTimeMs: Date.now() - startTime };
        }
      }

      const staffRecords = records.filter(r => r.staffId === input.staffId);
      return {
        success: true,
        data: staffRecords,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManageAttendanceTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process attendance.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
