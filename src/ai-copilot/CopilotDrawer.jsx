'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCopilot } from './CopilotContext';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  User, 
  Calendar, 
  Receipt, 
  ChevronRight, 
  CheckCircle2, 
  Compass,
  Cpu
} from 'lucide-react';

export function CopilotDrawer() {
  const router = useRouter();
  const { copilotState, copilotEngine } = useCopilot();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeModel, setActiveModel] = useState('Gemini AI');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Xin chào ${copilotState.currentUser?.name || 'bạn'}! 🤖 Tôi là **GloPro AI** (kết nối **Google Gemini**).\n\nTôi hiểu toàn bộ ngữ cảnh tại **${copilotState.salonBranch?.name || 'Salon'}** và có thể **tự động thao tác phần mềm** theo lệnh của bạn: đặt lịch, tạo bill, tìm/thêm khách hàng, phân tích doanh thu hoặc chuyển trang tức thì.`
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || loading) return;

    const userMsg = { id: `user_${Date.now()}`, role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const result = await copilotEngine.processQuery(query, copilotState);
      const response = result.response;
      const navigateTo = result.navigateTo || response.metadata?.navigateTo;
      if (response.metadata?.model) {
        setActiveModel(response.metadata.model);
      }

      const botMsg = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCallsExecuted || [],
        model: response.metadata?.model || 'Gemini 2.5 Pro',
        navigateTo
      };
      setMessages(prev => [...prev, botMsg]);

      // If action modified database, notify active screens to refresh live
      if (response.toolCallsExecuted && response.toolCallsExecuted.length > 0) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('reload-data'));
          window.dispatchEvent(new Event('storage'));
        }
      }

      // If AI executed a page navigation action
      if (navigateTo) {
        setTimeout(() => {
          router.push(navigateTo);
        }, 600);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `❌ **Lỗi phản hồi:** ${err.message || 'Không thể xử lý yêu cầu.'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Voice Input (Web Speech API) for hands-free salon commands
  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói. Bạn có thể sử dụng Chrome/Safari hoặc gõ lệnh trực tiếp.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) {
          setInputQuery(transcript);
          handleSend(transcript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Dynamic context suggestions based on current route
  const getContextSuggestions = () => {
    const page = copilotState.currentPage || '';
    if (page.includes('pos')) {
      return [
        'Hôm nay doanh thu bao nhiêu?',
        'Tạo bill khách Anh Tuấn cắt tóc 100k',
        'Kiểm tra tồn kho dầu gội'
      ];
    }
    if (page.includes('appointment')) {
      return [
        'Đặt lịch cho chị Lan gội đầu 14h ngày mai',
        'Xem danh sách lịch hẹn hôm nay',
        'Kiểm tra thợ nào rảnh lúc 15h'
      ];
    }
    if (page.includes('customer')) {
      return [
        'Tìm khách hàng số 0912345678',
        'Tạo khách hàng mới Nguyễn Văn A 0988123456',
        'Top khách hàng chi tiêu nhiều nhất'
      ];
    }
    if (page.includes('report')) {
      return [
        'Tổng kết doanh thu hôm nay',
        'Xem nhân viên nào có doanh thu cao nhất'
      ];
    }
    return [
      'Doanh thu hôm nay thế nào?',
      'Chuyển sang màn hình POS',
      'Đặt lịch hẹn cho khách 14:00 ngày mai'
    ];
  };

  return (
    <motion.div 
      drag 
      dragMomentum={false}
      className="fixed bottom-6 right-6 z-[9999] font-sans"
    >
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20 group relative cursor-pointer"
          title="GloPro AI"
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse absolute inset-0 transition-opacity group-hover:opacity-0" />
            <Bot className="w-6 h-6 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
          </span>
        </button>
      )}

      {isOpen && (
        <div className="w-[430px] max-w-[95vw] h-[640px] max-h-[88vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  GloPro AI
                  <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {activeModel}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-[220px]">
                  {copilotState.salonBranch?.name || 'Hệ thống GloPro'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context State Bar */}
          <div className="px-3 py-2 bg-slate-950/70 border-b border-slate-800/80 text-[11px] flex flex-wrap gap-1.5 items-center text-slate-300">
            <span className="font-medium text-slate-400">Ngữ cảnh:</span>

            {copilotState.currentPage && (
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1 border border-slate-700">
                <Compass className="w-3 h-3 text-indigo-400" />
                <span>{copilotState.currentPage}</span>
              </span>
            )}

            {copilotState.selectedCustomer && (
              <span className="bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded flex items-center gap-1 border border-purple-500/40">
                <User className="w-3 h-3 text-purple-400" />
                {copilotState.selectedCustomer.name}
              </span>
            )}

            {copilotState.selectedAppointment && (
              <span className="bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded flex items-center gap-1 border border-blue-500/40">
                <Calendar className="w-3 h-3 text-blue-400" />
                {copilotState.selectedAppointment.start_time || 'Lịch hẹn'}
              </span>
            )}

            {copilotState.selectedInvoice && (
              <span className="bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/40">
                <Receipt className="w-3 h-3 text-amber-400" />
                {copilotState.selectedInvoice.invoiceNumber || 'Hóa đơn'}
              </span>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  {msg.content}

                  {/* Tool execution badge */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/60 flex flex-col gap-1 text-[10px] text-emerald-400 font-medium">
                      {msg.toolCalls.map((t, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>Đã thực thi công cụ: <strong>{t.toolName}</strong></span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Navigation badge */}
                  {msg.navigateTo && (
                    <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center gap-1 text-[10px] text-indigo-300 font-medium">
                      <Compass className="w-3 h-3 shrink-0" />
                      <span>Đã chuyển trang tới: <strong>{msg.navigateTo}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2 bg-slate-800/40 rounded-xl w-fit">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                Gemini 2.5 Pro đang xử lý yêu cầu và thực thi lệnh...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Context Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
            {getContextSuggestions().map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sug)}
                className="px-2.5 py-1 rounded-full bg-slate-800 text-indigo-300 hover:bg-slate-700 active:bg-slate-600 border border-indigo-500/30 whitespace-nowrap flex items-center gap-1 cursor-pointer transition"
              >
                <span>"{sug}"</span>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
              </button>
            ))}
          </div>

          {/* Input Bar with Voice Support */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={handleVoiceInput}
              title={isListening ? "Đang lắng nghe..." : "Ra lệnh bằng giọng nói"}
              className={`p-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Đang lắng nghe bạn nói..." : "Ra lệnh bằng tiếng Việt (vd: Đặt lịch 14h mai, doanh thu hôm nay...)"}
              className="flex-1 bg-slate-800 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !inputQuery.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
