'use client';
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

export default function RevenueChartWidget({ chartData = [], tintColor = '#FF3B7A', size = 'medium' }) {
  const { t } = useT();
  const height = size === 'large' ? 280 : 220;

  return (
    <div className="ios-glass-card p-4 md:p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tintColor}15`, color: tintColor }}>
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">
              {t('dashboard.doanh_thu_7_ngay', 'Doanh thu 7 ngày qua')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {t('dashboard.theo_ngay', 'Theo ngày biến động')}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full mt-2">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} barSize={26}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 11, fill: '#94A3B8' }} 
            />
            <YAxis 
              tickFormatter={(v) => v >= 1000000 ? v / 1000000 + t('dashboard.trieu_short', 'tr') : v >= 1000 ? Math.round(v / 1000) + 'k' : v} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 11, fill: '#94A3B8' }} 
              width={42} 
            />
            <Tooltip 
              formatter={(v) => [formatVND(v), t('dashboard.doanh_thu', 'Doanh thu')]} 
              contentStyle={{ 
                borderRadius: 16, 
                border: '1px solid rgba(255,255,255,0.6)', 
                backdropFilter: 'blur(16px)', 
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                fontSize: 12,
                fontWeight: 600
              }} 
            />
            <Bar 
              dataKey="revenue" 
              radius={[8, 8, 2, 2]} 
              fill={tintColor} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
