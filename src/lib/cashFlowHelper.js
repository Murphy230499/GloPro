import { base44 } from '@/api/base44Client';
import { todayStr } from '@/lib/format';

// ─── Default Voucher Types ───────────────────────────────────────────────────

export const DEFAULT_INCOME_TYPES = [
  { code: 'sale',            name: 'Bán hàng / Dịch vụ',   color: '#10B981', flow: 'income', is_system: true },
  { code: 'membership_sale', name: 'Bán gói / Thẻ',         color: '#3B82F6', flow: 'income', is_system: true },
  { code: 'tip',             name: 'Tiền TIP',               color: '#F59E0B', flow: 'income', is_system: true },
  { code: 'deposit',         name: 'Đặt cọc',                color: '#8B5CF6', flow: 'income', is_system: true },
  { code: 'other_income',    name: 'Thu khác',               color: '#94A3B8', flow: 'income', is_system: true },
];

export const DEFAULT_EXPENSE_TYPES = [
  { code: 'stock_purchase',  name: 'Nhập hàng',              color: '#EF4444', flow: 'expense', is_system: true },
  { code: 'salary',          name: 'Chi lương',               color: '#F97316', flow: 'expense', is_system: true },
  { code: 'overhead',        name: 'Chi phí vận hành',       color: '#EC4899', flow: 'expense', is_system: true },
  { code: 'use_deposit',     name: 'Sử dụng tiền cọc',        color: '#8B5CF6', flow: 'expense', is_system: true },
  { code: 'other_expense',   name: 'Chi khác',               color: '#94A3B8', flow: 'expense', is_system: true },
];

/**
 * Seed default voucher types if they don't exist yet.
 * Safe to call multiple times — skips existing codes.
 */
export async function seedDefaultVoucherTypes() {
  try {
    const existing = await base44.entities.CashVoucherType.list();
    const existingCodes = new Set((existing || []).map(t => t.code));

    const allDefaults = [...DEFAULT_INCOME_TYPES, ...DEFAULT_EXPENSE_TYPES];
    await Promise.all(
      allDefaults
        .filter(t => !existingCodes.has(t.code))
        .map(t => base44.entities.CashVoucherType.create(t))
    );
  } catch (e) {
    console.warn('[cashFlowHelper] seedDefaultVoucherTypes failed:', e.message);
  }
}

// ─── Auto-code Generator ─────────────────────────────────────────────────────

const generateCode = (flow) => {
  const prefix = flow === 'income' ? 'PT' : 'PC';
  const date = todayStr().replace(/-/g, '');
  const rand = String(Math.floor(100 + Math.random() * 900));
  return `${prefix}-${date}-${rand}`;
};

// ─── Create Income Voucher (Phiếu Thu) ───────────────────────────────────────

/**
 * @param {Object} params
 * @param {string} params.typeCode     - e.g. 'sale', 'tip', 'membership_sale'
 * @param {string} params.typeName     - display name
 * @param {number} params.amount       - amount in VND
 * @param {string} [params.description]
 * @param {string} [params.note]
 * @param {string} [params.paymentMethod] - 'cash'|'card'|'transfer'|'ewallet'
 * @param {string} [params.refId]      - invoice id
 * @param {string} [params.refCode]    - invoice code
 * @param {string} [params.branchId]
 * @param {string} [params.date]       - YYYY-MM-DD, defaults to today
 */
export async function createIncomeVoucher({
  typeCode,
  typeName,
  amount,
  description = '',
  note = '',
  paymentMethod = 'cash',
  refId = null,
  refCode = null,
  branchId = null,
  date = null,
}) {
  if (!amount || amount <= 0) return null;
  try {
    return await base44.entities.CashVoucher.create({
      code: generateCode('income'),
      flow: 'income',
      type_code: typeCode,
      type_name: typeName,
      amount: Math.round(amount),
      date: date || todayStr(),
      description,
      note,
      payment_method: paymentMethod,
      source: 'auto',
      ref_id: refId,
      ref_code: refCode,
      branch_id: branchId,
      created_by: 'system',
    });
  } catch (e) {
    console.warn('[cashFlowHelper] createIncomeVoucher failed:', e.message);
    return null;
  }
}

// ─── Create Expense Voucher (Phiếu Chi) ──────────────────────────────────────

/**
 * @param {Object} params
 * @param {string} params.typeCode     - e.g. 'stock_purchase', 'salary'
 * @param {string} params.typeName
 * @param {number} params.amount
 * @param {string} [params.description]
 * @param {string} [params.note]
 * @param {string} [params.paymentMethod]
 * @param {string} [params.refId]
 * @param {string} [params.refCode]
 * @param {string} [params.branchId]
 * @param {string} [params.date]
 */
export async function createExpenseVoucher({
  typeCode,
  typeName,
  amount,
  description = '',
  note = '',
  paymentMethod = 'cash',
  refId = null,
  refCode = null,
  branchId = null,
  date = null,
}) {
  if (!amount || amount <= 0) return null;
  try {
    return await base44.entities.CashVoucher.create({
      code: generateCode('expense'),
      flow: 'expense',
      type_code: typeCode,
      type_name: typeName,
      amount: Math.round(amount),
      date: date || todayStr(),
      description,
      note,
      payment_method: paymentMethod,
      source: 'auto',
      ref_id: refId,
      ref_code: refCode,
      branch_id: branchId,
      created_by: 'system',
    });
  } catch (e) {
    console.warn('[cashFlowHelper] createExpenseVoucher failed:', e.message);
    return null;
  }
}

// ─── Payment method label helper ─────────────────────────────────────────────

export const PAYMENT_METHOD_LABELS = {
  cash: 'Tiền mặt',
  card: 'Thẻ tín dụng',
  transfer: 'Chuyển khoản',
  ewallet: 'Ví điện tử',
};

export const getPaymentMethodLabel = (method) =>
  PAYMENT_METHOD_LABELS[method] || method || 'Khác';
