'use client';
import React, { useState } from 'react';
import { Link2, Copy, Check, ExternalLink, QrCode, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from '@/components/Layout';

export default function BookingLinkCard({ setting, onToggle }) {
  const [copied, setCopied] = useState(false);
  const slug = setting?.slug || '';
  const isActive = setting?.is_active !== false;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://glopro.app';
  const bookingUrl = slug ? `${origin}/book/${slug}` : null;

  const handleCopy = () => {
    if (!bookingUrl) return toast.error('Vui lòng cài đặt slug trước');
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopied(true);
      toast.success('Đã copy link booking!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePreview = () => {
    if (!bookingUrl) return toast.error('Vui lòng cài đặt slug trước');
    window.open(bookingUrl, '_blank');
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 shadow-xl transition-all ${
      isActive
        ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600'
        : 'bg-gradient-to-br from-slate-400 to-slate-500'
    }`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-10 -translate-x-10" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Link Đặt Lịch</h2>
              <p className="text-white/70 text-xs">Chia sẻ với khách hàng</p>
            </div>
          </div>

          {/* Active toggle */}
          <button
            onClick={onToggle}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-all"
          >
            {isActive
              ? <ToggleRight className="w-4 h-4 text-white" />
              : <ToggleLeft className="w-4 h-4 text-white/60" />
            }
            <span className="text-xs font-semibold text-white">
              {isActive ? 'Đang mở' : 'Đang tắt'}
            </span>
          </button>
        </div>

        {/* URL box */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
          <span className="text-white/60 text-xs font-mono truncate flex-1">
            {bookingUrl || `${origin}/book/your-salon-slug`}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-pink-600 hover:bg-pink-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã copy!' : 'Copy link'}
          </button>
          <button
            onClick={handlePreview}
            className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Xem trước
          </button>
        </div>

        {!slug && (
          <p className="text-white/60 text-xs mt-3 text-center">
            ⚠️ Hãy điền slug trong tab "Cài đặt" để kích hoạt link booking
          </p>
        )}
      </div>
    </div>
  );
}
