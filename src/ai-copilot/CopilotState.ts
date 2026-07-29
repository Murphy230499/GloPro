import { ICustomer } from '@/agents/customer-agent/types';
import { IAppointment } from '@/agents/appointment-agent/types';
import { IInvoice } from '@/agents/cashier-agent/types';

export interface ICopilotState {
  currentPage: string;
  selectedCustomer?: ICustomer | null;
  selectedInvoice?: IInvoice | null;
  selectedAppointment?: IAppointment | null;
  selectedEmployee?: { id: string; name: string; role: string } | null;
  currentUser: { id: string; name: string; role: string; email?: string };
  salonBranch: { id: string; name: string; address?: string };
  currentFilters: Record<string, unknown>;
  currentSearch: string;
  currentPermissions: string[];
}

export interface IResolvedContextualQuery {
  originalQuery: string;
  resolvedQuery: string;
  inferredTarget?: {
    type: 'customer' | 'appointment' | 'invoice' | 'employee';
    id: string;
    name: string;
  };
  contextApplied: string[];
}

/**
 * Contextual Reference Resolver: Analyzes pronouns ("her", "his", "this customer", "this appointment", "this invoice")
 * and resolves them directly using copilotState without asking unnecessary questions!
 */
export function resolveContextualReferences(query: string, state: ICopilotState): IResolvedContextualQuery {
  let resolvedQuery = query;
  const contextApplied: string[] = [];
  let inferredTarget: IResolvedContextualQuery['inferredTarget'] = undefined;

  const lower = query.toLowerCase();

  // 1. CUSTOMER PRONOUN RESOLUTION ("her", "his", "khách này", "chị ấy", "anh ấy", "khách hàng này", "sđt cô ấy")
  if (
    lower.includes('her') || lower.includes('his') || lower.includes('chị ấy') || lower.includes('anh ấy') ||
    lower.includes('cô ấy') || lower.includes('khách này') || lower.includes('người này') || lower.includes('khách hàng này')
  ) {
    if (state.selectedCustomer) {
      const c = state.selectedCustomer;
      resolvedQuery = query.replace(/(?:her|his|chị ấy|anh ấy|cô ấy|khách này|người này|khách hàng này)/gi, `${c.name} (SĐT: ${c.phone}, ID: ${c.id})`);
      inferredTarget = { type: 'customer', id: c.id, name: c.name };
      contextApplied.push(`Tự động nhận diện đối tượng "khách hàng": ${c.name}`);
    }
  }

  // 2. APPOINTMENT PRONOUN RESOLUTION ("this appointment", "lịch hẹn này", "ca này", "suất này")
  if (lower.includes('this appointment') || lower.includes('lịch hẹn này') || lower.includes('ca này') || lower.includes('suất này')) {
    if (state.selectedAppointment) {
      const a = state.selectedAppointment;
      resolvedQuery = query.replace(/(?:this appointment|lịch hẹn này|ca này|suất này)/gi, `lịch hẹn [${a.id}] của ${a.customer_name} lúc ${a.start_time}`);
      inferredTarget = { type: 'appointment', id: a.id, name: a.customer_name };
      contextApplied.push(`Tự động nhận diện đối tượng "lịch hẹn": ${a.id} (${a.customer_name})`);
    }
  }

  // 3. INVOICE PRONOUN RESOLUTION ("this invoice", "this bill", "hóa đơn này", "đơn này")
  if (lower.includes('this invoice') || lower.includes('this bill') || lower.includes('hóa đơn này') || lower.includes('đơn này')) {
    if (state.selectedInvoice) {
      const inv = state.selectedInvoice;
      resolvedQuery = query.replace(/(?:this invoice|this bill|hóa đơn này|đơn này)/gi, `hóa đơn [${inv.invoiceNumber || inv.id}] của ${inv.customerName}`);
      inferredTarget = { type: 'invoice', id: inv.id, name: inv.invoiceNumber || inv.id };
      contextApplied.push(`Tự động nhận diện đối tượng "hóa đơn": ${inv.invoiceNumber || inv.id}`);
    }
  }

  // 4. PAGE-BASED FALLBACK CONTEXT (When on /customers page without explicit pronoun)
  if (!inferredTarget && state.currentPage === '/customers' && state.selectedCustomer) {
    if (lower.includes('phone') || lower.includes('đổi số') || lower.includes('điện thoại') || lower.includes('địa chỉ') || lower.includes('hạng')) {
      const c = state.selectedCustomer;
      inferredTarget = { type: 'customer', id: c.id, name: c.name };
      contextApplied.push(`Đang ở trang /customers - Áp dụng khách đang chọn: ${c.name}`);
    }
  }

  return {
    originalQuery: query,
    resolvedQuery,
    inferredTarget,
    contextApplied
  };
}
