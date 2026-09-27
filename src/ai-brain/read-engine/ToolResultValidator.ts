/**
 * Tool Result Validator
 * 
 * Inspects raw results returned by Read Tools to ensure integrity, structure,
 * and security before data enters LLM reasoning or grounded context.
 */

import { ToolResult, ToolResultStatus } from './contracts/ToolContracts';

export class ToolResultValidator {
  /**
   * Validates tool output and sanitizes invalid or malformed data.
   */
  static validate(result: any, expectedToolName: string): ToolResult {
    // 1. Must be an object
    if (!result || typeof result !== 'object') {
      return {
        success: false,
        status: 'INVALID_RESULT',
        toolName: expectedToolName,
        error: {
          code: 'MALFORMED_OUTPUT',
          message: 'Kết quả từ công cụ đọc không đúng cấu trúc object.'
        }
      };
    }

    // 2. Check tool name matching
    if (result.toolName && result.toolName !== expectedToolName) {
      return {
        success: false,
        status: 'INVALID_RESULT',
        toolName: expectedToolName,
        error: {
          code: 'TOOL_NAME_MISMATCH',
          message: `Công cụ trả về ${result.toolName} nhưng mong đợi ${expectedToolName}.`
        }
      };
    }

    // 3. Handle explicit tool errors
    if (!result.success || result.status === 'TOOL_ERROR') {
      return {
        success: false,
        status: result.status || 'TOOL_ERROR',
        toolName: expectedToolName,
        error: result.error || {
          code: 'EXECUTION_FAILED',
          message: result.message || 'Lỗi khi thực thi công cụ đọc dữ liệu.'
        },
        message: result.message
      };
    }

    // 4. Handle Permission Denied
    if (result.status === 'PERMISSION_DENIED') {
      return {
        success: false,
        status: 'PERMISSION_DENIED',
        toolName: expectedToolName,
        error: {
          code: 'PERMISSION_DENIED',
          message: result.message || 'Không có quyền truy cập dữ liệu này.'
        },
        message: result.message
      };
    }

    // 5. Handle Not Found / Empty Result
    if (result.status === 'NOT_FOUND' || result.status === 'EMPTY_RESULT') {
      return {
        success: true,
        status: result.status,
        toolName: expectedToolName,
        data: result.data || [],
        metadata: result.metadata || { total: 0 },
        message: result.message
      };
    }

    // 6. Ambiguous results (multiple matches)
    if (result.metadata?.isAmbiguous) {
      return {
        success: true,
        status: 'SUCCESS',
        toolName: expectedToolName,
        data: result.data,
        metadata: result.metadata,
        message: result.message
      };
    }

    // 7. Sanitize data payload (remove raw passwords, tokens, internal stack traces)
    const sanitizedData = this.sanitizeData(result.data);

    return {
      success: true,
      status: (result.status as ToolResultStatus) || 'SUCCESS',
      toolName: expectedToolName,
      data: sanitizedData,
      metadata: result.metadata || {},
      message: result.message
    };
  }

  private static sanitizeData(data: any): any {
    if (!data) return data;
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    if (typeof data === 'object') {
      const clean: Record<string, any> = {};
      for (const key in data) {
        if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
          continue;
        }
        clean[key] = data[key];
      }
      return clean;
    }
    return data;
  }
}
