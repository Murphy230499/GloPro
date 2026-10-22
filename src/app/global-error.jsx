'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalFatalError({ error, reset }) {
  useEffect(() => {
    console.error('[GloPro Root Global Error Caught]:', error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 m-0 font-sans">
        <div className="max-w-md w-full bg-slate-950 border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            Đã xảy ra gián đoạn hệ thống
          </h2>

          <p className="text-sm text-slate-400 mb-6">
            Hệ thống đang phục hồi lại phiên làm việc của bạn. Bấm nút bên dưới để thử lại.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tải lại phiên làm việc</span>
          </button>
        </div>
      </body>
    </html>
  );
}
