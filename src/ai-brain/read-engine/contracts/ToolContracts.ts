/**
 * Read Tool & Grounding Engine Contracts
 * 
 * Defines standard interfaces for read-only tools, execution contexts,
 * standard results, and grounded context.
 */

export type ToolResultStatus =
  | 'SUCCESS'
  | 'EMPTY_RESULT'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'PERMISSION_DENIED'
  | 'TOOL_ERROR'
  | 'INVALID_RESULT'
  | 'NO_AVAILABLE_TOOL'
  | 'REJECTED';

export interface ToolContext {
  userId?: string;
  organizationId?: string;
  conversationId?: string;
  currentScreen?: string;
  locale?: string;
  role?: string;
  permissions?: string[] | { type: string; blocked?: string[]; role?: string } | 'all';
  branchId?: string;
  branchName?: string;
  selectedCustomer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    tier?: string;
  } | null;
  selectedAppointment?: {
    id: string;
    customer_name?: string;
    customer_phone?: string;
    service_name?: string;
    date?: string;
    start_time?: string;
  } | null;
  selectedInvoice?: {
    id: string;
    invoice_code?: string;
    customer_name?: string;
    total?: number;
    date?: string;
  } | null;
  selectedEmployee?: {
    id: string;
    name: string;
    role?: string;
  } | null;
  pendingDisambiguation?: {
    intent: string;
    entityType: 'staff' | 'customer' | 'service';
    candidates: any[];
    originalQuery: string;
  } | null;
}

export interface ToolResult {
  success: boolean;
  status: ToolResultStatus;
  toolName: string;
  data?: any;
  metadata?: {
    total?: number;
    source?: string;
    queriedAt?: string;
    executionTimeMs?: number;
    isAmbiguous?: boolean;
    candidates?: any[];
  };
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

export interface ReadTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  requiredPermission?: string; // e.g. 'reports', 'customers', 'staff', 'appointments'

  execute(
    input: any,
    context: ToolContext
  ): Promise<ToolResult>;
}

export type GroundedState = 'KNOWN' | 'UNKNOWN' | 'INFERRED';

export interface IGroundedContext {
  grounded: boolean;
  state: GroundedState;
  sources: Array<{
    tool: string;
    queriedAt: string;
    status: ToolResultStatus;
  }>;
  data: any;
  summary: string;
  requiresDisambiguation?: boolean;
  candidates?: any[];
  permissionDenied?: boolean;
  error?: string;
}
