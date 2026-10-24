'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useT } from '@/lib/i18n';
import { TrendingUp, CalendarDays, Users, UserSquare, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND, todayStr, last7Days } from '@/lib/format';
import StatCard from '@/components/StatCard';
import TopRevenueList from '@/components/TopRevenueList';
import { getUIPreferences } from '@/lib/uiPreferences.js';
import { getThemeById } from '@/lib/uiThemes.js';

const STATUS_COLORS = {
  pending: '#94A3B8',
  confirmed: '#60A5FA',
  checked_in: '#FBBF24',
  in_progress: '#A78BFA',
  completed: '#34D399',
  cancelled: '#F87171',
  no_show: '#F97316'
};

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

  // Cấu hình giao diện động (hỗ trợ Live Theme & Dark Mode)
  const [uiConfig, setUiConfig] = useState(() => getUIPreferences(currentBranchId, branchCountry));
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loaded = getUIPreferences(currentBranchId, branchCountry);
    setUiConfig(loaded);

    // Kiểm tra dark mode thực tế từ thẻ html
    const checkDark = () => {
      if (typeof document !== 'undefined') {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };
    checkDark();

    const handleUIPreferencesUpdated = (e) => {
      if (e.detail) {
        setUiConfig(e.detail);
        checkDark();
      }
    };

    const handleThemeChange = () => {
      checkDark();
    };

    window.addEventListener('glopro-ui-preferences-updated', handleUIPreferencesUpdated);
    window.addEventListener('theme-change', handleThemeChange);

    // Lắng nghe thay đổi class trên documentElement
    const observer = new MutationObserver(checkDark);
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }

    return () => {
      window.removeEventListener('glopro-ui-preferences-updated', handleUIPreferencesUpdated);
      window.removeEventListener('theme-change', handleThemeChange);
      observer.disconnect();
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
      
      {/* 1. HEADER: Tiêu đề & Bộ lọc thời gian */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
            {t('dashboard.tong_quan', 'Tổng quan')}
          </h1>
          <p className="text-slate-400 dark:text-slate-400 text-xs md:text-sm mt-1">
            {t('dashboard.welcome_msg', 'Xin chào 👋 Đây là tình hình hôm nay')}
          </p>
        </div>
        
        {/* Bộ lọc thời gian Glassmorphism */}
        <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700 p-1 shadow-2xs">
          {PERIODS.map((p) => {
            const isSelected = period === p.value;
            return (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
                style={isSelected ? { background: tintColor } : undefined}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. HÀNG 1: 4 THẺ CHỈ SỐ STATCARD CHUẨN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          icon={TrendingUp} 
          label={t('dashboard.doanh_thu_hom_nay', 'Doanh thu hôm nay')} 
          value={formatVND(todayRevenue)} 
          color="#34D399" 
          sub={`${invoices.filter((i) => i.date === today).length} ${t('dashboard.hoa_don', 'Hóa đơn')}`} 
        />
        <StatCard 
          icon={CalendarDays} 
          label={t('dashboard.lich_hen_hom_nay', 'Lịch hẹn hôm nay')} 
          value={todayAppts.length} 
          color="#60A5FA" 
          sub={`${completedToday} ${t('dashboard.hoan_thanh', 'Hoàn thành')}`} 
        />
        <StatCard 
          icon={Users} 
          label={t('dashboard.khach_hang', 'Khách hàng')} 
          value={customers.length} 
          color="#FBBF24" 
          sub={t('dashboard.toan_chuoi', 'Toàn chuỗi')} 
        />
        <StatCard 
          icon={UserSquare} 
          label={t('dashboard.nhan_vien', 'Nhân viên')} 
          value={staff.length} 
          color="#F97316" 
          sub={t('dashboard.dang_lam_viec', 'Đang làm việc')} 
        />
      </div>

      {/* 3. HÀNG 2: BIỂU ĐỒ DOANH THU 7 NGÀY & HÀNG CHỜ LỊCH HẸN SẮP TỚI */}
      <div className="grid md:grid-cols-2 gap-4">
        
        {/* Cột Trái: Biểu đồ Doanh thu 7 ngày qua */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-all duration-200">
          <h3 className="font-bold mb-1 text-base md:text-xl text-slate-800 dark:text-white">
            {t('dashboard.doanh_thu_7_ngay', 'Doanh thu 7 ngày qua')}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-400 mb-3">
            {t('dashboard.theo_ngay', 'Theo ngày')}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={26}>
              <CartesianGrid vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 12, fill: isDark ? '#94A3B8' : '#64748B' }} 
              />
              <YAxis 
                tickFormatter={(v) => v >= 1000000 ? v / 1000000 + t('dashboard.trieu_short', 'tr') : v >= 1000 ? Math.round(v / 1000) + 'k' : v} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} 
                width={40} 
              />
              <Tooltip 
                formatter={(v) => [formatVND(v), t('dashboard.doanh_thu', 'Doanh thu')]} 
                contentStyle={{ 
                  borderRadius: 12, 
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', 
                  backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                  color: isDark ? '#ffffff' : '#0f172a',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  fontSize: 12,
                  fontWeight: 600
                }} 
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill={tintColor} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cột Phải: Lịch hẹn sắp tới */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-all duration-200">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-base md:text-xl text-slate-800 dark:text-white">
            {t('dashboard.lich_hen_sap_toi', 'Lịch hẹn sắp tới')}
          </h3>
          {upcoming.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-400 text-sm">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              {t('dashboard.khong_co_lich_hen_sap_toi', 'Không có lịch hẹn nào sắp tới')}
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => (
                <div 
                  key={a.id} 
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/60 transition-colors"
                >
                  <div className="text-center w-12">
                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                      {a.start_time?.slice(0, 5)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-800 dark:text-white truncate">
                      {a.customer_name}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-400 truncate">
                      {a.service_name || t('dashboard.chua_chon_dich_vu', 'Chưa chọn dịch vụ')}
                    </div>
                  </div>
                  <span 
                    className="text-[11px] font-semibold px-2 py-1 rounded-full shrink-0" 
                    style={{ background: STATUS_COLORS[a.status] + '26', color: STATUS_COLORS[a.status] }}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. HÀNG 3: 4 BẢNG TOP DOANH THU (DỊCH VỤ, SẢN PHẨM, NHÂN VIÊN, KHÁCH HÀNG) */}
      <div className="grid lg:grid-cols-2 gap-4">
        
        {/* Top Dịch vụ */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-all duration-200">
          <h3 className="font-bold mb-3 text-base md:text-xl text-slate-800 dark:text-white">
            {t('dashboard.top_service_rev', 'Top dịch vụ theo doanh thu')}
          </h3>
          <TopRevenueList 
            items={tops.services} 
            colorFrom="from-pink-400" 
            colorTo="to-rose-500" 
            emptyText={t('common.no_data', 'Chưa có dữ liệu')} 
          />
        </div>

        {/* Top Sản phẩm */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-all duration-200">
          <h3 className="font-bold mb-3 text-base md:text-xl text-slate-800 dark:text-white">
            {t('dashboard.top_product_rev', 'Top sản phẩm theo doanh thu')}
          </h3>
          <TopRevenueList 
            items={tops.products} 
            colorFrom="from-emerald-400" 
            colorTo="to-teal-500" 
            emptyText={t('common.no_data', 'Chưa có dữ liệu')} 
          />
        </div>

        {/* Top Nhân viên */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-all duration-200">
          <h3 className="font-bold mb-3 text-base md:text-xl text-slate-800 dark:text-white">
            {t('dashboard.top_staff_rev', 'Top nhân viên theo doanh thu')}
          </h3>
          <TopRevenueList 
            items={tops.staff} 
            colorFrom="from-amber-400" 
            colorTo="to-orange-500" 
            emptyText={t('common.no_data', 'Chưa có dữ liệu')} 
          />
        </div>

        {/* Top Khách hàng */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-slate-200/60 dark:border-slate-800/80 shadow-xs transition-all duration-200">
          <h3 className="font-bold mb-3 text-base md:text-xl text-slate-800 dark:text-white">
            {t('dashboard.top_customer_rev', 'Top khách hàng theo doanh thu')}
          </h3>
          <TopRevenueList 
            items={tops.customers} 
            colorFrom="from-blue-400" 
            colorTo="to-cyan-500" 
            emptyText={t('common.no_data', 'Chưa có dữ liệu')} 
          />
        </div>

      </div>

    </div>
  );
}