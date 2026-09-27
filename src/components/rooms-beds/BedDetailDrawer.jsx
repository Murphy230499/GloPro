import React from 'react';
import { X, Clock, User, Phone, Calendar, CheckCircle2, ShoppingCart, UserCheck, Scissors, Sparkles } from 'lucide-react';
import { useT } from '@/lib/i18n';
import Avatar from '@/components/Avatar';
import { formatVND } from '@/lib/format';
import { useRouter } from 'next/navigation';

export default function BedDetailDrawer({
  open,
  onClose,
  bed,
  room,
  activeSession,
  onCompleteSession,
  onOpenAssignModal
}) {
  const { t } = useT();
  const router = useRouter();

  if (!open || !bed) return null;

  const isOccupied = Boolean(activeSession);
  const status = activeSession?.status || 'available'; // 'available' | 'in_progress' | 'nearly_finished'

  const getStatusBadge = () => {
    if (status === 'nearly_finished') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-100 text-amber-800 border border-amber-200/60 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {t('rooms_beds.status_nearly_finished', 'SẮP TRỐNG')}
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-rose-100 text-rose-800 border border-rose-200/60 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {t('rooms_beds.status_occupied', 'ĐANG BẬN')}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200/60 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {t('rooms_beds.status_available', 'ĐANG TRỐNG')}
      </span>
    );
  };

  const handleGoToPOS = () => {
    if (!activeSession) return;
    // Dispatch event to POS or navigate to POS
    const customer = activeSession.customer;
    const services = activeSession.services || [];
    
    // Store in sessionStorage for POS to pick up
    try {
      sessionStorage.setItem('gp_pos_prefill_session', JSON.stringify({
        customer,
        services,
        facilityId: bed.id,
        facilityName: bed.name
      }));
    } catch (e) {
      console.warn(e);
    }
    
    router.push('/pos');
  };

  return (
    <div className="fixed inset-0 z-[110] overflow-hidden font-body animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Scissors className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  {bed.name}
                  {room?.name && <span className="text-xs font-normal text-slate-400">({room.name})</span>}
                </h3>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {isOccupied ? (
              <>
                {/* Customer Info Card (Mockup 3) */}
                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/70 shadow-2xs">
                  <Avatar
                    src={activeSession.customer?.avatar_url}
                    name={activeSession.customer?.name || activeSession.customer_name || 'Khách'}
                    size={46}
                    color="#3B82F6"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">
                      {activeSession.customer?.name || activeSession.customer_name || t('rooms_beds.walk_in_customer', 'Khách vãng lai')}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                      {(activeSession.customer?.phone || activeSession.customer_phone) && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {activeSession.customer?.phone || activeSession.customer_phone}
                        </span>
                      )}
                      {(activeSession.customer?.birthday || activeSession.customer?.dob) && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {activeSession.customer?.birthday || activeSession.customer?.dob}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Services in Progress */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    {t('rooms_beds.services_heading', 'Dịch vụ đang thực hiện')}
                  </h4>
                  <div className="space-y-2.5">
                    {(activeSession.services || []).map((srv, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-800">{srv.name || srv.service_name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {t('rooms_beds.staff', 'KTV')}: <span className="font-semibold text-slate-700">{srv.staff_name || t('rooms_beds.unassigned_staff', 'Chưa phân công')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-800">{formatVND(srv.price || 0)}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{srv.duration || 30} {t('common.minutes', 'phút')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline & Progress (Mockup 3) */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {t('rooms_beds.time_frame', 'Thời gian phục vụ')}:
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {activeSession.start_time} - {activeSession.end_time}
                    </span>
                  </div>

                  {/* Progress info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {t('rooms_beds.elapsed', 'Đã qua')}: <strong className="text-slate-700">{activeSession.elapsed_minutes || 0} {t('common.minutes', 'phút')}</strong>
                      </span>
                      <span className="font-bold text-slate-700">
                        {activeSession.progress_percent || 0}% ({activeSession.total_duration_minutes || 0} {t('common.minutes', 'phút')})
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          status === 'nearly_finished'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, activeSession.progress_percent || 0))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200/60">
                  <CheckCircle2 className="w-7 h-7 stroke-[2]" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">{t('rooms_beds.bed_ready_title', 'Giường đang trống')}</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {t('rooms_beds.bed_ready_desc', 'Vị trí này đang sẵn sàng đón khách. Bạn có thể bấm nút bên dưới để xếp khách vào phục vụ ngay.')}
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAssignModal(bed);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-200 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    {t('rooms_beds.assign_customer_now', 'Nhận khách vào giường')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Actions Footer */}
          {isOccupied && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (confirm(t('rooms_beds.confirm_complete_session', 'Bạn có chắc chắn muốn kết thúc phục vụ và giải phóng giường này?'))) {
                    onCompleteSession(activeSession);
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2]" />
                {t('rooms_beds.complete_and_free_bed', 'Hoàn thành / Trả giường')}
              </button>

              <button
                type="button"
                onClick={handleGoToPOS}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-200 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 stroke-[2]" />
                {t('rooms_beds.checkout_pos', 'Thanh toán tại Thu ngân (POS)')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
