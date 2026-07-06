import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/Layout';
import ImageUpload from '@/components/ImageUpload';

export default function ServiceForm({ item, groups, products, onClose, onSave }) {
  const [f, setF] = useState({
    name: item.name || '',
    group_id: item.group_id || '',
    price: item.price || 0,
    price_from: item.price_from || 0,
    cost: item.cost || 0,
    duration_minutes: item.duration_minutes || 60,
    description: item.description || '',
    is_active: item.is_active !== false,
    image_url: item.image_url || '',
    accompanied_products: item.accompanied_products || [],
  });
  const [accProduct, setAccProduct] = useState('');
  const [accQty, setAccQty] = useState(1);

  const addAccProduct = () => {
    const p = products.find((x) => x.id === accProduct);
    if (!p) return toast.error('Chọn sản phẩm');
    if (f.accompanied_products.find((x) => x.product_id === accProduct)) return toast.error('Đã có sản phẩm này');
    setF({ ...f, accompanied_products: [...f.accompanied_products, { product_id: p.id, product_name: p.name, quantity: accQty }] });
    setAccProduct('');
    setAccQty(1);
  };

  const removeAccProduct = (pid) => {
    setF({ ...f, accompanied_products: f.accompanied_products.filter((x) => x.product_id !== pid) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{item.id ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Tên dịch vụ" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />

          <div>
            <label className="text-xs text-slate-400">Nhóm dịch vụ</label>
            <select value={f.group_id} onChange={(e) => setF({ ...f, group_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="">— Chọn nhóm —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Giá từ (VNĐ)</label>
              <input type="number" value={f.price_from || ''} onChange={(e) => setF({ ...f, price_from: Number(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Giá cố định (VNĐ)</label>
              <input type="number" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Chi phí dịch vụ (VNĐ)</label>
              <input type="number" value={f.cost || ''} onChange={(e) => setF({ ...f, cost: Number(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Thời gian (phút)</label>
              <input type="number" value={f.duration_minutes || ''} onChange={(e) => setF({ ...f, duration_minutes: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Mô tả" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />

          <ImageUpload value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} label="Hình minh hoạ" />

          {/* Accompanied products */}
          <div>
            <label className="text-xs text-slate-400 font-semibold">Sản phẩm đi kèm (tự trừ kho khi bán)</label>
            <div className="flex gap-1.5 mt-1">
              <select value={accProduct} onChange={(e) => setAccProduct(e.target.value)} className="flex-1 px-2.5 py-2 rounded-xl border border-slate-200 text-sm">
                <option value="">— Chọn sản phẩm —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" value={accQty} onChange={(e) => setAccQty(Number(e.target.value) || 1)} min="1" className="w-16 px-2 py-2 rounded-xl border border-slate-200 text-sm text-center" />
              <button type="button" onClick={addAccProduct} className="px-3 rounded-xl bg-slate-100 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
            </div>
            {f.accompanied_products.length > 0 && (
              <div className="mt-2 space-y-1">
                {f.accompanied_products.map((ap) => (
                  <div key={ap.product_id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 text-sm">
                    <span className="flex-1 truncate">{ap.product_name}</span>
                    <span className="text-xs text-slate-400">SL: {ap.quantity}</span>
                    <button type="button" onClick={() => removeAccProduct(ap.product_id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={() => (f.name ? onSave(f) : toast.error('Nhập tên dịch vụ'))} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">Lưu</button>
        </div>
      </div>
    </div>
  );
}