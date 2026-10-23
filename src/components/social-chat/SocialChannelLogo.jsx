'use client';

import React from 'react';

/**
 * Bộ Icon & Logo chuẩn vector chính thức cho các ứng dụng mạng xã hội:
 * - Zalo OA
 * - Facebook Messenger
 * - Instagram Direct
 * - WhatsApp Business
 * - Telegram
 */

export function ZaloIcon({ className = "w-4 h-4", style = {}, ...props }) {
  return (
    <svg 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      {...props}
    >
      <rect width="48" height="48" rx="10" fill="#0068FF" />
      <path 
        d="M24 8.5C15.44 8.5 8.5 14.86 8.5 22.71C8.5 27.24 10.84 31.25 14.52 33.88L13.11 38.64C12.94 39.22 13.56 39.73 14.09 39.42L19.82 36.03C21.16 36.6 22.63 36.92 24.16 36.92C32.72 36.92 39.66 30.56 39.66 22.71C39.66 14.86 32.72 8.5 24 8.5Z" 
        fill="#FFFFFF"
      />
      <text 
        x="24" 
        y="24" 
        fill="#0068FF" 
        fontSize="11.5" 
        fontWeight="900" 
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
        textAnchor="middle" 
        dominantBaseline="central"
        letterSpacing="-0.3px"
      >
        Zalo
      </text>
    </svg>
  );
}

export function MessengerIcon({ className = "w-4 h-4", style = {}, ...props }) {
  return (
    <svg 
      viewBox="0 0 36 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      {...props}
    >
      <defs>
        <linearGradient id="gloproMessengerGrad" x1="18" y1="36" x2="18" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0062FF" />
          <stop offset="50%" stopColor="#0084FF" />
          <stop offset="100%" stopColor="#00C6FF" />
        </linearGradient>
      </defs>
      <path 
        d="M18 0C8.06 0 0 7.6 0 16.96c0 5.3 2.65 10.1 6.84 13.3v5.74l6.3-3.48c1.55.43 3.16.66 4.86.66 9.94 0 18-7.6 18-16.96S27.94 0 18 0zm1.74 22.95l-4.47-4.78-8.73 4.78 9.58-10.17 4.54 4.78 8.65-4.78-9.57 10.17z" 
        fill="url(#gloproMessengerGrad)"
      />
    </svg>
  );
}

export function InstagramIcon({ className = "w-4 h-4", style = {}, ...props }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      {...props}
    >
      <defs>
        <radialGradient id="gloproIgRadial" cx="0.2" cy="1" r="1.1">
          <stop offset="0%" stopColor="#FFDD55" />
          <stop offset="10%" stopColor="#FFDD55" />
          <stop offset="50%" stopColor="#FF543E" />
          <stop offset="100%" stopColor="#C837AB" />
        </radialGradient>
        <radialGradient id="gloproIgRadialBlue" cx="0.8" cy="0" r="0.8">
          <stop offset="0%" stopColor="#3771C8" />
          <stop offset="100%" stopColor="#C837AB" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#gloproIgRadial)" />
      <rect width="32" height="32" rx="9" fill="url(#gloproIgRadialBlue)" />
      <rect x="7" y="7" width="18" height="18" rx="5" stroke="#FFFFFF" strokeWidth="2.2" fill="none" />
      <circle cx="16" cy="16" r="4.3" stroke="#FFFFFF" strokeWidth="2.2" fill="none" />
      <circle cx="21.2" cy="10.8" r="1.3" fill="#FFFFFF" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "w-4 h-4", style = {}, ...props }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="#25D366" />
      <path 
        fill="#FFFFFF" 
        d="M23.12 19.18c-.4-.2-2.34-1.16-2.7-1.29-.36-.13-.63-.2-.89.2-.26.4-1.02 1.29-1.25 1.55-.23.26-.46.3-.86.1-.4-.2-1.67-.62-3.19-1.97-1.18-1.05-1.97-2.35-2.2-2.75-.23-.4-.02-.61.18-.81.18-.18.4-.46.6-.7.2-.23.26-.4.4-.66.13-.26.07-.5-.03-.7-.1-.2-.89-2.15-1.22-2.94-.32-.77-.65-.67-.89-.68-.23 0-.5-.01-.77-.01-.26 0-.7.1-1.06.49-.36.4-1.39 1.36-1.39 3.31s1.42 3.84 1.62 4.1c.2.26 2.8 4.27 6.77 5.98.95.41 1.68.65 2.26.83.95.3 1.81.26 2.49.16.76-.11 2.34-.96 2.67-1.88.33-.93.33-1.72.23-1.88-.1-.17-.36-.27-.76-.47z"
      />
    </svg>
  );
}

