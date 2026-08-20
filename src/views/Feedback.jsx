'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Smile, Frown, Meh, Heart, Star, Sparkles, MessageSquareHeart, 
  TrendingUp, Users, DollarSign, AlertTriangle, CheckCircle2, 
  Calendar, Filter, Search, Download, RefreshCw, ChevronRight, 
  Clock, Phone, User, ExternalLink, X, ShieldAlert, Award, MessageCircle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useBranch } from '@/lib/BranchContext';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import { useT } from '@/lib/i18n';
import Avatar from '@/components/Avatar';

export default function FeedbackView() {
  const { t } = useT();
  const { currentBranchId, branches } = useBranch();
  
  const [invoices, setInvoices] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('30days'); // 'today', '7days', '30days', 'all'
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all', 'very_good', 'good', 'average', 'poor'
  const [resolutionFilter, setResolutionFilter] = useState('all'); // 'all', 'pending', 'resolved'
  
  // Modal detail
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [savingResolution, setSavingResolution] = useState(false);

  // Dynamic translated Emoji dictionary based on current branch language
  const EMOJI_CONFIG = useMemo(() => ({
    very_good: { label: t('feedback.emoji_very_good', 'Rất tốt'), icon: '😍', color: 'text-pink-600 bg-pink-50 border-pink-200', score: 5 },
    good: { label: t('feedback.emoji_good', 'Good'), icon: '😚', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', score: 4 },
    average: { label: t('feedback.emoji_average', 'Bình thường'), icon: '😐', color: 'text-amber-600 bg-amber-50 border-amber-200', score: 3 },
    poor: { label: t('feedback.emoji_poor', 'Quá tệ'), icon: '😫', color: 'text-rose-600 bg-rose-50 border-rose-200', score: 1 },
  }), [t]);

  // Load Data
  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [invList, staffRes] = await Promise.all([
        base44.entities.Invoice.list('-created_at', 200).catch(() => []),
        base44.entities.Staff.list().catch(() => [])
      ]);

      setInvoices(invList || []);
      setStaffList(staffRes || []);
    } catch (err) {
      console.error('[Feedback] Load Error:', err);
      toast.error(t('feedback.err_load', 'Lỗi khi tải dữ liệu phản hồi: ') + (err.message || err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranchId]);

  // Realtime Supabase Broadcast listener for new reviews
  useEffect(() => {
    const channel = supabase.channel('glopro_feedback_global')
      .on('broadcast', { event: 'status_change' }, (payload) => {
        if (payload?.payload?.status === 'done') {
          toast.success(t('feedback.toast_new_review', 'Có lượt đánh giá mới vừa được gửi!'));
          loadData(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [t]);

  // Parse review data from invoices
  const feedbackItems = useMemo(() => {
    const list = [];

    invoices.forEach(inv => {
      let rData = inv.review_data;
      if (typeof rData === 'string') {
        try {
          rData = JSON.parse(rData);
        } catch (e) {
          rData = null;
        }
      }

      // Check if invoice has review data or ratings
      if (rData && (rData.ratings || rData.status === 'done')) {
        const ratings = rData.ratings || {};
        const poorReasons = rData.poorReasons || {};
        const tipSplits = rData.tipSplits || inv.tip_splits || [];
        const tip = inv.tip || rData.tip || 0;
        
        // Find date
        const reviewDate = rData.reviewedAt || inv.updated_at || inv.created_at || inv.date;

        // Parse per-staff feedback entries
        Object.entries(ratings).forEach(([staffId, scoreKey]) => {
          const staffObj = staffList.find(s => s.id === staffId);
          const staffName = staffObj?.full_name || staffObj?.name || (inv.items || []).find(i => i.staff_id === staffId)?.staff_name || t('feedback.default_staff_title', 'Kỹ thuật viên');
          const staffServices = (inv.items || []).filter(i => i.staff_id === staffId).map(i => i.name);
          const staffTip = tipSplits.find(ts => ts.staff_id === staffId || ts.staffId === staffId)?.amount || 0;
          const reasons = poorReasons[staffId] || [];

          list.push({
            id: `${inv.id}_${staffId}`,
            invoiceId: inv.id,
            invoiceCode: inv.invoice_code || inv.saleCode || (inv.id ? String(inv.id).slice(-6) : 'HĐ'),
            customerName: rData.customerInfo?.name || inv.customer_name || inv.customer?.name || t('feedback.walk_in_guest', 'Khách vãng lai'),
            customerPhone: rData.customerInfo?.phone || inv.customer_phone || inv.customer?.phone || '—',
            customerEmail: rData.customerInfo?.email || inv.customer_email || '—',
            customerDob: rData.customerInfo?.dob || '—',
            staffId,
            staffName,
            staffAvatar: staffObj?.avatar_url,
            staffRole: staffObj?.role,
            staffServices: staffServices.length > 0 ? staffServices : (inv.items || []).map(i => i.name),
            scoreKey,
            ratingScore: EMOJI_CONFIG[scoreKey]?.score || 4,
            poorReasons: reasons,
            customReason: rData.customReason || '',
            tip: staffTip > 0 ? staffTip : (Object.keys(ratings).length === 1 ? tip : 0),
            totalInvoiceTip: tip,
            invoiceTotal: inv.total || 0,
            date: reviewDate,
            branchId: inv.branch_id,
            isResolved: inv.cskh_resolved || rData.isResolved || false,
            resolutionNote: inv.cskh_note || rData.resolutionNote || '',
            rawInvoice: inv,
            rawReviewData: rData
          });
        });

        // If no per-staff ratings but has general feedback
        if (Object.keys(ratings).length === 0) {
          list.push({
            id: `${inv.id}_general`,
            invoiceId: inv.id,
            invoiceCode: inv.invoice_code || (inv.id ? String(inv.id).slice(-6) : 'HĐ'),
            customerName: inv.customer_name || t('feedback.walk_in_guest', 'Khách vãng lai'),
            customerPhone: inv.customer_phone || '—',
            staffId: 'general',
            staffName: t('feedback.general_service_team', 'Toàn bộ ca phục vụ'),
            staffServices: (inv.items || []).map(i => i.name),
            scoreKey: 'good',
            ratingScore: 4,
            poorReasons: [],
            customReason: '',
            tip: inv.tip || 0,
            totalInvoiceTip: inv.tip || 0,
            invoiceTotal: inv.total || 0,
            date: reviewDate,
            branchId: inv.branch_id,
            isResolved: true,
            rawInvoice: inv,
            rawReviewData: rData
          });
        }
      }
    });

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [invoices, staffList, EMOJI_CONFIG, t]);

  // Date Filter helper
  const filteredFeedbacks = useMemo(() => {
    const now = new Date();

    return feedbackItems.filter(item => {
      // Branch filter
      if (currentBranchId !== 'all' && currentBranchId && item.branchId && item.branchId !== currentBranchId) {
        return false;
      }

      // Date filter
      if (dateRange !== 'all') {
        const itemDate = new Date(item.date);
        if (dateRange === 'today') {
          if (itemDate.toDateString() !== now.toDateString()) return false;
        } else if (dateRange === '7days') {
          const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
          if (diffDays > 7) return false;
        } else if (dateRange === '30days') {
          const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
          if (diffDays > 30) return false;
        }
      }

      // Staff filter
      if (selectedStaff !== 'all' && item.staffId !== selectedStaff) {
        return false;
      }

      // Rating filter
      if (ratingFilter !== 'all' && item.scoreKey !== ratingFilter) {
        return false;
      }

      // Resolution status
      if (resolutionFilter === 'pending' && item.isResolved) return false;
      if (resolutionFilter === 'resolved' && !item.isResolved) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.customerName?.toLowerCase().includes(q);
        const matchPhone = item.customerPhone?.toLowerCase().includes(q);
        const matchCode = item.invoiceCode?.toLowerCase().includes(q);
        const matchStaff = item.staffName?.toLowerCase().includes(q);
        const matchReason = item.poorReasons?.some(r => r.toLowerCase().includes(q)) || item.customReason?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCode && !matchStaff && !matchReason) return false;
      }

      return true;
    });
  }, [feedbackItems, currentBranchId, dateRange, selectedStaff, ratingFilter, resolutionFilter, search]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const total = filteredFeedbacks.length;
    if (total === 0) {
      return { total: 0, csat: 100, totalTip: 0, poorCount: 0, avgScore: 5.0, countByScore: {} };
    }

    let positiveCount = 0;
    let poorCount = 0;
    let totalTip = 0;
    let scoreSum = 0;
    const countByScore = { very_good: 0, good: 0, average: 0, poor: 0 };

    filteredFeedbacks.forEach(item => {
      countByScore[item.scoreKey] = (countByScore[item.scoreKey] || 0) + 1;
      scoreSum += item.ratingScore;
      totalTip += (item.tip || 0);

      if (item.scoreKey === 'very_good' || item.scoreKey === 'good') {
        positiveCount++;
      } else if (item.scoreKey === 'poor') {
        poorCount++;
      }
    });

    return {
      total,
      csat: Math.round((positiveCount / total) * 100),
      totalTip,
      poorCount,
      avgScore: (scoreSum / total).toFixed(1),
      countByScore
    };
  }, [filteredFeedbacks]);

  // Staff Performance Ranking Leaderboard
  const staffLeaderboard = useMemo(() => {
    const map = {};

    filteredFeedbacks.forEach(item => {
      if (!item.staffId || item.staffId === 'general') return;
      if (!map[item.staffId]) {
        map[item.staffId] = {
          id: item.staffId,
          name: item.staffName,
          avatar: item.staffAvatar,
          role: item.staffRole,
          totalReviews: 0,
          scoreSum: 0,
          totalTip: 0,
          very_good: 0,
          good: 0,
          average: 0,
          poor: 0
        };
      }

      const st = map[item.staffId];
      st.totalReviews++;
      st.scoreSum += item.ratingScore;
      st.totalTip += (item.tip || 0);
      st[item.scoreKey] = (st[item.scoreKey] || 0) + 1;
    });

    return Object.values(map)
      .map(st => ({
        ...st,
        avgScore: (st.scoreSum / (st.totalReviews || 1)).toFixed(1),
        satisfactionPct: Math.round(((st.very_good + st.good) / (st.totalReviews || 1)) * 100)
      }))
      .sort((a, b) => b.avgScore - a.avgScore || b.totalReviews - a.totalReviews);
  }, [filteredFeedbacks]);

  // Save Resolution Note for Complaints
  const handleSaveResolution = async () => {
    if (!selectedFeedback) return;
    setSavingResolution(true);
    try {
      const inv = selectedFeedback.rawInvoice;
      const updatedReviewData = {
        ...(selectedFeedback.rawReviewData || {}),
        isResolved: true,
        resolutionNote: resolutionNote,
        resolvedAt: new Date().toISOString()
      };

      await base44.entities.Invoice.update(inv.id, {
        cskh_resolved: true,
        cskh_note: resolutionNote,
        review_data: updatedReviewData
      });

      toast.success(t('feedback.toast_save_success', 'Đã lưu ghi chú xử lý khiếu nại thành công!'));
      setSelectedFeedback(null);
      loadData(true);
    } catch (e) {
      toast.error('Lỗi khi lưu: ' + (e.message || e));
    } finally {
      setSavingResolution(false);
    }
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    if (filteredFeedbacks.length === 0) {
      return toast.error(t('feedback.err_no_export_data', 'Không có dữ liệu phản hồi để xuất!'));
    }

    const headers = [
      t('feedback.th_invoice_code', 'Mã Hoá Đơn'),
      t('feedback.th_review_date', 'Ngày Đánh Giá'),
      t('feedback.th_customer_name', 'Khách Hàng'),
      t('feedback.th_phone', 'SĐT'),
      t('feedback.th_staff', 'Kỹ Thuật Viên'),
      t('feedback.th_rating', 'Đánh Giá'),
      t('feedback.th_score', 'Điểm'),
      t('feedback.th_reasons', 'Lý Do Khiếu Nại'),
      t('feedback.th_comments', 'Góp Ý'),
      t('feedback.th_tip', 'Tiền Tip'),
      t('feedback.th_status', 'Trạng Thái')
    ];

    const rows = filteredFeedbacks.map(f => [
      `"${f.invoiceCode}"`,
      `"${new Date(f.date).toLocaleString('vi-VN')}"`,
      `"${f.customerName}"`,
      `"${f.customerPhone}"`,
      `"${f.staffName}"`,
      `"${EMOJI_CONFIG[f.scoreKey]?.label || f.scoreKey}"`,
      f.ratingScore,
      `"${f.poorReasons.join(', ')}"`,
      `"${f.customReason.replace(/"/g, '""')}"`,
      f.tip,
      f.isResolved ? `"${t('feedback.status_resolved_badge', 'Đã xử lý')}"` : (f.scoreKey === 'poor' ? `"${t('feedback.status_pending_badge', 'Chờ CSKH')}"` : `"${t('feedback.status_good_badge', 'Tốt')}"`)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Feedback_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('feedback.toast_export_success', 'Đã tải xuống file báo cáo đánh giá!'));
  };

  return (
    <div className="space-y-5 pb-10 font-sans antialiased text-slate-800 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500 flex items-center justify-center text-white shadow-xs shrink-0">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>{t('feedback.title', 'Đánh giá')}</span>
              <span className="text-[11px] bg-pink-50 border border-pink-200 text-pink-700 font-semibold px-2 py-0.5 rounded-full">
                {t('feedback.badge_realtime', 'QR Realtime')}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('feedback.subtitle', 'Theo dõi mức độ hài lòng của khách, chấm điểm KTV và tiền tip từ mã QR thời gian thực.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Date Range */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
            {[
              { id: 'today', label: t('feedback.range_today', 'Hôm nay') },
              { id: '7days', label: t('feedback.range_7days', '7 ngày') },
              { id: '30days', label: t('feedback.range_30days', '30 ngày') },
              { id: 'all', label: t('feedback.range_all', 'Tất cả') },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDateRange(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateRange === tab.id 
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">{t('feedback.export_file', 'Xuất File')}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
            title={t('feedback.refresh_tooltip', 'Làm mới dữ liệu')}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-pink-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Reviews */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('feedback.kpi_total_reviews', 'Tổng Lượt Đánh Giá')}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{metrics.total}</span>
            <span className="text-xs font-normal text-slate-400">{t('feedback.kpi_scans_completed', 'lượt quét hoàn tất')}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-xs text-slate-500">
            <span>{t('feedback.kpi_avg_score', 'Điểm trung bình:')}</span>
            <span className="font-semibold text-amber-500 flex items-center">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline mr-0.5" />
              {metrics.avgScore} / 5.0
            </span>
          </div>
        </div>

        {/* Card 2: Satisfaction Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('feedback.kpi_csat', 'Tỷ Lệ Hài Lòng (CSAT)')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-emerald-500/20" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{metrics.csat}%</span>
            <span className="text-xs font-normal text-slate-400">{t('feedback.kpi_positive_sub', 'Rất tốt & Tốt')}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="text-pink-600 font-semibold">😍 {metrics.countByScore.very_good || 0}</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">😚 {metrics.countByScore.good || 0}</span>
          </div>
        </div>

        {/* Card 3: Total Tips Earned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('feedback.kpi_tip_title', 'Tiền Tip Qua Review')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{formatVND(metrics.totalTip)}</span>
          </div>
          <div className="mt-2.5 text-xs text-slate-400 font-normal">
            {t('feedback.kpi_tip_sub', 'Tự động chia vào bảng lương & phiếu thu')}
          </div>
        </div>

        {/* Card 4: Complaints & Poor Reviews */}
        <div className={`p-5 rounded-2xl border transition-all ${
          metrics.poorCount > 0 
            ? 'bg-rose-50/50 border-rose-200 shadow-2xs' 
            : 'bg-white border-slate-200/80 shadow-2xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t('feedback.kpi_complaints_title', 'Cần CSKH Chú Ý')}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              metrics.poorCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${metrics.poorCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {metrics.poorCount}
            </span>
            <span className="text-xs font-normal text-slate-400">{t('feedback.kpi_poor_sub', 'đánh giá Kém (😫)')}</span>
          </div>
          <div className="mt-2.5 text-xs font-medium">
            {metrics.poorCount > 0 ? (
              <span className="text-rose-600 font-semibold">{t('feedback.kpi_urgent_alert', 'Cần liên hệ hỗ trợ khách hàng ngay')}</span>
            ) : (
              <span className="text-emerald-600 font-semibold">{t('feedback.kpi_no_complaints', 'Không có khiếu nại chưa xử lý')}</span>
            )}
          </div>
        </div>

      </div>

      {/* Staff Leaderboard Ranking */}
      {staffLeaderboard.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800">{t('feedback.leaderboard_title', 'Bảng Xếp Hạng & Đánh Giá Kỹ Thuật Viên')}</h2>
            </div>
            <span className="text-xs text-slate-400">
              {t('feedback.leaderboard_sub', 'Dựa trên {total} lượt đánh giá thực tế từ khách hàng', { total: metrics.total })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {staffLeaderboard.map((st, index) => {
              const isTop1 = index === 0;
              const isTop2 = index === 1;
              const isTop3 = index === 2;

              return (
                <div 
                  key={st.id}
                  className={`p-4 rounded-xl border transition-all relative ${
                    isTop1 
                      ? 'bg-amber-50/40 border-amber-300 shadow-2xs' 
                      : 'bg-slate-50/50 border-slate-200/70 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Top Rank Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    {isTop1 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold shadow-2xs flex items-center gap-0.5">
                        👑 Top 1
                      </span>
                    )}
                    {isTop2 && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                        🥈 Top 2
                      </span>
                    )}
                    {isTop3 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                        🥉 Top 3
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <Avatar src={st.avatar} name={st.name} size={38} color={isTop1 ? '#F59E0B' : '#64748B'} />
                    <div className="min-w-0 flex-1 pr-10">
                      <div className="font-semibold text-sm text-slate-800 truncate">{st.name}</div>
                      <div className="text-xs text-slate-400 capitalize truncate">{st.role || t('feedback.default_staff_title', 'Kỹ thuật viên')}</div>
                    </div>
                  </div>

                  {/* Rating Scores */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-slate-400 block">{t('feedback.satisfaction_rate', 'Hài lòng:')}</span>
                      <span className="font-bold text-emerald-600 text-sm">{st.satisfactionPct}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{t('feedback.tip_received', 'Tiền Tip nhận:')}</span>
                      <span className="font-semibold text-amber-600">{formatVND(st.totalTip)}</span>
                    </div>
                  </div>

                  {/* Emoji mini breakdown */}
                  <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-dashed border-slate-200 text-slate-500 font-medium">
                    <span title={t('feedback.emoji_very_good', 'Rất tốt')}>😍 {st.very_good}</span>
                    <span title={t('feedback.emoji_good', 'Good')}>😚 {st.good}</span>
                    <span title={t('feedback.emoji_average', 'Bình thường')}>😐 {st.average}</span>
                    <span title={t('feedback.emoji_poor', 'Quá tệ')} className={st.poor > 0 ? 'text-rose-600 font-bold' : ''}>😫 {st.poor}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Feedback Log Table & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200/80 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('feedback.search_placeholder', 'Tìm theo tên khách, SĐT, KTV, mã HĐ hoặc lý do...')}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-normal focus:border-pink-500 focus:outline-none bg-slate-50/50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Staff Select */}
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none"
              >
                <option value="all">{t('feedback.all_staff', 'Tất cả Kỹ thuật viên ({count})', { count: staffList.length })}</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name || s.name}</option>
                ))}
              </select>

              {/* Status Select */}
              <select
                value={resolutionFilter}
                onChange={(e) => setResolutionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none"
              >
                <option value="all">{t('feedback.all_cskh_status', 'Tất cả trạng thái CSKH')}</option>
                <option value="pending">{t('feedback.status_pending_filter', 'Chờ CSKH xử lý')}</option>
                <option value="resolved">{t('feedback.status_resolved_filter', 'Đã chăm sóc / Xử lý')}</option>
              </select>
            </div>
          </div>

          {/* Rating Emoji filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
            {[
              { id: 'all', label: t('feedback.tab_all_emotions', 'Tất cả cảm xúc'), icon: null, count: feedbackItems.length },
              { id: 'very_good', label: t('feedback.emoji_very_good', 'Rất tốt'), icon: '😍', count: metrics.countByScore.very_good || 0 },
              { id: 'good', label: t('feedback.emoji_good', 'Good'), icon: '😚', count: metrics.countByScore.good || 0 },
              { id: 'average', label: t('feedback.emoji_average', 'Bình thường'), icon: '😐', count: metrics.countByScore.average || 0 },
              { id: 'poor', label: t('feedback.emoji_poor', 'Quá tệ'), icon: '😫', count: metrics.countByScore.poor || 0 },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRatingFilter(r.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                  ratingFilter === r.id
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r.icon && <span>{r.icon}</span>}
                <span>{r.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  ratingFilter === r.id ? 'bg-white/20 text-white font-semibold' : 'bg-slate-200 text-slate-700'
                }`}>
                  {r.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">{t('feedback.th_time_code', 'Thời gian / Mã HĐ')}</th>
                <th className="py-3 px-4">{t('feedback.th_customer', 'Khách Hàng')}</th>
                <th className="py-3 px-4">{t('feedback.th_staff_service', 'KTV & Dịch Vụ')}</th>
                <th className="py-3 px-4">{t('feedback.th_emotion_rating', 'Cảm Xúc & Đánh Giá')}</th>
                <th className="py-3 px-4">{t('feedback.th_reasons_comments', 'Lý Do / Góp Ý')}</th>
                <th className="py-3 px-4 text-right">{t('feedback.th_tip', 'Tiền Tip')}</th>
                <th className="py-3 px-4 text-center">{t('feedback.th_cskh', 'CSKH')}</th>
                <th className="py-3 px-4 text-right">{t('feedback.th_detail', 'Chi Tiết')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-2" />
                    <span>{t('feedback.loading_data', 'Đang nạp dữ liệu phản hồi...')}</span>
                  </td>
                </tr>
              ) : filteredFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Smile className="w-12 h-12 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                    <p className="font-semibold text-slate-700 text-sm">{t('feedback.no_data_title', 'Chưa có lượt đánh giá nào phù hợp bộ lọc')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t('feedback.no_data_sub', 'Khách hàng quét mã QR tại quầy POS để gửi đánh giá dịch vụ.')}</p>
                  </td>
                </tr>
              ) : (
                filteredFeedbacks.map((f) => {
                  const emoji = EMOJI_CONFIG[f.scoreKey] || EMOJI_CONFIG.good;
                  const hasComplaints = f.poorReasons.length > 0 || f.customReason;

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Date & Invoice */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link 
                          href={`/invoices?id=${f.invoiceId}`}
                          className="font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <span>#{f.invoiceCode}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(f.date).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{f.customerName}</div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{f.customerPhone}</span>
                        </div>
                      </td>

                      {/* Staff & Service */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Avatar src={f.staffAvatar} name={f.staffName} size={22} color="#64748B" />
                          <span className="font-semibold text-slate-800 truncate">{f.staffName}</span>
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {f.staffServices.join(', ')}
                        </div>
                      </td>

                      {/* Score / Emoji */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${emoji.color}`}>
                          <span className="text-sm">{emoji.icon}</span>
                          <span>{emoji.label}</span>
                        </span>
                      </td>

                      {/* Reasons / Comments */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {hasComplaints ? (
                          <div className="space-y-1">
                            {f.poorReasons.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {f.poorReasons.map((r, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-medium border border-rose-200/60">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}
                            {f.customReason && (
                              <p className="text-xs text-slate-600 italic line-clamp-1">
                                "{f.customReason}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">{t('feedback.no_complaints_label', '— Không có khiếu nại —')}</span>
                        )}
                      </td>

                      {/* Tip */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {f.tip > 0 ? (
                          <span className="font-bold text-emerald-600 text-xs">
                            +{formatVND(f.tip)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0 đ</span>
                        )}
                      </td>

                      {/* CSKH Resolution Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {f.scoreKey === 'poor' ? (
                          f.isResolved ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-300 flex items-center gap-1 justify-center">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t('feedback.status_resolved_badge', 'Đã xử lý')}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold border border-rose-300 animate-pulse flex items-center gap-1 justify-center">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{t('feedback.status_pending_badge', 'Chờ CSKH')}</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs">{t('feedback.status_good_badge', 'Tốt')}</span>
                        )}
                      </td>

                      {/* Detail action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedFeedback(f);
                            setResolutionNote(f.resolutionNote || '');
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          {t('feedback.btn_view_detail', 'Xem chi tiết')}
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination / row count */}
        <div className="p-4 border-t border-slate-200/80 text-xs text-slate-500 flex justify-between items-center">
          <span>{t('feedback.footer_showing', 'Hiển thị {count} lượt đánh giá', { count: filteredFeedbacks.length })}</span>
          <span className="text-xs text-slate-400">{t('feedback.footer_realtime', 'Dữ liệu đồng bộ Realtime từ máy khách')}</span>
        </div>

      </div>

      {/* Detail & Resolution Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 -mt-1">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-5 h-5 text-pink-500" />
                <span className="font-bold text-slate-800 text-sm">{t('feedback.modal_title', 'Chi Tiết Đánh Giá Khách Hàng')}</span>
              </div>
              <button 
                onClick={() => setSelectedFeedback(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Invoice Info */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{t('feedback.modal_invoice', 'Hoá đơn:')}</span>
                <span className="font-semibold text-slate-800">#{selectedFeedback.invoiceCode} ({formatVND(selectedFeedback.invoiceTotal)})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{t('feedback.modal_customer', 'Khách hàng:')}</span>
                <span className="font-semibold text-emerald-600">{selectedFeedback.customerName} • {selectedFeedback.customerPhone}</span>
              </div>
              {selectedFeedback.customerEmail && selectedFeedback.customerEmail !== '—' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">{t('feedback.modal_email', 'Email:')}</span>
                  <span className="text-slate-700">{selectedFeedback.customerEmail}</span>
                </div>
              )}
              {selectedFeedback.customerDob && selectedFeedback.customerDob !== '—' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">{t('feedback.modal_dob', 'Ngày sinh:')}</span>
                  <span className="text-slate-700">{selectedFeedback.customerDob}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{t('feedback.modal_reviewed_at', 'Thời gian đánh giá:')}</span>
                <span className="text-slate-700">{new Date(selectedFeedback.date).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            {/* Staff & Service Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('feedback.modal_staff_header', 'Đánh Giá Kỹ Thuật Viên')}</h4>
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={selectedFeedback.staffAvatar} name={selectedFeedback.staffName} size={32} color="#64748B" />
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{selectedFeedback.staffName}</div>
                      <div className="text-xs text-slate-400">{selectedFeedback.staffServices.join(', ')}</div>
                    </div>
                  </div>
                  
                  {/* Emoji Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border ${EMOJI_CONFIG[selectedFeedback.scoreKey]?.color}`}>
                    <span className="text-base">{EMOJI_CONFIG[selectedFeedback.scoreKey]?.icon}</span>
                    <span>{EMOJI_CONFIG[selectedFeedback.scoreKey]?.label}</span>
                  </span>
                </div>

                {/* Complaint Reasons */}
                {selectedFeedback.poorReasons.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-rose-600 block">{t('feedback.modal_poor_reasons_title', 'Lý do khách chưa hài lòng:')}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedFeedback.poorReasons.map((r, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom feedback comment */}
                {selectedFeedback.customReason && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
                    <span className="font-semibold text-slate-800 not-italic block mb-0.5">{t('feedback.modal_custom_comment_title', 'Ý kiến đóng góp khác:')}</span>
                    "{selectedFeedback.customReason}"
                  </div>
                )}

                {/* Tip amount */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">{t('feedback.modal_staff_tip_title', 'Tiền Tip thưởng KTV:')}</span>
                  <span className="font-bold text-emerald-600 text-sm">+{formatVND(selectedFeedback.tip)}</span>
                </div>
              </div>
            </div>

            {/* Resolution Action for Poor Reviews */}
            {selectedFeedback.scoreKey === 'poor' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-800">
                  {t('feedback.modal_cskh_title', 'Ghi chú chăm sóc khách hàng / Xử lý khiếu nại:')}
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder={t('feedback.modal_cskh_placeholder', 'Ví dụ: Đã gọi điện xin lỗi khách, tặng voucher giảm giá 20% cho lần ghé tới...')}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveResolution}
                  disabled={savingResolution}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingResolution ? t('feedback.modal_btn_saving', 'Đang lưu...') : t('feedback.modal_btn_save_resolution', 'Xác nhận đã xử lý khiếu nại')}</span>
                </button>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setSelectedFeedback(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              {t('feedback.modal_btn_close', 'Đóng')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
