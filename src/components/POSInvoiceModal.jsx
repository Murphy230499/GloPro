'use client';
import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { todayStr } from '@/lib/format';
import { toast } from '@/components/Layout';
import CatalogColumn from '@/components/pos/CatalogColumn';
import TicketColumn from '@/components/pos/TicketColumn';
import CheckoutModal from '@/components/pos/CheckoutModal';
import { useBranch } from '@/lib/BranchContext';

export default function POSInvoiceModal({ open, customer, initialCart = [], onClose, onSaved }) {
  const { currentBranchId, branches } = useBranch();
  // POS tab and search states
  const [catalogTab, setCatalogTab] = useState('service');
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
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
    Promise.all([
      base44.entities.Service.list(),
      base44.entities.Product.list(),
      base44.entities.ServicePackage.list(),
      base44.entities.Treatment.list(),
      base44.entities.ServiceCombo.list(),
      base44.entities.ProductCombo.list(),
      base44.entities.PrepaidCard.list(),
      base44.entities.ServiceGroup.list(),
      base44.entities.Staff.list(),
      base44.entities.Customer.list()
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
    }).catch(err => {
      console.error('Lỗi tải danh mục POS:', err);
    });
  };

  useEffect(() => {
    if (!open) {
      setSession(null);
      return;
    }

    const initSession = async () => {
      loadData();
      
      const saleCode = 'SC' + String(Math.floor(100000 + Math.random() * 900000));
      let resolvedBranchId = (currentBranchId === 'all' || !currentBranchId) ? null : currentBranchId;
      if (!resolvedBranchId && branches && branches.length > 0) {
        resolvedBranchId = branches[0].id;
      }
      
      const mapCartItem = item => ({
        id: item.id || Math.random().toString(),
        name: item.name,
        type: item.type || 'service',
        price: item.price,
        originalPrice: item.price,
        qty: item.qty || 1,
        staff_id: item.staff_id || '',
        staff_name: item.staff_name || '',
        color: item.color
      });

      const initialCartMapped = (initialCart || []).map(mapCartItem);
      const subtotal = Math.round(initialCartMapped.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0));
      
      try {
        const createdInvoice = await base44.entities.Invoice.create({
          invoice_code: saleCode,
          customer_name: customer?.name || 'Khách vãng lai',
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
            sessions: Math.round(x.sessions || 10)
          })),
          subtotal,
          discount: 0,
          total: subtotal,
          tip: 0,
          status: 'unpaid',
          date: todayStr()
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
          createdAt: new Date()
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
          createdAt: new Date()
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
            customer_name: session.customer?.name || 'Khách vãng lai',
            customer_id: session.customer?.id || null,
            items: (session.cart || []).map(x => ({
              name: x.name,
              type: x.type === 'service' || x.type === 'product' ? x.type : 'package',
              price: Math.round(x.price || 0),
              qty: Math.round(x.qty || 1),
              staff_id: x.staff_id || '',
              staff_name: x.staff_name || '',
              balance: Math.round(x.balance || 0),
              sessions: Math.round(x.sessions || 10)
            })),
            subtotal,
            discount,
            total,
            tip: Math.round(session.tip || 0),
            tip_splits: (session.tipSplits || []).map(s => ({ staff_id: s.staffId, amount: Math.round(s.amount || 0) }))
          });
        } catch (e) {
          console.error('Error syncing invoice to db:', e);
        }
      };

      const timer = setTimeout(syncInvoiceToDb, 500);
      return () => clearTimeout(timer);
    }
  }, [
    session?.cart, 
    session?.customer, 
    session?.discountValue, 
    session?.discountType, 
    session?.discount,
    session?.tip, 
    session?.tipSplits
  ]);

  if (!open || !session) return null;

  // Handle updates from TicketColumn
  const handleUpdateSession = (patch) => {
    setSession(prev => {
      if (!prev) return null;
      const merged = { ...prev, ...patch };
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
          color: item.color
        }]
      });
    }
  };

  // Submit invoice checkout
  const handleCheckout = async ({ tip, discount, payments, tipSplits }) => {
    const cart = session.cart || [];
    const hasMembershipItem = cart.some(item => item.type !== 'service' && item.type !== 'product');
    if (hasMembershipItem && (!session.customer || !session.customer.id)) {
      return toast.error('Vui lòng chọn khách hàng khi thanh toán gói dịch vụ, liệu trình hoặc thẻ tiền mặt');
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
        customer_name: session.customer?.name || 'Khách vãng lai',
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

      toast.success(`Thanh toán thành công • ${session.saleCode}`);
      setCheckoutOpen(false);
      onSaved();
    } catch (e) {
      toast.error('Lỗi khi thanh toán: ' + (e.message || e));
    }
    setPaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Top Header Row */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold text-slate-800">Tạo Hóa Đơn Trực Tiếp</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unified POS Content Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left panel: CatalogColumn */}
          <div className="flex-1 overflow-y-auto flex flex-col bg-white">
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
          <div className="w-[380px] bg-slate-50/50 flex flex-col overflow-hidden border-l border-slate-100">
            <TicketColumn
              session={session}
              staff={staff}
              customers={customers}
              onUpdate={handleUpdateSession}
              onPickCustomer={(c) => handleUpdateSession({ customer: c })}
              onClearCustomer={() => handleUpdateSession({ customer: null })}
              onNewCustomer={() => {}}
              onCheckout={() => setCheckoutOpen(true)}
              onCancel={onClose}
              onReview={() => {}}
            />
          </div>
        </div>

      </div>

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
}
