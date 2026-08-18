import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IWaitingListInput } from '../types';

export interface IWaitingListEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  preferredDate: string;
  preferredTime: string;
  serviceName: string;
  createdAt: string;
}

export class WaitingListTool extends AbstractTool<IWaitingListInput, IWaitingListEntry[]> {
  readonly metadata: IToolMetadata = {
    name: 'appointment_waiting_list',
    description: 'Manages salon waiting list entries when preferred employee or time slots are fully booked.',
    parametersSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['add', 'remove', 'list'] },
        customerName: { type: 'string' },
        customerPhone: { type: 'string' },
        preferredDate: { type: 'string' },
        preferredTime: { type: 'string' },
        serviceName: { type: 'string' },
        entryId: { type: 'string' }
      },
      required: ['action']
    },
    requiredPermissions: ['appointment:update'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IWaitingListInput): IToolValidationResult {
    if (!input || !['add', 'remove', 'list'].includes(input.action)) {
      return { valid: false, errors: ['Action must be one of: add, remove, list'] };
    }
    if (input.action === 'add' && (!input.customerName || !input.customerPhone)) {
      return { valid: false, errors: ['Customer name and phone are required to add to waiting list.'] };
    }
    return { valid: true };
  }

  async execute(input: IWaitingListInput, context: IAgentContext): Promise<IToolResult<IWaitingListEntry[]>> {
    const startTime = Date.now();
    this.log('info', `Managing waiting list action: ${input.action}`);

    try {
      const list: IWaitingListEntry[] = JSON.parse(localStorage.getItem('glopro_waiting_list') || '[]');

      if (input.action === 'add') {
        const entry: IWaitingListEntry = {
          id: `wait_${Date.now()}`,
          customerName: input.customerName || 'Khách',
          customerPhone: input.customerPhone || '0988888888',
          preferredDate: input.preferredDate || new Date().toISOString().split('T')[0],
          preferredTime: input.preferredTime || '15:00',
          serviceName: input.serviceName || 'Dịch vụ Salon',
          createdAt: new Date().toISOString()
        };
        list.push(entry);
        /* localStorage.setItem('glopro_waiting_list') removed */
      } else if (input.action === 'remove' && input.entryId) {
        const updated = list.filter(e => e.id !== input.entryId);
        /* localStorage.setItem('glopro_waiting_list') removed */
        return { success: true, data: updated, executionTimeMs: Date.now() - startTime };
      }

      return {
        success: true,
        data: list,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'WaitingListTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to process waiting list.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
