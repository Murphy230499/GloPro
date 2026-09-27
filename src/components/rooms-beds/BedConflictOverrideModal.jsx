'use client';

import React from 'react';
import { 
  AlertTriangle, Clock, Calendar, User, Phone, 
  ArrowRight, ArrowRightLeft, ShieldAlert, Sparkles, Check, X, Building2 
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { formatVND } from '@/lib/format';

/**
 * BedConflictOverrideModal
 * Modal cảnh báo khi ca phục vụ khách vãng lai bị đè vào lịch hẹn đặt trước của khách khác.
 * Cung cấp giải pháp:
 * 1. Đổi sang giường trống khác đủ thời gian (Khuyến nghị)
 * 2. Ghi đè (Override) & Tự động dời lịch hẹn của khách đặt trước về "Chưa xếp giường"
 */
export default function BedConflictOverrideModal({
  open,
  onClose,
  targetBed,
  targetRoom,
  conflictData, // Trả về từ checkBedAssignmentConflict
  alternativeBeds = [], // Danh sách giường trống khác khả dụng
  onSwitchBed, // (newBed) => void
  onConfirmOverride // () => void
}) {
  const { t } = useT();

  if (!open || !conflictData) return null;

  const {
    startTimeStr,
    finishTimeStr,
    finishWithBufferStr,
    nextApptStartTime,
    overlapMinutes,
    conflictedAppointment,
    requiredMinutes,
    bufferMinutes
  } = conflictData;

  const apptCustomerName = conflictedAppointment?.customer_name || 'Khách đặt hẹn';
  const apptCustomerPhone = conflictedAppointment?.customer_phone || '';
  const apptServiceName = conflictedAppointment?.service_name || 'Dịch vụ đã đặt';

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-rose-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Alert Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 p-5 text-white flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-100 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Cảnh báo trùng lịch phục vụ</span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5 leading-snug">
              Xung đột lịch hẹn tại {targetBed?.name || 'Giường'}
            </h3>
            <p className="text-xs text-rose-100 mt-1">
              Thời gian ca mới sẽ đè vào lịch hẹn đã xếp trước <strong>{overlapMinutes} phút</strong> (tính cả 15p dọn dẹp vệ sinh).
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Timeline Comparison Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
            <div className="font-bold text-slate-700 flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Khoảng thời gian chồng lấn:</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold border border-rose-200">
                Bị đè {overlapMinutes} phút
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              {/* Ca khách vãng lai mới */}
              <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/60 space-y-1">
                <span className="font-bold text-blue-900 block">👤 Khách vãng lai (Ca mới)</span>
                <div className="text-slate-600">Giờ vào: <strong>{startTimeStr}</strong></div>
                <div className="text-slate-600">Làm xong: <strong>{finishTimeStr}</strong> ({requiredMinutes}p)</div>
                <div className="text-blue-700 font-semibold pt-0.5 border-t border-blue-200/60">
                  Dọn dẹp xong: <strong>{finishWithBufferStr}</strong>
                </div>
              </div>

              {/* Lịch hẹn đã đặt trước */}
              <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200/60 space-y-1">
                <span className="font-bold text-rose-900 block">📅 Lịch hẹn đặt trước</span>
                <div className="text-slate-600">Bắt đầu: <strong className="text-rose-600 text-xs">{nextApptStartTime}</strong></div>
                <div className="text-slate-600 truncate">Khách: <strong>{apptCustomerName}</strong></div>
                <div className="text-rose-700 font-semibold truncate pt-0.5 border-t border-rose-200/60">
                  DV: {apptServiceName}
                </div>
              </div>
            </div>
          </div>

          {/* Info Card of Conflicted Appointment */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>Chi tiết lịch hẹn bị ảnh hưởng:</span>
            </div>
            <div className="flex items-center justify-between text-slate-700 pt-0.5">
              <span className="font-semibold text-slate-900">{apptCustomerName}</span>
              {apptCustomerPhone && (
                <span className="text-slate-500 font-mono text-[11px]">{apptCustomerPhone}</span>
              )}
            </div>
            <div className="text-[11px] text-slate-600">
              Dịch vụ: <span className="font-medium text-slate-800">{apptServiceName}</span> • Khung giờ: <strong>{nextApptStartTime}</strong>
            </div>
          </div>

          {/* Alternative Beds Suggestion (Option 1 - Recommended) */}
          {alternativeBeds.length > 0 ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Giải pháp 1: Chuyển sang giường khác đang trống ({alternativeBeds.length} vị trí)</span>
                </span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {alternativeBeds.map(altBed => (
                  <button
                    key={altBed.id}
                    type="button"
                    onClick={() => onSwitchBed(altBed)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/60 text-xs transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">🛏️</span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 group-hover:text-emerald-900">
                          {altBed.name} <span className="text-[10px] text-slate-500 font-normal">({altBed.room_name})</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          {altBed.windowBadge || 'Trống hoàn toàn'}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 group-hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs shrink-0 flex items-center gap-1">
                      <span>Đổi giường này</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-500 text-center">
              Hiện tại không có giường trống nào khác đủ thời gian trong salon.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Hủy & Chọn lại
          </button>

          {/* Override Action */}
          <button
            type="button"
            onClick={onConfirmOverride}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Tiếp tục xếp & Tự dời lịch hẹn</span>
          </button>
        </div>
      </div>
    </div>
  );
}
