'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Minus, Trash2, Printer, UserX, CreditCard, X, Edit3, Gift, History, Users, Smile, ChevronDown, Scissors, ShoppingCart, Sparkles, Layers, Boxes, ExternalLink, Package, Star } from 'lucide-react';
import { formatVND } from '@/lib/format';
import Avatar from '@/components/Avatar';
import StaffAssignPicker from '@/components/StaffAssignPicker';
import EmptyCart from '@/components/pos/EmptyCart';
import PackageUsageModal from '@/components/pos/PackageUsageModal';
import { PROMOTIONS, VOUCHERS, applyDiscountsToCart } from '@/utils/promos';
import { toast } from '@/components/Layout';
import { useT } from '@/lib/i18n';

import { base44 } from '@/api/base44Client';
import { getNormalizedLogs } from '@/lib/logHelper';

// TYPE_LABELS are now translated dynamically via getTypeLabel(type, t)
const TYPE_LABEL_KEYS = {
  service: ['pos.ticket.type_service', 'Dịch vụ'],
  product: ['pos.ticket.type_product', 'Sản phẩm'],
  package: ['pos.ticket.type_package', 'Gói dịch vụ'],
  treatment: ['pos.ticket.type_treatment', 'Liệu trình'],
  service_combo: ['pos.ticket.type_service_combo', 'Combo dịch vụ'],
  product_combo: ['pos.ticket.type_product_combo', 'Combo sản phẩm'],
  prepaid_card: ['pos.ticket.type_prepaid_card', 'Thẻ tiền mặt'],
};

const TYPE_ICONS = {
  service: Scissors,
  product: ShoppingCart,
  package: Gift,
  treatment: Sparkles,
  service_combo: Layers,
  product_combo: Boxes,
  prepaid_card: CreditCard,
};

const getItemSubtitle = (x) => {
  const qty = x.qty || 1;
  const isServiceType = !x.type || ['service', 'service_combo', 'treatment', 'package'].includes(x.type);
  const defaultDur = isServiceType ? 30 : 0;
  const baseDur = Number(x.duration_minutes || x.duration) || defaultDur;
  const dur = baseDur * qty;

  if (dur > 0) {
    if (dur >= 60) {
      const h = Math.floor(dur / 60);
      const m = dur % 60;
      return m > 0 ? `⏱️ ${h}h ${m}p` : `⏱️ ${h}h`;
    }
    return `⏱️ ${dur} phút`;
  }
  if (x.type === 'product') {
    return x.stock != null ? `Tồn kho: ${x.stock}` : 'Sản phẩm';
  }
  if (x.type === 'package') {
    return `${(x.usage_count || x.sessions || 1) * qty} lần sử dụng`;
  }
  if (x.type === 'prepaid_card') {
    return `Mệnh giá: ${formatVND(x.balance || x.face_value || x.price)}`;
  }
  return '⏱️ 30 phút';
};

const groupCartItems = (cart) => {
  const groups = {};
  cart.forEach((item, index) => {
    let type = item.type || 'service';
    if (item.is_from_package && item.package_name) {
      if (item.customer_treatment_id) {
        type = `treatmentGroup_${item.package_name}`;
      } else {
        type = `packageGroup_${item.package_name}`;
      }
    }
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push({ item, index });
  });
  return groups;
};

