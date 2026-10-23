'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  Scissors, 
  User, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  History, 
  CreditCard,
  Phone,
  ArrowRight,
  RefreshCw,
  Database,
  ExternalLink
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import SocialChannelLogo, { SOCIAL_CHANNEL_CONFIG } from './SocialChannelLogo';

export default function SocialBookingDraftSidebar({
  conversation,
  onCreateAppointment,
  onRescanAi,
  isAiExtracting = false,
  services = [],
  staff = []
}) {
  const t = useT();

  if (!conversation) {
    return (
      <div className="w-full h-full p-6 flex flex-col items-center justify-center bg-white text-slate-400 font-sans text-xs">
        <Calendar className="w-10 h-10 text-slate-300 mb-2" />
        <p>{t('social_chat.empty_draft', 'Chọn hội thoại để xem phiếu nháp lịch hẹn.')}</p>
      </div>
    );
  }

  const draft = conversation.bookingDraft || {};
  const crm = conversation.crmProfile || {};
  const customerPhone = draft.phone || conversation.phone || '';

  const handleCreateAppointment = () => {
    if (onCreateAppointment) {
      onCreateAppointment(draft, conversation);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-y-auto divide-y divide-slate-100">
      {/* 1. Header Phiếu Nháp & Nút Quét Lại AI */}
      <div className="p-4 bg-amber-50/40">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              {t('social_chat.booking_draft_title', 'Phiếu nháp lịch hẹn')}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {onRescanAi && (
              <button
                type="button"
                onClick={onRescanAi}
                disabled={isAiExtracting}
                title="Quét lại toàn bộ đoạn chat bằng AI"
                className="p-1 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-100/80 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAiExtracting ? 'animate-spin' : ''}`} />
              </button>
            )}

            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100/70 border border-amber-200/60 px-2 py-0.5 rounded-full leading-none">
              <Sparkles className="w-2.5 h-2.5" />
              {t('social_chat.ai_extracted', 'AI Trích xuất')}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          {isAiExtracting ? (
            <span className="text-amber-700 font-medium animate-pulse">
              AI đang phân tích ngữ cảnh & khớp dữ liệu thực tế...
            </span>
          ) : (
            t('social_chat.booking_draft_subtitle', 'Tự động tổng hợp từ nội dung chat & khớp CSDL')
          )}
        </p>
      </div>

      {/* 2. Chi Tiết Các Trường Trích Xuất */}
      <div className="p-4 space-y-3 text-xs">
        {/* Khách hàng */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400">{t('social_chat.field_customer', 'Khách hàng')}</span>
          <div className="font-semibold text-slate-900 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 min-w-0">
              <SocialChannelLogo channel={conversation.channel} className="w-4 h-4 shrink-0 rounded-xs" />
              <span className="truncate">{draft.customerName || conversation.customerName}</span>
            </div>
            <span className="text-xs text-slate-500 font-normal shrink-0">{draft.phone || conversation.phone}</span>
          </div>
        </div>

        {/* Dịch vụ (Kèm nhãn Khớp DB) */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">{t('social_chat.field_service', 'Dịch vụ')}</span>
            {draft.serviceId && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                <Database className="w-2.5 h-2.5" />
                Khớp DB GloPro
              </span>
            )}
          </div>
          <div className="font-semibold text-blue-900 flex items-center justify-between bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/70">
            <span className="truncate pr-2">{draft.serviceName || t('social_chat.unknown', 'Chưa rõ')}</span>
            {draft.servicePrice ? (
              <span className="text-blue-700 font-bold text-[11px] shrink-0">
                {Number(draft.servicePrice).toLocaleString()} đ
              </span>
            ) : null}
          </div>
        </div>

        {/* Ngày hẹn & Giờ hẹn */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-slate-400">{t('social_chat.field_date', 'Ngày hẹn')}</span>
            <div className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
              {draft.date || t('social_chat.unknown', 'Chưa rõ')}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-slate-400">{t('social_chat.field_time', 'Giờ hẹn')}</span>
            <div className={`font-semibold p-2.5 rounded-xl border text-[11px] ${
              !draft.time || draft.time.includes('Chưa rõ') || draft.time.includes('不明')
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-800 border-slate-200/80'
            }`}>
              {draft.time || t('social_chat.unknown', 'Chưa rõ')}
            </div>
          </div>
        </div>

        {/* Stylist & Chi nhánh */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">{t('social_chat.field_stylist', 'Stylist / KTV')}</span>
              {draft.staffId && (
                <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                  Khớp
                </span>
              )}
            </div>
            <div className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] truncate">
              {draft.stylist || t('social_chat.unselected', 'Chưa chọn')}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-slate-400">{t('social_chat.field_branch', 'Chi nhánh')}</span>
            <div className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] truncate">
              {draft.branch || t('social_chat.unselected', 'Chưa chọn')}
            </div>
          </div>
        </div>

        {/* Thời lượng */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400">{t('social_chat.field_duration', 'Thời lượng dự kiến')}</span>
          <div className="font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/70 text-[11px]">
            {draft.durationMinutes ? `${draft.durationMinutes} ${t('social_chat.minutes_unit', 'phút')}` : t('social_chat.unknown', 'Chưa rõ')}
          </div>
        </div>

        {/* Cảnh báo thông tin còn thiếu (不足情報) */}
        {draft.missingInfo && draft.missingInfo !== 'Đã đầy đủ thông tin' && draft.missingInfo !== 'Đã hoàn tất lịch hẹn' && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-bold text-[11px] block">{t('social_chat.field_missing_info', 'Thông tin còn thiếu')}:</span>
              <p className="text-[11px] text-amber-800 leading-snug">{draft.missingInfo}</p>
            </div>
          </div>
        )}

        {/* KTV phụ trách */}
        <div className="flex items-center justify-between py-1 text-[11px] border-t border-slate-100">
          <span className="text-slate-400">{t('social_chat.field_assigned_staff', 'Phụ trách')}:</span>
          <span className="font-semibold text-slate-800">{draft.stylist || t('social_chat.unselected', 'Chưa chọn')}</span>
        </div>

        {/* NÚT VÀNG NỔI BẬT: TẠO LỊCH HẸN NGAY */}
        <button
          type="button"
          onClick={handleCreateAppointment}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-98"
        >
          <Calendar className="w-4 h-4" />
          <span>{t('social_chat.create_appointment_btn', 'Tạo lịch hẹn ngay')}</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-80" />
        </button>
      </div>

      {/* 3. Thẻ Khách Hàng CRM 360 (Customer Profile) */}
      <div className="p-4 space-y-2.5 text-xs bg-slate-50/50">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Award className="w-4 h-4 text-blue-600" />
            <span>{t('social_chat.crm_title', 'Hồ Sơ Khách Hàng CRM')}</span>
          </h4>

          {crm.isDbSynced && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Đồng bộ CRM
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 bg-white rounded-lg border border-slate-200/80">
            <span className="text-slate-400 block text-[10px]">{t('social_chat.crm_tier', 'Hạng thành viên')}</span>
            <span className="font-bold text-amber-600">{crm.tier || t('social_chat.unselected', 'Thành viên')}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200/80">
            <span className="text-slate-400 block text-[10px]">{t('social_chat.crm_visits', 'Lần đến tiệm')}</span>
            <span className="font-bold text-slate-800">{crm.visitCount || 0} {t('social_chat.crm_times_unit', 'lần')}</span>
          </div>
        </div>

        <div className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 text-[10px]">{t('social_chat.crm_total_spent', 'Tổng chi tiêu')}:</span>
          <span className="font-bold text-emerald-600 text-xs">
            {Number(crm.totalSpent || 0).toLocaleString()} đ
          </span>
        </div>

        {crm.notes && (
          <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-[11px]">
            <span className="text-slate-400 block text-[10px] font-medium mb-0.5">{t('social_chat.crm_care_notes', 'Lưu ý chăm sóc khách:')}</span>
            <p className="text-slate-700 leading-relaxed">{crm.notes}</p>
          </div>
        )}

        {/* Nút xem hồ sơ CRM chi tiết */}
        {customerPhone && (
          <Link
            href={`/customers?search=${encodeURIComponent(customerPhone)}`}
            target="_blank"
            className="w-full mt-1.5 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <span>Xem hồ sơ chi tiết trên CRM</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        )}
      </div>
    </div>
  );
}
