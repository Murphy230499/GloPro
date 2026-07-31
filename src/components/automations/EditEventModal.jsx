'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check, Zap, AlertCircle } from 'lucide-react';
import { toast } from '@/components/Layout';
import { base44 } from '@/api/base44Client';
import Link from 'next/link';

// Options for Before Appointment Reminder
const BEFORE_SEND_TIME_OPTIONS = [
  { val: '1 giờ', label: '1 giờ' },
  { val: '2 giờ', label: '2 giờ' },
  { val: '4 giờ', label: '4 giờ' },
  { val: '12 giờ', label: '12 giờ' },
  { val: '1 ngày', label: '1 ngày' },
  { val: '2 ngày', label: '2 ngày' },
  { val: '3 ngày', label: '3 ngày' },
  { val: '1 tuần', label: '1 tuần' },
  { val: '2 tuần', label: '2 tuần' },
  { val: '3 tuần', label: '3 tuần' },
  { val: '4 tuần', label: '4 tuần' }
];

// Options for Rebook Reminder (Send After)
const AFTER_REBOOK_TIME_OPTIONS = [
  { val: '1 tuần', label: '1 tuần' },
  { val: '2 tuần', label: '2 tuần' },
  { val: '3 tuần', label: '3 tuần' },
  { val: '4 tuần', label: '4 tuần' },
  { val: '1 tháng', label: '1 tháng' },
  { val: '2 tháng', label: '2 tháng' },
  { val: '3 tháng', label: '3 tháng' },
  { val: '6 tháng', label: '6 tháng' }
];

// Options for Celebrate Birthdays matching screenshot
const BIRTHDAY_TIME_OPTIONS = [
  { val: 'Đúng ngày sinh nhật', label: 'Đúng ngày sinh nhật' },
  { val: '3 ngày trước sinh nhật', label: '3 ngày trước sinh nhật' },
  { val: '1 tuần trước sinh nhật', label: '1 tuần trước sinh nhật' },
  { val: '2 tuần trước sinh nhật', label: '2 tuần trước sinh nhật' }
];

// Options for Thank You After Sale (Send After)
const AFTER_SEND_TIME_OPTIONS = [
  { val: '1 giờ', label: '1 giờ' },
  { val: '2 giờ', label: '2 giờ' },
  { val: '4 giờ', label: '4 giờ' },
  { val: '12 giờ', label: '12 giờ' },
  { val: '1 ngày', label: '1 ngày' },
  { val: '2 ngày', label: '2 ngày' },
  { val: '4 tuần', label: '4 tuần' }
];

// Options for Welcome New Clients (Send After profile creation)
const WELCOME_SEND_TIME_OPTIONS = [
  { val: '1 ngày', label: '1 ngày' },
  { val: '2 ngày', label: '2 ngày' },
  { val: '3 ngày', label: '3 ngày' },
  { val: '1 tuần', label: '1 tuần' }
];

const PROMO_OPTIONS = [
  { id: 'promo_3', label: 'Tri ân VIP - Giảm 10% Hóa đơn' },
  { id: 'promo_1', label: 'Khuyến mãi hè - Giảm 20% Dịch vụ' },
  { id: 'v_1', label: 'Voucher GIAM20K - Voucher giảm 20.000đ dịch vụ' },
  { id: 'v_2', label: 'Voucher GIAM10PCT - Voucher giảm 10% tổng đơn' },
  { id: 'promo_2', label: 'Combo Đón Thu - Giảm 50.000đ Sản phẩm' }
];

const formatNumberWithDots = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const numStr = String(val).replace(/\D/g, '');
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseDotsToNumber = (str) => {
  if (!str) return 0;
  return Number(String(str).replace(/\./g, '').replace(/\D/g, '')) || 0;
};

