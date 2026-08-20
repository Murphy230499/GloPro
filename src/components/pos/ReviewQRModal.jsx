'use client';
import React, { useState, useEffect } from 'react';
import { Smile, CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import { useT } from '@/lib/i18n';

const EMOJIS = [
  { score: 'poor', label: 'Quá tệ', icon: '😫' },
  { score: 'average', label: 'Bình thường', icon: '😐' },
  { score: 'good', label: 'Good', icon: '😚' },
  { score: 'very_good', label: 'Rất tốt', icon: '😍' },
];

export default function ReviewQRModal({ open, session, onClose, patchSession, syncSessionToDb }) {
  const { t } = useT();
  const [reviewStep, setReviewStep] = useState('waiting'); // 'waiting', 'reviewing', 'done'
  const [reviewData, setReviewData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !session) return;
    
    // Ensure the invoice is saved/synced in database so review page can load it
    if (syncSessionToDb) {
      syncSessionToDb(session);
    }

    // Check initial status
    if (session.reviewStatus === 'done' || session.reviewData?.status === 'done') {
      setReviewStep('done');
      setReviewData(session.reviewData);
    } else if (session.reviewStatus === 'reviewing' || session.reviewData?.status === 'reviewing') {
      setReviewStep('reviewing');
      setReviewData(session.reviewData);
    } else {
      const key = `glopro_review_${session.id}`;
      const existing = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          setReviewData(parsed);
          setReviewStep(parsed.status || 'done');
        } catch (e) {
          setReviewStep('waiting');
          setReviewData(null);
        }
      } else {
        setReviewStep('waiting');
        setReviewData(null);
      }
    }

    // Storage listener
    const handleStorageChange = (e) => {
      if (e.key === `glopro_review_${session.id}` && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          setReviewData(data);
          setReviewStep(data.status || 'done');
          
          if (data.status === 'done') {
            toast.success(t('feedback.toast_new_review', 'Khách hàng đã hoàn thành đánh giá!'));
            const patchObj = {
              reviewStatus: 'done',
              reviewData: data
            };
            if (data.tip !== undefined) {
              patchObj.tip = data.tip;
              patchObj.tipSplits = data.tipSplits || [];
            }
            if (data.customerInfo && data.customerInfo.name) {
              patchObj.customer = {
                id: data.customerInfo.id || 'cust_' + Date.now(),
                name: data.customerInfo.name,
                phone: data.customerInfo.phone,
                email: data.customerInfo.email,
                dob: data.customerInfo.dob,
                birthday: data.customerInfo.dob
              };
            }
            if (patchSession) patchSession(patchObj);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Supabase Channel listener
    const channel = supabase.channel(`glopro_review_${session.id}`)
      .on('broadcast', { event: 'status_change' }, (payload) => {
        if (payload?.payload) {
          const data = payload.payload;
          setReviewData(data);
          setReviewStep(data.status || 'done');
          if (data.status === 'done') {
            toast.success(t('feedback.toast_new_review', 'Khách hàng đã hoàn thành đánh giá!'));
            const patchObj = {
              reviewStatus: 'done',
              reviewData: data
            };
            if (data.tip !== undefined) {
              patchObj.tip = data.tip;
              patchObj.tipSplits = data.tipSplits || [];
            }
            if (data.customerInfo && data.customerInfo.name) {
              patchObj.customer = {
                id: data.customerInfo.id || 'cust_' + Date.now(),
                name: data.customerInfo.name,
                phone: data.customerInfo.phone,
                email: data.customerInfo.email,
                dob: data.customerInfo.dob,
                birthday: data.customerInfo.dob
              };
            }
            if (patchSession) patchSession(patchObj);
          }
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      supabase.removeChannel(channel);
    };
  }, [open, session?.id]);

  if (!open || !session) return null;

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const reviewUrl = `${originUrl}/review/${session.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=8&data=${encodeURIComponent(reviewUrl)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl p-6 text-center space-y-5">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 -mt-1">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-800">{t('pos.review_modal_title', 'Khảo sát & Đánh giá dịch vụ')}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* State 1: Waiting for scan */}
        {reviewStep === 'waiting' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">{t('pos.review_scan_qr', 'Quét mã QR để đánh giá')}</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {t('pos.review_scan_desc', 'Khách hàng mở camera điện thoại hoặc Zalo để quét mã QR đánh giá KTV và thưởng tip.')}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white border-2 border-slate-200 p-3 rounded-2xl inline-block shadow-sm">
              <img 
                src={qrImageUrl} 
                alt="QR Code Đánh Giá" 
                className="w-48 h-48 rounded-lg object-contain mx-auto"
                loading="eager"
              />
            </div>

            {/* Direct URL text & Copy button */}
            <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-left max-w-sm mx-auto">
              <input 
                type="text" 
                readOnly 
                value={reviewUrl} 
                className="flex-1 bg-transparent text-[11px] font-mono text-slate-600 outline-none truncate" 
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(reviewUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success(t('pos.copied_link', 'Đã sao chép link đánh giá!'));
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[10px] font-bold shrink-0 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {copied ? t('common.copied', 'Đã sao chép') : t('common.copy', 'Sao chép')}
              </button>
            </div>

            {/* Simulated trigger button for testing on same device */}
            <div>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span>{t('pos.open_review_tab', 'Mở link đánh giá (Tab mới)')}</span>
              </a>
            </div>

            {/* Waiting indicator */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
              <span>{t('pos.waiting_customer_scan', 'Đang chờ khách hàng quét mã...')}</span>
            </div>
          </div>
        )}

        {/* State 2: Customer is reviewing (Amber/Yellow) */}
        {reviewStep === 'reviewing' && (
          <div className="space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-500 flex items-center justify-center mx-auto animate-pulse">
              <Smile className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-amber-700 text-base">{t('pos.customer_reviewing_title', 'Khách hàng đang đánh giá!')}</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {t('pos.customer_reviewing_desc', 'Khách đang điền thông tin và chấm điểm chất lượng phục vụ trên điện thoại...')}
              </p>
            </div>

            {/* Progress animation */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-amber-800">{t('pos.receiving_realtime_data', 'Đang nhận dữ liệu thời gian thực...')}</span>
            </div>

            <div>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
              >
                {t('pos.reopen_review_page', 'Mở lại trang đánh giá')}
              </a>
            </div>
          </div>
        )}

        {/* State 3: Review Completed (Done / Green) */}
        {reviewStep === 'done' && (
          <div className="space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-500 flex items-center justify-center mx-auto animate-bounce shadow-xs">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base">{t('pos.review_done_title', 'Khách đã hoàn tất đánh giá!')}</h3>
              <p className="text-xs text-slate-400">{t('pos.review_done_desc', 'Ý kiến phản hồi và tiền tip đã được ghi nhận vào hoá đơn.')}</p>
            </div>

            {reviewData && (
              <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs text-slate-700 space-y-2.5 border border-slate-150">
                <div className="font-bold text-slate-800 pb-1.5 border-b border-slate-200 flex justify-between items-center">
                  <span>{t('pos.review_detail_title', 'Chi tiết đánh giá:')}</span>
                  {reviewData.customerInfo?.name && (
                    <span className="text-blue-600 font-semibold">{reviewData.customerInfo.name}</span>
                  )}
                </div>

                {/* Ratings per staff */}
                <div className="space-y-1.5">
                  {Object.entries(reviewData.ratings || {}).map(([sid, scoreKey]) => {
                    const ratingObj = EMOJIS.find(e => e.score === scoreKey) || { icon: '⭐', label: scoreKey };
                    const staffObj = (session.cart || []).find(x => x.staff_id === sid);
                    const staffName = staffObj?.staff_name || t('feedback.default_staff_title', 'Kỹ thuật viên');
                    return (
                      <div key={sid} className="flex justify-between items-center">
                        <span className="font-medium">{staffName}:</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          <span>{ratingObj.icon}</span>
                          <span>{ratingObj.label}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Tip total if any */}
                {reviewData.tip > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-emerald-600 font-black text-sm">
                    <span>{t('pos.tip_bonus_label', 'Thưởng thêm Tip:')}</span>
                    <span>+{formatVND(reviewData.tip)}</span>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={onClose} 
              className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              {t('pos.btn_close_and_continue', 'Đóng và tiếp tục')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
