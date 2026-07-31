'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, CalendarCheck, Clock, CalendarX, EyeOff, Heart, CalendarHeart,
  Cake, Gift, UserPlus, MessageCircle, Mail, Smartphone, ChevronRight, LayoutTemplate, Layers, Pencil
} from 'lucide-react';
import EditEventModal from '@/components/automations/EditEventModal';
import ManageTemplatesView from '@/components/automations/ManageTemplatesView';
import { toast } from '@/components/Layout';

// Initial Automation Items Definition translated to Vietnamese
const INITIAL_CATEGORIES = [
  {
    id: 'reminder',
    title: 'Nhắc lịch hẹn',
    items: [
      {
        id: 'appointment-reminder',
        title: 'Nhắc lịch hẹn sắp tới',
        description: 'Tự động gửi thông báo nhắc khách hàng trước thời gian diễn ra lịch hẹn',
        sendTimes: ['2 giờ trước', '12 giờ trước', '2 ngày trước'],
        channels: ['WhatsApp', 'Email', 'SMS'],
        enabled: true,
        icon: Bell,
        bgColor: 'bg-rose-50',
        iconColor: 'text-rose-500',
      }
    ]
  },
  {
    id: 'appointment-updates',
    title: 'Cập nhật Lịch hẹn',
    items: [
      {
        id: 'confirmed-appointment',
        title: 'Xác nhận lịch hẹn',
        description: 'Gửi thông báo ngay khi lịch hẹn của khách được xác nhận thành công',
        sendTimes: ['Ngay lập tức'],
        channels: ['WhatsApp', 'Email', 'SMS'],
        enabled: true,
        icon: CalendarCheck,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-500',
      },
      {
        id: 'rescheduled-appointment',
        title: 'Đổi lịch hẹn',
        description: 'Gửi thông báo cập nhật thời gian mới ngay khi lịch hẹn thay đổi',
        sendTimes: ['Ngay lập tức'],
        channels: ['WhatsApp', 'Email', 'SMS'],
        enabled: true,
        icon: Clock,
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-500',
      },
      {
        id: 'cancelled-appointment',
        title: 'Hủy lịch hẹn',
        description: 'Tự động gửi thông báo xác nhận khi lịch hẹn bị hủy',
        sendTimes: ['Ngay lập tức'],
        channels: ['WhatsApp', 'Email', 'SMS'],
        enabled: true,
        icon: CalendarX,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-500',
      },
      {
        id: 'did-not-show-up',
        title: 'Khách không đến (No-show)',
        description: 'Tự động gửi tin nhắn chăm sóc khi khách không đến đúng hẹn',
        sendTimes: ['Ngay lập tức'],
        channels: ['WhatsApp', 'Email', 'SMS'],
        enabled: true,
        icon: EyeOff,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-500',
      }
    ]
  },
  {
    id: 'follow-up-sales',
    title: 'Chăm sóc sau bán',
    items: [
      {
        id: 'thank-you-for-visiting',
        title: 'Cảm ơn sau dịch vụ',
        description: 'Gửi lời cảm ơn chân thành kèm liên kết đánh giá sau khi hoàn tất dịch vụ',
        sendTimes: ['2 giờ sau'],
        channels: ['WhatsApp', 'Email', 'SMS'],
        enabled: true,
        icon: Heart,
        bgColor: 'bg-amber-50',
        iconColor: 'text-amber-500',
      },
      {
        id: 'reminder-to-rebook',
        title: 'Nhắc đặt lịch lại',
        description: 'Nhắc nhở khách hàng đặt lịch tái sử dụng dịch vụ sau vài tuần',
        sendTimes: ['2 tuần sau'],
        channels: ['WhatsApp', 'Email', 'SMS'],
        enabled: true,
        icon: CalendarHeart,
        bgColor: 'bg-amber-50',
        iconColor: 'text-amber-500',
      },
      {
        id: 'celebrate-birthdays',
        title: 'Chúc mừng sinh nhật',
        description: 'Gửi quà tặng bất ngờ và lời chúc mừng sinh nhật cho khách hàng',
        sendTimes: ['2 tuần trước sinh nhật'],
        channels: ['WhatsApp', 'Email', 'SMS'],
        enabled: true,
        icon: Cake,
        bgColor: 'bg-amber-50',
        iconColor: 'text-amber-500',
      },
      {
        id: 'reward-loyal-clients',
        title: 'Tri ân khách hàng thân thiết',
        description: 'Tự động gửi ưu đãi đặc biệt cho khách hàng có chi tiêu cao',
        sendTimes: ['Ngay lập tức'],
        channels: ['WhatsApp', 'Email', 'SMS'],
        enabled: true,
        icon: Gift,
        bgColor: 'bg-amber-50',
        iconColor: 'text-amber-500',
      }
    ]
  },
  {
    id: 'celebrate-milestones',
    title: 'Kỷ niệm & Cột mốc',
    items: [
      {
        id: 'welcome-new-clients',
        title: 'Chào mừng khách hàng mới',
        description: 'Chào mừng khách hàng lần đầu trải nghiệm bằng voucher ưu đãi hấp dẫn',
        sendTimes: ['1 ngày sau'],
        channels: ['WhatsApp', 'Email', 'SMS'],
        enabled: true,
        icon: UserPlus,
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-500',
      }
    ]
  }
];

