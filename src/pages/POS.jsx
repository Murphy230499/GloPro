import React, { useEffect, useState } from 'react';
import { Plus, X, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { todayStr } from '@/lib/format';
import { toast } from '@/components/Layout';
import CatalogColumn from '@/components/pos/CatalogColumn';
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
    saleCode: 'SAL_' + String(seq).padStart(6, '0'),
    seqNum: seq,
    customer: null,
    cart: [],
    discount: 0,
    tip: 0,
    createdAt: new Date(),
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
  const navigate = useNavigate();
  const { currentBranchId } = useBranch();
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalogTab, setCatalogTab] = useState('service');
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [custModal, setCustModal] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
      base44.entities.Service.filter(filter),
      base44.entities.Product.filter(filter),
      base44.entities.Staff.filter(filter),
      base44.entities.Customer.list(),
    ]).then(([s, p, st, c]) => {
      setServices(s.filter((x) => x.is_active));
      setProducts(p.filter((x) => x.is_active));
      setStaff(st);
      setCustomers(c);
    });
  }, [currentBranchId]);

  const activeSession = sessions.find((s) => s.id === activeId);

  const patchSession = (patch) => setSessions((arr) => arr.map((s) => (s.id === activeId ? { ...s, ...patch } : s)));

  const createSale = () => {
    const s = newSession();
    setSessions((arr) => [...arr, s]);
    setActiveId(s.id);
  };

  const closeSession = (id) => {
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeId === id) setActiveId(remaining.length ? remaining[remaining.length - 1].id : null);
  };

  const addToCart = (item, type) => {
    const session = activeSession;
    const cart = session?.cart || [];
    const existing = cart.find((x) => x.name === item.name && x.type === type);
    const newCart = existing
      ? cart.map((x) => (x === existing ? { ...x, qty: (x.qty || 1) + 1 } : x))
      : [...cart, { name: item.name, type, price: item.price, qty: 1, staff_id: '', staff_name: '' }];
    if (session) {
      patchSession({ cart: newCart });
    } else {
      const s = newSession();
      s.cart = newCart;
      setSessions((arr) => [...arr, s]);
      setActiveId(s.id);
    }
  };

  const createCustomer = async (data) => {
    const c = await base44.entities.Customer.create(data);
    setCustomers((arr) => [c, ...arr]);
    patchSession({ customer: c });
    setCustModal(false);
    toast.success('Đã thêm khách hàng');
  };

  const checkout = async ({ tip, discount, payments }) => {
    const session = activeSession;
    if (!session) return;
    if (!session.customer) return toast.error('Chọn khách hàng trước');
    if (!session.cart?.length) return toast.error('Giỏ hàng trống');
    setPaying(true);
    try {
      const cart = session.cart;
      const subtotal = cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
      const total = Math.max(0, subtotal - discount) + tip;
      await base44.entities.Invoice.create({
        invoice_code: session.saleCode,
        customer_id: session.customer.id || '',
        customer_name: session.customer.name,
        branch_id: currentBranchId === 'all' ? '' : currentBranchId,
        items: cart.map((x) => ({ name: x.name, type: x.type, price: x.price, qty: x.qty, staff_id: x.staff_id, staff_name: x.staff_name })),
        subtotal, discount, total, tip,
        payment_methods: payments, status: 'paid', date: todayStr(),
      });
      if (session.customer.id) {
        const newPoints = Math.floor(total / 10000);
        await base44.entities.Customer.update(session.customer.id, {
          total_spent: (session.customer.total_spent || 0) + total,
          points: Math.max(0, (session.customer.points || 0) + newPoints),
          visit_count: (session.customer.visit_count || 0) + 1,
          last_visit: todayStr(),
        });
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Thu ngân</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/invoices')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <BarChart3 className="w-4 h-4" /> Doanh thu trong ngày
          </button>
          <button onClick={createSale} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm shadow-sm">
            <Plus className="w-4 h-4" /> Tạo đơn
          </button>
        </div>
      </div>

      {/* Session tabs */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {sessions.map((s) => (
            <button key={s.id} onClick={() => setActiveId(s.id)}
              className={`flex items-center gap-2 pl-3 pr-1.5 py-2 rounded-t-xl border-b-2 text-sm whitespace-nowrap transition-colors ${s.id === activeId ? 'bg-white border-primary font-semibold text-slate-800' : 'bg-slate-100/70 border-transparent text-slate-500'}`}>
              {s.customer ? (
                <Avatar src={s.customer.avatar_url} name={s.customer.name} size={20} color="#E879A9" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">W</div>
              )}
              <span>{tabName(s)}</span>
              <span onClick={(e) => { e.stopPropagation(); closeSession(s.id); }} className="ml-1 w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10">
                <X className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Split layout */}
      <div className="grid lg:grid-cols-2 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        <CatalogColumn tab={catalogTab} setTab={setCatalogTab} search={search} setSearch={setSearch}
          services={services} products={products} onAddItem={addToCart} />
        {activeSession ? (
          <TicketColumn session={activeSession} staff={staff} customers={customers}
            onUpdate={patchSession}
            onPickCustomer={(c) => patchSession({ customer: c })}
            onClearCustomer={() => patchSession({ customer: null })}
            onNewCustomer={() => setCustModal(true)}
            onCheckout={() => setCheckoutOpen(true)}
            onCancel={() => { closeSession(activeId); toast('Đã huỷ đơn'); }}
            disabled={currentBranchId === 'all'} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center">
            <EmptyCart />
          </div>
        )}
      </div>

      <CheckoutModal open={checkoutOpen} session={activeSession} onClose={() => setCheckoutOpen(false)}
        onConfirm={checkout} paying={paying} />
      {custModal && <NewCustomerModal onClose={() => setCustModal(false)} onCreate={createCustomer} />}
    </div>
  );
}