'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Menu } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { todayStr } from '@/lib/format';
import { toast } from '@/components/Layout';
import CatalogColumn from '@/components/pos/CatalogColumn';
import TicketColumn from '@/components/pos/TicketColumn';
import CheckoutModal from '@/components/pos/CheckoutModal';
import NewCustomerModal from '@/components/pos/NewCustomerModal';
import { useBranch } from '@/lib/BranchContext';
import { getNormalizedLogs, createLogEntry } from '@/lib/logHelper';
import { createIncomeVoucher } from '@/lib/cashFlowHelper';
import { useT } from '@/lib/i18n';

export default function POSInvoiceModal({
  open, customer, initialCart = [], existingInvoice = null, appointmentId = null, onClose, onSaved }) {
  const { t } = useT();
  const { currentBranchId, branches } = useBranch();
  // POS tab and search states
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const [catalogTab, setCatalogTab] = useState('service');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [custModal, setCustModal] = useState(false);
  const [custQuery, setCustQuery] = useState('');
  const [paying, setPaying] = useState(false);

  // Database lists
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

  // Session state (equivalent to cashier active session)
  const [session, setSession] = useState(null);

  const loadData = () => {
    const filter = (currentBranchId && currentBranchId !== 'all') ? { branch_id: currentBranchId } : {};

    const safeFilter = (entityName, query) => {
      return base44.entities[entityName].filter(query).catch(err => {
        if (err?.message?.includes('branch_id does not exist') || err?.code === '42703') {
          return base44.entities[entityName].list();
        }
        console.warn(`[POS] Failed to fetch ${entityName}:`, err);
        return [];
      });
    };

    Promise.all([
      safeFilter('Service', filter),
      safeFilter('Product', filter),
      safeFilter('ServicePackage', filter),
      safeFilter('Treatment', filter),
      safeFilter('ServiceCombo', filter),
      safeFilter('ProductCombo', filter),
      safeFilter('PrepaidCard', filter),
      base44.entities.ServiceGroup.list().catch(() => []),
      safeFilter('Staff', filter),
      base44.entities.Customer.list().catch(() => [])
    ]).then(([s, p, pk, t, sc, pc, gc, gr, st, c]) => {
      setServices(s.filter(x => x.is_active));
      setProducts(p.filter(x => x.is_active));
      setPackages(pk.filter(x => x.is_active));
      setTreatments(t.filter(x => x.is_active));
      setServiceCombos(sc.filter(x => x.is_active));
      setProductCombos(pc.filter(x => x.is_active));
      setPrepaidCards(gc.filter(x => x.is_active));
      setGroups(gr);
      setStaff(st.filter(x => x.is_active));
      setCustomers(c);

      const allCatalog = [...s, ...p, ...pk, ...t, ...sc, ...pc, ...gc];
      setSession(prev => {
        if (!prev) return null;
        const fullCust = (existingInvoice && existingInvoice.customer_id)
          ? c.find(item => item && String(item.id) === String(existingInvoice.customer_id))
          : null;
        
        const enrichedCart = (prev.cart || []).map(cartItem => {
          const match = allCatalog.find(cat => cat && (cat.name === cartItem.name || String(cat.id) === String(cartItem.id)));
          return {
            ...cartItem,
            image_url: cartItem.image_url || (match ? (match.image_url || match.image || '') : ''),
            color: cartItem.color || (match ? (match.color || '') : '')
          };
        });
        return {
          ...prev,
          cart: enrichedCart,
          customer: fullCust || prev.customer
        };
      });
    }).catch(err => {
      console.error(t('pos.invoice.error_catalog', 'Lỗi tải danh mục POS:'), err);
    });
  };

  useEffect(() => {
    if (!open) {
      setSession(null);
      return;
    }

    const initSession = async () => {
      loadData();
      
      const mapCartItem = item => ({
        id: item.id || Math.random().toString(),
        name: item.name,
        type: item.type || 'service',
        price: item.price,
        originalPrice: item.price,
        qty: item.qty || 1,
        staff_id: item.staff_id || '',
        staff_name: item.staff_name || '',
        color: item.color || '',
        image_url: item.image_url || item.image || '',
        duration_minutes: item.duration_minutes || item.duration || 0
      });

      if (existingInvoice) {
        const mappedCart = (existingInvoice.items || []).map(mapCartItem);
        let resolvedCustomer = customer;
        if (!resolvedCustomer && existingInvoice) {
          if (existingInvoice.customer_name && existingInvoice.customer_name !== t('invoices.walk_in', 'Khách vãng lai')) {
            resolvedCustomer = { name: existingInvoice.customer_name, id: existingInvoice.customer_id || null };
          } else {
            resolvedCustomer = null;
          }
        }

        setSession({
          id: existingInvoice.id,
          saleCode: existingInvoice.invoice_code || ('SC' + String(Math.floor(100000 + Math.random() * 900000))),
          customer: resolvedCustomer,
          cart: mappedCart,
          discount: existingInvoice.discount_amount || existingInvoice.discount || 0,
          discountType: existingInvoice.discount_type || 'vnd',
          discountValue: existingInvoice.discount_amount || existingInvoice.discount || 0,
          tip: existingInvoice.tip || 0,
          tipSplits: (existingInvoice.tip_splits || []).map(ts => ({ staffId: ts.staff_id, amount: ts.amount })),
          createdAt: existingInvoice.date ? new Date(existingInvoice.date) : new Date(),
          logs: getNormalizedLogs(existingInvoice)
        });

        if (existingInvoice.appointment_id) {
          base44.entities.Deposit.filter({ appointment_id: existingInvoice.appointment_id }).then(deps => {
            if (deps && deps.length > 0) setSession(prev => ({ ...prev, deposit: deps[0] }));
          });
        }
        return;
      }
      
      const saleCode = 'SC' + String(Math.floor(100000 + Math.random() * 900000));
      let resolvedBranchId = (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId;
      if (!resolvedBranchId && branches && branches.length > 0) {
        resolvedBranchId = branches[0].id;
      }

      const initialCartMapped = (initialCart || []).map(mapCartItem);
      const subtotal = Math.round(initialCartMapped.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0));
      
      const initialLog = {
        id: 'log_create_' + Date.now(),
        action: `Tạo hoá đơn #${saleCode}`,
        details: `Khởi tạo hoá đơn cho ${customer?.name || t('invoices.walk_in', 'Khách vãng lai')}`,
        time: new Date().toISOString(),
        user: t('pos.invoice.receptionist', 'Lễ tân')
      };

      try {
        const createdInvoice = await base44.entities.Invoice.create({
          invoice_code: saleCode,
          customer_name: customer?.name || '',
          customer_id: customer?.id || null,
          branch_id: resolvedBranchId,
          items: initialCartMapped.map((x) => ({
            name: x.name,
            type: x.type === 'service' || x.type === 'product' ? x.type : 'package',
            price: Math.round(x.price || 0),
            qty: Math.round(x.qty || 1),
            staff_id: x.staff_id || '',
            staff_name: x.staff_name || '',
            balance: Math.round(x.balance || 0),
            sessions: Math.round(x.sessions || 10),
            image_url: x.image_url || x.image || '',
            color: x.color || ''
          })),
          subtotal,
          discount: 0,
          total: subtotal,
          tip: 0,
          status: 'unpaid',
          date: todayStr(),
          logs: [initialLog]
        });

        setSession({
          id: createdInvoice.id,
          saleCode,
          customer,
          cart: initialCartMapped,
          discount: 0,
          discountType: 'vnd',
          discountValue: 0,
          tip: 0,
          createdAt: new Date(),
          logs: [initialLog]
        });
      } catch (e) {
        console.error('Error creating unpaid invoice:', e);
        setSession({
          id: 'direct_pos_' + Date.now(),
          saleCode,
          customer,
          cart: initialCartMapped,
          discount: 0,
          discountType: 'vnd',
          discountValue: 0,
          tip: 0,
          createdAt: new Date(),
          logs: [initialLog]
        });
      }
    };

    initSession();
  }, [open]);

  // Sync changes to unpaid invoice in DB
  useEffect(() => {
    if (session && session.id && !session.id.toString().startsWith('direct_pos_')) {
      const syncInvoiceToDb = async () => {
        try {
          const subtotal = Math.round((session.cart || []).reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0));
          const discount = Math.round(session.discount || 0);
          const total = Math.max(0, subtotal - discount) + Math.round(session.tip || 0);

          await base44.entities.Invoice.update(session.id, {
            customer_name: session.customer?.name || t('invoices.walk_in', 'Khách vãng lai'),
            customer_id: session.customer?.id || null,
            items: (session.cart || []).map(x => ({
              name: x.name,
              type: x.type === 'service' || x.type === 'product' ? x.type : 'package',
              price: Math.round(x.price || 0),
              qty: Math.round(x.qty || 1),
              staff_id: x.staff_id || '',
              staff_name: x.staff_name || '',
              balance: Math.round(x.balance || 0),
              sessions: Math.round(x.sessions || 10),
              image_url: x.image_url || x.image || '',
              color: x.color || ''
            })),
            subtotal,
            discount,
            total,
            tip: Math.round(session.tip || 0),
            tip_splits: (session.tipSplits || []).map(s => ({ staff_id: s.staffId, amount: Math.round(s.amount || 0) })),
            logs: JSON.stringify(getNormalizedLogs(session))
          });
        } catch (e) {
          console.error('Error syncing invoice to db:', e);
        }
      };

      syncInvoiceToDb();
    }
  }, [
    session?.cart, 
    session?.customer, 
    session?.discountValue, 
    session?.discountType, 
    session?.discount,
    session?.tip, 
    session?.tipSplits,
    session?.logs
  ]);

  if (!open) return null;

  if (!session) {
    const loadingContent = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-3 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200 pointer-events-auto select-none">
        <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-4 shadow-2xl">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-700">{t('pos.invoice.loading', 'Đang khởi tạo hoá đơn...')}</p>
        </div>
      </div>
    );
    return typeof document !== 'undefined' ? createPortal(loadingContent, document.body) : loadingContent;
  }

  // Handle updates from TicketColumn
  const handleUpdateSession = (patch) => {
    setSession(prev => {
      if (!prev) return null;
      let logs = getNormalizedLogs(prev);

      if (patch.customer !== undefined && patch.customer !== prev.customer) {
        if (patch.customer) {
          logs = [...logs, createLogEntry(t('pos.invoice.select_customer', 'Chọn khách hàng'), patch.customer.name, t('pos.invoice.receptionist', 'Lễ tân'))];
        } else if (prev.customer) {
          logs = [...logs, createLogEntry(t('pos.invoice.deselect_customer', 'Bỏ chọn khách hàng'), prev.customer.name, t('pos.invoice.receptionist', 'Lễ tân'))];
        }
      }

      if (patch.discountValue !== undefined && patch.discountValue !== prev.discountValue) {
        logs = [...logs, createLogEntry(t('pos.invoice.change_discount', 'Thay đổi giảm giá hóa đơn'), `Mức giảm: ${patch.discountValue}`, t('pos.invoice.receptionist', 'Lễ tân'))];
      }

      if (patch.cart !== undefined) {
        const oldCart = prev.cart || [];
        const newCart = patch.cart || [];
        if (newCart.length > oldCart.length) {
          const added = newCart[newCart.length - 1];
          if (added) {
            logs = [...logs, createLogEntry(t('pos.invoice.add_to_cart', 'Thêm vào giỏ hàng'), `${added.name} (${added.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'})`, t('pos.invoice.receptionist', 'Lễ tân'))];
          }
        } else if (newCart.length < oldCart.length) {
          const removed = oldCart.find((x) => !newCart.some((y) => y.id === x.id || (y.name === x.name && y.type === x.type)));
          if (removed) {
            logs = [...logs, createLogEntry(t('pos.invoice.remove_from_cart', 'Xóa khỏi giỏ hàng'), `${removed.name} (x${removed.qty})`, t('pos.invoice.receptionist', 'Lễ tân'))];
          }
        } else {
          newCart.forEach((item, idx) => {
            const oldItem = oldCart[idx];
            if (oldItem && oldItem.qty !== item.qty) {
              logs = [...logs, createLogEntry(`Thay đổi số lượng ${item.name}`, `${oldItem.qty} -> ${item.qty}`, t('pos.invoice.receptionist', 'Lễ tân'))];
            }
            if (oldItem && oldItem.staff_id !== item.staff_id) {
              logs = [...logs, createLogEntry(`Phân công nhân viên ${item.name}`, item.staff_name || t('pos.invoice.receptionist', 'Lễ tân'), t('pos.invoice.receptionist', 'Lễ tân'))];
            }
          });
        }
      }

      const merged = { ...prev, ...patch, logs };
      const subtotal = (merged.cart || []).reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
      const discount = merged.discountType === 'percent'
        ? Math.round(subtotal * ((merged.discountValue || 0) / 100))
        : (merged.discountValue || 0);
      return {
        ...merged,
        discount
      };
    });
  };

  // Handle adding items from CatalogColumn
  const handleAddItem = (item, type) => {
    const cart = session.cart || [];
    const existing = cart.find(x => x.id === item.id || (x.name === item.name && x.type === type));
    if (existing) {
      handleUpdateSession({
        cart: cart.map(x => (x.id === existing.id || (x.name === existing.name && x.type === type))
          ? { ...x, qty: x.qty + 1 }
          : x
        )
      });
    } else {
      handleUpdateSession({
        cart: [...cart, {
          id: item.id || Math.random().toString(),
          name: item.name,
          type: type, // 'service', 'product', etc.
          price: item.price,
          originalPrice: item.price,
          qty: 1,
          staff_id: '',
          staff_name: '',
          balance: item.balance || item.face_value || 0,
          sessions: item.usage_count || item.sessions || 10,
          color: item.color,
          duration_minutes: item.duration_minutes || item.duration || 0,
          image_url: item.image_url || item.image || ''
        }]
      });
    }
  };

  // Submit invoice checkout
  const handleCheckout = async ({ tip, discount, payments, tipSplits }) => {
    const cart = session.cart || [];
    const hasMembershipItem = cart.some(item => item.type !== 'service' && item.type !== 'product');
    if (hasMembershipItem && (!session.customer || !session.customer.id)) {
      return toast.error(t('pos.invoice.error_require_customer', 'Vui lòng chọn khách hàng khi thanh toán gói dịch vụ, liệu trình hoặc thẻ tiền mặt'));
    }

    setPaying(true);
    try {
      const subtotal = Math.round(cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0));
      const total = Math.max(0, subtotal - Math.round(discount)) + Math.round(tip);

      let resolvedBranchId = (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId;
      if (!resolvedBranchId && branches && branches.length > 0) {
        resolvedBranchId = branches[0].id;
      }

      const invoiceData = {
        invoice_code: session.saleCode,
        customer_name: session.customer?.name || t('invoices.walk_in', 'Khách vãng lai'),
        customer_id: session.customer?.id || null,
        branch_id: resolvedBranchId,
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

      let createdInv;
      if (session.id && !session.id.toString().startsWith('direct_pos_')) {
        await base44.entities.Invoice.update(session.id, invoiceData);
        createdInv = { id: session.id };
      } else {
        createdInv = await base44.entities.Invoice.create(invoiceData);
      }

      if (session.customer && session.customer.id) {
        // Create purchased memberships
        for (const item of cart) {
          if (item.type !== 'service' && item.type !== 'product') {
            let memType = 'package';
            let defaultColor = '#3B82F6';
            if (item.name.toLowerCase().includes('thẻ') || item.name.toLowerCase().includes('card') || item.name.toLowerCase().includes('ví')) {
              memType = 'cash_card';
              defaultColor = '#FF6B9D';
            } else if (item.name.toLowerCase().includes('liệu trình') || item.name.toLowerCase().includes('trị mụn') || item.name.toLowerCase().includes('buổi')) {
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
              customer_id: session.customer.id,
              customer_name: session.customer.name || 'Khách hàng',
              branch_id: resolvedBranchId,
              name: item.name,
              type: memType,
              balance: Math.round(item.balance || item.price * 1.1 || 2000000),
              total_sessions: Math.round(item.sessions || 10),
              sessions_remaining: Math.round(item.sessions || 10),
              is_active: true,
              purchased_date: todayStr(),
              expiry_date: expiryDate,
              color: itemColor || defaultColor,
              invoice_id: createdInv?.id || null,
              invoice_code: invoiceData.invoice_code || null,
              status: 'active',
              is_deleted: false
            });
          }
        }

        const earnedPoints = Math.floor(total / 10000);
        await base44.entities.Customer.update(session.customer.id, {
          total_spent: Number(session.customer.total_spent || 0) + total,
          points: Math.max(0, Number(session.customer.points || 0) + earnedPoints),
          visit_count: Number(session.customer.visit_count || 0) + 1,
          last_visit: todayStr()
        });
      }

      // ── Auto cash flow: Phiếu Thu ───────────────────────────────────────
      try {
        const invCode = invoiceData.invoice_code || session.saleCode;
        const primaryMethod = (payments?.[0]?.method) || 'cash';
        
        let depositPaid = 0;
        if (session.deposit && session.deposit.id) {
          depositPaid = session.deposit.paid_amount || 0;
          try {
            await base44.entities.Deposit.update(session.deposit.id, { status: 'applied' });
            await base44.entities.DepositTransaction.create({
              deposit_id: session.deposit.id,
              action: 'applied',
              amount: depositPaid,
              notes: `Áp dụng cho hoá đơn #${invCode}`
            });
          } catch (e) {
            console.warn('[Deposit] Auto apply deposit failed:', e.message);
          }
        }

        const saleAmount = Math.max(0, subtotal - Math.round(discount) - depositPaid);
        const hasMembership = cart.some(x => x.type !== 'service' && x.type !== 'product');
        if (saleAmount > 0) {
          await createIncomeVoucher({
            typeCode: hasMembership ? 'membership_sale' : 'sale',
            typeName: hasMembership ? t('pos.invoice.sell_package', 'Bán gói / Thẻ') : t('pos.invoice.sell_service', 'Bán hàng / Dịch vụ'),
            amount: saleAmount,
            description: `Thanh toán hoá đơn #${invCode}`,
            paymentMethod: primaryMethod,
            refId: createdInv?.id,
            refCode: invCode,
            branchId: resolvedBranchId,
          });
        }
        if (Math.round(tip) > 0) {
          await createIncomeVoucher({
            typeCode: 'tip',
            typeName: t('pos.invoice.tip', 'Tiền TIP'),
            amount: Math.round(tip),
            description: `Tiền TIP hoá đơn #${invCode}`,
            paymentMethod: primaryMethod,
            refId: createdInv?.id,
            refCode: invCode,
            branchId: resolvedBranchId,
          });
        }
      } catch (cfErr) {
        console.warn('[CashFlow] Auto income voucher failed:', cfErr.message);
      }
      // ─────────────────────────────────────────────────────────────────────

      toast.success(`Thanh toán thành công • ${session.saleCode}`);
      setCheckoutOpen(false);
      onSaved();
    } catch (e) {
      toast.error(t('pos.invoice.error_payment', 'Lỗi khi thanh toán: ') + (e.message || e));
    }
    setPaying(false);
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-3 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200 pointer-events-auto select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-slate-50 rounded-3xl w-full max-w-[500px] lg:max-w-[1360px] h-[95vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-4 duration-300 select-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Row */}
        <div className="bg-white px-5 py-2.5 flex justify-between items-center border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h2 className="text-[15px] font-extrabold text-slate-800">{t('pos.invoice.create_direct', 'Tạo Hóa Đơn')}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* POS Content Area — Desktop: 2 cột, Mobile: Ticket chính + Catalog slide-up */}

        {/* DESKTOP (lg+): Catalog bên trái, Ticket bên phải */}
        <div className="hidden lg:flex flex-1 overflow-hidden min-h-0">
          {/* Left panel: CatalogColumn */}
          <div className="flex-1 overflow-y-auto flex flex-col bg-white min-w-0">
            <CatalogColumn
              tab={catalogTab}
              setTab={setCatalogTab}
              search={search}
              setSearch={setSearch}
              services={services}
              products={products}
              packages={packages}
              treatments={treatments}
              serviceCombos={serviceCombos}
              productCombos={productCombos}
              prepaidCards={prepaidCards}
              groups={groups}
              onAddItem={handleAddItem}
              onReload={loadData}
              activeSession={session}
            />
          </div>

          {/* Right panel: TicketColumn */}
          <div className="w-[450px] bg-slate-50/50 flex flex-col overflow-hidden border-l border-slate-100 shrink-0">
            <TicketColumn
              session={session}
              staff={staff}
              customers={customers}
              onUpdate={handleUpdateSession}
              onPickCustomer={(c) => handleUpdateSession({ customer: c })}
              onClearCustomer={() => handleUpdateSession({ customer: null })}
              onNewCustomer={(query) => { setCustQuery(query || ''); setCustModal(true); }}
              onCheckout={() => setCheckoutOpen(true)}
              onCancel={onClose}
              onReview={() => {}}
            />
          </div>
        </div>

        {/* MOBILE (< lg): Ticket chính + Catalog slide-up overlay */}
        <div className="flex lg:hidden flex-1 overflow-hidden min-h-0 relative bg-white">
          
          {/* Main panel: TicketColumn */}
          <div className="absolute inset-0 flex flex-col overflow-hidden bg-slate-50/50">
            <TicketColumn
              session={session}
              staff={staff}
              customers={customers}
              onUpdate={handleUpdateSession}
              onPickCustomer={(c) => handleUpdateSession({ customer: c })}
              onClearCustomer={() => handleUpdateSession({ customer: null })}
              onNewCustomer={(query) => { setCustQuery(query || ''); setCustModal(true); }}
              onCheckout={() => setCheckoutOpen(true)}
              onCancel={onClose}
              onReview={() => {}}
              onMobileAddClick={() => setCatalogOpen(true)}
            />
          </div>

          {/* Slide-up overlay: CatalogColumn (mobile only) */}
          <div className={`absolute inset-0 z-50 bg-white flex flex-col min-w-0 transition-transform duration-300 shadow-xl ${catalogOpen ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white shrink-0 shadow-sm">
              <h3 className="font-bold text-slate-800">{t('pos.invoice.select_items', 'Thêm Dịch vụ / Sản phẩm')}</h3>
              <button onClick={() => setCatalogOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50/50 min-w-0 relative pb-20">
              <CatalogColumn
                tab={catalogTab}
                setTab={setCatalogTab}
                search={search}
                setSearch={setSearch}
                services={services}
                products={products}
                packages={packages}
                treatments={treatments}
                serviceCombos={serviceCombos}
                productCombos={productCombos}
                prepaidCards={prepaidCards}
                groups={groups}
                onAddItem={(item) => {
                  handleAddItem(item);
                  toast.success(t('pos.added', 'Đã thêm') + ': ' + item.name);
                }}
                onReload={loadData}
                activeSession={session}
              />
            </div>
            {/* Footer with Apply button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
               <div className="text-sm font-medium text-slate-600">
                 {t('pos.selected_items', 'Đã chọn')}: <span className="font-bold text-emerald-600 text-base">{session?.cart?.length || 0}</span>
               </div>
               <button 
                 onClick={() => setCatalogOpen(false)} 
                 className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-sm"
               >
                 {t('pos.apply', 'Áp dụng')}
               </button>
            </div>
          </div>
        </div>

      </div>

      {/* New Customer Modal */}
      {custModal && (
        <NewCustomerModal
          initialQuery={custQuery}
          onClose={() => setCustModal(false)}
          onCreate={async (custData) => {
            try {
              const created = await base44.entities.Customer.create({
                name: custData.name,
                phone: custData.phone,
                gender: custData.gender,
                notes: custData.note,
                points: 0,
                total_spent: 0
              });
              toast.success(t('pos.invoice.add_customer_success', 'Đã thêm khách hàng mới'));
              setCustomers((prev) => [created, ...prev]);
              handleUpdateSession({ customer: created });
              setCustModal(false);
            } catch (err) {
              toast.error(t('pos.invoice.error_create_customer', 'Lỗi khi tạo khách hàng: ') + (err.message || err));
            }
          }}
        />
      )}

      {/* Checkout Payment Modal */}
      {checkoutOpen && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          session={session}
          onConfirm={handleCheckout}
          paying={paying}
          staff={staff}
        />
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
