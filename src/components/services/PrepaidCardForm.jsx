import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import PrepaidCardView from '@/components/PrepaidCardView';
import { formatVND } from '@/lib/format';

const COLORS = [
  { v: '#FF6B9D', l: 'Hồng' }, { v: '#A78BFA', l: 'Tím' }, { v: '#60A5FA', l: 'Xanh dương' },
  { v: '#34D399', l: 'Xanh lá' }, { v: '#FBBF24', l: 'Vàng' }, { v: '#F97316', l: 'Cam' },
  { v: '#1E293B', l: 'Đen' }, { v: '#831843', l: 'Đỏ đậm' },
];

function genCardCode() {
  const blocks = [];
  for (let i = 0; i < 4; i++) {
    let block = '';
    for (let j = 0; j < 4; j++) block += Math.floor(Math.random() * 10);
    blocks.push(block);
  }
  return blocks.join(' ');
}

export default function PrepaidCardForm({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', card_code: genCardCode(), face_value: 0, selling_price: 0,
    color: COLORS[0].v, expiry_months: 0, description: '', image_url: '', is_active: true,
  });

  useEffect(() => {
    if (item?.id) {
      setForm({
        name: item.name || '', card_code: item.card_code || genCardCode(),
        face_value: item.face_value || 0, selling_price: item.selling_price || 0,
        color: item.color || COLORS[0].v, expiry_months: item.expiry_months || 0,
        description: item.description || '', image_url: item.image_url || '', is_active: item.is_active !== false,
      });
    }
  }, [item]);

  const submit = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, balance: form.face_value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{item?.id ? 'Sửa thẻ tiền mặt' : 'Tạo thẻ tiền mặt'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="mb-5 max-w-[300px] mx-auto">
          <PrepaidCardView card={form} size="sm" />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Tên thẻ *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Thẻ VIP 500K" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Mã thẻ</label>
            <div className="flex gap-2">
              <input value={form.card_code} onChange={(e) => setForm({ ...form, card_code: e.target.value })}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono" />
              <button onClick={() => setForm({ ...form, card_code: genCardCode() })}
                className="px-3 py-2.5 rounded-xl bg-slate-100 text-sm font-medium">Random</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Mệnh giá (₫)</label>
              <input type="number" value={form.face_value || ''} onChange={(e) => setForm({ ...form, face_value: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
              <div className="text-xs text-slate-400 mt-1">{formatVND(form.face_value)}</div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Giá bán (₫)</label>
              <input type="number" value={form.selling_price || ''} onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
              <div className="text-xs text-slate-400 mt-1">{formatVND(form.selling_price)}</div>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Màu thẻ</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c.v} onClick={() => setForm({ ...form, color: c.v })}
                  className={`w-8 h-8 rounded-full transition-all ${form.color === c.v ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                  style={{ background: c.v }} title={c.l} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Hạn sử dụng (tháng)</label>
            <input type="number" value={form.expiry_months || ''} onChange={(e) => setForm({ ...form, expiry_months: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="0 = không giới hạn" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Mô tả</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none" />
          </div>
          <ImageUpload label="Ảnh (tuỳ chọn)" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
        </div>

        <button onClick={submit} disabled={!form.name.trim()}
          className="w-full mt-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50">
          {item?.id ? 'Lưu thay đổi' : 'Tạo thẻ'}
        </button>
      </div>
    </div>
  );
}