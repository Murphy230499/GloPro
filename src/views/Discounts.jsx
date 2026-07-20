'use client';
import React, { useState, useEffect } from 'react';
import { Megaphone, Ticket, Plus, Edit3, Trash2, Calendar, Sparkles, Percent, ChevronDown, X } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import { reloadPromotions, reloadVouchers } from '@/utils/promos';

const SCOPES = {
  service: 'Chỉ dịch vụ',
  product: 'Chỉ sản phẩm',
  invoice: 'Toàn hóa đơn'
};

const VALUE_TYPES = {
  percent: 'Giảm theo phần trăm (%)',
  fixed: 'Giảm số tiền cụ thể (đ)'
};

function genVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function Discounts() {
  const [activeTab, setActiveTab] = useState('promos'); // 'promos', 'vouchers'
  
  // Data lists
  const [promotions, setPromotions] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modals
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Promotion Form state
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [promoName, setPromoName] = useState('');
  const [promoScope, setPromoScope] = useState('invoice');
  const [promoValueType, setPromoValueType] = useState('percent');
  const [promoValue, setPromoValue] = useState('');
  const [promoExpiry, setPromoExpiry] = useState('');

  // Voucher Form state
  const [editingVoucherId, setEditingVoucherId] = useState(null);
  const [voucherName, setVoucherName] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherScope, setVoucherScope] = useState('invoice');
  const [voucherValueType, setVoucherValueType] = useState('fixed');
  const [voucherValue, setVoucherValue] = useState('');
  const [voucherExpiry, setVoucherExpiry] = useState('');
  const [voucherQty, setVoucherQty] = useState('10');

  const loadData = () => {
    setLoading(true);
    try {
      // Load Promotions
      const localPromos = localStorage.getItem('glopro_promotions');
      setPromotions(localPromos ? JSON.parse(localPromos) : []);

      // Load Vouchers
      const localVouchers = localStorage.getItem('glopro_vouchers');
      setVouchers(localVouchers ? JSON.parse(localVouchers) : []);

      // Load Promo Usages (to count usage statistics)
      const localUsages = localStorage.getItem('glopro_promo_usages');
      setUsages(localUsages ? JSON.parse(localUsages) : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getVoucherUsageCount = (code) => {
    return usages.filter(u => u.promo_id === code || u.code === code).length;
  };

  // --- PROMOTION ACTIONS ---
  const resetPromoForm = () => {
    setEditingPromoId(null);
    setPromoName('');
    setPromoScope('invoice');
    setPromoValueType('percent');
    setPromoValue('');
    setPromoExpiry('');
  };

  const handleSavePromo = () => {
    if (!promoName.trim()) return toast.error('Vui lòng nhập tên chương trình');
    if (!promoValue || Number(promoValue) <= 0) return toast.error('Vui lòng nhập giá trị giảm hợp lệ');
    if (promoValueType === 'percent' && Number(promoValue) > 100) return toast.error('Phần trăm giảm không được lớn hơn 100%');
    if (!promoExpiry) return toast.error('Vui lòng chọn ngày hết hạn');

    try {
      const local = localStorage.getItem('glopro_promotions');
      let list = local ? JSON.parse(local) : [];

      const payload = {
        id: editingPromoId || 'promo_cam_' + Date.now(),
        name: promoName.trim(),
        type: promoScope,
        valueType: promoValueType,
        value: Number(promoValue),
        expiryDate: promoExpiry,
        created_at: new Date().toISOString().split('T')[0]
      };

      if (editingPromoId) {
        list = list.map(p => p.id === editingPromoId ? payload : p);
      } else {
        list.push(payload);
      }

      localStorage.setItem('glopro_promotions', JSON.stringify(list));
      toast.success(editingPromoId ? 'Đã cập nhật khuyến mãi' : 'Đã tạo chương trình khuyến mãi');
      
      reloadPromotions();
      setShowPromoModal(false);
      resetPromoForm();
      loadData();
    } catch (e) {
      toast.error('Lỗi khi lưu khuyến mãi');
    }
  };

  const handleEditPromo = (p) => {
    setEditingPromoId(p.id);
    setPromoName(p.name);
    setPromoScope(p.type);
    setPromoValueType(p.valueType);
    setPromoValue(p.value.toString());
    setPromoExpiry(p.expiryDate || '');
    setShowPromoModal(true);
  };

  const handleDeletePromo = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương trình khuyến mãi này?')) return;
    try {
      const local = localStorage.getItem('glopro_promotions');
      let list = local ? JSON.parse(local) : [];
      list = list.filter(p => p.id !== id);
      localStorage.setItem('glopro_promotions', JSON.stringify(list));
      toast.success('Đã xóa chương trình khuyến mãi');
      reloadPromotions();
      loadData();
    } catch (e) {
      toast.error('Lỗi khi xóa khuyến mãi');
    }
  };

  // --- VOUCHER ACTIONS ---
  const resetVoucherForm = () => {
    setEditingVoucherId(null);
    setVoucherName('');
    setVoucherCode('');
    setVoucherScope('invoice');
    setVoucherValueType('fixed');
    setVoucherValue('');
    setVoucherExpiry('');
    setVoucherQty('10');
  };

  const handleSaveVoucher = () => {
    if (!voucherName.trim()) return toast.error('Vui lòng nhập tên voucher');
    if (!voucherCode.trim()) return toast.error('Vui lòng nhập mã voucher');
    if (!voucherValue || Number(voucherValue) <= 0) return toast.error('Vui lòng nhập giá trị giảm hợp lệ');
    if (voucherValueType === 'percent' && Number(voucherValue) > 100) return toast.error('Phần trăm giảm không được lớn hơn 100%');
    if (!voucherExpiry) return toast.error('Vui lòng chọn ngày hết hạn');
    if (!voucherQty || Number(voucherQty) <= 0) return toast.error('Vui lòng nhập số lượng phát hành hợp lệ');

    // Check code duplication
    const duplicate = vouchers.find(v => v.code.toUpperCase() === voucherCode.trim().toUpperCase() && v.id !== editingVoucherId);
    if (duplicate) return toast.error('Mã voucher này đã tồn tại');

    try {
      const local = localStorage.getItem('glopro_vouchers');
      let list = local ? JSON.parse(local) : [];

      const payload = {
        id: editingVoucherId || 'voucher_' + Date.now(),
        name: voucherName.trim(),
        code: voucherCode.trim().toUpperCase(),
        type: voucherScope,
        valueType: voucherValueType,
        value: Number(voucherValue),
        expiryDate: voucherExpiry,
        quantity: Number(voucherQty),
        created_at: new Date().toISOString().split('T')[0]
      };

      if (editingVoucherId) {
        list = list.map(v => v.id === editingVoucherId ? payload : v);
      } else {
        list.push(payload);
      }

      localStorage.setItem('glopro_vouchers', JSON.stringify(list));
      toast.success(editingVoucherId ? 'Đã cập nhật voucher' : 'Đã tạo voucher thành công');
      
      // Mutate VOUCHERS dynamic list in POS promos utility
      reloadVouchers();

      setShowVoucherModal(false);
      resetVoucherForm();
      loadData();
    } catch (e) {
      toast.error('Lỗi khi lưu voucher');
    }
  };

  const handleEditVoucher = (v) => {
    setEditingVoucherId(v.id);
    setVoucherName(v.name);
    setVoucherCode(v.code);
    setVoucherScope(v.type);
    setVoucherValueType(v.valueType);
    setVoucherValue(v.value.toString());
    setVoucherExpiry(v.expiryDate || '');
    setVoucherQty(v.quantity.toString());
    setShowVoucherModal(true);
  };

  const handleDeleteVoucher = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa voucher này?')) return;
    try {
      const local = localStorage.getItem('glopro_vouchers');
      let list = local ? JSON.parse(local) : [];
      list = list.filter(v => v.id !== id);
      localStorage.setItem('glopro_vouchers', JSON.stringify(list));
      toast.success('Đã xóa voucher');
      
      reloadVouchers();
      loadData();
    } catch (e) {
      toast.error('Lỗi khi xóa voucher');
    }
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  return (
    <div className="space-y-6">
      {/* Header section with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-sans">Giảm giá</h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5 uppercase tracking-wider font-sans">
            Quản lý chương trình khuyến mãi và voucher giảm giá
          </p>
        </div>

        {activeTab === 'promos' ? (
          <button 
            onClick={() => { resetPromoForm(); setShowPromoModal(true); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:opacity-95 transition-all font-sans"
          >
            <Plus className="w-4 h-4" /> Tạo chương trình
          </button>
        ) : (
          <button 
            onClick={() => { resetVoucherForm(); setShowVoucherModal(true); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:opacity-95 transition-all font-sans"
          >
            <Plus className="w-4 h-4" /> Tạo voucher
          </button>
        )}
      </div>

      {/* Tabs Menu Bar */}
      <div className="flex gap-1.5 pb-1">
        <button onClick={() => setActiveTab('promos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'promos' ? 'bg-primary text-white border border-primary shadow-sm' : 'bg-white text-slate-655 border border-slate-200 hover:border-slate-350 hover:bg-slate-50'}`}>
          <Megaphone className="w-3.5 h-3.5" /> Chương trình KM
        </button>
        <button onClick={() => setActiveTab('vouchers')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'vouchers' ? 'bg-primary text-white border border-primary shadow-sm' : 'bg-white text-slate-655 border border-slate-200 hover:border-slate-350 hover:bg-slate-50'}`}>
          <Ticket className="w-3.5 h-3.5" /> Voucher giảm giá
        </button>
      </div>

      {/* TAB 1: CTKM */}
      {activeTab === 'promos' && (
        <div className="space-y-5">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex flex-wrap items-center justify-between gap-3 text-left">
            <div className="text-left space-y-0.5 font-sans">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-primary" /> Thiết lập Chương trình Khuyến mãi (CTKM)
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                Tạo các gói khuyến mãi giảm giá dịch vụ, sản phẩm hoặc toàn hóa đơn để gửi tặng khách hàng theo tập phân khúc.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 font-sans">Danh sách chương trình đã tạo</h3>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách...</div>
            ) : promotions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-sans">Chưa có chương trình khuyến mãi tự tạo nào. Hãy nhấn nút "Tạo chương trình" ở góc trên.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {promotions.map((p) => {
                  const expired = isExpired(p.expiryDate);
                  return (
                    <div key={p.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col justify-between gap-3 font-sans relative overflow-hidden">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white ${expired ? 'bg-slate-300' : 'bg-primary'}`}>
                            <Percent className="w-4 h-4" />
                          </span>
                          <div className="text-left min-w-0">
                            <div className="font-bold text-xs text-slate-700 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-450 mt-1 font-semibold">
                              Mức giảm: <span className="text-primary font-bold">{p.valueType === 'percent' ? `${p.value}%` : formatVND(p.value)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                              Phạm vi: <span className="font-semibold text-slate-650">{SCOPES[p.type]}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${expired ? 'bg-red-55 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {expired ? 'Hết hạn' : 'Đang chạy'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200/50 pt-2 mt-1">
                        <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> Hết hạn: {p.expiryDate}
                        </div>

                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditPromo(p)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors" title="Sửa"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeletePromo(p.id)} className="p-1.5 text-red-400 hover:text-red-650 rounded-lg hover:bg-red-50 transition-colors" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VOUCHER */}
      {activeTab === 'vouchers' && (
        <div className="space-y-5">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex flex-wrap items-center justify-between gap-3 text-left">
            <div className="text-left space-y-0.5 font-sans">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-primary" /> Thiết lập Voucher giảm giá
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                Phát hành các mã Voucher giảm giá độc lập. Khách hàng hoặc thu ngân có thể nhập trực tiếp mã này trên POS khi thanh toán hóa đơn.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 font-sans">Danh sách mã Voucher đã phát hành</h3>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách...</div>
            ) : vouchers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-sans">Chưa có mã voucher tự phát hành nào. Hãy nhấn nút "Tạo voucher" ở góc trên.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {vouchers.map((v) => {
                  const expired = isExpired(v.expiryDate);
                  const usageCount = getVoucherUsageCount(v.code);
                  const remaining = Math.max(0, v.quantity - usageCount);
                  const isSoldOut = remaining <= 0;

                  return (
                    <div key={v.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col justify-between gap-3 font-sans relative overflow-hidden">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white ${expired || isSoldOut ? 'bg-slate-300' : 'bg-primary'}`}>
                            <Ticket className="w-4 h-4" />
                          </span>
                          <div className="text-left min-w-0">
                            <div className="font-bold text-xs text-slate-700 truncate">{v.name}</div>
                            <div className="font-mono text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-lg inline-block mt-1">
                              MÃ: {v.code}
                            </div>
                            <div className="text-[10px] text-slate-450 mt-1.5 font-semibold">
                              Mức giảm: <span className="text-slate-750 font-bold">{v.valueType === 'percent' ? `${v.value}%` : formatVND(v.value)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                              Phạm vi: <span className="font-semibold text-slate-650">{SCOPES[v.type]}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${expired ? 'bg-red-50 text-red-500 border border-red-100' : isSoldOut ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            {expired ? 'Hết hạn' : isSoldOut ? 'Hết lượt' : 'Hoạt động'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            Lượt dùng: <span className="text-slate-800 font-bold">{usageCount}</span> / {v.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200/50 pt-2 mt-1">
                        <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> Hết hạn: {v.expiryDate}
                        </div>

                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditVoucher(v)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors" title="Sửa"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteVoucher(v.id)} className="p-1.5 text-red-400 hover:text-red-650 rounded-lg hover:bg-red-50 transition-colors" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM MODAL 1: CTKM */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-200" onClick={() => setShowPromoModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto animate-in scale-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-150/50 pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-sans">{editingPromoId ? 'Chỉnh sửa CTKM' : 'Tạo chương trình khuyến mãi mới'}</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 font-sans">Cấu hình điều kiện ưu đãi</p>
              </div>
              <button 
                onClick={() => setShowPromoModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Tên chương trình khuyến mãi</label>
                <input value={promoName} onChange={(e) => setPromoName(e.target.value)} placeholder="Ví dụ: Tri ân VIP, Khuyến mãi Thu..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Phạm vi áp dụng</label>
                  <div className="relative">
                    <select value={promoScope} onChange={(e) => setPromoScope(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="invoice">Toàn hóa đơn</option>
                      <option value="service">Chỉ dịch vụ</option>
                      <option value="product">Chỉ sản phẩm</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Kiểu giảm giá</label>
                  <div className="relative">
                    <select value={promoValueType} onChange={(e) => setPromoValueType(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="percent">Giảm theo phần trăm (%)</option>
                      <option value="fixed">Giảm số tiền cụ thể (đ)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Giá trị giảm giá</label>
                  <input type="number" value={promoValue} onChange={(e) => setPromoValue(e.target.value)} placeholder={promoValueType === 'percent' ? 'Ví dụ: 10 (%)' : 'Ví dụ: 50,000 (đ)'} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Ngày hết hạn</label>
                  <input type="date" value={promoExpiry} onChange={(e) => setPromoExpiry(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
              <button onClick={() => setShowPromoModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans">Hủy</button>
              <button onClick={handleSavePromo} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans">
                {editingPromoId ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL 2: VOUCHER */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-200" onClick={() => setShowVoucherModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto animate-in scale-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-150/50 pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-sans">{editingVoucherId ? 'Chỉnh sửa Voucher' : 'Phát hành Voucher mới'}</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 font-sans">Nhập thông tin mã giảm giá</p>
              </div>
              <button 
                onClick={() => setShowVoucherModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Tên Voucher *</label>
                <input value={voucherName} onChange={(e) => setVoucherName(e.target.value)} placeholder="Ví dụ: Voucher Chào xuân, Khai trương..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Mã Voucher *</label>
                <div className="flex gap-2">
                  <input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} placeholder="Ví dụ: GP50K" className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-primary text-slate-700 bg-white" />
                  <button onClick={() => setVoucherCode(genVoucherCode())} className="px-3 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-200 transition-colors text-xs font-bold text-slate-655 font-sans">
                    Tạo mã ngẫu nhiên
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Phạm vi áp dụng</label>
                  <div className="relative">
                    <select value={voucherScope} onChange={(e) => setVoucherScope(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="invoice">Toàn hóa đơn</option>
                      <option value="service">Chỉ dịch vụ</option>
                      <option value="product">Chỉ sản phẩm</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Kiểu giảm giá</label>
                  <div className="relative">
                    <select value={voucherValueType} onChange={(e) => setVoucherValueType(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="fixed">Giảm số tiền cụ thể (đ)</option>
                      <option value="percent">Giảm theo phần trăm (%)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Giá trị giảm giá *</label>
                  <input type="number" value={voucherValue} onChange={(e) => setVoucherValue(e.target.value)} placeholder={voucherValueType === 'percent' ? 'Ví dụ: 10 (%)' : 'Ví dụ: 50,000 (đ)'} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">Số lượng phát hành *</label>
                  <input type="number" value={voucherQty} onChange={(e) => setVoucherQty(e.target.value)} placeholder="Ví dụ: 100" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">Ngày hết hạn *</label>
                <input type="date" value={voucherExpiry} onChange={(e) => setVoucherExpiry(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
              <button onClick={() => setShowVoucherModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-655 font-sans">Hủy</button>
              <button onClick={handleSaveVoucher} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans">
                {editingVoucherId ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
