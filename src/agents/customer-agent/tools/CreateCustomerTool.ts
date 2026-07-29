import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IToolRollbackResult, IAgentContext } from '@/ai-core';
import { ICreateCustomerInput, ICustomer } from '../types';
import { base44 } from '@/api/base44Client';

export class CreateCustomerTool extends AbstractTool<ICreateCustomerInput, ICustomer> {
  readonly metadata: IToolMetadata = {
    name: 'customer_create',
    description: 'Creates a new customer profile in the database with validated name and phone number.',
    parametersSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Customer full name' },
        phone: { type: 'string', description: 'Customer 10-digit phone number' },
        email: { type: 'string', description: 'Optional email address' },
        gender: { type: 'string', enum: ['male', 'female', 'other'] },
        tier: { type: 'string', enum: ['Đồng', 'Bạc', 'Vàng', 'Kim Cương'] }
      },
      required: ['name', 'phone']
    },
    requiredPermissions: ['customer:create'],
    riskLevel: 'MEDIUM',
    requiresHumanConfirmation: false,
    supportsRollback: true
  };

  override validate(input: ICreateCustomerInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.name || input.name.trim().length < 2) {
      errors.push('Customer name must be at least 2 characters long.');
    }
    if (!input.phone || !/^(0\d{9})$/.test(input.phone.trim())) {
      errors.push('Customer phone number must be a valid 10-digit Vietnamese phone number starting with 0.');
    }
    return { valid: errors.length === 0, errors };
  }

  async execute(input: ICreateCustomerInput, context: IAgentContext): Promise<IToolResult<ICustomer>> {
    const startTime = Date.now();
    this.log('info', `Creating customer profile: ${input.name} (${input.phone})`);

    const validation = this.validate(input);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors?.join(' ') || 'Invalid customer input.',
        executionTimeMs: Date.now() - startTime
      };
    }

    try {
      const payload: Partial<ICustomer> = {
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim(),
        gender: input.gender,
        tier: input.tier || 'Đồng',
        loyaltyPoints: 0,
        totalSpent: 0,
        visitCount: 1,
        debtAmount: 0,
        notes: input.initialNotes ? [input.initialNotes] : [],
        created_at: new Date().toISOString()
      };

      let created: ICustomer;
      try {
        created = (await base44.entities.Customer.create(payload)) as ICustomer;
      } catch (e) {
        const local = JSON.parse(localStorage.getItem('glopro_customers') || '[]');
        created = { id: `cust_${Date.now()}`, ...payload } as ICustomer;
        local.push(created);
        localStorage.setItem('glopro_customers', JSON.stringify(local));
      }

      await this.audit('CREATE', input, context, { success: true, data: created, executionTimeMs: 0 });

      return {
        success: true,
        data: created,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'CreateCustomerTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to create customer.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  override async rollback(input: ICreateCustomerInput, context: IAgentContext, previousResult: IToolResult<ICustomer>): Promise<IToolRollbackResult> {
    this.log('warn', `Rolling back customer creation for ID: ${previousResult.data?.id}`);
    if (previousResult.data?.id) {
      try {
        await base44.entities.Customer.delete(previousResult.data.id);
      } catch (e) {
        const local: ICustomer[] = JSON.parse(localStorage.getItem('glopro_customers') || '[]');
        const updated = local.filter(c => c.id !== previousResult.data?.id);
        localStorage.setItem('glopro_customers', JSON.stringify(updated));
      }
    }
    return { success: true };
  }
}
