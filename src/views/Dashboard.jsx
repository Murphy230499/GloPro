'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { TrendingUp, CalendarDays, Users, UserSquare, Sparkles, Sliders } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND, todayStr, last7Days } from '@/lib/format';
import { getUIPreferences } from '@/lib/uiPreferences.js';
import { getThemeById } from '@/lib/uiThemes.js';

import KPIStatWidget from '@/components/dashboard/widgets/KPIStatWidget';
import RevenueChartWidget from '@/components/dashboard/widgets/RevenueChartWidget';
import UpcomingAppointmentsWidget from '@/components/dashboard/widgets/UpcomingAppointmentsWidget';
import RoomOccupancyWidget from '@/components/dashboard/widgets/RoomOccupancyWidget';
import SocialChatAlertWidget from '@/components/dashboard/widgets/SocialChatAlertWidget';
import TopRevenueRankingsWidget from '@/components/dashboard/widgets/TopRevenueRankingsWidget';

const getPeriodRange = (period) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);
  if (period === 'week') {
    const day = (now.getDay() + 6) % 7; // Mon=0
    start.setDate(now.getDate() - day);
    end.setDate(start.getDate() + 6);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), q * 3, 1);
    end = new Date(now.getFullYear(), q * 3 + 3, 0);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31);
  }
  return { startStr: start.toISOString().slice(0, 10), endStr: end.toISOString().slice(0, 10) };
};

