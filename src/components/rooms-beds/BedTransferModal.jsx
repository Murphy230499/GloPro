'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft, Building2, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { toast } from '@/components/Layout';

export default function BedTransferModal({
  open,
  onClose,
  sourceBed,
  sourceRoom,
  session,
  allRooms = [],
  allBeds = [],
  activeBedSessions = {},
  onConfirmTransfer
}) {
  const { t } = useT();
  const [selectedTargetBedId, setSelectedTargetBedId] = useState('');

  if (!open || !sourceBed) return null;

  // Filter beds that are available (not current bed, not busy in activeBedSessions)
  const availableBeds = allBeds.filter(b => {
    if (b.id === sourceBed.id) return false;
    const sess = activeBedSessions[b.id];
    return !sess || sess.status === 'cleaning'; // can't transfer to busy
  });

  // Group available beds by room
  const bedsByRoom = allRooms.map(r => ({
    room: r,
    beds: availableBeds.filter(b => b.room_id === r.id)
  })).filter(g => g.beds.length > 0);

  // Unassigned room group
  const unassignedBeds = availableBeds.filter(b => !b.room_id || !allRooms.some(r => r.id === b.room_id));
  if (unassignedBeds.length > 0) {
    bedsByRoom.push({
      room: { id: '__unassigned', name: 'Khu vực chung / Chưa phân phòng', color: '#64748B' },
      beds: unassignedBeds
    });
  }

  const handleConfirm = () => {
    if (!selectedTargetBedId) {
      return toast.error('Vui lòng chọn giường đích để chuyển sang');
    }
    const targetBed = allBeds.find(b => b.id === selectedTargetBedId);
    onConfirmTransfer(sourceBed, targetBed, session);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs font-sans text-slate-800 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div 
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 flex flex-col max-h-[85vh] text-left" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Chuyển phòng / giường</h3>
              <p className="text-xs text-slate-400 mt-0.5">Dời phiên phục vụ của khách sang vị trí mới</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Current Source Bed */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vị trí hiện tại</div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900">{sourceRoom?.name || 'Phòng'} | {sourceBed.name}</span>
                <p className="text-xs text-slate-500 mt-0.5">Khách hàng: <strong className="text-slate-800">{session?.customer_name || 'Khách'}</strong></p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                Đang phục vụ
              </span>
            </div>
          </div>

          {/* Select Target Bed */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Chọn giường trống muốn chuyển đến (*)
            </label>

            {bedsByRoom.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                Không có giường trống nào khác khả dụng để chuyển.
              </div>
            ) : (
              <div className="space-y-3 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                {bedsByRoom.map(group => (
                  <div key={group.room.id} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 px-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.room.color || '#3B82F6' }} />
                      <span>{group.room.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {group.beds.map(bed => {
                        const isSelected = selectedTargetBedId === bed.id;
                        return (
                          <button
                            key={bed.id}
                            type="button"
                            onClick={() => setSelectedTargetBedId(bed.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-800">{bed.name}</div>
                              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
                                <Sparkles className="w-3 h-3" />
                                <span>Đang trống</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Huỷ bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedTargetBedId}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Xác nhận chuyển
          </button>
        </div>
      </div>
    </div>
  );
}
