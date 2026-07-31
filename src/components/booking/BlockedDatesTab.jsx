'use client';
import React, { useState } from 'react';
import { X, Plus, Save, Loader2 } from 'lucide-react';
import { toast } from '@/components/Layout';

const VN_HOLIDAYS_2025 = [
  { date: '2025-01-01', label: 'Tết Dương Lịch' },
  { date: '2025-01-28', label: 'Tết Nguyên Đán (28)' },
  { date: '2025-01-29', label: 'Tết Nguyên Đán (29)' },
  { date: '2025-01-30', label: 'Tết Nguyên Đán (30)' },
  { date: '2025-01-31', label: 'Tết Nguyên Đán (Mồng 1)' },
  { date: '2025-02-01', label: 'Tết Nguyên Đán (Mồng 2)' },
  { date: '2025-02-02', label: 'Tết Nguyên Đán (Mồng 3)' },
  { date: '2025-04-07', label: 'Giỗ Tổ Hùng Vương' },
  { date: '2025-04-30', label: 'Ngày Thống Nhất' },
  { date: '2025-05-01', label: 'Quốc Tế Lao Động' },
  { date: '2025-09-02', label: 'Quốc Khánh' },
  { date: '2025-12-25', label: 'Giáng Sinh' },
];

export default function BlockedDatesTab({ setting, onChange, onSave, saving }) {
  const blocked = setting?.blocked_dates || [];
  const [addDate, setAddDate] = useState('');
  const [addLabel, setAddLabel] = useState('');

  const addManual = () => {
    if (!addDate) return toast.error('Vui lòng chọn ngày');
    if (blocked.some(b => b.date === addDate)) return toast.error('Ngày này đã được thêm');
    onChange({
      ...setting,
      blocked_dates: [...blocked, { date: addDate, label: addLabel || 'Ngày nghỉ' }]
    });
    setAddDate('');
    setAddLabel('');
  };

  const addPreset = (preset) => {
    if (blocked.some(b => b.date === preset.date)) return;
    onChange({ ...setting, blocked_dates: [...blocked, preset] });
  };

  const remove = (date) => {
    onChange({ ...setting, blocked_dates: blocked.filter(b => b.date !== date) });
  };

  const clearAll = () => {
    if (!confirm('Xoá tất cả ngày chặn?')) return;
    onChange({ ...setting, blocked_dates: [] });
  };

  const sortedBlocked = [...blocked].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-5">
      {/* Quick presets */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-1">🇻🇳 Ngày lễ Việt Nam 2025</h3>
        <p className="text-xs text-slate-400 mb-4">Click để thêm nhanh vào danh sách ngày chặn</p>
        <div className="flex flex-wrap gap-2">
          {VN_HOLIDAYS_2025.map(h => {
            const already = blocked.some(b => b.date === h.date);
            return (
              <button
                key={h.date}
                onClick={() => addPreset(h)}
                disabled={already}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  already
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-pink-400 hover:text-pink-600'
                }`}
              >
                {already ? '✓ ' : '+ '}{h.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual add */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">➕ Thêm ngày chặn thủ công</h3>
        <div className="flex gap-3">
          <input
            type="date"
            value={addDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setAddDate(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-400"
          />
          <input
            value={addLabel}
            onChange={e => setAddLabel(e.target.value)}
            placeholder="Nhãn (VD: Họp công ty...)"
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-400"
            onKeyDown={e => e.key === 'Enter' && addManual()}
          />
          <button
            onClick={addManual}
            className="px-4 py-2.5 rounded-xl bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>
      </div>

      {/* Blocked list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">
            📅 Danh sách ngày chặn ({blocked.length})
          </h3>
          {blocked.length > 0 && (
            <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 font-medium">
              Xoá tất cả
            </button>
          )}
        </div>

        {sortedBlocked.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Chưa có ngày chặn nào. Hệ thống cho phép đặt tất cả các ngày.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {sortedBlocked.map(b => (
              <div key={b.date} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-red-500 text-xs font-bold">
                    {new Date(b.date + 'T00:00:00').getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(b.date + 'T00:00:00').toLocaleDateString('vi-VN', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-slate-400">{b.label}</p>
                </div>
                <button
                  onClick={() => remove(b.date)}
                  className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-200 hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Đang lưu...' : 'Lưu ngày chặn'}
      </button>
    </div>
  );
}
