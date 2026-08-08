'use client';
import React, { useMemo } from 'react';
import { useT } from '@/lib/i18n';
import { Wallet, CreditCard, Banknote, HelpCircle } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import moment from 'moment';

const COLORS = {
  'cash': '#10B981',
  'transfer': '#3B82F6',
  'card': '#8B5CF6',
  'debt': '#F43F5E',
  'unknown': '#94A3B8'
};

const ICONS = {
  'cash': Banknote,
  'transfer': Wallet,
  'card': CreditCard,
  'debt': HelpCircle,
  'unknown': HelpCircle
};

export default function PaymentMethodsTab({ invoices = [], datePreset, customRange, onDrillDown }) {
  const t = useT();
  const LABELS = {
    'cash': t('reports.pm_cash', 'Cash'),
    'transfer': t('reports.pm_bank', 'Bank Transfer'),
    'card': t('reports.pm_card', 'POS Card'),
    'debt': t('reports.pm_debt', 'Debt / On Credit'),
    'unknown': t('reports.other', 'Other')
  };

  const filteredInvoices = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    
    const now = moment();
    let start = null;
    let end = null;

    if (datePreset === 'custom' && customRange?.startDate && customRange?.endDate) {
      start = moment(customRange.startDate).startOf('day');
      end = moment(customRange.endDate).endOf('day');
    } else if (datePreset === 'today') {
      start = now.clone().startOf('day');
      end = now.clone().endOf('day');
    } else if (datePreset === 'yesterday') {
      start = now.clone().subtract(1, 'days').startOf('day');
      end = now.clone().subtract(1, 'days').endOf('day');
    } else if (datePreset === '7d') {
      start = now.clone().subtract(6, 'days').startOf('day');
      end = now.clone().endOf('day');
    } else if (datePreset === '30d') {
      start = now.clone().subtract(29, 'days').startOf('day');
      end = now.clone().endOf('day');
    } else if (datePreset === 'thisMonth') {
      start = now.clone().startOf('month');
      end = now.clone().endOf('month');
    } else if (datePreset === 'lastMonth') {
      start = now.clone().subtract(1, 'months').startOf('month');
      end = now.clone().subtract(1, 'months').endOf('month');
    }

    if (!start || !end) return invoices;

    return invoices.filter(inv => {
      const invDate = moment(inv.created_date || inv.created_at);
      return invDate.isBetween(start, end, null, '[]');
    });
  }, [invoices, datePreset, customRange]);

  const { dataMap, totalAmount } = useMemo(() => {
    let total = 0;
    const map = {
      cash: { count: 0, amount: 0, items: [] },
      transfer: { count: 0, amount: 0, items: [] },
      card: { count: 0, amount: 0, items: [] },
      debt: { count: 0, amount: 0, items: [] },
      unknown: { count: 0, amount: 0, items: [] }
    };

    filteredInvoices.forEach(inv => {
      const amt = (inv.final_amount !== undefined ? inv.final_amount : inv.total) || 0;
      let method = (inv.payment_method || 'unknown').toLowerCase();
      
      if (!map[method]) {
        map.unknown.count++;
        map.unknown.amount += amt;
        map.unknown.items.push(inv);
      } else {
        map[method].count++;
        map[method].amount += amt;
        map[method].items.push(inv);
      }
      total += amt;
    });

    return { dataMap: map, totalAmount: total };
  }, [filteredInvoices]);

  const chartData = Object.keys(dataMap)
    .filter(k => dataMap[k].amount > 0)
    .map(key => ({
      name: LABELS[key] || key,
      value: dataMap[key].amount,
      key: key,
      count: dataMap[key].count,
      percentage: totalAmount > 0 ? ((dataMap[key].amount / totalAmount) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.value - a.value);

  const tableColumns = [
    { key: 'name', label: t('reports.col_payment_method', 'Payment Method') },
    { key: 'count', label: t('reports.col_invoice_count', 'Invoice Count') },
    { key: 'value', label: t('reports.col_total_revenue', 'Total Revenue'), render: (val) => formatVND(val) },
    { key: 'percentage', label: t('reports.col_share_pct', 'Share %'), render: (val) => `${val}%` }
  ];

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {chartData.map((item) => {
          const IconCmp = ICONS[item.key] || HelpCircle;
          return (
            <KPICard 
              key={item.key}
              title={t('reports.collected_via', 'Collected via {method}', { method: item.name })}
              value={formatVND(item.value)}
              subtitle={`${item.count} ${t('reports.unit_invoices', 'invoices')} (${item.percentage}%)`}
              icon={IconCmp}
              trend="up"
              trendValue="0"
              color={COLORS[item.key]}
            />
          );
        })}
        {chartData.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
            {t('reports.no_payment_data_period', 'No payment data available in this period.')}
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Pie Chart */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-500" />
              {t('reports.revenue_share_pie', 'Revenue Share Breakdown')}
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.key] || COLORS.unknown} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatVND(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-4">{t('reports.payment_method_details', 'Payment Method Details')}</h3>
            <div className="flex-1 overflow-auto">
              <DataTable 
                columns={tableColumns}
                data={chartData}
                onRowClick={(row) => {
                  onDrillDown && onDrillDown(t('reports.invoice_details_method', 'Invoice details ({method})', { method: row.name }), dataMap[row.key]?.items || []);
                }}
              />
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