export default function AutomationsView() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState('events'); // 'events' | 'templates'
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [selectedTag, setSelectedTag] = useState('all');
  const [editingItem, setEditingItem] = useState(null);

  const toggleAutomation = (catId, itemId, e) => {
    e.stopPropagation();
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.map(it => {
          if (it.id !== itemId) return it;
          const nextState = !it.enabled;
          toast.success(`${it.title}: ${nextState ? 'Đã bật' : 'Đã tắt'}`);
          return { ...it, enabled: nextState };
        })
      };
    }));
  };

  const handleCardClick = (item) => {
    router.push(`/automations/${item.id}`);
  };

  const handleSaveEventEdit = (updatedItem) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      items: cat.items.map(it => it.id === updatedItem.id ? { ...it, ...updatedItem } : it)
    })));
    setEditingItem(null);
  };

  // If user clicked Templates tab, render ManageTemplatesView
  if (mainTab === 'templates') {
    return <ManageTemplatesView onBackToEvents={() => setMainTab('events')} />;
  }

  return (
    <div className="flex flex-col h-full min-h-[750px] bg-slate-50/50 font-body rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Header Bar */}
        <div className="px-8 py-6 md:px-10 bg-white border-b border-slate-200/80 sticky top-0 z-10 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tin nhắn Tự động (Automation)</h1>
              <p className="text-xs text-slate-500 mt-1">Tự động gửi thông báo SMS, Email và WhatsApp theo từng sự kiện chăm sóc khách hàng</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMainTab('templates')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                <LayoutTemplate className="w-3.5 h-3.5 text-blue-600" />
                <span>Quản lý kịch bản mẫu</span>
              </button>
            </div>
          </div>

          {/* Category Filter Tags */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTag === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả sự kiện ({categories.reduce((acc, c) => acc + c.items.length, 0)})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedTag(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTag === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.title} ({cat.items.length})
              </button>
            ))}
          </div>
        </div>

        {/* Categories / Tags Filtered List */}
        <div className="p-8 md:p-10 space-y-8 w-full">
          {categories
            .filter((category) => selectedTag === 'all' || category.id === selectedTag)
            .map((category) => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{category.title}</h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-600">
                    {category.items.length} kịch bản
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.items.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleCardClick(item)}
                        className="group relative bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                      >
                        {/* Top Row: Icon Badge & Edit Pencil Icon & Toggle Switch */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className={`w-11 h-11 rounded-2xl ${item.bgColor} flex items-center justify-center shrink-0 shadow-2xs`}>
                            <IconComp className={`w-5 h-5 ${item.iconColor}`} />
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Pencil Edit Icon */}
                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              title="Chỉnh sửa kịch bản"
                              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center transition cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={(e) => toggleAutomation(category.id, item.id, e)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                item.enabled ? 'bg-blue-600' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  item.enabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="mb-4">
                          <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition flex items-center gap-1.5">
                            <span>{item.title}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 shrink-0" />
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-normal leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Bottom Footer Details: Send Times & Channels */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
                          {/* Send Times */}
                          <div className="flex items-center gap-1 overflow-hidden">
                            <span className="text-slate-400 font-medium shrink-0">Thời gian:</span>
                            <div className="flex items-center gap-1 truncate font-semibold text-slate-700">
                              {item.sendTimes.map((st, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                                  {st}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Channels */}
                          <div className="flex items-center gap-1 shrink-0">
                            {item.channels.includes('Email') && (
                              <div title="Email" className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                                <Mail className="w-3 h-3 text-blue-600" />
                              </div>
                            )}
                            {item.channels.includes('SMS') && (
                              <div title="SMS" className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                                <Smartphone className="w-3 h-3 text-emerald-600" />
                              </div>
                            )}
                            {item.channels.includes('WhatsApp') && (
                              <div title="WhatsApp" className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

      </div>

      {/* Edit Event Modal */}
      {editingItem && (
        <EditEventModal
          open={!!editingItem}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEventEdit}
        />
      )}
    </div>
  );
}
