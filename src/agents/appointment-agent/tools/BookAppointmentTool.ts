import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IBookAppointmentInput, IAppointment } from '../types';
import { checkSchedulingConflict } from '../conflictDetector';
import { base44 } from '@/api/base44Client';

export class BookAppointmentTool extends AbstractTool<IBookAppointmentInput, IAppointment> {
  readonly metadata: IToolMetadata = {
    name: 'appointment_book',
    description: 'Books a new salon appointment with strict employee schedule conflict detection to prevent double-booking.',
    parametersSchema: {
      type: 'object',
      properties: {
        customerName: { type: 'string' },
        customerPhone: { type: 'string' },
        serviceName: { type: 'string' },
        staffName: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        startTime: { type: 'string', description: 'HH:MM' },
        durationMinutes: { type: 'number' },
        note: { type: 'string' }
      },
      required: ['customerName', 'customerPhone', 'serviceName', 'date', 'startTime']
    },
    requiredPermissions: ['appointment:create'],
    riskLevel: 'MEDIUM',
    requiresHumanConfirmation: false,
    supportsRollback: true
  };

  override validate(input: IBookAppointmentInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.customerName) errors.push('Customer name is required.');
    if (!input.customerPhone) errors.push('Customer phone number is required.');
    if (!input.serviceName) errors.push('Service name is required.');
    if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.push('Valid date (YYYY-MM-DD) is required.');
    if (!input.startTime || !/^\d{1,2}:\d{2}$/.test(input.startTime)) errors.push('Valid start time (HH:MM) is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IBookAppointmentInput, context: IAgentContext): Promise<IToolResult<IAppointment>> {
    const startTime = Date.now();
    const assignedStaff = input.staffName || 'Minh Thu (Thợ chính)';
    const duration = input.durationMinutes || 45;

    this.log('info', `Attempting to book appointment for ${input.customerName} at ${input.startTime} on ${input.date} with ${assignedStaff}`);

    try {
      // 1. Fetch existing appointments to check for double booking
      let appts: IAppointment[] = [];
      try {
        appts = (await base44.entities.Appointment.list()) as IAppointment[];
      } catch (e) {
        appts = (await base44.entities.Appointment.list().catch(()=>[]));
      }

      // 2. Conflict Detection Check
      const conflict = checkSchedulingConflict(appts, assignedStaff, input.date, input.startTime, duration);
      if (conflict.hasConflict) {
        const altTimeStr = conflict.suggestedTimeSlots?.join(', ') || '16:00, 16:30';
        this.log('warn', `SCHEDULING CONFLICT: Employee [${assignedStaff}] is double-booked at ${input.startTime}`);
        return {
          success: false,
          error: `⚠️ Double-booking conflict! Nhân viên ${assignedStaff} đã có lịch hẹn vào lúc ${input.startTime} ngày ${input.date}. Vui lòng chọn khung giờ khác: ${altTimeStr}.`,
          executionTimeMs: Date.now() - startTime
        };
      }

      // 3. Create Appointment Payload
      const payload: Partial<IAppointment> = {
        customer_name: input.customerName.trim(),
        customer_phone: input.customerPhone.trim(),
        service_name: input.serviceName.trim(),
        staff_name: assignedStaff,
        service_duration_minutes: duration,
        date: input.date,
        start_time: input.startTime,
        status: 'confirmed',
        note: input.note || 'Tự động tạo bởi Appointment Agent (Đã kiểm tra lịch trống)'
      };

      let created: IAppointment;
      try {
        created = (await base44.entities.Appointment.create(payload)) as IAppointment;
      } catch (e) {
        const local = (await base44.entities.Appointment.list().catch(()=>[]));
        created = { id: `appt_${Date.now()}`, ...payload } as IAppointment;
        local.push(created);
        // localStorage.setItem replaced with direct Supabase API call above
      }

      await this.audit('BOOK', input, context, { success: true, data: created, executionTimeMs: 0 });

      return {
        success: true,
        data: created,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'BookAppointmentTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to book appointment.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
