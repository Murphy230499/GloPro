'use client';
import React, { useEffect, useState } from 'react';
import { Plus, X, BarChart3, QrCode, CheckCircle2 } from 'lucide-react';
import { applyDiscountsToCart } from '@/utils/promos';
import { useRouter, useSearchParams } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { todayStr, formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import { loadCustomerTiers } from '@/utils/loyaltyFallbacks';
import CatalogColumn from '@/components/pos/CatalogColumn';

const getCurrentUser = () => {
  try {
    const local = localStorage.getItem('user');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.name) return parsed.name;
    }
  } catch (e) {}
  return 'Lễ tân';
};
import TicketColumn from '@/components/pos/TicketColumn';
import CheckoutModal from '@/components/pos/CheckoutModal';
import NewCustomerModal from '@/components/pos/NewCustomerModal';
import EmptyCart from '@/components/pos/EmptyCart';
import Avatar from '@/components/Avatar';

let seqCounter = 1;

const newSession = () => {
  const seq = seqCounter++;
  return {
    id: Date.now().toString() + seq,
    saleCode: 'SC' + String(Math.floor(100000 + Math.random() * 900000)),
    seqNum: seq,
    customer: null,
    cart: [],
    discount: 0,
    discountType: 'vnd',
    discountValue: 0,
    tip: 0,
    promo: null,
    voucher: null,
    logs: [
      {
        id: Date.now().toString(),
        action: 'Tạo đơn hàng',
        details: 'Khởi tạo đơn hàng mới',
        user: getCurrentUser(),
        time: new Date()
      }
    ],
    createdAt: new Date()
  };
};
const tabName = (s) => {
  if (s.customer) {
    const first = s.customer.name.split(' ').slice(-1)[0] || s.customer.name;
    return `${first}-${String(s.seqNum).padStart(3, '0')}`;
  }
  return `Walk-In-${String(s.seqNum).padStart(3, '0')}`;
};

