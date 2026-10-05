import React, { useState, useMemo } from 'react';
import { X, Clock, User, Phone, CheckCircle2, ShoppingCart, Scissors, ArrowRightLeft, Sparkles, Building2, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import Avatar from '@/components/Avatar';
import { formatVND } from '@/lib/format';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/Layout';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import BedTransferModal from './BedTransferModal';
import { getAllServicesForCustomer, findCustomerActiveSessions } from '@/lib/bedSessionHelpers';

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
  onReleaseCustomerSessions,
  onTransferBed,
  onOpenAssignModal,
  onDirectCheckout
}) {
  const { t } = useT();
  const router = useRouter();
  const { currentBranchId, branches } = useBranch();
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

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

  const handleGoToPOS = async () => {
    if (!activeSession || isProcessingCheckout) return;

    if (onDirectCheckout) {
      onDirectCheckout(bed, activeSession);
      onClose();
      return;
    }
    setIsProcessingCheckout(true);

    try {
      const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      const customer = activeSession.customer || {};
      const cleanName = String(customer.name || activeSession.customer_name || 'Khách vãng lai').trim();
      const cleanPhone = String(customer.phone || activeSession.customer_phone || '').trim();
      const customerDisplayName = cleanPhone && !cleanName.includes(cleanPhone)
        ? `${cleanName} (${cleanPhone})`
        : cleanName;
      const validCustomerId = (customer.id && isUuid(customer.id)) ? customer.id : null;

      // 1. Tìm tất cả các phòng / giường đang phục vụ cho khách này trên toàn hệ thống
      let relatedSessions = [];
      try {
        relatedSessions = findCustomerActiveSessions(
          allBedSessions,
          customer,
          activeSession.master_session_id,
          bed.id
        );
      } catch (findErr) {
        console.warn('Lỗi tìm sessions liên quan:', findErr);
      }
      const relatedBedIds = [...new Set([bed.id, ...relatedSessions.map(s => s?.bed_id).filter(Boolean)])];

      // 2. Gom tất cả dịch vụ từ tất cả các giường / phòng của khách thành 1 danh sách
      const rawServices = (allConsolidatedServices && allConsolidatedServices.length > 0)
        ? allConsolidatedServices 
        : (activeSession.services || []);

      // Chuẩn hóa item cho hoá đơn POS
      const posItems = (rawServices || []).filter(Boolean).map(s => {
        const bedName = s.bed_name || bed.name || '';
        const roomName = s.room_name || room?.name || '';
        const displayLocation = roomName && bedName && !bedName.includes(roomName)
          ? `${bedName} (${roomName})`
          : (bedName || roomName || '');

        return {
          id: Math.random().toString(),
          name: s.name || s.service_name || 'Dịch vụ',
          type: 'service',
          price: Math.round(Number(s.price) || 0),
          originalPrice: Math.round(Number(s.price) || 0),
          qty: 1,
          staff_id: s.staff_id || '',
          staff_name: s.staff_name || '',
          facility_id: s.bed_id || bed.id || '',
          facility_name: displayLocation,
          duration_minutes: Number(s.duration || s.duration_minutes) || 30
        };
      });

      const subtotal = posItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      const saleCode = 'HD' + String(Math.floor(100000 + Math.random() * 900000));
      const today = new Date().toISOString().split('T')[0];

      // Xác định branch_id hợp lệ (Supabase Postgres NOT NULL constraint)
      let effectiveBranch = (currentBranchId && currentBranchId !== 'all' && isUuid(currentBranchId))
        ? currentBranchId
        : (bed.branch_id && isUuid(bed.branch_id) ? bed.branch_id : null);

      if (!effectiveBranch && typeof window !== 'undefined') {
        const stored = localStorage.getItem('glowpro_branch');
        if (stored && stored !== 'all' && isUuid(stored)) {
          effectiveBranch = stored;
        }
      }

      if (!effectiveBranch && Array.isArray(branches) && branches.length > 0) {
        const firstReal = branches.find(b => b?.id && b.id !== '00000000-0000-0000-0000-000000000000' && isUuid(b.id));
        if (firstReal) effectiveBranch = firstReal.id;
      }

      if (!effectiveBranch) {
        effectiveBranch = '6a473852-3dde-addc-bb57-8d6b00000000';
      }

      // 3. Tạo ngay hóa đơn tại Thu ngân (POS) trong cơ sở dữ liệu
      let createdInvoice = null;
      try {
        if (base44?.entities?.Invoice?.create) {
          createdInvoice = await base44.entities.Invoice.create({
            invoice_code: saleCode,
            customer_name: customerDisplayName,
            customer_id: validCustomerId,
            branch_id: effectiveBranch,
            items: posItems,
            subtotal,
            discount: 0,
            total: subtotal,
            tip: 0,
            status: 'unpaid',
            date: today,
            created_at: new Date().toISOString()
          });
        }
      } catch (invErr) {
        console.warn('Lỗi khi tạo hóa đơn trực tiếp trong Base44:', invErr);
      }

      // 4. Giải phóng TẤT CẢ các giường / phòng của khách này ngay lập tức (không cần check out từng phòng)
      try {
        if (onReleaseCustomerSessions) {
          await onReleaseCustomerSessions({
            masterSessionId: activeSession.master_session_id,
            customerId: validCustomerId,
            customerPhone: cleanPhone,
            customerName: cleanName,
            bedIds: relatedBedIds
          });
        } else {
          onCompleteSession?.(bed.id);
        }
      } catch (releaseErr) {
        console.warn('Lỗi giải phóng phiên giường:', releaseErr);
        try {
          onCompleteSession?.(bed.id);
        } catch (e) {}
      }

      // 5. Bắn Event đồng bộ cho toàn hệ thống
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gp_bed_session_checkout_completed', {
            detail: {
              masterSessionId: activeSession.master_session_id,
              customerId: validCustomerId,
              customerPhone: cleanPhone,
              customerName: cleanName,
              releasedBedIds: relatedBedIds
            }
          }));
        }
      } catch (evtErr) {
        console.warn('Event dispatch error:', evtErr);
      }

      // 6. Lưu trữ prefill session dự phòng cho POS
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('gp_pos_prefill_session', JSON.stringify({
            createdInvoiceId: createdInvoice?.id || null,
            customer: {
              id: validCustomerId,
              name: cleanName,
              phone: cleanPhone,
              avatar_url: customer.avatar_url || ''
            },
            services: posItems,
            masterSessionId: activeSession.master_session_id || null,
            facilityId: bed.id,
            facilityName: bed.name,
            roomName: room?.name || '',
            branchId: effectiveBranch
          }));
        }
      } catch (e) {
        console.warn('Error saving prefill session:', e);
      }

      const roomCountNotice = relatedBedIds.length > 1 ? ` trên ${relatedBedIds.length} phòng/vị trí` : '';
      toast.success(`Đã gom hoá đơn${roomCountNotice} & chuyển ra thu ngân`);

      try {
        onClose?.();
      } catch (e) {}

      // 7. Chuyển ngay ra thu ngân và mở hoá đơn vừa tạo
      const targetUrl = createdInvoice?.id ? `/pos?edit_invoice_id=${createdInvoice.id}` : '/pos';
      if (router && typeof router.push === 'function') {
        router.push(targetUrl);
      } else if (typeof window !== 'undefined') {
        window.location.href = targetUrl;
      }
    } catch (err) {
      console.error('Lỗi khi checkout ra thu ngân:', err);
      toast.error('Lỗi khi xử lý checkout: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsProcessingCheckout(false);
    }
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
                              {srv.staff_name && (() => {
                                const sName = srv.staff_name;
                                const matched = (staff || []).find(st => (srv.staff_id && st.id === srv.staff_id) || (st.full_name === sName || st.name === sName));
                                const avatar = srv.staff_avatar || matched?.avatar_url || null;
                                const color = srv.staff_color || matched?.avatar_color || '#3B82F6';
                                return (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <div className="inline-flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-200/80">
                                      <Avatar src={avatar} name={sName} size={16} color={color} />
                                      <span className="text-slate-700 font-medium">{sName}</span>
                                    </div>
                                  </>
                                );
                              })()}
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

                      {/* Multi-room Notice */}
                      <div className="p-3 rounded-2xl bg-blue-50/90 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5 shadow-2xs">
                        <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-blue-900 text-xs">Checkout 1 chạm liên phòng</p>
                          <p className="text-[11px] text-blue-700 leading-relaxed">
                            Khách có dịch vụ tại các phòng khác nhau. Khi bấm <strong>Thanh toán POS</strong>, hệ thống sẽ tự động giải phóng tất cả giường phòng của khách và gom toàn bộ dịch vụ vào 1 bill duy nhất tại thu ngân.
                          </p>
                        </div>
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
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-2 shrink-0">
              {isOccupied ? (
                <>
                  {/* Primary Row: Checkout POS & Finish / Release Bed */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Checkout POS Button */}
                    <button
                      type="button"
                      disabled={isProcessingCheckout}
                      onClick={handleGoToPOS}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
                    >
                      {isProcessingCheckout ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                          <span className="truncate">Đang tạo hoá đơn...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {allConsolidatedServices.length > (activeSession.services?.length || 0)
                              ? `POS (${allConsolidatedServices.length} món)`
                              : `${t('rooms_beds.checkout_pos_btn', 'Thanh toán POS')} (${allConsolidatedServices.length || activeSession.services?.length || 1})`}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Finish / Release Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onCompleteSession(bed.id);
                        onClose();
                      }}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">{t('rooms_beds.finish_bed_btn', 'Trả giường')}</span>
                    </button>
                  </div>

                  {/* Secondary Action: Bed Transfer */}
                  <button
                    type="button"
                    disabled={isProcessingCheckout}
                    onClick={() => setTransferModalOpen(true)}
                    className="w-full py-2 px-3 bg-white border border-slate-200/90 hover:bg-slate-100/80 active:scale-[0.98] disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    title={t('rooms_beds.transfer_bed_title', 'Chuyển giường / phòng')}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{t('rooms_beds.transfer_bed_btn', 'Chuyển giường / phòng')}</span>
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
