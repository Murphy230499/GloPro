import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IFindAvailableEmployeeInput, IAppointment } from '../types';
import { checkSchedulingConflict } from '../conflictDetector';
import { base44 } from '@/api/base44Client';

export interface IAvailableEmployee {
  staffId: string;
  staffName: string;
  role: string;
  isAvailable: boolean;
}

export class FindAvailableEmployeeTool extends AbstractTool<IFindAvailableEmployeeInput, IAvailableEmployee[]> {
  readonly metadata: IToolMetadata = {
    name: 'appointment_find_employee',
    description: 'Finds all active salon employees who are completely free and available for a given date, time, and duration.',
    parametersSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD' },
        startTime: { type: 'string', description: 'HH:MM' },
        durationMinutes: { type: 'number' }
      },
      required: ['date', 'startTime']
    },
    requiredPermissions: ['appointment:read'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IFindAvailableEmployeeInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.date) errors.push('Date is required.');
    if (!input.startTime) errors.push('Start time is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IFindAvailableEmployeeInput, context: IAgentContext): Promise<IToolResult<IAvailableEmployee[]>> {
    const startTime = Date.now();
    const duration = input.durationMinutes || 45;
    this.log('info', `Finding available employees for ${input.startTime} on ${input.date}`);

    try {
      let staffList: any[] = [];
      let appts: IAppointment[] = [];

      try {
        staffList = await base44.entities.Staff.list();
        appts = (await base44.entities.Appointment.list()) as IAppointment[];
      } catch (e) {
        staffList = (await base44.entities.Staff.list().catch(()=>[]));
        appts = (await base44.entities.Appointment.list().catch(()=>[]));
      }

      const availableList: IAvailableEmployee[] = [];

      for (const st of staffList) {
        if (st.is_active === false) continue;
        const conflict = checkSchedulingConflict(appts, st.name, input.date, input.startTime, duration);
        availableList.push({
          staffId: st.id,
          staffName: st.name,
          role: st.role || 'Thợ chính',
          isAvailable: !conflict.hasConflict
        });
      }

      return {
        success: true,
        data: availableList,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'FindAvailableEmployeeTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to find available employees.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
