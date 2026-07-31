import { formatVND } from './format';

// Helper to filter items by date range
export const filterByDateRange = (items, dateRange, dateKey = 'date') => {
  if (!items || !items.length) return [];
  const { startDate, endDate } = dateRange;
  if (!startDate || !endDate) return items;

  return items.filter(item => {
    const rawVal = item[dateKey] || item.created_at || item.created_date || '';
    if (!rawVal) return false;
    const itemDate = rawVal.split('T')[0];
    return itemDate >= startDate && itemDate <= endDate;
  });
};

// Helper for period comparison calculation
export const calcGrowth = (currentVal, previousVal) => {
  if (!previousVal || previousVal === 0) {
    return currentVal > 0 ? 100 : 0;
  }
  return Math.round(((currentVal - previousVal) / previousVal) * 100);
};

// Generates AI Insights commentary based on metrics
export const generateAIInsights = (type, data) => {
  const insights = [];

  if (type === 'overview') {
    if (data.revenueGrowth > 0) {
      insights.push(` Doanh thu tăng trưởng ${data.revenueGrowth}% so với kỳ trước, đạt ${formatVND(data.totalRevenue)}.`);
    } else if (data.revenueGrowth < 0) {
      insights.push(`⚠️ Doanh thu giảm ${Math.abs(data.revenueGrowth)}% so với kỳ trước. Cần đẩy mạnh hoạt động Marketing & Chăm sóc lại khách hàng.`);
    }
    if (data.topStaffName) {
      insights.push(` Nhân viên ${data.topStaffName} đóng góp doanh số cao nhất (${formatVND(data.topStaffRevenue)}).`);
    }
    if (data.repeatRate > 40) {
      insights.push(` Tỷ lệ khách hàng quay lại đạt ${data.repeatRate}%, chứng tỏ chất lượng dịch vụ duy trì rất tốt.`);
    }
  } else if (type === 'revenue') {
    if (data.aov) {
      insights.push(` Giá trị trung bình trên mỗi hóa đơn (AOV) đạt ${formatVND(data.aov)}.`);
    }
    if (data.topCategory) {
      insights.push(` Nhóm dịch vụ "${data.topCategory}" tạo ra tỷ trọng doanh thu cao nhất.`);
    }
  } else if (type === 'customers') {
    if (data.vipRatio) {
      insights.push(` Khách hàng VIP chiếm ${data.vipRatio}% tổng doanh thu toàn salon.`);
    }
    if (data.churnRiskCount > 0) {
      insights.push(`⚠️ Phát hiện ${data.churnRiskCount} khách hàng nguy cơ rời bỏ (quá 45 ngày chưa đặt lịch quay lại).`);
    }
  } else if (type === 'inventory') {
    if (data.lowStockCount > 0) {
      insights.push(`🚨 Có ${data.lowStockCount} sản phẩm chạm ngưỡng tồn tối thiểu, cần nhập hàng gấp.`);
    }
    insights.push(` Tổng giá trị tài sản tồn kho hiện tại là ${formatVND(data.totalValuation)}.`);
  }

  if (!insights.length) {
    insights.push(` Dữ liệu hoạt động kinh doanh ổn định và duy trì theo đúng tiến độ mục tiêu.`);
  }

  return insights;
};

// Generates operational alerts
export const generateOperationalAlerts = (products = [], treatments = [], prepaidCards = [], customers = []) => {
  const alerts = [];

  // Low stock products
  const lowStock = products.filter(p => p.stock !== undefined && p.min_stock !== undefined && p.stock <= p.min_stock);
  if (lowStock.length > 0) {
    alerts.push({
      type: 'warning',
      title: `Cảnh báo Kho hàng (${lowStock.length} sản phẩm sắp hết)`,
      desc: `Sản phẩm ${lowStock.slice(0, 3).map(p => p.name).join(', ')}${lowStock.length > 3 ? '...' : ''} đã chạm ngưỡng tồn kho tối thiểu.`,
      icon: 'PackageAlert'
    });
  }

  // Expiring cards
  const expiringCards = prepaidCards.filter(c => c.balance > 0 && c.expiry_date);
  if (expiringCards.length > 0) {
    alerts.push({
      type: 'info',
      title: `Thẻ tiền mặt sắp hết hạn (${expiringCards.length} thẻ)`,
      desc: `Có ${expiringCards.length} tài khoản thẻ còn dư tiền sắp hết hạn sử dụng.`,
      icon: 'CreditCard'
    });
  }

  return alerts;
};
