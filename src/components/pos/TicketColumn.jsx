'use client';
import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, Printer, UserX, Ban, CreditCard, X, Edit3, Gift, History, Users, Smile } from 'lucide-react';
import { formatVND } from '@/lib/format';
import Avatar from '@/components/Avatar';
import StaffAssignPicker from '@/components/StaffAssignPicker';
import EmptyCart from '@/components/pos/EmptyCart';
import { PROMOTIONS, VOUCHERS, applyDiscountsToCart } from '@/utils/promos';
import { toast } from '@/components/Layout';

const TYPE_LABELS = {
  service: 'Dịch vụ',
  product: 'Sản phẩm',
  package: 'Gói dịch vụ',
  treatment: 'Liệu trình',
  service_combo: 'Combo dịch vụ',
  product_combo: 'Combo sản phẩm',
  prepaid_card: 'Thẻ tiền mặt',
};

const groupCartItems = (cart) => {
  const groups = {};
  cart.forEach((item, index) => {
    const type = item.type || 'service';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push({ item, index });
  });
  return groups;
};

export default function TicketColumn({ session, staff, customers, onUpdate, onPickCustomer, onClearCustomer, onNewCustomer, onCheckout, onCancel, onReview, disabled }) {
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientQ, setClientQ] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  
  const [editingItemIdx, setEditingItemIdx] = useState(null);

  const getCustomerEligiblePromotions = () => {
    const staticIds = ['promo_1', 'promo_2', 'promo_3'];
    const publicPromos = PROMOTIONS.filter(p => staticIds.includes(p.id));
    
    if (!session.customer) {
      return publicPromos;
    }

    try {
      const localAwards = localStorage.getItem('glopro_segment_campaign_awards');
      const awards = localAwards ? JSON.parse(localAwards) : [];

      const localUsages = localStorage.getItem('glopro_promo_usages');
      const usages = localUsages ? JSON.parse(localUsages) : [];

      const today = new Date().toISOString().split('T')[0];

      const eligibleAwards = awards.filter(a => 
        a.customer_ids.includes(session.customer.id) &&
        (!a.expiry_date || a.expiry_date >= today)
      );

      const unusedAwards = eligibleAwards.filter(a => {
        const hasUsed = usages.some(u => u.campaign_id === a.campaign_id && u.customer_id === session.customer.id);
        return !hasUsed;
      });

      const awardedPromos = PROMOTIONS.filter(p => 
        unusedAwards.some(a => a.campaign_id === p.id)
      );

      const allPromos = [...publicPromos, ...awardedPromos];
      const uniquePromos = [];
      const seenIds = new Set();
      allPromos.forEach(p => {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          uniquePromos.push(p);
        }
      });
      return uniquePromos;
    } catch (e) {
      console.error(e);
      return PROMOTIONS;
    }
  };
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editDiscountType, setEditDiscountType] = useState('vnd'); // 'vnd' or 'percent'
  const [editStaffId, setEditStaffId] = useState('');
  const [editStaffName, setEditStaffName] = useState('');

  useEffect(() => {
    if (session) {
      setVoucherInput(session.voucher?.code || '');
    }
  }, [session?.id, session?.voucher]);

  if (!session) return <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 flex items-center justify-center"><EmptyCart /></div>;

  const cart = session.cart || [];
  const customer = session.customer;
  const discount = session.discount || 0;

  const subtotal = cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
  const total = Math.max(0, subtotal - discount);

  const updateCart = (idx, patch) => onUpdate({ cart: cart.map((x, i) => (i === idx ? { ...x, ...patch } : x)) });
  const removeItem = (idx) => onUpdate({ cart: cart.filter((_, i) => i !== idx) });

  const handlePromoChange = (promoId) => {
    const promo = PROMOTIONS.find((p) => p.id === promoId) || null;
    const voucher = session.voucher;
    
    // Apply discounts to cart items
    const updatedCart = applyDiscountsToCart(cart, promo, voucher);
    
    let discountType = 'vnd';
    let discountValue = 0;
    if (promo && promo.type === 'invoice') {
      discountType = promo.valueType === 'percent' ? 'percent' : 'vnd';
      discountValue = promo.value;
    } else if (voucher && voucher.type === 'invoice') {
      discountType = voucher.valueType === 'percent' ? 'percent' : 'vnd';
      discountValue = voucher.value;
    }

    onUpdate({
      promo,
      cart: updatedCart,
      discountType,
      discountValue
    });
  };

  const handleApplyVoucher = () => {
    const code = voucherInput.trim().toUpperCase();
    const voucher = VOUCHERS.find((v) => v.code === code);
    if (!voucher) {
      toast.error('Mã voucher không hợp lệ');
      return;
    }

    // Expiry check
    if (voucher.expiryDate) {
      const today = new Date().toISOString().split('T')[0];
      if (voucher.expiryDate < today) {
        toast.error('Voucher này đã hết hạn sử dụng');
        return;
      }
    }

    // Quantity check
    if (voucher.quantity !== undefined && voucher.quantity !== null) {
      const usagesStr = localStorage.getItem('glopro_promo_usages');
      const usages = usagesStr ? JSON.parse(usagesStr) : [];
      const usedCount = usages.filter(u => u.promo_id === voucher.code || u.code === voucher.code).length;
      if (usedCount >= voucher.quantity) {
        toast.error('Voucher này đã hết lượt sử dụng');
        return;
      }
    }

    const promo = session.promo;
    
    // Apply discounts to cart items
    const updatedCart = applyDiscountsToCart(cart, promo, voucher);
    
    let discountType = 'vnd';
    let discountValue = 0;
    if (promo && promo.type === 'invoice') {
      discountType = promo.valueType === 'percent' ? 'percent' : 'vnd';
      discountValue = promo.value;
    } else if (voucher && voucher.type === 'invoice') {
      discountType = voucher.valueType === 'percent' ? 'percent' : 'vnd';
      discountValue = voucher.value;
    }

    onUpdate({
      voucher,
      cart: updatedCart,
      discountType,
      discountValue
    });
    toast.success('Áp dụng voucher thành công');
  };

  const handleRemoveVoucher = () => {
    const promo = session.promo;
    const voucher = null;
    setVoucherInput('');
    
    const updatedCart = applyDiscountsToCart(cart, promo, voucher);
    
    let discountType = 'vnd';
    let discountValue = 0;
    if (promo && promo.type === 'invoice') {
      discountType = promo.valueType === 'percent' ? 'percent' : 'vnd';
      discountValue = promo.value;
    }

    onUpdate({
      voucher: null,
      cart: updatedCart,
      discountType,
      discountValue
    });
  };

  const handleOpenEdit = (idx) => {
    const item = cart[idx];
    const origPrice = item.originalPrice || item.price || 0;
    setEditingItemIdx(idx);
    setEditQty(item.qty || 1);
    setEditPrice(item.price || 0);
    setEditDiscount(Math.max(0, origPrice - (item.price || 0)));
    setEditDiscountType('vnd');
    setEditStaffId(item.staff_id || '');
    setEditStaffName(item.staff_name || '');
  };

  const handleSwitchDiscountType = (type) => {
    if (type === editDiscountType) return;
    const item = cart[editingItemIdx];
    const origPrice = item.originalPrice || item.price || 0;
    if (origPrice === 0) {
      setEditDiscountType(type);
      setEditDiscount(0);
      return;
    }
    const currentDiscount = editDiscount || 0;
    if (type === 'percent') {
      const percent = Math.round((currentDiscount / origPrice) * 100);
      setEditDiscount(percent);
    } else {
      const vnd = Math.round((currentDiscount / 100) * origPrice);
      setEditDiscount(vnd);
    }
    setEditDiscountType(type);
  };

  const handleQtyChange = (val) => {
    if (val === '') {
      setEditQty('');
      return;
    }
    const parsed = parseInt(val);
    setEditQty(isNaN(parsed) ? 1 : Math.max(1, parsed));
  };

  const handlePriceChange = (val) => {
    if (val === '') {
      setEditPrice('');
      const origPrice = cart[editingItemIdx]?.originalPrice || cart[editingItemIdx]?.price || 0;
      if (editDiscountType === 'vnd') {
        setEditDiscount(origPrice);
      } else {
        setEditDiscount(100);
      }
      return;
    }
    const newPrice = Math.max(0, parseInt(val) || 0);
    setEditPrice(newPrice);
    const origPrice = cart[editingItemIdx]?.originalPrice || cart[editingItemIdx]?.price || 0;
    if (origPrice > 0) {
      if (editDiscountType === 'vnd') {
        setEditDiscount(Math.max(0, origPrice - newPrice));
      } else {
        setEditDiscount(Math.max(0, Math.round(((origPrice - newPrice) / origPrice) * 100)));
      }
    } else {
      setEditDiscount(0);
    }
  };

  const handleDiscountChange = (val) => {
    if (val === '') {
      setEditDiscount('');
      const origPrice = cart[editingItemIdx]?.originalPrice || cart[editingItemIdx]?.price || 0;
      setEditPrice(origPrice);
      return;
    }
    const value = Math.max(0, parseFloat(val) || 0);
    const origPrice = cart[editingItemIdx]?.originalPrice || cart[editingItemIdx]?.price || 0;
    setEditDiscount(value);
    if (editDiscountType === 'vnd') {
      setEditPrice(Math.max(0, origPrice - value));
    } else {
      setEditPrice(Math.max(0, Math.round(origPrice * (1 - value / 100))));
    }
  };

  const handleSaveEdit = () => {
    const item = cart[editingItemIdx];
    const origPrice = item.originalPrice || item.price || 0;
    updateCart(editingItemIdx, {
      qty: Number(editQty) || 1,
      price: editPrice === '' ? origPrice : Number(editPrice),
      originalPrice: origPrice,
      staff_id: editStaffId,
      staff_name: editStaffName
    });
    setEditingItemIdx(null);
  };

  const clientResults = clientQ
    ? customers.filter((c) => c.name?.toLowerCase().includes(clientQ.toLowerCase()) || c.phone?.includes(clientQ)).slice(0, 6)
    : customers.slice(0, 6);

  const created = session.createdAt ? new Date(session.createdAt) : new Date();
  const dateStr = created.toLocaleDateString('vi-VN') + ' ' + created.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Sale meta */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Mã đơn: <span className="font-semibold text-slate-600">{session.saleCode}</span></div>
          <div className="text-xs text-slate-400 mt-0.5">{dateStr}</div>
        </div>
        <button
          onClick={() => setHistoryOpen(true)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center gap-1 shrink-0"
          title="Xem lịch sử thao tác đơn"
        >
          <History className="w-3.5 h-3.5 text-slate-400" /> Lịch sử
        </button>
      </div>

      {/* Client */}
      <div className="px-4 py-3 border-b border-slate-100">
        {customer ? (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-pink-50">
            <Avatar src={customer.avatar_url} name={customer.name} size={36} color="#E879A9" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{customer.name}</div>
              <div className="text-xs text-slate-500">{customer.points || 0} điểm • {formatVND(customer.total_spent || 0)}</div>
            </div>
            <button onClick={onClearCustomer} className="text-slate-400 hover:text-red-500"><UserX className="w-4 h-4" /></button>
          </div>
        ) : showClientSearch ? (
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 mb-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input autoFocus value={clientQ} onChange={(e) => setClientQ(e.target.value)}
                placeholder="Nhập tên, email hoặc SĐT..."
                className="bg-transparent outline-none text-sm flex-1" />
              <button onClick={() => { setShowClientSearch(false); setClientQ(''); }} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <button onClick={() => { onPickCustomer({ name: 'Khách vãng lai', phone: '', points: 0, total_spent: 0 }); setShowClientSearch(false); }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left text-sm text-slate-500">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">VL</div>
                Khách vãng lai
              </button>
              {clientResults.map((c) => (
                <button key={c.id} onClick={() => { onPickCustomer(c); setShowClientSearch(false); setClientQ(''); }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left">
                  <Avatar src={c.avatar_url} name={c.name} size={32} color="#E879A9" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.phone} • {c.points || 0} điểm</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={onNewCustomer} className="text-sm text-primary font-semibold flex items-center gap-1 mt-2">
              <Plus className="w-4 h-4" /> Thêm khách hàng mới
            </button>
          </div>
        ) : (
          <button onClick={() => setShowClientSearch(true)}
            className="w-full flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-pink-300 hover:text-pink-500 transition-colors">
            <Search className="w-4 h-4" /> Nhập tên, email hoặc SĐT khách hàng
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {cart.length === 0 ? (
          <EmptyCart subtitle="Chọn dịch vụ, sản phẩm hoặc gói để thanh toán" />
        ) : (
          Object.entries(groupCartItems(cart)).map(([type, entries]) => {
            const label = TYPE_LABELS[type] || 'Khác';
            const totalQty = entries.reduce((s, e) => s + (e.item.qty || 1), 0);
            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label} ({totalQty})</span>
                  <div className="h-px bg-slate-100 flex-1 ml-3" />
                </div>
                {entries.map(({ item: x, index: i }) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{x.name}</div>
                        {x.promoLabel && (
                          <div className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                            🏷️ {x.promoLabel}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button onClick={() => handleOpenEdit(i)} className="text-slate-400 hover:text-primary transition-colors p-1" title="Chỉnh sửa chi tiết">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="Xoá mục"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateCart(i, { qty: Math.max(1, (x.qty || 1) - 1) })} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="w-7 text-center text-sm font-semibold">{x.qty || 1}</span>
                        <button onClick={() => updateCart(i, { qty: (x.qty || 1) + 1 })} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="text-right">
                        {x.originalPrice && x.originalPrice > x.price && (
                          <div className="text-[10.5px] text-slate-400 line-through leading-none mb-0.5">{formatVND(x.originalPrice * x.qty)}</div>
                        )}
                        <span className="font-bold text-sm text-pink-600">{formatVND((x.price || 0) * (x.qty || 1))}</span>
                      </div>
                    </div>
                    <div className="mt-1.5">
                      <StaffAssignPicker staff={staff} value={x.staff_id} onChange={(id, name) => updateCart(i, { staff_id: id, staff_name: name })} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-slate-100 px-4 py-3 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Tạm tính</span><span className="font-semibold">{formatVND(subtotal)}</span></div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex flex-col">
            <span className="text-slate-500">Giảm giá</span>
            {(session.promo?.type === 'invoice' || session.voucher?.type === 'invoice') && (
              <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5 mt-0.5 max-w-[150px] truncate animate-fade-in" title={`${session.promo?.type === 'invoice' ? session.promo.name : ''} ${session.voucher?.type === 'invoice' ? session.voucher.name : ''}`}>
                🏷️ {session.promo?.type === 'invoice' ? session.promo.name : ''} {session.voucher?.type === 'invoice' ? session.voucher.name : ''}
              </span>
            )}
          </div>
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden focus-within:border-primary h-8">
            <input type="number" value={session.discountValue || ''} onChange={(e) => onUpdate({ discountValue: Math.max(0, Number(e.target.value) || 0) })} placeholder="0"
              className="w-16 text-right px-1.5 py-1 bg-transparent outline-none text-sm font-medium text-slate-700 w-full" />
            <div className="flex border-l border-slate-200 bg-slate-50 h-full shrink-0">
              <button type="button" onClick={() => onUpdate({ discountType: 'vnd' })} className={`px-1.5 text-[10.5px] font-bold transition-colors h-full ${session.discountType === 'vnd' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}>đ</button>
              <button type="button" onClick={() => onUpdate({ discountType: 'percent' })} className={`px-1.5 text-[10.5px] font-bold transition-colors h-full ${session.discountType === 'percent' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}>%</button>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
          <span className="font-bold">Tổng tiền</span>
          <span className="text-xl font-bold text-pink-600">{formatVND(total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-2">
        <button disabled className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-300 cursor-not-allowed shrink-0" title="In hoá đơn">
          <Printer className="w-4 h-4" />
        </button>
        <button onClick={onCancel} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors shrink-0" title="Huỷ đơn">
          <Ban className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPromoModalOpen(true)}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
            session.promo || session.voucher
              ? 'bg-pink-50 border-pink-200 text-pink-600 shadow-sm'
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
          }`}
          title="Khuyến mãi & Voucher"
        >
          <Gift className={`w-4 h-4 ${session.promo || session.voucher ? 'animate-pulse' : ''}`} />
        </button>
        <button
          onClick={() => setStaffModalOpen(true)}
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center transition-all shrink-0"
          title="Phân công nhân viên nhanh"
        >
          <Users className="w-4 h-4" />
        </button>
        <button
          onClick={onReview}
          disabled={disabled || cart.length === 0}
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-primary flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
          title="Khảo sát đánh giá"
        >
          <Smile className="w-4 h-4" />
        </button>
        <button onClick={onCheckout} disabled={disabled || cart.length === 0}
          className="flex-grow py-2.5 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition-opacity">
          <CreditCard className="w-4 h-4" /> Thanh toán
        </button>
      </div>

      {editingItemIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setEditingItemIdx(null)}>
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Chỉnh sửa chi tiết</h3>
                <p className="text-xs text-slate-400 mt-0.5">{cart[editingItemIdx]?.name}</p>
              </div>
              <button onClick={() => setEditingItemIdx(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Số lượng</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleQtyChange(Math.max(1, (Number(editQty) || 1) - 1))} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-650 text-sm font-semibold">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input type="number" value={editQty} onChange={(e) => handleQtyChange(e.target.value)} className="flex-1 text-center h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                  <button type="button" onClick={() => handleQtyChange((Number(editQty) || 1) + 1)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-650 text-sm font-semibold">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Đơn giá bán (VND)</label>
                  <input type="number" value={editPrice} onChange={(e) => handlePriceChange(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Giảm giá</label>
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary h-10">
                    <input type="number" value={editDiscount} onChange={(e) => handleDiscountChange(e.target.value)} className="flex-grow px-3 bg-transparent outline-none text-sm font-medium text-pink-600 w-full" />
                    <div className="flex border-l border-slate-200 bg-slate-50">
                      <button type="button" onClick={() => handleSwitchDiscountType('vnd')} className={`px-2.5 text-xs font-bold transition-colors ${editDiscountType === 'vnd' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}>đ</button>
                      <button type="button" onClick={() => handleSwitchDiscountType('percent')} className={`px-2.5 text-xs font-bold transition-colors ${editDiscountType === 'percent' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}>%</button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nhân viên thực hiện / KTV</label>
                <StaffAssignPicker staff={staff} value={editStaffId} onChange={(sid, name) => {
                  setEditStaffId(sid);
                  setEditStaffName(name);
                }} placeholder="Chọn nhân viên phục vụ..." />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setEditingItemIdx(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors font-semibold text-sm text-slate-600">Huỷ</button>
              <button type="button" onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:opacity-90 transition-opacity">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Promos & Vouchers Modal */}
      {promoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setPromoModalOpen(false)}>
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Gift className="w-5 h-5 text-pink-500" />
                Khuyến mãi & Voucher
              </h3>
              <button onClick={() => setPromoModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Chương trình khuyến mãi (CTKM)</label>
                <select value={session.promo?.id || ''} onChange={(e) => handlePromoChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans">
                  <option value="">— Chọn khuyến mãi —</option>
                  {getCustomerEligiblePromotions().map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Mã Voucher giảm giá</label>
                <div className="flex gap-2">
                  <input type="text" value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)}
                    placeholder="Nhập mã voucher..."
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none uppercase font-semibold text-slate-700 w-full focus:border-primary focus:ring-1 focus:ring-primary" />
                  {session.voucher ? (
                    <button onClick={handleRemoveVoucher} className="px-4 h-10 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors shrink-0">Hủy</button>
                  ) : (
                    <button onClick={handleApplyVoucher} className="px-4 h-10 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shrink-0">Áp dụng</button>
                  )}
                </div>
                {session.voucher && (
                  <div className="text-xs text-green-600 font-semibold mt-1.5 flex items-center gap-1">
                    ✓ Đã áp dụng: {session.voucher.name}
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => setPromoModalOpen(false)} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:opacity-95 transition-opacity">
              Hoàn tất
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setHistoryOpen(false)}>
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl transition-all max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-5 h-5 text-primary" />
                Lịch sử thao tác đơn
              </h3>
              <button onClick={() => setHistoryOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
              {(!session.logs || session.logs.length === 0) ? (
                <div className="text-center py-12 text-slate-400 text-sm">Chưa có thao tác nào được thực hiện</div>
              ) : (
                <div className="relative pl-4 border-l border-slate-100 space-y-4">
                  {[...session.logs].reverse().map((log) => {
                    const logTime = new Date(log.time);
                    const timeStr = logTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    return (
                      <div key={log.id} className="relative">
                        {/* Dot */}
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white ring-4 ring-pink-50" />
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-slate-700">{log.action}</span>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">{timeStr}</span>
                          </div>
                          {log.details && <div className="text-xs text-slate-500 mt-0.5">{log.details}</div>}
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <span>Người thực hiện:</span>
                            <span className="font-semibold text-slate-500">{log.user || 'Lễ tân'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button onClick={() => setHistoryOpen(false)} className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 font-bold text-sm shrink-0">
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Quick Staff Assign Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setStaffModalOpen(false)}>
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl transition-all max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-5 h-5 text-primary" />
                Xếp nhân viên hàng loạt
              </h3>
              <button onClick={() => setStaffModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">Giỏ hàng trống</div>
              ) : (
                Object.entries(groupCartItems(cart)).map(([type, entries]) => {
                  const label = TYPE_LABELS[type] || 'Khác';
                  const totalQty = entries.reduce((s, e) => s + (e.item.qty || 1), 0);
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label} ({totalQty})</span>
                        <div className="h-px bg-slate-100 flex-1 ml-3" />
                      </div>
                      <div className="space-y-2">
                        {entries.map(({ item: x, index: i }) => (
                          <div key={i} className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex justify-between items-center px-1">
                              <span className="font-medium text-xs text-slate-700 truncate max-w-[240px]">{x.name}</span>
                              <span className="text-[10px] text-slate-400 font-semibold shrink-0">x{x.qty}</span>
                            </div>
                            <StaffAssignPicker staff={staff} value={x.staff_id} onChange={(id, name) => updateCart(i, { staff_id: id, staff_name: name })} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={() => setStaffModalOpen(false)} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:opacity-95 transition-opacity shrink-0">
              Hoàn tất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}