import React, { useState, useMemo } from 'react';
import { X, Clock, User, Phone, CheckCircle2, ShoppingCart, Scissors, ArrowRightLeft, Sparkles, Building2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import Avatar from '@/components/Avatar';
import { formatVND } from '@/lib/format';
import { useRouter } from 'next/navigation';
import BedTransferModal from './BedTransferModal';
import { getAllServicesForCustomer } from '@/lib/bedSessionHelpers';

export default function BedDetailDrawer({
  open,
  onClose,
  bed,
  room,
  activeSession,
  allBedSessions = {},
  allBeds = [],
  allRooms = [],
  applicableServices = [],
  staff = [],
  onCompleteSession,
  onTransferBed,
  onOpenAssignModal
}) {
  const { t } = useT();
  const router = useRouter();
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  // Consolidated services for the customer across all beds & previous transfers
  const allConsolidatedServices = useMemo(() => {
    return getAllServicesForCustomer(allBedSessions, activeSession);
  }, [allBedSessions, activeSession]);

  // Services from other rooms / past transfers
  const otherServices = useMemo(() => {
    if (!activeSession) return [];
    return allConsolidatedServices.filter(s => s.bed_id !== bed?.id || s.is_past);
  }, [allConsolidatedServices, bed?.id, activeSession]);

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
    const customer = activeSession.customer;
    // Collect all services from all rooms & past services of this customer
    const services = allConsolidatedServices.length > 0 
      ? allConsolidatedServices 
      : (activeSession.services || []);
    
    try {
      sessionStorage.setItem('gp_pos_prefill_session', JSON.stringify({
        customer,
        services,
        masterSessionId: activeSession.master_session_id || null,
        facilityId: bed.id,
        facilityName: bed.name,
        roomName: room?.name || ''
      }));
    } catch (e) {
      console.warn('Error saving prefill session:', e);
    }
    
    router.push('/pos');
  };

  return (
    <>
      <div className="fixed inset-0 z-[110] overflow-hidden font-sans text-slate-800 animate-in fade-in duration-150">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Top Bar */}
            <div className="px-6 py-5 sm:py-5.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Scissors className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {bed.name}
                    {room?.name && <span className="text-xs font-normal text-slate-400">({room.name})</span>}
                  </h3>
                  <div className="mt-0.5">{getStatusBadge()}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer ml-1 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {isOccupied ? (
                <>
                  {/* Customer Info Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {t('rooms_beds.customer_info', 'Khách hàng')}
                      </span>
                      {activeSession.customer?.is_guest && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                          {t('rooms_beds.walk_in_tag', 'Vãng lai')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Avatar 
                        name={activeSession.customer?.name || activeSession.customer_name} 
                        src={activeSession.customer?.avatar_url} 
                        size={48} 
                        color="#3B82F6" 
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {activeSession.customer?.name || activeSession.customer_name || t('rooms_beds.walk_in_customer', 'Khách vãng lai')}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{activeSession.customer?.phone || activeSession.customer_phone || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Transferred Source Badge if available */}
                    {activeSession.transferred_from && (
                      <div className="pt-2 border-t border-slate-200/70 text-[11px] text-blue-600 flex items-center gap-1.5 font-medium">
                        <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                        <span>Chuyển từ <strong>{activeSession.transferred_from.bed_name}</strong> lúc {activeSession.transferred_from.at}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress & Time Stats */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{t('rooms_beds.serving_time', 'Thời gian phục vụ')}</span>
                      </div>
                      <span className="font-bold text-slate-800">{activeSession.total_duration_minutes || 60} {t('common.minutes', 'phút')}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 rounded-full ${
                            status === 'nearly_finished' ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${activeSession.progressPercent || 0}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{t('rooms_beds.elapsed_time', 'Đã qua')}: {activeSession.elapsedMinutes || 0}p</span>
                        <span>{activeSession.progressPercent || 0}%</span>
                      </div>
                    </div>

                    {/* Start & End Times */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div>
                        <span className="text-slate-400">{t('rooms_beds.start_time', 'Giờ vào')}:</span>
                        <div className="text-base font-bold text-slate-800 mt-0.5">{activeSession.start_time}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">{t('rooms_beds.end_time', 'Dự kiến xong')}:</span>
                        <div className="text-base font-bold text-blue-600 mt-0.5">{activeSession.end_time}</div>
                      </div>
                    </div>

                    {activeSession.remainingFormatted && (
                      <div className="text-center pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                        {t('rooms_beds.remaining_time', 'Còn lại')}: <span className="font-bold text-slate-900">{activeSession.remainingFormatted}</span>
                      </div>
                    )}
                  </div>

                  {/* Services List at Current Bed */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{t('rooms_beds.services_being_served', 'Dịch vụ tại vị trí này')}</span>
                      <span className="text-blue-600 font-semibold">{activeSession.services?.length || 0} dịch vụ</span>
                    </div>

                    <div className="space-y-2">
                      {(activeSession.services || []).map((srv, idx) => (
                        <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-800 truncate">{srv.name || srv.service_name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>{srv.duration || srv.duration_minutes || 30} {t('common.minutes', 'phút')}</span>
                              {srv.staff_name && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-blue-600 font-medium">{t('rooms_beds.staff_tag', 'KTV')}: {srv.staff_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="font-bold text-xs text-slate-800 shrink-0">
                            {formatVND(srv.price || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Services from other beds / rooms of this customer (Multi-room consolidation) */}
                  {otherServices.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t('rooms_beds.other_services_in_journey', 'Dịch vụ tại phòng/giường khác (Cùng lượt)')}</span>
                      </div>

                      <div className="space-y-2">
                        {otherServices.map((srv, idx) => (
                          <div key={idx} className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200/60 text-xs flex items-center justify-between gap-2.5">
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-800 truncate">{srv.name || srv.service_name}</div>
                              <div className="text-[11px] text-emerald-700 mt-0.5 flex items-center gap-1.5 truncate">
                                <span>{srv.bed_name} {srv.room_name ? `(${srv.room_name})` : ''}</span>
                                {srv.staff_name && <span>• KTV: {srv.staff_name}</span>}
                              </div>
                            </div>
                            <div className="font-bold text-xs text-emerald-800 shrink-0">
                              {formatVND(srv.price || 0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Bed is empty */
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-100">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{t('rooms_beds.bed_ready_title', 'Vị trí đang trống')}</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      {t('rooms_beds.bed_ready_desc', 'Chưa có khách nào sử dụng vị trí này. Bạn có thể bấm nút bên dưới để nhận khách vào phục vụ ngay.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAssignModal?.(bed, room);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>{t('rooms_beds.assign_now_btn', 'Nhận khách vào giường')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2 shrink-0">
              {isOccupied ? (
                <>
                  {/* Bed Transfer Button */}
                  <button
                    type="button"
                    onClick={() => setTransferModalOpen(true)}
                    className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    title={t('rooms_beds.transfer_bed_title', 'Chuyển giường / phòng')}
                  >
                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                    <span>{t('rooms_beds.transfer_bed_btn', 'Chuyển giường')}</span>
                  </button>

                  {/* Checkout POS Button (Consolidated) */}
                  <button
                    type="button"
                    onClick={handleGoToPOS}
                    className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="truncate">
                      {allConsolidatedServices.length > (activeSession.services?.length || 0)
                        ? `${t('rooms_beds.checkout_pos_btn', 'Thanh toán POS')} (${allConsolidatedServices.length} món)`
                        : t('rooms_beds.checkout_pos_btn', 'Thanh toán POS')}
                    </span>
                  </button>

                  {/* Finish / Release Button */}
                  <button
                    type="button"
                    onClick={() => {
                      onCompleteSession(bed.id);
                      onClose();
                    }}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('rooms_beds.finish_bed_btn', 'Trả giường')}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {t('common.close', 'Đóng')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bed Transfer Modal */}
      {transferModalOpen && (
        <BedTransferModal
          open={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          currentBed={bed}
          currentRoom={room}
          activeSession={activeSession}
          allBeds={allBeds}
          allRooms={allRooms}
          bedSessions={allBedSessions}
          applicableServices={applicableServices}
          staff={staff}
          onConfirmTransfer={(transferData) => {
            onTransferBed?.(transferData);
            setTransferModalOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
