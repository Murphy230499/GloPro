/**
 * Read Planner
 * 
 * Analyzes structured intents, resolves contextual references,
 * checks safety guards (injection, dumping database),
 * and prepares validated execution plans for Read Tools.
 */

import { IStructuredIntent } from '../intent/IntentTypes';
import { ToolContext, ToolResult } from './contracts/ToolContracts';

export interface PlannedStep {
  toolName: string;
  parameters: Record<string, any>;
  purpose: string;
}

export interface ReadPlan {
  success: boolean;
  rejected?: boolean;
  rejectionReason?: string;
  needsClarification?: boolean;
  clarificationMessage?: string;
  steps: PlannedStep[];
  directResult?: ToolResult;
}

export class ReadPlanner {
  /**
   * Generates a read plan based on structured intent and context.
   */
  static plan(
    query: string,
    structuredIntent: IStructuredIntent,
    context: ToolContext = {},
    history: Array<{ role: string; content: string }> = []
  ): ReadPlan {
    const rawLower = query.toLowerCase().trim();

    // 1. SECURITY & DATA DUMP GUARDS
    if (
      rawLower.includes('toàn bộ database') ||
      rawLower.includes('dump database') ||
      rawLower.includes('xem toàn bộ database') ||
      rawLower.includes('select * from') ||
      rawLower.includes('xuất tất cả bảng')
    ) {
      return {
        success: false,
        rejected: true,
        rejectionReason: 'Hệ thống không cho phép truy vấn hoặc xuất toàn bộ cơ sở dữ liệu thô nhằm đảm bảo an toàn bảo mật EasySalon.',
        steps: []
      };
    }

    if (
      rawLower.includes('ignore previous instructions') ||
      rawLower.includes('bỏ qua hướng dẫn') ||
      rawLower.includes('bỏ qua chỉ dẫn') ||
      rawLower.includes('bỏ qua quy tắc')
    ) {
      return {
        success: false,
        rejected: true,
        rejectionReason: 'Yêu cầu bị từ chối do vi phạm quy tắc an toàn bảo mật hệ thống.',
        steps: []
      };
    }

    // 2. MULTI-TURN AMBIGUITY RESOLUTION
    // If the conversation context has pending disambiguation or previous turn asked user to choose
    const pendingDisambiguation = context.pendingDisambiguation || this.detectPendingDisambiguationFromHistory(history);
    if (pendingDisambiguation) {
      const resolvedCandidate = this.resolveCandidateFromText(query, pendingDisambiguation.candidates);
      if (resolvedCandidate) {
        // Successfully resolved from choice!
        if (pendingDisambiguation.intent === 'QUERY_STAFF_REVENUE') {
          return {
            success: true,
            steps: [
              {
                toolName: 'RevenueReadTool',
                purpose: 'Query revenue for disambiguated staff member',
                parameters: {
                  type: 'staff',
                  staffId: resolvedCandidate.id,
                  staffName: resolvedCandidate.name,
                  period: 'month'
                }
              }
            ]
          };
        }

        if (pendingDisambiguation.intent === 'SEARCH_CUSTOMER') {
          return {
            success: true,
            steps: [
              {
                toolName: 'CustomerReadTool',
                purpose: 'Get customer details for disambiguated customer',
                parameters: {
                  id: resolvedCandidate.id
                }
              }
            ]
          };
        }
      }
    }

    // 3. CONTEXTUAL PRONOUN RESOLUTION ("khách này", "lịch này", "đơn này")
    const isThisCustomer = /\b(khách này|khách đó|anh này|chị này|anh ấy|chị ấy)\b/i.test(rawLower);
    const isThisAppointment = /\b(lịch này|lịch hẹn này)\b/i.test(rawLower);
    const isThisInvoice = /\b(đơn này|hóa đơn này|bill này)\b/i.test(rawLower);

    if (isThisCustomer && !context.selectedCustomer && !structuredIntent.entities.customer?.value) {
      return {
        success: false,
        needsClarification: true,
        clarificationMessage: 'Bạn đang muốn tra cứu thông tin cho khách hàng nào? Vui lòng cung cấp tên hoặc số điện thoại.',
        steps: []
      };
    }

    // 4. PLAN ACCORDING TO DOMAIN INTENT
    const intent = structuredIntent.intent;
    const entities = structuredIntent.entities || {};
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    switch (intent) {
      case 'QUERY_REVENUE': {
        // Check if query is about top selling services/products
        if (rawLower.includes('bán chạy') || rawLower.includes('top dịch vụ') || rawLower.includes('top sản phẩm') || rawLower.includes('chạy nhất')) {
          return {
            success: true,
            steps: [
              {
                toolName: 'RevenueReadTool',
                purpose: 'Query top selling services and products',
                parameters: { type: 'top_items', period: 'month' }
              }
            ]
          };
        }

        let period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'day';
        let type: 'today' | 'period' = 'today';

        if (rawLower.includes('tháng này') || rawLower.includes('trong tháng')) {
          period = 'month';
          type = 'period';
        } else if (rawLower.includes('tuần này') || rawLower.includes('7 ngày')) {
          period = 'week';
          type = 'period';
        } else if (rawLower.includes('quý này')) {
          period = 'quarter';
          type = 'period';
        } else if (rawLower.includes('năm nay')) {
          period = 'year';
          type = 'period';
        }

        return {
          success: true,
          steps: [
            {
              toolName: 'RevenueReadTool',
              purpose: 'Query salon revenue statistics',
              parameters: { type, period, date: type === 'today' ? todayStr : undefined }
            }
          ]
        };
      }

      case 'QUERY_STAFF_REVENUE': {
        const staffName = entities.staff?.value || '';
        return {
          success: true,
          steps: [
            {
              toolName: 'StaffReadTool',
              purpose: 'Resolve staff identity first to prevent ambiguity',
              parameters: { name: staffName }
            },
            {
              toolName: 'RevenueReadTool',
              purpose: 'Query revenue generated by resolved staff',
              parameters: {
                type: 'staff',
                staffName: staffName,
                period: rawLower.includes('tháng') ? 'month' : 'month'
              }
            }
          ]
        };
      }

      case 'SEARCH_CUSTOMER': {
        const targetName = entities.customer?.value || entities.name?.value || entities.phone?.value || '';
        return {
          success: true,
          steps: [
            {
              toolName: 'CustomerReadTool',
              purpose: 'Search customer by query',
              parameters: { query: targetName }
            }
          ]
        };
      }

      case 'SEARCH_STAFF': {
        const staffName = entities.staff?.value || '';
        return {
          success: true,
          steps: [
            {
              toolName: 'StaffReadTool',
              purpose: 'Search salon staff',
              parameters: { name: staffName }
            }
          ]
        };
      }

      case 'SEARCH_SERVICE': {
        const serviceName = entities.service?.value || '';
        return {
          success: true,
          steps: [
            {
              toolName: 'ServiceReadTool',
              purpose: 'Search salon services catalog',
              parameters: { query: serviceName }
            }
          ]
        };
      }

      case 'SEARCH_PRODUCT': {
        const prodName = entities.product?.value || '';
        return {
          success: true,
          steps: [
            {
              toolName: 'ProductReadTool',
              purpose: 'Search products and stock inventory',
              parameters: { query: prodName }
            }
          ]
        };
      }

      case 'READ_STOCK': {
        const prodName = entities.product?.value || '';
        const isLowStock = rawLower.includes('sắp hết') || rawLower.includes('cảnh báo');
        return {
          success: true,
          steps: [
            {
              toolName: 'InventoryReadTool',
              purpose: 'Query real product stock or low stock alerts',
              parameters: {
                productName: prodName,
                type: isLowStock ? 'low_stock' : (prodName ? 'stock_level' : 'all'),
                branchId: context.branchId
              }
            }
          ]
        };
      }

      case 'QUERY_PAYROLL': {
        const staffName = entities.staff?.value || '';
        return {
          success: true,
          steps: [
            {
              toolName: 'PayrollReadTool',
              purpose: 'Query staff payroll and salary breakdown',
              parameters: {
                staffName,
                month: entities.date?.value
              }
            }
          ]
        };
      }

      case 'SEARCH_APPOINTMENT': {
        const dateVal = entities.date?.value || (rawLower.includes('hôm nay') ? todayStr : undefined);
        const phoneVal = entities.phone?.value || entities.customer?.value || (context.selectedCustomer ? context.selectedCustomer.phone : undefined);
        return {
          success: true,
          steps: [
            {
              toolName: 'AppointmentReadTool',
              purpose: 'Search customer appointments',
              parameters: {
                date: dateVal,
                customerPhone: phoneVal
              }
            }
          ]
        };
      }

      default: {
        // Special domain requests like "Khách này mua gì?"
        if (isThisCustomer && (rawLower.includes('mua gì') || rawLower.includes('lịch sử mua') || rawLower.includes('hóa đơn'))) {
          const cust = context.selectedCustomer;
          return {
            success: true,
            steps: [
              {
                toolName: 'InvoiceReadTool',
                purpose: 'Query purchase history of selected customer',
                parameters: {
                  customerId: cust?.id,
                  customerPhone: cust?.phone
                }
              }
            ]
          };
        }

        if (isThisCustomer && (rawLower.includes('lịch') || rawLower.includes('hẹn'))) {
          const cust = context.selectedCustomer;
          return {
            success: true,
            steps: [
              {
                toolName: 'AppointmentReadTool',
                purpose: 'Query appointments for selected customer',
                parameters: {
                  customerPhone: cust?.phone,
                  customerId: cust?.id,
                  date: rawLower.includes('hôm nay') ? todayStr : undefined
                }
              }
            ]
          };
        }

        return {
          success: false,
          steps: []
        };
      }
    }
  }

