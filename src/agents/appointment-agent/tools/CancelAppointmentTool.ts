import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ICancelAppointmentInput, IAppointment } from '../types';
import { base44 } from '@/api/base44Client';

export class CancelAppointmentTool extends AbstractTool<ICancelAppointmentInput, IAppointment> {
  readonly metadata: IToolMetadata = {
    name: 'appointment_cancel',
    description: 'Cancels an existing appointment, frees up the employee schedule slot, and updates appointment status to cancelled.',
    parametersSchema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        reason: { type: 'string' }
      },
      required: ['appointmentId', 'reason']
    },
    requiredPermissions: ['appointment:cancel'],
    riskLevel: 'MEDIUM',
    requiresHumanConfirmation: false,
    supportsRollback: true
  };

  override validate(input: ICancelAppointmentInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.appointmentId) errors.push('Appointment ID is required.');
    if (!input.reason || input.reason.trim().length === 0) errors.push('Cancellation reason is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: ICancelAppointmentInput, context: IAgentContext): Promise<IToolResult<IAppointment>> {
    const startTime = Date.now();
    this.log('info', `Cancelling appointment [${input.appointmentId}]. Reason: ${input.reason}`);

    try {
      const updates: Partial<IAppointment> = {
        status: 'cancelled',
        note: `Hủy lịch: ${input.reason}`
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

      await this.audit('CANCEL', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'CancelAppointmentTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to cancel appointment.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
