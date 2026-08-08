'use client';
import React from 'react';
import { Target, Users, DollarSign, Share2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export default function MarketingTab({ customers = [] }) {
  const t = useT();

  const sources = {};
  customers.forEach(c => {
    const s = c.source || t('reports.source_walk_in', 'Walk-in');
    sources[s] = (sources[s] || 0) + 1;
  });

  const sourceData = Object.entries(sources).map(([name, value]) => ({ name, value }));

  const columns = [
    { key: 'name', label: t('reports.col_acq_channel', 'Acquisition Channel') },
    { key: 'value', label: t('reports.col_cust_count', 'Customer Count'), align: 'right', render: (v) => <span className="font-bold text-blue-600">{v} {t('reports.customers_unit', 'customers')}</span> },
    { key: 'ratio', label: t('reports.col_pct_ratio', 'Percentage %'), align: 'right', render: (_, r) => <span className="font-semibold text-slate-700">{customers.length > 0 ? Math.round((r.value / customers.length) * 100) : 0}%</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_social_cust', 'Social Media Customers')} value="42%" growth={8} icon={Share2} color="blue" />
        <KPICard title={t('reports.kpi_referral_rate', 'Referral Rate')} value="24%" growth={5} icon={Users} color="emerald" />
        <KPICard title={t('reports.kpi_cac', 'Customer Acquisition Cost (CAC)')} value={formatVND(85000)} growth={-6} icon={DollarSign} color="purple" />
        <KPICard title={t('reports.kpi_conversion_rate', 'Channel Conversion Rate')} value="35%" growth={4} icon={Target} color="amber" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
        <h3 className="text-sm font-bold text-slate-800">{t('reports.cust_source_dist', 'Customer Acquisition Source Distribution')}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={sourceData.length ? sourceData : [{ name: t('reports.source_walk_in', 'Walk-in'), value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={55}>
              {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => [`${v}%`, t('reports.ratio_label', 'Ratio')]} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 9 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <DataTable columns={columns} data={sourceData} emptyText={t('reports.no_marketing_data', 'No customer source data available')} />
    </div>
  );
}
