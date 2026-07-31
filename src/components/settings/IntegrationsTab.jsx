import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import { MessageCircle, Mail, Settings, CheckCircle2, XCircle } from 'lucide-react';

const INTEGRATION_APPS = [
  // Nhóm Thanh toán
  {
    id: 'momo',
    name: 'MoMo Payment',
    description: 'Thanh toán quét mã QR động bằng ví MoMo.',
    icon: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <rect width="100" height="100" rx="20" fill="#A50064" />
        <text x="50%" y="54%" fill="white" fontSize="26" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" alignmentBaseline="middle">MoMo</text>
      </svg>
    ),
    fields: [
      { key: 'partner_code', label: 'Partner Code', type: 'text' },
      { key: 'access_key', label: 'Access Key', type: 'password' },
      { key: 'secret_key', label: 'Secret Key', type: 'password' }
    ]
  },
  {
    id: 'vietqr',
    name: 'VietQR (Bank Transfer)',
    description: 'Tạo mã QR chuyển khoản động liên ngân hàng.',
    icon: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <rect width="100" height="100" rx="20" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="4" />
        <path d="M25 25H40V40H25V25ZM60 25H75V40H60V25ZM25 60H40V75H25V60ZM45 45H55V55H45V45Z" fill="#1E293B"/>
        <text x="50%" y="85%" fill="#1E293B" fontSize="16" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">VietQR</text>
      </svg>
    ),
    fields: [
      { key: 'bank_bin', label: 'Tên Ngân Hàng (Mã BIN)', type: 'text' },
      { key: 'account_number', label: 'Số Tài Khoản', type: 'text' },
      { key: 'account_name', label: 'Tên Chủ Tài Khoản', type: 'text' }
    ]
  },
  // Nhóm Kênh Đặt lịch
  {
    id: 'google_reserve',
    name: 'Reserve with Google',
    description: 'Nhận đặt lịch hẹn trực tiếp từ Google Maps & Search.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    fields: [
      { key: 'merchant_id', label: 'Google Merchant ID', type: 'text' }
    ]
  },
  // Nhóm CRM & Marketing
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Kết nối Fanpage để nhắn tin với khách hàng.',
    icon: (
      <svg viewBox="0 0 36 36" className="w-8 h-8">
        <defs>
          <linearGradient id="messengerGrad" x1="18.878" y1="36" x2="18.878" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#006aff" />
            <stop offset="1" stopColor="#00c6ff" />
          </linearGradient>
        </defs>
        <path d="M18 0C8.06 0 0 7.6 0 16.96c0 5.3 2.65 10.1 6.84 13.3v5.74l6.3-3.48c1.55.43 3.16.66 4.86.66 9.94 0 18-7.6 18-16.96S27.94 0 18 0zm1.74 22.95l-4.47-4.78-8.73 4.78 9.58-10.17 4.54 4.78 8.65-4.78-9.57 10.17z" fill="url(#messengerGrad)"/>
      </svg>
    ),
    fields: [
      { key: 'page_id', label: 'Page ID', type: 'text' },
      { key: 'access_token', label: 'Access Token', type: 'password' }
    ]
  },
  {
    id: 'zalo',
    name: 'Zalo ZNS / OA',
    description: 'Gửi tin nhắn Zalo chăm sóc khách hàng tự động.',
    icon: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <rect width="100" height="100" rx="24" fill="#0068FF" />
        <path d="M72 48.5C72 35.5 62.1 25 50 25C37.9 25 28 35.5 28 48.5C28 54.4 30.4 59.8 34.3 63.9L32 75L41.3 71C44 72 46.9 72.5 50 72.5C62.1 72.5 72 61.9 72 48.5Z" fill="white"/>
        <text x="50%" y="51%" fill="#0068FF" fontSize="19" fontWeight="800" fontFamily="sans-serif" textAnchor="middle" alignmentBaseline="middle">Zalo</text>
      </svg>
    ),
    fields: [
      { key: 'oa_id', label: 'Zalo OA ID', type: 'text' },
      { key: 'access_token', label: 'Access Token', type: 'password' },
      { key: 'refresh_token', label: 'Refresh Token', type: 'password' }
    ]
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Tích hợp WhatsApp API để gửi tin nhắn.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
      </svg>
    ),
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text' },
      { key: 'access_token', label: 'Access Token', type: 'password' }
    ]
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Gửi tin nhắn thông báo tự động qua Telegram.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#24A1DE">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password' },
      { key: 'chat_id', label: 'Chat ID (Tùy chọn)', type: 'text' }
    ]
  },
  {
    id: 'sms_brandname',
    name: 'SMS Brandname',
    description: 'Gửi tin nhắn SMS bằng tên thương hiệu Salon.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        <path d="M8 10h.01"></path>
        <path d="M12 10h.01"></path>
        <path d="M16 10h.01"></path>
      </svg>
    ),
    fields: [
      { key: 'api_url', label: 'API URL', type: 'text' },
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'secret_key', label: 'Secret Key', type: 'password' },
      { key: 'brandname', label: 'Brandname', type: 'text' }
    ]
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Đồng bộ danh sách khách hàng để gửi Email Marketing.',
    icon: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <rect width="100" height="100" rx="20" fill="#FFE01B" />
        <text x="50%" y="54%" fill="#241C15" fontSize="60" fontWeight="bold" fontFamily="serif" textAnchor="middle" alignmentBaseline="middle">M</text>
      </svg>
    ),
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password' },
      { key: 'audience_id', label: 'Audience ID (List ID)', type: 'text' }
    ]
  },
  {
    id: 'email_smtp',
    name: 'Email (SMTP)',
    description: 'Cấu hình máy chủ gửi thư để gửi thông báo/hóa đơn.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    fields: [
      { key: 'host', label: 'SMTP Host', type: 'text' },
      { key: 'port', label: 'SMTP Port', type: 'text' },
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' }
    ]
  },
  // Nhóm Kế toán & Lưu trữ
  {
    id: 'misa',
    name: 'MISA AMIS Kế toán',
    description: 'Đồng bộ doanh thu, phiếu thu chi sang phần mềm MISA.',
    icon: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <rect width="100" height="100" rx="20" fill="#0263B0" />
        <text x="50%" y="54%" fill="white" fontSize="24" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" alignmentBaseline="middle">MISA</text>
      </svg>
    ),
    fields: [
      { key: 'app_id', label: 'App ID', type: 'text' },
      { key: 'access_token', label: 'Access Token', type: 'password' }
    ]
  },
  {
    id: 'aws_s3',
    name: 'AWS S3 Storage',
    description: 'Lưu trữ ảnh hồ sơ khách hàng (Before/After) trên Cloud.',
    icon: (
      <svg viewBox="0 0 100 100" className="w-8 h-8">
        <rect width="100" height="100" rx="20" fill="#232F3E" />
        <text x="50%" y="54%" fill="#FF9900" fontSize="26" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" alignmentBaseline="middle">AWS</text>
      </svg>
    ),
    fields: [
      { key: 'bucket_name', label: 'Bucket Name', type: 'text' },
      { key: 'region', label: 'Region', type: 'text' },
      { key: 'access_key', label: 'Access Key ID', type: 'password' },
      { key: 'secret_key', label: 'Secret Access Key', type: 'password' }
    ]
  }
];