export default function EditEventModal({ open, onClose, item, onSave }) {
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [promoDropdownOpen, setPromoDropdownOpen] = useState(false);
  const [minSpend, setMinSpend] = useState(5000000);
  const [selectedPromotion, setSelectedPromotion] = useState('promo_3');
  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    whatsapp: false,
    telegram: false,
    zalo: false
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [activeIntegrations, setActiveIntegrations] = useState([]);
  const dropdownRef = useRef(null);
  const promoDropdownRef = useRef(null);

  useEffect(() => {
    if (open) {
      base44.entities.Integration.filter({ branch_id: null }).then(data => {
        setActiveIntegrations(data || []);
      }).catch(console.error);
    }
  }, [open]);

  const isEmailConnected = activeIntegrations.some(i => i.provider === 'email_smtp' && i.status === 'connected');
  const isSmsConnected = activeIntegrations.some(i => i.provider === 'sms_brandname' && i.status === 'connected');
  const isWhatsappConnected = activeIntegrations.some(i => i.provider === 'whatsapp' && i.status === 'connected');
  const isTelegramConnected = activeIntegrations.some(i => i.provider === 'telegram' && i.status === 'connected');
  const isZaloConnected = activeIntegrations.some(i => i.provider === 'zalo' && i.status === 'connected');

  const isWelcomeNew = item?.id === 'welcome-new-clients';
  const isRewardLoyal = item?.id === 'reward-loyal-clients';
  const isThankYouEvent = item?.id === 'thank-you-for-visiting';
  const isBirthdayEvent = item?.id === 'celebrate-birthdays';
  const isRebookReminder = item?.id === 'reminder-to-rebook';
  const isBeforeReminder = item?.id === 'appointment-reminder';
  const isFixedImmediate = !isWelcomeNew && !isThankYouEvent && !isBirthdayEvent && !isRebookReminder && !isBeforeReminder && !isRewardLoyal;

  let currentOptions = BEFORE_SEND_TIME_OPTIONS;
  let prefixLabel = 'Trước';

  if (isWelcomeNew) {
    currentOptions = WELCOME_SEND_TIME_OPTIONS;
    prefixLabel = 'Sau';
  } else if (isThankYouEvent) {
    currentOptions = AFTER_SEND_TIME_OPTIONS;
    prefixLabel = 'Sau';
  } else if (isBirthdayEvent) {
    currentOptions = BIRTHDAY_TIME_OPTIONS;
    prefixLabel = 'Trước';
  } else if (isRebookReminder) {
    currentOptions = AFTER_REBOOK_TIME_OPTIONS;
    prefixLabel = 'Sau';
  }

  useEffect(() => {
    if (item) {
      if (isWelcomeNew) {
        const initialTimes = (item.sendTimes || ['1 ngày sau', '1 day after'])
          .map(t => t.replace(' sau', '').replace(' after', '').replace('days', 'ngày').replace('day', 'ngày').replace('weeks', 'tuần').replace('week', 'tuần').trim())
          .filter(Boolean);
        setSelectedTimes(initialTimes.length > 0 ? initialTimes : ['1 ngày']);
      } else if (isThankYouEvent) {
        const initialTimes = (item.sendTimes || ['2 giờ sau', '2 hours after', 'Ngay lập tức'])
          .map(t => t.replace(' sau', '').replace(' after', '').replace('hours', 'giờ').replace('hour', 'giờ').replace('days', 'ngày').replace('day', 'ngày').replace('weeks', 'tuần').replace('week', 'tuần').trim())
          .filter(Boolean);
        setSelectedTimes(initialTimes.length > 0 && !initialTimes.includes('Ngay lập tức') ? initialTimes : ['2 giờ']);
      } else if (isBirthdayEvent) {
        const initialTimes = (item.sendTimes || ['2 tuần trước', '2 weeks before'])
          .map(t => {
            if (t.includes('2')) return '2 tuần trước sinh nhật';
            if (t.includes('1')) return '1 tuần trước sinh nhật';
            if (t.includes('3')) return '3 ngày trước sinh nhật';
            return 'Đúng ngày sinh nhật';
          });
        setSelectedTimes(initialTimes.length > 0 ? initialTimes : ['2 tuần trước sinh nhật']);
      } else if (isRebookReminder) {
        const initialTimes = (item.sendTimes || ['2 weeks after', '2 tuần sau'])
          .map(t => t.replace(' sau', '').replace(' after', '').replace('weeks', 'tuần').replace('week', 'tuần').replace('months', 'tháng').replace('month', 'tháng').trim())
          .filter(Boolean);
        setSelectedTimes(initialTimes.length > 0 ? initialTimes : ['2 tuần']);
      } else if (isBeforeReminder) {
        const initialTimes = (item.sendTimes || ['2 giờ trước', '12 giờ trước', '2 ngày trước'])
          .map(t => t.replace(' trước', '').replace(' before', '').replace('hours', 'giờ').replace('hour', 'giờ').replace('days', 'ngày').replace('day', 'ngày').replace('weeks', 'tuần').replace('week', 'tuần').trim())
          .filter(Boolean);
        setSelectedTimes(initialTimes.length > 0 ? initialTimes : ['2 giờ']);
      } else {
        setSelectedTimes(['Ngay lập tức']);
      }

      setChannels({
        email: item.channels?.includes('Email') ?? true,
        sms: item.channels?.includes('SMS') ?? false,
        whatsapp: item.channels?.includes('WhatsApp') ?? false,
      });
      setErrorMsg('');
    }
  }, [item, open, isThankYouEvent, isBirthdayEvent, isRebookReminder, isBeforeReminder]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (promoDropdownRef.current && !promoDropdownRef.current.contains(e.target)) {
        setPromoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open || !item) return null;

  const IconComp = item.icon || Zap;

  const toggleChannel = (key) => {
    setChannels(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.email && !next.sms && !next.whatsapp && !next.telegram && !next.zalo) {
        setErrorMsg('Vui lòng chọn ít nhất 1 kênh để gửi tin nhắn.');
      } else {
        setErrorMsg('');
      }
      return next;
    });
  };

  const toggleTimeOption = (val) => {
    if (selectedTimes.includes(val)) {
      if (selectedTimes.length <= 1) {
        toast.error('Kịch bản cần chọn ít nhất 1 mốc thời gian');
        return;
      }
      setSelectedTimes(selectedTimes.filter(t => t !== val));
    } else {
      setSelectedTimes([...selectedTimes, val]);
    }
  };

  const removeTimeTag = (val, e) => {
    e.stopPropagation();
    if (selectedTimes.length <= 1) {
      toast.error('Kịch bản cần chọn ít nhất 1 mốc thời gian');
      return;
    }
    setSelectedTimes(selectedTimes.filter(t => t !== val));
  };

  const handleSave = () => {
    if (!channels.email && !channels.sms && !channels.whatsapp) {
      setErrorMsg('Vui lòng chọn ít nhất 1 kênh để gửi tin nhắn.');
      return;
    }

    const updatedChannels = [];
    if (channels.email) updatedChannels.push('Email');
    if (channels.sms) updatedChannels.push('SMS');
    if (channels.whatsapp) updatedChannels.push('WhatsApp');

    let formattedSendTimes = ['Ngay lập tức'];
    if (isWelcomeNew) {
      formattedSendTimes = selectedTimes.map(t => `${t} sau`);
    } else if (isThankYouEvent) {
      formattedSendTimes = selectedTimes.map(t => `${t} sau`);
    } else if (isBirthdayEvent) {
      formattedSendTimes = selectedTimes;
    } else if (isRebookReminder) {
      formattedSendTimes = selectedTimes.map(t => `${t} sau`);
    } else if (isBeforeReminder) {
      formattedSendTimes = selectedTimes.map(t => `${t} trước`);
    }

    onSave?.({
      ...item,
      sendTimes: formattedSendTimes,
      channels: updatedChannels,
      minSpend: isRewardLoyal ? minSpend : undefined,
      promotionId: isRewardLoyal ? selectedPromotion : undefined
    });

    toast.success(`Đã cập nhật kịch bản "${item.title}"`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center font-body" onClick={onClose}>
      {/* Backdrop matching Service Modal */}
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />

      {/* Modal Box matching Service Form (max-w-md, rounded-3xl, p-6) */}
      <div
        className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Chỉnh sửa kịch bản</h2>
            <p className="text-[11px] text-slate-400 font-medium">
              {isWelcomeNew
                ? 'Cấu hình thời gian tự động gửi tin nhắn chào mừng sau khi tạo hồ sơ khách hàng mới'
                : isRewardLoyal
                ? 'Cấu hình mức chi tiêu tối thiểu và CTKM tự động tặng vào tài khoản khách hàng VIP'
                : isThankYouEvent
                ? 'Cấu hình thời gian gửi tin nhắn cảm ơn sau khi hoàn tất thanh toán hóa đơn'
                : isBirthdayEvent
                ? 'Cấu hình tự động gửi lời chúc mừng và quà tặng sinh nhật'
                : isRebookReminder
                ? 'Cấu hình thời gian gửi nhắc nhở đặt lịch lại sau khi hoàn thành dịch vụ'
                : 'Cấu hình thời gian gửi và kênh phát thông báo'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          
          {/* 1. Trigger Event Banner */}
          <div>
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">Sự kiện kích hoạt</label>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${item.bgColor || 'bg-rose-50'} flex items-center justify-center shrink-0 shadow-2xs`}>
                <IconComp className={`w-5 h-5 ${item.iconColor || 'text-rose-500'}`} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-800 truncate">{item.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
              </div>
            </div>
          </div>

          {/* 2. Send time */}
          <div className="space-y-1" ref={dropdownRef}>
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">
              Thời gian gửi <span className="text-rose-500">*</span>
            </label>

            {isFixedImmediate ? (
              /* Fixed Immediate Read-Only Input */
              <div className="flex items-center border border-slate-200/90 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-600 justify-between select-none cursor-not-allowed">
                <span>Ngay lập tức</span>
                <ChevronDown className="w-4 h-4 text-slate-400 opacity-60" />
              </div>
            ) : (
              /* Dynamic Send Time with Prefix ("Trước" or "Sau") & Checkbox Dropdown */
              <div className="space-y-1.5">
                <div className="relative">
                  {/* Outer Input Box with Prefix ("Trước" or "Sau") */}
                  <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:border-blue-500 transition min-h-[44px]">
                    {/* Prefix Label ("Trước" / "Sau") */}
                    <div className="bg-slate-100/90 px-3.5 py-2.5 text-xs font-bold text-slate-500 border-r border-slate-200 shrink-0 flex items-center select-none">
                      {prefixLabel}
                    </div>

                    {/* Dropdown Selector Trigger Button */}
                    <div
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex-1 px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50/60 transition"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {selectedTimes.length === 0 ? (
                          <span className="text-xs text-slate-400">Chọn mốc thời gian...</span>
                        ) : (
                          selectedTimes.map(t => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold"
                            >
                              <span>{t}</span>
                              <button
                                type="button"
                                onClick={(e) => removeTimeTag(t, e)}
                                className="hover:text-rose-600 transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                    </div>
                  </div>

                  {/* Multi-Select Dropdown Menu with Checkboxes */}
                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 max-h-64 overflow-y-auto space-y-0.5 font-body animate-in fade-in slide-in-from-top-1 duration-150">
                      {currentOptions.map((opt) => {
                        const isChecked = selectedTimes.includes(opt.val);
                        return (
                          <label
                            key={opt.val}
                            onClick={() => toggleTimeOption(opt.val)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition select-none ${
                              isChecked ? 'bg-blue-50/80 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span>{opt.label}</span>
                            </div>
                            {isChecked && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Hint Text */}
                {isWelcomeNew && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    Tự động gửi tin nhắn chào mừng sau một khoảng thời gian tính từ thời điểm tạo hồ sơ khách hàng mới
                  </p>
                )}
                {isThankYouEvent && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    Tự động gửi tin nhắn cảm ơn và link đánh giá sau khi hoàn tất thanh toán hóa đơn
                  </p>
                )}
                {isBirthdayEvent && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    Tự động gửi lời chúc mừng và ưu đãi trước ngày sinh nhật của khách hàng
                  </p>
                )}
                {isRebookReminder && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    Chọn thời gian chờ trước khi tự động gửi nhắc nhở đặt lịch lại dịch vụ
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Additional fields for Reward loyal clients matching screenshot */}
          {isRewardLoyal && (
            <div className="space-y-4 pt-1">
              {/* 2b. Minimum Spend Threshold with Thousand Separator Dots */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">
                  Mức chi tiêu tối thiểu <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:border-blue-500 transition">
                  <div className="bg-slate-100/90 px-3.5 py-2.5 text-xs font-bold text-slate-500 border-r border-slate-200 shrink-0 select-none">
                    ₫
                  </div>
                  <input
                    type="text"
                    value={formatNumberWithDots(minSpend)}
                    onChange={(e) => setMinSpend(parseDotsToNumber(e.target.value))}
                    placeholder="5.000.000"
                    className="w-full px-3 py-2.5 text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium pt-0.5">
                  Nhập mức tổng số tiền chi tiêu tích lũy tối thiểu để khách hàng đủ điều kiện nhận ưu đãi này.
                </p>
              </div>

              {/* 2c. Custom Sleek White Promotion Dropdown */}
              <div className="space-y-1" ref={promoDropdownRef}>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">
                  Chương trình khuyến mãi
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPromoDropdownOpen(!promoDropdownOpen)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 flex items-center justify-between gap-2 shadow-2xs focus:border-blue-500 transition text-left cursor-pointer"
                  >
                    <span className="truncate">
                      {PROMO_OPTIONS.find(p => p.id === selectedPromotion)?.label || '— Chọn chương trình khuyến mãi —'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${promoDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>

                  {/* Floating White Dropdown Menu */}
                  {promoDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {PROMO_OPTIONS.map((promo) => {
                        const isSelected = selectedPromotion === promo.id;
                        return (
                          <div
                            key={promo.id}
                            onClick={() => {
                              setSelectedPromotion(promo.id);
                              setPromoDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition select-none ${
                              isSelected ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="truncate">{promo.label}</span>
                            {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium pt-0.5">
                  Chương trình khuyến mãi sẽ được tự động tặng trực tiếp vào hồ sơ của khách hàng đạt điều kiện.
                </p>
              </div>
            </div>
          )}

          {/* 3. Channels Selector */}
          <div>
            <label className="block font-bold text-slate-500 mb-1 text-[11px]">
              Kênh phát thông báo <span className="text-rose-500">*</span>
            </label>

            <div className="space-y-2">
              
              {/* Email */}
              <div
                onClick={() => {
                  if (isEmailConnected) toggleChannel('email');
                }}
                className={`border rounded-xl p-3 flex items-center justify-between gap-3 bg-white transition ${isEmailConnected ? 'border-slate-200 hover:border-blue-400 cursor-pointer' : 'border-slate-100 opacity-60 cursor-not-allowed'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
                      alt="Gmail"
                      className="w-4.5 h-4.5"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      Email
                      {!isEmailConnected && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Chưa kết nối</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400">Gửi thông báo qua Email khách hàng</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isEmailConnected}
                  onClick={(e) => { e.stopPropagation(); if (isEmailConnected) toggleChannel('email'); }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed ${
                    channels.email && isEmailConnected ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      channels.email && isEmailConnected ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* SMS */}
              <div
                onClick={() => {
                  if (isSmsConnected) toggleChannel('sms');
                }}
                className={`border rounded-xl p-3 flex items-center justify-between gap-3 bg-white transition ${isSmsConnected ? 'border-slate-200 hover:border-blue-400 cursor-pointer' : 'border-slate-100 opacity-60 cursor-not-allowed'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-white font-extrabold text-[9px]">
                      SMS
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      Tin nhắn SMS
                      {!isSmsConnected && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Chưa kết nối</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400">Gửi SMS tới số điện thoại khách</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isSmsConnected}
                  onClick={(e) => { e.stopPropagation(); if (isSmsConnected) toggleChannel('sms'); }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed ${
                    channels.sms && isSmsConnected ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      channels.sms && isSmsConnected ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* WhatsApp */}
              <div
                onClick={() => {
                  if (isWhatsappConnected) toggleChannel('whatsapp');
                }}
                className={`border rounded-xl p-3 flex items-center justify-between gap-3 bg-white transition ${isWhatsappConnected ? 'border-slate-200 hover:border-blue-400 cursor-pointer' : 'border-slate-100 opacity-60 cursor-not-allowed'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                      alt="WhatsApp"
                      className="w-4.5 h-4.5"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      WhatsApp
                      {!isWhatsappConnected && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Chưa kết nối</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400">Gửi qua WhatsApp Business</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isWhatsappConnected}
                  onClick={(e) => { e.stopPropagation(); if (isWhatsappConnected) toggleChannel('whatsapp'); }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed ${
                    channels.whatsapp && isWhatsappConnected ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      channels.whatsapp && isWhatsappConnected ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Telegram */}
              <div
                onClick={() => {
                  if (isTelegramConnected) toggleChannel('telegram');
                }}
                className={`border rounded-xl p-3 flex items-center justify-between gap-3 bg-white transition ${isTelegramConnected ? 'border-slate-200 hover:border-blue-400 cursor-pointer' : 'border-slate-100 opacity-60 cursor-not-allowed'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="#24A1DE">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      Telegram
                      {!isTelegramConnected && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Chưa kết nối</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400">Gửi thông báo qua Telegram Bot</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isTelegramConnected}
                  onClick={(e) => { e.stopPropagation(); if (isTelegramConnected) toggleChannel('telegram'); }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed ${
                    channels.telegram && isTelegramConnected ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      channels.telegram && isTelegramConnected ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Zalo */}
              <div
                onClick={() => {
                  if (isZaloConnected) toggleChannel('zalo');
                }}
                className={`border rounded-xl p-3 flex items-center justify-between gap-3 bg-white transition ${isZaloConnected ? 'border-slate-200 hover:border-blue-400 cursor-pointer' : 'border-slate-100 opacity-60 cursor-not-allowed'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-5 h-5">
                      <rect width="100" height="100" rx="24" fill="#0068FF" />
                      <path d="M72 48.5C72 35.5 62.1 25 50 25C37.9 25 28 35.5 28 48.5C28 54.4 30.4 59.8 34.3 63.9L32 75L41.3 71C44 72 46.9 72.5 50 72.5C62.1 72.5 72 61.9 72 48.5Z" fill="white"/>
                      <text x="50%" y="51%" fill="#0068FF" fontSize="19" fontWeight="800" fontFamily="sans-serif" textAnchor="middle" alignmentBaseline="middle">Zalo</text>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      Zalo ZNS
                      {!isZaloConnected && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Chưa kết nối</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400">Gửi ZNS qua Zalo OA</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isZaloConnected}
                  onClick={(e) => { e.stopPropagation(); if (isZaloConnected) toggleChannel('zalo'); }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed ${
                    channels.zalo && isZaloConnected ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      channels.zalo && isZaloConnected ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              {(!isEmailConnected || !isSmsConnected || !isWhatsappConnected || !isTelegramConnected || !isZaloConnected) && (
                <div className="pt-2 text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kênh bị mờ yêu cầu thiết lập API Key.</span>
                  <Link href="/settings?tab=integrations" onClick={onClose} className="text-blue-600 hover:underline font-bold ml-1">
                    Đi tới Cài đặt &rarr;
                  </Link>
                </div>
              )}

            </div>

            {errorMsg && (
              <p className="text-xs font-medium text-rose-500 pt-1.5 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Lưu thay đổi
          </button>
        </div>

      </div>
    </div>
  );
}
