'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  AlertCircle, 
  Plus, 
  Sparkles, 
  CheckCheck, 
  Lock, 
  Languages, 
  ChevronDown, 
  Scissors, 
  Gift, 
  PhoneCall, 
  Check, 
  MoreVertical,
  Paperclip,
  Loader2,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import SocialChannelLogo, { SocialChannelAvatarBadge, SocialChannelPill, SOCIAL_CHANNEL_CONFIG } from './SocialChannelLogo';

export default function SocialChatThread({
  conversation,
  onSendMessage,
  onAddInternalNote,
  onTakeoverHuman,
  onResolveConversation,
  onTriggerAutoReply,
  isAutoPilot = false,
  isTranslating = false,
  suggestions = [],
  isLoadingSuggestions = false,
  onRefreshSuggestions
}) {
  const t = useT();
  const [inputText, setInputText] = useState('');
  const [isInternalMode, setIsInternalMode] = useState(false); // false = Tin nhắn khách, true = Ghi chú nội bộ vàng (内部メモ)
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [isBilingualActive, setIsBilingualActive] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  if (!conversation) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8">
        <Bot className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
        <p className="text-sm">{t('social_chat.empty_thread', 'Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu tư vấn.')}</p>
      </div>
    );
  }

  const getPrimaryContent = (msg) => {
    if (t.lang === 'ja') return msg.contentJa || msg.contentVi;
    return msg.contentVi || msg.contentJa;
  };

  const getSecondaryContent = (msg) => {
    if (t.lang === 'ja') return msg.contentVi;
    return msg.contentJa;
  };

  const handleSend = () => {
    if (!inputText.trim() || isTranslating) return;

    if (isInternalMode) {
      if (onAddInternalNote) {
        onAddInternalNote(conversation.id, inputText);
      }
    } else {
      if (onSendMessage) {
        onSendMessage(conversation.id, inputText);
      }
    }
    setInputText('');
  };

  const handleSelectSuggestion = (sug, instantSend = false) => {
    const textToSend = sug.textVi || sug.textJa;
    if (instantSend) {
      if (onSendMessage) {
        onSendMessage(conversation.id, textToSend);
      }
      setShowAiSuggestions(false);
    } else {
      setInputText(textToSend);
      setShowAiSuggestions(false);
    }
  };

  const activeSuggestions = (suggestions && suggestions.length > 0) 
    ? suggestions 
    : (conversation.aiSuggestions || []);

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200/90">
      {/* 1. Header Khung Chat */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar khách hàng (Giữ nguyên vẹn, không che khuất) */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
            {conversation.avatar ? (
              <img src={conversation.avatar} alt={conversation.customerName} className="w-full h-full object-cover" />
            ) : (
              conversation.customerName.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 truncate">
                {conversation.customerName}
              </h3>
              <SocialChannelPill 
                channel={conversation.channel} 
                label={conversation.channelLabel} 
                size="sm" 
              />
              {isAutoPilot && (
                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  Auto-Pilot
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 font-normal">{conversation.phone}</span>
              <span className="text-slate-300">·</span>
              <span className="text-[10px] text-slate-600 font-medium inline-flex items-center gap-1">
                <span>qua</span>
                <span className="font-semibold">{SOCIAL_CHANNEL_CONFIG[conversation.channel]?.name || conversation.channel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Nút bật/tắt hiển thị song ngữ */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBilingualActive(!isBilingualActive)}
            title={isBilingualActive ? t('social_chat.single_language_btn', 'Chuyển sang 1 ngôn ngữ') : t('social_chat.bilingual_display_btn', 'Bật song ngữ 2 tầng')}
            className={`px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
              isBilingualActive 
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-2xs' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{t('social_chat.bilingual_display_btn', 'Song ngữ')}</span>
          </button>
        </div>
      </div>

      {/* 2. Luồng Tin Nhắn (Chat Messages) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
        {conversation.messages.map((msg) => {
          // Tin nhắn của Khách Hàng
          if (msg.senderType === 'customer') {
            return (
              <div key={msg.id} className="flex flex-col items-start max-w-[85%] mr-auto">
                <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1.5">
                  <SocialChannelLogo channel={conversation.channel} className="w-3.5 h-3.5 shrink-0 rounded-xs" />
                  <span className="font-semibold text-slate-700">{msg.senderName}</span>
                  <span>·</span>
                  <span>{msg.time}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-slate-800 text-xs flex flex-col gap-1.5">
                  <p className="font-medium text-xs leading-relaxed text-slate-900">
                    {getPrimaryContent(msg)}
                  </p>
                  {isBilingualActive && getSecondaryContent(msg) && getSecondaryContent(msg) !== getPrimaryContent(msg) && (
                    <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-1 leading-normal">
                      <span className="text-slate-400 font-medium">{t('social_chat.original_text', 'Nguyên văn:')}</span> {getSecondaryContent(msg)}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          // Ghi chú nội bộ màu vàng (内部メモ)
          if (msg.isInternal) {
            return (
              <div key={msg.id} className="w-full flex justify-center my-2">
                <div className="max-w-[90%] p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs shadow-2xs flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-amber-800 font-semibold border-b border-amber-200/60 pb-1">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-700" />
                      {t('social_chat.internal_note', 'Ghi chú nội bộ')} ({msg.senderName})
                    </span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="font-medium text-xs text-amber-900 leading-relaxed">
                    {getPrimaryContent(msg)}
                  </p>
                  {isBilingualActive && getSecondaryContent(msg) && getSecondaryContent(msg) !== getPrimaryContent(msg) && (
                    <p className="text-[11px] text-amber-800/80">
                      <span className="font-medium">{t('social_chat.original_text', 'Nguyên văn:')}</span> {getSecondaryContent(msg)}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          // Tin nhắn của AI Assistant hoặc Nhân viên gửi cho khách
          return (
            <div key={msg.id} className="flex flex-col items-end self-end max-w-[85%] ml-auto">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                {msg.senderType === 'ai' ? (
                  <>
                    <Bot className="w-3 h-3 text-blue-600" />
                    <span className="font-semibold text-blue-600">{t('social_chat.ai_assistant', 'Trợ lý AI')}</span>
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 text-slate-600" />
                    <span className="font-medium text-slate-700">{msg.senderName}</span>
                  </>
                )}
                <span>{msg.time}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50/90 border border-blue-200/80 shadow-2xs text-slate-800 text-xs flex flex-col gap-1.5 text-left">
                <p className="font-medium text-xs leading-relaxed text-blue-950">
                  {getPrimaryContent(msg)}
                </p>
                {isBilingualActive && getSecondaryContent(msg) && getSecondaryContent(msg) !== getPrimaryContent(msg) && (
                  <p className="text-[11px] text-blue-700/80 border-t border-blue-100 pt-1 leading-normal">
                    <span className="text-blue-500 font-medium">{t('social_chat.original_text', 'Nguyên văn:')}</span> {getSecondaryContent(msg)}
                  </p>
                )}
                {msg.statusNote && (
                  <div className="text-[10px] text-blue-600/70 text-right font-medium">
                    {msg.statusNote}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Dải Công Cụ Hành Động Nhanh (Action Chips) */}
      <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút dùng câu gợi ý AI */}
          <button
            type="button"
            onClick={() => setShowAiSuggestions(!showAiSuggestions)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showAiSuggestions
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('social_chat.use_ai_suggestions', 'Dùng câu gợi ý')}</span>
            {activeSuggestions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                {activeSuggestions.length}
              </span>
            )}
          </button>

          {/* Nút AI tự động trả lời ngay */}
          <button
            type="button"
            onClick={() => onTriggerAutoReply && onTriggerAutoReply(conversation.id)}
            title="Kích hoạt AI tạo câu trả lời và gửi ngay"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 transition cursor-pointer flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Trả lời ngay</span>
          </button>

          {/* Nút chuyển giao người thật */}
          <button
            type="button"
            onClick={() => onTakeoverHuman && onTakeoverHuman(conversation.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            {t('social_chat.switch_human', 'Chuyển người thật')}
          </button>

          {/* Nút hoàn tất */}
          <button
            type="button"
            onClick={() => onResolveConversation && onResolveConversation(conversation.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            {t('social_chat.mark_resolved', 'Đánh dấu hoàn tất')}
          </button>
        </div>

        {/* Nút refresh gợi ý */}
        {showAiSuggestions && onRefreshSuggestions && (
          <button
            type="button"
            onClick={onRefreshSuggestions}
            disabled={isLoadingSuggestions}
            title="Làm mới câu gợi ý từ AI"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSuggestions ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}
      </div>

      {/* 4. Khung Gợi Ý Câu Trả Lời Của AI (Khi bấm mở) */}
      {showAiSuggestions && (
        <div className="p-3 bg-blue-50/60 border-t border-blue-100 flex flex-col gap-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-blue-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('social_chat.ai_suggestions_title', '3 câu trả lời AI gợi ý theo ngữ cảnh (Bấm để chọn):')}</span>
            </p>
            {isLoadingSuggestions && (
              <span className="text-[10px] text-blue-600 flex items-center gap-1 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang phân tích...
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {activeSuggestions.map((sug, idx) => {
              const primaryText = sug.textVi || sug.textJa;
              const secondaryText = sug.textJa || sug.textVi;
              return (
                <div
                  key={sug.id || idx}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-blue-100/50 border border-blue-200/70 text-xs text-slate-800 shadow-2xs transition flex items-start justify-between gap-2 group"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(sug, false)}
                    className="flex-1 text-left cursor-pointer flex flex-col gap-0.5"
                  >
                    <span className="font-semibold text-blue-950 text-xs">
                      {primaryText}
                    </span>
                    {secondaryText && (
                      <span className="text-[11px] text-slate-500">
                        {secondaryText}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(sug, true)}
                    title="Gửi ngay câu này cho khách"
                    className="shrink-0 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-medium text-[10px] flex items-center gap-1 transition cursor-pointer"
                  >
                    <Send className="w-2.5 h-2.5" />
                    <span>Gửi ngay</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Khung Soạn Thảo Tin Nhắn */}
      <div className="p-3.5 border-t border-slate-200/90 bg-white">
        <div className="flex items-center justify-between mb-2">
          {/* Toggle Khách vs Nội bộ */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => setIsInternalMode(false)}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                !isInternalMode 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('social_chat.send_client', 'Gửi khách')}
            </button>
            <button
              type="button"
              onClick={() => setIsInternalMode(true)}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                isInternalMode 
                  ? 'bg-amber-400 text-amber-950 shadow-2xs' 
                  : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              {t('social_chat.internal_note_tab', 'Ghi chú nội bộ')}
            </button>
          </div>

          <span className="text-[10px] text-slate-400 italic">
            {isInternalMode 
              ? t('social_chat.internal_note_hint', '⚠️ Ghi chú nền vàng chỉ nhân viên thấy') 
              : t('social_chat.ai_translate_hint', '🌐 AI sẽ tự động dịch âm thầm sang ngôn ngữ của khách')}
          </span>
        </div>

        {/* Trạng thái dịch âm thầm */}
        {isTranslating && (
          <div className="mb-2 text-[10px] text-blue-600 flex items-center gap-1.5 animate-pulse bg-blue-50/70 border border-blue-200/60 px-2.5 py-1 rounded-lg">
            <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
            <span>AI đang dịch âm thầm sang tiếng của khách và gửi đi...</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isTranslating && handleSend()}
            disabled={isTranslating}
            placeholder={
              isInternalMode 
                ? t('social_chat.placeholder_internal', 'Nhập ghi chú nội bộ cho KTV/Lễ tân...') 
                : t('social_chat.placeholder_client', 'Nhập tin nhắn bằng tiếng Việt, AI sẽ tự động dịch âm thầm...')
            }
            className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition ${
              isInternalMode
                ? 'bg-amber-50/50 border-amber-300 focus:border-amber-500 text-amber-950 placeholder-amber-400/80'
                : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800 placeholder-slate-400'
            }`}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || isTranslating}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
              isInternalMode
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
            }`}
          >
            {isTranslating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isInternalMode ? t('social_chat.save_internal_button', 'Lưu nội bộ') : t('social_chat.send_button', 'Gửi')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
