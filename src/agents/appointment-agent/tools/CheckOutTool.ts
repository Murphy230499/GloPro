import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ICheckOutInput, IAppointment } from '../types';
import { base44 } from '@/api/base44Client';

export class CheckOutTool extends AbstractTool<ICheckOutInput, IAppointment> {
  readonly metadata: IToolMetadata = {
    name: 'appointment_check_out',
    description: 'Marks appointment as completed and generates service checkout receipt.',
    parametersSchema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        paymentMethod: { type: 'string', enum: ['cash', 'transfer', 'card'] }
      },
      required: ['appointmentId']
    },
    requiredPermissions: ['appointment:update'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: ICheckOutInput): IToolValidationResult {
    if (!input || !input.appointmentId) {
      return { valid: false, errors: ['Appointment ID is required for checkout.'] };
    }
    return { valid: true };
  }

  async execute(input: ICheckOutInput, context: IAgentContext): Promise<IToolResult<IAppointment>> {
    const startTime = Date.now();
    this.log('info', `Checking out appointment ID: ${input.appointmentId}`);

    try {
      const updates: Partial<IAppointment> = {
        status: 'completed',
        note: `Hoàn tất làm dịch vụ. Thanh toán: ${input.paymentMethod || 'Tiền mặt'}`
      };

      let updated: IAppointment;
      try {
        updated = (await base44.entities.Appointment.update(input.appointmentId, updates)) as IAppointment;
      } catch (e) {
        const local: IAppointment[] = (await base44.entities.Appointment.list().catch(()=>[]));
        const idx = local.findIndex(a => a.id === input.appointmentId);
        if (idx !== -1) {
          local[idx] = { ...local[idx], ...updates };
          updated = local[idx];
          // localStorage.setItem replaced with direct Supabase API call above
        } else {
          throw new Error('Appointment not found.');
        }
      }

      await this.audit('CHECK_OUT', input, context, { success: true, data: updated, executionTimeMs: 0 });

      return {
        success: true,
        data: updated,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'CheckOutTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process checkout.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
