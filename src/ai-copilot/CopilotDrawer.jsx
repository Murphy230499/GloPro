'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useBranch } from '@/lib/BranchContext';
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
  Cpu,
  RotateCcw,
  Paperclip,
  FileSpreadsheet,
  UploadCloud,
  Users,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { parseExcelFile, autoDetectEntityType, executeImportBatch } from '@/lib/excelImportHelper';
import AIExcelImportPreview from '@/components/ai/AIExcelImportPreview';

function renderMessageText(content) {
  if (!content) return null;
  const clean = String(content).replace(/\*\*\*/g, '**');
  const lines = clean.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} className="h-1.5" />;

        const parts = [];
        let remaining = line;
        let pIdx = 0;

        const tokenRegex = /(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/;
        while (remaining) {
          const match = remaining.match(tokenRegex);
          if (!match) {
            parts.push(<span key={pIdx++}>{remaining}</span>);
            break;
          }
          const before = remaining.substring(0, match.index);
          if (before) parts.push(<span key={pIdx++}>{before}</span>);

          if (match[2]) {
            parts.push(<strong key={pIdx++} className="font-semibold text-white">{match[2]}</strong>);
          } else if (match[3]) {
            parts.push(<code key={pIdx++} className="px-1.5 py-0.5 rounded bg-slate-900/80 font-mono text-indigo-300 border border-slate-700/50">{match[3]}</code>);
          } else if (match[4]) {
            parts.push(<em key={pIdx++} className="italic text-slate-300">{match[4]}</em>);
          }

          remaining = remaining.substring(match.index + match[0].length);
        }

        return (
          <div key={lIdx} className="leading-relaxed">
            {parts}
          </div>
        );
      })}
    </div>
  );
}

