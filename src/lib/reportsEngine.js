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
export const generateAIInsights = (type, data, t) => {
  const _t = typeof t === 'function' ? t : (k, f, p) => {
    let res = f || k;
    if (p && typeof p === 'object') {
      Object.keys(p).forEach(pKey => {
        res = res.replace(new RegExp(`\\{${pKey}\\}`, 'g'), p[pKey]);
      });
    }
    return res;
  };

  const insights = [];

  if (type === 'overview') {
    if (data.revenueGrowth > 0) {
      insights.push(_t('reports.ai_rev_growth_pos', 'Revenue grew by {growth}% compared to last period, reaching {total}.', { growth: data.revenueGrowth, total: formatVND(data.totalRevenue) }));
    } else if (data.revenueGrowth < 0) {
      insights.push(_t('reports.ai_rev_growth_neg', '⚠️ Revenue dropped by {growth}% compared to last period. Boost marketing & customer retention.', { growth: Math.abs(data.revenueGrowth) }));
    }
    if (data.topStaffName) {
      insights.push(_t('reports.ai_top_staff_contrib', 'Staff member {name} contributed the highest sales ({rev}).', { name: data.topStaffName, rev: formatVND(data.topStaffRevenue) }));
    }
    if (data.repeatRate > 40) {
      insights.push(_t('reports.ai_repeat_rate_good', 'Customer return rate reached {rate}%, demonstrating strong service quality.', { rate: data.repeatRate }));
    }
  } else if (type === 'revenue') {
    if (data.aov) {
      insights.push(_t('reports.ai_aov_reached', 'Average Order Value (AOV) reached {aov}.', { aov: formatVND(data.aov) }));
    }
    if (data.topCategory) {
      insights.push(_t('reports.ai_top_cat_share', 'Service/Product "{category}" generated the highest revenue share.', { category: data.topCategory }));
    }
  } else if (type === 'customers') {
    if (data.vipRatio) {
      insights.push(_t('reports.ai_vip_ratio', 'VIP customers account for {ratio}% of total salon revenue.', { ratio: data.vipRatio }));
    }
    if (data.churnRiskCount > 0) {
      insights.push(_t('reports.ai_churn_risk', '⚠️ Detected {count} customers at risk of churn (no visit for >45 days).', { count: data.churnRiskCount }));
    }
  } else if (type === 'inventory') {
    if (data.lowStockCount > 0) {
      insights.push(_t('reports.ai_low_stock_urgent', '🚨 {count} products reached minimum threshold and need urgent restocking.', { count: data.lowStockCount }));
    }
    if (data.totalValuation) {
      insights.push(_t('reports.ai_total_valuation', 'Total current inventory asset valuation is {valuation}.', { valuation: formatVND(data.totalValuation) }));
    }
  }

  if (!insights.length) {
    insights.push(_t('reports.ai_business_stable', 'Business performance is stable and progressing as targeted.'));
  }

  return insights;
};

// Generates operational alerts
export const generateOperationalAlerts = (products = [], treatments = [], prepaidCards = [], customers = [], t) => {
  const _t = typeof t === 'function' ? t : (k, f, p) => {
    let res = f || k;
    if (p && typeof p === 'object') {
      Object.keys(p).forEach(pKey => {
        res = res.replace(new RegExp(`\\{${pKey}\\}`, 'g'), p[pKey]);
      });
    }
    return res;
  };

  const alerts = [];

  // Low stock products
  const lowStock = products.filter(p => p.stock !== undefined && p.min_stock !== undefined && p.stock <= p.min_stock);
  if (lowStock.length > 0) {
    alerts.push({
      type: 'warning',
      title: _t('reports.alert_low_stock_title', 'Inventory Alert ({count} products low)', { count: lowStock.length }),
      desc: _t('reports.alert_low_stock_desc', 'Products {names}{more} have reached minimum stock threshold.', {
        names: lowStock.slice(0, 3).map(p => p.name).join(', '),
        more: lowStock.length > 3 ? '...' : ''
      }),
      icon: 'PackageAlert'
    });
  }

  // Expiring cards
  const expiringCards = prepaidCards.filter(c => c.balance > 0 && c.expiry_date);
  if (expiringCards.length > 0) {
    alerts.push({
      type: 'info',
      title: _t('reports.alert_expiring_cards_title', 'Prepaid cards expiring soon ({count} cards)', { count: expiringCards.length }),
      desc: _t('reports.alert_expiring_cards_desc', 'There are {count} card accounts with remaining balance expiring soon.', { count: expiringCards.length }),
      icon: 'CreditCard'
    });
  }

  return alerts;
};
