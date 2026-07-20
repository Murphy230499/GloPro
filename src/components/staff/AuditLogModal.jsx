'use client';

import React, { useState, useEffect } from 'react';
import { X, History, Search, Calendar, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AuditLogModal({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const list = await base44.entities.StaffCommissionLog.list();
        // Sort descending by created_at
        const sorted = (list || []).sort((a, b) => b.created_at.localeCompare(a.created_at));
        setLogs(sorted);
      } catch (e) {
        console.error('Lỗi nạp nhật ký thao tác:', e);
        const local = localStorage.getItem('glopro_commission_logs');
        setLogs(local ? JSON.parse(local) : []);
      }
      setLoading(false);
    };
    loadLogs();
  }, []);

  const formatDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return isoStr;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full md:max-w-lg rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <History className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800 font-sans">Lịch sử thao tác</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-primary transition-all mb-4 shrink-0 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input 
            type="text"
            placeholder="tìm kiếm lịch sử..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs font-normal outline-none w-full text-slate-700 placeholder:text-slate-400/70"
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto" /></div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Chưa ghi nhận hoạt động thao tác hoa hồng nào.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-xs space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 text-[10px] text-slate-450 font-bold">
                  <span className="bg-purple-50 text-purple-650 px-2 py-0.5 rounded-md border border-purple-100/60 uppercase">{log.action_type}</span>
                  <span className="flex items-center gap-1 font-semibold"><Calendar className="w-3 h-3" /> {formatDate(log.created_at)}</span>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-slate-650">Người thực hiện: <span className="font-bold text-slate-800">{log.user_name}</span></div>
                  <div className="text-slate-600 whitespace-pre-wrap leading-relaxed mt-1 font-medium bg-white p-2.5 rounded-xl border border-slate-100">{log.description}</div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
