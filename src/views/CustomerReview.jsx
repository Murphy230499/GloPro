'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import { supabase } from '@/lib/supabaseClient';
import { 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Heart, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Globe, 
  Check, 
  X, 
  Clock, 
  Smile, 
  Sparkles, 
  AlertCircle,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Receipt,
  Award,
  Star,
  Gift,
  HelpCircle,
  DollarSign,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import Avatar from '@/components/Avatar';

const EMOJI_OPTIONS = [
  { 
    id: 'poor', 
    score: 1, 
    labelEn: 'Poor', 
    labelVi: 'Chưa hài lòng', 
    emoji: '😫', 
    descEn: 'Needs improvement',
    descVi: 'Cần cải thiện',
    activeClass: 'bg-rose-50 border-rose-500 text-rose-700 shadow-rose-500/10 ring-2 ring-rose-500/20',
    iconColor: 'text-rose-500'
  },
  { 
    id: 'average', 
    score: 2, 
    labelEn: 'Average', 
    labelVi: 'Bình thường', 
    emoji: '😐', 
    descEn: 'Acceptable',
    descVi: 'Tạm ổn',
    activeClass: 'bg-amber-50 border-amber-500 text-amber-700 shadow-amber-500/10 ring-2 ring-amber-500/20',
    iconColor: 'text-amber-500'
  },
  { 
    id: 'good', 
    score: 3, 
    labelEn: 'Good', 
    labelVi: 'Hài lòng', 
    emoji: '😚', 
    descEn: 'Good service',
    descVi: 'Dịch vụ tốt',
    activeClass: 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-emerald-500/10 ring-2 ring-emerald-500/20',
    iconColor: 'text-emerald-500'
  },
  { 
    id: 'very_good', 
    score: 4, 
    labelEn: 'Excellent', 
    labelVi: 'Rất tuyệt vời', 
    emoji: '😍', 
    descEn: 'Highly satisfied',
    descVi: 'Rất ấn tượng',
    activeClass: 'bg-pink-50 border-pink-500 text-pink-700 shadow-pink-500/10 ring-2 ring-pink-500/20',
    iconColor: 'text-pink-500'
  },
];

const DEFAULT_POOR_REASONS_EN = [
  'Not satisfied with the service result / style.',
  'Staff attitude or attentiveness needs care.',
  'Wait time was too long.',
  'Hygiene, salon ambiance, or equipment issue.',
  'Styling or skincare product used.'
];

const DEFAULT_POOR_REASONS_VI = [
  'Chưa ưng ý kiểu tóc / kết quả dịch vụ.',
  'Thái độ hoặc sự chu đáo của nhân viên.',
  'Thời gian chờ đợi quá lâu.',
  'Không gian, vệ sinh hoặc dụng cụ phục vụ.',
  'Sản phẩm tạo kiểu / chăm sóc sử dụng.'
];

const TIP_PRESETS = [
  { value: 20000, label: '20.000 đ' },
  { value: 50000, label: '50.000 đ' },
  { value: 100000, label: '100.000 đ' },
  { value: 200000, label: '200.000 đ' },
];

const MONTH_NAMES_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_NAMES_VI = [
  'Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6',
  'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'
];

export default function CustomerReview({ reviewId: reviewIdProp } = {}) {
  const params = useParams();
  const id = reviewIdProp || params?.id;

  // Language state
  const [lang, setLang] = useState('VIE'); // 'VIE' or 'ENG'
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Time state
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Main review flow step: 'info' | 'confirm_invoice' | 'rating' | 'tip' | 'success'
  const [step, setStep] = useState('info');
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [branchInfo, setBranchInfo] = useState({ name: 'GloPro Beauty & Salon', logo: '' });

  // Step 1: Customer info states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [dob, setDob] = useState('01/01/2000');
  const [dobModalOpen, setDobModalOpen] = useState(false);

  // Temp DOB picker wheel states
  const [tempDay, setTempDay] = useState(15);
  const [tempMonth, setTempMonth] = useState(10);
  const [tempYear, setTempYear] = useState(1998);

  // Step 3: Staff rating states
  const [staffList, setStaffList] = useState([]); // [{ id, name, services: [], avatar: '' }]
  const [staffRatings, setStaffRatings] = useState({}); // { [staffId]: 'poor'|'average'|'good'|'very_good' }
  const [selectedReasons, setSelectedReasons] = useState({}); // { [staffId]: ['reason1', 'reason2'] }
  const [customReasons, setCustomReasons] = useState({}); // { [staffId]: 'other text' }

  // Step 4: Tip states (per staff)
  const [staffTips, setStaffTips] = useState({}); // { [staffId]: number }
  const [customTipActive, setCustomTipActive] = useState({}); // { [staffId]: boolean }
  const [customTipInputs, setCustomTipInputs] = useState({}); // { [staffId]: string }

  // Step 5: Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live digital clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}:${secs}`);

      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      setCurrentDate(`${day}/${month}/${year}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Broadcast realtime status helper (both Supabase Channel & LocalStorage)
  const broadcastStatus = (statusPayload) => {
    try {
      const channel = supabase.channel(`glopro_review_${id}`);
      channel.send({
        type: 'broadcast',
        event: 'status_change',
        payload: statusPayload,
      }).catch(() => {});
    } catch (e) {}

    try {
      localStorage.setItem(`glopro_review_${id}`, JSON.stringify(statusPayload));
      window.dispatchEvent(new StorageEvent('storage', {
        key: `glopro_review_${id}`,
        newValue: JSON.stringify(statusPayload)
      }));
    } catch (e) {}
  };

  // Load invoice & branch info
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      base44.entities.Invoice?.get(id).catch(() => null),
      base44.entities.Branch?.list().catch(() => []),
      base44.entities.Staff?.list().catch(() => [])
    ]).then(([inv, branches, allStaff]) => {
      if (inv) {
        setInvoice(inv);
        if (inv.customer) {
          setCustomerName(inv.customer.name || '');
          setCustomerPhone(inv.customer.phone || '');
          setCustomerEmail(inv.customer.email || '');
          if (inv.customer.dob || inv.customer.birthday) {
            setDob(inv.customer.dob || inv.customer.birthday);
          }
        } else if (inv.customer_name) {
          setCustomerName(inv.customer_name);
          setCustomerPhone(inv.customer_phone || '');
        }

        // Parse staff members and the services they performed
        const staffMap = {};
        (inv.items || []).forEach(item => {
          const sId = item.staff_id || 'default_staff';
          const sName = item.staff_name || 'Kỹ thuật viên';
          const matchedStaff = (allStaff || []).find(st => st.id === sId);
          if (!staffMap[sId]) {
            staffMap[sId] = {
              id: sId,
              name: sName,
              avatar: matchedStaff?.avatar_url || '',
              role: matchedStaff?.role || 'Kỹ thuật viên',
              services: []
            };
          }
          staffMap[sId].services.push(item.name || item.service_name || 'Dịch vụ');
        });

        const list = Object.values(staffMap);
        setStaffList(list);

        // Pre-initialize tips
        const initialTips = {};
        list.forEach(s => {
          initialTips[s.id] = 0;
        });
        setStaffTips(initialTips);
      }

      // Branch name / salon branding
      if (branches && branches.length > 0) {
        const br = branches.find(b => b.id === inv?.branch_id) || branches[0];
        setBranchInfo({
          name: br.name || 'GloPro Salon & Spa',
          logo: br.logo_url || ''
        });
      }

      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  // Handle Wheel DOB Picker Confirm
  const handleConfirmDob = () => {
    const dStr = String(tempDay).padStart(2, '0');
    const mStr = String(tempMonth).padStart(2, '0');
    setDob(`${dStr}/${mStr}/${tempYear}`);
    setDobModalOpen(false);
  };

  // Step 1 -> Step 2
  const handleContinueFromInfo = () => {
    broadcastStatus({ status: 'reviewing', invoiceId: id });
    setStep('confirm_invoice');
  };

  // Step 2 -> Step 3
  const handleConfirmInvoice = () => {
    broadcastStatus({ status: 'reviewing', invoiceId: id });
    setStep('rating');
  };

  // Step 3 -> Step 4
  const handleContinueToTip = () => {
    const unrated = staffList.find(s => !staffRatings[s.id]);
    if (unrated) {
      alert(lang === 'ENG' 
        ? `Please select a rating for ${unrated.name}` 
        : `Vui lòng chọn mức đánh giá cho nhân viên ${unrated.name}`
      );
      return;
    }
    setStep('tip');
  };

  // Toggle Tip selection for a staff
  const handleSelectTipPreset = (staffId, val) => {
    setCustomTipActive(prev => ({ ...prev, [staffId]: false }));
    setStaffTips(prev => {
      const current = prev[staffId] || 0;
      return {
        ...prev,
        [staffId]: current === val ? 0 : val
      };
    });
  };

  // Custom Tip change
  const handleCustomTipChange = (staffId, strVal) => {
    setCustomTipInputs(prev => ({ ...prev, [staffId]: strVal }));
    const num = parseInt(strVal.replace(/\D/g, ''), 10) || 0;
    setStaffTips(prev => ({ ...prev, [staffId]: num }));
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const totalTip = Object.values(staffTips).reduce((a, b) => a + (Number(b) || 0), 0);
      const tipSplits = staffList.map(s => ({
        staff_id: s.id,
        staffId: s.id,
        amount: staffTips[s.id] || 0
      })).filter(x => x.amount > 0);

      // 1. Auto create / update customer in Customers database
      let savedCust = invoice?.customer || null;
      if (customerPhone || customerName) {
        try {
          const existingList = await base44.entities.Customer.list().catch(() => []);
          let found = existingList.find(c => c && (
            (customerPhone && c.phone && String(c.phone).trim() === String(customerPhone).trim()) ||
            (invoice.customer_id && String(c.id) === String(invoice.customer_id))
          ));
          if (!found && customerName) {
            found = await base44.entities.Customer.create({
              name: customerName,
              phone: customerPhone || '',
              email: customerEmail || '',
              birthday: dob || '',
              dob: dob || '',
              created_at: new Date().toISOString()
            }).catch(() => null);
          } else if (found) {
            await base44.entities.Customer.update(found.id, {
              name: customerName || found.name,
              email: customerEmail || found.email || '',
              birthday: dob || found.birthday || found.dob || '',
              dob: dob || found.dob || found.birthday || ''
            }).catch(() => null);
          }
          if (found) {
            savedCust = found;
          }
        } catch (err) {
          console.error('Auto register customer error:', err);
        }
      }

      const reviewPayload = {
        status: 'done',
        invoiceId: id,
        ratings: staffRatings,
        poorReasons: selectedReasons,
        customReason: Object.values(customReasons).filter(Boolean).join('; '),
        tip: totalTip,
        tipSplits: tipSplits,
        reviewedAt: new Date().toISOString(),
        customerInfo: {
          id: savedCust?.id || '',
          name: customerName || savedCust?.name || (lang === 'ENG' ? 'Walk-in Guest' : 'Khách vãng lai'),
          phone: customerPhone || savedCust?.phone || '',
          email: customerEmail || '',
          dob: dob
        }
      };

      // 2. Update invoice in database with tip and customer
      const netTotal = (invoice.subtotal || invoice.total || 0) - (invoice.discount || 0);
      await base44.entities.Invoice.update(invoice.id, {
        tip: totalTip,
        total: netTotal + totalTip,
        tip_splits: tipSplits,
        customer_id: savedCust?.id || invoice.customer_id || '',
        customer_name: customerName || savedCust?.name || invoice.customer_name || 'Khách vãng lai',
        customer_phone: customerPhone || savedCust?.phone || invoice.customer_phone || '',
        customer: savedCust || null,
        review_data: reviewPayload
      }).catch(e => console.warn('Could not update invoice in db:', e));

      // 3. Broadcast done state to POS
      broadcastStatus(reviewPayload);

      setIsSubmitting(false);
      setStep('success');
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
      setStep('success');
    }
  };

  // Calculations
  const grandTotal = useMemo(() => {
    if (!invoice) return 0;
    return invoice.total || (invoice.items || []).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || item.qty || 1)), 0);
  }, [invoice]);

  const subtotal = invoice?.subtotal || invoice?.items?.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0) || grandTotal;
  const promotion = invoice?.discount || 0;
  const vatTax = invoice?.tax || 0;

  // Stepper progress indicator helper
  const STEP_LIST = [
    { key: 'info', labelVi: 'Thông tin', labelEn: 'Profile', num: 1 },
    { key: 'confirm_invoice', labelVi: 'Hoá đơn', labelEn: 'Receipt', num: 2 },
    { key: 'rating', labelVi: 'Đánh giá', labelEn: 'Rating', num: 3 },
    { key: 'tip', labelVi: 'Thưởng tip', labelEn: 'Tip', num: 4 },
  ];

  const currentStepIndex = useMemo(() => {
    if (step === 'info') return 0;
    if (step === 'confirm_invoice') return 1;
    if (step === 'rating') return 2;
    if (step === 'tip') return 3;
    return 4;
  }, [step]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center shadow-lg shadow-pink-500/20 animate-pulse">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="w-8 h-8 border-2 border-white/20 border-t-pink-500 rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">
            {lang === 'ENG' ? 'Loading service evaluation...' : 'Đang kết nối quầy dịch vụ...'}
          </span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-white">
            {lang === 'ENG' ? 'Invoice Not Found' : 'Không tìm thấy hoá đơn'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {lang === 'ENG' 
              ? 'Please re-scan the QR code displayed at the checkout counter.' 
              : 'Vui lòng quét lại mã QR hiển thị tại quầy thu ngân của salon.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col font-sans antialiased text-slate-100 select-none relative overflow-x-hidden">
      
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 w-full bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-3 flex items-center justify-between shadow-lg">
        
        {/* Left: Clock & Date */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-pink-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs md:text-sm font-bold text-white tracking-wider font-mono">
              {currentTime || '12:00:00'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {currentDate || '21/08/2026'}
            </span>
          </div>
        </div>

        {/* Center: Brand Name & Verified Badge */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-sm md:text-base font-bold text-white tracking-tight">
              {branchInfo.name}
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline-block">
            {lang === 'ENG' ? 'Customer Feedback & Service Quality' : 'Khảo sát dịch vụ & Đánh giá'}
          </span>
        </div>

        {/* Right: Language Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-pink-400" />
              <span>{lang === 'ENG' ? 'EN' : 'VI'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-32 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 text-left backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => { setLang('VIE'); setLangMenuOpen(false); }}
                  className={`w-full px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-white/5 transition-colors ${lang === 'VIE' ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-slate-300'}`}
                >
                  <span>🇻🇳 Tiếng Việt</span>
                  {lang === 'VIE' && <Check className="w-3.5 h-3.5 text-pink-400" />}
                </button>
                <button
                  onClick={() => { setLang('ENG'); setLangMenuOpen(false); }}
                  className={`w-full px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-white/5 transition-colors ${lang === 'ENG' ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-slate-300'}`}
                >
                  <span>🇬🇧 English</span>
                  {lang === 'ENG' && <Check className="w-3.5 h-3.5 text-pink-400" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-3 md:p-6 w-full max-w-3xl mx-auto">
        
        {/* Stepper Progress Bar (Only during steps 1 to 4) */}
        {step !== 'success' && (
          <div className="w-full max-w-xl mb-4 px-2">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
              <div 
                className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-300 -z-0"
                style={{ width: `${(currentStepIndex / 3) * 90}%` }}
              />

              {STEP_LIST.map((s, idx) => {
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;

                return (
                  <div key={s.key} className="flex flex-col items-center gap-1 z-10">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30 ring-4 ring-pink-500/20 scale-110'
                          : isPassed
                            ? 'bg-pink-500 text-white'
                            : 'bg-slate-800 text-slate-400 border border-white/10'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                    </div>
                    <span className={`text-[10px] font-medium hidden sm:inline-block ${isActive ? 'text-pink-400 font-semibold' : 'text-slate-400'}`}>
                      {lang === 'ENG' ? s.labelEn : s.labelVi}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Card Frame with Luxury Glass & Modern Curves */}
        <div className="w-full bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden flex flex-col min-h-[520px]">

          {/* ========================================================
              STEP 1: CUSTOMER INFORMATION & MEMBER PERKS
             ======================================================== */}
          {step === 'info' && (
            <div className="p-5 md:p-8 flex flex-col justify-between flex-1 space-y-6 animate-in fade-in duration-200">
              
              <div className="space-y-6 text-center">
                
                {/* Hero Icon & Title */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
                    <Gift className="w-3.5 h-3.5" />
                    <span>{lang === 'ENG' ? 'Membership Privileges' : 'Đặc quyền thành viên thân thiết'}</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    {lang === 'ENG' ? 'Welcome to Our Salon' : 'Chào mừng quý khách đến trải nghiệm'}
                  </h1>
                  <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto">
                    {lang === 'ENG' 
                      ? 'Confirm your profile to accumulate loyalty points, receive birthday gifts and exclusive offers.' 
                      : 'Xác nhận thông tin để tự động tích điểm, nhận quà tặng sinh nhật và ưu đãi giảm giá.'}
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-3.5 max-w-md mx-auto pt-2 text-left">
                  
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-pink-400" />
                      <span>{lang === 'ENG' ? 'Full name' : 'Họ và tên của bạn'}</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={lang === 'ENG' ? 'e.g. John Doe' : 'Ví dụ: Nguyễn Văn A'}
                      className="w-full h-12 px-4 rounded-2xl bg-slate-800/80 border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-pink-400" />
                      <span>{lang === 'ENG' ? 'Phone number (Loyalty ID)' : 'Số điện thoại tích điểm'}</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0987 xxx xxx"
                      className="w-full h-12 px-4 rounded-2xl bg-slate-800/80 border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Date of Birth Picker Button */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-pink-400" />
                      <span>{lang === 'ENG' ? 'Date of birth (Birthday gift)' : 'Ngày sinh (Nhận quà sinh nhật)'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setDobModalOpen(true)}
                      className="w-full h-12 px-4 rounded-2xl bg-slate-800/80 border border-white/10 text-xs font-medium text-white flex items-center justify-between hover:border-white/20 focus:border-pink-500 transition-all text-left"
                    >
                      <span className="font-mono">{dob || '01/01/2000'}</span>
                      <CalendarIcon className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Optional Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lang === 'ENG' ? 'Email (Optional for e-invoice)' : 'Email nhận hoá đơn điện tử (Không bắt buộc)'}</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder={lang === 'ENG' ? 'customer@example.com' : 'email@gmail.com'}
                      className="w-full h-12 px-4 rounded-2xl bg-slate-800/80 border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                    />
                  </div>

                </div>

                {/* Membership Perks Mini Card */}
                <div className="max-w-md mx-auto p-3 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-pink-500/15 flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] text-slate-300 leading-snug">
                    <span className="font-bold text-white block">{lang === 'ENG' ? 'Instant points conversion' : 'Tích luỹ điểm tự động'}</span>
                    <span className="text-slate-400">{lang === 'ENG' ? 'Get 10% voucher on your birthday!' : 'Tặng voucher ưu đãi vào tuần lễ sinh nhật'}</span>
                  </div>
                </div>

              </div>

              {/* Bottom Action Button */}
              <div className="pt-4 max-w-md mx-auto w-full">
                <button
                  type="button"
                  onClick={handleContinueFromInfo}
                  className="w-full h-12 rounded-2xl bg-pink-500 hover:bg-pink-600 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{lang === 'ENG' ? 'CONTINUE' : 'TIẾP TỤC'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              STEP 2: CONFIRM DIGITAL INVOICE RECEIPT
             ======================================================== */}
          {step === 'confirm_invoice' && (
            <div className="p-5 md:p-8 flex flex-col justify-between flex-1 space-y-6 animate-in fade-in duration-200">
              
              <div className="space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <button
                    onClick={() => setStep('info')}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <h2 className="text-base font-bold text-white uppercase tracking-tight">
                      {lang === 'ENG' ? 'Service Receipt' : 'Phiếu Hoá Đơn Dịch Vụ'}
                    </h2>
                    <span className="text-[11px] text-slate-400 font-mono">
                      #{invoice?.invoice_code || (invoice?.id ? String(invoice.id).slice(-6) : 'HD')}
                    </span>
                  </div>
                  <div className="w-8" />
                </div>

                {/* Customer summary pill */}
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-pink-400" />
                    <div>
                      <span className="font-semibold text-white">{customerName || (lang === 'ENG' ? 'Walk-in Guest' : 'Khách vãng lai')}</span>
                      {customerPhone && <span className="text-slate-400 font-mono ml-2">({customerPhone})</span>}
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    {lang === 'ENG' ? 'Active' : 'Đang phục vụ'}
                  </span>
                </div>

                {/* Items List */}
                <div className="bg-slate-800/50 rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-3 bg-white/5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between border-b border-white/5">
                    <span>{lang === 'ENG' ? 'Service / Product' : 'Dịch vụ / Sản phẩm'}</span>
                    <span>{lang === 'ENG' ? 'Amount' : 'Thành tiền'}</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {(invoice.items || []).map((item, idx) => {
                      const itemQty = item.quantity || item.qty || 1;
                      const itemPrice = item.price || 0;
                      const itemTotal = item.total || (itemPrice * itemQty);
                      return (
                        <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-white/5 transition-colors text-xs">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-white">{item.name || item.service_name || 'Dịch vụ'}</div>
                            <div className="text-[11px] text-slate-400">
                              {itemQty} x {formatVND(itemPrice)}
                              {item.staff_name && <span className="text-pink-400 ml-1.5">• KTV: {item.staff_name}</span>}
                            </div>
                          </div>
                          <span className="font-bold text-white">{formatVND(itemTotal)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>{lang === 'ENG' ? 'Subtotal:' : 'Tiền dịch vụ:'}</span>
                    <span className="text-white font-medium">{formatVND(subtotal)}</span>
                  </div>
                  {promotion > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>{lang === 'ENG' ? 'Discount:' : 'Ưu đãi giảm giá:'}</span>
                      <span>-{formatVND(promotion)}</span>
                    </div>
                  )}
                  {vatTax > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>{lang === 'ENG' ? 'VAT Tax:' : 'Thuế VAT:'}</span>
                      <span className="text-white font-medium">{formatVND(vatTax)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                    <span className="font-bold text-white text-sm">{lang === 'ENG' ? 'Total to Pay:' : 'Tổng tiền thanh toán:'}</span>
                    <span className="font-bold text-pink-400 text-lg">{formatVND(grandTotal)}</span>
                  </div>
                </div>

              </div>

              {/* Bottom confirmation action */}
              <div className="pt-4 max-w-md mx-auto w-full space-y-2">
                <button
                  type="button"
                  onClick={handleConfirmInvoice}
                  className="w-full h-12 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{lang === 'ENG' ? 'CONFIRM & RATE SERVICE' : 'XÁC NHẬN & ĐÁNH GIÁ DỊCH VỤ'}</span>
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              STEP 3: RATE SERVICE QUALITY (SPECIALIST EVALUATION)
             ======================================================== */}
          {step === 'rating' && (
            <div className="p-5 md:p-8 flex flex-col justify-between flex-1 space-y-6 animate-in fade-in duration-200">
              
              <div className="space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <button
                    onClick={() => setStep('confirm_invoice')}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <h2 className="text-base font-bold text-white uppercase tracking-tight">
                      {lang === 'ENG' ? 'Staff Evaluation' : 'Đánh Giá Kỹ Thuật Viên'}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ENG' ? 'How was your service experience today?' : 'Bạn cảm thấy chất lượng phục vụ hôm nay thế nào?'}
                    </p>
                  </div>
                  <div className="w-8" />
                </div>

                {/* Staff List Review Cards */}
                <div className="space-y-5">
                  {staffList.map((st) => {
                    const currentRating = staffRatings[st.id] || null;
                    const isPoor = currentRating === 'poor';
                    const activeReasons = selectedReasons[st.id] || [];
                    const defaultReasons = lang === 'ENG' ? DEFAULT_POOR_REASONS_EN : DEFAULT_POOR_REASONS_VI;

                    return (
                      <div key={st.id} className="p-4 rounded-3xl bg-slate-800/80 border border-white/10 space-y-4 text-left">
                        
                        {/* Staff profile header */}
                        <div className="flex items-center gap-3">
                          <Avatar src={st.avatar} name={st.name} size={42} color="#EC4899" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white text-sm truncate">{st.name}</div>
                            <div className="text-[11px] text-pink-400 truncate">{st.services.join(', ')}</div>
                          </div>
                        </div>

                        {/* 4 Interactive Emotion Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {EMOJI_OPTIONS.map((opt) => {
                            const isSelected = currentRating === opt.id;

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setStaffRatings(prev => ({ ...prev, [st.id]: opt.id }));
                                }}
                                className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                                  isSelected
                                    ? 'bg-pink-500/20 border-pink-500 text-white shadow-lg shadow-pink-500/10 ring-2 ring-pink-500/30'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                                }`}
                              >
                                <span className="text-2xl mb-1">{opt.emoji}</span>
                                <span className="text-xs font-semibold text-white">
                                  {lang === 'ENG' ? opt.labelEn : opt.labelVi}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5">
                                  {lang === 'ENG' ? opt.descEn : opt.descVi}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Expandable Reasons for Poor rating */}
                        {isPoor && (
                          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2.5 animate-in fade-in duration-200">
                            <span className="text-xs font-semibold text-rose-300 block">
                              {lang === 'ENG' ? 'What went wrong? (Help us improve):' : 'Điều gì khiến bạn chưa hài lòng (để chúng tôi cải thiện):'}
                            </span>
                            <div className="space-y-1.5">
                              {defaultReasons.map((reasonText, rIdx) => {
                                const checked = activeReasons.includes(reasonText);
                                return (
                                  <label key={rIdx} className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const updated = e.target.checked
                                          ? [...activeReasons, reasonText]
                                          : activeReasons.filter(r => r !== reasonText);
                                        setSelectedReasons(prev => ({ ...prev, [st.id]: updated }));
                                      }}
                                      className="rounded text-pink-500 focus:ring-pink-500"
                                    />
                                    <span>{reasonText}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Custom Feedback Message */}
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={customReasons[st.id] || ''}
                            onChange={(e) => setCustomReasons(prev => ({ ...prev, [st.id]: e.target.value }))}
                            placeholder={lang === 'ENG' ? 'Add a note or compliment for staff...' : 'Góp ý hoặc lời khen gửi đến kỹ thuật viên...'}
                            className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-pink-500 outline-none"
                          />
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Bottom Continue button */}
              <div className="pt-4 max-w-md mx-auto w-full">
                <button
                  type="button"
                  onClick={handleContinueToTip}
                  className="w-full h-12 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{lang === 'ENG' ? 'CONTINUE TO TIP' : 'TIẾP TỤC THƯỞNG TIP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              STEP 4: MOTIVATIONAL TIPS FOR SPECIALISTS
             ======================================================== */}
          {step === 'tip' && (
            <div className="p-5 md:p-8 flex flex-col justify-between flex-1 space-y-6 animate-in fade-in duration-200">
              
              <div className="space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <button
                    onClick={() => setStep('rating')}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-pink-400">
                      <Heart className="w-4 h-4 fill-pink-500/20" />
                      <h2 className="text-base font-bold text-white uppercase tracking-tight">
                        {lang === 'ENG' ? 'Staff Appreciation Tip' : 'Thưởng Tip Động Viên'}
                      </h2>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ENG' ? '100% of tips are sent directly to your specialists.' : '100% tiền tip được gửi trực tiếp vào bảng lương của chuyên viên.'}
                    </p>
                  </div>
                  <div className="w-8" />
                </div>

                {/* Staff tip sections */}
                <div className="space-y-5">
                  {staffList.map((st) => {
                    const currentTip = staffTips[st.id] || 0;
                    const isCustom = customTipActive[st.id];

                    return (
                      <div key={st.id} className="p-4 rounded-3xl bg-slate-800/80 border border-white/10 space-y-3 text-left">
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={st.avatar} name={st.name} size={34} color="#EC4899" />
                            <div>
                              <div className="font-semibold text-white text-xs">{st.name}</div>
                              <div className="text-[10px] text-slate-400">{st.services.join(', ')}</div>
                            </div>
                          </div>
                          {currentTip > 0 && (
                            <span className="font-bold text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                              +{formatVND(currentTip)}
                            </span>
                          )}
                        </div>

                        {/* Preset Buttons */}
                        <div className="grid grid-cols-5 gap-1.5">
                          {TIP_PRESETS.map((preset) => {
                            const isSelected = currentTip === preset.value && !isCustom;
                            return (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => handleSelectTipPreset(st.id, preset.value)}
                                className={`py-2.5 px-1 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                              >
                                {preset.label.replace(' đ', '')}
                              </button>
                            );
                          })}

                          {/* Custom Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setCustomTipActive(prev => ({ ...prev, [st.id]: true }));
                              setStaffTips(prev => ({ ...prev, [st.id]: 0 }));
                            }}
                            className={`py-2.5 px-1 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                              isCustom
                                ? 'bg-amber-500 text-slate-950 shadow-md'
                                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            {lang === 'ENG' ? 'Other' : 'Khác'}
                          </button>
                        </div>

                        {/* Custom Input */}
                        {isCustom && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="number"
                              value={customTipInputs[st.id] || ''}
                              onChange={(e) => handleCustomTipChange(st.id, e.target.value)}
                              placeholder={lang === 'ENG' ? 'Enter tip amount...' : 'Nhập số tiền tip...'}
                              className="flex-1 h-10 px-3.5 rounded-xl bg-white/5 border border-amber-500/40 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <span className="text-xs font-bold text-amber-400 font-mono">VNĐ</span>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Bottom Complete Actions */}
              <div className="pt-4 max-w-md mx-auto w-full space-y-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="w-full h-12 rounded-2xl bg-pink-500 hover:bg-pink-600 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? (lang === 'ENG' ? 'Submitting...' : 'Đang gửi...') : (lang === 'ENG' ? 'COMPLETE & SUBMIT' : 'HOÀN TẤT ĐÁNH GIÁ')}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const zeros = {};
                    staffList.forEach(s => { zeros[s.id] = 0; });
                    setStaffTips(zeros);
                    handleFinalSubmit();
                  }}
                  className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {lang === 'ENG' ? 'No tip, complete evaluation' : 'Không thưởng tip, hoàn tất đánh giá'}
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              STEP 5: THANK YOU & VERIFIED SUMMARY SCREEN
             ======================================================== */}
          {step === 'success' && (
            <div className="p-6 md:p-10 flex flex-col items-center justify-center flex-1 text-center space-y-6 animate-in zoom-in-95 duration-200">
              
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
                <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {lang === 'ENG' ? 'Thank You Very Much!' : 'Cảm Ơn Quý Khách!'}
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'ENG'
                    ? 'Your feedback has been recorded in real-time. We look forward to serving you again!'
                    : 'Ý kiến đánh giá và tiền tip của bạn đã được cập nhật trực tiếp vào hoá đơn. Rất hân hạnh được phục vụ quý khách!'}
                </p>
              </div>

              {/* Receipt final summary */}
              <div className="w-full max-w-sm bg-slate-800/80 rounded-2xl p-4 border border-white/10 text-xs space-y-2 text-left">
                <div className="flex justify-between text-slate-400">
                  <span>{lang === 'ENG' ? 'Service total:' : 'Tiền dịch vụ:'}</span>
                  <span className="text-white font-medium">{formatVND(grandTotal)}</span>
                </div>
                {Object.values(staffTips).reduce((a, b) => a + (Number(b) || 0), 0) > 0 && (
                  <div className="flex justify-between text-amber-400 font-semibold">
                    <span>{lang === 'ENG' ? 'Staff tip bonus:' : 'Tiền tip thưởng KTV:'}</span>
                    <span>+{formatVND(Object.values(staffTips).reduce((a, b) => a + (Number(b) || 0), 0))}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10 flex justify-between items-baseline text-sm font-bold text-white">
                  <span>{lang === 'ENG' ? 'Final Payment:' : 'Tổng hoá đơn:'}</span>
                  <span className="text-pink-400">
                    {formatVND(grandTotal + Object.values(staffTips).reduce((a, b) => a + (Number(b) || 0), 0))}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'ENG' ? 'Verified by GloPro Salon Management System' : 'Được xác nhận bởi hệ thống quản lý GloPro'}</span>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* ========================================================
          DATE OF BIRTH WHEEL PICKER MODAL (Wheel Picker)
         ======================================================== */}
      {dobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center space-y-5 shadow-2xl border border-white/15">
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">
              {lang === 'ENG' ? 'Select Date of Birth' : 'Chọn Ngày Tháng Năm Sinh'}
            </h3>

            {/* 3 Wheel Columns: Day / Month / Year */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/10 text-xs">
              
              {/* Day Column */}
              <div className="h-44 overflow-y-auto space-y-2 py-16 scroll-smooth">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <div
                    key={d}
                    onClick={() => setTempDay(d)}
                    className={`py-1 cursor-pointer transition-all ${
                      tempDay === d 
                        ? 'text-pink-400 font-bold text-base scale-110' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Column */}
              <div className="h-44 overflow-y-auto space-y-2 py-16 scroll-smooth">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const mName = lang === 'ENG' ? MONTH_NAMES_EN[m - 1] : MONTH_NAMES_VI[m - 1];
                  return (
                    <div
                      key={m}
                      onClick={() => setTempMonth(m)}
                      className={`py-1 cursor-pointer transition-all ${
                        tempMonth === m 
                          ? 'text-pink-400 font-bold text-base scale-110' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {mName}
                    </div>
                  );
                })}
              </div>

              {/* Year Column */}
              <div className="h-44 overflow-y-auto space-y-2 py-16 scroll-smooth">
                {Array.from({ length: 70 }, (_, i) => 2026 - i).map((y) => (
                  <div
                    key={y}
                    onClick={() => setTempYear(y)}
                    className={`py-1 cursor-pointer transition-all ${
                      tempYear === y 
                        ? 'text-pink-400 font-bold text-base scale-110' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {y}
                  </div>
                ))}
              </div>

            </div>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={handleConfirmDob}
              className="w-full h-11 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-pink-500/20 transition-all cursor-pointer"
            >
              {lang === 'ENG' ? 'Confirm' : 'Xác nhận'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