  private static detectPendingDisambiguationFromHistory(history: Array<{ role: string; content: string }>) {
    if (!history || history.length === 0) return null;
    const lastAssistantMsg = [...history].reverse().find(h => h.role === 'assistant' || h.role === 'model');
    if (!lastAssistantMsg) return null;

    const content = lastAssistantMsg.content || '';
    if (content.includes('Tìm thấy') && (content.includes('nhân viên') || content.includes('khách hàng'))) {
      // Look for candidates
      const lines = content.split('\n').filter(l => /^\d+\.\s+\*\*/.test(l.trim()));
      if (lines.length >= 2) {
        const isStaff = content.includes('nhân viên');
        const candidates = lines.map((l, i) => {
          const nameMatch = l.match(/\*\*([^*]+)\*\*/);
          return {
            id: `candidate_${i + 1}`,
            name: nameMatch ? nameMatch[1] : `Lựa chọn ${i + 1}`
          };
        });
        return {
          intent: isStaff ? 'QUERY_STAFF_REVENUE' : 'SEARCH_CUSTOMER',
          entityType: isStaff ? 'staff' as const : 'customer' as const,
          candidates,
          originalQuery: ''
        };
      }
    }
    return null;
  }

  private static resolveCandidateFromText(query: string, candidates: any[]) {
    const q = query.toLowerCase().trim();
    // Check if query matches a name or number
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (q === `${i + 1}` || q.includes(c.name.toLowerCase()) || (c.name && c.name.toLowerCase().includes(q))) {
        return c;
      }
    }
    return null;
  }
}
