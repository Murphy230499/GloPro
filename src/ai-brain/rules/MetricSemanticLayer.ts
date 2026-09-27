/**
 * EasySalon Metric Semantic Layer (Phase 6 Real Business Operations)
 * 
 * Provides centralized, canonical business definitions and calculation authorities
 * for all salon operational, financial, and inventory metrics.
 * 
 * CORE PRINCIPLE:
 * TIP ≠ REVENUE (Tip is money collected on behalf of the technician, pass-through fund).
 */

export interface IMetricDefinition {
  metric: string;
  nameVi: string;
  definition: string;
  source: string;
  calculationAuthority: string;
  includedFields: string[];
  excludedFields: string[];
  relatedReports: string[];
  isSalonRevenue: boolean;
  isCashFlow: boolean;
}

export class MetricSemanticLayer {
  private static readonly METRICS: Record<string, IMetricDefinition> = {
    REVENUE: {
      metric: 'REVENUE',
      nameVi: 'Doanh thu thuần salon',
      definition: 'Tổng tiền bán dịch vụ và sản phẩm sau khi đã trừ đi các khoản giảm giá, chiết khấu và voucher.',
      source: 'Invoice.final_amount | Invoice.total (excluding tip)',
      calculationAuthority: 'src/lib/reportsEngine.js & RevenueReadTool',
      includedFields: ['service_revenue', 'product_revenue', 'surcharge'],
      excludedFields: ['tip', 'customer_debt', 'deposit_held', 'unpaid_amount'],
      relatedReports: ['Báo cáo doanh thu', 'Báo cáo tổng quan kinh doanh'],
      isSalonRevenue: true,
      isCashFlow: false // Revenue recognized upon billing, regardless of cash timing
    },
    TIP: {
      metric: 'TIP',
      nameVi: 'Tiền tip thu hộ kỹ thuật viên',
      definition: 'Tiền thưởng/bồi dưỡng của khách hàng dành riêng cho nhân viên. Salon chỉ đứng ra thu hộ và trả lại cho nhân viên. TUYỆT ĐỐI KHÔNG TÍNH VÀO DOANH THU SALON.',
      source: 'Invoice.tip | CashVoucher(type_code: "tip")',
      calculationAuthority: 'src/lib/cashFlowHelper.js & TipRecordTool',
      includedFields: ['tip_amount', 'tip_splits'],
      excludedFields: ['service_price', 'product_price', 'salon_revenue', 'commission'],
      relatedReports: ['Báo cáo tiền tip', 'Sổ quỹ dòng tiền (Phiếu thu)', 'Bảng lương chi tiết nhân viên'],
      isSalonRevenue: false,
      isCashFlow: true
    },
    PAYMENT: {
      metric: 'PAYMENT',
      nameVi: 'Tổng tiền thanh toán',
      definition: 'Khoản tiền thực tế khách hàng thanh toán qua tiền mặt, chuyển khoản hoặc thẻ ngân hàng cho hóa đơn (có thể bao gồm cả tiền tip nếu trả chung).',
      source: 'Invoice.paid_amount | CashVoucher.amount',
      calculationAuthority: 'src/agents/cashier-agent & InvoiceCheckoutTool',
      includedFields: ['cash_paid', 'transfer_paid', 'card_paid', 'bundled_tip'],
      excludedFields: ['unpaid_balance', 'future_receivables'],
      relatedReports: ['Sổ quỹ tiền mặt', 'Báo cáo phương thức thanh toán'],
      isSalonRevenue: false, // Payment settles receivables/tips, not synonymous with revenue
      isCashFlow: true
    },
    CASH_FLOW: {
      metric: 'CASH_FLOW',
      nameVi: 'Dòng tiền thực tế (Thu/Chi quỹ)',
      definition: 'Tổng các khoản tiền mặt/ngân hàng thực tế đi vào (Phiếu thu) hoặc đi ra (Phiếu chi) khỏi quỹ của salon trong kỳ.',
      source: 'CashVoucher (flow: "income" | "expense")',
      calculationAuthority: 'src/lib/cashFlowHelper.js',
      includedFields: ['sale_income', 'tip_income', 'deposit_income', 'salary_expense', 'overhead_expense'],
      excludedFields: ['accrued_uncollected_revenue', 'bad_debt'],
      relatedReports: ['Sổ chi tiết tiền S2e', 'Báo cáo dòng tiền thu chi'],
      isSalonRevenue: false,
      isCashFlow: true
    },
    STAFF_REVENUE: {
      metric: 'STAFF_REVENUE',
      nameVi: 'Doanh số thực hiện của nhân viên',
      definition: 'Tổng giá trị các dịch vụ và sản phẩm do nhân viên trực tiếp thực hiện hoặc tư vấn bán được. Không bao gồm tiền tip.',
      source: 'InvoiceItem.staff_id & InvoiceItem.totalPrice',
      calculationAuthority: 'src/lib/commissionHelper.js & StaffReadTool',
      includedFields: ['direct_service_value', 'direct_product_value'],
      excludedFields: ['tip', 'salon_overhead'],
      relatedReports: ['Báo cáo doanh số nhân viên', 'Báo cáo hiệu suất'],
      isSalonRevenue: true,
      isCashFlow: false
    },
    COMMISSION: {
      metric: 'COMMISSION',
      nameVi: 'Tiền hoa hồng nhân viên',
      definition: 'Khoản thù lao nhân viên được hưởng dựa trên % doanh số dịch vụ, sản phẩm, phụ cấp yêu cầu thợ hoặc ngoài giờ.',
      source: 'StaffCommissionRule & commissionHelper.js',
      calculationAuthority: 'src/lib/commissionHelper.js',
      includedFields: ['service_commission', 'product_commission', 'request_surcharge', 'overtime_commission'],
      excludedFields: ['base_salary', 'tip', 'bonus', 'penalty'],
      relatedReports: ['Báo cáo hoa hồng', 'Bảng tính lương'],
      isSalonRevenue: false,
      isCashFlow: false
    },
    OUTSTANDING: {
      metric: 'OUTSTANDING',
      nameVi: 'Công nợ / Tiền còn phải thu',
      definition: 'Khoản tiền khách hàng chưa thanh toán của hóa đơn sau khi đã trừ đi phần đã trả.',
      source: 'Invoice.total - Invoice.paid_amount',
      calculationAuthority: 'Invoice.list',
      includedFields: ['customer_unpaid_amount'],
      excludedFields: ['paid_amount', 'discounts'],
      relatedReports: ['Báo cáo công nợ khách hàng'],
      isSalonRevenue: false,
      isCashFlow: false
    },
    STOCK: {
      metric: 'STOCK',
      nameVi: 'Tồn kho hàng hóa',
      definition: 'Số lượng vật lý hiện có của từng sản phẩm tại kho chi nhánh.',
      source: 'Product.stock',
      calculationAuthority: 'InventoryReadTool & StockAdjustTool',
      includedFields: ['available_quantity'],
      excludedFields: ['ordered_unreceived', 'damaged_written_off'],
      relatedReports: ['Báo cáo tồn kho', 'Cảnh báo sắp hết hàng'],
      isSalonRevenue: false,
      isCashFlow: false
    },
    PAYROLL: {
      metric: 'PAYROLL',
      nameVi: 'Tổng thu nhập thực nhận của nhân viên',
      definition: 'Lương cơ bản + Hoa hồng + Thưởng - Phạt + Tiền tip thu hộ.',
      source: 'StaffPayrollDetailRouteView & PayrollReadTool',
      calculationAuthority: 'src/views/StaffPayrollDetailRouteView.jsx',
      includedFields: ['salary', 'commission', 'bonus', 'penalty', 'tip'],
      excludedFields: ['salon_net_profit'],
      relatedReports: ['Bảng lương chi tiết nhân viên'],
      isSalonRevenue: false,
      isCashFlow: false
    }
  };

