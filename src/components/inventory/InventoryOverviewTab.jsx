'use client';
import React, { useState } from 'react';
import { Search, AlertTriangle, Package, Boxes, TrendingUp, TrendingDown, RefreshCw, Plus, Edit3, Trash2 } from 'lucide-react';
import { formatVND } from '@/lib/format';

export default function InventoryOverviewTab({ products, onEditProduct, onDeleteProduct, onOpenStockIn, onOpenStockOut }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'low', 'out', 'safe'

  const filtered = (products || []).filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);

    const stock = p.stock || 0;
    const minStock = p.min_stock || 5;

    if (filterStatus === 'low') return matchQ && stock > 0 && stock <= minStock;
    if (filterStatus === 'out') return matchQ && stock <= 0;
    if (filterStatus === 'safe') return matchQ && stock > minStock;
    return matchQ;
  });

  // Calculate overview metrics
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.min_stock || 5)).length;
  const outOfStockCount = products.filter(p => (p.stock || 0) <= 0).length;

  const totalCostValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost_price || p.price * 0.7)), 0);
  const totalRetailValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);

  return (
    <div className="space-y-4 font-sans text-left">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">Tổng Sản Phẩm Trong Kho</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{totalProducts} mặt hàng</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">Cảnh Báo Sắp Hết Hàng</div>
          <div className="text-xl font-bold text-amber-600 mt-1 flex items-center gap-1.5">
            <span>{lowStockCount + outOfStockCount} sản phẩm</span>
            {(lowStockCount > 0 || outOfStockCount > 0) && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">Giá Trị Kho (Theo Giá Vốn)</div>
          <div className="text-xl font-bold text-purple-700 mt-1">{formatVND(totalCostValue)}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">Giá Trị Kho (Dự Kiến Bán)</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{formatVND(totalRetailValue)}</div>
        </div>
      </div>

      {/* Toolbar & Status Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên sản phẩm, mã SKU..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-800"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: `Tất cả (${totalProducts})` },
            { id: 'low', label: `Cần nhập gấp (${lowStockCount})` },
            { id: 'out', label: `Hết hàng (${outOfStockCount})` },
            { id: 'safe', label: `Đủ tồn kho` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === f.id
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStockIn}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            + Nhập Kho
          </button>
          <button
            onClick={onOpenStockOut}
            className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            - Xuất Kho
          </button>
        </div>
      </div>

      {/* Stock Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-100">
            <p className="text-slate-400 text-sm font-medium">Không tìm thấy sản phẩm kho nào phù hợp</p>
          </div>
        ) : (
          filtered.map(p => {
            const stock = p.stock || 0;
            const minStock = p.min_stock || 5;
            const isOut = stock <= 0;
            const isLow = !isOut && stock <= minStock;
            const progress = Math.min(100, Math.round((stock / (minStock * 2)) * 100));

            return (
              <div 
                key={p.id} 
                className={`bg-white rounded-2xl p-3.5 border ${
                  isOut ? 'border-red-200 bg-red-50/10' : isLow ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200/80'
                } shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2.5`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] text-slate-400 font-medium truncate">SKU: {p.sku || 'N/A'}</span>
                    {isOut ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 font-bold">Hết hàng</span>
                    ) : isLow ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Sắp hết
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">An toàn</span>
                    )}
                  </div>

                  <div className="font-bold text-xs text-slate-900 truncate mt-1">{p.name}</div>
                  <div className="text-[11px] text-slate-400">Đơn vị: <span className="font-semibold text-slate-600">{p.unit || 'Chai'}</span></div>
                </div>

                {/* Stock Bar & Quantity */}
                <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Tồn hiện tại:</span>
                    <span className={`font-bold ${isOut ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                      {stock} {p.unit || 'Chai'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Cảnh báo nhỏ hơn: {minStock}</span>
                    <span>Giá bán: {formatVND(p.price || 0)}</span>
                  </div>
                </div>

                {/* Card Toolbar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Giá vốn: <span className="font-semibold text-slate-700">{formatVND(p.cost_price || p.price * 0.7)}</span>
                  </span>

                  <div className="flex items-center gap-0.5">
                    {onEditProduct && (
                      <button 
                        onClick={() => onEditProduct(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteProduct && (
                      <button 
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
