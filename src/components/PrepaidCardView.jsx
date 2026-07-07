import React from 'react';
import { formatVND } from '@/lib/format';

function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xFF) + percent));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function PrepaidCardView({ card, size = 'md' }) {
  const color = card.color || '#FF6B9D';
  const dims = size === 'sm' ? 'h-36' : 'h-44';
  const gradient = `linear-gradient(135deg, ${color}, ${shadeColor(color, -50)})`;

  return (
    <div className={`relative ${dims} rounded-2xl overflow-hidden shadow-lg p-4 flex flex-col justify-between text-white`}
      style={{ background: gradient }}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-4 w-28 h-28 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] opacity-80 font-medium uppercase tracking-widest">Prepaid</div>
          <div className="font-bold text-lg leading-tight mt-0.5">{card.name || 'Thẻ tiền mặt'}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="w-7 h-5 rounded-md bg-yellow-300/80" />
          <div className="w-4 h-4 rounded-full border border-white/30" />
        </div>
      </div>

      <div className="relative">
        <div className="text-[10px] opacity-70 mb-0.5">Mệnh giá</div>
        <div className="font-bold text-xl drop-shadow-sm">{formatVND(card.face_value)}</div>
      </div>

      <div className="relative flex items-end justify-between">
        <div>
          <div className="text-[9px] opacity-60 uppercase tracking-wide">Mã thẻ</div>
          <div className="font-mono text-sm tracking-wide">{card.card_code || '•••• •••• •••• ••••'}</div>
        </div>
        <div className="text-right">
          {card.expiry_months > 0 && <div className="text-[9px] opacity-70">Hạn: {card.expiry_months}T</div>}
          {card.selling_price != null && card.selling_price !== card.face_value && (
            <div className="text-[9px] opacity-70">Bán: {formatVND(card.selling_price)}</div>
          )}
        </div>
      </div>
    </div>
  );
}