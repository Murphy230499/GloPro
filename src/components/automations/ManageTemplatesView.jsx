'use client';

import React, { useState } from 'react';
import { Search, Pencil, RotateCcw, ChevronLeft, ChevronRight, Check, X, Sparkles } from 'lucide-react';
import { toast } from '@/components/Layout';
import { useT } from '@/lib/i18n';

// Tailored, purpose-built initial templates for 10 automation events in Vietnamese
const INITIAL_EMAIL_TEMPLATES = [
  {
    id: 'email-1',
    subject: 'Lịch hẹn của bạn sắp diễn ra tại {{salon.Name}}',
    triggerEvent: 'Nhắc lịch hẹn sắp tới',
    triggerId: 'appointment-reminder',
    body: 'Xin chào {{client.FirstName}},\n\nĐây là thông báo nhắc nhở lịch hẹn dịch vụ {{service.Name}} sắp tới của bạn tại {{salon.Name}}.\n\n📅 Thời gian: {{appointment.Time}} ngày {{appointment.Date}}\n📍 Địa điểm: {{salon.Address}}\n\nVui lòng đến đúng giờ để trải nghiệm dịch vụ hoàn hảo nhất. Nếu cần đổi hoặc hủy lịch, bạn vui lòng liên hệ {{salon.Phone}}.\n\nTrân trọng,\n{{salon.Name}}',
    isCustomized: false
  },
  {
    id: 'email-2',
    subject: 'Cảm ơn bạn đã trải nghiệm dịch vụ tại {{salon.Name}}!',
    triggerEvent: 'Cảm ơn sau dịch vụ',
    triggerId: 'thank-you-for-visiting',
    body: 'Chào {{client.FirstName}},\n\nCảm ơn bạn đã dành thời gian làm đẹp tại {{salon.Name}} hôm nay!\n\nChúng tôi rất mong nhận được những góp ý chân thành từ bạn để không ngừng nâng cao chất lượng phục vụ.\n\n⭐ Bạn vui lòng dành 1 phút để đánh giá trải nghiệm nhé: {{review.Link}}\n\nChúc bạn một ngày luôn rạng rỡ!',
    isCustomized: false
  },
  {
    id: 'email-3',
    subject: 'Xác nhận lịch hẹn thành công - {{salon.Name}}',
    triggerEvent: 'Xác nhận lịch hẹn',
    triggerId: 'confirmed-appointment',
    body: 'Xin chào {{client.FirstName}},\n\nLịch hẹn dịch vụ {{service.Name}} của bạn tại {{salon.Name}} đã được xác nhận thành công!\n\n⏰ Thời gian: {{appointment.Time}} - {{appointment.Date}}\n📍 Địa chỉ: {{salon.Address}}\n\nCảm ơn bạn đã lựa chọn {{salon.Name}}. Rất hân hạnh được phục vụ bạn!',
    isCustomized: false
  },
  {
    id: 'email-4',
    subject: 'Đã đến lúc chăm sóc lại vẻ đẹp cùng {{salon.Name}}!',
    triggerEvent: 'Nhắc đặt lịch lại',
    triggerId: 'reminder-to-rebook',
    body: 'Chào {{client.FirstName}},\n\nĐã một thời gian kể từ lần cuối bạn chăm sóc mái tóc & làn da tại {{salon.Name}}.\n\nĐể duy trì vẻ đẹp khỏe rạng ngời, hãy đặt lịch hẹn tái sử dụng dịch vụ ngay hôm nay cùng ưu đãi đặc biệt:\n👉 Đặt lịch ngay: {{booking.Link}}\n\n{{salon.Name}} luôn sẵn sàng chào đón bạn!',
    isCustomized: false
  },
  {
    id: 'email-5',
    subject: 'Thông báo cập nhật giờ hẹn mới - {{salon.Name}}',
    triggerEvent: 'Đổi lịch hẹn',
    triggerId: 'rescheduled-appointment',
    body: 'Xin chào {{client.FirstName}},\n\nLịch hẹn dịch vụ {{service.Name}} của bạn tại {{salon.Name}} đã được đổi sang thời gian mới thành công.\n\n📅 Thời gian mới: {{appointment.Time}} ngày {{appointment.Date}}\n📍 Địa điểm: {{salon.Address}}\n\nNếu có bất kỳ thắc mắc nào, bạn vui lòng liên hệ hotline {{salon.Phone}}.\n\nTrân trọng!',
    isCustomized: false
  },
  {
    id: 'email-6',
    subject: '🎂 Chúc mừng sinh nhật {{client.FirstName}} - Quà tặng từ {{salon.Name}}!',
    triggerEvent: 'Chúc mừng sinh nhật',
    triggerId: 'celebrate-birthdays',
    body: 'Chúc mừng sinh nhật {{client.FirstName}}! 🥳🎉\n\n{{salon.Name}} xin gửi đến bạn những lời chúc tốt đẹp nhất. Để ngày sinh nhật thêm rạng rỡ, salon dành tặng bạn món quà ưu đãi giảm 20% cho tất cả dịch vụ làm đẹp.\n\n🎁 Mã quà tặng: BIRTHDAY20\n📅 Hạn sử dụng: Trong suốt tháng sinh nhật của bạn.\n\n👉 Đặt lịch ngay: {{booking.Link}}',
    isCustomized: false
  },
  {
    id: 'email-7',
    subject: 'Xác nhận hủy lịch hẹn - {{salon.Name}}',
    triggerEvent: 'Hủy lịch hẹn',
    triggerId: 'cancelled-appointment',
    body: 'Xin chào {{client.FirstName}},\n\nLịch hẹn của bạn vào lúc {{appointment.Time}} ngày {{appointment.Date}} tại {{salon.Name}} đã được hủy thành công theo yêu cầu.\n\nChúng tôi rất tiếc chưa thể phục vụ bạn lần này. Khi nào sẵn sàng làm đẹp lại, bạn có thể dễ dàng đặt lịch trực tuyến tại: {{booking.Link}}\n\nCảm ơn bạn!',
    isCustomized: false
  },
  {
    id: 'email-8',
    subject: '🌟 Chúc mừng {{client.FirstName}} đạt hạng Khách Hàng VIP tại {{salon.Name}}!',
    triggerEvent: 'Tri ân khách hàng thân thiết',
    triggerId: 'reward-loyal-clients',
    body: 'Chào {{client.FirstName}},\n\n{{salon.Name}} xin chân thành cảm ơn bạn đã luôn tin tưởng và ủng hộ chúng tôi trong suốt thời gian qua!\n\nVới tổng chi tiêu ấn tượng, bạn đã chính thức trở thành Khách Hàng VIP Thân Thiết của salon. Để tri ân tình cảm này, chúng tôi xin tặng bạn đặc quyền Voucher VIP giảm 15% cho lần trải nghiệm tới.\n\n🎁 Mã ưu đãi VIP: VIPREWARD15\n\nTrân trọng cảm ơn bạn!',
    isCustomized: false
  },
  {
    id: 'email-9',
    subject: '{{salon.Name}} rất tiếc vì đã bỏ lỡ cuộc hẹn cùng {{client.FirstName}}',
    triggerEvent: 'Khách không đến (No-show)',
    triggerId: 'did-not-show-up',
    body: 'Chào {{client.FirstName}},\n\nHôm nay {{salon.Name}} rất tiếc vì không thể gặp bạn trong buổi hẹn lúc {{appointment.Time}}.\n\nChúng tôi hiểu rằng đôi khi có những công việc đột xuất. Nếu bạn muốn sắp xếp lại lịch làm đẹp vào một giờ khác thuận tiện hơn, hãy chọn lịch mới tại đây nhé:\n👉 Đặt lại lịch hẹn: {{booking.Link}}\n\nHoặc gọi hotline {{salon.Phone}} để được hỗ trợ!',
    isCustomized: false
  },
  {
    id: 'email-10',
    subject: '🎉 Chào mừng {{client.FirstName}} đến với {{salon.Name}}!',
    triggerEvent: 'Chào mừng khách hàng mới',
    triggerId: 'welcome-new-clients',
    body: 'Xin chào {{client.FirstName}},\n\nChào mừng bạn đã trở thành thành viên mới của {{salon.Name}}! Cảm ơn bạn đã lựa chọn trải nghiệm dịch vụ chăm sóc sắc đẹp cùng chúng tôi.\n\nĐể đón chào bạn, {{salon.Name}} xin gửi tặng Voucher ưu đãi 50.000đ áp dụng cho hóa đơn đầu tiên:\n🎁 Mã quà tặng: WELCOME50K\n\n👉 Đặt lịch ngay: {{booking.Link}}\n\nRất hân hạnh được phục vụ bạn!',
    isCustomized: false
  }
];

