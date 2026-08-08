import { base44 } from '@/api/base44Client';
import { todayStr } from '@/lib/format';

// ─── Default Voucher Types ───────────────────────────────────────────────────

export const DEFAULT_INCOME_TYPES = [
  { code: 'sale',            name: 'Sales / Service',      color: '#10B981', flow: 'income', is_system: true },
  { code: 'membership_sale', name: 'Package / Card',        color: '#3B82F6', flow: 'income', is_system: true },
  { code: 'tip',             name: 'Tip',                   color: '#F59E0B', flow: 'income', is_system: true },
  { code: 'deposit',         name: 'Deposit',               color: '#8B5CF6', flow: 'income', is_system: true },
  { code: 'other_income',    name: 'Other Income',          color: '#94A3B8', flow: 'income', is_system: true },
];

export const DEFAULT_EXPENSE_TYPES = [
  { code: 'stock_purchase',  name: 'Stock Purchase',        color: '#EF4444', flow: 'expense', is_system: true },
  { code: 'salary',          name: 'Salary',                color: '#F97316', flow: 'expense', is_system: true },
  { code: 'overhead',        name: 'Operating Expense',     color: '#EC4899', flow: 'expense', is_system: true },
  { code: 'use_deposit',     name: 'Use Deposit',           color: '#8B5CF6', flow: 'expense', is_system: true },
  { code: 'other_expense',   name: 'Other Expense',         color: '#94A3B8', flow: 'expense', is_system: true },
];

const LEGACY_VI_DEFAULT_NAMES = new Set([
  'Bán hàng / Dịch vụ',
  'Bán gói / Thẻ',
  'Tiền TIP',
  'Đặt cọc',
  'Thu khác',
  'Nhập hàng',
  'Chi lương',
  'Chi phí vận hành',
  'Sử dụng tiền cọc',
  'Chi khác',
]);

/**
 * Seed default voucher types if they don't exist yet.
 * Safely migrates old Vietnamese defaults to English without overwriting custom user edits.
 */
export async function seedDefaultVoucherTypes() {
  try {
    const existing = await base44.entities.CashVoucherType.list();
    const existingMap = new Map((existing || []).map(t => [t.code, t]));

    const allDefaults = [...DEFAULT_INCOME_TYPES, ...DEFAULT_EXPENSE_TYPES];
    await Promise.all(
      allDefaults.map(def => {
        const found = existingMap.get(def.code);
        if (!found) {
          return base44.entities.CashVoucherType.create(def);
        } else if (found.is_system && LEGACY_VI_DEFAULT_NAMES.has(found.name)) {
          // Migrate old default Vietnamese string to English default
          return base44.entities.CashVoucherType.update(found.id, { name: def.name });
        }
        return Promise.resolve();
      })
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
