'use client';

import React from 'react';
import { 
  Building2, Clock, Phone, Calendar, User, 
  ArrowRightLeft, Play, CreditCard, LogOut, Sparkles, Check, AlertCircle 
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

/**
 * BedHoverCard
 * Popover nổi bật hiển thị chi tiết khi hover chuột vào thẻ giường.
 * Thiết kế chính xác 100% theo mockup:
 * - Header: Phòng | Giường + Badge trạng thái
 * - Khách hàng: Avatar, Tên, SĐT, Ngày sinh
 * - Dịch vụ: Tên dịch vụ, KTV, Giá tiền
 * - Timeline: Bắt đầu, Kết thúc, Tiến độ đã qua, Progress bar màu theo trạng thái
 * - Action buttons: [Chuyển phòng] [Bắt đầu phục vụ / Thanh toán] [Trả phòng]
 */
export default function BedHoverCard({
  bed,
  room,
  session,
  status = 'in_progress', // 'waiting' | 'reserved' | 'nearly_finished' | 'in_progress' | 'overtime' | 'cleaning'
  cleaningInfo = null,
  onTransferRoom,
  onStartServing,
  onCheckout,
  onReleaseBed,
  onFinishCleaning,
  onMouseEnter,
  onMouseLeave
}) {
  const { t } = useT();

  if (!bed || (!session && status !== 'reserved')) return null;

  // Determine Status Badge Config
  const getStatusBadge = () => {
    switch (status) {
      case 'waiting':
        return {
          label: 'CHỜ PHỤC VỤ',
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200',
          barColor: 'bg-blue-500'
        };
      case 'reserved':
        return {
          label: 'ĐẶT TRƯỚC',
          bg: 'bg-amber-50',
          text: 'text-amber-600',
          border: 'border-amber-200',
          barColor: 'bg-amber-400'
        };
      case 'nearly_finished':
        return {
          label: 'SẮP TRỐNG',
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-300',
          barColor: 'bg-amber-500'
        };
      case 'overtime':
        return {
          label: 'QUÁ GIỜ',
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          barColor: 'bg-purple-600'
        };
      case 'cleaning':
        return {
          label: 'ĐANG DỌN DẸP',
          bg: 'bg-teal-50',
          text: 'text-teal-700',
          border: 'border-teal-200',
          barColor: 'bg-teal-500'
        };
      case 'in_progress':
      default:
        return {
          label: 'ĐANG BẬN',
          bg: 'bg-rose-50',
          text: 'text-rose-600',
          border: 'border-rose-200',
          barColor: 'bg-rose-500'
        };
    }
  };

  const badge = getStatusBadge();

  // Customer info
  const customer = session?.customer || {};
  const customerName = session?.customer_name || customer.name || 'Khách hàng';
  const customerPhone = session?.customer_phone || customer.phone || '—';
  const customerDob = customer.dob || customer.birthday || '—';

  // Services list
  const servicesList = session?.services && session.services.length > 0
    ? session.services
    : [{
        service_name: session?.service_name || 'Dịch vụ tổng hợp',
        staff_name: session?.staff_name || 'KTV Salon',
        price: session?.price || 0
      }];

  // Time metrics
  const startTime = session?.start_time || '08:00';
  const endTime = session?.end_time || '09:15';
  const elapsedMinutes = session?.elapsed_minutes ?? 0;
  const progressPercent = Math.min(100, Math.max(0, session?.progress_percent ?? 0));
  const overtimeMinutes = session?.overtime_minutes ?? 0;

  return (
    <div 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="w-[340px] sm:w-[370px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 text-slate-800 font-sans z-50 text-left transition-all animate-in fade-in zoom-in-95 duration-150"
      style={{ filter: 'drop-shadow(0 20px 25px rgba(15, 23, 42, 0.15))' }}
    >
      {/* 1. Header: Room | Bed + Status Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{room?.name || 'Phòng'} | {bed.name}</span>
        </div>

        <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
          {badge.label}
        </span>
      </div>

      {/* If in Cleaning Status */}
      {status === 'cleaning' ? (
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-teal-100/70 text-teal-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Vệ sinh & Thay ga gối</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Thời gian dọn dẹp quy định: <span className="font-semibold text-teal-700">{session?.cleaning_duration_minutes || bed.cleaning_duration || 10} phút</span>
              </p>
            </div>
          </div>

          {/* Cleaning Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Đang dọn dẹp...</span>
              <span className="font-bold text-teal-700">
                {cleaningInfo ? `Còn ${cleaningInfo.remainingMinutes} phút` : 'Đang xử lý'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div 
                className="h-full bg-teal-500 transition-all duration-500 rounded-full"
                style={{ width: `${cleaningInfo?.progressPercent || 50}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Customer Info */}
          <div className="flex items-center gap-3 py-3 border-b border-slate-100">
            <Avatar 
              name={customerName}
              size="md"
              className="w-10 h-10 ring-2 ring-slate-100 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {customerName}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{customerPhone}</span>
                {customerDob !== '—' && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{customerDob}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 3. Services List */}
          <div className="py-2.5 space-y-2 border-b border-slate-100 max-h-[140px] overflow-y-auto custom-scrollbar">
            {servicesList.map((svc, idx) => (
              <div key={idx} className="flex items-start justify-between text-xs gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-800 truncate">
                    {svc.service_name || svc.name}
                    {svc.is_from_package && (
                      <span className="ml-1 text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-normal">
                        Gói
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {svc.staff_name || svc.staff?.name || 'Chưa gán KTV'}
                  </div>
                </div>
                <div className="font-bold text-slate-900 shrink-0">
                  {svc.is_from_package ? '0 ₫' : formatVND(svc.price || 0)}
                </div>
              </div>
            ))}
          </div>

          {/* 4. Timeline & Progress Bar */}
          <div className="py-2.5 space-y-1.5 border-b border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Bắt đầu: <strong className="text-slate-700">{startTime}</strong></span>
                <span className="text-slate-300">|</span>
                <span>Kết thúc: <strong className="text-slate-700">{endTime}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
              <span>Đã qua: <strong>{elapsedMinutes} phút</strong></span>
              <span>
                {status === 'overtime' ? (
                  <strong className="text-purple-600">100% (quá {overtimeMinutes} phút)</strong>
                ) : status === 'waiting' ? (
                  <strong className="text-blue-600">0% (Đang chờ)</strong>
                ) : (
                  <strong className="text-slate-700">{progressPercent}%</strong>
                )}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div 
                className={`h-full ${badge.barColor} transition-all duration-300 rounded-full`}
                style={{ width: `${status === 'waiting' ? 10 : progressPercent}%` }}
              />
            </div>
          </div>
        </>
      )}

      {/* 5. Action Buttons (Footer) */}
      <div className="pt-3 flex items-center justify-between gap-1.5">
        {/* Nút 1: Chuyển phòng */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTransferRoom?.(bed, session);
          }}
          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-blue-400 text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>{t('rooms_beds.transfer_room', 'Chuyển phòng')}</span>
        </button>

        {/* Nút 2: Action chính theo trạng thái */}
        {status === 'cleaning' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFinishCleaning?.(bed, session);
            }}
            className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t('rooms_beds.finish_clean_now', 'Xong dọn dẹp')}</span>
          </button>
        ) : (status === 'waiting' || status === 'reserved') ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartServing?.(bed, session);
            }}
            className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t('rooms_beds.start_serving', 'Bắt đầu phục vụ')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCheckout?.(bed, session);
            }}
            className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t('rooms_beds.checkout', 'Thanh toán')}</span>
          </button>
        )}

        {/* Nút 3: Trả phòng */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReleaseBed?.(bed, session);
          }}
          className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('rooms_beds.release_bed', 'Trả phòng')}</span>
        </button>
      </div>
    </div>
  );
}
