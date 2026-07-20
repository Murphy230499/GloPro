'use client';
import React, { useEffect, useState } from 'react';
import { Plus, X, MapPin, Phone, User, Edit3, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { toast } from '@/components/Layout';

export default function SettingsPage() {
  const { branches, loading } = useBranch();
  const [editing, setEditing] = useState(null);

  const save = async (data) => {
    try {
      if (editing.id) {
        await base44.entities.Branch.update(editing.id, data);
        toast.success('Đã cập nhật cơ sở');
      } else {
        await base44.entities.Branch.create(data);
        toast.success('Đã thêm cơ sở');
      }
      setEditing(null);
      setTimeout(() => window.location.reload(), 600);
    } catch (e) { toast.error('Lỗi: ' + (e.message || e)); }
  };

  const remove = async (b) => {
    if (!confirm(`Xóa cơ sở "${b.name}"?`)) return;
    await base44.entities.Branch.delete(b.id);
    toast.success('Đã xóa');
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cài đặt</h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý các cơ sở trong chuỗi</p>
        </div>
        <button onClick={() => setEditing({})} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">
          <Plus className="w-4 h-4" /> Thêm cơ sở
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {branches.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(b)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Edit3 className="w-3.5 h-3.5 text-slate-500" /></button>
                  <button onClick={() => remove(b)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                </div>
              </div>
              <div className="font-bold text-lg mt-3">{b.name}</div>
              {b.address && <div className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" />{b.address}</div>}
              {b.phone && <div className="text-sm text-slate-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{b.phone}</div>}
              {b.manager_name && <div className="text-sm text-slate-500 flex items-center gap-1"><User className="w-3.5 h-3.5" />QL: {b.manager_name}</div>}
            </div>
          ))}
        </div>
      )}

      {editing && <BranchForm branch={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function BranchForm({ branch, onClose, onSave }) {
  const [f, setF] = useState({
    name: branch.name || '', address: branch.address || '', phone: branch.phone || '',
    city: branch.city || '', manager_name: branch.manager_name || '',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{branch.id ? 'Sửa cơ sở' : 'Thêm cơ sở'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Tên cơ sở" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Địa chỉ" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Điện thoại" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            <input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Thành phố" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <input value={f.manager_name} onChange={(e) => setF({ ...f, manager_name: e.target.value })} placeholder="Quản lý cơ sở" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={() => f.name ? onSave(f) : toast.error('Nhập tên cơ sở')} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">Lưu</button>
        </div>
      </div>
    </div>
  );
}