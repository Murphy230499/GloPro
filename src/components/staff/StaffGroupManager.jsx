'use client';
import { useT } from '@/lib/i18n';
import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';

const COLORS = ['#A78BFA', '#FF6B9D', '#34D399', '#60A5FA', '#FBBF24', '#F97316', '#FB7185', '#06B6D4', '#94A3B8'];

export default function StaffGroupManager({ branchId, onClose, onChanged }) {
  const { t } = useT();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try {
      let data = await base44.entities.StaffGroup.list();

      // One-time migration: if staff_group is empty, try to copy from old 'staffgroup' table
      if (data.length === 0) {
        try {
          const { supabase } = await import('@/api/supabaseClient');
          const { data: oldData } = await supabase.from('staffgroup').select('*');
          if (oldData && oldData.length > 0) {
            for (const g of oldData) {
              const { id, created_at, updated_at, ...payload } = g;
              try {
                await base44.entities.StaffGroup.create(payload);
              } catch (e) { /* skip duplicates */ }
            }
            data = await base44.entities.StaffGroup.list();
            if (data.length > 0) {
              toast.success(`Đã khôi phục ${data.length} nhóm nhân viên từ dữ liệu cũ`);
            }
          }
        } catch (e) {
          console.warn('Migration staffgroup→staff_group skipped:', e.message);
        }
      }

      setGroups(data);
    } catch (e) {
      const local = localStorage.getItem('glopro_staff_groups');
      setGroups(local ? JSON.parse(local) : []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name.trim()) return toast.error(t('staff.group_manager.err_name', 'Nhập tên nhóm'));
    const payload = { name, color };
    try {
      if (editingId && !editingId.toString().startsWith('local_')) {
        await base44.entities.StaffGroup.update(editingId, payload);
        toast.success(t('staff.group_manager.msg_update_success', 'Đã cập nhật nhóm nhân viên'));
      } else if (!editingId) {
        await base44.entities.StaffGroup.create(payload);
        toast.success(t('staff.group_manager.msg_add_success', 'Đã thêm nhóm nhân viên'));
      } else {
        throw new Error('Local item update');
      }
      setName('');
      setColor(COLORS[0]);
      setEditingId(null);
      load();
      onChanged?.();
    } catch (e) {
      const local = localStorage.getItem('glopro_staff_groups');
      let list = local ? JSON.parse(local) : [];
      if (editingId) {
        list = list.map(x => x.id === editingId ? { ...x, ...payload } : x);
        toast.success('Đã cập nhật nhóm nhân viên (offline)');
      } else {
        const newGroup = { id: 'local_' + Date.now(), ...payload };
        list.push(newGroup);
        toast.success('Đã thêm nhóm nhân viên (offline)');
      }
      localStorage.setItem('glopro_staff_groups', JSON.stringify(list));
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
    if (!window.confirm(t('staff.group_manager.confirm_del', 'Xoá nhóm này? Các nhân viên thuộc nhóm này sẽ không còn nhóm.'))) return;
    try {
      if (id && id.toString().startsWith('local_')) {
        throw new Error('Local group deletion');
      }
      await base44.entities.StaffGroup.delete(id);
      load();
      onChanged?.();
      toast.success(t('staff.group_manager.msg_del_success', 'Đã xoá nhóm nhân viên'));
    } catch (e) {
      console.error('Lỗi khi xóa nhóm:', e);
      if (id && id.toString().startsWith('local_')) {
        const local = localStorage.getItem('glopro_staff_groups');
        if (local) {
          const list = JSON.parse(local).filter(x => x.id !== id);
          localStorage.setItem('glopro_staff_groups', JSON.stringify(list));
        }
        load();
        onChanged?.();
        toast.success('Đã xoá nhóm nhân viên');
      } else {
        toast.error('Lỗi khi xóa nhóm trên server: ' + (e.message || e));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/45 backdrop-blur-xs" onClick={onClose}>
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-base font-bold text-slate-800 font-sans">{t('staff.group_manager.title', 'Quản lý nhóm nhân viên')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Create/Edit Form */}
        <div className="bg-slate-50 rounded-2xl p-3 mb-4 space-y-3 shrink-0">
          <div className="text-xs font-bold text-slate-400 uppercase">
            {editingId ? t('staff.group_manager.edit', 'Chỉnh sửa nhóm') : t('staff.group_manager.add_new', 'Thêm nhóm mới')}
          </div>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('staff.group_manager.name_placeholder', 'Tên nhóm nhân viên...')}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-400 bg-white"
            />
            <button
              onClick={save}
              className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors"
            >
              {editingId ? t('common.save', 'Lưu') : t('common.add', 'Thêm')}
            </button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-transform active:scale-95"
                style={{
                  background: c,
                  outline: color === c ? '2px solid white' : 'none',
                  boxShadow: color === c ? `0 0 0 2px ${c}` : 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Group List */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-60 pr-1">
          {loading ? (
            <div className="text-center py-4 text-xs text-slate-400">{t('common.loading', 'Đang tải...')}</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">{t('staff.group_manager.empty', 'Chưa có nhóm nhân viên nào')}</div>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: g.color }} />
                  <span className="text-sm font-medium text-slate-700">{g.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => edit(g)} className="p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(g.id)} className="p-1 text-red-400 hover:text-red-650 rounded-lg hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
