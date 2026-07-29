import { IAgentContext } from '../contracts/context.types';
import { ILogger } from './Logger';

export interface IErrorHandler {
  handle(error: Error, context: IAgentContext): { userMessage: string; recoverable: boolean };
}

export class ErrorHandler implements IErrorHandler {
  constructor(private readonly logger: ILogger) {}

  handle(error: Error, context: IAgentContext): { userMessage: string; recoverable: boolean } {
    this.logger.error(`AI Framework Exception [Session: ${context.sessionId}]`, error);
    return {
      userMessage: 'An internal AI processing error occurred. Please refine your prompt or try again.',
      recoverable: true
    };
  }
}
