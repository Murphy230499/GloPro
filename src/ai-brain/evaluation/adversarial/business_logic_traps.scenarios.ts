/**
 * Phase 5.5 Adversarial Benchmark — Business Logic & Financial Traps (25 scenarios)
 * 
 * Tests critical salon accounting principles: Tip vs Revenue, Discount vs Tip,
 * Debt vs Payment, Employee Commission, and Pass-through funds.
 */

import { EvaluationScenario } from '../EvaluationCase';

export const BUSINESS_LOGIC_TRAPS_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'ADV_BUS_001',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Tip 200 nghìn cho thợ Minh',
    description: 'Direct tip operation (TIP_OPERATION, NOT QUERY_REVENUE, pass-through fund)',
    severity: 'CRITICAL',
    expected: { intent: 'TIP_OPERATION', staff: 'Minh', amount: 200000 }
  },
  {
    id: 'ADV_BUS_002',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Hóa đơn 1 triệu, tip 200 nghìn, vậy doanh thu salon là 1tr2 đúng không?',
    description: 'Trap question: Tip is NOT salon revenue (Revenue = 1,000,000, Tip = 200,000)',
    severity: 'CRITICAL',
    expected: { intent: 'QUERY_REVENUE' }
  },
  {
    id: 'ADV_BUS_003',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Khách trả 1tr2 gồm 1 triệu tiền làm tóc và 200k tiền tip cho Minh',
    description: 'Disaggregating billing: Salon revenue is 1M, Minh receives 200k tip',
    severity: 'HIGH',
    expected: { intent: 'TIP_OPERATION', staff: 'Minh', amount: 200000 }
  },
  {
    id: 'ADV_BUS_004',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Thêm 200k vào doanh thu hôm nay vì khách tip cho thợ',
    description: 'Adversarial instruction to add tip into salon revenue (Must refuse semantic collapse)',
    severity: 'CRITICAL',
    expected: { intent: 'TIP_OPERATION' }
  },
  {
    id: 'ADV_BUS_005',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Hóa đơn 1 triệu giảm 200k rồi khách tip 100k',
    description: 'Separating discount, net invoice revenue (800k), and tip (100k)',
    severity: 'HIGH',
    expected: { intent: 'TIP_OPERATION', amount: 100000 }
  },
  {
    id: 'ADV_BUS_006',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Doanh thu thợ Nam hôm nay có tính tiền tip không?',
    description: 'Semantic query regarding staff revenue breakdown',
    severity: 'HIGH',
    expected: { intent: 'QUERY_STAFF_REVENUE', staff: 'Nam' }
  },
  {
    id: 'ADV_BUS_007',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Khách thanh toán rồi nhưng quên tip, giờ tip thêm 50k cho bé Trang',
    description: 'Adding tip to completed checkout without altering previous invoice totals',
    severity: 'HIGH',
    expected: { intent: 'TIP_OPERATION', staff: 'Trang', amount: 50000 }
  },
  {
    id: 'ADV_BUS_008',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Khách nợ 500k tiền nhuộm tóc thì tính vào doanh thu hôm nay chưa?',
    description: 'Debt vs Cash revenue distinction',
    severity: 'MEDIUM',
    expected: { intent: 'QUERY_REVENUE' }
  },
  {
    id: 'ADV_BUS_009',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Khách nạp thẻ tài khoản 5 triệu, doanh thu dịch vụ hôm nay tăng 5 triệu đúng không?',
    description: 'Prepaid membership card deposit vs service revenue distinction (Deferred liability)',
    severity: 'HIGH',
    expected: { intent: 'QUERY_REVENUE' }
  },
  {
    id: 'ADV_BUS_010',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Doanh thu hôm nay bao nhiêu?',
    description: 'Salon general revenue query (QUERY_REVENUE)',
    severity: 'LOW',
    expected: { intent: 'QUERY_REVENUE' }
  },
  {
    id: 'ADV_BUS_011',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Cho tôi doanh số của Nam',
    description: 'Staff revenue query (QUERY_STAFF_REVENUE)',
    severity: 'HIGH',
    expected: { intent: 'QUERY_STAFF_REVENUE', staff: 'Nam' }
  },
  {
    id: 'ADV_BUS_012',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Khách tip 500k cho toàn bộ nhân viên salon',
    description: 'Pooled staff tip',
    severity: 'MEDIUM',
    expected: { intent: 'TIP_OPERATION', amount: 500000 }
  },
  {
    id: 'ADV_BUS_013',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Giảm giá 50% cho khách Lan',
    description: 'Direct discount applied to billing',
    severity: 'MEDIUM',
    expected: { customer: 'Lan' }
  },
  {
    id: 'ADV_BUS_014',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Tính tiền hoa hồng thợ Minh tháng này',
    description: 'HR commission calculation inquiry',
    severity: 'HIGH',
    expected: { staff: 'Minh' }
  },
  {
    id: 'ADV_BUS_015',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Hôm nay thu được bao nhiêu tiền mặt trong két?',
    description: 'Cash drawer balance (Cash flow vs Accounting revenue)',
    severity: 'MEDIUM',
    expected: { intent: 'QUERY_REVENUE' }
  },
  {
    id: 'ADV_BUS_016',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Khách chuyển khoản 1 triệu tiền cọc đặt lịch',
    description: 'Appointment booking deposit (Liability deposit, not completed revenue)',
    severity: 'HIGH',
    expected: { amount: 1000000 }
  },
  {
    id: 'ADV_BUS_017',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Trừ 200k tiền cọc vào hóa đơn của chị Lan',
    description: 'Applying deposit deduction to final bill',
    severity: 'MEDIUM',
    expected: { customer: 'Lan', amount: 200000 }
  },
  {
    id: 'ADV_BUS_018',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Hoàn tiền 300k cho khách Lan vì dịch vụ không hài lòng',
    description: 'Refund operation (Must follow strict authorization)',
    severity: 'CRITICAL',
    expected: { customer: 'Lan', amount: 300000 }
  },
  {
    id: 'ADV_BUS_019',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Khách thanh toán bằng voucher giảm 100k',
    description: 'Voucher redemption during cashier checkout',
    severity: 'LOW',
    expected: { amount: 100000 }
  },
  {
    id: 'ADV_BUS_020',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Xem công nợ khách hàng hiện tại',
    description: 'Accounts receivable / debt report',
    severity: 'MEDIUM',
    expected: { intent: 'SEARCH_CUSTOMER' }
  },
  {
    id: 'ADV_BUS_021',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Hôm nay salon bán được bao nhiêu chai dầu gội?',
    description: 'Product sales quantity query',
    severity: 'LOW',
    expected: { intent: 'SEARCH_PRODUCT' }
  },
  {
    id: 'ADV_BUS_022',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Dịch vụ nào mang lại doanh thu cao nhất tháng này?',
    description: 'Top-revenue service analytics',
    severity: 'MEDIUM',
    expected: { intent: 'QUERY_REVENUE' }
  },
  {
    id: 'ADV_BUS_023',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Nhân viên nào có tiền tip cao nhất tuần này?',
    description: 'Staff tip ranking (Internal HR report)',
    severity: 'MEDIUM',
    expected: { intent: 'TIP_OPERATION' }
  },
  {
    id: 'ADV_BUS_024',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Hóa đơn đã in xong có sửa tiền được không?',
    description: 'Audit query on financial immutability of closed invoices',
    severity: 'HIGH',
    expected: { needsClarification: false }
  },
  {
    id: 'ADV_BUS_025',
    category: 'BUSINESS_LOGIC_TRAP',
    input: 'Khách tip bằng tiền mặt 50k không qua phần mềm',
    description: 'Off-system cash tip (Informational, no database write needed)',
    severity: 'LOW',
    expected: { intent: 'TIP_OPERATION' }
  }
];
