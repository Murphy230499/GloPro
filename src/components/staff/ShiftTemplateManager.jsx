'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';

const COLORS = [
  '#B088F9', '#7F8CF0', '#EC4899', '#14B8A6', '#D97706',
  '#D1A773', '#6366F1', '#374151', '#10B981', '#8B5A2B'
];

export default function ShiftTemplateManager({ onChanged }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [branchIdField, setBranchIdField] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [lateGrace, setLateGrace] = useState(0);
  const [earlyGrace, setEarlyGrace] = useState(0);
  const [overtimeAfter, setOvertimeAfter] = useState(0);
  const [color, setColor] = useState('#B088F9');
  const [note, setNote] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try {
      const data = await base44.entities.ShiftTemplate.list();
      setTemplates(data || []);
    } catch (e) {
      const local = localStorage.getItem('glopro_shift_templates');
      setTemplates(local ? JSON.parse(local) : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const loadBranches = async () => {
      try {
        const list = await base44.entities.Branch.list();
        setBranches(list || []);
      } catch (e) {
        console.error('Lỗi tải chi nhánh:', e);
      }
    };
    loadBranches();
  }, []);

  const save = async () => {
    if (!name.trim()) return toast.error('Nhập tên ca làm việc');
    if (!branchIdField) return toast.error('Chọn chi nhánh áp dụng');
    if (!startTime || !endTime) return toast.error('Nhập giờ check in và check out');

    const payload = {
      name,
      start_time: startTime,
      end_time: endTime,
      branch_id: branchIdField,
      color,
      note,
      is_active: isActive,
      late_grace_minutes: Number(lateGrace) || 0,
      early_grace_minutes: Number(earlyGrace) || 0,
      overtime_after_minutes: Number(overtimeAfter) || 0
    };

    try {
      if (editingId && !editingId.toString().startsWith('local_')) {
        await base44.entities.ShiftTemplate.update(editingId, payload);
        toast.success('Đã cập nhật ca làm việc');
      } else if (!editingId) {
        await base44.entities.ShiftTemplate.create(payload);
        toast.success('Đã thêm ca làm việc mới');
      } else {
        throw new Error('Local item update');
      }
      resetForm();
      setShowModal(false);
      load();
      onChanged?.();
    } catch (e) {
      const local = localStorage.getItem('glopro_shift_templates');
      let list = local ? JSON.parse(local) : [];
      if (editingId) {
        list = list.map(x => x.id === editingId ? { ...x, ...payload } : x);
        toast.success('Đã cập nhật ca làm việc (offline)');
      } else {
        const newT = { id: 'local_' + Date.now(), ...payload };
        list.push(newT);
        toast.success('Đã thêm ca làm việc mới (offline)');
      }
      localStorage.setItem('glopro_shift_templates', JSON.stringify(list));
      resetForm();
      setShowModal(false);
      load();
      onChanged?.();
    }
  };

  const resetForm = () => {
    setName('');
    if (branches.length > 0) {
      setBranchIdField(branches[0].id);
    } else {
      setBranchIdField('');
    }
    setStartTime('08:00');
    setEndTime('17:00');
    setLateGrace(0);
    setEarlyGrace(0);
    setOvertimeAfter(0);
    setColor('#B088F9');
    setNote('');
    setIsActive(true);
    setEditingId(null);
  };

  const edit = (t) => {
    setEditingId(t.id);
    setName(t.name);
    setBranchIdField(t.branch_id || '');
    setStartTime(t.start_time || '08:00');
    setEndTime(t.end_time || '17:00');
    setLateGrace(t.late_grace_minutes || 0);
    setEarlyGrace(t.early_grace_minutes || 0);
    setOvertimeAfter(t.overtime_after_minutes || 0);
    setColor(t.color || '#B088F9');
    setNote(t.note || '');
    setIsActive(t.is_active !== false);
    setShowModal(true);
  };

  const remove = async (id) => {
    if (!window.confirm('Xoá ca làm việc này? Lịch xếp ca hiện tại có thể bị ảnh hưởng.')) return;
    try {
      if (id.toString().startsWith('local_')) {
        throw new Error('Local template deletion');
      }
      await base44.entities.ShiftTemplate.delete(id);
      load();
      onChanged?.();
      toast.success('Đã xoá ca làm việc');
    } catch (e) {
      const local = localStorage.getItem('glopro_shift_templates');
      if (local) {
        const list = JSON.parse(local).filter(x => x.id !== id);
        localStorage.setItem('glopro_shift_templates', JSON.stringify(list));
      }
      load();
      onChanged?.();
      toast.success('Đã xoá ca làm việc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Danh sách ca làm việc ({templates.length})</h3>
          <p className="text-slate-400 text-xs mt-0.5 font-medium">Quản lý định nghĩa ca trực và thời gian check in/out của nhân sự</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans"
        >
          <Plus className="w-4 h-4" /> Thêm ca làm việc
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Đang tải danh sách ca...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-xs text-slate-400 bg-white border border-slate-150 rounded-2xl font-medium">
          Chưa có ca làm việc nào. Chọn "Thêm ca làm việc" để bắt đầu.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const branch = branches.find(b => b.id === t.branch_id);
            return (
              <div 
                key={t.id} 
                className="border-l-4 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative"
                style={{
                  backgroundColor: (t.color || '#B088F9') + '0F',
                  borderColor: (t.color || '#B088F9') + '25',
                  borderLeftColor: t.color || '#B088F9'
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-800">{t.name}</h4>
                    <span 
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: t.is_active !== false ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                        color: t.is_active !== false ? '#10B981' : '#64748B'
                      }}
                    >
                      {t.is_active !== false ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-semibold">
                    Thời gian: <span className="font-bold" style={{ color: t.color || '#B088F9' }}>{t.start_time} - {t.end_time}</span>
                  </div>

                  {branch && (
                    <div className="text-[10px] text-slate-400 font-medium">
                      🏢 Chi nhánh: <span className="text-slate-600 font-semibold">{branch.name}</span>
                    </div>
                  )}

                  {t.note && (
                    <p className="text-[11px] text-slate-400 italic mt-1 line-clamp-2">"{t.note}"</p>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => edit(t)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Popup Form (Style aligned with ServiceForm / StaffForm) */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center" 
          onClick={() => setShowModal(false)}
        >
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
          <div 
            className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 shrink-0">
              <h2 className="text-base font-bold text-slate-800 font-sans">
                {editingId ? 'Sửa ca làm việc' : 'Thêm mới ca làm việc'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="space-y-4 pb-4">
              {/* Tên ca */}
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Tên ca *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Nhập tên ca làm việc" 
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
                />
              </div>

              {/* Chi nhánh áp dụng */}
              {branches.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Chi nhánh áp dụng *</label>
                  <div className="relative">
                    <select 
                      value={branchIdField} 
                      onChange={(e) => setBranchIdField(e.target.value)} 
                      className="w-full px-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white appearance-none"
                    >
                      <option value="">— Chọn chi nhánh —</option>
                      {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Giờ check in / out */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Giờ check in</label>
                  <input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Giờ check out</label>
                  <input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
                  />
                </div>
              </div>

              {/* Grace periods */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Được phép đi muộn</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      value={lateGrace} 
                      onChange={(e) => setLateGrace(Number(e.target.value) || 0)} 
                      className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Phút</span>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Được phép về sớm</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      value={earlyGrace} 
                      onChange={(e) => setEarlyGrace(Number(e.target.value) || 0)} 
                      className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Phút</span>
                  </div>
                </div>
              </div>

              {/* Overtime */}
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Tính giờ làm thêm sau giờ check out.</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0"
                    value={overtimeAfter} 
                    onChange={(e) => setOvertimeAfter(Number(e.target.value) || 0)} 
                    className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Phút</span>
                </div>
              </div>

              {/* Color Settings */}
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Cài đặt màu ca làm</label>
                <div className="flex items-center gap-1.5 h-[38px] overflow-x-auto">
                  {COLORS.map((c) => (
                    <button 
                      key={c} 
                      type="button"
                      onClick={() => setColor(c)} 
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-95 shrink-0" 
                      style={{ 
                        background: c,
                        boxShadow: color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none'
                      }}
                    >
                      {color === c && <span className="text-white text-[10px]">✓</span>}
                    </button>
                  ))}
                  <div className="w-px h-6 bg-slate-200 self-center mx-1 shrink-0" />
                  
                  {/* Custom color input container */}
                  <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-white gap-1.5 w-28 shrink-0 h-8 relative cursor-pointer">
                    <input 
                      type="color" 
                      value={color.startsWith('#') && color.length === 7 ? color : '#B088F9'} 
                      onChange={(e) => setColor(e.target.value)} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                    <div className="w-8 h-6 rounded-lg shrink-0 pointer-events-none" style={{ background: color }} />
                    <span className="text-[10px] text-slate-400 font-bold pointer-events-none">#</span>
                    <input 
                      type="text" 
                      value={color.startsWith('#') ? color.slice(1) : color} 
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setColor(val.startsWith('#') ? val : '#' + val);
                      }} 
                      placeholder="E3A93E" 
                      className="w-full text-[10px] font-bold uppercase outline-none text-slate-700 bg-transparent relative z-10" 
                    />
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Ghi chú</label>
                <textarea 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="Nhập ghi chú ca làm việc" 
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" 
                />
              </div>

              {/* Active Checkbox */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                  className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary" 
                />
                <span>Đang hoạt động</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
              <button 
                onClick={() => setShowModal(false)} 
                className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-650 font-sans"
              >
                Huỷ bỏ
              </button>
              <button 
                onClick={save} 
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans"
              >
                {editingId ? 'Lưu' : 'Tạo'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
