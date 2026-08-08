'use client';
import React from 'react';
import { Users, UserPlus, Award, Repeat, HelpCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import KPICard from '../KPICard';
import AIInsightBox from '../AIInsightBox';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { generateAIInsights } from '@/lib/reportsEngine';
import { useT } from '@/lib/i18n';

export default function CustomersTab({ customers = [], invoices = [] }) {
  const t = useT();

  const walkInCustomers = customers.filter(c => 
    !c.full_name || 
    c.full_name.toLowerCase().includes('vãng lai') || 
    c.full_name.toLowerCase().includes('vang lai') || 
    c.id === 'walk_in' || 
    c.id === 'walkin'
  );
  
  const registeredCustomers = customers.filter(c => 
    c.full_name && 
    !c.full_name.toLowerCase().includes('vãng lai') && 
    !c.full_name.toLowerCase().includes('vang lai') && 
    c.id !== 'walk_in' && 
    c.id !== 'walkin'
  );

  const totalCust = customers.length;
  const walkInCount = walkInCustomers.length || invoices.filter(i => !i.customer_id || (i.customer_name || '').toLowerCase().includes('vãng lai')).length;
  
  const vipCount = registeredCustomers.filter(c => c.tier === 'VIP' || (c.total_spent || 0) >= 5000000).length;
  const repeatRate = totalCust > 0 ? Math.round((registeredCustomers.filter(c => (c.visit_count || 0) > 1).length / Math.max(registeredCustomers.length, 1)) * 100) : 52;
  const avgCLV = registeredCustomers.length > 0 ? Math.round(invoices.reduce((s, i) => s + (i.total || 0), 0) / registeredCustomers.length) : 0;

  const topSpenders = [...registeredCustomers]
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 5)
    .map(c => ({ name: c.full_name, spent: c.total_spent || 0 }));

  const insights = generateAIInsights('customers', { vipRatio: 45, churnRiskCount: 8 }, t);

  const columns = [
    { key: 'full_name', label: t('reports.col_customer_name', 'Customer Name') },
    { key: 'phone', label: t('reports.col_phone', 'Phone Number') },
    { 
      key: 'tier', 
      label: t('reports.col_tier', 'Membership Tier'), 
      render: (v, row) => {
        const isWalkIn = !row.full_name || row.full_name.toLowerCase().includes('vãng lai') || row.full_name.toLowerCase().includes('vang lai');
        if (isWalkIn) {
          return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]">{t('reports.walk_in_customer', 'Walk-in Customer')}</span>;
        }
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px]">{v || t('reports.member', 'Member')}</span>;
      } 
    },
    { key: 'total_spent', label: t('reports.col_total_spent', 'Total Spent'), align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v || 0)}</span> },
    { key: 'points', label: t('reports.col_points', 'Reward Points'), align: 'right', render: (v) => <span className="font-semibold text-blue-600">{v || 0} pts</span> }
  ];

  return (
    <div className="space-y-5">
      <AIInsightBox insights={insights} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <KPICard title={t('reports.kpi_total_customers', 'Total Customers')} value={totalCust} growth={12} icon={Users} color="blue" />
        <KPICard title={t('reports.kpi_walk_in_customers', 'Walk-in Customers')} value={walkInCount} growth={15} icon={HelpCircle} color="slate" />
        <KPICard title={t('reports.kpi_repeat_rate', 'Retention / Repeat Rate')} value={`${repeatRate}%`} growth={5} icon={Repeat} color="emerald" />
        <KPICard title={t('reports.kpi_vip_customers', 'VIP Customers')} value={vipCount} growth={8} icon={Award} color="amber" />
        <KPICard title={t('reports.kpi_member_clv', 'Member CLV')} value={formatVND(avgCLV)} growth={7} icon={UserPlus} color="purple" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
        <h3 className="text-sm font-bold text-slate-800">{t('reports.top_5_spenders', 'Top 5 Spender Customers')}</h3>
        {topSpenders.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">{t('reports.no_spending_data', 'No spending data available')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topSpenders} layout="vertical" barSize={18}>
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(v) => v >= 1000000 ? (v / 1000000) + 'M' : v} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={130} />
              <Tooltip formatter={(v) => [formatVND(v), t('reports.col_total_spent', 'Total Spent')]} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
              <Bar dataKey="spent" name={t('reports.col_total_spent', 'Total Spent')} radius={[0, 6, 6, 0]} fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <DataTable columns={columns} data={customers} emptyText={t('reports.no_customers_in_period', 'No customer data available')} />
    </div>
  );
}
