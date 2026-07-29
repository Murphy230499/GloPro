'use client';

import React from 'react';
import { BarChart3, Download, Printer, TrendingUp, Users, DollarSign } from 'lucide-react';
import { formatVND } from '@/lib/format';

export default function CustomReportCard({ report }) {
  if (!report) return null;

  const { title, items = [], createdDate } = report;

  const totalSum = items.reduce((acc, it) => acc + (Number(it.value) || 0), 0);
  const maxVal = Math.max(...items.map(it => Number(it.value) || 0), 1);

  const handleExportCSV = () => {
    let csv = `BÁO CÁO: ${title}\nNgày tạo: ${createdDate}\n\nTên,Chi tiết / Vai trò,Số lượng,Doanh thu / Giá trị\n`;
    items.forEach(it => {
      csv += `"${it.name}","${it.sub || ''}",${it.count || 1},${it.value || 0}\n`;
    });
    csv += `\nTỔNG CỘNG,,${items.reduce((a, b) => a + (b.count || 0), 0)},${totalSum}\n`;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_Cao_GloPro_${Date.now()}.csv`;
    link.click();
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 text-left font-sans animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800">
            <BarChart3 className="w-4 h-4 text-pink-600 shrink-0" />
            <span>{title}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Khởi tạo vào: {createdDate} • GloPro Analytics</div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-emerald-200"
            title="Xuất file CSV/Excel"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Excel
          </button>
          <button
            onClick={handlePrint}
            className="p-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-xs font-bold transition-colors"
            title="In báo cáo"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metric summary */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-500 font-medium">Tổng giá trị báo cáo</div>
          <div className="text-base font-bold text-pink-600">{formatVND(totalSum)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 font-medium">Số mục phân tích</div>
          <div className="text-sm font-bold text-slate-800">{items.length} đối tượng</div>
        </div>
      </div>

      {/* Visual Chart Bars */}
      <div className="space-y-2 pt-1">
        {items.slice(0, 5).map((it, idx) => {
          const pct = Math.round(((Number(it.value) || 0) / maxVal) * 100);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="truncate max-w-[180px] font-bold">{it.name} {it.sub && <span className="text-[10px] font-normal text-slate-400">({it.sub})</span>}</span>
                <span className="font-bold text-slate-800">{formatVND(it.value)}</span>
              </div>
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-500 to-rose-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
