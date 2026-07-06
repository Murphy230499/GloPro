import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';

const COLORS = ['#FF6B9D', '#34D399', '#60A5FA', '#A78BFA', '#FBBF24', '#F97316', '#FB7185', '#06B6D4', '#94A3B8'];

export default function GroupManager({ type, branchId, onClose, onChanged }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const filter = { type };
    if (branchId !== 'all') filter.branch_id = branchId;
    try {
      const data = await base44.entities.ServiceGroup.filter(filter);
      setGroups(data);
    } catch (e) {
      setGroups([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name.trim()) return toast.error('Nhập tên nhóm');
    const payload = { name, color, type, branch_id: branchId === 'all' ? '' : branchId };
    try {
      if (editingId) {
        await base44.entities.ServiceGroup.update(editingId, payload);
        toast.success('Đã cập nhật nhóm');
      } else {
        await base44.entities.ServiceGroup.create(payload);
        toast.success('Đã thêm nhóm');
      }
      setName('');
      setColor(COLORS[0]);
      setEditingId(null);
      load();
      onChanged?.();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  const edit = (g) => {
    setEditingId(g.id);
    setName(g.name);
    setColor(g.color || COLORS[0]);
  };

  const remove = async (id) => {
    if (!window.confirm('Xoá nhóm này? Các mục thuộc nhóm này sẽ không còn nhóm.')) return;
    try {
      await base44.entities.ServiceGroup.delete(id);
      load();
      onChanged?.();
      toast.success('Đã xoá nhóm');
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Quản lý nhóm {type === 'service' ? 'dịch vụ' : 'sản phẩm'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-2 mb-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên nhóm" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" onKeyDown={(e) => e.key === 'Enter' && save()} />
          <div className="flex items-center gap-1.5 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} style={{ background: c }} />
            ))}
          </div>
          <button onClick={save} className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">
            {editingId ? 'Cập nhật nhóm' : 'Thêm nhóm'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setName(''); setColor(COLORS[0]); }} className="w-full py-2 text-xs text-slate-400">Huỷ chỉnh sửa</button>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Đang tải...</div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">Chưa có nhóm nào</div>
        ) : (
          <div className="space-y-1">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50">
                <span className="w-4 h-4 rounded-full shrink-0" style={{ background: g.color || '#94A3B8' }} />
                <span className="flex-1 text-sm font-medium truncate">{g.name}</span>
                <button onClick={() => edit(g)} className="text-slate-400 hover:text-slate-600"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => remove(g.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}