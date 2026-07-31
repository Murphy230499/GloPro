'use client';

import React, { useState } from 'react';
import { Sparkles, Brain, Send, HelpCircle } from 'lucide-react';
import { processUserMessage } from '@/lib/aiAssistantEngine';
import CustomReportCard from '@/components/ai/CustomReportCard';

const SUGGESTIONS = [
  { label: '📊 Doanh thu theo Nhân viên', prompt: 'Báo cáo doanh thu theo nhân viên' },
  { label: '💎 Top Khách hàng chi tiêu cao', prompt: 'Báo cáo khách hàng chi tiêu' },
  { label: '📈 Tổng quan Doanh thu & Lịch hẹn', prompt: 'Báo cáo tổng quan doanh thu và lịch hẹn' }
];

export default function AiReportTab() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleGenerateReport = async (textPrompt) => {
    const activePrompt = textPrompt || prompt;
    if (!activePrompt.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Simulate slight delay for premium AI feel and analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await processUserMessage(activePrompt);
      if (response) {
        setResult(response);
      } else {
        setError('Không nhận diện được định dạng dữ liệu trả về từ AI.');
      }
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi trong quá trình sinh báo cáo với AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestionPrompt) => {
    setPrompt(suggestionPrompt);
    handleGenerateReport(suggestionPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Banner / Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-md">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 font-bold text-sm bg-white/10 border border-white/20 px-2.5 py-1 rounded-full w-fit">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>GloPro AI Assistant</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Tạo báo cáo thông minh chỉ với 1 dòng lệnh</h2>
            <p className="text-xs text-white/80 leading-relaxed">
              Nhập bất kỳ mong muốn nào của bạn về báo cáo doanh thu, nhân viên, hoặc khách hàng. Hệ thống AI sẽ tự động phân tích dữ liệu thực tế thời gian thực và xây dựng biểu đồ báo cáo cho bạn ngay lập tức.
            </p>
          </div>
          <div className="shrink-0 flex items-center justify-center bg-white/10 border border-white/10 h-16 w-16 rounded-2xl">
            <Brain className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      {/* Main Action Input Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            Mô tả nhu cầu báo cáo của bạn
          </label>
          <div className="relative flex items-center">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ví dụ: Tạo báo cáo doanh thu theo nhân viên..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition resize-none pr-12"
            />
            <button
              onClick={() => handleGenerateReport()}
              disabled={loading || !prompt.trim()}
              className={`absolute right-3 p-2 rounded-lg transition-all ${
                prompt.trim() && !loading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gợi ý nhanh cho bạn</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(sug.prompt)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200/80 hover:border-indigo-200 transition cursor-pointer"
              >
                {sug.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading States / Spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <Sparkles className="w-4 h-4 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-xs font-bold text-slate-700">Đang khởi tạo báo cáo</h4>
            <p className="text-[10px] text-slate-400">Trợ lý AI đang truy vấn dữ liệu thực tế và thiết lập biểu đồ phân tích...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* AI Output Result Rendering */}
      {result && !loading && (
        <div className="space-y-4">
          <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kết quả phân tích từ AI</div>
          
          {result.type === 'custom_report' ? (
            <CustomReportCard report={result.report} />
          ) : (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Trợ lý Phản hồi</span>
              </div>
              <div className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                {result.text}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