const INITIAL_SMS_TEMPLATES = [
  {
    id: 'sms-1',
    subject: 'Nhắc lịch hẹn sắp tới (SMS)',
    triggerEvent: 'Nhắc lịch hẹn sắp tới',
    triggerId: 'appointment-reminder',
    body: '[{{salon.Name}}] Nhac nho: Lich hen dich vu {{service.Name}} cua ban vao luc {{appointment.Time}} ngay {{appointment.Date}}. LH: {{salon.Phone}}',
    isCustomized: false
  },
  {
    id: 'sms-2',
    subject: 'Cảm ơn sau dịch vụ (SMS)',
    triggerEvent: 'Cảm ơn sau dịch vụ',
    triggerId: 'thank-you-for-visiting',
    body: '[{{salon.Name}}] Cam on {{client.FirstName}} da su dung dich vu! Vui long danh gia trai nghiem cua ban tai: {{review.Link}}',
    isCustomized: false
  },
  {
    id: 'sms-3',
    subject: 'Xác nhận lịch hẹn (SMS)',
    triggerEvent: 'Xác nhận lịch hẹn',
    triggerId: 'confirmed-appointment',
    body: '[{{salon.Name}}] Lich hen {{service.Name}} da duoc xac nhan vao luc {{appointment.Time}} ngay {{appointment.Date}}. Hotline: {{salon.Phone}}',
    isCustomized: false
  },
  {
    id: 'sms-4',
    subject: 'Nhắc đặt lịch lại (SMS)',
    triggerEvent: 'Nhắc đặt lịch lại',
    triggerId: 'reminder-to-rebook',
    body: '[{{salon.Name}}] Da den luc cham soc lai mai toc & lan da! Dat lich ngay de nhan uoc dai: {{booking.Link}}',
    isCustomized: false
  },
  {
    id: 'sms-5',
    subject: 'Đổi lịch hẹn (SMS)',
    triggerEvent: 'Đổi lịch hẹn',
    triggerId: 'rescheduled-appointment',
    body: '[{{salon.Name}}] Lich hen cua ban da duoc chuyen sang luc {{appointment.Time}} ngay {{appointment.Date}}. Hotline: {{salon.Phone}}',
    isCustomized: false
  },
  {
    id: 'sms-6',
    subject: 'Chúc mừng sinh nhật (SMS)',
    triggerEvent: 'Chúc mừng sinh nhật',
    triggerId: 'celebrate-birthdays',
    body: '[{{salon.Name}}] Chuc mung sinh nhat {{client.FirstName}}! Tang ban Voucher giam 20% Ma: BIRTHDAY20. LH: {{salon.Phone}}',
    isCustomized: false
  },
  {
    id: 'sms-7',
    subject: 'Hủy lịch hẹn (SMS)',
    triggerEvent: 'Hủy lịch hẹn',
    triggerId: 'cancelled-appointment',
    body: '[{{salon.Name}}] Lich hen vao {{appointment.Time}} ngay {{appointment.Date}} da duoc huy. Dat lai lich tai: {{booking.Link}}',
    isCustomized: false
  },
  {
    id: 'sms-8',
    subject: 'Tri ân khách hàng thân thiết (SMS)',
    triggerEvent: 'Tri ân khách hàng thân thiết',
    triggerId: 'reward-loyal-clients',
    body: '[{{salon.Name}}] Chuc mung {{client.FirstName}} dat hang VIP! Tang ban Voucher VIPREWARD15 giam 15% cho lan den tiep theo.',
    isCustomized: false
  },
  {
    id: 'sms-9',
    subject: 'Khách không đến (SMS)',
    triggerEvent: 'Khách không đến (No-show)',
    triggerId: 'did-not-show-up',
    body: '[{{salon.Name}}] Rat tiec vi da bo lo cuoc hen luc {{appointment.Time}} hom nay. Dat lai lich moi tai: {{booking.Link}}',
    isCustomized: false
  },
  {
    id: 'sms-10',
    subject: 'Chào mừng khách hàng mới (SMS)',
    triggerEvent: 'Chào mừng khách hàng mới',
    triggerId: 'welcome-new-clients',
    body: '[{{salon.Name}}] Chao mung {{client.FirstName}}! Tang ban Voucher WELCOME50K giam 50k cho lan dau trai nghiem. Dat lich: {{booking.Link}}',
    isCustomized: false
  }
];

