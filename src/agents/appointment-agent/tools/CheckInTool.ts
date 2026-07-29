import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ICheckInInput, IAppointment } from '../types';
import { base44 } from '@/api/base44Client';

export class CheckInTool extends AbstractTool<ICheckInInput, IAppointment> {
  readonly metadata: IToolMetadata = {
    name: 'appointment_check_in',
    description: 'Processes customer check-in when arriving at salon and updates status to checked_in or in_service.',
    parametersSchema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' }
      },
      required: ['appointmentId']
    },
    requiredPermissions: ['appointment:update'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: ICheckInInput): IToolValidationResult {
    if (!input || !input.appointmentId) {
      return { valid: false, errors: ['Appointment ID is required for check-in.'] };
    }
    return { valid: true };
  }

  async execute(input: ICheckInInput, context: IAgentContext): Promise<IToolResult<IAppointment>> {
    const startTime = Date.now();
    this.log('info', `Checking in appointment ID: ${input.appointmentId}`);

    try {
      const updates: Partial<IAppointment> = {
        status: 'checked_in',
        note: 'Khách đã có mặt tại Salon'
      };

      let updated: IAppointment;
      try {
        updated = (await base44.entities.Appointment.update(input.appointmentId, updates)) as IAppointment;
      } catch (e) {
        const local: IAppointment[] = JSON.parse(localStorage.getItem('glopro_appointments') || '[]');
        const idx = local.findIndex(a => a.id === input.appointmentId);
        if (idx !== -1) {
          local[idx] = { ...local[idx], ...updates };
          updated = local[idx];
          localStorage.setItem('glopro_appointments', JSON.stringify(local));
        } else {
          throw new Error('Appointment not found.');
        }
      }

      await this.audit('CHECK_IN', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'CheckInTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process check-in.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
