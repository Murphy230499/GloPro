import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IManageSupplierInput, ISupplier } from '../types';

export class ManageSupplierTool extends AbstractTool<IManageSupplierInput, ISupplier | ISupplier[]> {
  readonly metadata: IToolMetadata = {
    name: 'inventory_supplier',
    description: 'Manages salon cosmetic and chemical supplier profiles, contact numbers, and catalogs.',
    parametersSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'update', 'list'] },
        supplierId: { type: 'string' },
        name: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' }
      },
      required: ['action']
    },
    requiredPermissions: ['inventory:supplier'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IManageSupplierInput): IToolValidationResult {
    if (!input || !input.action) {
      return { valid: false, errors: ['Supplier action is required.'] };
    }
    return { valid: true };
  }

  async execute(input: IManageSupplierInput, context: IAgentContext): Promise<IToolResult<ISupplier | ISupplier[]>> {
    const startTime = Date.now();
    this.log('info', `Managing supplier action [${input.action}]`);

    try {
      const suppliers: ISupplier[] = JSON.parse(localStorage.getItem('glopro_suppliers') || '[]');

      if (input.action === 'create' && input.name) {
        const sup: ISupplier = {
          id: `sup_${Date.now()}`,
          name: input.name,
          phone: input.phone || '0909000111',
          address: input.address || 'Hồ Chí Minh'
        };
        suppliers.push(sup);
        localStorage.setItem('glopro_suppliers', JSON.stringify(suppliers));
        return { success: true, data: sup, executionTimeMs: Date.now() - startTime };
      }

      if (suppliers.length === 0) {
        suppliers.push(
          { id: 'sup_1', name: 'Công ty Mỹ phẩm Loreal Việt Nam', phone: '02838221199', address: 'Quận 1, TP.HCM' },
          { id: 'sup_2', name: 'Nhà phân phối Hóa chất Salon Keratin', phone: '0903112233', address: 'Bình Thạnh, TP.HCM' }
        );
      }

      return {
        success: true,
        data: suppliers,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'ManageSupplierTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to manage suppliers.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
