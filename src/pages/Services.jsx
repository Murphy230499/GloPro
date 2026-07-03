import React, { useEffect, useState } from 'react';
import { Plus, X, Scissors, Package, Edit3, ToggleLeft, ToggleRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';

const CATEGORIES = {
  hair: { label: 'Tóc', color: '#FF6B9D' },
  barber: { label: 'Barber', color: '#34D399' },
  nail: { label: 'Nail', color: '#F472B6' },
  skincare: { label: 'Skincare', color: '#A78BFA' },
  spa: { label: 'Spa', color: '#60A5FA' },
  makeup: { label: 'Makeup', color: '#FBBF24' },
  other: { label: 'Khác', color: '#94A3B8' },
};

export default function Services() {
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState('service');
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => {
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
      base44.entities.Service.filter(filter),
      base44.entities.Product.filter(filter),
    ]).then(([s, p]) => {
      setServices(s);
      setProducts(p);
      setLoading(false);
    });
  };
  useEffect(load, [currentBranchId]);

  const toggleActive = async (item, isService) => {
    if (isService) await base44.entities.Service.update(item.id, { is_active: !item.is_active });
    else await base44.entities.Product.update(item.id, { is_active: !item.is_active });
    load();
  };

  const save = async (data, isService) => {
    const payload = { ...data, branch_id: data.branch_id || (currentBranchId === 'all' ? '' : currentBranchId) };
    try {
      if (editing.id) {
        if (isService) await base44.entities.Service.update(editing.id, payload);
        else await base44.entities.Product.update(editing.id, payload);
        toast.success('Đã cập nhật');
      } else {
        if (isService) await base44.entities.Service.create(payload);
        else await base44.entities.Product.create(payload);
        toast.success('Đã thêm');
      }
      setEditing(null);
      load();
    } catch (e) { toast.error('Lỗi: ' + (e.message || e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dịch vụ & Sản phẩm</h1>
          <p className="text-slate-400 text-sm mt-1">Danh mục và bảng giá</p>
        </div>
        <button onClick={() => setEditing({ type: tab })} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">
          <Plus className="w-4 h-4" /> Thêm {tab === 'service' ? 'dịch vụ' : 'sản phẩm'}
        </button>
      </div>

      <div className="flex gap-2">
        {[{ v: 'service', l: 'Dịch vụ', i: Scissors }, { v: 'product', l: 'Sản phẩm', i: Package }].map((t) => {
          const Icon = t.i;
          return (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${tab === t.v ? 'bg-primary text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
              <Icon className="w-4 h-4" /> {t.l}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" /></div>
      ) : tab === 'service' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((s) => {
            const cat = CATEGORIES[s.category] || CATEGORIES.other;
            return (
              <div key={s.id} className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm ${!s.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: cat.color + '1a', color: cat.color }}>{cat.label}</span>
                  <button onClick={() => toggleActive(s, true)}>{s.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
                </div>
                <div className="font-bold mt-2">{s.name}</div>
                {s.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{s.description}</div>}
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-pink-600">{formatVND(s.price)}</span>
                  <span className="text-xs text-slate-400">{s.duration_minutes || 0} phút • HH {s.commission_rate || 0}%</span>
                </div>
                <button onClick={() => setEditing({ ...s, type: 'service' })} className="w-full mt-2 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1"><Edit3 className="w-3.5 h-3.5" />Sửa</button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {products.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12">Chưa có sản phẩm nào</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Sản phẩm</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Phân loại</th>
                  <th className="text-right px-4 py-3 font-medium">Giá bán</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Tồn</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={`border-t border-slate-50 ${!p.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{p.category || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-pink-600">{formatVND(p.price)}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">{p.stock || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleActive(p, false)}>{p.is_active ? <ToggleRight className="w-6 h-6 text-green-500 inline" /> : <ToggleLeft className="w-6 h-6 text-slate-300 inline" />}</button>
                      <button onClick={() => setEditing({ ...p, type: 'product' })} className="ml-2 text-slate-400"><Edit3 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editing && (
        editing.type === 'service'
          ? <ServiceForm item={editing} onClose={() => setEditing(null)} onSave={(d) => save(d, true)} />
          : <ProductForm item={editing} onClose={() => setEditing(null)} onSave={(d) => save(d, false)} />
      )}
    </div>
  );
}

function ServiceForm({ item, onClose, onSave }) {
  const [f, setF] = useState({
    name: item.name || '', category: item.category || 'hair', price: item.price || 0,
    duration_minutes: item.duration_minutes || 60, commission_rate: item.commission_rate || 30,
    description: item.description || '', is_active: item.is_active !== false,
  });
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">{item.id ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h2>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Tên dịch vụ" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-slate-400">Giá (VNĐ)</label><input type="number" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
            <div><label className="text-xs text-slate-400">Thời gian (phút)</label><input type="number" value={f.duration_minutes || ''} onChange={(e) => setF({ ...f, duration_minutes: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
          </div>
          <div><label className="text-xs text-slate-400">Hoa hồng (%)</label><input type="number" value={f.commission_rate || ''} onChange={(e) => setF({ ...f, commission_rate: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Mô tả" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={() => f.name ? onSave(f) : toast.error('Nhập tên dịch vụ')} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">Lưu</button>
        </div>
      </div>
    </div>
  );
}

function ProductForm({ item, onClose, onSave }) {
  const [f, setF] = useState({
    name: item.name || '', category: item.category || '', price: item.price || 0,
    cost_price: item.cost_price || 0, stock: item.stock || 0, is_active: item.is_active !== false,
  });
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{item.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Tên sản phẩm" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Phân loại (vd: Dầu gội, Gel...)" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-slate-400">Giá bán</label><input type="number" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
            <div><label className="text-xs text-slate-400">Giá vốn</label><input type="number" value={f.cost_price || ''} onChange={(e) => setF({ ...f, cost_price: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
          </div>
          <div><label className="text-xs text-slate-400">Tồn kho</label><input type="number" value={f.stock || ''} onChange={(e) => setF({ ...f, stock: Number(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={() => f.name ? onSave(f) : toast.error('Nhập tên sản phẩm')} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">Lưu</button>
        </div>
      </div>
    </div>
  );
}