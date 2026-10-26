/**
 * GloPro Subscription Plans & Feature Configuration
 * Provides pricing, feature matrices, domestic VietQR & international Stripe gateways,
 * and proration calculations for upgrades/downgrades.
 */

export const PLANS = {
  free: {
    id: 'free',
    name: 'Gói Khởi Đầu',
    code: 'FREE',
    badge: '🌱 Free',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    headerGradient: 'from-slate-500 to-slate-700',
    accentColor: '#64748B',
    tagline: 'Dành cho tiệm nhỏ, cá nhân hoặc cơ sở mới bắt đầu',
    price: 0,
    priceYearly: 0,
    maxBranches: 1,
    maxStaff: 5,
    maxAppointmentsMonth: 100,
    features: [
      'basic_appointments',
      'basic_customers',
      'basic_pos',
      'reports_basic',
    ],
    featureLabels: [
      { text: '1 Chi nhánh hoạt động', available: true },
      { text: 'Tối đa 5 nhân viên / KTV', available: true },
      { text: 'Quản lý lịch hẹn & Đặt lịch nhanh', available: true },
      { text: 'Hồ sơ khách hàng & Lịch sử cơ bản', available: true },
      { text: 'Bán hàng POS & In hóa đơn cơ bản', available: true },
      { text: 'Báo cáo doanh thu 7 ngày', available: true },
      { text: 'Sơ đồ Phòng & Giường 3D', available: false },
      { text: 'Quản lý Kho & Nhà cung cấp', available: false },
      { text: 'Bảng lương & Hoa hồng thợ', available: false },
      { text: 'GloPro AI Trợ lý điều hành', available: false },
    ]
  },
  pro: {
    id: 'pro',
    name: 'Gói Chuyên Nghiệp',
    code: 'PRO',
    badge: '⭐ Pro',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
    headerGradient: 'from-amber-500 to-orange-600',
    accentColor: '#F59E0B',
    tagline: 'Dành cho Salon / Spa đang phát triển cần tối ưu toàn diện vận hành',
    price: 399000,
    priceYearly: 3830000, // ~319k/tháng (Giảm 20%)
    maxBranches: 3,
    maxStaff: 20,
    maxAppointmentsMonth: 999999,
    features: [
      'basic_appointments',
      'basic_customers',
      'basic_pos',
      'reports_basic',
      'rooms_beds_3d',
      'inventory',
      'staff_commission_payroll',
      'advanced_pos',
      'reports_advanced',
      'cash_flow',
      'appearance_custom',
      'packages_membership'
    ],
    featureLabels: [
      { text: 'Tối đa 3 Chi nhánh hoạt động', available: true },
      { text: 'Tối đa 20 nhân viên / KTV', available: true },
      { text: 'Toàn bộ tính năng Vận hành lõi', available: true },
      { text: 'Sơ đồ Phòng & Giường 3D thời gian thực', available: true },
      { text: 'Quản lý Kho, Xuất/Nhập & Cảnh báo tồn', available: true },
      { text: 'Tính Hoa hồng KTV & Bảng lương tự động', available: true },
      { text: 'Gói liệu trình, Thẻ trả trước & Voucher', available: true },
      { text: 'Quản lý Thu/Chi dòng tiền đa quỹ', available: true },
      { text: 'Báo cáo doanh thu & Lợi nhuận chuyên sâu', available: true },
      { text: 'GloPro AI Trợ lý điều hành', available: false },
    ]
  },
  ultra: {
    id: 'ultra',
    name: 'Gói Toàn Năng AI',
    code: 'ULTRA',
    badge: '💎 Ultra AI',
    badgeColor: 'bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    headerGradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    accentColor: '#4F46E5',
    tagline: 'Đỉnh cao tự động hóa với Trí tuệ nhân tạo GloPro AI Business Brain',
    price: 899000,
    priceYearly: 8630000, // ~719k/tháng (Giảm 20%)
    maxBranches: 999,
    maxStaff: 999,
    maxAppointmentsMonth: 999999,
    isPopular: true,
    features: [
      'basic_appointments',
      'basic_customers',
      'basic_pos',
      'reports_basic',
      'rooms_beds_3d',
      'inventory',
      'staff_commission_payroll',
      'advanced_pos',
      'reports_advanced',
      'cash_flow',
      'appearance_custom',
      'packages_membership',
      'ai_copilot',
      'ai_segmentation',
      'ai_forecast',
      'ai_translator',
      'ai_marketing',
      'unlimited_scale'
    ],
    featureLabels: [
      { text: 'Không giới hạn Chi nhánh & Nhân viên', available: true },
      { text: 'Toàn bộ tính năng của Gói Pro', available: true },
      { text: 'GloPro AI Trợ lý điều hành ra lệnh giọng nói/chat', available: true },
      { text: 'AI Phân nhóm khách hàng & Tự động chăm sóc', available: true },
      { text: 'AI Dự báo doanh thu & Xu hướng tiêu dùng', available: true },
      { text: 'Social Chat AI Dịch đa ngôn ngữ tự động', available: true },
      { text: 'Hỗ trợ ưu tiên 24/7 & Backup thời gian thực', available: true },
    ]
  }
};

/**
 * Domestic VietQR Gateway Configuration
 */
export const VIETQR_CONFIG = {
  bankId: 'MB', // MBBank
  bankName: 'MBBank (Ngân hàng Quân Đội)',
  accountNo: '0988888888',
  accountName: 'GLOPRO TECH CO LTD',
  template: 'compact2'
};

/**
 * Generate VietQR URL
 */
export function buildVietQRUrl({ amount, memo }) {
  const bank = VIETQR_CONFIG.bankId;
  const acc = VIETQR_CONFIG.accountNo;
  const template = VIETQR_CONFIG.template;
  const accName = encodeURIComponent(VIETQR_CONFIG.accountName);
  const addInfo = encodeURIComponent(memo || 'GLOPRO UPGRADE');
  return `https://img.vietqr.io/image/${bank}-${acc}-${template}.png?amount=${amount}&addInfo=${addInfo}&accountName=${accName}`;
}

/**
 * Proration Calculator:
 * Calculates remaining credit from the current active paid plan to deduct from the new upgrade invoice.
 */
export function calculateProration({ currentPlanId, targetPlanId, expiresAt, isYearly = false }) {
  const currentPlan = PLANS[currentPlanId] || PLANS.free;
  const targetPlan = PLANS[targetPlanId] || PLANS.pro;
  const targetPrice = isYearly ? targetPlan.priceYearly : targetPlan.price;

  if (currentPlanId === 'free' || !expiresAt) {
    return {
      credit: 0,
      targetPrice,
      amountToPay: targetPrice,
      remainingDays: 0,
      isProrated: false
    };
  }

  const now = new Date();
  const end = new Date(expiresAt);
  const diffTime = end.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  if (remainingDays <= 0) {
    return {
      credit: 0,
      targetPrice,
      amountToPay: targetPrice,
      remainingDays: 0,
      isProrated: false
    };
  }

  // Calculate daily rate of existing plan based on assumed standard 30-day month
  const currentPrice = currentPlan.price;
  const dailyRate = currentPrice / 30;
  const rawCredit = Math.round(dailyRate * remainingDays);
  // Ensure credit doesn't exceed target price
  const credit = Math.min(targetPrice, Math.max(0, rawCredit));
  const amountToPay = Math.max(0, targetPrice - credit);

  return {
    credit,
    targetPrice,
    amountToPay,
    remainingDays,
    isProrated: credit > 0
  };
}
