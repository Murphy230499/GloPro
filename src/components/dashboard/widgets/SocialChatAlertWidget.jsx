'use client';
import React from 'react';
import { MessageSquareText, Sparkles, ArrowRight, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function SocialChatAlertWidget({ tintColor = '#FF3B7A' }) {
  // Mock data hoặc đọc từ localStorage Social Chat nếu có
  const channels = [
    { name: 'Zalo OA', count: 3, color: '#0068FF' },
    { name: 'Facebook', count: 2, color: '#1877F2' },
    { name: 'WhatsApp', count: 1, color: '#25D366' },
    { name: 'Instagram', count: 0, color: '#E4405F' }
  ];

  const totalUnread = channels.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="ios-glass-card p-4 md:p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tintColor}15`, color: tintColor }}>
            <MessageSquareText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">
              Hộp Thư Mạng Xã Hội (Social Inbox)
            </h3>
            <p className="text-[11px] text-slate-400">
              Facebook, Zalo, WhatsApp, Instagram
            </p>
          </div>
        </div>

        <Link
          href="/social-chat"
          className="text-[11px] font-bold flex items-center gap-1 hover:underline text-slate-500 hover:text-slate-800"
        >
          Hộp thư <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3 my-auto">
        {/* Banner tóm tắt tin nhắn */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <MessageCircle className="w-6 h-6 text-slate-600" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                {totalUnread > 0 ? `${totalUnread} tin nhắn khách hàng mới` : 'Hộp thư đang được đồng bộ'}
              </div>
              <div className="text-[10px] text-slate-400">
                AI Concierge đang hỗ trợ tư vấn tự động
              </div>
            </div>
          </div>

          <Link
            href="/social-chat"
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-2xs hover:opacity-95 transition-all"
            style={{ background: tintColor }}
          >
            Mở Chat
          </Link>
        </div>

        {/* Danh sách các kênh MXH */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {channels.map((ch) => (
            <div key={ch.name} className="p-2 rounded-xl bg-white/70 border border-slate-100">
              <div className="text-xs font-extrabold" style={{ color: ch.color }}>
                {ch.count}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">
                {ch.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
