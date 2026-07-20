'use client';
import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Trash2, AlertCircle, AlertTriangle, CheckCircle, QrCode, Printer, ShieldCheck } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import StaffAssignPicker from '@/components/StaffAssignPicker';

const METHODS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'card', label: 'Thẻ tín dụng' },
  { value: 'transfer', label: 'Chuyển khoản' },
  { value: 'ewallet', label: 'Ví điện tử' },
];

export default function CheckoutModal({ open, onClose, session, staff, onConfirm, paying }) {
  const [step, setStep] = useState('payment'); // 'payment', 'confirm', 'processing', 'receipt'
  const [printBill, setPrintBill] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  const [payments, setPayments] = useState([{ method: 'cash', amount: 0 }]);
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [tipUnit, setTipUnit] = useState('vnd'); // 'vnd' or 'percent'
  const [selectedPercentage, setSelectedPercentage] = useState(0); // 0, 5, 10, 15, 20, or null
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState('vnd');
  
  // Tip split states
  const [isEditingTip, setIsEditingTip] = useState(false);
  const [tipSplits, setTipSplits] = useState([]); // Array of { staffId, amount }
  const [tempSplits, setTempSplits] = useState([]); // Transient state during editing

  const cart = session?.cart || [];
  const subtotal = cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
  const discount = discountType === 'percent' ? Math.round(subtotal * (discountValue / 100)) : discountValue;
  const netTotal = Math.max(0, subtotal - discount);
  const total = netTotal + tip;
  const paidSum = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remaining = total - paidSum;

  // Track previous paying value to detect error recovery
  const prevPayingRef = React.useRef(paying);
  useEffect(() => {
    const wasPaying = prevPayingRef.current;
    prevPayingRef.current = paying;
    // If paying went from true -> false while we were in 'processing', it means an error occurred
    // Reset back to 'payment' step so user can close or retry
    if (wasPaying && !paying && step === 'processing') {
      setStep('payment');
      setProgress(0);
    }
  }, [paying]);

  useEffect(() => {
    if (open && session) {
      setDiscountValue(session.discountValue || 0);
      setDiscountType(session.discountType || 'vnd');
      
      const initialNetTotal = Math.max(0, subtotal - (session.discountType === 'percent' ? Math.round(subtotal * ((session.discountValue || 0) / 100)) : (session.discountValue || 0)));
      const initialTip = session.tip || 0;
      setTip(initialTip);
      setTipSplits(session.tipSplits || []);
      setCustomTip(initialTip > 0 ? String(initialTip) : '');
      setTipUnit('vnd');
      setSelectedPercentage(initialTip === 0 ? 0 : null);
      
      // Default first payment input to full amount
      setPayments([{ method: 'cash', amount: initialNetTotal + initialTip }]);
      setIsEditingTip(false);
      setStep('payment');
      setProgress(0);
      
      // Set receipt formatted time
      const now = new Date();
      const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      setCurrentTime(now.toLocaleDateString('vi-VN', options));
    }
  }, [open, session]);

  // Handle processing progress animation
  useEffect(() => {
    if (step === 'processing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 80);

      return () => clearInterval(interval);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'processing' && progress === 100) {
      if (printBill) {
        setStep('receipt');
      } else {
        onConfirm({ 
          tip, 
          discount, 
          payments: payments.filter((p) => p.amount > 0),
          tipSplits: tipSplits.filter(s => s.staffId && s.amount > 0),
          sessionCustomer: session?.customer
        });
      }
    }
  }, [progress, step, printBill]);

  if (!open || !session) return null;

  // Handle Tip Percentage Click
  const handlePercentageClick = (percent) => {
    setSelectedPercentage(percent);
    setCustomTip('');
    const computed = Math.round(netTotal * (percent / 100));
    setTip(computed);
    
    // Distribute tip splits equally if splits exist
    if (tipSplits.length > 0) {
      const splitAmt = Math.round(computed / tipSplits.length);
      setTipSplits(tipSplits.map(s => ({ ...s, amount: splitAmt })));
    } else {
      setTipSplits([]);
    }
  };

  // Handle Custom Tip Input Change
  const handleCustomTipChange = (value) => {
    setCustomTip(value);
    setSelectedPercentage(null);
    const num = Number(value) || 0;
    const computed = tipUnit === 'percent' ? Math.round(netTotal * (num / 100)) : num;
    setTip(computed);

    if (tipSplits.length > 0) {
      const splitAmt = Math.round(computed / tipSplits.length);
      setTipSplits(tipSplits.map(s => ({ ...s, amount: splitAmt })));
    }
  };

  // Toggle Tip Unit
  const handleTipUnitChange = (unit) => {
    setTipUnit(unit);
    const num = Number(customTip) || 0;
    const computed = unit === 'percent' ? Math.round(netTotal * (num / 100)) : num;
    setTip(computed);
  };

  // Add Remaining Left to be Paid to Cash payment
  const handleAddRemainingToCash = () => {
    if (remaining <= 0) return;
    
    // Find cash payment method or append new
    const cashIndex = payments.findIndex(p => p.method === 'cash');
    if (cashIndex !== -1) {
      setPayments(payments.map((p, i) => i === cashIndex ? { ...p, amount: p.amount + remaining } : p));
    } else {
      setPayments([...payments, { method: 'cash', amount: remaining }]);
    }
  };

  // Add Overpaid Change to Tip
  const handleAddChangeToTip = () => {
    if (remaining >= 0) return;
    const change = -remaining;
    const newTip = tip + change;
    setTip(newTip);
    setCustomTip(String(newTip));
    setSelectedPercentage(null);
    setTipUnit('vnd');

    // Split change equally
    if (tipSplits.length > 0) {
      const splitAmt = Math.round(newTip / tipSplits.length);
      setTipSplits(tipSplits.map(s => ({ ...s, amount: splitAmt })));
    }
    
    // Adjust payments
    setPayments(payments.map((p, i) => i === 0 ? { ...p, amount: p.amount } : p));
  };

  // Open Edit Tip Split Sub-screen
  const handleOpenEditTip = () => {
    let initialTemp = [];
    if (tipSplits.length > 0) {
      initialTemp = [...tipSplits];
    } else {
      // Get unique staff assigned in the bill
      const billStaff = [];
      cart.forEach(item => {
        if (item.staff_id && !billStaff.some(s => s.staffId === item.staff_id)) {
          billStaff.push({ staffId: item.staff_id, amount: 0 });
        }
      });

      if (billStaff.length > 0) {
        // Distribute tip equally
        const equalShare = Math.round(tip / billStaff.length);
        initialTemp = billStaff.map(s => ({ ...s, amount: equalShare }));
      } else if (tip > 0) {
        initialTemp = [{ staffId: '', amount: tip }];
      } else {
        initialTemp = [{ staffId: '', amount: 0 }];
      }
    }
    setTempSplits(initialTemp);
    setIsEditingTip(true);
  };

  // Apply Tip Splits
  const handleApplyTipSplits = () => {
    const validSplits = tempSplits.filter(s => s.staffId && s.amount > 0);
    setTipSplits(validSplits);
    const sum = validSplits.reduce((s, x) => s + x.amount, 0);
    setTip(sum);
    setCustomTip(String(sum));
    setSelectedPercentage(null);
    setTipUnit('vnd');
    setIsEditingTip(false);
  };

  const getSelectableStaff = () => {
    const list = [...(staff || [])];
    cart.forEach(item => {
      if (item.staff_id && !list.some(s => s.id === item.staff_id)) {
        list.push({ id: item.staff_id, name: item.staff_name || 'Staff', full_name: item.staff_name || 'Staff' });
      }
    });
    return list;
  };

  // Confirm and proceed to loading step
  const handleContinue = () => {
    if (remaining > 1) {
      return toast.error(`Số tiền chưa đủ (còn thiếu ${formatVND(remaining)})`);
    }
    setStep('confirm');
  };

  // Confirm Final Payment and Save
  const handleProceed = () => {
    setStep('processing');
  };

  // Finalize POS state change on Receipt close
  const handleReceiptDone = () => {
    onConfirm({ 
      tip, 
      discount, 
      payments: payments.filter((p) => p.amount > 0),
      tipSplits: tipSplits.filter(s => s.staffId && s.amount > 0),
      sessionCustomer: session?.customer
    });
  };

  // Trigger Receipt Printing
  const handlePrint = () => {
    window.print();
    toast.success('Đang khởi tạo lệnh in hóa đơn...');
  };

  // 1. Edit Tip Sub-screen Rendering
  if (isEditingTip) {
    const tempTotalTip = tempSplits.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="relative bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Chia tiền tip</h2>
            <button onClick={() => setIsEditingTip(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {tempSplits.map((split, index) => {
              const availableStaff = getSelectableStaff().filter(st => 
                st.id === split.staffId || !tempSplits.some((x, j) => j !== index && x.staffId === st.id)
              );
              return (
                <div key={index} className="flex items-center gap-2 mb-3">
                  <div className="flex-1 min-w-0 -mt-2">
                    <StaffAssignPicker
                      staff={availableStaff}
                      value={split.staffId}
                      onChange={(id) => setTempSplits(tempSplits.map((x, j) => j === index ? { ...x, staffId: id } : x))}
                      placeholder="Chọn nhân viên"
                    />
                  </div>
                  <div className="relative w-32 shrink-0">
                    <input 
                      type="number" 
                      value={split.amount || ''} 
                      onChange={(e) => setTempSplits(tempSplits.map((x, j) => j === index ? { ...x, amount: Number(e.target.value) || 0 } : x))} 
                      placeholder="Nhập số tiền"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right pl-6" 
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">đ</span>
                  </div>
                  <button 
                    onClick={() => setTempSplits(tempSplits.filter((_, j) => j !== index))}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            
            <button 
              onClick={() => setTempSplits([...tempSplits, { staffId: '', amount: 0 }])}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-colors mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm nhân viên
            </button>
          </div>

          {/* Footer */}
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng tiền tip</span>
              <span className="text-lg font-black text-slate-700">{formatVND(tempTotalTip)}</span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setIsEditingTip(false)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors">Hủy</button>
              <button onClick={handleApplyTipSplits} className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-colors">Áp dụng</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Confirm Payment Step Rendering (Image 1)
  if (step === 'confirm') {
    const tax = 0; // standard tax mockup placeholder
    const totalPayments = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const change = Math.max(0, totalPayments - total);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="relative bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Xác nhận thanh toán?</h2>
              <p className="text-xs text-slate-400 mt-0.5">Hành động này không thể hoàn tác. Bạn có chắc chắn?</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Summary */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 space-y-4">
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>Tạm tính</span><span className="font-semibold text-slate-800">{formatVND(subtotal)}</span></div>
                <div className="flex justify-between"><span>Giảm giá</span><span className="font-semibold text-slate-800">-{formatVND(discount)}</span></div>
                <div className="flex justify-between"><span>Thuế (Tax)</span><span className="font-semibold text-slate-800">{formatVND(tax)}</span></div>
                <div className="flex justify-between"><span>Tiền tip (Tip)</span><span className="font-semibold text-slate-800">{formatVND(tip)}</span></div>
              </div>
              
              <div className="border-t border-slate-200/60 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-800">Tổng thanh toán</span>
                <span className="text-xl font-black text-primary">{formatVND(total)}</span>
              </div>

              <div className="border-t border-slate-200/60 pt-3 space-y-2 text-sm text-slate-600">
                {payments.filter(p => p.amount > 0).map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="capitalize">{METHODS.find(m => m.value === p.method)?.label || p.method}</span>
                    <span className="font-semibold text-slate-800">{formatVND(p.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-green-600">
                  <span>Tiền thừa (Change)</span>
                  <span className="font-bold">{formatVND(change)}</span>
                </div>
              </div>
            </div>

            {/* Print Bill Toggle Option */}
            <div className="mt-5 flex items-center justify-between bg-slate-50/30 border border-slate-150 rounded-2xl px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">In hóa đơn sau khi thanh toán</span>
              <button 
                onClick={() => setPrintBill(!printBill)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${printBill ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${printBill ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <button onClick={() => setStep('payment')} className="text-primary font-bold hover:underline text-sm px-2">Sửa</button>
            <div className="flex gap-2 shrink-0 ml-auto">
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors">Hủy</button>
              <button onClick={handleProceed} className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-colors">Xác nhận</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Payment Processing Loader Rendering (Image 2)
  if (step === 'processing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="relative bg-white w-full max-w-sm rounded-3xl border border-slate-100 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto text-green-500 animate-bounce">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-800">Đang xử lý thanh toán...</h2>
            <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
              Giao dịch đang được xử lý, vui lòng không đóng cửa sổ hoặc chuyển hướng trang này. Có thể mất một vài giây...
            </p>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-150 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>
    );
  }

  // 4. Receipt view Rendering (Image 3)
  if (step === 'receipt') {
    const services = cart.filter(x => x.type === 'service');
    const products = cart.filter(x => x.type === 'product');
    const others = cart.filter(x => !['service', 'product'].includes(x.type));
    const totalPayments = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const change = Math.max(0, totalPayments - total);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto">
        <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col my-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 no-print">
            <span className="text-sm font-bold text-slate-700">Xem hóa đơn thanh toán</span>
            <button onClick={handleReceiptDone} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>

          {/* Paper Receipt Look */}
          <div className="printable-receipt bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 font-mono text-xs text-slate-800 space-y-5 shadow-inner">
            {/* Header info */}
            <div className="text-center space-y-1 pb-4 border-b border-slate-200">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary mb-2">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="font-bold text-sm tracking-tight">GloPro Spa & Beauty</div>
              <div className="text-[10px] text-slate-400">{currentTime}</div>
              <div className="font-black text-sm tracking-wider uppercase pt-3 text-slate-700">HÓA ĐƠN BÁN HÀNG</div>
              <div className="inline-block border border-dashed border-slate-300 rounded px-2.5 py-1.5 font-bold tracking-tight bg-white text-[10px] mt-1">
                {session.saleCode}
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-1 border-b border-slate-200 pb-3">
              <div className="flex justify-between"><span>Tên khách hàng:</span><span className="font-bold text-right truncate max-w-[180px]">{session.customer?.name || 'Khách vãng lai'}</span></div>
              <div className="flex justify-between"><span>Số điện thoại:</span><span>{session.customer?.phone || '—'}</span></div>
              <div className="flex justify-between"><span>Mã hóa đơn:</span><span>{session.saleCode}</span></div>
            </div>

            {/* Line Items */}
            <div className="space-y-3 pb-3 border-b border-slate-200">
              {services.length > 0 && (
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Dịch vụ</div>
                  {services.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <span className="truncate pr-2">{item.name} {item.qty > 1 && `x${item.qty}`}</span>
                      <span className="shrink-0 font-semibold">{formatVND(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
              {products.length > 0 && (
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Sản phẩm</div>
                  {products.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <span className="truncate pr-2">{item.name} {item.qty > 1 && `x${item.qty}`}</span>
                      <span className="shrink-0 font-semibold">{formatVND(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
              {others.length > 0 && (
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Khác / Thẻ / Gói</div>
                  {others.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <span className="truncate pr-2">{item.name} {item.qty > 1 && `x${item.qty}`}</span>
                      <span className="shrink-0 font-semibold">{formatVND(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Math Calculations */}
            <div className="space-y-1 border-b border-slate-200 pb-3">
              <div className="flex justify-between"><span>Tạm tính:</span><span>{formatVND(subtotal)}</span></div>
              <div className="flex justify-between"><span>Giảm giá:</span><span>-{formatVND(discount)}</span></div>
              <div className="flex justify-between"><span>Thuế (Tax):</span><span>0 đ</span></div>
              <div className="flex justify-between"><span>Tiền tip:</span><span>{formatVND(tip)}</span></div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center text-sm font-black tracking-wider pb-3 border-b border-slate-200 text-slate-900">
              <span>TỔNG THANH TOÁN:</span>
              <span>{formatVND(total)}</span>
            </div>

            {/* Payment detail rows */}
            <div className="space-y-1">
              <div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Phương thức thanh toán</div>
              {payments.filter(p => p.amount > 0).map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="capitalize">{METHODS.find(m => m.value === p.method)?.label || p.method}</span>
                  <span className="font-semibold">{formatVND(p.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-green-600 font-bold">
                <span>Tiền thừa trả khách:</span>
                <span>{formatVND(change)}</span>
              </div>
            </div>

            {/* QR block code placeholder */}
            <div className="text-center space-y-2 pt-4 border-t border-slate-200">
              <div className="text-[10px] text-slate-400 max-w-[200px] mx-auto">Quét mã QR để tải ứng dụng đặt lịch hẹn</div>
              <div className="bg-white border border-slate-200 p-2.5 rounded-xl inline-block shadow-xs">
                <QrCode className="w-20 h-20 text-slate-700" />
              </div>
              <div className="text-[9px] text-slate-400 max-w-[240px] mx-auto pt-2 leading-relaxed font-sans">
                Cảm ơn quý khách đã sử dụng dịch vụ tại GloPro Spa & Beauty. Rất hân hạnh được phục vụ quý khách lần sau!
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="mt-5 flex gap-2 w-full shrink-0 no-print">
            <button 
              onClick={handlePrint} 
              className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 bg-white"
            >
              <Printer className="w-4 h-4" /> In hóa đơn
            </button>
            <button 
              onClick={handleReceiptDone} 
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5"
            >
              Hoàn thành
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Main Checkout Flow Rendering ('payment' step)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative bg-white w-full max-w-lg rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Thanh toán hóa đơn</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Select tip block */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
              <span>Chọn tiền Tip</span>
              <div className="text-xs text-slate-400">
                Số tiền Tip: <span className="font-bold text-slate-600 ml-1">{formatVND(tip)}</span>
              </div>
            </div>

            {/* Percentage Buttons */}
            <div className="grid grid-cols-5 border border-slate-200 rounded-xl overflow-hidden h-10 divide-x divide-slate-200">
              {[0, 5, 10, 15, 20].map((percent) => {
                const isActive = selectedPercentage === percent;
                return (
                  <button
                    key={percent}
                    onClick={() => handlePercentageClick(percent)}
                    className={`flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5 mr-0.5 text-slate-800" />}
                    {percent}%
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden focus-within:border-primary h-11">
              <select
                value={tipUnit}
                onChange={(e) => handleTipUnitChange(e.target.value)}
                className="px-3 border-r border-slate-200 bg-slate-50 h-full text-xs font-bold text-slate-600 outline-none cursor-pointer"
              >
                <option value="vnd">đ</option>
                <option value="percent">%</option>
              </select>
              <input
                type="number"
                value={customTip}
                onChange={(e) => handleCustomTipChange(e.target.value)}
                placeholder="Hoặc nhập số tiền cụ thể..."
                className="flex-1 px-3.5 py-2 bg-transparent outline-none text-sm font-semibold text-slate-700 w-full"
              />
            </div>

            {/* Splits list display */}
            {tip > 0 && (
              <div className="text-xs text-slate-505 bg-slate-50 p-2.5 rounded-xl flex items-center justify-between">
                <span className="truncate">
                  {tipSplits.length > 0 ? (
                    <>
                      Chia tiền tip: {tipSplits.map(s => {
                        const st = getSelectableStaff().find(x => x.id === s.staffId);
                        return `${st?.full_name || st?.name || 'Nhân viên'}: ${formatVND(s.amount)}`;
                      }).join(', ')}
                    </>
                  ) : (
                    "Tip chưa được chia cho nhân viên"
                  )}
                </span>
                <button onClick={handleOpenEditTip} className="text-primary font-bold hover:underline shrink-0 ml-2">Sửa</button>
              </div>
            )}
          </div>

          {/* Select payment methods block */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-700">Chọn phương thức thanh toán <span className="text-red-500">*</span></div>
            
            <div className="space-y-2">
              {payments.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select 
                    value={p.method} 
                    onChange={(e) => setPayments(payments.map((x, j) => j === i ? { ...x, method: e.target.value } : x))}
                    className="flex-1 px-3 py-2.5 pr-8 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 font-semibold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <div className="relative w-32 shrink-0">
                    <input 
                      type="number" 
                      value={p.amount || ''} 
                      onChange={(e) => setPayments(payments.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) || 0 } : x))} 
                      placeholder="Nhập số tiền"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right pl-6" 
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">đ</span>
                  </div>
                  {i === 0 ? (
                    <button 
                      onClick={() => setPayments([...payments, { method: 'cash', amount: 0 }])}
                      className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => setPayments(payments.filter((_, j) => j !== i))}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Warnings & Messages */}
          {remaining > 0 ? (
            <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-bold shadow-xs">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Cần thanh toán thêm {formatVND(remaining)}
              </span>
              <button onClick={handleAddRemainingToCash} className="text-red-700 hover:underline">Thêm vào Tiền mặt</button>
            </div>
          ) : remaining < 0 ? (
            <div className="bg-green-50 text-green-600 border border-green-100 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-bold shadow-xs">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Tiền thừa: {formatVND(-remaining)}
              </span>
              <button onClick={handleAddChangeToTip} className="text-green-700 hover:underline">Thêm vào Tiền Tip</button>
            </div>
          ) : (
            <div className="bg-green-50 text-green-600 border border-green-100 rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-xs font-bold shadow-xs">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Đủ thanh toán ✓
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng thanh toán</span>
            <span className="text-xl font-black text-slate-800">{formatVND(total)}</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors">Hủy</button>
            <button onClick={handleContinue} disabled={paying || remaining > 1} className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-colors disabled:opacity-50">
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}