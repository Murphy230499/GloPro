'use client';
import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';

const COLORS = ['#FF6B9D', '#34D399', '#60A5FA', '#A78BFA', '#FBBF24', '#F97316', '#FB7185', '#06B6D4', '#94A3B8'];

export default function CustomerGroupManager({ branchId, onClose, onChanged }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const filter = {};
    if (branchId !== 'all') filter.branch_id = branchId;
    try {
      const data = await base44.entities.CustomerGroup.filter(filter);
      setGroups(data);
    } catch (e) {
      const local = localStorage.getItem('glopro_customer_groups');
      setGroups(local ? JSON.parse(local) : []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name.trim()) return toast.error('Nhập tên nhóm');
    const payload = { name, color, branch_id: branchId === 'all' ? '' : branchId };
    try {
      if (editingId && !editingId.toString().startsWith('local_')) {
        await base44.entities.CustomerGroup.update(editingId, payload);
        toast.success('Đã cập nhật nhóm khách hàng');
      } else if (!editingId) {
        await base44.entities.CustomerGroup.create(payload);
        toast.success('Đã thêm nhóm khách hàng');
      } else {
        throw new Error('Local item update');
      }
      setName('');
      setColor(COLORS[0]);
      setEditingId(null);
      load();
      onChanged?.();
    } catch (e) {
      const local = localStorage.getItem('glopro_customer_groups');
      let list = local ? JSON.parse(local) : [];
      if (editingId) {
        list = list.map(x => x.id === editingId ? { ...x, ...payload } : x);
        toast.success('Đã cập nhật nhóm khách hàng (offline)');
      } else {
        const newGroup = { id: 'local_' + Date.now(), ...payload };
        list.push(newGroup);
        toast.success('Đã thêm nhóm khách hàng (offline)');
      }
      localStorage.setItem('glopro_customer_groups', JSON.stringify(list));
      setName('');
      setColor(COLORS[0]);
      setEditingId(null);
      load();
      onChanged?.();
    }
  };

  const edit = (g) => {
    setEditingId(g.id);
    setName(g.name);
    setColor(g.color || COLORS[0]);
  };

  const remove = async (id) => {
    if (!window.confirm('Xoá nhóm này? Các khách hàng thuộc nhóm này sẽ không còn nhóm.')) return;
    try {
      if (id.toString().startsWith('local_')) {
        throw new Error('Local group deletion');
      }
      await base44.entities.CustomerGroup.delete(id);
      load();
      onChanged?.();
      toast.success('Đã xoá nhóm khách hàng');
    } catch (e) {
      const local = localStorage.getItem('glopro_customer_groups');
      if (local) {
        const list = JSON.parse(local).filter(x => x.id !== id);
        localStorage.setItem('glopro_customer_groups', JSON.stringify(list));
      }
      load();
      onChanged?.();
      toast.success('Đã xoá nhóm khách hàng');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/45 backdrop-blur-xs" onClick={onClose}>
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-base font-bold text-slate-800 font-sans">Quản lý nhóm khách hàng</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3 mb-4 shrink-0 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên nhóm mới..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white bg-white outline-none focus:border-primary" onKeyDown={(e) => e.key === 'Enter' && save()} />
          <div className="flex items-center gap-1.5 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' : ''}`} style={{ background: c }} />
            ))}
          </div>
          <button onClick={save} className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:opacity-95 transition-opacity">
            {editingId ? 'Cập nhật nhóm' : 'Thêm nhóm'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setName(''); setColor(COLORS[0]); }} className="w-full py-1 text-xs text-slate-400 font-bold hover:underline">Huỷ chỉnh sửa</button>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Đang tải...</div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">Chưa có nhóm nào</div>
        ) : (
          <div className="flex-grow overflow-y-auto space-y-2 pr-1">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ background: g.color || '#94A3B8' }} />
                <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{g.name}</span>
                <button onClick={() => edit(g)} className="text-slate-400 hover:text-slate-650 transition-colors" title="Chỉnh sửa"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => remove(g.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