export default function Dashboard() {
  const { t } = useT();
  const { currentBranchId, currentBranch } = useBranch();
  const branchCountry = currentBranch?.country || 'Vietnam';

  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('day');

  // Cấu hình giao diện động (iOS Glassmorphism & Widgets)
  const [uiConfig, setUiConfig] = useState(() => getUIPreferences(currentBranchId, branchCountry));

  useEffect(() => {
    const current = getUIPreferences(currentBranchId, branchCountry);
    setUiConfig(current);

    const handleUIPreferencesUpdated = (e) => {
      if (e.detail) {
        setUiConfig(e.detail);
      }
    };
    window.addEventListener('glopro-ui-preferences-updated', handleUIPreferencesUpdated);
    return () => {
      window.removeEventListener('glopro-ui-preferences-updated', handleUIPreferencesUpdated);
    };
  }, [currentBranchId, branchCountry]);

  const activeTheme = useMemo(() => {
    return getThemeById(uiConfig?.activeThemeId);
  }, [uiConfig?.activeThemeId]);

  const tintColor = uiConfig?.theme?.tintColor || activeTheme?.tintColor || '#FF3B7A';

  const STATUS_LABEL = useMemo(() => ({
    pending: t('dashboard.status.pending', 'Chờ xác nhận'),
    confirmed: t('dashboard.status.confirmed', 'Đã xác nhận'),
    checked_in: t('dashboard.status.checked_in', 'Đã check-in'),
    in_progress: t('dashboard.status.in_progress', 'Đang làm'),
    completed: t('dashboard.status.completed', 'Hoàn thành'),
    cancelled: t('dashboard.status.cancelled', 'Đã hủy'),
    no_show: t('dashboard.status.no_show', 'Không đến')
  }), [t]);

  const PERIODS = useMemo(() => [
    { value: 'day', label: t('dashboard.period.day', 'Hôm nay') },
    { value: 'week', label: t('dashboard.period.week', 'Tuần') },
    { value: 'month', label: t('dashboard.period.month', 'Tháng') },
    { value: 'quarter', label: t('dashboard.period.quarter', 'Quý') },
    { value: 'year', label: t('dashboard.period.year', 'Năm') },
  ], [t]);

  useEffect(() => {
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
      base44.entities.Invoice.filter(filter),
      base44.entities.Appointment.filter(filter),
      base44.entities.Customer.list(),
      base44.entities.Staff.filter(filter),
    ]).then(([inv, appts, cus, st]) => {
      setInvoices(inv);
      setAppointments(appts);
      setCustomers(cus);
      setStaff(st.filter((x) => x.is_active !== false));
      setLoading(false);
    });
  }, [currentBranchId]);

  const today = todayStr();
  const todayRevenue = invoices.filter((i) => i.date === today).reduce((s, i) => s + (i.total || 0), 0);
  const todayAppts = appointments.filter((a) => a.date === today);
  const completedToday = todayAppts.filter((a) => a.status === 'completed').length;

  const days = last7Days();
  const chartData = days.map((d) => ({
    name: d.label,
    revenue: invoices.filter((i) => i.date === d.key).reduce((s, i) => s + (i.total || 0), 0)
  }));

  const upcoming = [...todayAppts]
    .filter((a) => a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'no_show')
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 6);

  const { startStr, endStr } = getPeriodRange(period);
  const periodInvoices = invoices.filter((i) => i.date >= startStr && i.date <= endStr);

  const tops = useMemo(() => {
    const serviceRev = {};
    const productRev = {};
    const staffRev = {};
    const customerRev = {};
    periodInvoices.forEach((inv) => {
      (inv.items || []).forEach((it) => {
        if (!it.name) return;
        if (it.is_from_package) return;
        const amount = (it.price || 0) * (it.qty || 1);
        if (it.type === 'product') {
          productRev[it.name] = (productRev[it.name] || 0) + amount;
        } else if (it.type === 'service') {
          serviceRev[it.name] = (serviceRev[it.name] || 0) + amount;
        }
        if (it.staff_id || it.staff_name) {
          const key = it.staff_id || it.staff_name;
          staffRev[key] = (staffRev[key] || 0) + amount;
        }
      });
      const cKey = inv.customer_id || inv.customer_name;
      if (cKey) {
        customerRev[cKey] = (customerRev[cKey] || 0) + (inv.total || 0);
      }
    });
    const staffMap = Object.fromEntries(staff.map((s) => [s.id, s]));
    const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]));

    const toItems = (obj, getLabel) => Object.entries(obj)
      .map(([key, value]) => ({ id: key, name: getLabel(key) || key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      services: toItems(serviceRev, () => null),
      products: toItems(productRev, () => null),
      staff: toItems(staffRev, (k) => staffMap[k]?.full_name || k),
      customers: toItems(customerRev, (k) => customerMap[k]?.name || k),
    };
  }, [periodInvoices, staff, customers]);

  // Lọc và sắp xếp danh sách các widget đang được bật (enabled === true)
  const enabledWidgets = useMemo(() => {
    const list = uiConfig?.dashboard?.widgets || [];
    return [...list]
      .filter((w) => w.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [uiConfig?.dashboard?.widgets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div 
          className="w-9 h-9 border-4 border-t-transparent rounded-full animate-spin" 
          style={{ borderColor: `${tintColor}30`, borderTopColor: tintColor }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* HEADER: Tiêu đề, Chào mừng, Bộ lọc thời gian & Nút tùy biến */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-slate-800">
              {t('dashboard.tong_quan', 'Tổng quan')}
            </h1>
            
            {/* Huy hiệu chủ đề / Lễ hội */}
            {activeTheme && (
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs animate-in fade-in"
                style={{ 
                  background: `${tintColor}12`, 
                  color: tintColor, 
                  borderColor: `${tintColor}30` 
                }}
              >
                <span>{activeTheme.icon}</span>
                <span>{activeTheme.name}</span>
              </span>
            )}
          </div>
          
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            {t('dashboard.welcome_msg', 'Xin chào 👋 Đây là tình hình hoạt động hôm nay')}
          </p>
        </div>

        {/* Thao tác góc phải: Bộ lọc thời gian & Nút mở Tùy biến */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bộ lọc thời gian */}
          <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700 p-1 shadow-2xs">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  period === p.value 
                    ? 'text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
                style={period === p.value ? { background: tintColor } : undefined}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Nút 1-chạm mở cài đặt giao diện */}
          <Link
            href="/settings?tab=appearance"
            className="btn-glass flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95"
            title="Tùy biến Widget & Chủ đề giao diện"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Tùy biến</span>
          </Link>
        </div>
      </div>

      {/* LƯỚI WIDGET DASHBOARD ĐỘNG THEO CẤU HÌNH (DYNAMIC 12-COLUMN GRID) */}
      <div className="grid grid-cols-12 gap-4">
        {enabledWidgets.map((w) => {
          // Quy định độ rộng lưới dựa theo kích thước iOS:
          // small: 3 cột trên desktop (1/4 hàng)
          // medium: 6 cột trên desktop (1/2 hàng)
          // large: 12 cột (Toàn hàng)
          const colSpan = w.size === 'small' 
            ? 'col-span-12 sm:col-span-6 lg:col-span-3' 
            : w.size === 'medium' 
              ? 'col-span-12 lg:col-span-6' 
              : 'col-span-12';

          return (
            <div key={w.id} className={`${colSpan} flex flex-col transition-all duration-300`}>
              {w.id === 'kpi_revenue' && (
                <KPIStatWidget 
                  type="kpi_revenue" 
                  value={todayRevenue} 
                  sub={`${invoices.filter((i) => i.date === today).length} ${t('dashboard.hoa_don', 'Hóa đơn')}`} 
                  size={w.size} 
                  tintColor={tintColor} 
                />
              )}

              {w.id === 'kpi_appts' && (
                <KPIStatWidget 
                  type="kpi_appts" 
                  value={todayAppts.length} 
                  sub={`${completedToday} ${t('dashboard.hoan_thanh', 'Hoàn thành')}`} 
                  size={w.size} 
                  tintColor={tintColor} 
                />
              )}

              {w.id === 'kpi_customers' && (
                <KPIStatWidget 
                  type="kpi_customers" 
                  value={customers.length} 
                  sub={t('dashboard.toan_chuoi', 'Toàn chuỗi')} 
                  size={w.size} 
                  tintColor={tintColor} 
                />
              )}

              {w.id === 'kpi_staff' && (
                <KPIStatWidget 
                  type="kpi_staff" 
                  value={staff.length} 
                  sub={t('dashboard.dang_lam_viec', 'Đang làm việc')} 
                  size={w.size} 
                  tintColor={tintColor} 
                />
              )}

              {w.id === 'revenue_chart' && (
                <RevenueChartWidget 
                  chartData={chartData} 
                  tintColor={tintColor} 
                  size={w.size} 
                />
              )}

              {w.id === 'upcoming_queue' && (
                <UpcomingAppointmentsWidget 
                  appointments={upcoming} 
                  statusLabels={STATUS_LABEL} 
                  tintColor={tintColor} 
                />
              )}

              {w.id === 'room_occupancy' && (
                <RoomOccupancyWidget 
                  tintColor={tintColor} 
                />
              )}

              {w.id === 'social_chat_alert' && (
                <SocialChatAlertWidget 
                  tintColor={tintColor} 
                />
              )}

              {w.id === 'top_rankings' && (
                <TopRevenueRankingsWidget 
                  tops={tops} 
                  size={w.size} 
                  tintColor={tintColor} 
                />
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}