const INITIAL_WHATSAPP_TEMPLATES = [
  {
    id: 'wa-1',
    subject: 'Nhắc lịch hẹn sắp tới (WhatsApp)',
    triggerEvent: 'Nhắc lịch hẹn sắp tới',
    triggerId: 'appointment-reminder',
    body: '👋 Chào {{client.FirstName}}! {{salon.Name}} xin nhắc lịch hẹn dịch vụ {{service.Name}} của bạn vào lúc *{{appointment.Time}}* ngày *{{appointment.Date}}*.\n\n📍 Rất mong được đón tiếp bạn! Nếu cần hỗ trợ đổi giờ, hãy trả lời tin nhắn này hoặc gọi {{salon.Phone}} nhé.',
    isCustomized: false
  },
  {
    id: 'wa-2',
    subject: 'Cảm ơn sau dịch vụ (WhatsApp)',
    triggerEvent: 'Cảm ơn sau dịch vụ',
    triggerId: 'thank-you-for-visiting',
    body: '🥰 Cảm ơn {{client.FirstName}} đã ghé thăm {{salon.Name}} hôm nay!\n\nHi vọng bạn hài lòng với dịch vụ {{service.Name}}. Bạn dành 30s đánh giá trải nghiệm giúp salon nhé: {{review.Link}}\n\nChúc bạn luôn xinh đẹp!',
    isCustomized: false
  },
  {
    id: 'wa-3',
    subject: 'Xác nhận lịch hẹn (WhatsApp)',
    triggerEvent: 'Xác nhận lịch hẹn',
    triggerId: 'confirmed-appointment',
    body: '✅ *Xác nhận lịch hẹn thành công!*\n\nChào {{client.FirstName}}, lịch hẹn làm {{service.Name}} của bạn tại {{salon.Name}} đã được ghi nhận cho ngày *{{appointment.Date}}* lúc *{{appointment.Time}}*.\n\nHẹn gặp lại bạn sớm nhé!',
    isCustomized: false
  },
  {
    id: 'wa-4',
    subject: 'Nhắc đặt lịch lại (WhatsApp)',
    triggerEvent: 'Nhắc đặt lịch lại',
    triggerId: 'reminder-to-rebook',
    body: '💖 Chào {{client.FirstName}}! Đã đến lúc dặm lại mái tóc & làn da rạng rỡ rồi đấy.\n\n{{salon.Name}} gửi bạn ưu đãi đặt lịch lại dịch vụ {{service.Name}}.\n👉 Đặt lịch nhanh tại: {{booking.Link}}',
    isCustomized: false
  },
  {
    id: 'wa-5',
    subject: 'Đổi lịch hẹn (WhatsApp)',
    triggerEvent: 'Đổi lịch hẹn',
    triggerId: 'rescheduled-appointment',
    body: '🔄 *Cập nhật thời gian lịch hẹn*\n\nChào {{client.FirstName}}, lịch hẹn của bạn tại {{salon.Name}} đã được điều chỉnh sang lúc *{{appointment.Time}}* ngày *{{appointment.Date}}*.\n\nCảm ơn bạn!',
    isCustomized: false
  },
  {
    id: 'wa-6',
    subject: 'Chúc mừng sinh nhật (WhatsApp)',
    triggerEvent: 'Chúc mừng sinh nhật',
    triggerId: 'celebrate-birthdays',
    body: '🎂🎉 *Happy Birthday {{client.FirstName}}!*\n\n{{salon.Name}} chúc bạn một tuổi mới luôn tỏa sáng & hạnh phúc! Salon tặng bạn món quà Voucher *BIRTHDAY20* giảm 20% dịch vụ.\n\n👉 Đặt lịch mừng sinh nhật tại: {{booking.Link}}',
    isCustomized: false
  },
  {
    id: 'wa-7',
    subject: 'Hủy lịch hẹn (WhatsApp)',
    triggerEvent: 'Hủy lịch hẹn',
    triggerId: 'cancelled-appointment',
    body: 'ℹ️ Chào {{client.FirstName}}, {{salon.Name}} xác nhận lịch hẹn vào lúc *{{appointment.Time}}* ngày *{{appointment.Date}}* đã được hủy.\n\nHẹn gặp lại bạn vào một dịp gần nhất! Đặt lịch lại tại: {{booking.Link}}',
    isCustomized: false
  },
  {
    id: 'wa-8',
    subject: 'Tri ân khách hàng thân thiết (WhatsApp)',
    triggerEvent: 'Tri ân khách hàng thân thiết',
    triggerId: 'reward-loyal-clients',
    body: '🌟 *Đặc quyền Khách Hàng VIP*\n\nChào {{client.FirstName}}, cảm ơn bạn đã luôn đồng hành cùng {{salon.Name}}! Bạn đã chính thức chạm mốc VIP.\n\n🎁 Salon tặng bạn Voucher ưu đãi *VIPREWARD15* giảm 15%.\n👉 Đặt lịch dùng ưu đãi: {{booking.Link}}',
    isCustomized: false
  },
  {
    id: 'wa-9',
    subject: 'Khách không đến (WhatsApp)',
    triggerEvent: 'Khách không đến (No-show)',
    triggerId: 'did-not-show-up',
    body: '💔 Chào {{client.FirstName}}, {{salon.Name}} rất tiếc vì nhỡ mất buổi hẹn hôm nay cùng bạn.\n\nHi vọng mọi việc của bạn đều tốt đẹp! Bạn có thể chọn lại khung giờ rảnh mới tại: {{booking.Link}} hoặc gọi hotline {{salon.Phone}} nhé.',
    isCustomized: false
  },
  {
    id: 'wa-10',
    subject: 'Chào mừng khách hàng mới (WhatsApp)',
    triggerEvent: 'Chào mừng khách hàng mới',
    triggerId: 'welcome-new-clients',
    body: '🎉 *Chào mừng {{client.FirstName}} đến với {{salon.Name}}!*\n\nCảm ơn bạn đã đăng ký trải nghiệm làm đẹp cùng salon. Tặng bạn quà làm quen Voucher *WELCOME50K* giảm ngay 50.000đ.\n\n👉 Đặt lịch trải nghiệm: {{booking.Link}}',
    isCustomized: false
  }
];

