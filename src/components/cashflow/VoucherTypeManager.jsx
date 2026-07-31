'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Lock, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import { DEFAULT_INCOME_TYPES, DEFAULT_EXPENSE_TYPES } from '@/lib/cashFlowHelper';

const COLOR_PRESETS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#EC4899', '#94A3B8'];

export default function VoucherTypeManager({ branchId }) {
  const [flow, setFlow] = useState('income');
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#10B981');

  const loadTypes = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.CashVoucherType.list();
      setTypes(all || []);
    } catch (e) {
      toast.error('Lỗi tải danh mục: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTypes(); }, []);

  const filtered = types.filter(t => t.flow === flow);
  const incomeCount = types.filter(t => t.flow === 'income').length;
  const expenseCount = types.filter(t => t.flow === 'expense').length;

  const handleCreate = async () => {
    if (!newName.trim()) return toast.error('Vui lòng nhập tên loại phiếu');
    try {
      const code = `user_${flow}_${Date.now()}`;
      await base44.entities.CashVoucherType.create({
        name: newName.trim(),
        flow,
        code,
        is_system: false,
        color: newColor,
        branch_id: branchId || null,
      });
      toast.success('Đã thêm loại phiếu');
      setNewName('');
      setNewColor('#10B981');
      setCreating(false);
      loadTypes();
    } catch (e) {
      toast.error('Lỗi: ' + e.message);
    }
  };

  const handleStartEdit = (t) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditColor(t.color || '#94A3B8');
  };

  const handleSaveEdit = async (id) => {
    try {
      await base44.entities.CashVoucherType.update(id, { name: editName, color: editColor });
      toast.success('Đã cập nhật');
      setEditingId(null);
      loadTypes();
    } catch (e) {
      toast.error('Lỗi: ' + e.message);
    }
  };

  const handleDelete = async (t) => {
    if (t.is_system) return toast.error('Không thể xoá loại phiếu hệ thống');
    if (!confirm(`Xoá loại phiếu "${t.name}"?`)) return;
    try {
      await base44.entities.CashVoucherType.delete(t.id);
      toast.success('Đã xoá');
      loadTypes();
    } catch (e) {
      toast.error('Lỗi: ' + e.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Flow tabs */}
      <div className="flex gap-3">
        {[
          { value: 'income', label: 'Loại Thu', count: incomeCount, icon: TrendingUp, color: 'emerald' },
          { value: 'expense', label: 'Loại Chi', count: expenseCount, icon: TrendingDown, color: 'red' },
        ].map(tab => {
          const Icon = tab.icon;
          const active = flow === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFlow(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                active
                  ? tab.value === 'income'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100'
                    : 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20' : 'bg-slate-100'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Type list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Đang tải...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 group">
                {/* Color dot */}
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color || '#94A3B8' }} />

                {editingId === t.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-emerald-400"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      {COLOR_PRESETS.map(c => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${editColor === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <button onClick={() => handleSaveEdit(t.id)} className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-slate-800">{t.name}</span>
                    {t.is_system && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                        <Lock className="w-2.5 h-2.5" /> Hệ thống
                      </span>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(t)}
                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!t.is_system && (
                        <button
                          onClick={() => handleDelete(t)}
                          className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Add new */}
            {creating ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: newColor }} />
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Tên loại phiếu mới..."
                  className="flex-1 px-2 py-1 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-emerald-400"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <div className="flex gap-1">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${newColor === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <button onClick={handleCreate} className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setCreating(false)} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm loại phiếu {flow === 'income' ? 'thu' : 'chi'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
