'use client';
import React from 'react';
import { formatVND } from '@/lib/format';

export default function TopRevenueList({ items, colorFrom = 'from-pink-400', colorTo = 'to-purple-500', emptyText = 'Chưa có dữ liệu' }) {
  if (!items || items.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-6">{emptyText}</p>;
  }
  const max = items[0].value;
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={it.id || it.name}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium truncate">{i + 1}. {it.name}</span>
            <span className="font-semibold text-pink-600 shrink-0 ml-2">{formatVND(it.value)}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${colorFrom} ${colorTo}`} style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}