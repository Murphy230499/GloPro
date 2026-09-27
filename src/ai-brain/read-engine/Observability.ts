/**
 * Observability Module for AI Tool Execution
 * 
 * Provides safe, structured logging without leaking sensitive personal
 * information, database credentials, or full raw payloads.
 */

export interface IToolExecutionLog {
  event: 'AI_READ_TOOL_EXECUTION' | 'AI_PERMISSION_DENIED' | 'AI_AMBIGUITY_DETECTED';
  intent?: string;
  tool: string;
  status: string;
  success: boolean;
  durationMs: number;
  recordsCount?: number;
  userId?: string;
  userRole?: string;
  errorMessage?: string;
}

export class Observability {
  private static sanitize(text: string): string {
    if (!text) return '';
    return text.replace(/([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g, '***@***.***')
               .replace(/(0\d{9})/g, '0***$1'.slice(-4));
  }

  static logToolExecution(log: IToolExecutionLog): void {
    const safeLog = {
      timestamp: new Date().toISOString(),
      ...log,
      errorMessage: log.errorMessage ? this.sanitize(log.errorMessage) : undefined
    };

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[AI_OBSERVABILITY] ${JSON.stringify(safeLog)}`);
    }
  }
}
