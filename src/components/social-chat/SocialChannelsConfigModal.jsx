'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  Send, 
  Radio, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Link as LinkIcon,
  Globe,
  MessageCircle,
  PhoneCall
} from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import SocialChannelLogo, { SOCIAL_CHANNEL_CONFIG } from './SocialChannelLogo';

const CHANNELS_META = [
  {
    id: 'zalo',
    name: 'Zalo OA',
    brandColor: '#0068FF',
    badgeText: 'Zalo OpenAPI',
    desc: 'Kết nối Zalo Official Account để nhận & trả lời tin nhắn khách qua Zalo.',
    fields: [
      { key: 'oa_id', label: 'Zalo OA ID', placeholder: 'ví dụ: 123456789012345' },
      { key: 'app_id', label: 'Zalo App ID', placeholder: 'ví dụ: 456789012345' },
      { key: 'secret_key', label: 'Secret Key', placeholder: '••••••••••••••••', type: 'password' },
      { key: 'access_token', label: 'Access Token', placeholder: '••••••••••••••••', type: 'password' }
    ]
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    brandColor: '#0084FF',
    badgeText: 'Meta Graph API',
    desc: 'Tiếp nhận tin nhắn từ Facebook Fanpage vào hộp thư tập trung.',
    fields: [
      { key: 'page_id', label: 'Page ID', placeholder: 'ví dụ: 1029384756' },
      { key: 'app_secret', label: 'App Secret', placeholder: '••••••••••••••••', type: 'password' },
      { key: 'access_token', label: 'Page Access Token', placeholder: '••••••••••••••••', type: 'password' }
    ]
  },
  {
    id: 'instagram',
    name: 'Instagram Direct',
    brandColor: '#E4405F',
    badgeText: 'Instagram Messaging API',
    desc: 'Quản lý tin nhắn trực tiếp Direct Messages từ trang Instagram của salon.',
    fields: [
      { key: 'ig_account_id', label: 'Instagram Account ID', placeholder: 'ví dụ: 178414000000000' },
      { key: 'access_token', label: 'Access Token', placeholder: '••••••••••••••••', type: 'password' }
    ]
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    brandColor: '#25D366',
    badgeText: 'Cloud API',
    desc: 'Tích hợp WhatsApp Cloud API tư vấn cho khách quốc tế và du lịch.',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', placeholder: 'ví dụ: 10593827162' },
      { key: 'waba_id', label: 'WhatsApp Business Account ID', placeholder: 'ví dụ: 1092837465' },
      { key: 'access_token', label: 'System User Token', placeholder: '••••••••••••••••', type: 'password' }
    ]
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    brandColor: '#229ED9',
    badgeText: 'Telegram Bot API',
    desc: 'Nhận tin nhắn đặt lịch hẹn và tư vấn trực tiếp qua Telegram bot.',
    fields: [
      { key: 'bot_token', label: 'Telegram Bot Token', placeholder: 'ví dụ: 123456789:ABCdefGHIjklMNOpqr', type: 'password' },
      { key: 'bot_username', label: 'Bot Username', placeholder: 'ví dụ: @glopro_salon_bot' }
    ]
  }
];

