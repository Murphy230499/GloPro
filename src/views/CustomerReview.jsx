'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import Avatar from '@/components/Avatar';
import { CheckCircle2, ShieldCheck, ArrowRight, Heart } from 'lucide-react';
import { toast } from '@/components/Layout';

const EMOJIS = [
  { score: 1, label: 'Quá thất vọng', icon: '😡' },
  { score: 2, label: 'Thất vọng', icon: '🙁' },
  { score: 3, label: 'Bình thường', icon: '😐' },
  { score: 4, label: 'Hài lòng', icon: '🙂' },
  { score: 5, label: 'Rất hài lòng', icon: '🥰' },
];

const TIP_SUGGESTIONS = [
  { value: 10000, label: '10k' },
  { value: 20000, label: '20k' },
  { value: 50000, label: '50k' },
  { value: 100000, label: '100k' },
];

export default function CustomerReview({ reviewId: reviewIdProp } = {}) {
  const params = useParams();
  const id = reviewIdProp || params?.id;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('review'); // 'review', 'tip', 'success'
  
  // Rating states
  const [staffList, setStaffList] = useState([]);
  const [ratings, setRatings] = useState({}); // { staffId: score }
  const [reasons, setReasons] = useState({}); // { staffId: text }

  // Tip states
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');

  useEffect(() => {
    base44.entities.Invoice.get(id).then((inv) => {
      if (inv) {
        setInvoice(inv);
        // Extract distinct staff members
        const list = [];
        (inv.items || []).forEach(item => {
          if (item.staff_id && !list.some(s => s.id === item.staff_id)) {
            list.push({
              id: item.staff_id,
              name: item.staff_name || 'Nhân viên',
              serviceName: item.name
            });
          }
        });
        setStaffList(list);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-sm border border-slate-100">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold text-slate-800">Không tìm thấy hoá đơn</h2>
          <p className="text-xs text-slate-400">Vui lòng kiểm tra lại liên kết hoặc quét lại mã QR trên hóa đơn.</p>
        </div>
      </div>
    );
  }

  const handleSelectEmoji = (staffId, score) => {
    setRatings(prev => ({ ...prev, [staffId]: score }));
  };

  const handleReasonChange = (staffId, text) => {
    setReasons(prev => ({ ...prev, [staffId]: text }));
  };

  const handleContinueToTip = () => {
    // Verify all staff have been rated
    const unrated = staffList.some(s => !ratings[s.id]);
    if (unrated) {
      toast.error('Vui lòng đánh giá điểm cho tất cả nhân viên phục vụ');
      return;
    }
    setStep('tip');
  };

  const handleSubmitReview = async () => {
    const finalTip = customTip ? (Number(customTip) || 0) : tipAmount;
    
    try {
      // 1. Calculate tip splits distributed equally to reviewed staff
      let splits = [];
      if (finalTip > 0 && staffList.length > 0) {
        const splitShare = Math.round(finalTip / staffList.length);
        splits = staffList.map(st => ({
          staff_id: st.id,
          amount: splitShare
        }));
      }

      // 2. Update Invoice with tip in database
      const netTotal = invoice.subtotal - (invoice.discount || 0);
      await base44.entities.Invoice.update(invoice.id, {
        tip: finalTip,
        total: netTotal + finalTip,
        tip_splits: splits
      });

      // 3. Trigger localStorage for real-time listener on POS screen
      localStorage.setItem(`glopro_review_${invoice.id}`, JSON.stringify({
        status: 'done',
        ratings,
        reasons,
        tip: finalTip
      }));

      setStep('success');
      toast.success('Gửi đánh giá thành công!');
    } catch (e) {
      toast.error('Lỗi khi gửi đánh giá: ' + (e.message || e));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col min-h-[500px]">
        {/* Header */}
        <div className="bg-primary/5 px-6 py-5 border-b border-primary/10 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div className="text-left">
            <h1 className="font-bold text-sm text-slate-800">Đánh giá chất lượng dịch vụ</h1>
            <p className="text-[10px] text-slate-400 font-semibold">{invoice.invoice_code}</p>
          </div>
        </div>

        {/* Step: Rating Emojis */}
        {step === 'review' && (
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="font-bold text-slate-800 text-base">Ý kiến của bạn là vô giá!</h2>
                <p className="text-xs text-slate-400">Vui lòng phản hồi mức độ hài lòng về kỹ thuật viên phục vụ bạn.</p>
              </div>

              <div className="space-y-5">
                {staffList.map((st) => {
                  const currentScore = ratings[st.id] || 0;
                  return (
                    <div key={st.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={st.name} size={36} color="#FF6B9D" />
                        <div className="text-left">
                          <div className="font-bold text-xs text-slate-700">{st.name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{st.serviceName}</div>
                        </div>
                      </div>

                      {/* Emojis selection */}
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {EMOJIS.map((emoji) => {
                          const isSelected = currentScore === emoji.score;
                          return (
                            <button
                              key={emoji.score}
                              onClick={() => handleSelectEmoji(st.id, emoji.score)}
                              className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                                isSelected 
                                  ? 'bg-primary/5 border-primary shadow-xs scale-105' 
                                  : 'bg-white border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <span className="text-xl mb-0.5">{emoji.icon}</span>
                              <span className="text-[9px] text-slate-500 font-bold whitespace-nowrap">{emoji.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Reason input for lowest rating score (score = 1) */}
                      {currentScore === 1 && (
                        <textarea
                          value={reasons[st.id] || ''}
                          onChange={(e) => handleReasonChange(st.id, e.target.value)}
                          placeholder="Bạn chưa hài lòng ở điểm nào? Hãy chia sẻ để chúng tôi cải thiện..."
                          className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-primary placeholder:text-slate-350 min-h-[70px] bg-white resize-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleContinueToTip}
              className="w-full mt-8 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              Tiếp tục <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: Tip Suggestion */}
        {step === 'tip' && (
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <Heart className="w-8 h-8 text-pink-500 mx-auto animate-pulse mb-1" />
                <h2 className="font-bold text-slate-800 text-base">Gửi lời cảm ơn</h2>
                <p className="text-xs text-slate-400">Nếu hài lòng, bạn có thể thưởng thêm tip (không bắt buộc).</p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-4 gap-2.5">
                {TIP_SUGGESTIONS.map((sug) => {
                  const isSelected = tipAmount === sug.value && !customTip;
                  return (
                    <button
                      key={sug.value}
                      onClick={() => {
                        setTipAmount(sug.value);
                        setCustomTip('');
                      }}
                      className={`py-3 rounded-xl border font-bold text-xs transition-all ${
                        isSelected 
                          ? 'bg-primary border-primary text-white' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {sug.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tip Input */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hoặc nhập số tiền cụ thể</label>
                <div className="relative">
                  <input
                    type="number"
                    value={customTip}
                    onChange={(e) => {
                      setCustomTip(e.target.value);
                      setTipAmount(0);
                    }}
                    placeholder="Nhập số tiền tip..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-primary pr-12 text-slate-700"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <button
                onClick={handleSubmitReview}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-colors shadow-sm"
              >
                Gửi đánh giá & Hoàn tất
              </button>
              <button
                onClick={() => {
                  setTipAmount(0);
                  setCustomTip('');
                  handleSubmitReview();
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        )}

        {/* Step: Success Screen */}
        {step === 'success' && (
          <div className="flex-grow p-6 flex flex-col justify-center items-center text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-800">Đánh giá hoàn tất!</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[280px]">
                Cảm ơn bạn đã gửi ý kiến phản hồi. Những đóng góp của bạn giúp GloPro Spa & Beauty ngày một hoàn thiện chất lượng phục vụ tốt hơn!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
