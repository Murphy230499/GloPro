'use client';
import React from 'react';
import { Package, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import KPICard from '../KPICard';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

export default function ProductsTab({ products = [], invoices = [] }) {
  const t = useT();

  const prodStats = products.map(p => {
    let count = 0;
    let revenue = 0;

    invoices.forEach(inv => {
      (inv.items || []).forEach(it => {
        if (it.type === 'product' && (it.name === p.name || it.product_id === p.id)) {
          const qty = it.qty || 1;
          count += qty;
          revenue += (it.price || 0) * qty;
        }
      });
    });

    return {
      id: p.id,
      name: p.name,
      category: p.category || t('reports.cat_cosmetics', 'Cosmetics'),
      price: p.price || 0,
      stock: p.stock || 0,
      count,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const totalRev = prodStats.reduce((s, x) => s + x.revenue, 0);
  const totalCount = prodStats.reduce((s, x) => s + x.count, 0);

  const topChart = prodStats.slice(0, 5);

  const columns = [
    { key: 'name', label: t('reports.col_product_name', 'Product Name') },
    { key: 'category', label: t('reports.col_category', 'Category') },
    { key: 'price', label: t('reports.col_retail_price', 'Retail Price'), align: 'right', render: (v) => formatVND(v) },
    { key: 'stock', label: t('reports.col_current_stock', 'Current Stock'), align: 'right', render: (v) => <span className="font-semibold text-slate-700">{v} {t('reports.unit_items', 'items')}</span> },
    { key: 'count', label: t('reports.col_retail_sold', 'Retail Units Sold'), align: 'right', render: (v) => <span className="font-semibold text-blue-600">{v} {t('reports.unit_units', 'units')}</span> },
    { key: 'revenue', label: t('reports.col_total_revenue', 'Total Revenue'), align: 'right', render: (v) => <span className="font-bold text-emerald-600">{formatVND(v)}</span> }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_total_skus', 'Total Product SKUs')} value={products.length} growth={0} icon={Package} color="blue" />
        <KPICard title={t('reports.kpi_total_retail_sold', 'Total Retail Sold')} value={`${totalCount} ${t('reports.unit_units', 'units')}`} growth={18} icon={ShoppingBag} color="emerald" />
        <KPICard title={t('reports.kpi_total_retail_rev', 'Total Retail Revenue')} value={formatVND(totalRev)} growth={20} icon={TrendingUp} color="purple" />
        <KPICard title={t('reports.kpi_avg_rev_product', 'Avg Rev / Product')} value={formatVND(totalCount > 0 ? Math.round(totalRev / totalCount) : 0)} growth={2} icon={DollarSign} color="amber" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3 min-w-0">
        <h3 className="text-sm font-bold text-slate-800">{t('reports.top_5_bestselling_prods', 'Top 5 Best-Selling Products')}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topChart} layout="vertical" barSize={18}>
            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tickFormatter={(v) => v >= 1000000 ? (v / 1000000) + 'M' : v} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={130} />
            <Tooltip formatter={(v) => [formatVND(v), t('reports.revenue_label', 'Revenue')]} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
            <Bar dataKey="revenue" name={t('reports.revenue_label', 'Revenue')} radius={[0, 6, 6, 0]} fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DataTable columns={columns} data={prodStats} emptyText={t('reports.no_products_data', 'No product data available')} />
    </div>
  );
}
