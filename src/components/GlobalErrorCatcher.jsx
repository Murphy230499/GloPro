'use client';

import { useEffect } from 'react';

/**
 * GlobalErrorCatcher
 * Lắng nghe và chặn các lỗi vô hại của trình duyệt (ResizeObserver loop, AbortError, WebGL context warn)
 * không cho phát tán lên window.onerror làm kích hoạt màn hình đen sập trang của Base44 ("This page couldn't load").
 */
export default function GlobalErrorCatcher() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWindowError = (event) => {
      const msg = typeof event === 'string' ? event : event?.message || '';
      if (
        msg.includes('ResizeObserver') ||
        msg.includes('Script error') ||
        msg.includes('cancelled') ||
        msg.includes('NetworkError')
      ) {
        if (event.preventDefault) event.preventDefault();
        return true;
      }
    };

    const handleRejection = (event) => {
      const reason = event?.reason?.message || event?.reason || '';
      if (
        typeof reason === 'string' && (
          reason.includes('ResizeObserver') ||
          reason.includes('AbortError') ||
          reason.includes('cancelled') ||
          reason.includes('Failed to fetch')
        )
      ) {
        if (event.preventDefault) event.preventDefault();
      }
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
