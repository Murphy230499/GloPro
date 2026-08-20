'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  AlertCircle 
} from 'lucide-react';

const EMOJI_OPTIONS = [
  { id: 'poor', score: 1, labelEn: 'Poor', labelVi: 'Quá tệ', emoji: '😫', color: '#EF4444' },
  { id: 'average', score: 2, labelEn: 'Average', labelVi: 'Bình thường', emoji: '😐', color: '#64748B' },
  { id: 'good', score: 3, labelEn: 'Good', labelVi: 'Good', labelViAlt: 'Tốt', emoji: '😚', color: '#64748B' },
  { id: 'very_good', score: 4, labelEn: 'Very good', labelVi: 'Rất tốt', emoji: '😍', color: '#2563EB' },
];

const DEFAULT_POOR_REASONS_EN = [
  'You are not satisfied with the hairstyle.',
  "You want to report the barber's attitude.",
  'You are not satisfied with the styling product.'
];

const DEFAULT_POOR_REASONS_VI = [
  'Bạn chưa hài lòng về kiểu tóc / kết quả dịch vụ.',
  'Góp ý về thái độ hoặc sự chu đáo của nhân viên.',
  'Chưa hài lòng về sản phẩm hoặc mùi hương sử dụng.'
];

const TIP_PRESETS = [
  { value: 20000, label: '20.000 đ' },
  { value: 50000, label: '50.000 đ' },
  { value: 100000, label: '100.000 đ' },
  { value: 200000, label: '200.000 đ' },
];

