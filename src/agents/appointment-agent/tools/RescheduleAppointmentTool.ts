import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IRescheduleAppointmentInput, IAppointment } from '../types';
import { checkSchedulingConflict } from '../conflictDetector';
import { base44 } from '@/api/base44Client';

export class RescheduleAppointmentTool extends AbstractTool<IRescheduleAppointmentInput, IAppointment> {
  readonly metadata: IToolMetadata = {
    name: 'appointment_reschedule',
    description: 'Reschedules an existing appointment to a new date and time slot after verifying employee schedule availability.',
    parametersSchema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        newDate: { type: 'string', description: 'YYYY-MM-DD' },
        newStartTime: { type: 'string', description: 'HH:MM' },
        reason: { type: 'string' }
      },
      required: ['appointmentId', 'newDate', 'newStartTime']
    },
    requiredPermissions: ['appointment:update'],
    riskLevel: 'MEDIUM',
    requiresHumanConfirmation: false,
    supportsRollback: true
  };

  override validate(input: IRescheduleAppointmentInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.appointmentId) errors.push('Appointment ID is required.');
    if (!input.newDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.newDate)) errors.push('Valid new date (YYYY-MM-DD) is required.');
    if (!input.newStartTime || !/^\d{1,2}:\d{2}$/.test(input.newStartTime)) errors.push('Valid new start time (HH:MM) is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IRescheduleAppointmentInput, context: IAgentContext): Promise<IToolResult<IAppointment>> {
    const startTime = Date.now();
    this.log('info', `Rescheduling appointment [${input.appointmentId}] to ${input.newDate} at ${input.newStartTime}`);

    try {
      let appts: IAppointment[] = [];
      try {
        appts = (await base44.entities.Appointment.list()) as IAppointment[];
      } catch (e) {
        appts = JSON.parse(localStorage.getItem('glopro_appointments') || '[]');
      }

      const existing = appts.find(a => a.id === input.appointmentId);
      if (!existing) throw new Error(`Appointment with ID [${input.appointmentId}] not found.`);

      // Conflict Detection Check for target time slot
      const conflict = checkSchedulingConflict(
        appts,
        existing.staff_name || 'Staff',
        input.newDate,
        input.newStartTime,
        existing.service_duration_minutes || 45,
        input.appointmentId
      );

      if (conflict.hasConflict) {
        return {
          success: false,
          error: `⚠️ Không thể đổi lịch! Khung giờ ${input.newStartTime} ngày ${input.newDate} đã có lịch trùng.`,
          executionTimeMs: Date.now() - startTime
        };
      }

      const updates: Partial<IAppointment> = {
        date: input.newDate,
        start_time: input.newStartTime,
        note: `Đổi lịch: ${input.reason || 'Khách đổi giờ'}`
      };

      let updated: IAppointment;
      try {
        updated = (await base44.entities.Appointment.update(input.appointmentId, updates)) as IAppointment;
      } catch (e) {
        const idx = appts.findIndex(a => a.id === input.appointmentId);
        appts[idx] = { ...appts[idx], ...updates };
        updated = appts[idx];
        localStorage.setItem('glopro_appointments', JSON.stringify(appts));
      }

      await this.audit('RESCHEDULE', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'RescheduleAppointmentTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to reschedule appointment.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
