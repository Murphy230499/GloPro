import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';

export default function ProductForm({ item, groups, onClose, onSave }) {
  const [f, setF] = useState({
    name: item.name || '',
    group_id: item.group_id || '',
    price: item.price || 0,
    cost_price: item.cost_price || 0,
    stock: item.stock || 0,
    min_stock: item.min_stock || 0,
    unit: item.unit || '',
    sku: item.sku || '',
    is_active: item.is_active !== false,
    image_url: item.image_url || '',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{item.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Tên sản phẩm" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />

          <div>
            <label className="text-xs text-slate-400">Nhóm sản phẩm</label>
            <select value={f.group_id} onChange={(e) => setF({ ...f, group_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="">— Chọn nhóm —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Giá bán</label>
              <input type="number" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Giá vốn</label>
              <input type="number" value={f.cost_price || ''} onChange={(e) => setF({ ...f, cost_price: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Tồn kho</label>
              <input type="number" value={f.stock || ''} onChange={(e) => setF({ ...f, stock: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Tồn tối thiểu</label>
              <input type="number" value={f.min_stock || ''} onChange={(e) => setF({ ...f, min_stock: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Đơn vị</label>
              <input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="cái, chai, hộp..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Mã SKU</label>
              <input value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} placeholder="SKU" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <ImageUpload value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} label="Hình sản phẩm" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={() => (f.name ? onSave(f) : toast.error('Nhập tên sản phẩm'))} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">Lưu</button>
        </div>
      </div>
    </div>
  );
}