  /**
   * Retrieves metric metadata
   */
  static get(metric: string): IMetricDefinition | undefined {
    return this.METRICS[metric.toUpperCase()];
  }

  /**
   * Explains the difference between confusing business metrics (e.g. Tip vs Revenue)
   */
  static explainDistinction(metricA: string, metricB: string): string {
    const a = this.get(metricA);
    const b = this.get(metricB);
    if (!a || !b) return 'Không tìm thấy định nghĩa cho các chỉ số này.';

    return `📌 **Phân biệt ${a.nameVi} và ${b.nameVi}:**\n` +
      `• **${a.nameVi} (${a.metric}):** ${a.definition}\n` +
      `• **${b.nameVi} (${b.metric}):** ${b.definition}\n` +
      `*Quy tắc vàng:* ${a.isSalonRevenue ? `${a.nameVi} ĐƯỢC tính` : `${a.nameVi} KHÔNG được tính`} vào doanh thu salon; ` +
      `${b.isSalonRevenue ? `${b.nameVi} ĐƯỢC tính` : `${b.nameVi} KHÔNG được tính`} vào doanh thu salon.`;
  }

  /**
   * Disaggregates customer payment into Salon Revenue and Technician Tip
   */
  static disaggregatePayment(invoiceTotal: number, tipAmount: number): {
    salonRevenue: number;
    technicianTip: number;
    customerTotalDue: number;
    cashFlowEntries: Array<{ type: 'sale' | 'tip'; amount: number; description: string }>;
  } {
    const revenue = Math.max(0, invoiceTotal);
    const tip = Math.max(0, tipAmount || 0);

    return {
      salonRevenue: revenue,
      technicianTip: tip,
      customerTotalDue: revenue + tip,
      cashFlowEntries: [
        { type: 'sale', amount: revenue, description: 'Doanh thu dịch vụ/sản phẩm salon' },
        ...(tip > 0 ? [{ type: 'tip' as const, amount: tip, description: 'Tiền tip thu hộ nhân viên (không tính doanh thu)' }] : [])
      ]
    };
  }
}
