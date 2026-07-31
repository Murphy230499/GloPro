'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCopilot } from './CopilotContext';
import { Bot, Send, Mic, Sparkles, X, User, Calendar, Receipt, ShieldCheck, ChevronRight } from 'lucide-react';

export function CopilotDrawer() {
  const { copilotState, copilotEngine } = useCopilot();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Xin chào ${copilotState.currentUser.name}! 🤖 Tôi là **GloPro AI Copilot**.\n\nTôi đang ghi nhận ngữ cảnh làm việc hiện tại của bạn tại **${copilotState.salonBranch.name}**.`
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
      const { response, contextResolution } = await copilotEngine.processQuery(query, copilotState);
      const botMsg = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        contextResolution
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `❌ Lỗi Copilot: ${err.message || 'Không thể xử lý câu lệnh.'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-full shadow-2xl hover:scale-110 hover:rotate-12 transition-all duration-300 border border-purple-400/30 group"
          title="GloPro AI Copilot"
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse absolute inset-0 transition-opacity group-hover:opacity-0" />
            <Bot className="w-5 h-5 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      )}

      {isOpen && (
        <div className="w-[420px] h-[620px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  GloPro AI Copilot
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-[220px]">
                  {copilotState.salonBranch.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context State Bar (Always Live Context Aware) */}
          <div className="px-3 py-2 bg-slate-950/70 border-b border-slate-800/80 text-[11px] flex flex-wrap gap-1.5 items-center text-slate-300">
            <span className="font-medium text-slate-400">Ngữ cảnh:</span>

            {copilotState.currentPage && (
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1 border border-slate-700">
                Trang: <strong className="text-purple-300">{copilotState.currentPage}</strong>
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
                Lịch: {copilotState.selectedAppointment.start_time}
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
                  className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                GloPro Copilot đang suy nghĩ & phân tích ngữ cảnh...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Context Chips */}
          <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
            <button
              onClick={() => handleSend('Change her phone number')}
              className="px-2.5 py-1 rounded-full bg-slate-800 text-purple-300 hover:bg-slate-700 border border-purple-500/30 whitespace-nowrap flex items-center gap-1"
            >
              "Change her phone number" <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleSend('Cancel this appointment')}
              className="px-2.5 py-1 rounded-full bg-slate-800 text-blue-300 hover:bg-slate-700 border border-blue-500/30 whitespace-nowrap flex items-center gap-1"
            >
              "Cancel this appointment" <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập ra lệnh theo ngữ cảnh (vd: Change her phone number)..."
              className="flex-1 bg-slate-800 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500 placeholder-slate-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputQuery.trim()}
              className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
