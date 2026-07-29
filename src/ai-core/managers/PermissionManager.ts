import { IPermissionManager } from '../contracts/security.types';
import { IAgentContext } from '../contracts/context.types';
import { ILogger } from '../infrastructure/Logger';

export class PermissionManager implements IPermissionManager {
  constructor(private readonly logger: ILogger) {}

  isAuthorized(context: IAgentContext, requiredPermissions: string[]): boolean {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    const userPerms = new Set(context.permissions || []);
    const granted = requiredPermissions.every(p => userPerms.has(p) || userPerms.has('*'));
    if (!granted) {
      this.logger.warn(`Permission DENIED for user [${context.userId}]. Required: ${requiredPermissions.join(', ')}`);
    }
    return granted;
  }
}
