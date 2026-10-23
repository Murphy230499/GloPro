'use client';

import React, { useState } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  MessageCircle, 
  Facebook, 
  PhoneCall, 
  Instagram, 
  Send,
  MessagesSquare,
  Sparkles,
  UserCheck,
  Settings
} from 'lucide-react';
import { SOCIAL_CHANNELS } from './mockSocialData';
import { useT } from '@/lib/i18n';
import SocialChannelLogo, { SocialChannelAvatarBadge, SOCIAL_CHANNEL_CONFIG } from './SocialChannelLogo';

export default function SocialConversationList({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  selectedChannel,
  onSelectChannel,
  onOpenConfigModal
}) {
  const t = useT();
  const [searchQuery, setSearchQuery] = useState('');

  // Lọc theo kênh và từ khóa tìm kiếm
  const filteredConversations = conversations.filter(conv => {
    const matchesChannel = !selectedChannel || selectedChannel === 'all' || conv.channel === selectedChannel;
    const matchesSearch = !searchQuery.trim() || 
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.phone.includes(searchQuery) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const getLeadScoreBadge = (score) => {
    const text = t('social_chat.lead_score', 'Xác suất {score}%', { score });
    if (score >= 90) {
      return (
        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md whitespace-nowrap leading-none">
          {text}
        </span>
      );
    }
    if (score >= 75) {
      return (
        <span className="text-[10px] font-medium text-sky-700 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-md whitespace-nowrap leading-none">
          {text}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md whitespace-nowrap leading-none">
        {text}
      </span>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200/90">
      {/* 1. Header & Bộ Lọc Cài Đặt */}
      <div className="p-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{t('social_chat.chat_header', 'Tin nhắn')}</h2>
          <span className="text-xs text-slate-400 font-medium">({filteredConversations.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {onOpenConfigModal && (
            <button
              type="button"
              onClick={onOpenConfigModal}
              title="Cấu hình kết nối kênh MXH & Webhook"
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            title={t('social_chat.filter_options', 'Tùy chọn lọc')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Thanh Tìm Kiếm */}
      <div className="px-3 py-2 border-b border-slate-100">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('social_chat.search_placeholder', 'Tìm kiếm khách, SĐT, tin nhắn...')}
            className="w-full bg-slate-50 text-slate-700 placeholder-slate-400 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* 3. Lọc Kênh Nhanh (Pills kèm Logo chính thức của từng App) */}
      <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100 text-[11px]">
        {SOCIAL_CHANNELS.map(ch => {
          const isSelected = (selectedChannel || 'all') === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ch.id !== 'all' ? (
                <SocialChannelLogo channel={ch.id} className="w-3.5 h-3.5 shrink-0 rounded-xs" />
              ) : (
                <MessagesSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
              )}
              <span>{ch.id === 'all' ? t('social_chat.channel_all', 'Tất cả') : ch.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Danh Sách Các Hội Thoại */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <MessagesSquare className="w-8 h-8 text-slate-300" />
            <p>{t('social_chat.no_conversations', 'Không tìm thấy hội thoại phù hợp.')}</p>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const isActive = activeConversationId === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3.5 cursor-pointer transition flex items-start gap-3 relative ${
                  isActive 
                    ? 'bg-blue-50/60 border-l-4 border-blue-600 pl-2.5' 
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Avatar khách hàng (Giữ nguyên vẹn, không bị che khuất) */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 border border-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 shrink-0">
                  {conv.avatar ? (
                    <img src={conv.avatar} alt={conv.customerName} className="w-full h-full object-cover" />
                  ) : (
                    conv.customerName.charAt(0)
                  )}
                </div>

                {/* Nội dung tóm tắt */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-semibold text-xs text-slate-900 truncate">
                      {conv.customerName}
                    </h3>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                      {conv.lastMessageTime}
                    </span>
                  </div>

                  {/* Kênh & SĐT */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 leading-tight">
                    <SocialChannelLogo channel={conv.channel} className="w-3.5 h-3.5 shrink-0" />
                    <span>{conv.phone}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2 font-normal">
                    {t.lang === 'ja' ? (conv.lastMessageJa || conv.lastMessage) : (conv.lastMessage || conv.lastMessageJa)}
                  </p>

                  {/* Badges Tags & Điểm số chốt lịch */}
                  <div className="flex items-center justify-between flex-wrap gap-1.5 mt-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      {conv.tags.map(tag => (
                        <span
                          key={tag.id}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded leading-none border ${
                            tag.id === 'needs_human'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                              : tag.id === 'bookable'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : tag.id === 'ai_replied'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {t('social_chat.tag_' + tag.id, t.lang === 'ja' ? (tag.labelJa || tag.label) : tag.label)}
                        </span>
                      ))}
                    </div>

                    {/* Điểm số chốt lịch 55%, 80%, 100% */}
                    {getLeadScoreBadge(conv.leadScore)}
                  </div>
                </div>

                {/* Dấu chấm chưa đọc */}
                {conv.unreadCount > 0 && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
