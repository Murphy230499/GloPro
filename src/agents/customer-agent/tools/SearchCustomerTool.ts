import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ISearchCustomerInput, ICustomer } from '../types';
import { base44 } from '@/api/base44Client';

export class SearchCustomerTool extends AbstractTool<ISearchCustomerInput, ICustomer[]> {
  readonly metadata: IToolMetadata = {
    name: 'customer_search',
    description: 'Searches for customers in the database by name, phone number, email, or membership tier.',
    parametersSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Customer name, phone number, or email to search for' },
        tier: { type: 'string', description: 'Optional membership tier filter' },
        limit: { type: 'number', description: 'Maximum number of results to return' }
      },
      required: ['query']
    },
    requiredPermissions: ['customer:read'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: ISearchCustomerInput): IToolValidationResult {
    if (!input || !input.query || input.query.trim().length === 0) {
      return { valid: false, errors: ['Search query string is required.'] };
    }
    return { valid: true };
  }

  async execute(input: ISearchCustomerInput, context: IAgentContext): Promise<IToolResult<ICustomer[]>> {
    const startTime = Date.now();
    this.log('info', `Searching customer with query: "${input.query}"`);

    try {
      // API invocation
      let list: ICustomer[] = [];
      try {
        list = (await base44.entities.Customer.list()) as ICustomer[];
      } catch (e) {
        list = (await base44.entities.Customer.list().catch(()=>[]));
      }

      const q = input.query.toLowerCase().trim();
      const filtered = list.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      );

      const limit = input.limit || 10;
      const results = filtered.slice(0, limit);

      return {
        success: true,
        data: results,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'SearchCustomerTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to search customers.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