const INITIAL_TELEGRAM_TEMPLATES = INITIAL_WHATSAPP_TEMPLATES.map(t => ({
  ...t,
  id: t.id.replace('wa-', 'tg-'),
  subject: t.subject.replace('WhatsApp', 'Telegram'),
}));

const INITIAL_ZALO_TEMPLATES = INITIAL_WHATSAPP_TEMPLATES.map(t => ({
  ...t,
  id: t.id.replace('wa-', 'zl-'),
  subject: t.subject.replace('WhatsApp', 'Zalo'),
}));

export default function ManageTemplatesView({ onBackToEvents }) {
  const { t } = useT();
  const [activeChannel, setActiveChannel] = useState('Email');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [emailTemplates, setEmailTemplates] = useState(INITIAL_EMAIL_TEMPLATES);
  const [smsTemplates, setSmsTemplates] = useState(INITIAL_SMS_TEMPLATES);
  const [waTemplates, setWaTemplates] = useState(INITIAL_WHATSAPP_TEMPLATES);
  const [tgTemplates, setTgTemplates] = useState(INITIAL_TELEGRAM_TEMPLATES);
  const [zlTemplates, setZlTemplates] = useState(INITIAL_ZALO_TEMPLATES);

  const getActiveTemplates = () => {
    if (activeChannel === 'SMS') return smsTemplates;
    if (activeChannel === 'WhatsApp') return waTemplates;
    if (activeChannel === 'Telegram') return tgTemplates;
    if (activeChannel === 'Zalo') return zlTemplates;
    return emailTemplates;
  };

  const setActiveTemplates = (updater) => {
    if (activeChannel === 'SMS') setSmsTemplates(updater);
    else if (activeChannel === 'WhatsApp') setWaTemplates(updater);
    else if (activeChannel === 'Telegram') setTgTemplates(updater);
    else if (activeChannel === 'Zalo') setZlTemplates(updater);
    else setEmailTemplates(updater);
  };

  const currentList = getActiveTemplates().filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.triggerEvent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(currentList.length / 10) || 1;
  const paginatedList = currentList.slice((currentPage - 1) * 10, currentPage * 10);

  const handleRevert = (tpl) => {
    setActiveTemplates(prev => prev.map(item => {
      if (item.id !== tpl.id) return item;
      const initialArray = activeChannel === 'SMS' ? INITIAL_SMS_TEMPLATES 
        : activeChannel === 'WhatsApp' ? INITIAL_WHATSAPP_TEMPLATES
        : activeChannel === 'Telegram' ? INITIAL_TELEGRAM_TEMPLATES
        : activeChannel === 'Zalo' ? INITIAL_ZALO_TEMPLATES
        : INITIAL_EMAIL_TEMPLATES;
      const initial = initialArray.find(x => x.id === tpl.id);
      return initial ? { ...initial, isCustomized: false } : item;
    }));
    toast.success(`Đã khôi phục mẫu tin nhắn "${tpl.triggerEvent}" về mặc định`);
  };

  const handleSaveTemplate = (updatedTpl) => {
    setActiveTemplates(prev => prev.map(item => item.id === updatedTpl.id ? { ...updatedTpl, isCustomized: true } : item));
    toast.success('Đã lưu mẫu tin nhắn thành công!');
    setEditingTemplate(null);
  };

  return (
    <div className="flex flex-col h-full min-h-[750px] bg-slate-50/50 font-body rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs">
      
      {/* Top Header & Breadcrumbs */}
      <div className="px-8 py-6 md:px-10 bg-white border-b border-slate-200/80 sticky top-0 z-10 shadow-2xs space-y-4">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <button
            onClick={onBackToEvents}
            className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            {t('automations.breadcrumb_events', 'Sự kiện tự động')}
          </button>
          <span>/</span>
          <span className="text-slate-800 font-semibold">{t('automations.btn_manage_templates', 'Quản lý kịch bản mẫu')}</span>
        </div>

        {/* Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{t('automations.btn_manage_templates', 'Quản lý kịch bản mẫu')}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{t('automations.manage_templates_subtitle', 'Tùy chỉnh tiêu đề và nội dung tin nhắn tự động theo từng kênh phát email, sms và whatsapp')}</p>
          </div>

          <button
            onClick={onBackToEvents}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition shadow-2xs cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('automations.btn_back_to_events', 'Quay lại kịch bản')}</span>
          </button>
        </div>

        {/* Channel Tabs & Search Bar Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          
          {/* Channel Tabs Pill */}
          <div className="inline-flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
            {['Email', 'SMS', 'WhatsApp', 'Telegram', 'Zalo'].map((chan) => (
              <button
                key={chan}
                onClick={() => { setActiveChannel(chan); setCurrentPage(1); }}
                className={`px-5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeChannel === chan
                    ? 'bg-white text-blue-600 shadow-2xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {chan}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('automations.search_template_ph', 'Tìm theo tiêu đề hoặc sự kiện...')}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 bg-white shadow-2xs placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Main Table Area */}
      <div className="flex-1 px-4 sm:px-8 py-6 md:px-10 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          
          {/* Mobile View (Cards) */}
          <div className="md:hidden divide-y divide-slate-100 text-left">
            {paginatedList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium text-xs">
                {t('automations.no_templates_found', 'Không tìm thấy mẫu kịch bản phù hợp')}
              </div>
            ) : (
              paginatedList.map((tpl) => (
                <div key={tpl.id} className="p-5 hover:bg-slate-50/70 transition space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800 text-sm line-clamp-2">
                        {tpl.triggerId ? `${t(`automations.item_${tpl.triggerId}_title`, tpl.triggerEvent)} (${activeChannel})` : tpl.subject}
                      </div>
                      <div className="inline-block mt-1">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200/50 shadow-sm">
                          {tpl.triggerId ? t(`automations.item_${tpl.triggerId}_title`, tpl.triggerEvent) : tpl.triggerEvent}
                        </span>
                      </div>
                    </div>
                    {tpl.isCustomized && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-semibold shrink-0">
                        {t('automations.status_customized', 'Đã sửa')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-50">
                    <button
                      onClick={() => setEditingTemplate(tpl)}
                      className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-blue-600 flex items-center justify-center transition shadow-2xs"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {tpl.isCustomized && (
                      <button
                        onClick={() => handleRevert(tpl)}
                        className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition shadow-2xs"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <table className="hidden md:table w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-xs font-medium text-slate-500 normal-case">
                <th className="py-3.5 px-6 font-medium text-slate-600">{t('automations.col_subject', 'Tiêu đề')}</th>
                <th className="py-3.5 px-6 font-medium text-slate-600">{t('automations.col_trigger_event', 'Sự kiện kích hoạt')}</th>
                <th className="py-3.5 px-6 font-medium text-slate-600 text-right">{t('automations.col_actions', 'Thao tác')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400 font-medium">
                    {t('automations.no_templates_found', 'Không tìm thấy mẫu kịch bản phù hợp')}
                  </td>
                </tr>
              ) : (
                paginatedList.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-slate-50/70 transition group">
                    
                    {/* Subject */}
                    <td className="py-4 px-6 font-medium text-slate-800 max-w-xs md:max-w-md truncate">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{tpl.triggerId ? `${t(`automations.item_${tpl.triggerId}_title`, tpl.triggerEvent)} (${activeChannel})` : tpl.subject}</span>
                        {tpl.isCustomized && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-semibold shrink-0">
                            {t('automations.status_customized', 'Đã sửa')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Trigger event */}
                    <td className="py-4 px-6 font-medium text-slate-600">
                      {tpl.triggerId ? t(`automations.item_${tpl.triggerId}_title`, tpl.triggerEvent) : tpl.triggerEvent}
                    </td>

                    {/* Action buttons (Pencil & Revert) */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Edit Pencil Icon */}
                        <button
                          onClick={() => setEditingTemplate(tpl)}
                          title="Chỉnh sửa nội dung mẫu"
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 flex items-center justify-center transition cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Revert Icon */}
                        {tpl.isCustomized && (
                          <button
                            onClick={() => handleRevert(tpl)}
                            title="Khôi phục mặc định"
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition cursor-pointer relative group/revert"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Footer Pagination Bar */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">
              Hiển thị {paginatedList.length} trên tổng {currentList.length} mẫu kịch bản
            </span>

            <div className="flex items-center gap-1.5 font-semibold">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(1)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                  currentPage === 1 ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                1
              </button>

              {totalPages > 1 && (
                <button
                  onClick={() => setCurrentPage(2)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                    currentPage === 2 ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  2
                </button>
              )}

              {totalPages > 3 && <span className="px-1 text-slate-400">...</span>}

              {totalPages > 2 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                    currentPage === totalPages ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {totalPages}
                </button>
              )}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <EditTemplateModal
          open={!!editingTemplate}
          template={editingTemplate}
          channel={activeChannel}
          onClose={() => setEditingTemplate(null)}
          onSave={handleSaveTemplate}
        />
      )}

    </div>
  );
}

// Modal component for editing template content
function EditTemplateModal({ open, template, channel, onClose, onSave }) {
  const { t } = useT();
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);

  if (!open) return null;

  const insertToken = (tokenStr) => {
    setBody(prev => prev + ` ${tokenStr} `);
  };

  const getTranslatedTriggerEvent = (tpl) => {
    if (tpl.triggerId) {
      return t(`automations.item_${tpl.triggerId}_title`, tpl.triggerEvent);
    }
    return tpl.triggerEvent;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-body" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />

      <div
        className="relative bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-800">{t('automations.modal_edit_template_title', 'Chỉnh sửa mẫu tin nhắn')} ({channel})</h2>
            <p className="text-[11px] text-slate-400 font-medium">{t('automations.event_label', 'Sự kiện')}: {getTranslatedTriggerEvent(template)}</p>
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
          
          {/* Subject (for Email) */}
          {channel === 'Email' && (
            <div className="space-y-1">
              <label className="block font-medium text-slate-500 text-[11px]">{t('automations.email_subject_label', 'Tiêu đề email *')}</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 bg-white"
              />
            </div>
          )}

          {/* Body Content */}
          <div className="space-y-1">
            <label className="block font-medium text-slate-500 text-[11px]">{t('automations.message_content_label', 'Nội dung tin nhắn *')}</label>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 bg-white leading-relaxed resize-none"
            />
          </div>

          {/* Insert Token Badges */}
          <div>
            <label className="block font-medium text-slate-500 mb-1.5 text-[11px]">{t('automations.insertable_variables_label', 'Thẻ chèn tự động:')}</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { token: '{{client.FirstName}}', label: t('automations.tag_client_name', 'Tên khách hàng') },
                { token: '{{salon.Name}}', label: t('automations.tag_salon_name', 'Tên salon') },
                { token: '{{appointment.Date}}', label: t('automations.tag_appt_date', 'Ngày hẹn') },
                { token: '{{appointment.Time}}', label: t('automations.tag_appt_time', 'Giờ hẹn') },
                { token: '{{service.Name}}', label: t('automations.tag_service_name', 'Tên dịch vụ') },
                { token: '{{salon.Phone}}', label: t('automations.tag_salon_phone', 'SĐT salon') },
                { token: '{{booking.Link}}', label: t('automations.tag_booking_link', 'Link đặt lịch') },
                { token: '{{review.Link}}', label: t('automations.tag_review_link', 'Link đánh giá') }
              ].map(item => (
                <button
                  key={item.token}
                  type="button"
                  onClick={() => insertToken(item.token)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-semibold transition cursor-pointer"
                >
                  + {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {t('automations.btn_cancel', 'Hủy')}
          </button>
          <button
            type="button"
            onClick={() => onSave({ ...template, subject, body })}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            {t('automations.btn_save_template', 'Lưu mẫu tin')}
          </button>
        </div>

      </div>
    </div>
  );
}