export default function TicketColumn({ session, staff, customers, onUpdate, onPickCustomer, onClearCustomer, onNewCustomer, onCheckout, onCancel, onReview, disabled, onMobileAddClick }) {
  const { t } = useT();
  const getTypeLabel = (type) => {
    const keys = TYPE_LABEL_KEYS[type];
    return keys ? t(keys[0], keys[1]) : t('common.other', 'Khác');
  };
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientQ, setClientQ] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editPackageType, setEditPackageType] = useState(null);
  const [initialTreatmentId, setInitialTreatmentId] = useState(null);
  
  const [editingItemIdx, setEditingItemIdx] = useState(null);
  const [hasPackages, setHasPackages] = useState(false);

  const sessionCustomer = session?.customer;
  useEffect(() => {
    if (!sessionCustomer || !sessionCustomer.id) {
      setHasPackages(false);
      return;
    }
    
    let active = true;
    const checkPackages = async () => {
      try {
        if (base44?.entities?.Membership) {
          const mems = await base44.entities.Membership.list();
          const custMems = mems.filter(m => String(m.customer_id) === String(sessionCustomer.id) && (m.type === 'package' || m.type === 'treatment_course' || m.type === 'treatment') && m.status !== 'deleted' && m.sessions_remaining > 0);
          if (active) {
            setHasPackages(custMems.length > 0);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkPackages();
    return () => { active = false; };
  }, [sessionCustomer]);

  const isAnyModalOpen = editingItemIdx !== null || promoModalOpen || historyOpen || staffModalOpen || showPackageModal || editPackageType !== null;
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAnyModalOpen]);

  const getCustomerEligiblePromotions = () => {
    const publicPromos = PROMOTIONS.filter(p => !p.isGiftable);
    
    if (!session.customer) {
      return publicPromos;
    }

    try {
      const localAwards = localStorage.getItem('glopro_segment_campaign_awards');
      const awards = localAwards ? JSON.parse(localAwards) : [];

      const localGifts = localStorage.getItem('glopro_customer_gifts');
      const gifts = localGifts ? JSON.parse(localGifts) : {};
      const customerGifts = gifts[session.customer.id] || [];

      const localUsages = localStorage.getItem('glopro_promo_usages');
      const usages = localUsages ? JSON.parse(localUsages) : [];

      const today = new Date().toISOString().split('T')[0];

      // Segment Campaign Awards
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

      // Gifted Promos
      const unusedGifts = customerGifts.filter(g => !g.used);
      const giftedPromos = PROMOTIONS.filter(p => 
        unusedGifts.some(g => g.promo_id === p.id) &&
        (!p.expiryDate || p.expiryDate >= today)
      );

      const allPromos = [...publicPromos, ...awardedPromos, ...giftedPromos];
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
      return PROMOTIONS.filter(p => !p.isGiftable);
    }
  };
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editDiscountType, setEditDiscountType] = useState('vnd'); // 'vnd' or 'percent'
  const [editStaffId, setEditStaffId] = useState('');
  const [editStaffName, setEditStaffName] = useState('');
  const [editIsRequested, setEditIsRequested] = useState(false);

  useEffect(() => {
    if (session) {
      setVoucherInput(session.voucher?.code || '');
    }
  }, [session?.id, session?.voucher]);

  useEffect(() => {
    if (!session || session.voucher || session.manuallyRemovedVoucher || (session.cart || []).length === 0) return;

    const currentSubtotal = (session.cart || []).reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
    const cus = session.customer;

    const autoVoucher = VOUCHERS.find(v => {
      if (!v.isAutoApply) return false;
      if (v.visibility === 'private') return false;
      
      const today = new Date().toISOString().split('T')[0];
      if (v.startDate && v.startDate > today) return false;
      if (v.expiryDate && v.expiryDate < today) return false;

      if (v.quantity !== undefined && v.quantity !== null) {
        const usagesStr = localStorage.getItem('glopro_promo_usages');
        const usages = usagesStr ? JSON.parse(usagesStr) : [];
        const usedCount = usages.filter(u => u.promo_id === v.code || u.code === v.code).length;
        if (usedCount >= v.quantity) return false;
      }

      if (v.minSpend && currentSubtotal < v.minSpend) return false;

      if (v.targetAudience === 'new_customer' && (!cus || (cus.total_spent || 0) > 0)) return false;
      if (v.targetAudience === 'returning_customer' && (!cus || (cus.total_spent || 0) === 0)) return false;

      return true;
    });

    if (autoVoucher) {
      const currentCart = session.cart || [];
      const updatedCart = applyDiscountsToCart(currentCart, session.promo, autoVoucher);
      let dType = 'vnd';
      let dVal = 0;
      if (session.promo && session.promo.type === 'invoice') {
        dType = session.promo.valueType === 'percent' ? 'percent' : 'vnd';
        dVal = session.promo.value;
      } else if (autoVoucher.type === 'invoice') {
        dType = autoVoucher.valueType === 'percent' ? 'percent' : 'vnd';
        dVal = autoVoucher.value;
      }

      onUpdate({
        voucher: autoVoucher,
        cart: updatedCart,
        discountType: dType,
        discountValue: dVal
      });
      toast.success(`Đã tự động áp dụng voucher ${autoVoucher.code}`);
    }
  }, [session?.id, session?.voucher, session?.manuallyRemovedVoucher, session?.cart?.length, session?.customer?.id]);

  if (!session) return <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 flex items-center justify-center"><EmptyCart /></div>;

  const cart = session.cart || [];
  const customer = session.customer;
  const discount = session.discount || 0;

  const subtotal = cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
  const total = Math.max(0, subtotal - discount);

  const updateCart = (idx, patch) => onUpdate({ cart: cart.map((x, i) => (i === idx ? { ...x, ...patch } : x)) });
  const removeItem = (idx) => onUpdate({ cart: cart.filter((_, i) => i !== idx) });

  const handlePrintDraft = () => {
    const now = new Date();
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const currentTime = now.toLocaleDateString('vi-VN', options);
    const customerName = session.customer?.name || 'Khách vãng lai';
    const customerPhone = session.customer?.phone || '—';
    const invoiceCode = session.saleCode || '';

    const discountAmount = session.discountType === 'percent'
      ? Math.round(subtotal * ((session.discountValue || 0) / 100))
      : (session.discountValue || 0);
    const grandTotal = Math.max(0, subtotal - discountAmount);

    const services = cart.filter(x => x.type === 'service');
    const products = cart.filter(x => x.type === 'product');
    const others = cart.filter(x => !['service', 'product'].includes(x.type));

    const renderSection = (label, items) => items.length === 0 ? '' : `
      <div class="section-label">${label}</div>
      ${items.map(x => `
        <div class="line-item">
          <span>${x.name}${x.qty > 1 ? ' x' + x.qty : ''}</span>
          <span>${(x.price * x.qty).toLocaleString('vi-VN')}đ</span>
        </div>`).join('')}`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Hoá đơn tạm tính - ${invoiceCode}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 12px; background: #f5f5f5; display: flex; justify-content: center; padding: 20px; }
  .receipt { background: white; width: 320px; padding: 20px; border: 1px dashed #ccc; border-radius: 8px; }
  .header { text-align: center; padding-bottom: 12px; border-bottom: 1px dashed #ccc; margin-bottom: 12px; }
  .brand { font-size: 15px; font-weight: bold; letter-spacing: 0.5px; }
  .draft-badge { display: inline-block; border: 1px dashed #ccc; border-radius: 4px; padding: 3px 10px; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-top: 8px; color: #E879A9; }
  .meta { font-size: 10px; color: #888; margin-top: 4px; }
  .info-block { border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
  .section-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #888; letter-spacing: 1px; margin: 8px 0 4px; }
  .line-item { display: flex; justify-content: space-between; margin-bottom: 3px; }
  .divider { border: none; border-top: 1px dashed #ccc; margin: 10px 0; }
  .totals { margin-top: 8px; }
  .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
  .grand-total { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-top: 8px; padding-top: 8px; border-top: 2px solid #333; }
  .footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #ccc; font-size: 10px; color: #999; line-height: 1.6; }
  .watermark { color: #E879A9; font-weight: bold; font-size: 11px; display: block; margin-bottom: 4px; }
</style>
</head><body>
<div class="receipt">
  <div class="header">
    <div class="brand">GloPro Spa &amp; Beauty</div>
    <div class="meta">${currentTime}</div>
    <div class="draft-badge">Hoá đơn tạm tính</div>
    <div class="meta" style="margin-top:6px;border:1px dashed #eee;display:inline-block;padding:2px 8px;border-radius:4px">${invoiceCode}</div>
  </div>
  <div class="info-block">
    <div class="info-row"><span>Tên khách hàng:</span><span style="font-weight:bold;text-align:right;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${customerName}</span></div>
    <div class="info-row"><span>Số điện thoại:</span><span>${customerPhone}</span></div>
    <div class="info-row"><span>Mã hoá đơn:</span><span>${invoiceCode}</span></div>
  </div>
  <div>
    ${renderSection('Dịch vụ', services)}
    ${renderSection('Sản phẩm', products)}
    ${renderSection('Khác / Thẻ / Gói', others)}
  </div>
  <hr class="divider" />
  <div class="totals">
    <div class="total-row"><span>Tạm tính:</span><span>${subtotal.toLocaleString('vi-VN')}đ</span></div>
    ${discountAmount > 0 ? `<div class="total-row"><span>Giảm giá:</span><span style="color:green">-${discountAmount.toLocaleString('vi-VN')}đ</span></div>` : ''}
    <div class="total-row"><span>Thuế (Tax):</span><span>0 đ</span></div>
    <div class="grand-total"><span>TỔNG THANH TOÁN:</span><span>${grandTotal.toLocaleString('vi-VN')}đ</span></div>
  </div>
  <div class="footer">
    <span class="watermark">★ Đây là hoá đơn tạm tính ★</span>
    Cảm ơn quý khách đã sử dụng dịch vụ<br/>tại GloPro Spa &amp; Beauty!<br/>Rất hân hạnh được phục vụ quý khách lần sau.
  </div>
</div>
</body></html>`;

    const win = window.open('', '_blank', 'width=420,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 400);
    }
  };

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
      toast.error(t('pos.ticket.invalid_voucher', 'Mã voucher không hợp lệ'));
      return;
    }

    // Expiry check
    if (voucher.expiryDate) {
      const today = new Date().toISOString().split('T')[0];
      if (voucher.expiryDate < today) {
        toast.error(t('pos.ticket.voucher_expired', 'Voucher này đã hết hạn sử dụng'));
        return;
      }
    }

    // Quantity check
    if (voucher.quantity !== undefined && voucher.quantity !== null) {
      const usagesStr = localStorage.getItem('glopro_promo_usages');
      const usages = usagesStr ? JSON.parse(usagesStr) : [];
      const usedCount = usages.filter(u => u.promo_id === voucher.code || u.code === voucher.code).length;
      if (usedCount >= voucher.quantity) {
        toast.error(t('pos.ticket.voucher_exhausted', 'Voucher này đã hết lượt sử dụng'));
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
    toast.success(t('pos.ticket.voucher_applied', 'Áp dụng voucher thành công'));
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
      manuallyRemovedVoucher: true,
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
    setEditIsRequested(!!item.is_customer_requested);
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
      staff_name: editStaffName,
      is_customer_requested: editIsRequested
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
      <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span>{t('pos.ticket.order_code', 'Mã đơn:')}</span>
            {session.id && !String(session.id).startsWith('direct_pos_') ? (
              <Link 
                href={`/invoices/${session.id}`}
                className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                title={t('pos.ticket.view_invoice_detail', 'Xem chi tiết hoá đơn')}
              >
                #{session.saleCode || session.id}
                <ExternalLink className="w-3 h-3 text-emerald-500 inline-block" />
              </Link>
            ) : (
              <span className="font-semibold text-slate-600">#{session.saleCode}</span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{dateStr}</div>
        </div>
        <button
          onClick={() => setHistoryOpen(true)}
          className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center gap-1 shrink-0"
          title={t('pos.ticket.history_title', 'Lịch sử thao tác đơn')}
        >
          <History className="w-3.5 h-3.5 text-slate-400" /> {t('pos.ticket.history', 'Lịch sử')}
        </button>
      </div>

      {/* Client */}
      <div className="px-3.5 py-2 border-b border-slate-100">
        {customer ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
              <Link href={`/customers?id=${customer.id}`} className="flex-1 flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
                <Avatar src={customer.avatar_url} name={customer.name} size={36} color="#34D399" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate text-emerald-800 hover:underline">{customer.name}</div>
                  <div className="text-xs text-slate-500">{customer.points || 0} {t('common.points', 'điểm')} • {t('pos.ticket.total_spent', 'Tổng chi tiêu:')} {formatVND(customer.total_spent || 0)}</div>
                </div>
              </Link>
              <button onClick={onClearCustomer} className="text-slate-400 hover:text-red-500 shrink-0 ml-1"><UserX className="w-4 h-4" /></button>
            </div>
            {hasPackages && (
              <button onClick={() => setShowPackageModal(true)} className="flex items-center justify-center gap-2 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 bg-white hover:bg-emerald-50 text-xs font-semibold shadow-sm transition-colors">
                <Package className="w-3.5 h-3.5" /> {t('pos.ticket.view_packages', 'Gói & Liệu trình đã mua')}
              </button>
            )}
          </div>
        ) : showClientSearch ? (
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 mb-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input autoFocus value={clientQ} onChange={(e) => setClientQ(e.target.value)}
                placeholder={t('pos.ticket.search_cust_input_placeholder', 'Nhập tên, email hoặc SĐT...')}
                className="bg-transparent outline-none text-sm flex-1" />
              <button onClick={() => { setShowClientSearch(false); setClientQ(''); }} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <button onClick={() => { onPickCustomer({ name: 'Khách vãng lai', phone: '', points: 0, total_spent: 0 }); setShowClientSearch(false); }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left text-sm text-slate-500">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">VL</div>
                {t('pos.ticket.walk_in', 'Khách vãng lai')}
              </button>
              {clientResults.map((c) => (
                <button key={c.id} onClick={() => { onPickCustomer(c); setShowClientSearch(false); setClientQ(''); }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left">
                  <Avatar src={c.avatar_url} name={c.name} size={32} color="#34D399" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.phone} • {c.points || 0} {t('common.points', 'điểm')}</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => onNewCustomer?.(clientQ)} className="text-sm text-emerald-600 font-semibold flex items-center gap-1 mt-2 hover:underline">
              <Plus className="w-4 h-4" /> {t('pos.ticket.add_new_customer', 'Thêm khách hàng mới')}
            </button>
          </div>
        ) : (
          <button onClick={() => setShowClientSearch(true)}
            className="w-full flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-emerald-300 hover:text-emerald-600 transition-colors">
            <Search className="w-4 h-4" /> {t('pos.ticket.search_cust_input_placeholder', 'Nhập tên, email hoặc SĐT khách hàng')}
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {cart.length === 0 ? (
          <EmptyCart subtitle={t('pos.ticket.empty_cart_subtitle', 'Chọn dịch vụ, sản phẩm hoặc gói để thanh toán')} />
        ) : (
          Object.entries(groupCartItems(cart)).map(([type, entries]) => {
            let label = getTypeLabel(type);
            if (type.startsWith('packageGroup_')) {
              label = `${t('pos.ticket.use_package', 'Dùng gói:')} ${type.replace('packageGroup_', '')}`;
            } else if (type.startsWith('treatmentGroup_')) {
              label = `${t('pos.ticket.use_treatment', 'Dùng liệu trình:')} ${type.replace('treatmentGroup_', '')}`;
            }
            const totalQty = entries.reduce((s, e) => s + (e.item.qty || 1), 0);
            
            if (type.startsWith('packageGroup_') || type.startsWith('treatmentGroup_')) {
              const isTreatment = type.startsWith('treatmentGroup_');
              const packageName = isTreatment ? type.replace('treatmentGroup_', '') : type.replace('packageGroup_', '');
              const sectionHeader = isTreatment ? t('pos.ticket.use_treatment_caps', 'DÙNG LIỆU TRÌNH') : t('pos.ticket.use_package_caps', 'DÙNG GÓI');
              return (
                <div key={type} className="space-y-2 mb-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{sectionHeader}</span>
                    <div className="h-px bg-slate-100 flex-1 ml-3" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                    {/* Package/Treatment Header */}
                    <div className="p-4 bg-white border-b border-slate-100 flex flex-col gap-3 rounded-t-xl">
                      <div className="flex items-center gap-3">
                        {isTreatment ? (
                          <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-white fill-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                            <Star className="w-4 h-4 text-white fill-white" />
                          </div>
                        )}
                        <h3 className="font-bold text-slate-800 text-lg tracking-tight">{packageName}</h3>
                      </div>
                      
                      <div className="flex items-center justify-between pl-1">
                        <div className="text-[14px] text-slate-500">
                          11:00 AM &rarr; 11:30 AM ({totalQty * 30} {t('common.minutes', 'phút')})
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => {
                            if (isTreatment) {
                              const ctId = entries[0]?.item?.customer_treatment_id;
                              if (ctId) {
                                setInitialTreatmentId(ctId);
                                setShowPackageModal(true);
                              }
                            } else {
                              setEditPackageType(type);
                            }
                          }} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-50 transition-colors" title={t('pos.ticket.edit_quantity', 'Chỉnh sửa số lượng')}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => {
                            const indicesToRemove = entries.map(e => e.index).sort((a,b) => b - a);
                            let newCart = [...cart];
                            indicesToRemove.forEach(idx => newCart.splice(idx, 1));
                            onUpdate({ cart: newCart });
                          }} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-slate-50 transition-colors" title={isTreatment ? t('pos.ticket.delete_treatment_tooltip', 'Xoá liệu trình này') : t('pos.ticket.delete_package_tooltip', 'Xoá gói này')}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  
                  {/* Package Services */}
                  <div className="p-2 space-y-0">
                    {entries.map(({ item: x, index: i }, idx) => (
                      <div key={i} className="flex items-start justify-between p-4 bg-white">
                        <div className="flex-1 pr-4 flex flex-col gap-3">
                          <div className="font-medium text-[16px] text-slate-800">{x.name}</div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-slate-500 text-[14px] shrink-0">{x.qty * 30} {t('common.minutes', 'phút')} &bull;</span>
                            <div className="w-[190px] -mt-1.5">
                              <StaffAssignPicker staff={staff} value={x.staff_id} isRequested={x.is_customer_requested} onChange={(id, name, req) => updateCart(i, { staff_id: id, staff_name: name, is_customer_requested: req })} color="slate-600" hideRequestedCheckbox={true} />
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="flex items-center gap-1.5 mt-1">
                            {x.originalPrice > x.price && (
                              <span className="text-[15px] text-slate-400 line-through">{formatVND(x.originalPrice * x.qty)}</span>
                            )}
                            <span className="font-medium text-[15px] text-slate-800">{formatVND((x.price || 0) * (x.qty || 1))}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              );
            }

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label} ({totalQty})</span>
                  <div className="h-px bg-slate-100 flex-1 ml-3" />
                </div>
                {entries.map(({ item: x, index: i }) => {
                  const IconComponent = TYPE_ICONS[x.type] || Scissors;
                  return (
                    <div key={i} className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3 transition-all hover:border-slate-200/80">
                      {/* Top Item Info */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Item Thumbnail / Image / Card icon */}
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            {x.type === 'prepaid_card' ? (
                              <div className="w-full h-full p-1 flex flex-col justify-between relative select-none" style={{ backgroundColor: x.color || '#FF6B9D' }}>
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/20" />
                                <div className="flex justify-between items-start w-full relative z-10 leading-none">
                                  <span className="text-[5px] text-white/60 font-bold">CARD</span>
                                  <div className="w-2 h-1.5 rounded-xs bg-yellow-400/85 shadow-xs" />
                                </div>
                                <div className="text-[6px] text-white font-bold tracking-tight truncate relative z-10 w-full leading-none">
                                  {x.name}
                                </div>
                              </div>
                            ) : x.image_url || x.image ? (
                              <img src={x.image_url || x.image} alt={x.name} className="w-full h-full object-cover" />
                            ) : (
                              <IconComponent className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-slate-800 truncate" title={x.name}>{x.name}</div>
                            {getItemSubtitle(x) && (
                              <div className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                                {getItemSubtitle(x)}
                              </div>
                            )}
                            {x.promoLabel && (
                              <div className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                                🏷️ {x.promoLabel}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Top Right Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleOpenEdit(i)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-white transition-colors" title={t('pos.ticket.edit_details', 'Chỉnh sửa chi tiết')}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeItem(i)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-white transition-colors" title={t('pos.ticket.delete_item_tooltip', 'Xoá mục')}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Row: Quantity Stepper Box & Total Price */}
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/80">
                        {/* Tactile Quantity Stepper Pill */}
                        <div className="inline-flex items-center bg-white border border-slate-200/90 rounded-xl p-0.5 shadow-2xs">
                          <button 
                            onClick={() => updateCart(i, { qty: Math.max(1, (x.qty || 1) - 1) })} 
                            className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                            title={t('pos.ticket.decrease_qty', 'Giảm số lượng')}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-800 min-w-[24px] text-center select-none">
                            {x.qty || 1}
                          </span>
                          <button 
                            onClick={() => updateCart(i, { qty: (x.qty || 1) + 1 })} 
                            className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                            title={t('pos.ticket.increase_qty', 'Tăng số lượng')}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Total Price for item */}
                        <div className="text-right flex flex-col justify-center">
                          {x.originalPrice && x.originalPrice > x.price && (
                            <span className="text-[10px] text-slate-400 line-through leading-none mb-0.5">{formatVND(x.originalPrice * x.qty)}</span>
                          )}
                          <span className="font-extrabold text-sm text-emerald-600 leading-tight">{formatVND((x.price || 0) * (x.qty || 1))}</span>
                        </div>
                      </div>

                      {/* Assigned Staff or Direct Assign Picker */}
                      <div className="mt-2 pt-2 border-t border-slate-100/80">
                        {x.staff_name ? (
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 font-medium truncate">
                              <span className="text-slate-400">KTV:</span>
                              <span className="text-slate-700 font-bold truncate">{x.staff_name}</span>
                              {x.is_customer_requested && (
                                <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200/60 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                  {t('pos.ticket.requested', 'Yêu cầu')}
                                </span>
                              )}
                            </span>
                            <div className="w-[140px] shrink-0">
                              <StaffAssignPicker 
                                staff={staff} 
                                value={x.staff_id} 
                                isRequested={x.is_customer_requested} 
                                onChange={(id, name, req) => updateCart(i, { staff_id: id, staff_name: name, is_customer_requested: req })} 
                                color="emerald-500" 
                                placeholder={x.staff_name}
                                hideRequestedCheckbox={true} 
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400 font-medium">{t('pos.ticket.assign_staff', 'KTV thực hiện')}:</span>
                            <div className="w-[160px] shrink-0">
                              <StaffAssignPicker 
                                staff={staff} 
                                value={x.staff_id || ''} 
                                isRequested={x.is_customer_requested || false} 
                                onChange={(id, name, req) => updateCart(i, { staff_id: id, staff_name: name, is_customer_requested: req })} 
                                color="emerald-500" 
                                placeholder="— Chọn KTV —"
                                hideRequestedCheckbox={true} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}

        {/* Mobile Add Item Button */}
        {onMobileAddClick && (
          <button 
            onClick={onMobileAddClick}
            className="w-full flex items-center justify-center gap-2 p-3 mt-4 rounded-xl border border-dashed border-emerald-300 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2]" /> {t('pos.ticket.add_items_mobile', 'Thêm dịch vụ / sản phẩm')}
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-slate-100 px-3.5 py-2 space-y-1.5">
        <div className="flex justify-between text-sm"><span className="text-slate-500">{t('pos.ticket.subtotal', 'Tạm tính')}</span><span className="font-semibold">{formatVND(subtotal)}</span></div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex flex-col">
            <span className="text-slate-500">{t('pos.ticket.discount', 'Giảm giá')}</span>
            {(session.promo?.type === 'invoice' || session.voucher?.type === 'invoice') && (
              <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5 mt-0.5 max-w-[150px] truncate animate-fade-in" title={`${session.promo?.type === 'invoice' ? session.promo.name : ''} ${session.voucher?.type === 'invoice' ? session.voucher.name : ''}`}>
                🏷️ {session.promo?.type === 'invoice' ? session.promo.name : ''} {session.voucher?.type === 'invoice' ? session.voucher.name : ''}
              </span>
            )}
          </div>
          <div className="flex items-center border border-slate-200 rounded-xl bg-white px-3 py-1 h-9 focus-within:border-emerald-500 shadow-sm transition-all w-28">
            <input type="number" value={session.discountValue || ''} onChange={(e) => onUpdate({ discountValue: Math.max(0, Number(e.target.value) || 0) })} placeholder="0"
              className="bg-transparent border-none outline-none text-sm font-semibold text-slate-700 w-full text-right focus:ring-0 focus:outline-none pr-1.5 placeholder:text-slate-400" />
            <div className="relative flex items-center shrink-0 pr-1 pl-1.5 border-l border-slate-100">
              <select 
                value={session.discountType || 'percent'}
                onChange={(e) => onUpdate({ discountType: e.target.value })}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-500 cursor-pointer focus:ring-0 focus:outline-none appearance-none pr-3 select-none"
                style={{ background: 'none' }}
              >
                <option value="vnd">đ</option>
                <option value="percent">%</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
          <span className="font-bold">{t('pos.ticket.total', 'Tổng tiền')}</span>
          <span className="text-xl font-bold text-emerald-600">{formatVND(total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-1.5">
        <button
          onClick={handlePrintDraft}
          disabled={cart.length === 0}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
          title={t('pos.ticket.print_draft_tooltip', 'In hoá đơn tạm tính')}
        >
          <Printer className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPromoModalOpen(true)}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
            session.promo || session.voucher
              ? 'bg-emerald-50 border-emerald-250 text-emerald-600 shadow-sm'
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
          }`}
          title={t('pos.ticket.promo_voucher_tooltip', 'Khuyến mãi & Voucher')}
        >
          <Gift className={`w-4 h-4 ${session.promo || session.voucher ? 'animate-pulse' : ''}`} />
        </button>
        <button
          onClick={() => setStaffModalOpen(true)}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center transition-all shrink-0"
          title={t('pos.ticket.quick_staff_tooltip', 'Phân công nhân viên nhanh')}
        >
          <Users className="w-4 h-4" />
        </button>
        <button 
          onClick={onCancel}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition-all shrink-0 cursor-pointer"
          title={t('pos.ticket.delete_invoice_tooltip', 'Hủy / Xoá hoá đơn')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {/* Review Survey Button with Realtime Status Indication */}
        {(() => {
          const rStatus = session?.reviewStatus;
          const isReviewing = rStatus === 'reviewing';
          const isDone = rStatus === 'done';

          let btnClass = "w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-emerald-600 flex items-center justify-center transition-all shrink-0 disabled:opacity-40";
          let tooltip = "Khảo sát đánh giá";

          if (isReviewing) {
            btnClass = "w-9 h-9 rounded-xl border border-amber-400 bg-amber-50 text-amber-600 ring-2 ring-amber-400/30 animate-pulse flex items-center justify-center transition-all shrink-0";
            tooltip = "Khách hàng đang thực hiện đánh giá...";
          } else if (isDone) {
            btnClass = "w-9 h-9 rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-600 ring-2 ring-emerald-400/30 flex items-center justify-center transition-all shrink-0";
            tooltip = "Khách hàng đã hoàn thành đánh giá";
          }

          return (
            <button 
              onClick={onReview}
              disabled={cart.length === 0}
              className={btnClass}
              title={tooltip}
            >
              <Smile className={`w-4 h-4 ${isReviewing ? 'animate-bounce' : ''}`} />
            </button>
          );
        })()}
        <button onClick={onCheckout} disabled={cart.length === 0}
          className="flex-1 min-w-[130px] px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm hover:bg-emerald-600 transition-colors shrink-0 whitespace-nowrap">
          <CreditCard className="w-4 h-4 shrink-0" /> <span className="whitespace-nowrap">{t('appointments.btn_checkout', 'Thanh toán')}</span>
        </button>
      </div>

      {editingItemIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-xs pointer-events-auto select-none" onClick={() => setEditingItemIdx(null)}>
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl transition-all select-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{t('pos.ticket.edit_details', 'Chỉnh sửa chi tiết')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{cart[editingItemIdx]?.name}</p>
              </div>
              <button onClick={() => setEditingItemIdx(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('pos.ticket.quantity', 'Số lượng')}</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => handleQtyChange(Math.max(1, (Number(editQty) || 1) - 1))} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-650 text-sm font-semibold">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input type="number" value={editQty} onChange={(e) => handleQtyChange(e.target.value)} className="flex-1 text-center h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                  <button type="button" onClick={() => handleQtyChange((Number(editQty) || 1) + 1)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-650 text-sm font-semibold">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('pos.ticket.unit_selling_price', 'Đơn giá bán (VND)')}</label>
                  <input type="number" value={editPrice} onChange={(e) => handlePriceChange(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('pos.ticket.discount', 'Giảm giá')}</label>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white px-3 py-1 w-full h-10 shadow-sm focus-within:border-emerald-500 transition-all">
                    <input type="number" value={editDiscount} onChange={(e) => handleDiscountChange(e.target.value)} className="bg-transparent border-none outline-none text-sm font-medium text-emerald-600 w-full text-right focus:ring-0 focus:outline-none pr-1.5 placeholder:text-slate-400" />
                    <div className="relative flex items-center shrink-0 pr-1 pl-1.5 border-l border-slate-100">
                      <select 
                        value={editDiscountType}
                        onChange={(e) => handleSwitchDiscountType(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs font-bold text-slate-500 cursor-pointer focus:ring-0 focus:outline-none appearance-none pr-3 select-none"
                        style={{ background: 'none' }}
                      >
                        <option value="vnd">đ</option>
                        <option value="percent">%</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('pos.ticket.assign_staff', 'Nhân viên thực hiện / KTV')}</label>
                <StaffAssignPicker staff={staff} value={editStaffId} isRequested={editIsRequested} onChange={(sid, name, req) => {
                  setEditStaffId(sid);
                  setEditStaffName(name);
                  setEditIsRequested(req);
                }} placeholder={t('pos.ticket.select_staff_placeholder', 'Chọn nhân viên phục vụ...')} color="emerald-500" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setEditingItemIdx(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors font-semibold text-sm text-slate-600">{t('common.cancel', 'Hủy')}</button>
              <button type="button" onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-sm hover:bg-emerald-600 transition-colors">{t('appointments.btn_confirm', 'Xác nhận')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Promos & Vouchers Modal */}
      {promoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-xs pointer-events-auto select-none" onClick={() => setPromoModalOpen(false)}>
          <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-y-auto select-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800 font-sans flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-500" />
                {t('pos.ticket.promo_voucher_title', 'Khuyến mãi & Voucher')}
              </h2>
              <button onClick={() => setPromoModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-500 mb-1.5 text-[11px]">{t('pos.ticket.promotions_label', 'CHƯƠNG TRÌNH KHUYẾN MÃI (CTKM)')}</label>
                <select value={session.promo?.id || ''} onChange={(e) => handlePromoChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500 text-slate-700 bg-white">
                  <option value="">{t('pos.ticket.select_promo_placeholder', '— Chọn khuyến mãi —')}</option>
                  {getCustomerEligiblePromotions().map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1.5 text-[11px]">{t('pos.ticket.voucher_code_label', 'MÃ VOUCHER GIẢM GIÁ')}</label>
                <div className="flex gap-2">
                  <input type="text" value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)}
                    placeholder={t('appointments.voucher_input_placeholder', 'Nhập mã voucher...')}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none uppercase font-semibold text-slate-700 w-full focus:border-emerald-500" />
                  {session.voucher ? (
                    <button onClick={handleRemoveVoucher} className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors shrink-0">{t('common.cancel', 'Hủy')}</button>
                  ) : (
                    <button onClick={handleApplyVoucher} className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shrink-0">{t('common.apply', 'Áp dụng')}</button>
                  )}
                </div>
                {session.voucher && (
                  <div className="text-xs text-green-600 font-semibold mt-1.5 flex items-center gap-1">
                    ✓ Đã áp dụng: {session.voucher.name}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setPromoModalOpen(false)} className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-sm hover:bg-emerald-600 transition-colors">
                {t('common.done', 'Hoàn tất')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-xs pointer-events-auto select-none" onClick={() => setHistoryOpen(false)}>
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl transition-all max-h-[80vh] flex flex-col select-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-5 h-5 text-emerald-500" />
                {t('pos.ticket.history_title', 'Lịch sử thao tác đơn')}
              </h3>
              <button onClick={() => setHistoryOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
              {(() => {
                const logs = getNormalizedLogs(session).reverse();
                if (logs.length === 0) {
                  return <div className="text-center py-12 text-slate-400 text-sm">{t('pos.ticket.no_actions_performed', 'Chưa có thao tác nào được thực hiện')}</div>;
                }
                return (
                  <div className="relative pl-4 border-l border-slate-100 space-y-4">
                    {logs.map((log) => {
                      const logTime = new Date(log.time);
                      const timeStr = isNaN(logTime.getTime()) 
                        ? (log.time || '') 
                        : `${logTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ${logTime.toLocaleDateString('vi-VN')}`;
                      return (
                        <div key={log.id} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-50" />
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs text-slate-700">{log.action}</span>
                              <span className="text-[10px] text-slate-400 font-medium shrink-0">{timeStr}</span>
                            </div>
                            {log.details && <div className="text-xs text-slate-500 mt-0.5">{log.details}</div>}
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <span>{t('pos.ticket.performed_by_prefix', 'Người thực hiện:')}</span>
                              <span className="font-semibold text-slate-500">{log.user || t('nav.receptionist', 'Lễ tân')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <button onClick={() => setHistoryOpen(false)} className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 font-bold text-sm shrink-0">
              {t('common.close', 'Đóng')}
            </button>
          </div>
        </div>
      )}

      {/* Quick Staff Assign Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-xs pointer-events-auto select-none" onClick={() => setStaffModalOpen(false)}>
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl transition-all max-h-[85vh] flex flex-col select-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-5 h-5 text-emerald-500" />
                {t('pos.ticket.bulk_staff_assign', 'Xếp nhân viên hàng loạt')}
              </h3>
              <button onClick={() => setStaffModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">{t('pos.ticket.empty_cart', 'Giỏ hàng trống')}</div>
              ) : (
                Object.entries(groupCartItems(cart)).map(([type, entries]) => {
                  let label = getTypeLabel(type);
                  if (type.startsWith('packageGroup_')) {
                    label = `${t('pos.ticket.use_package', 'Dùng gói:')} ${type.replace('packageGroup_', '')}`;
                  } else if (type.startsWith('treatmentGroup_')) {
                    label = `${t('pos.ticket.use_treatment', 'Dùng liệu trình:')} ${type.replace('treatmentGroup_', '')}`;
                  }
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
                            <StaffAssignPicker staff={staff} value={x.staff_id} isRequested={x.is_customer_requested} onChange={(id, name, req) => updateCart(i, { staff_id: id, staff_name: name, is_customer_requested: req })} color="emerald-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={() => setStaffModalOpen(false)} className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-sm hover:bg-emerald-600 transition-colors shrink-0">
              {t('common.done', 'Hoàn tất')}
            </button>
          </div>
        </div>
      )}
      {/* History Modal is rendered above on line 1018 */}
      
      {/* Package Modal */}
      {showPackageModal && customer && (
        <PackageUsageModal 
          customerId={customer.id} 
          initialTreatmentId={initialTreatmentId}
          initialServices={initialTreatmentId ? (session.cart || []).filter(x => x.customer_treatment_id === initialTreatmentId) : []}
          onClose={() => {
            setShowPackageModal(false);
            setInitialTreatmentId(null);
          }}
          onSelect={(items) => {
            const filteredCart = (session.cart || []).filter(x => x.customer_treatment_id !== initialTreatmentId);
            onUpdate({ cart: [...filteredCart, ...items] });
            setShowPackageModal(false);
            setInitialTreatmentId(null);
          }}
        />
      )}

      {/* Edit Package Quantity Modal */}
      {editPackageType && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-xs pointer-events-auto select-none" onClick={() => setEditPackageType(null)}>
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl transition-all select-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{t('pos.ticket.edit_details', 'Chỉnh sửa chi tiết')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{editPackageType.replace('packageGroup_', '').replace('treatmentGroup_', '')}</p>
              </div>
              <button onClick={() => setEditPackageType(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('pos.ticket.quantity', 'Số lượng')}</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => {
                    const pName = editPackageType.replace('packageGroup_', '').replace('treatmentGroup_', '');
                    const sampleItem = cart.find(x => x.is_from_package && x.package_name === pName);
                    const currentQty = sampleItem?.qty || 1;
                    if (currentQty > 1) {
                      onUpdate({ cart: cart.map(x => (x.is_from_package && x.package_name === pName) ? { ...x, qty: currentQty - 1 } : x) });
                    }
                  }} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-650 text-sm font-semibold">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input type="number" readOnly value={cart.find(x => x.is_from_package && x.package_name === editPackageType.replace('packageGroup_', '').replace('treatmentGroup_', ''))?.qty || 1} className="flex-1 text-center h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
                  <button type="button" onClick={() => {
                    const pName = editPackageType.replace('packageGroup_', '').replace('treatmentGroup_', '');
                    const sampleItem = cart.find(x => x.is_from_package && x.package_name === pName);
                    const currentQty = sampleItem?.qty || 1;
                    onUpdate({ cart: cart.map(x => (x.is_from_package && x.package_name === pName) ? { ...x, qty: currentQty + 1 } : x) });
                  }} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-650 text-sm font-semibold">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-5 mt-5 border-t border-slate-100">
              <button onClick={() => setEditPackageType(null)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">
                {t('common.cancel', 'Hủy')}
              </button>
              <button onClick={() => setEditPackageType(null)} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-sm hover:bg-emerald-600 transition-colors">
                {t('appointments.btn_confirm', 'Xác nhận')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}