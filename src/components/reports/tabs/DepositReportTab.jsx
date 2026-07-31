'use client';
import React, { useMemo } from 'react';
import { ShieldCheck, TrendingUp, DollarSign, Wallet, CheckCircle, RefreshCcw } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';

export default function DepositReportTab({ deposits = [], searchQuery = '' }) {
  // Aggregate data
  const metrics = useMemo(() => {
    let totalReceived = 0;
    let totalApplied = 0;
    let totalAvailable = 0;
    let totalRefunded = 0;

    deposits.forEach(d => {
      const amount = d.amount || 0;
      const status = d.status || 'available';

      if (status === 'available') {
        totalReceived += amount;
        totalAvailable += amount;
      } else if (status === 'applied') {
        totalReceived += amount;
        totalApplied += amount;
      } else if (status === 'refunded' || status === 'cancelled') {
        totalRefunded += amount;
      }
    });

    return {
      totalReceived,
      totalApplied,
      totalAvailable,
      totalRefunded
    };
  }, [deposits]);

  // Chart data: Trend of deposits over time
  const trendData = useMemo(() => {
    const trendMap = {};
    deposits.forEach(d => {
      if (!d.created_date) return;
      // count all received (available + applied)
      if (d.status === 'refunded' || d.status === 'cancelled') return;
      const day = d.created_date.substring(0, 10);
      trendMap[day] = (trendMap[day] || 0) + (d.amount || 0);
    });

    return Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30) // last 30 days of data
      .map(([date, amount]) => ({
        date: date.substring(5), // MM-DD
        amount
      }));
  }, [deposits]);

  // Table Columns
  const columns = [
    {
      key: 'created_date',
      label: 'Ngày tạo',
      render: (val) => val ? new Date(val).toLocaleDateString('vi-VN') : '-'
    },
    {
      key: 'customer_name',
      label: 'Khách hàng',
      render: (val) => <span className="font-medium text-slate-800">{val || 'Khách vãng lai'}</span>
    },
    {
      key: 'amount',
      label: 'Số tiền',
      render: (val) => <span className="font-semibold text-slate-800">{formatVND(val)}</span>
    },
    {
      key: 'payment_method',
      label: 'Hình thức',
      render: (val) => {
        const labels = { cash: 'Tiền mặt', bank: 'Chuyển khoản', card: 'Quẹt thẻ' };
        return <span className="text-slate-600">{labels[val] || val || 'Khác'}</span>;
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (val) => {
        const statusConfig = {
          available: { bg: 'bg-emerald-50 text-emerald-700', label: 'Khả dụng' },
          applied: { bg: 'bg-blue-50 text-blue-700', label: 'Đã dùng' },
          refunded: { bg: 'bg-slate-50 text-slate-600', label: 'Đã hoàn' },
          cancelled: { bg: 'bg-red-50 text-red-700', label: 'Đã huỷ' }
        };
        const config = statusConfig[val] || { bg: 'bg-slate-50 text-slate-600', label: val };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg}`}>
            {config.label}
          </span>
        );
      }
    }
  ];

  const filteredDeposits = deposits.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (d.customer_name || '').toLowerCase().includes(q) ||
           (d.notes || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 font-sans">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tổng Cọc Đã Nhận"
          value={formatVND(metrics.totalReceived)}
          icon={DollarSign}
          growth={12}
          compareText="so với kỳ trước"
          color="emerald"
        />
        <KPICard
          title="Cọc Khả Dụng"
          value={formatVND(metrics.totalAvailable)}
          icon={ShieldCheck}
          growth={5}
          compareText="số tiền khách chưa dùng"
          color="blue"
        />
        <KPICard
          title="Cọc Đã Dùng"
          value={formatVND(metrics.totalApplied)}
          icon={CheckCircle}
          growth={8}
          compareText="đã dùng thanh toán HĐ"
          color="indigo"
        />
        <KPICard
          title="Đã Hoàn/Huỷ"
          value={formatVND(metrics.totalRefunded)}
          icon={RefreshCcw}
          growth={0}
          compareText="tiền cọc trả lại khách"
          color="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-pink-600" />
            <h3 className="font-bold text-slate-800">Biểu đồ Nhận Cọc</h3>
          </div>
          <div className="h-[300px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748B', fontSize: 12}} 
                    tickFormatter={(val) => `${val / 1000}k`}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{fill: '#F8FAFC'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(val) => [formatVND(val), 'Số tiền']}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Không có dữ liệu trong khoảng thời gian này
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-center text-center">
          <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-pink-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-2">Tầm quan trọng của Đặt Cọc</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Theo dõi dòng tiền cọc giúp đảm bảo tính thanh khoản và thể hiện mức độ cam kết của khách hàng. Hãy khuyến khích khách hàng đặt cọc cho các dịch vụ giá trị cao.
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Chi Tiết Khoản Cọc
        </h3>
        <DataTable
          columns={columns}
          data={filteredDeposits}
          emptyText="Không tìm thấy dữ liệu đặt cọc phù hợp"
        />
      </div>
    </div>
  );
}
