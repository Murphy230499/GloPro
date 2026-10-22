'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full p-8 my-4 rounded-3xl bg-slate-900/90 border border-slate-800 text-white shadow-xl flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Không thể tải nội dung phần này
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            Đã xảy ra lỗi tạm thời khi hiển thị giao diện. Các phần khác của hệ thống vẫn hoạt động bình thường.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử tải lại</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