export default function POS() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentBranchId } = useBranch();

  const clearSearchParams = (keys) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    keys.forEach(k => url.searchParams.delete(k));
    window.history.replaceState({}, '', url.pathname + url.search);
  };
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const editInvoiceId = searchParams.get('edit_invoice_id');

  const loadUnpaidInvoices = (selectId = null) => {
    const filter = currentBranchId === 'all' ? { status: 'unpaid' } : { branch_id: currentBranchId, status: 'unpaid' };
    return Promise.all([
      base44.entities.Invoice.filter(filter),
      base44.entities.Customer.list()
    ]).then(([data, cusList]) => {
      const cusMap = Object.fromEntries(cusList.map(c => [c.id, c]));
      const sorted = data.sort((a, b) => (a.invoice_code || '').localeCompare(b.invoice_code || ''));
      const mapped = sorted.map((inv, idx) => {
        const cObj = inv.customer_id ? cusMap[inv.customer_id] : null;
        return {
          id: inv.id,
          seqNum: idx + 1,
          saleCode: inv.invoice_code,
          customer: cObj ? { id: cObj.id, name: cObj.name, avatar_url: cObj.avatar_url, points: cObj.points, total_spent: cObj.total_spent } : null,
          cart: (inv.items || []).map(x => ({
            name: x.name,
            type: x.type,
            price: x.price,
            originalPrice: x.price,
            qty: x.qty || 1,
            staff_id: x.staff_id || '',
            staff_name: x.staff_name || '',
            balance: x.balance || 0,
            sessions: x.sessions || 10
          })),
          discountValue: inv.discount || 0,
          discountType: 'vnd',
          tip: inv.tip || 0,
          tipSplits: (inv.tip_splits || []).map(ts => ({ staffId: ts.staff_id, amount: ts.amount })),
          isRestoredFromInvoice: true,
          logs: []
        };
      });
      setSessions(mapped);
      if (selectId) {
        setActiveId(selectId);
      } else if (mapped.length > 0) {
        setActiveId(mapped[0].id);
      } else {
        setActiveId(null);
      }
    }).catch(err => {
      console.error('Lỗi khi tải hóa đơn treo:', err);
    });
  };

  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [serviceCombos, setServiceCombos] = useState([]);
  const [productCombos, setProductCombos] = useState([]);
  const [prepaidCards, setPrepaidCards] = useState([]);
  const [groups, setGroups] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalogTab, setCatalogTab] = useState('service');
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [custModal, setCustModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [customerTiers, setCustomerTiers] = useState([]);

  const loadData = () => {
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
      base44.entities.Service.filter(filter),
      base44.entities.Product.filter(filter),
      base44.entities.ServicePackage.filter(filter),
      base44.entities.Treatment.filter(filter),
      base44.entities.ServiceCombo.filter(filter),
      base44.entities.ProductCombo.filter(filter),
      base44.entities.PrepaidCard.filter(filter),
      base44.entities.ServiceGroup.filter(filter),
      base44.entities.Staff.filter(filter),
      base44.entities.Customer.list(),
      loadCustomerTiers()
    ]).then(([s, p, pk, t, sc, pc, gc, gr, st, c, ct]) => {
      setServices(s.filter((x) => x.is_active));
      setProducts(p.filter((x) => x.is_active));
      setPackages(pk.filter((x) => x.is_active));
      setTreatments(t.filter((x) => x.is_active));
      setServiceCombos(sc.filter((x) => x.is_active));
      setProductCombos(pc.filter((x) => x.is_active));
      setPrepaidCards(gc.filter((x) => x.is_active));
      setGroups(gr);
      setStaff(st);
      setCustomers(c);
      setCustomerTiers(ct);
    });
  };

  useEffect(() => {
    loadData();
    
    const buyAgainCustomerId = searchParams.get('buy_again_customer_id');
    const buyAgainName = searchParams.get('buy_again_name');
    const buyAgainType = searchParams.get('buy_again_type');
    const buyAgainPrice = parseFloat(searchParams.get('buy_again_price') || '0');

    if (buyAgainCustomerId && buyAgainName && buyAgainType) {
      Promise.all([
        base44.entities.Customer.list(),
        base44.entities.Invoice.list()
      ]).then(async ([cusList, allInvs]) => {
        const custObj = cusList.find(c => c && String(c.id) === String(buyAgainCustomerId));
        const saleCode = 'SC' + String(Math.floor(100000 + Math.random() * 900000));
        
        let dbType = buyAgainType;
        if (dbType !== 'service' && dbType !== 'product') {
          dbType = 'package';
        }

        try {
          const newInv = await base44.entities.Invoice.create({
            invoice_code: saleCode,
            customer_name: custObj?.name || 'Khách vãng lai',
            customer_id: buyAgainCustomerId,
            branch_id: (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId,
            items: [{
              name: buyAgainName,
              type: dbType,
              price: buyAgainPrice,
              qty: 1,
              staff_id: '',
              staff_name: ''
            }],
            subtotal: buyAgainPrice,
            discount: 0,
            total: buyAgainPrice,
            tip: 0,
            status: 'unpaid',
            date: todayStr()
          });

          await loadUnpaidInvoices(newInv.id);
          toast.success(`Đã tạo đơn mua lại cho khách ${custObj?.name || ''}`);
        } catch (e) {
          toast.error('Lỗi khi tạo hóa đơn mua lại: ' + (e.message || e));
          loadUnpaidInvoices();
        }

        // Clean query params
        clearSearchParams(['buy_again_customer_id', 'buy_again_name', 'buy_again_type', 'buy_again_price']);
      });
    } else {
      loadUnpaidInvoices(editInvoiceId).then(() => {
        if (editInvoiceId) {
          clearSearchParams(['edit_invoice_id']);
        }
      });
    }
  }, [currentBranchId]);

  useEffect(() => {
    const handleReload = () => {
      loadData();
      loadUnpaidInvoices(activeId);
    };
    window.addEventListener('reload-data', handleReload);
    return () => window.removeEventListener('reload-data', handleReload);
  }, [activeId]);

  const activeSession = sessions.find((s) => s.id === activeId);

  const patchSession = async (patch) => {
    let updatedSession = null;
    setSessions((arr) => arr.map((s) => {
      if (s.id !== activeId) return s;
      
      let logs = s.logs || [];
      const user = getCurrentUser();
      const time = new Date();
      const createEntry = (action, details) => ({ id: Math.random().toString(), action, details, user, time });

      // Detect customer changes
      if ('customer' in patch) {
        if (patch.customer) {
          logs = [...logs, createEntry('Chọn khách hàng', patch.customer.name)];
          // Find customer tier and auto apply discount
          const cust = patch.customer;
          const sortedTiers = [...customerTiers].sort((a, b) => b.min_spend - a.min_spend);
          const tier = sortedTiers.find(t => (cust.total_spent || 0) >= t.min_spend || (cust.points || 0) >= t.min_points);
          if (tier) {
            if (tier.discount_percent > 0) {
              patch.discountType = 'percent';
              patch.discountValue = tier.discount_percent;
            } else if (tier.discount_amount > 0) {
              patch.discountType = 'vnd';
              patch.discountValue = tier.discount_amount;
            }
          }
        } else if (s.customer) {
          logs = [...logs, createEntry('Bỏ chọn khách hàng', s.customer.name)];
          // Reset default discount
          patch.discountType = 'vnd';
          patch.discountValue = 0;
        }
      }

      // Detect discount changes
      if ('discount' in patch && patch.discount !== s.discount) {
        logs = [...logs, createEntry('Thay đổi giảm giá hóa đơn', `${formatVND(s.discount)} -> ${formatVND(patch.discount)}`)];
      }

      // Detect promo changes
      if ('promo' in patch) {
        if (patch.promo) {
          logs = [...logs, createEntry('Áp dụng CTKM', patch.promo.name)];
        } else if (s.promo) {
          logs = [...logs, createEntry('Hủy áp dụng CTKM', s.promo.name)];
        }
      }

      // Detect voucher changes
      if ('voucher' in patch) {
        if (patch.voucher) {
          logs = [...logs, createEntry('Áp dụng Voucher', patch.voucher.name)];
        } else if (s.voucher) {
          logs = [...logs, createEntry('Hủy áp dụng Voucher', s.voucher.name)];
        }
      }

      // Detect item deletion or cart edits
      if ('cart' in patch) {
        if (patch.cart.length > s.cart.length) {
          const added = patch.cart.find((x) => !s.cart.some((y) => y.name === x.name && y.type === x.type));
          if (added) {
            logs = [...logs, createEntry('Thêm vào giỏ hàng', `${added.name} (${added.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'})`)];
          } else {
            // Qty increased during add
            patch.cart.forEach((y) => {
              const x = s.cart.find((item) => item.name === y.name && item.type === y.type);
              if (x && y.qty > x.qty) {
                logs = [...logs, createEntry(`Tăng số lượng ${y.name}`, `${x.qty} -> ${y.qty}`)];
              }
            });
          }
        } else if (patch.cart.length < s.cart.length) {
          // Item removed
          const removed = s.cart.find((x) => !patch.cart.some((y) => y.name === x.name && y.type === x.type));
          if (removed) {
            logs = [...logs, createEntry('Xóa khỏi giỏ hàng', `${removed.name} (x${removed.qty})`)];
          }
        } else if (patch.cart.length === s.cart.length) {
          // Item qty or price updated
          s.cart.forEach((x, idx) => {
            const y = patch.cart[idx];
            if (y && (y.qty !== x.qty || y.price !== x.price || y.staff_id !== x.staff_id)) {
              const changes = [];
              if (y.qty !== x.qty) changes.push(`Số lượng: ${x.qty} -> ${y.qty}`);
              if (y.price !== x.price) changes.push(`Giá bán: ${formatVND(x.price)} -> ${formatVND(y.price)}`);
              if (y.staff_id !== x.staff_id) changes.push(`Nhên viên: ${x.staff_name || 'Chưa chọn'} -> ${y.staff_name || 'Chưa chọn'}`);
              logs = [...logs, createEntry(`Chỉnh sửa ${x.name}`, changes.join(', '))];
            }
          });
        }
      }

      const updated = { ...s, ...patch, logs };
      updatedSession = updated;
      return updated;
    }));

    // Async sync updated session data back to base44 database record
    if (updatedSession) {
      const cart = updatedSession.cart || [];
      const subtotal = cart.reduce((sum, x) => sum + (x.price || 0) * (x.qty || 1), 0);
      const discount = updatedSession.discountType === 'percent' ? Math.round(subtotal * ((updatedSession.discountValue || 0) / 100)) : (updatedSession.discountValue || 0);
      const total = Math.max(0, subtotal - discount) + updatedSession.tip;

      try {
        await base44.entities.Invoice.update(updatedSession.id, {
          invoice_code: updatedSession.saleCode || ('SC' + String(Math.floor(100000 + Math.random() * 900000))),
          customer_id: updatedSession.customer?.id || null,
          customer_name: (updatedSession.customer?.name && updatedSession.customer.name.trim()) ? updatedSession.customer.name.trim() : 'Khách vãng lai',
          items: cart.map((x) => {
            let dbType = x.type;
            if (dbType !== 'service' && dbType !== 'product') {
              dbType = 'package';
            }
            return { 
              name: x.name, 
              type: dbType, 
              price: Math.round(x.price || 0), 
              qty: Math.round(x.qty || 1), 
              staff_id: x.staff_id || '', 
              staff_name: x.staff_name || '',
              balance: Math.round(x.balance || 0),
              sessions: Math.round(x.sessions || 10)
            };
          }),
          subtotal,
          discount,
          total,
          tip: Math.round(updatedSession.tip || 0),
          tip_splits: (updatedSession.tipSplits || []).map(s => ({ staff_id: s.staffId, amount: Math.round(s.amount || 0) })),
        });
      } catch (err) {
        console.error('Failed to sync session updates to DB:', err);
      }
    }
  };

  const createSale = async () => {
    try {
      const saleCode = 'SC' + String(Math.floor(100000 + Math.random() * 900000));
      
      const newInv = await base44.entities.Invoice.create({
        invoice_code: saleCode,
        customer_name: 'Khách vãng lai',
        customer_id: null,
        branch_id: (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId,
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        tip: 0,
        status: 'unpaid',
        date: todayStr()
      });

      await loadUnpaidInvoices(newInv.id);
      toast.success(`Đã tạo đơn treo mới • ${saleCode}`);
    } catch (e) {
      toast.error('Lỗi khi tạo hóa đơn treo: ' + (e.message || e));
    }
  };

  const closeSession = (id) => {
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeId === id) setActiveId(remaining.length ? remaining[remaining.length - 1].id : null);
  };

  const addToCart = async (item, type) => {
    let session = activeSession;
    if (!session) {
      try {
        const allInvoices = await base44.entities.Invoice.list();
        const seq = allInvoices.length + 1;
        const saleCode = 'SC' + String(Math.floor(100000 + Math.random() * 900000));
        
        const newInv = await base44.entities.Invoice.create({
          invoice_code: saleCode,
          customer_name: 'Khách vãng lai',
          customer_id: null,
          branch_id: (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId,
          items: [{ 
            name: item.name, 
            type, 
            price: item.price, 
            qty: 1, 
            staff_id: '', 
            staff_name: '',
            balance: item.balance || item.face_value || 0,
            sessions: item.usage_count || item.sessions || 10,
            color: item.color
          }],
          subtotal: item.price,
          discount: 0,
          total: item.price,
          tip: 0,
          status: 'unpaid',
          date: todayStr()
        });

        await loadUnpaidInvoices(newInv.id);
        toast.success(`Đã tạo đơn treo mới • ${saleCode}`);
      } catch (e) {
        toast.error('Lỗi khi tạo hóa đơn treo: ' + (e.message || e));
      }
      return;
    }

    const cart = session.cart || [];
    const existing = cart.find((x) => x.name === item.name && x.type === type);
    const newCartWithoutDiscounts = existing ?
      cart.map((x) => x === existing ? { ...x, qty: (x.qty || 1) + 1 } : x) :
      [...cart, { 
        name: item.name, 
        type, 
        price: item.price, 
        originalPrice: item.price, 
        qty: 1, 
        staff_id: '', 
        staff_name: '',
        balance: item.balance || item.face_value || 0,
        sessions: item.usage_count || item.sessions || 10,
        color: item.color
      }];
    
    const newCart = applyDiscountsToCart(newCartWithoutDiscounts, session.promo, session.voucher);
    let discountType = 'vnd';
    let discountValue = 0;
    if (session.promo && session.promo.type === 'invoice') {
      discountType = session.promo.valueType === 'percent' ? 'percent' : 'vnd';
      discountValue = session.promo.value;
    } else if (session.voucher && session.voucher.type === 'invoice') {
      discountType = session.voucher.valueType === 'percent' ? 'percent' : 'vnd';
      discountValue = session.voucher.value;
    } else {
      discountType = session.discountType || 'vnd';
      discountValue = session.discountValue || 0;
    }
    
    patchSession({ cart: newCart, discountType, discountValue });
  };

  const createCustomer = async (data) => {
    const c = await base44.entities.Customer.create(data);
    setCustomers((arr) => [c, ...arr]);
    patchSession({ customer: c });
    setCustModal(false);
    toast.success('Đã thêm khách hàng');
  };

  const checkout = async ({ tip, discount, payments, tipSplits, sessionCustomer }) => {
    const session = activeSession;
    if (!session) return;
    if (!session.cart?.length) return toast.error('Giỏ hàng trống');
    
    const effectiveCustomer = sessionCustomer ?? session.customer;
    const hasMembershipItem = session.cart.some(item => item.type !== 'service' && item.type !== 'product');
    if (hasMembershipItem && (!effectiveCustomer || !effectiveCustomer.id)) {
      return toast.error('Vui lòng chọn khách hàng khi thanh toán gói dịch vụ, liệu trình hoặc thẻ tiền mặt');
    }
    
    setPaying(true);
    try {
      const cart = session.cart;
      const subtotal = Math.round(cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0));
      const total = Math.max(0, subtotal - Math.round(discount)) + Math.round(tip);
      const invoiceData = {
        invoice_code: session.saleCode || ('SC' + String(Math.floor(100000 + Math.random() * 900000))),
        customer_id: effectiveCustomer?.id || null,
        customer_name: (effectiveCustomer?.name && effectiveCustomer.name.trim()) ? effectiveCustomer.name.trim() : 'Khách vãng lai',
        branch_id: (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId,
        items: cart.map((x) => {
          let dbType = x.type;
          if (dbType !== 'service' && dbType !== 'product') {
            dbType = 'package';
          }
          return { 
            name: x.name, 
            type: dbType, 
            price: Math.round(x.price || 0), 
            qty: Math.round(x.qty || 1), 
            staff_id: x.staff_id || '', 
            staff_name: x.staff_name || '',
            balance: Math.round(x.balance || 0),
            sessions: Math.round(x.sessions || 10)
          };
        }),
        subtotal, 
        discount: Math.round(discount), 
        total: Math.round(total), 
        tip: Math.round(tip),
        tip_splits: (tipSplits || []).map(s => ({ staff_id: s.staffId, amount: Math.round(s.amount || 0) })),
        payment_methods: payments.map(p => ({ method: p.method, amount: Math.round(p.amount || 0) })), 
        status: 'paid', 
        date: todayStr()
      };

      let createdInv = null;
      if (session.isRestoredFromInvoice) {
        await base44.entities.Invoice.update(session.id, invoiceData);
      } else {
        createdInv = await base44.entities.Invoice.create(invoiceData);
      }
      if (effectiveCustomer && effectiveCustomer.id) {
        // Create purchased memberships
        for (const item of cart) {
          if (item.type !== 'service' && item.type !== 'product') {
            let memType = 'package';
            let defaultColor = '#3B82F6';
            if (item.type === 'cash_card' || item.name.toLowerCase().includes('thẻ') || item.name.toLowerCase().includes('card') || item.name.toLowerCase().includes('ví')) {
              memType = 'cash_card';
              defaultColor = '#FF6B9D';
            } else if (item.type === 'treatment' || item.name.toLowerCase().includes('liệu trình') || item.name.toLowerCase().includes('trị mụn') || item.name.toLowerCase().includes('buổi')) {
              memType = 'treatment_course';
              defaultColor = '#10B981';
            }
            
            let itemColor = item.color;
            let expiryMonths = item.expiry_months || 0;
            let expiryDays = item.expiry_days || 0;
            const matchedCatalog = (prepaidCards || []).find(c => c.name === item.name) || 
                                   (packages || []).find(p => p.name === item.name) || 
                                   (treatments || []).find(t => t.name === item.name);
            if (matchedCatalog) {
              if (!itemColor && matchedCatalog.color) {
                itemColor = matchedCatalog.color;
              }
              if (!expiryMonths && matchedCatalog.expiry_months) {
                expiryMonths = matchedCatalog.expiry_months;
              }
              if (!expiryDays && matchedCatalog.expiry_days) {
                expiryDays = matchedCatalog.expiry_days;
              }
            }

            let expiryDate = null;
            if (expiryMonths > 0 || expiryDays > 0) {
              const d = new Date();
              if (expiryMonths > 0) d.setMonth(d.getMonth() + expiryMonths);
              if (expiryDays > 0) d.setDate(d.getDate() + expiryDays);
              expiryDate = d.toISOString().slice(0, 10);
            }

            await base44.entities.Membership.create({
              customer_id: effectiveCustomer.id,
              customer_name: effectiveCustomer.name || 'Khách hàng',
              branch_id: (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId,
              name: item.name,
              type: memType,
              balance: Math.round(item.balance || item.price * 1.1 || 2000000),
              total_sessions: Math.round(item.sessions || 10),
              sessions_remaining: Math.round(item.sessions || 10),
              is_active: true,
              purchased_date: todayStr(),
              expiry_date: expiryDate,
              color: itemColor || defaultColor,
              invoice_id: createdInv?.id || session.id || null,
              invoice_code: invoiceData.invoice_code || session.saleCode || null,
              status: 'active',
              is_deleted: false
            });
          }
        }

        const newPoints = Math.floor(total / 10000);
        await base44.entities.Customer.update(effectiveCustomer.id, {
          total_spent: Number(effectiveCustomer.total_spent || 0) + total,
          points: Math.max(0, Number(effectiveCustomer.points || 0) + newPoints),
          visit_count: Number(effectiveCustomer.visit_count || 0) + 1,
          last_visit: todayStr()
        });

        // Record promo usage if session.promo or session.voucher is applied
        if (session.promo || session.voucher) {
          try {
            const localUsages = localStorage.getItem('glopro_promo_usages');
            const usages = localUsages ? JSON.parse(localUsages) : [];
            const discountAmt = Math.round(discount);

            if (session.promo) {
              const newUsage = {
                id: 'usage_' + Date.now() + Math.random().toString(36).substr(2, 5),
                customer_id: effectiveCustomer.id,
                customer_name: effectiveCustomer.name || 'Khách hàng',
                invoice_id: createdInv?.id || session.id || 'inv_temp_' + Date.now(),
                invoice_code: invoiceData.invoice_code || session.saleCode || 'INV-' + Date.now(),
                campaign_id: session.promo.id,
                campaign_name: session.promo.name,
                discount_amount: discountAmt,
                invoice_total: Math.round(total),
                date: todayStr()
              };
              usages.push(newUsage);
            }

            if (session.voucher) {
              const newUsage = {
                id: 'usage_' + Date.now() + Math.random().toString(36).substr(2, 5),
                customer_id: effectiveCustomer.id,
                customer_name: effectiveCustomer.name || 'Khách hàng',
                invoice_id: createdInv?.id || session.id || 'inv_temp_' + Date.now(),
                invoice_code: invoiceData.invoice_code || session.saleCode || 'INV-' + Date.now(),
                campaign_id: session.voucher.code,
                campaign_name: session.voucher.name || session.voucher.code,
                discount_amount: session.promo ? 0 : discountAmt,
                invoice_total: Math.round(total),
                date: todayStr()
              };
              usages.push(newUsage);
            }

            localStorage.setItem('glopro_promo_usages', JSON.stringify(usages));
          } catch (pe) {
            console.error('Error recording promo/voucher usage:', pe);
          }
        }
      }
      toast.success(`Thanh toán thành công • ${session.saleCode}`);
      closeSession(session.id);
      setCheckoutOpen(false);
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
    setPaying(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] md:h-[calc(100vh-130px)] overflow-hidden space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Thu ngân</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/invoices')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <BarChart3 className="w-4 h-4" /> Danh sách hoá đơn
          </button>
          <button onClick={createSale} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm shadow-sm">
            <Plus className="w-4 h-4" /> Tạo đơn
          </button>
        </div>
      </div>

      {/* Session tabs */}
      {sessions.length > 0 &&
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
          {sessions.map((s) =>
        <button key={s.id} onClick={() => setActiveId(s.id)}
        className={`flex items-center gap-2 pl-3 pr-1.5 py-2 rounded-t-xl border-b-2 text-sm whitespace-nowrap transition-colors ${s.id === activeId ? 'bg-white border-primary font-semibold text-slate-800' : 'bg-slate-100/70 border-transparent text-slate-500'}`}>
              {s.customer ?
          <Avatar src={s.customer.avatar_url} name={s.customer.name} size={20} color="#E879A9" /> :

          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">W</div>
          }
              <span>{tabName(s)}</span>
              <span onClick={(e) => {e.stopPropagation();closeSession(s.id);}} className="ml-1 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10">
                <X className="w-3 h-3" />
              </span>
            </button>
        )}
        </div>
      }

      {/* Split layout */}
      <div className="grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <CatalogColumn tab={catalogTab} setTab={setCatalogTab} search={search} setSearch={setSearch}
        services={services} products={products} packages={packages} treatments={treatments}
        serviceCombos={serviceCombos} productCombos={productCombos} prepaidCards={prepaidCards}
        groups={groups} onAddItem={addToCart} onReload={loadData} activeSession={activeSession} />
        {activeSession ?
        <TicketColumn session={activeSession} staff={staff} customers={customers}
        onUpdate={patchSession}
        onPickCustomer={(c) => patchSession({ customer: c })}
        onClearCustomer={() => patchSession({ customer: null })}
        onNewCustomer={() => setCustModal(true)}
        onCheckout={() => setCheckoutOpen(true)}
        onCancel={async () => {
          const session = activeSession;
          if (!session) return;
          if (!confirm('Bạn có chắc chắn muốn huỷ hoá đơn treo này? Hoá đơn sẽ được đưa vào danh sách đã huỷ.')) return;
          try {
            await base44.entities.Invoice.update(session.id, { status: 'cancelled', previous_status: 'unpaid' });
            toast.success('Đã huỷ hoá đơn treo');
            closeSession(session.id);
          } catch (e) {
            toast.error('Lỗi: ' + (e.message || e));
          }
        }}
        onReview={() => setReviewModalOpen(true)}
        disabled={currentBranchId === 'all'} /> :

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center">
            <EmptyCart />
          </div>
        }
      </div>

      <CheckoutModal open={checkoutOpen} session={activeSession} staff={staff} onClose={() => setCheckoutOpen(false)}
      onConfirm={checkout} paying={paying} />
      {custModal && <NewCustomerModal onClose={() => setCustModal(false)} onCreate={createCustomer} />}
      {reviewModalOpen && activeSession && (
        <ReviewQRModal 
          open={reviewModalOpen} 
          session={activeSession} 
          onClose={() => setReviewModalOpen(false)} 
          patchSession={patchSession}
        />
      )}
    </div>);
}

const EMOJIS = [
  { score: 1, label: 'Quá thất vọng', icon: '😡' },
  { score: 2, label: 'Thất vọng', icon: '🙁' },
  { score: 3, label: 'Bình thường', icon: '😐' },
  { score: 4, label: 'Hài lòng', icon: '🙂' },
  { score: 5, label: 'Rất hài lòng', icon: '🥰' },
];

function ReviewQRModal({ open, session, onClose, patchSession }) {
  const [reviewStep, setReviewStep] = useState('waiting'); // 'waiting', 'done'
  const [reviewData, setReviewData] = useState(null);

  useEffect(() => {
    if (!open || !session) return;
    
    const key = `glopro_review_${session.id}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        setReviewData(parsed);
        setReviewStep('done');
      } catch (e) {}
    } else {
      setReviewStep('waiting');
      setReviewData(null);
    }

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          setReviewData(data);
          setReviewStep('done');
          toast.success('Khách hàng đã hoàn thành đánh giá!');
          
          if (data.tip !== undefined) {
            const staffIds = [];
            (session.cart || []).forEach(x => {
              if (x.staff_id && !staffIds.includes(x.staff_id)) {
                staffIds.push(x.staff_id);
              }
            });
            if (staffIds.length > 0) {
              const splitAmt = Math.round(data.tip / staffIds.length);
              const splits = staffIds.map(sid => ({
                staffId: sid,
                amount: splitAmt
              }));
              patchSession({
                tip: data.tip,
                tipSplits: splits
              });
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [open, session?.id]);

  const reviewUrl = `${window.location.origin}/review/${session.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="relative bg-white w-full max-w-sm rounded-3xl border border-slate-100 shadow-2xl p-6 text-center space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 -mt-2">
          <span className="text-sm font-bold text-slate-800">Khảo sát ý kiến khách hàng</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-650">
            <X className="w-4 h-4" />
          </button>
        </div>

        {reviewStep === 'waiting' ? (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">Quét mã QR để đánh giá</h3>
              <p className="text-[11px] text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                Khách hàng quét mã QR này bằng điện thoại để đánh giá chất lượng phục vụ và tùy chọn gửi tiền tip.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl inline-block shadow-xs">
              <QrCode className="w-44 h-44 text-slate-700 mx-auto" />
            </div>

            {/* Simulated trigger button for web-browser testing */}
            <div>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-colors inline-flex items-center gap-1.5"
              >
                Giả lập quét QR (Mở Tab mới)
              </a>
            </div>

            {/* Loading processing indicator */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
              <span>Đang chờ khách hàng phản hồi...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto text-green-500 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">Đánh giá hoàn tất!</h3>
              <p className="text-xs text-slate-400">Khách hàng đã gửi phản hồi thành công chất lượng phục vụ.</p>
            </div>

            {reviewData && (
              <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs text-slate-600 space-y-2 border border-slate-100">
                <div className="font-bold text-slate-700 pb-1 border-b border-slate-200">Kết quả đánh giá:</div>
                {Object.entries(reviewData.ratings || {}).map(([sid, score]) => {
                  const ratingEmoji = EMOJIS.find(e => e.score === score)?.icon || '⭐';
                  const ratingLabel = EMOJIS.find(e => e.score === score)?.label || '—';
                  const staffName = (session.cart || []).find(x => x.staff_id === sid)?.staff_name || 'KTV';
                  return (
                    <div key={sid} className="flex justify-between">
                      <span>{staffName}:</span>
                      <span className="font-bold text-slate-700">{ratingEmoji} ({ratingLabel})</span>
                    </div>
                  );
                })}
                {reviewData.tip > 0 && (
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-primary font-bold">
                    <span>Thưởng thêm Tip:</span>
                    <span>{formatVND(reviewData.tip)}</span>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={onClose} 
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-colors shadow-sm"
            >
              Đóng và tiếp tục
            </button>
          </div>
        )}
      </div>
    </div>
  );

}