'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalRouteError({ error, reset }) {
  useEffect(() => {
    // Ghi log chi tiết để dễ dàng kiểm tra nguyên nhân
    console.error('[GloPro Route Error Caught]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-500/10">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-white tracking-tight mb-2">
          Đã xảy ra sự cố khi tải trang
        </h2>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {error?.message && !error.message.includes('Minified React error')
            ? error.message
            : 'Ứng dụng đã gặp gián đoạn tạm thời. Vui lòng thử tải lại hoặc quay về trang tổng quan.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử tải lại</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white rounded-xl text-sm font-semibold transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-500">
          Hệ thống GloPro Salon & Spa Management
        </div>
      </div>
    </div>
  );
}
