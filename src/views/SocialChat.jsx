'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Sparkles, Calendar, MessageSquare, Bot, RefreshCw, Zap, Globe } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import SocialConversationList from '@/components/social-chat/SocialConversationList';
import SocialChatThread from '@/components/social-chat/SocialChatThread';
import SocialBookingDraftSidebar from '@/components/social-chat/SocialBookingDraftSidebar';
import SocialChannelsConfigModal from '@/components/social-chat/SocialChannelsConfigModal';
import SocialChannelLogo from '@/components/social-chat/SocialChannelLogo';
import { INITIAL_CONVERSATIONS } from '@/components/social-chat/mockSocialData';
import { 
  translateMessage, 
  extractBookingDraft, 
  getAutoReply, 
  getReplySuggestions 
} from '@/lib/socialChatAiService';
import { 
  parseNaturalDateTime, 
  syncOrCreateCustomer, 
  fetchCustomerCrmDetails 
} from '@/lib/socialChatCrmHelper';

export default function SocialChat() {
  const t = useT();
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState('conv-1');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Trạng thái AI Engine & Dữ liệu thực thể
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

  // 1. Tải danh mục Dịch vụ và Nhân viên thực tế từ CSDL GloPro
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      base44.entities.Service ? base44.entities.Service.list().catch(() => []) : Promise.resolve([]),
      base44.entities.Staff ? base44.entities.Staff.list().catch(() => []) : Promise.resolve([])
    ]).then(([servicesData, staffData]) => {
      if (!isMounted) return;
      if (Array.isArray(servicesData) && servicesData.length > 0) {
        setServices(servicesData);
      }
      if (Array.isArray(staffData) && staffData.length > 0) {
        setStaff(staffData);
      }
    }).catch(err => {
      console.warn('[SocialChat] Database fetch notice:', err);
    });

    return () => { isMounted = false; };
  }, []);

  // 2. Tra cứu & Đồng bộ hồ sơ CRM thực tế khi chuyển đổi cuộc trò chuyện
  useEffect(() => {
    if (!activeConversation?.phone) return;
    let isMounted = true;

    fetchCustomerCrmDetails(activeConversation.phone).then(realCrm => {
      if (!isMounted || !realCrm) return;
      setConversations(prev => prev.map(c => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            customerId: realCrm.id,
            crmProfile: {
              ...c.crmProfile,
              ...realCrm
            }
          };
        }
        return c;
      }));
    });

    return () => { isMounted = false; };
  }, [activeConversationId, activeConversation?.phone]);

  // 3. Tự động sinh gợi ý câu trả lời thông minh khi đổi hội thoại
  const loadSuggestions = useCallback(async (conv) => {
    if (!conv) return;
    setIsLoadingSuggestions(true);
    try {
      const suggestions = await getReplySuggestions({
        conversation: conv,
        services,
        staff,
        currentDraft: conv.bookingDraft || {}
      });
      setDynamicSuggestions(suggestions);
    } catch (err) {
      console.warn('[SocialChat] Load suggestions error:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [services, staff]);

  useEffect(() => {
    if (activeConversation) {
      loadSuggestions(activeConversation);
    }
  }, [activeConversationId, loadSuggestions]);

  // 4. Kích hoạt AI trích xuất thông tin phiếu đặt lịch & chấm điểm tiềm năng
  const triggerAiExtraction = useCallback(async (conv) => {
    if (!conv) return;
    setIsAiExtracting(true);
    try {
      const res = await extractBookingDraft({
        conversation: conv,
        services,
        staff,
        currentDraft: conv.bookingDraft || {}
      });

      if (res?.success && res.draft) {
        setConversations(prev => prev.map(c => {
          if (c.id === conv.id) {
            return {
              ...c,
              leadScore: res.leadScore ?? c.leadScore,
              bookingDraft: {
                ...c.bookingDraft,
                ...res.draft
              }
            };
          }
          return c;
        }));
      }
    } catch (err) {
      console.warn('[SocialChat] AI extraction error:', err);
    } finally {
      setIsAiExtracting(false);
    }
  }, [services, staff]);

  // 5. Gửi tin nhắn khách hàng (Dịch âm thầm 100% bằng AI)
  const handleSendMessage = async (convId, text) => {
    if (!text || !text.trim()) return;

    setIsTranslating(true);
    const targetLang = activeConversation?.language || 'ja';
    let translated = text;

    try {
      // Dịch âm thầm sang tiếng của khách
      const res = await translateMessage({ text, sourceLang: 'vi', targetLang });
      if (res?.translatedText) {
        translated = res.translatedText;
      }
    } catch (err) {
      console.warn('[SocialChat] Translation notice:', err);
    }

    const newMsg = {
      id: `msg_${Date.now()}`,
      senderType: 'staff',
      senderName: t('social_chat.receptionist', 'Lễ tân'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contentVi: text,
      contentJa: translated,
      isInternal: false
    };

    let updatedConv = null;
    setConversations(prev => prev.map(conv => {
      if (conv.id === convId) {
        updatedConv = {
          ...conv,
          lastMessage: text,
          lastMessageJa: translated,
          lastMessageTime: newMsg.time,
          messages: [...conv.messages, newMsg]
        };
        return updatedConv;
      }
      return conv;
    }));

    setIsTranslating(false);
    toast.success(t('social_chat.toast_sent_success', 'Đã gửi (AI tự động dịch sang ngôn ngữ khách)'));

    // Tự động phân tích lại phiếu lịch hẹn và điểm số sau khi gửi tin
    if (updatedConv) {
      triggerAiExtraction(updatedConv);
      loadSuggestions(updatedConv);
    }
  };

  // 6. Thêm ghi chú nội bộ màu vàng (内部メモ)
  const handleAddInternalNote = (convId, noteText) => {
    const newNote = {
      id: `note_${Date.now()}`,
      senderType: 'staff',
      senderName: t('social_chat.internal_note', 'Ghi chú nội bộ'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contentVi: noteText,
      contentJa: noteText,
      isInternal: true
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === convId) {
        return {
          ...conv,
          messages: [...conv.messages, newNote]
        };
      }
      return conv;
    }));

    toast.info(t('social_chat.toast_internal_saved', 'Đã lưu ghi chú nội bộ (Chỉ nhân viên salon thấy)'));
  };

  // 7. Chuyển giao người thật xử lý
  const handleTakeoverHuman = (convId) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === convId) {
        const hasTag = conv.tags.some(tg => tg.id === 'needs_human');
        return {
          ...conv,
          status: 'needs_human',
          tags: hasTag 
            ? conv.tags 
            : [{ id: 'needs_human', label: 'Cần người tiếp nhận', labelJa: '有人対応', color: 'amber' }, ...conv.tags]
        };
      }
      return conv;
    }));
    toast.warning(t('social_chat.toast_takeover_human', 'Đã kích hoạt chế độ "Có người tiếp nhận", AI sẽ tạm dừng tự động trả lời.'));
  };

  // 8. Đánh dấu hoàn tất hội thoại
  const handleResolveConversation = (convId) => {
    toast.success(t('social_chat.toast_resolved', 'Hội thoại đã được đánh dấu hoàn tất.'));
  };

  // 9. Tự động phản hồi bằng AI Auto-Pilot
  const handleTriggerAutoReply = async (convId) => {
    const targetConv = conversations.find(c => c.id === convId);
    if (!targetConv) return;

    setIsAiExtracting(true);
    try {
      const res = await getAutoReply({ conversation: targetConv, services, staff });
      const aiMsg = {
        id: `ai_${Date.now()}`,
        senderType: 'ai',
        senderName: t('social_chat.ai_assistant', 'Trợ lý AI'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        contentVi: res.replyTextVi || res.replyText,
        contentJa: res.replyText,
        isInternal: false
      };

      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          const updated = {
            ...c,
            lastMessage: aiMsg.contentVi,
            lastMessageJa: aiMsg.contentJa,
            lastMessageTime: aiMsg.time,
            leadScore: res.leadScore || c.leadScore,
            messages: [...c.messages, aiMsg]
          };
          triggerAiExtraction(updated);
          loadSuggestions(updated);
          return updated;
        }
        return c;
      }));

      toast.success(t('social_chat.ai_replied_toast', 'AI Auto-Pilot đã phản hồi khách hàng'));
    } catch (err) {
      toast.error('AI Auto-Pilot tạm thời bận, vui lòng thử lại');
    } finally {
      setIsAiExtracting(false);
    }
  };

  // 10. Nút quét lại với AI (Re-scan AI) trên Sidebar
  const handleRescanAi = () => {
    if (activeConversation) {
      triggerAiExtraction(activeConversation);
      loadSuggestions(activeConversation);
      toast.info(t('social_chat.toast_rescanning', 'AI đang quét lại toàn bộ hội thoại và khớp dữ liệu...'));
    }
  };

  // 11. Phase 3: Tạo lịch hẹn từ phiếu nháp AI & Đồng bộ CRM Khách Hàng (1-Click Booking & CRM Sync)
  const handleCreateAppointment = async (draft, conv) => {
    toast.loading(t('social_chat.preparing_booking', 'Đang đồng bộ hồ sơ khách & chuẩn bị lịch hẹn...'), { id: 'booking-prep' });

    // 1. Đồng bộ hoặc tự động tạo hồ sơ khách hàng mới vào CSDL CRM
    let customerRecord = null;
    try {
      const syncResult = await syncOrCreateCustomer({
        customerName: draft.customerName || conv.customerName,
        phone: draft.phone || conv.phone,
        channel: conv.channel,
        avatar: conv.avatar
      });
      customerRecord = syncResult?.customer || null;
    } catch (e) {
      console.warn('[SocialChat] Customer sync notice:', e);
    }

    // 2. Tự động quy đổi ngày tự nhiên sang YYYY-MM-DD và giờ chuẩn HH:MM
    const { date, time } = parseNaturalDateTime(draft.date, draft.time);

    // 3. Mở modal đặt lịch hẹn AppointmentModal của GloPro với đầy đủ trường đã khớp
    if (typeof window !== 'undefined') {
      const detail = {
        customer_id: customerRecord?.id || conv.customerId || '',
        customer_name: customerRecord?.name || draft.customerName || conv.customerName,
        customer_phone: (customerRecord?.phone || draft.phone || conv.phone || '').replace(/\s+/g, ''),
        date: date,
        start_time: time,
        source: 'social_chat',
        services: [
          {
            service_id: draft.serviceId || '',
            service_name: draft.serviceName || 'Dịch vụ Salon',
            price: Number(draft.servicePrice || 0),
            duration_minutes: Number(draft.durationMinutes || 60),
            staff_id: draft.staffId || '',
            staff_name: draft.stylist || ''
          }
        ],
        note: `[GloPro Social Chat] Nguồn: ${conv.channelLabel || conv.channel.toUpperCase()}. Khách đặt lịch qua hộp thư mạng xã hội.`
      };

      window.dispatchEvent(new CustomEvent('open-appointment-modal', { detail }));
    }

    // 4. Cập nhật điểm số chốt lịch lên 100% và ghi nhận trạng thái
    setConversations(prev => prev.map(c => {
      if (c.id === conv.id) {
        return {
          ...c,
          leadScore: 100,
          customerId: customerRecord?.id || c.customerId,
          bookingDraft: {
            ...c.bookingDraft,
            date: date,
            time: time,
            missingInfo: t('appt.modal.status_done', 'Đã chuyển thông tin vào form lịch hẹn')
          }
        };
      }
      return c;
    }));

    toast.dismiss('booking-prep');
    toast.success(t('social_chat.toast_draft_created', 'Đã chuyển thông tin vào form lịch hẹn cho khách {name}!', { name: draft.customerName || conv.customerName }));
  };

  // 12. Phase 4: Tiếp nhận tin nhắn từ Webhook Ingestion (Zalo, Meta, WhatsApp, Telegram, Simulation)
  const handleIncomingWebhookMessage = (normalized, welcomeReply) => {
    const channelId = normalized.channel;
    const msgId = normalized.id || `msg_${Date.now()}`;
    const newMsg = {
      id: msgId,
      senderType: 'customer',
      senderName: normalized.customerName,
      time: normalized.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contentVi: normalized.language === 'vi' ? normalized.text : `[Bản dịch] ${normalized.text}`,
      contentJa: normalized.text,
      isInternal: false
    };

    // Kiểm tra xem khách đã có trong danh sách chat chưa
    const existingIndex = conversations.findIndex(c => 
      (normalized.phone && c.phone && c.phone.replace(/\s+/g, '') === normalized.phone.replace(/\s+/g, '')) ||
      (c.externalSenderId && c.externalSenderId === normalized.externalSenderId)
    );

    if (existingIndex >= 0) {
      const existingConv = conversations[existingIndex];
      const updated = {
        ...existingConv,
        lastMessage: newMsg.contentVi,
        lastMessageJa: newMsg.contentJa,
        lastMessageTime: newMsg.time,
        unreadCount: (existingConv.unreadCount || 0) + 1,
        messages: [...existingConv.messages, newMsg]
      };

      setConversations(prev => {
        const copy = [...prev];
        copy.splice(existingIndex, 1);
        return [updated, ...copy];
      });
      setActiveConversationId(updated.id);
      triggerAiExtraction(updated);
      loadSuggestions(updated);

      if (isAutoPilot && welcomeReply) {
        setTimeout(() => {
          handleTriggerAutoReply(updated.id);
        }, 1200);
      }
    } else {
      // Khách hàng mới liên hệ lần đầu
      const newConvId = `conv_${Date.now()}`;
      const newConv = {
        id: newConvId,
        channel: channelId,
        channelLabel: `${channelId.toUpperCase()}: ${normalized.phone || 'Online'}`,
        externalSenderId: normalized.externalSenderId,
        customerName: normalized.customerName,
        phone: normalized.phone,
        avatar: normalized.avatar || '',
        lastMessageTime: newMsg.time,
        unreadCount: 1,
        leadScore: 55,
        status: 'ai_handled',
        tags: [
          { id: 'new_customer', label: 'Khách mới', labelJa: '新規客', color: 'blue' },
          { id: 'ai_replied', label: 'AI tiếp nhận', labelJa: 'AI対応', color: 'emerald' }
        ],
        lastMessage: newMsg.contentVi,
        lastMessageJa: newMsg.contentJa,
        language: normalized.language || 'vi',
        bookingDraft: {
          customerName: normalized.customerName,
          phone: normalized.phone,
          serviceName: '',
          date: 'Chưa rõ',
          time: 'Chưa rõ',
          stylist: 'Chưa chọn',
          branch: 'GloPro Flagship Salon',
          missingInfo: 'Cần xác nhận dịch vụ & thời gian',
          isComplete: false
        },
        crmProfile: {
          tier: 'Khách mới',
          totalSpent: 0,
          visitCount: 0,
          notes: `Khách hàng mới tiếp cận qua Webhook kênh ${channelId.toUpperCase()}.`
        },
        messages: [newMsg]
      };

      // Tự động gửi tin nhắn chào mừng (Welcome message) nếu bật AI Auto-Pilot
      if (isAutoPilot && welcomeReply) {
        const aiWelcome = {
          id: `welcome_${Date.now()}`,
          senderType: 'ai',
          senderName: t('social_chat.ai_assistant', 'Trợ lý AI'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          contentVi: welcomeReply.textVi,
          contentJa: welcomeReply.textJa,
          isInternal: false
        };
        newConv.messages.push(aiWelcome);
        newConv.lastMessage = aiWelcome.contentVi;
        newConv.lastMessageJa = aiWelcome.contentJa;
      }

      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConvId);
      triggerAiExtraction(newConv);
      loadSuggestions(newConv);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-100px)] min-h-[600px] flex flex-col pb-2">
      {/* Thanh tiêu đề phân hệ */}
      <div className="flex items-center justify-between pb-3 pt-1 px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                {t('social_chat.title', 'GloPro Social Chat')}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 leading-none shrink-0 self-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t('social_chat.ai_concierge', 'AI Concierge Song Ngữ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('social_chat.subtitle', 'Hộp thư mạng xã hội hợp nhất (Zalo OA, Facebook Messenger, WhatsApp, Instagram, Telegram)')}
            </p>
          </div>
        </div>

        {/* Thanh điều khiển AI Concierge & Auto-Pilot */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Nút Kết Nối Kênh & Webhook Hub */}
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Kết nối kênh & Webhook</span>
          </button>

          {/* Nút bật/tắt AI Auto-Pilot */}
          <button
            type="button"
            onClick={() => {
              const next = !isAutoPilot;
              setIsAutoPilot(next);
              toast.info(next 
                ? t('social_chat.autopilot_on', 'Đã BẬT AI Auto-Pilot: Trợ lý AI sẽ tự động phản hồi khách hàng') 
                : t('social_chat.autopilot_off', 'Đã TẮT AI Auto-Pilot: Chuyển sang chế độ Co-pilot gợi ý')
              );
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
              isAutoPilot 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAutoPilot ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
            <span>{isAutoPilot ? t('social_chat.autopilot_active', 'AI Auto-Pilot: Bật') : t('social_chat.autopilot_inactive', 'AI Auto-Pilot: Tắt')}</span>
          </button>

          {/* Badge hệ thống AI Gemini */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl shadow-2xs leading-none">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px]">{t('social_chat.gemini_active', 'Gemini AI Active')}</span>
          </div>
        </div>
      </div>

      {/* Khung Giao Diện 3 Cột Chuẩn */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-12">
        {/* Cột 1: Danh Sách Hội Thoại (3 cột / 12) ~ 25% */}
        <div className="col-span-12 md:col-span-3 h-full overflow-hidden">
          <SocialConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            selectedChannel={selectedChannel}
            onSelectChannel={setSelectedChannel}
            onOpenConfigModal={() => setIsConfigModalOpen(true)}
          />
        </div>

        {/* Cột 2: Khung Chat Song Ngữ & Ghi Chú Nội Bộ (6 cột / 12) ~ 50% */}
        <div className="col-span-12 md:col-span-6 h-full overflow-hidden">
          <SocialChatThread
            conversation={activeConversation}
            onSendMessage={handleSendMessage}
            onAddInternalNote={handleAddInternalNote}
            onTakeoverHuman={handleTakeoverHuman}
            onResolveConversation={handleResolveConversation}
            onTriggerAutoReply={handleTriggerAutoReply}
            isAutoPilot={isAutoPilot}
            isTranslating={isTranslating}
            suggestions={dynamicSuggestions}
            isLoadingSuggestions={isLoadingSuggestions}
            onRefreshSuggestions={() => loadSuggestions(activeConversation)}
          />
        </div>

        {/* Cột 3: Phiếu Nháp Đặt Lịch Thông Minh & CRM (3 cột / 12) ~ 25% */}
        <div className="col-span-12 md:col-span-3 h-full overflow-hidden">
          <SocialBookingDraftSidebar
            conversation={activeConversation}
            onCreateAppointment={handleCreateAppointment}
            onRescanAi={handleRescanAi}
            isAiExtracting={isAiExtracting}
            services={services}
            staff={staff}
          />
        </div>
      </div>

      {/* Modal Cấu Hình Kênh Mạng Xã Hội & Webhook (Phase 4) */}
      <SocialChannelsConfigModal
        open={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSimulateMessage={handleIncomingWebhookMessage}
      />
    </div>
  );
}