export function CopilotDrawer() {
  const router = useRouter();
  const { copilotState, copilotEngine, updateCopilotState } = useCopilot();
  
  let authUser = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
  } catch (e) {
    // ignore if context not mounted yet
  }

  let branchData = null;
  try {
    const branch = useBranch();
    branchData = branch?.currentBranch;
  } catch (e) {
    // ignore
  }

  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeModel, setActiveModel] = useState('Gemini AI');
  
  // State và Ref cho tính năng AI Excel Import
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importingMessageId, setImportingMessageId] = useState(null);
  
  const initialName = authUser?.full_name || authUser?.name || 'bạn';
  const initialBranch = branchData?.name || 'Hệ thống GloPro';
  
  const getGreeting = (name) => name 
    ? `Xin chào **${name}**! 🤖 Tôi có thể giúp gì cho bạn hôm nay?` 
    : `Xin chào ${initialName}! 🤖 Tôi có thể giúp gì cho bạn hôm nay?`;

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: getGreeting(authUser?.full_name || authUser?.name)
    }
  ]);

  // Sync logged in account and active branch into Copilot State
  useEffect(() => {
    let syncTid = null;
    try {
      const { getSyncTenantId } = require('@/lib/tenantManager');
      syncTid = getSyncTenantId();
    } catch (e) {}

    const finalTid = authUser?.tenant_id || syncTid || '57e50365-d351-4acf-a967-c6c0fc62eed9';
    if (typeof window !== 'undefined' && finalTid) {
      try {
        localStorage.setItem('gp_active_tenant_id', finalTid);
      } catch (e) {}
    }
    const finalBranchId = (branchData?.id && branchData?.id !== 'current_branch' && branchData?.id !== 'all')
      ? branchData.id
      : '800d714a-245a-4e54-ad95-103ee2e509ca';

    updateCopilotState({
      currentUser: {
        id: authUser?.id || 'current_user',
        name: authUser?.full_name || authUser?.name || authUser?.email?.split('@')[0] || 'Chủ tài khoản',
        email: authUser?.email,
        role: authUser?.role || 'owner',
        tenant_id: finalTid
      },
      tenantId: finalTid,
      salonBranch: {
        id: finalBranchId,
        name: branchData?.name || 'Chi nhánh chính',
        address: branchData?.address
      }
    });
  }, [authUser?.id, authUser?.full_name, authUser?.email, authUser?.tenant_id, branchData?.id, branchData?.name]);

  // Always enforce the new concise welcome message even in existing chat sessions
  useEffect(() => {
    const realName = authUser?.full_name || authUser?.name;
    const currentGreeting = getGreeting(realName);
    setMessages(prev => {
      if (prev.length > 0 && prev[0].id === 'welcome') {
        if (prev[0].content !== currentGreeting) {
          const next = [...prev];
          next[0] = { ...next[0], content: currentGreeting };
          return next;
        }
      }
      return prev;
    });
  }, [authUser?.full_name, authUser?.name]);

  const handleResetChat = () => {
    const realName = authUser?.full_name || authUser?.name;
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: getGreeting(realName)
      }
    ]);
  };

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || loading) return;

    // Phản hồi thông minh nếu người dùng muốn import/tải file Excel
    const lower = query.toLowerCase();
    if (lower.includes('nhập excel') || lower.includes('import excel') || lower.includes('tải excel') || lower.includes('file excel') || lower.includes('nhập file')) {
      const userMsg = { id: `user_${Date.now()}`, role: 'user', content: query };
      const botMsg = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: `📁 **AI Hỗ trợ Import Excel:**\n\nBạn có thể bấm vào biểu tượng kẹp ghim 📎 ở thanh chat hoặc **kéo thả tệp (.xlsx, .xls, .csv)** trực tiếp vào khung chat này.\n\nAI sẽ tự động đọc dữ liệu, phân loại (**Khách hàng, Dịch vụ hoặc Sản phẩm**), khớp các cột thông minh và hiển thị bản xem trước để bạn xác nhận trước khi lưu!`
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
      setInputQuery('');
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 350);
      return;
    }

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
        actionButton: result.actionButton || response.metadata?.actionButton,
        actionPreview: result.actionPreview || response.metadata?.actionPreview,
        status: result.status || response.metadata?.status,
        navigateTo
      };
      setMessages(prev => [...prev, botMsg]);

      // If action modified database, notify active screens to refresh live
      if (
        (response.toolCallsExecuted && response.toolCallsExecuted.length > 0) ||
        result.status === 'SUCCESS' ||
        result.verified ||
        result.actionResult
      ) {
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

  // Lưu tập khách hàng từ kết quả lọc trực tiếp trong chat
  const handleSaveSegmentFromChat = async (messageId, filterResult) => {
    try {
      const now = new Date();
      const defaultName = filterResult.applied_descriptions?.length > 0 
        ? `${filterResult.applied_descriptions.join(', ')} (${now.toLocaleDateString('vi-VN')})` 
        : `Tập khách hàng lọc ngày ${now.toLocaleDateString('vi-VN')}`;

      const name = prompt('Nhập tên cho tập khách hàng mới:', defaultName);
      if (!name || !name.trim()) return;

      const COLORS = ['#34D399', '#60A5FA', '#FF6B9D', '#A78BFA', '#FBBF24', '#F97316', '#06B6D4'];
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

      const { base44 } = await import('@/api/base44Client');
      const newSeg = await base44.entities.CustomerSegment.create({
        name: name.trim(),
        color: randomColor,
        conditions: JSON.stringify(filterResult.criteria || {})
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('reload-data'));
        window.dispatchEvent(new Event('storage'));
      }

      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return {
            ...m,
            segmentSaved: true,
            createdSegment: newSeg
          };
        }
        return m;
      }));

      setMessages(prev => [
        ...prev,
        {
          id: `bot_saved_${Date.now()}`,
          role: 'assistant',
          content: `🎯 **Đã lưu thành công Tập khách hàng:** **${newSeg.name}**\n*(Đã đồng bộ trực tiếp vào mục Khách hàng > Tập khách hàng trên hệ thống).*`,
          actionButton: {
            label: 'Mở xem tại tab Tập khách hàng',
            route: '/customers?tab=segments'
          }
        }
      ]);
    } catch (err) {
      alert('Không thể lưu tập khách hàng: ' + (err.message || 'Lỗi không xác định'));
    }
  };

  // Xử lý đọc và phân tích file Excel (.xlsx, .xls, .csv)
  const processSelectedFile = async (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Định dạng không được hỗ trợ:** GloPro AI hiện hỗ trợ các tệp bảng tính **.xlsx, .xls** và **.csv**.\nVui lòng chọn đúng tệp Excel để tiếp tục.`
      }]);
      return;
    }

    const userMsg = {
      id: `user_file_${Date.now()}`,
      role: 'user',
      content: `📎 Tải lên tệp Excel: **${file.name}**`
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const parsed = await parseExcelFile(file);
      const detectedType = autoDetectEntityType(parsed.headers);

      const entityLabels = {
        customer: 'Khách hàng (CRM)',
        service: 'Danh mục Dịch vụ Salon',
        product: 'Sản phẩm & Kho hàng'
      };

      const botMsg = {
        id: `excel_msg_${Date.now()}`,
        role: 'assistant',
        type: 'excel_preview',
        fileData: parsed,
        detectedType,
        content: `📊 **Đã phân tích tệp:** \`${parsed.fileName}\` (${parsed.rowCount} dòng dữ liệu).\n🤖 **AI nhận diện nhóm:** ${entityLabels[detectedType] || 'Dữ liệu Salon'}.\n\nBạn có thể kiểm tra ánh xạ cột, tùy chọn xử lý trùng và xác nhận import bên dưới:`
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `❌ **Không thể đọc tệp Excel:** ${err.message || 'Lỗi xử lý file.'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Thực thi Import Batch vào cơ sở dữ liệu
  const handleExecuteImport = async ({ messageId, entityType, duplicateStrategy, validationResult }) => {
    setImportingMessageId(messageId);

    try {
      const result = await executeImportBatch({
        entityType,
        validRows: validationResult.validRows,
        duplicateStrategy,
        currentBranchId: branchData?.id
      });

      if (!result.success) {
        throw new Error(result.message || 'Import thất bại.');
      }

      const entityLabels = {
        customer: { name: 'Khách hàng', route: '/customers' },
        service: { name: 'Dịch vụ Salon', route: '/services' },
        product: { name: 'Sản phẩm & Kho', route: '/inventory' }
      };
      const info = entityLabels[entityType] || { name: 'Dữ liệu', route: '/dashboard' };

      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            type: 'text',
            content: `🎉 **Đã hoàn tất nhập dữ liệu ${info.name}!**\n\n` +
              `• 🟢 Thêm mới thành công: **${result.createdCount}** bản ghi\n` +
              (result.updatedCount > 0 ? `• 🔄 Đã cập nhật / ghi đè: **${result.updatedCount}** bản ghi cũ\n` : '') +
              (result.skippedCount > 0 ? `• ⏭️ Đã bỏ qua trùng lặp: **${result.skippedCount}** bản ghi\n` : '') +
              (result.errors && result.errors.length > 0 ? `• ⚠️ Dòng cảnh báo lỗi: **${result.errors.length}** dòng\n` : '') +
              `\nDữ liệu đã sẵn sàng trên hệ thống GloPro.`,
            actionButton: {
              label: `Xem danh sách ${info.name}`,
              route: info.route
            }
          };
        }
        return msg;
      }));
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `❌ **Lỗi trong quá trình import:** ${err.message || 'Không thể lưu vào cơ sở dữ liệu.'}`
      }]);
    } finally {
      setImportingMessageId(null);
    }
  };

  const handleCancelImport = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  // Kéo thả tệp trực tiếp vào khung chat
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await processSelectedFile(files[0]);
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
    const page = (copilotState.currentPage || '').toLowerCase();
    if (page.includes('pos')) {
      return [
        'Làm sao để chia hoa hồng cho thợ?',
        'Tạo bill khách Anh Tuấn cắt tóc 100k',
        'Cách áp dụng mã giảm giá voucher?',
        'Hôm nay doanh thu bao nhiêu?'
      ];
    }
    if (page.includes('appointment')) {
      return [
        'Làm sao để đổi giờ hoặc hủy lịch hẹn?',
        'Đặt lịch cho chị Lan gội đầu 14h ngày mai',
        'Xem danh sách lịch hẹn hôm nay',
        'Cách kiểm tra thợ nào đang rảnh?'
      ];
    }
    if (page.includes('customer')) {
      return [
        'Làm sao để tạo tập khách hàng mới?',
        'Lọc khách hàng chưa quay lại 30 ngày',
        'Cách cấu hình hạng thành viên VIP?',
        'Tạo khách hàng mới Nguyễn Văn A 0988123456'
      ];
    }
    if (page.includes('inventory')) {
      return [
        'Làm sao để nhập hàng vào kho?',
        'Kiểm tra sản phẩm nào sắp hết hàng',
        'Tra cứu sản phẩm dầu gội',
        '📊 Nhập dữ liệu từ Excel'
      ];
    }
    if (page.includes('service')) {
      return [
        'Làm sao để tạo combo dịch vụ?',
        'Thêm dịch vụ mới Nhuộm tóc 350k',
        'Cách thiết lập thời lượng làm dịch vụ?',
        'Xem dịch vụ đang bán chạy'
      ];
    }
    if (page.includes('staff') || page.includes('payroll')) {
      return [
        'Làm sao để cấu hình % hoa hồng cho thợ?',
        'Cách tính bảng lương và in phiếu lương?',
        'Thêm nhân viên mới Nguyễn Văn Hùng',
        'Cách chấm công vào ca cho nhân viên?'
      ];
    }
    if (page.includes('room') || page.includes('bed')) {
      return [
        'Làm sao để xếp giường cho khách spa?',
        'Cách quản lý trạng thái dọn dẹp giường?'
      ];
    }
    if (page.includes('discount')) {
      return [
        'Làm sao để tạo mã giảm giá voucher mới?',
        'Cách tạo chương trình khuyến mãi theo ngày?'
      ];
    }
    if (page.includes('report')) {
      return [
        'Tạo báo cáo doanh thu tháng này',
        'Tạo báo cáo hiệu suất thợ',
        'Báo cáo top khách hàng chi tiêu',
        'Làm sao để xuất báo cáo ra Excel?'
      ];
    }
    if (page.includes('setting')) {
      return [
        'Làm sao để thêm chi nhánh mới?',
        'Cách cấu hình máy in hóa đơn nhiệt?',
        'Cách phân quyền cho nhân viên?'
      ];
    }
    return [
      'Tạo báo cáo doanh thu tuần này',
      'Làm sao để tạo hóa đơn bán hàng?',
      'Đặt lịch hẹn cho khách 14:00 ngày mai',
      'Lọc khách hàng chưa quay lại 30 ngày'
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
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative w-[430px] max-w-[95vw] h-[640px] max-h-[88vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Overlay kéo thả tệp Excel */}
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm border-2 border-dashed border-indigo-500 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 text-center pointer-events-none animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <FileSpreadsheet className="w-10 h-10 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Thả tệp Excel vào đây</h4>
                <p className="text-xs text-slate-400 mt-1">Hỗ trợ tệp .xlsx, .xls, .csv (Khách hàng, Dịch vụ, Sản phẩm)</p>
              </div>
            </div>
          )}

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
            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
                  {renderMessageText(msg.content)}

                  {/* Thẻ xem trước và cấu hình Excel Import thông minh */}
                  {msg.type === 'excel_preview' && msg.fileData && (
                    <div className="w-full mt-2">
                      <AIExcelImportPreview
                        fileData={msg.fileData}
                        initialEntityType={msg.detectedType}
                        isImporting={importingMessageId === msg.id}
                        onConfirm={(params) => handleExecuteImport({ ...params, messageId: msg.id })}
                        onCancel={() => handleCancelImport(msg.id)}
                      />
                    </div>
                  )}

                  {/* Thẻ xem trước thao tác CRUD & Xác nhận an toàn (Action Preview Card) */}
                  {(msg.actionPreview || msg.toolCalls?.find(t => t.result?.actionPreview)?.result?.actionPreview) && (() => {
                    const preview = msg.actionPreview || msg.toolCalls?.find(t => t.result?.actionPreview)?.result?.actionPreview;
                    const isPending = msg.status === 'PENDING_CONFIRMATION' || preview.statusText?.includes('Chờ');
                    return (
                      <div className="w-full mt-3 p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                          <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>{preview.title || 'Chi tiết thao tác'}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isPending 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {preview.statusText || (isPending ? 'Chờ xác nhận' : 'Đã thực hiện')}
                          </span>
                        </div>

                        {preview.summary && (
                          <p className="text-[11px] text-slate-300 italic">{preview.summary}</p>
                        )}

                        <div className="space-y-1 pt-1">
                          {preview.items?.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] py-0.5">
                              <span className="text-slate-400">{it.label}:</span>
                              <span className="text-slate-200 font-semibold font-mono text-right">{it.value}</span>
                            </div>
                          ))}
                        </div>

                        {isPending && (
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleSend('Đồng ý')}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Xác nhận lưu</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSend('Hủy')}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition cursor-pointer"
                            >
                              Hủy bỏ
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Nút hành động nhanh điều hướng trang (sau khi thao tác xong) */}
                  {msg.actionButton && (
                    <button
                      type="button"
                      onClick={() => router.push(msg.actionButton.route)}
                      className="mt-2.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>{msg.actionButton.label}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Widget Danh sách khách hàng đã lọc có thanh cuộn (Scrollable Customer List) */}
                  {msg.toolCalls?.some(t => t.toolName === 'customer_filter' && t.result?.customers?.length > 0) && (() => {
                    const filterTool = msg.toolCalls.find(t => t.toolName === 'customer_filter');
                    const res = filterTool.result;
                    const customers = res.customers || [];
                    const isCreated = res.created_segment || msg.createdSegment;

                    return (
                      <div className="w-full mt-3 p-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
                          <div className="flex items-center gap-1.5 text-indigo-400">
                            <Users className="w-3.5 h-3.5" />
                            <span>Danh sách phù hợp ({customers.length} khách)</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Cuộn để xem hết</span>
                        </div>

                        {/* Vùng cuộn danh sách khách hàng */}
                        <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 text-[11px] custom-scrollbar">
                          {customers.map((c, idx) => (
                            <div 
                              key={c.id || idx}
                              className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/50 flex items-center justify-between gap-2 transition"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-indigo-500/30">
                                  {c.name ? c.name.charAt(0).toUpperCase() : 'K'}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-200 truncate">{c.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{c.phone}</div>
                                </div>
                              </div>
                              <div className="text-right text-[10px] shrink-0">
                                <div className="text-emerald-400 font-semibold font-mono">
                                  {(c.total_spent || 0).toLocaleString('vi-VN')} đ
                                </div>
                                <div className="text-slate-400">
                                  {c.visit_count} lần ghé • {c.last_visit}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Nút lưu thành tập khách hàng mới (Áp dụng cho tùy chọn C hoặc khi chưa lưu) */}
                        {!isCreated && !msg.segmentSaved && (
                          <button
                            type="button"
                            onClick={() => handleSaveSegmentFromChat(msg.id, res)}
                            className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Lưu {customers.length} khách này thành Tập khách hàng mới</span>
                          </button>
                        )}

                        {/* Thông báo đã lưu & nút xem tại tab Tập khách hàng */}
                        {isCreated && (
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                            <span className="text-emerald-400 font-medium flex items-center gap-1 truncate max-w-[70%]">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Đã lưu: <strong>{isCreated.name}</strong></span>
                            </span>
                            <button
                              type="button"
                              onClick={() => router.push('/customers?tab=segments')}
                              className="text-indigo-400 hover:text-indigo-300 font-medium underline text-[10px] flex items-center gap-0.5 shrink-0 cursor-pointer"
                            >
                              <span>Mở xem</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Tool execution badge */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/60 flex flex-col gap-1 text-[10px] text-emerald-400 font-medium">
                      {msg.toolCalls.map((t, idx) => {
                        const TOOL_LABELS = {
                          pos_get_today_summary: 'Tổng kết doanh thu hôm nay',
                          reports_get_overview: 'Báo cáo kinh doanh',
                          customer_search: 'Tra cứu khách hàng',
                          customer_create: 'Tạo khách hàng mới',
                          customer_update: 'Cập nhật khách hàng',
                          appointment_create: 'Đặt lịch hẹn mới',
                          appointment_search: 'Tra cứu lịch hẹn',
                          appointment_cancel: 'Hủy lịch hẹn',
                          pos_create_invoice: 'Tạo hóa đơn thanh toán',
                          services_search: 'Tra cứu dịch vụ',
                          service_create: 'Tạo dịch vụ mới',
                          products_search: 'Tra cứu sản phẩm',
                          staff_search: 'Tra cứu nhân viên',
                          staff_create: 'Thêm nhân viên mới',
                          branch_create: 'Tạo chi nhánh',
                          customer_filter: 'Lọc tập khách hàng',
                          customer_segment_create: 'Tạo tập khách hàng',
                          navigate_to: 'Chuyển màn hình'
                        };
                        return (
                          <div key={idx} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>Đã xử lý dữ liệu: <strong>{TOOL_LABELS[t.toolName] || t.toolName}</strong></span>
                          </div>
                        );
                      })}
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

          {/* Input Bar with Voice & File Support */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            {/* Ẩn input file thực tế để trigger bằng icon kẹp ghim */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processSelectedFile(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Đính kèm tệp Excel (.xlsx, .xls, .csv) để AI đọc và import"
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
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
              placeholder={isListening ? "Đang lắng nghe bạn nói..." : "Hỏi AI hoặc đính kèm file Excel để import..."}
              className="flex-1 bg-slate-800 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />

            <button
              type="button"
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
