'use client';
import React from 'react';
import { Package, AlertTriangle, DollarSign, Layers } from 'lucide-react';
import KPICard from '../KPICard';
import AIInsightBox from '../AIInsightBox';
import AlertBanner from '../AlertBanner';
import DataTable from '../DataTable';
import { formatVND } from '@/lib/format';
import { generateAIInsights, generateOperationalAlerts } from '@/lib/reportsEngine';
import { useT } from '@/lib/i18n';

export default function InventoryTab({ products = [] }) {
  const t = useT();
  const totalItems = products.length;
  const totalValuation = products.reduce((s, p) => s + (p.cost_price || p.price * 0.6 || 0) * (p.stock || 0), 0);
  const lowStockProducts = products.filter(p => p.stock !== undefined && p.min_stock !== undefined && p.stock <= p.min_stock);

  const insights = generateAIInsights('inventory', { lowStockCount: lowStockProducts.length, totalValuation }, t);
  const alerts = generateOperationalAlerts(products, [], [], [], t);

  const columns = [
    { key: 'name', label: t('reports.col_stock_product_name', 'Product Name') },
    { key: 'category', label: t('reports.col_category', 'Category') },
    { key: 'stock', label: t('reports.col_in_stock_qty', 'In Stock Qty'), align: 'right', render: (v, r) => <span className={`font-bold ${v <= (r.min_stock || 5) ? 'text-rose-600' : 'text-slate-800'}`}>{v || 0}</span> },
    { key: 'min_stock', label: t('reports.col_min_threshold', 'Min Threshold'), align: 'right', render: (v) => <span className="text-slate-500 font-semibold">{v || 5}</span> },
    { key: 'cost_price', label: t('reports.col_cost_price', 'Cost Price'), align: 'right', render: (v, r) => formatVND(v || r.price * 0.6 || 0) },
    { key: 'totalValue', label: t('reports.col_total_stock_val', 'Total Stock Valuation'), align: 'right', render: (_, r) => <span className="font-bold text-emerald-600">{formatVND((r.cost_price || r.price * 0.6 || 0) * (r.stock || 0))}</span> }
  ];

  return (
    <div className="space-y-5">
      <AIInsightBox insights={insights} />
      <AlertBanner alerts={alerts} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard title={t('reports.kpi_total_inv_val', 'Total Inventory Valuation')} value={formatVND(totalValuation)} growth={5} icon={DollarSign} color="emerald" />
        <KPICard title={t('reports.kpi_total_stock_skus', 'Total Stock SKUs')} value={totalItems} growth={0} icon={Package} color="blue" />
        <KPICard title={t('reports.kpi_low_stock_prods', 'Low Stock Products')} value={lowStockProducts.length} growth={-2} icon={AlertTriangle} color="rose" />
        <KPICard title={t('reports.kpi_avg_val_sku', 'Avg Valuation / SKU')} value={formatVND(totalItems > 0 ? Math.round(totalValuation / totalItems) : 0)} growth={1} icon={Layers} color="amber" />
      </div>

      <DataTable columns={columns} data={products} emptyText={t('reports.no_inventory_data', 'No inventory data available')} />
    </div>
  );
}
