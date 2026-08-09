'use client';

import React from "react";
import BoomerangVideoBg from "./BoomerangVideoBg";
import Link from 'next/link';

const HD_BG_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4';

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center font-sans bg-[#F5F5F5]">
      {/* High-Definition JS Fade-Loop Video Background */}
      <BoomerangVideoBg src={HD_BG_VIDEO} className="absolute inset-0 w-full h-full" />

      {/* Blurred overlay glow shape for depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] sm:w-[984px] sm:h-[527px] opacity-70 bg-purple-950/40 blur-[82px] pointer-events-none" />

      {/* Top Brand Logo Header */}
      <div className="absolute top-6 left-6 md:left-12 lg:left-16 z-20 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="GloPro Logo" className="w-10 h-10 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300" />
          <div className="flex flex-col text-left">
            <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md leading-none">
              GloPro<span className="text-pink-400 text-xs font-extrabold ml-1">SALON</span>
            </span>
            <span className="text-[10px] text-gray-200 font-medium tracking-wide">Quản lý Salon & Spa Chuyên nghiệp</span>
          </div>
        </Link>
      </div>

      {/* Center Auth Card Container - Clean White Aesthetics */}
      <div className="relative z-10 w-full max-w-md px-4 py-8 sm:py-12">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-white/80 text-slate-800">
          
          {/* Header with Pink Sparkle Logo */}
          <div className="text-center space-y-2">
            <img src="/logo.png" alt="GloPro Logo" className="w-14 h-14 object-contain drop-shadow-md inline-block mb-1 animate-pulse" />

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm font-medium text-slate-500 font-sans">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          <div>
            {children}
          </div>

          {/* Footer Link */}
          {footer && (
            <div className="pt-3 text-center text-xs sm:text-sm font-medium text-slate-500 border-t border-slate-100 font-sans">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