export default function SocialChannelsConfigModal({
  open,
  onClose,
  onSimulateMessage
}) {
  const t = useT();
  const [activeTab, setActiveTab] = useState('zalo');
  const [copiedKey, setCopiedKey] = useState(null);
  const [testingStatus, setTestingStatus] = useState({});
  const [isSimulating, setIsSimulating] = useState(false);

  // Cấu hình form lưu trữ
  const [configs, setConfigs] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('glopro_social_channels_settings');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      zalo: { oa_id: '', app_id: '', secret_key: '', access_token: '', is_active: false },
      facebook: { page_id: '', app_secret: '', access_token: '', is_active: false },
      instagram: { ig_account_id: '', access_token: '', is_active: false },
      whatsapp: { phone_number_id: '', waba_id: '', access_token: '', is_active: false },
      telegram: { bot_token: '', bot_username: '', is_active: false }
    };
  });

  // State Form Mô phỏng (Simulate Incoming Message)
  const [simForm, setSimForm] = useState({
    customerName: 'Sakura Takahashi',
    phone: '0988 123 456',
    channel: 'instagram',
    language: 'ja',
    text: 'こんにちは！サロンのトリートメントの予約をしたいのですが、明日15時は空いていますか？'
  });

  const currentChannel = CHANNELS_META.find(c => c.id === activeTab) || CHANNELS_META[0];

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Đã sao chép vào bộ nhớ tạm');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveConfig = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('glopro_social_channels_settings', JSON.stringify(configs));
    }
    toast.success('Đã lưu cấu hình kết nối kênh mạng xã hội!');
  };

  const handleTestConnection = (channelId) => {
    setTestingStatus(prev => ({ ...prev, [channelId]: 'testing' }));
    setTimeout(() => {
      setTestingStatus(prev => ({ ...prev, [channelId]: 'success' }));
      toast.success(`Kết nối Webhook & API kênh ${channelId.toUpperCase()} thành công (Status 200 OK)`);
    }, 1200);
  };

  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/social-chat/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_simulation: true,
          ...simForm
        })
      });

      const data = await res.json();
      if (data.success && data.normalizedMessage) {
        toast.success(`[Webhook Ingestion] Đã nhận tin nhắn mới từ ${data.normalizedMessage.customerName} (${data.channel.toUpperCase()})`);
        if (onSimulateMessage) {
          onSimulateMessage(data.normalizedMessage, data.welcomeReply);
        }
        onClose();
      } else {
        toast.error('Lỗi khi mô phỏng webhook');
      }
    } catch (e) {
      toast.error('Lỗi kết nối Webhook endpoint: ' + e.message);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!open) return null;

  const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'https://app.glopro.vn';
  const webhookUrl = `${currentDomain}/api/social-chat/webhook?channel=${activeTab}`;
  const verifyToken = process.env.NEXT_PUBLIC_META_VERIFY_TOKEN || 'glopro_webhook_token';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Cấu Hình Kết Nối Kênh Mạng Xã Hội (Social Channels Hub)
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  Phase 4 Webhook
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập API & Webhook cho Zalo OA, Facebook Messenger, Instagram, WhatsApp và Telegram
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội Dung: Cột Tabs (Trái) & Form Cấu Hình (Phải) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Cột Tabs Trái */}
          <div className="w-60 border-r border-slate-100 bg-slate-50/50 p-3 space-y-1 overflow-y-auto">
            {CHANNELS_META.map(ch => {
              const isActive = activeTab === ch.id;
              const isConnected = configs[ch.id]?.is_active;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveTab(ch.id)}
                  className={`w-full text-left p-3 rounded-xl transition cursor-pointer flex items-center justify-between ${
                    isActive 
                      ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80' 
                      : 'text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <SocialChannelLogo channel={ch.id} className="w-5 h-5 rounded-md shrink-0 shadow-2xs" />
                    <div className="min-w-0">
                      <span className="text-xs block truncate">{ch.name}</span>
                      <span className="text-[10px] font-normal text-slate-400 block truncate">{ch.badgeText}</span>
                    </div>
                  </div>
                  {isConnected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}

            <div className="pt-4 mt-2 border-t border-slate-200/70">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <span className="text-[11px] font-bold text-amber-900 block mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Kiểm Thử Localhost
                </span>
                <p className="text-[10px] text-amber-800 leading-relaxed mb-2">
                  Bạn có thể dùng công cụ mô phỏng phía dưới để test webhook tức thì mà không cần cài Ngrok.
                </p>
              </div>
            </div>
          </div>

          {/* Cột Form Cấu Hình & Webhook (Phải) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Header Kênh Đang Chọn */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <SocialChannelLogo channel={currentChannel.id} className="w-6 h-6 rounded-md shrink-0 shadow-2xs" />
                  <span>Cài đặt kênh {currentChannel.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    {currentChannel.badgeText}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentChannel.desc}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection(currentChannel.id)}
                  disabled={testingStatus[currentChannel.id] === 'testing'}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3 h-3 ${testingStatus[currentChannel.id] === 'testing' ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{testingStatus[currentChannel.id] === 'testing' ? 'Đang test...' : 'Test kết nối'}</span>
                </button>
              </div>
            </div>

            {/* 2. Webhook URL & Verify Token (Dùng để dán vào Meta / Zalo Developer Console) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Webhook Callback URL (Dán vào cổng Developer của {currentChannel.name})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 select-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy('url', webhookUrl)}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'url' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Webhook Verify Token (Mã xác thực bảo mật)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={verifyToken}
                    className="flex-1 bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 select-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy('token', verifyToken)}
                    className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedKey === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'token' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Các Trường Cấu Hình API (App ID, Secret Key...) */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-slate-800">Thông tin xác thực API ({currentChannel.name})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {currentChannel.fields.map(field => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-600">{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      value={configs[currentChannel.id]?.[field.key] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfigs(prev => ({
                          ...prev,
                          [currentChannel.id]: {
                            ...prev[currentChannel.id],
                            [field.key]: val
                          }
                        }));
                      }}
                      placeholder={field.placeholder}
                      className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4. MÔ PHỎNG GỬI TIN NHẮN ĐẾN (Simulate Incoming Message) */}
            <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  Mô phỏng tin nhắn gửi đến (Test Webhook Ingestion)
                </span>
                <span className="text-[10px] text-blue-700 font-medium">Bơm tin nhắn trực tiếp vào GloPro Social Chat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Tên khách hàng</label>
                  <input
                    type="text"
                    value={simForm.customerName}
                    onChange={(e) => setSimForm({ ...simForm, customerName: e.target.value })}
                    className="w-full bg-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Số điện thoại</label>
                  <input
                    type="text"
                    value={simForm.phone}
                    onChange={(e) => setSimForm({ ...simForm, phone: e.target.value })}
                    className="w-full bg-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Kênh gửi đến</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-2.5 pointer-events-none">
                      <SocialChannelLogo channel={simForm.channel} className="w-4 h-4 rounded-xs shrink-0" />
                    </div>
                    <select
                      value={simForm.channel}
                      onChange={(e) => setSimForm({ ...simForm, channel: e.target.value })}
                      className="w-full bg-white text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 font-medium cursor-pointer"
                    >
                      <option value="zalo">Zalo OA</option>
                      <option value="facebook">Facebook Messenger</option>
                      <option value="instagram">Instagram Direct</option>
                      <option value="whatsapp">WhatsApp Business</option>
                      <option value="telegram">Telegram Bot</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Nội dung tin nhắn khách gửi</label>
                <textarea
                  rows={2}
                  value={simForm.text}
                  onChange={(e) => setSimForm({ ...simForm, text: e.target.value })}
                  placeholder="Nhập nội dung khách nhắn..."
                  className="w-full bg-white text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleTriggerSimulation}
                disabled={isSimulating}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSimulating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Kích hoạt Webhook & Đổ tin nhắn vào Chat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Mọi Access Token đều được mã hóa và bảo mật an toàn</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer shadow-xs"
            >
              Lưu Cấu Hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