export default function CustomerReview({ reviewId: reviewIdProp } = {}) {
  const params = useParams();
  const id = reviewIdProp || params?.id;

  // Language state
  const [lang, setLang] = useState('ENG'); // 'ENG' or 'VIE'
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Time state
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Main review flow step: 'info' | 'confirm_invoice' | 'rating' | 'tip' | 'success'
  const [step, setStep] = useState('info');
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [branchInfo, setBranchInfo] = useState({ name: '4RAU Barbershop', logo: '' });

  // Step 1: Customer info states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [dob, setDob] = useState('01/01/2000');
  const [dobModalOpen, setDobModalOpen] = useState(false);

  // Temp DOB picker wheel states
  const [tempDay, setTempDay] = useState(15);
  const [tempMonth, setTempMonth] = useState(10);
  const [tempYear, setTempYear] = useState(1997);

  // Step 3: Staff rating states
  const [staffList, setStaffList] = useState([]); // [{ id, name, services: [] }]
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
      // Dispatch custom storage event for same-window listeners
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
      base44.entities.Branch?.list().catch(() => [])
    ]).then(([inv, branches]) => {
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
          if (!staffMap[sId]) {
            staffMap[sId] = {
              id: sId,
              name: sName,
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
        const br = branches[0];
        setBranchInfo({
          name: br.name || '4RAU Barbershop',
          logo: br.logo_url || ''
        });
      }

      setLoading(false);
    }).catch(err => {
      console.error(err);
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
    // Ensure all staff have a rating
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
      let savedCust = invoice.customer || null;
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
        reasons: selectedReasons,
        customReasons: customReasons,
        tip: totalTip,
        tipSplits: tipSplits,
        customerInfo: {
          id: savedCust?.id || '',
          name: customerName || savedCust?.name || 'Khách vãng lai',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">
            {lang === 'ENG' ? 'Loading review...' : 'Đang tải thông tin...'}
          </span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-xl border border-slate-150">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            {lang === 'ENG' ? 'Invoice Not Found' : 'Không tìm thấy hoá đơn'}
          </h2>
          <p className="text-xs text-slate-400">
            {lang === 'ENG' 
              ? 'Please re-scan the QR code provided by the cashier.' 
              : 'Vui lòng quét lại mã QR được cung cấp tại quầy thu ngân.'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate invoice numbers for Step 2
  const subtotal = invoice.subtotal || (invoice.items || []).reduce((sum, it) => sum + (it.price * (it.quantity || it.qty || 1)), 0);
  const promotion = invoice.discount || invoice.discount_amount || 0;
  const vatTax = invoice.tax || invoice.vat || 0;
  const grandTotal = subtotal - promotion + vatTax;

  const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTH_NAMES_VI = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased select-none text-slate-800">
      {/* Top Header Bar */}
      <header className="w-full bg-white border-b border-slate-100 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-30">
        {/* Left: Clock */}
        <div className="flex flex-col text-left">
          <span className="text-base md:text-lg font-extrabold text-slate-800 tracking-tight font-mono">
            {currentTime || '15:03:45'}
          </span>
          <span className="text-[11px] text-slate-400 font-medium font-mono">
            {currentDate || '15/10/2022'}
          </span>
        </div>

        {/* Center: Salon Name */}
        <div className="flex items-center gap-2">
          <span className="text-base md:text-xl font-black text-slate-800 tracking-tight">
            {branchInfo.name}
          </span>
        </div>

        {/* Right: Language Dropdown & Logo */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800 transition-colors"
            >
              <span>{lang === 'ENG' ? '🇬🇧 ENG' : '🇻🇳 VIE'}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-150 rounded-xl shadow-lg py-1 z-50 text-left">
                <button
                  onClick={() => { setLang('ENG'); setLangMenuOpen(false); }}
                  className={`w-full px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 ${lang === 'ENG' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}`}
                >
                  <span>🇬🇧 English</span>
                  {lang === 'ENG' && <Check className="w-3 h-3 text-blue-600" />}
                </button>
                <button
                  onClick={() => { setLang('VIE'); setLangMenuOpen(false); }}
                  className={`w-full px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 ${lang === 'VIE' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}`}
                >
                  <span>🇻🇳 Tiếng Việt</span>
                  {lang === 'VIE' && <Check className="w-3 h-3 text-blue-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Salon Logo */}
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white overflow-hidden shadow-xs shrink-0">
            {branchInfo.logo ? (
              <img src={branchInfo.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="font-black text-xs tracking-wider">4RAU</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100/80 overflow-hidden flex flex-col min-h-[580px]">

          {/* ========================================================
              STEP 1: CUSTOMER INFORMATION FORM (Screen 1 & 2)
             ======================================================== */}
          {step === 'info' && (
            <div className="p-6 md:p-10 flex flex-col justify-between flex-1 space-y-8">
              <div className="space-y-6 text-center">
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
                    {lang === 'ENG' ? 'Please enter your information' : 'Vui lòng nhập thông tin của bạn'}
                  </h1>
                  <p className="text-sm md:text-base font-semibold text-slate-500">
                    {lang === 'ENG' ? 'Sign up for membership to enjoy exclusive hot deals!' : 'Đăng ký thành viên để nhận ngay nhiều ưu đãi hấp dẫn!'}
                  </p>
                </div>

                <div className="space-y-4 max-w-md mx-auto pt-4 text-left">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">
                      {lang === 'ENG' ? 'Full name' : 'Họ và tên'}
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={lang === 'ENG' ? 'Please enter' : 'Vui lòng nhập họ tên'}
                      className="w-full h-14 px-4 rounded-2xl border border-slate-200 text-sm font-semibold placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    />
                  </div>

                  {/* Phone number (if walk-in) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">
                      {lang === 'ENG' ? 'Phone number' : 'Số điện thoại'}
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={lang === 'ENG' ? '0868xxxxxx' : '0868xxxxxx'}
                      className="w-full h-14 px-4 rounded-2xl border border-slate-200 text-sm font-semibold placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    />
                  </div>

                  {/* Date of Birth Picker Button */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">
                      {lang === 'ENG' ? 'Date of birth' : 'Ngày tháng năm sinh'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setDobModalOpen(true)}
                      className="w-full h-14 px-4 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 bg-white flex items-center justify-between hover:border-slate-300 focus:border-blue-500 transition-all text-left"
                    >
                      <span>{dob || '01/01/2000'}</span>
                      <CalendarIcon className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="pt-6 max-w-md mx-auto w-full">
                <button
                  type="button"
                  onClick={handleContinueFromInfo}
                  className="w-full h-14 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.99] text-white font-extrabold text-base uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center"
                >
                  {lang === 'ENG' ? 'CONTINUE' : 'TIẾP TỤC'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 2: CONFIRM INVOICE INFORMATION (Screen 3)
             ======================================================== */}
          {step === 'confirm_invoice' && (
            <div className="p-6 md:p-10 flex flex-col justify-between flex-1 space-y-6">
              <div className="space-y-6">
                {/* Title */}
                <div className="text-center space-y-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
                    {lang === 'ENG' ? 'CONFIRM INVOICE INFORMATION' : 'XÁC NHẬN THÔNG TIN HOÁ ĐƠN'}
                  </h1>
                  <p className="text-sm md:text-base font-bold text-slate-700">
                    {lang === 'ENG' ? 'Customer: ' : 'Khách hàng: '}
                    <span className="text-blue-600">{customerName || 'Khách vãng lai'}</span>
                    {customerPhone && <span> - {customerPhone}</span>}
                  </p>
                  <div className="text-lg md:text-xl font-black text-slate-800 pt-1">
                    {lang === 'ENG' ? 'Subtotal: ' : 'Tổng cộng: '}
                    <span className="text-red-500">{formatVND(grandTotal)}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-150 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">{lang === 'ENG' ? 'Services used' : 'Dịch vụ đã dùng'}</th>
                        <th className="py-3.5 px-3 text-center">{lang === 'ENG' ? 'Quantity' : 'SL'}</th>
                        <th className="py-3.5 px-3 text-right">{lang === 'ENG' ? 'Unit price' : 'Đơn giá'}</th>
                        <th className="py-3.5 px-4 text-right">{lang === 'ENG' ? 'Total amount' : 'Thành tiền'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {(invoice.items || []).map((item, idx) => {
                        const itemQty = item.quantity || item.qty || 1;
                        const itemPrice = item.price || 0;
                        const itemTotal = item.total || (itemPrice * itemQty);
                        const itemDiscount = item.discount || 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              {idx + 1}. {item.name || item.service_name || 'Dịch vụ'}
                            </td>
                            <td className="py-3.5 px-3 text-center text-slate-600">{itemQty}</td>
                            <td className="py-3.5 px-3 text-right text-slate-600">{formatVND(itemPrice)}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                              <div>{formatVND(itemTotal)}</div>
                              {itemDiscount > 0 && (
                                <div className="text-[10px] text-slate-400 font-normal">
                                  Discount: {formatVND(itemDiscount)}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Sub-summary block */}
                <div className="flex flex-col items-end space-y-1.5 text-xs md:text-sm font-semibold text-slate-600 pr-2">
                  <div className="flex justify-between w-64">
                    <span>{lang === 'ENG' ? 'Total amount:' : 'Tiền dịch vụ:'}</span>
                    <span className="font-bold text-slate-800">{formatVND(subtotal)}</span>
                  </div>
                  {promotion > 0 && (
                    <div className="flex justify-between w-64 text-emerald-600 font-bold">
                      <span>{lang === 'ENG' ? 'Promotion:' : 'Khuyến mãi:'}</span>
                      <span>-{formatVND(promotion)}</span>
                    </div>
                  )}
                  {vatTax > 0 && (
                    <div className="flex justify-between w-64">
                      <span>{lang === 'ENG' ? 'VAT Tax:' : 'Thuế VAT:'}</span>
                      <span className="font-bold text-slate-800">{formatVND(vatTax)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom notice & button */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-slate-500 font-medium text-center md:text-left max-w-xs">
                    {lang === 'ENG'
                      ? 'Please inform the receptionist for adjustments if you notice any issues with the invoice.'
                      : 'Vui lòng báo cho thu ngân nếu quý khách thấy thông tin trên hoá đơn chưa chính xác.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleConfirmInvoice}
                    className="w-full md:w-auto px-8 h-14 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-extrabold text-sm md:text-base uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all shrink-0"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>{lang === 'ENG' ? 'CONFIRM AS CORRECT' : 'XÁC NHẬN ĐÚNG'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 3: RATE SERVICE QUALITY (Screen 4)
             ======================================================== */}
          {step === 'rating' && (
            <div className="p-6 md:p-10 flex flex-col justify-between flex-1 space-y-6">
              <div className="space-y-6">
                {/* Header with Back Arrow */}
                <div className="relative flex items-center justify-center pb-2 border-b border-slate-100">
                  <button
                    onClick={() => setStep('confirm_invoice')}
                    className="absolute left-0 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight uppercase">
                    {lang === 'ENG' ? 'RATE SERVICE QUALITY' : 'ĐÁNH GIÁ CHẤT LƯỢNG DỊCH VỤ'}
                  </h1>
                </div>

                {/* Staff Group list */}
                <div className="space-y-6 divide-y divide-slate-100">
                  {staffList.map((st) => {
                    const currentRating = staffRatings[st.id] || null;
                    const isPoor = currentRating === 'poor';
                    const activeReasons = selectedReasons[st.id] || [];

                    const defaultReasons = lang === 'ENG' ? DEFAULT_POOR_REASONS_EN : DEFAULT_POOR_REASONS_VI;

                    return (
                      <div key={st.id} className="pt-5 first:pt-0 space-y-4 text-left">
                        {/* Staff Name & services */}
                        <div className="space-y-1">
                          <h2 className="font-extrabold text-sm md:text-base text-blue-600">
                            {st.name}
                          </h2>
                          <div className="space-y-0.5 text-xs font-semibold text-slate-600">
                            {st.services.map((svc, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-1.5">
                                <span className="text-slate-400">-</span>
                                <span>{svc}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Emoji Grid (4 options: Poor, Average, Good, Very good) */}
                        <div className="grid grid-cols-4 gap-2.5 max-w-lg">
                          {EMOJI_OPTIONS.map((opt) => {
                            const isSelected = currentRating === opt.id;
                            
                            // Specific styling matching mockup:
                            // If selected and poor -> solid red
                            // If selected and very_good -> solid blue
                            // If selected and average/good -> solid slate/blue
                            let btnStyle = 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300';
                            if (isSelected) {
                              if (opt.id === 'poor') {
                                btnStyle = 'bg-[#EF4444] border-[#EF4444] text-white shadow-md shadow-red-500/20';
                              } else if (opt.id === 'very_good') {
                                btnStyle = 'bg-[#0066FF] border-[#0066FF] text-white shadow-md shadow-blue-500/20';
                              } else {
                                btnStyle = 'bg-slate-800 border-slate-800 text-white';
                              }
                            }

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setStaffRatings(prev => ({ ...prev, [st.id]: opt.id }));
                                }}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${btnStyle}`}
                              >
                                <span className="text-3xl mb-1">{opt.emoji}</span>
                                <span className="text-xs font-bold tracking-tight">
                                  {lang === 'ENG' ? opt.labelEn : opt.labelVi}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Expandable Feedback section for 'poor' rating */}
                        {isPoor && (
                          <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100 space-y-3 animate-in fade-in duration-200">
                            <div className="text-xs font-bold text-slate-700">
                              {lang === 'ENG' ? 'Feedback section' : 'Ý kiến đóng góp'}
                            </div>

                            {/* Checkbox Options */}
                            <div className="space-y-2">
                              {defaultReasons.map((reasonText, rIdx) => {
                                const checked = activeReasons.includes(reasonText);
                                return (
                                  <label key={rIdx} className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const updated = e.target.checked
                                          ? [...activeReasons, reasonText]
                                          : activeReasons.filter(r => r !== reasonText);
                                        setSelectedReasons(prev => ({ ...prev, [st.id]: updated }));
                                      }}
                                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                    />
                                    <span className="text-xs font-medium text-slate-700">
                                      {reasonText}
                                    </span>
                                  </label>
                                );
                              })}

                              {/* Other text input option */}
                              <div className="space-y-1.5 pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(customReasons[st.id])}
                                    onChange={(e) => {
                                      if (!e.target.checked) {
                                        setCustomReasons(prev => ({ ...prev, [st.id]: '' }));
                                      }
                                    }}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                  />
                                  <span className="text-xs font-medium text-slate-700">
                                    {lang === 'ENG' ? 'Other: Please enter your reason here...' : 'Khác: Vui lòng nhập lý do tại đây...'}
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  value={customReasons[st.id] || ''}
                                  onChange={(e) => setCustomReasons(prev => ({ ...prev, [st.id]: e.target.value }))}
                                  placeholder={lang === 'ENG' ? 'Enter detailed reason...' : 'Nhập chi tiết ý kiến của bạn...'}
                                  className="w-full h-10 px-3 rounded-xl border border-red-200 bg-white text-xs font-medium focus:border-red-400 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Continue button */}
              <div className="pt-6 max-w-md mx-auto w-full">
                <button
                  type="button"
                  onClick={handleContinueToTip}
                  className="w-full h-14 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-extrabold text-base uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>{lang === 'ENG' ? 'CONTINUE' : 'TIẾP TỤC'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 4: MOTIVATIONAL TIPS FOR EMPLOYEES (Screen 5)
             ======================================================== */}
          {step === 'tip' && (
            <div className="p-6 md:p-10 flex flex-col justify-between flex-1 space-y-6">
              <div className="space-y-6">
                {/* Header with Back Arrow */}
                <div className="relative flex items-center justify-center pb-2 border-b border-slate-100">
                  <button
                    onClick={() => setStep('rating')}
                    className="absolute left-0 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight uppercase">
                    {lang === 'ENG' ? 'MOTIVATIONAL TIPS FOR EMPLOYEES' : 'THƯỞNG TIP ĐỘNG VIÊN NHÂN VIÊN'}
                  </h1>
                </div>

                {/* Staff tip sections */}
                <div className="space-y-6 divide-y divide-slate-100">
                  {staffList.map((st) => {
                    const currentTip = staffTips[st.id] || 0;
                    const ratingKey = staffRatings[st.id] || 'very_good';
                    const ratingObj = EMOJI_OPTIONS.find(e => e.id === ratingKey) || EMOJI_OPTIONS[3];
                    const isCustom = customTipActive[st.id];

                    return (
                      <div key={st.id} className="pt-5 first:pt-0 space-y-3.5 text-left">
                        {/* Top: Staff Name + Reviewed badge */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="font-extrabold text-sm md:text-base text-blue-600">
                              {st.name}
                            </h2>
                            <div className="space-y-0.5 text-xs font-semibold text-slate-500">
                              {st.services.map((svc, sIdx) => (
                                <div key={sIdx}>- {svc}</div>
                              ))}
                            </div>
                          </div>

                          {/* Reviewed badge */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400">
                              {lang === 'ENG' ? 'Reviewed:' : 'Đã đánh giá:'}
                            </span>
                            <div className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 text-white ${ratingObj.id === 'poor' ? 'bg-red-500' : 'bg-blue-600'}`}>
                              <span>{ratingObj.emoji}</span>
                              <span>{lang === 'ENG' ? ratingObj.labelEn : ratingObj.labelVi}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Tip Presets */}
                        <div className="grid grid-cols-5 gap-2">
                          {TIP_PRESETS.map((preset) => {
                            const isSelected = currentTip === preset.value && !isCustom;
                            return (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => handleSelectTipPreset(st.id, preset.value)}
                                className={`relative py-3.5 px-2 rounded-2xl font-black text-xs md:text-sm transition-all text-center flex flex-col items-center justify-center ${
                                  isSelected
                                    ? 'bg-[#EBF5FF] text-[#0066FF] ring-2 ring-[#0066FF] shadow-xs'
                                    : 'bg-[#F1F5F9] text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {isSelected && (
                                  <span className="absolute -top-2 right-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                                    {lang === 'ENG' ? 'Deselect' : 'Bỏ chọn'}
                                  </span>
                                )}
                                <span>{preset.label}</span>
                              </button>
                            );
                          })}

                          {/* Other / Custom Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setCustomTipActive(prev => ({ ...prev, [st.id]: true }));
                              setStaffTips(prev => ({ ...prev, [st.id]: 0 }));
                            }}
                            className={`py-3.5 px-2 rounded-2xl font-black text-xs md:text-sm transition-all text-center flex items-center justify-center ${
                              isCustom
                                ? 'bg-[#EBF5FF] text-[#0066FF] ring-2 ring-[#0066FF]'
                                : 'bg-[#F1F5F9] text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {lang === 'ENG' ? 'Other' : 'Khác'}
                          </button>
                        </div>

                        {/* Custom Tip Input if active */}
                        {isCustom && (
                          <div className="pt-1 flex items-center gap-2">
                            <input
                              type="number"
                              value={customTipInputs[st.id] || ''}
                              onChange={(e) => handleCustomTipChange(st.id, e.target.value)}
                              placeholder={lang === 'ENG' ? 'Enter tip amount (VND)...' : 'Nhập số tiền tip (VNĐ)...'}
                              className="flex-1 h-12 px-4 rounded-xl border border-blue-300 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <span className="text-xs font-bold text-slate-400">VNĐ</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Proceed to Payment */}
              <div className="pt-6 max-w-md mx-auto w-full space-y-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="w-full h-14 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.99] text-white font-extrabold text-base uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <span>{lang === 'ENG' ? 'PROCEED TO PAYMENT' : 'TIẾP TỤC THANH TOÁN'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const zeros = {};
                    staffList.forEach(s => { zeros[s.id] = 0; });
                    setStaffTips(zeros);
                    handleFinalSubmit();
                  }}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {lang === 'ENG' ? 'Skip tip & proceed' : 'Bỏ qua tiền tip & tiếp tục'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 5: SUMMARY & THANK YOU SCREEN
             ======================================================== */}
          {step === 'success' && (
            <div className="p-8 md:p-12 flex flex-col items-center justify-center flex-1 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center animate-bounce shadow-xs">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>

              <div className="space-y-2 max-w-md">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
                  {lang === 'ENG' ? 'THANK YOU FOR YOUR FEEDBACK!' : 'CẢM ƠN QUÝ KHÁCH ĐÃ ĐÁNH GIÁ!'}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                  {lang === 'ENG'
                    ? 'Your feedback and tip details have been sent to the receptionist desk. We hope to see you again soon!'
                    : 'Ý kiến đóng góp và thông tin tip đã được chuyển đến quầy thu ngân. Rất hân hạnh được phục vụ quý khách lần tới!'}
                </p>
              </div>

              {/* Summary of final payment */}
              <div className="w-full max-w-sm bg-slate-50 rounded-2xl p-5 border border-slate-150 text-xs space-y-2 text-left">
                <div className="flex justify-between text-slate-600 font-semibold">
                  <span>{lang === 'ENG' ? 'Invoice total:' : 'Tiền dịch vụ:'}</span>
                  <span className="font-bold text-slate-800">{formatVND(grandTotal)}</span>
                </div>
                {Object.values(staffTips).reduce((a, b) => a + (Number(b) || 0), 0) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>{lang === 'ENG' ? 'Total tip:' : 'Tổng tiền tip:'}</span>
                    <span>+{formatVND(Object.values(staffTips).reduce((a, b) => a + (Number(b) || 0), 0))}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-800">
                  <span>{lang === 'ENG' ? 'Grand total:' : 'Tổng thanh toán:'}</span>
                  <span className="text-blue-600">
                    {formatVND(grandTotal + Object.values(staffTips).reduce((a, b) => a + (Number(b) || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ========================================================
          DATE OF BIRTH WHEEL PICKER MODAL (Screen 2)
         ======================================================== */}
      {dobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-6 shadow-2xl border border-slate-100">
            <h2 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight">
              {lang === 'ENG' ? 'PLEASE SELECT YOUR DATE OF BIRTH' : 'VUI LÒNG CHỌN NGÀY SINH'}
            </h2>

            {/* 3 Wheel Columns: Day / Month / Year */}
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-100 font-bold">
              {/* Day column */}
              <div className="h-44 overflow-y-auto space-y-2 no-scrollbar py-16 scroll-smooth">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <div
                    key={d}
                    onClick={() => setTempDay(d)}
                    className={`py-1.5 cursor-pointer text-sm md:text-base transition-all ${
                      tempDay === d 
                        ? 'text-blue-600 font-black text-lg scale-110' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Month column */}
              <div className="h-44 overflow-y-auto space-y-2 no-scrollbar py-16 scroll-smooth">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const mName = lang === 'ENG' ? MONTH_NAMES_EN[m - 1] : MONTH_NAMES_VI[m - 1];
                  return (
                    <div
                      key={m}
                      onClick={() => setTempMonth(m)}
                      className={`py-1.5 cursor-pointer text-sm md:text-base transition-all ${
                        tempMonth === m 
                          ? 'text-blue-600 font-black text-lg scale-110' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {mName}
                    </div>
                  );
                })}
              </div>

              {/* Year column */}
              <div className="h-44 overflow-y-auto space-y-2 no-scrollbar py-16 scroll-smooth">
                {Array.from({ length: 70 }, (_, i) => 2026 - i).map((y) => (
                  <div
                    key={y}
                    onClick={() => setTempYear(y)}
                    className={`py-1.5 cursor-pointer text-sm md:text-base transition-all ${
                      tempYear === y 
                        ? 'text-blue-600 font-black text-lg scale-110' 
                        : 'text-slate-400 hover:text-slate-600'
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
              className="w-full h-12 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-extrabold text-sm uppercase tracking-wider shadow-md shadow-blue-500/25 transition-all"
            >
              {lang === 'ENG' ? 'Confirm' : 'Xác nhận'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
