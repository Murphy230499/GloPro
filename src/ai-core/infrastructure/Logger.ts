export interface ILogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

export class Logger implements ILogger {
  debug(msg: string, meta?: Record<string, unknown>): void {
    console.debug(`[DEBUG] ${new Date().toISOString()} - ${msg}`, meta || '');
  }

  info(msg: string, meta?: Record<string, unknown>): void {
    console.info(`[INFO] ${new Date().toISOString()} - ${msg}`, meta || '');
  }

  warn(msg: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta || '');
  }

  error(msg: string, error?: Error, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error || '', meta || '');
  }
}