export default function IntegrationsTab() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      // Branch ID is null for global integrations (MVP)
      const data = await base44.entities.Integration.filter({ branch_id: null });
      setIntegrations(data || []);
    } catch (e) {
      console.error('Error fetching integrations:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfig = (app) => {
    const existing = integrations.find(i => i.provider === app.id);
    setEditingApp(app);
    setFormData(existing?.credentials || {});
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const existing = integrations.find(i => i.provider === editingApp.id);
      const payload = {
        provider: editingApp.id,
        status: Object.keys(formData).length > 0 ? 'connected' : 'disconnected',
        credentials: formData,
        branch_id: null // Global
      };

      if (existing) {
        await base44.entities.Integration.update(existing.id, payload);
      } else {
        await base44.entities.Integration.create(payload);
      }
      
      toast.success(`Đã lưu cấu hình ${editingApp.name}`);
      setEditingApp(null);
      fetchIntegrations();
    } catch (error) {
      toast.error('Lỗi khi lưu cấu hình: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (appId) => {
    if (!confirm('Bạn có chắc muốn ngắt kết nối ứng dụng này?')) return;
    try {
      const existing = integrations.find(i => i.provider === appId);
      if (existing) {
        await base44.entities.Integration.delete(existing.id);
        toast.success('Đã ngắt kết nối');
        fetchIntegrations();
      }
    } catch (error) {
      toast.error('Lỗi khi ngắt kết nối: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATION_APPS.map(app => {
          const config = integrations.find(i => i.provider === app.id);
          const isConnected = config?.status === 'connected';

          return (
            <div key={app.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                    {app.icon}
                  </div>
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                      <XCircle className="w-3.5 h-3.5" /> Chưa kết nối
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-slate-800">{app.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{app.description}</p>
              </div>
              
              <div className="mt-5 flex gap-2">
                <button 
                  onClick={() => handleOpenConfig(app)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
                >
                  <Settings className="w-4 h-4" /> Cấu hình
                </button>
                {isConnected && (
                  <button 
                    onClick={() => handleDisconnect(app.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm transition-colors"
                  >
                    Ngắt kết nối
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Config Modal */}
      {editingApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Cấu hình {editingApp.name}</h3>
              <p className="text-sm text-slate-500 mt-1">Nhập thông tin kết nối API được cung cấp bởi nền tảng.</p>
            </div>
            
            <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
              {editingApp.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm outline-none"
                    placeholder={`Nhập ${field.label}...`}
                  />
                </div>
              ))}
              
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