export function TelegramIcon({ className = "w-4 h-4", style = {}, ...props }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      {...props}
    >
      <circle cx="16" cy="16" r="16" fill="#229ED9" />
      <path 
        d="M23.8 8.8c.2 0 .4.1.5.2.2.2.3.4.2.7l-3.2 15.1c-.2 1.1-.9 1.3-1.7.8l-4.8-3.6-2.3 2.2c-.3.3-.5.5-1.1.5l.4-4.8 8.7-7.9c.4-.4-.1-.5-.4-.3l-10.8 6.8-4.7-1.5c-1-.3-1-1 .2-1.5l18.2-7c.7-.3 1.5 0 1.6.5z" 
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * Trả về Logo vector chính xác của App mạng xã hội
 */
export default function SocialChannelLogo({ 
  channel = 'zalo', 
  className = "w-4 h-4",
  style = {},
  ...props 
}) {
  const norm = (channel || '').toLowerCase();

  switch (norm) {
    case 'zalo':
      return <ZaloIcon className={className} style={style} {...props} />;
    case 'facebook':
    case 'messenger':
      return <MessengerIcon className={className} style={style} {...props} />;
    case 'instagram':
      return <InstagramIcon className={className} style={style} {...props} />;
    case 'whatsapp':
      return <WhatsAppIcon className={className} style={style} {...props} />;
    case 'telegram':
      return <TelegramIcon className={className} style={style} {...props} />;
    default:
      return <ZaloIcon className={className} style={style} {...props} />;
  }
}

/**
 * Thông tin chi tiết của kênh (Tên, màu nhận diện, logo)
 */
export const SOCIAL_CHANNEL_CONFIG = {
  zalo: {
    id: 'zalo',
    name: 'Zalo OA',
    brandName: 'Zalo',
    brandColor: '#0068FF',
    badgeBg: 'bg-[#0068FF]',
    lightBg: 'bg-blue-50',
    lightBorder: 'border-blue-200',
    textColor: 'text-blue-700'
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook Messenger',
    brandName: 'Messenger',
    brandColor: '#0084FF',
    badgeBg: 'bg-[#0084FF]',
    lightBg: 'bg-sky-50',
    lightBorder: 'border-sky-200',
    textColor: 'text-sky-700'
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram Direct',
    brandName: 'Instagram',
    brandColor: '#E4405F',
    badgeBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
    lightBg: 'bg-rose-50',
    lightBorder: 'border-rose-200',
    textColor: 'text-rose-700'
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    brandName: 'WhatsApp',
    brandColor: '#25D366',
    badgeBg: 'bg-[#25D366]',
    lightBg: 'bg-emerald-50',
    lightBorder: 'border-emerald-200',
    textColor: 'text-emerald-700'
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram Bot',
    brandName: 'Telegram',
    brandColor: '#229ED9',
    badgeBg: 'bg-[#229ED9]',
    lightBg: 'bg-sky-50',
    lightBorder: 'border-sky-200',
    textColor: 'text-sky-700'
  }
};

/**
 * Badge Kênh dạng Pill nằm ngang (Logo + Tên Kênh)
 */
export function SocialChannelPill({ 
  channel = 'zalo', 
  label, 
  size = 'sm',
  className = "" 
}) {
  const meta = SOCIAL_CHANNEL_CONFIG[channel?.toLowerCase()] || SOCIAL_CHANNEL_CONFIG.zalo;
  const isSm = size === 'sm';

  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border leading-none ${meta.lightBg} ${meta.lightBorder} ${meta.textColor} ${
        isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } ${className}`}
    >
      <SocialChannelLogo channel={channel} className={isSm ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
      <span className="truncate">{label || meta.name}</span>
    </span>
  );
}
