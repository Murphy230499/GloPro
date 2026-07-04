import React, { useEffect, useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, UserPlus, CreditCard, X, Check, Wallet, Scissors } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND, todayStr } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import StaffAssignPicker from '@/components/StaffAssignPicker';

const METHODS = [
{ value: 'cash', label: 'Tiền mặt', color: '#34D399' },
{ value: 'transfer', label: 'Chuyển khoản/QR', color: '#60A5FA' },
{ value: 'card', label: 'Thẻ ngân hàng', color: '#A78BFA' },
{ value: 'ewallet', label: 'Ví điện tử', color: '#FBBF24' },
{ value: 'membership', label: 'Thẻ membership', color: '#F97316' },
{ value: 'points', label: 'Điểm tích lũy', color: '#FF6B9D' }];


export default function POS() {
  const { currentBranchId, currentBranch } = useBranch();
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('service');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [custModal, setCustModal] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [tip, setTip] = useState(0);
  const [payments, setPayments] = useState([{ method: 'cash', amount: 0 }]);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
    base44.entities.Service.filter(filter),
    base44.entities.Product.filter(filter),
    base44.entities.Staff.filter(filter),
    base44.entities.Customer.list(),
    base44.entities.Membership.filter(filter)]
    ).then(([s, p, st, c, m]) => {
      setServices(s.filter((x) => x.is_active));
      setProducts(p.filter((x) => x.is_active));
      setStaff(st);
      setCustomers(c);
      setMemberships(m.filter((x) => x.is_active));
    });
  }, [currentBranchId]);

  const items = tab === 'service' ? services : products;
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (item) => {
    setCart((c) => {
      const existing = c.find((x) => x.name === item.name && x.type === tab);
      if (existing) return c.map((x) => x === existing ? { ...x, qty: x.qty + 1 } : x);
      return [...c, { name: item.name, type: tab === 'service' ? 'service' : 'product', price: item.price, qty: 1, staff_id: '', staff_name: '', serviceId: item.id }];
    });
  };

  const updateCart = (idx, patch) => setCart((c) => c.map((x, i) => i === idx ? { ...x, ...patch } : x));
  const removeItem = (idx) => setCart((c) => c.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const pointsValue = pointsUsed * 1000;
  const total = Math.max(0, subtotal - discount - pointsValue);
  const grandTotal = total + tip;
  const paidSum = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remaining = grandTotal - paidSum;

  const checkout = async () => {
    if (!customer) return toast.error('Chọn khách hàng trước');
    if (cart.length === 0) return toast.error('Giỏ hàng trống');
    if (Math.abs(remaining) > 1) return toast.error(`Số tiền thanh toán chưa khớp (còn ${formatVND(remaining)})`);
    setPaying(true);
    try {
      const code = 'HD' + Date.now().toString().slice(-8);
      const payMethods = payments.filter((p) => p.amount > 0);
      await base44.entities.Invoice.create({
        invoice_code: code,
        customer_id: customer.id,
        customer_name: customer.name,
        branch_id: currentBranchId === 'all' ? '' : currentBranchId,
        items: cart.map((x) => ({ name: x.name, type: x.type, price: x.price, qty: x.qty, staff_id: x.staff_id, staff_name: x.staff_name })),
        subtotal,
        discount,
        points_used: pointsUsed,
        total,
        tip,
        payment_methods: payMethods,
        status: 'paid',
        date: todayStr()
      });
      const newPoints = Math.floor(total / 10000);
      await base44.entities.Customer.update(customer.id, {
        total_spent: (customer.total_spent || 0) + total,
        points: Math.max(0, (customer.points || 0) - pointsUsed + newPoints),
        visit_count: (customer.visit_count || 0) + 1,
        last_visit: todayStr()
      });
      toast.success(`Thanh toán thành công • ${code}`);
      setCart([]);setCustomer(null);setDiscount(0);setPointsUsed(0);setTip(0);
      setPayments([{ method: 'cash', amount: 0 }]);
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
    setPaying(false);
  };

  const createCustomer = async (data) => {
    const c = await base44.entities.Customer.create(data);
    setCustomers((arr) => [c, ...arr]);
    setCustomer(c);
    setCustModal(false);
    toast.success('Đã thêm khách hàng');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Thu ngân</h1>
        <p className="text-slate-400 text-sm mt-1 hidden">{currentBranchId === 'all' ? 'Chọn một cơ sở cụ thể để thanh toán' : currentBranch?.name}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-4 px-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                <Search className="w-4 h-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm dịch vụ / sản phẩm..." className="bg-transparent outline-none text-sm flex-1" />
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              {[
              { v: 'service', l: 'Dịch vụ' },
              { v: 'product', l: 'Sản phẩm' }].
              map((t) =>
              <button key={t.v} onClick={() => setTab(t.v)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold ${tab === t.v ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {t.l}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filtered.map((item) =>
              <button key={item.id} onClick={() => addToCart(item)}
              className="text-left p-2 rounded-xl border border-slate-100 hover:border-pink-300 hover:bg-pink-50/40 transition-colors overflow-hidden">
                  <div className="h-20 rounded-lg overflow-hidden bg-slate-100 mb-2">
                    {item.image_url ?
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> :

                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                        {tab === 'service' ? <Scissors className="w-7 h-7" /> : <ShoppingCart className="w-7 h-7" />}
                      </div>
                  }
                  </div>
                  <div className="font-semibold text-sm leading-tight line-clamp-2">{item.name}</div>
                  <div className="text-pink-600 font-bold text-sm mt-1">{formatVND(item.price)}</div>
                  {tab === 'service' && item.duration_minutes && <div className="text-xs text-slate-400">{item.duration_minutes} phút</div>}
                </button>
              )}
              {filtered.length === 0 && <p className="text-slate-400 text-sm col-span-full text-center py-6">Không tìm thấy</p>}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col px-2 py-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-pink-500" /> Giỏ hàng</h3>
            {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-500 font-medium">Xóa hết</button>}
          </div>

          {/* Customer */}
          {customer ?
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-pink-50 mb-3">
              <Avatar src={customer.avatar_url} name={customer.name} size={36} color="#E879A9" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{customer.name}</div>
                <div className="text-xs text-slate-500">{customer.points || 0} điểm • {formatVND(customer.total_spent || 0)}</div>
              </div>
              <button onClick={() => setCustomer(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div> :

          <div className="mb-3">
              <CustomerPicker customers={customers} onPick={setCustomer} onNew={() => setCustModal(true)} />
            </div>
          }

          {/* Items */}
          <div className="space-y-2 flex-1 max-h-[280px] overflow-y-auto">
            {cart.length === 0 ?
            <p className="text-center text-slate-400 text-sm py-8">Chọn dịch vụ/sản phẩm để thêm vào</p> :
            cart.map((x, i) =>
            <div key={i} className="bg-slate-50 rounded-xl p-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm flex-1 min-w-0 truncate">{x.name}</div>
                  <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateCart(i, { qty: Math.max(1, x.qty - 1) })} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="w-7 text-center text-sm font-semibold">{x.qty}</span>
                    <button onClick={() => updateCart(i, { qty: x.qty + 1 })} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                  <span className="font-bold text-sm text-pink-600">{formatVND(x.price * x.qty)}</span>
                </div>
                {x.type === 'service' &&
              <StaffAssignPicker
                staff={staff}
                value={x.staff_id}
                onChange={(id, name) => updateCart(i, { staff_id: id, staff_name: name })} />

              }
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-slate-100 mt-3 pt-3 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Tạm tính</span><span className="font-semibold">{formatVND(subtotal)}</span></div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Giảm giá</span>
              <input type="number" value={discount || ''} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} placeholder="0"
              className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 text-sm" />
            </div>
            {customer && customer.points > 0 &&
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Dùng điểm ({customer.points}đ = {formatVND(customer.points * 1000)})</span>
                <input type="number" max={customer.points} value={pointsUsed || ''} onChange={(e) => setPointsUsed(Math.min(customer.points, Math.max(0, Number(e.target.value) || 0)))} placeholder="0"
              className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 text-sm" />
              </div>
            }
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Tip</span>
              <input type="number" value={tip || ''} onChange={(e) => setTip(Math.max(0, Number(e.target.value) || 0))} placeholder="0"
              className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold">Tổng cộng</span>
              <span className="text-xl font-bold text-pink-600">{formatVND(grandTotal)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="border-t border-slate-100 mt-3 pt-3 space-y-2">
            <div className="text-sm font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-slate-500" /> Thanh toán</div>
            {payments.map((p, i) =>
            <div key={i} className="flex items-center gap-2">
                <select value={p.method} onChange={(e) => setPayments((arr) => arr.map((x, j) => j === i ? { ...x, method: e.target.value } : x))}
              className="flex-1 px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                  {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input type="number" value={p.amount || ''} onChange={(e) => setPayments((arr) => arr.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) || 0 } : x))} placeholder="0"
              className="w-28 px-2 py-2 rounded-lg border border-slate-200 text-sm" />
                {payments.length > 1 && <button onClick={() => setPayments((arr) => arr.filter((_, j) => j !== i))} className="text-slate-300"><X className="w-4 h-4" /></button>}
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className={remaining > 1 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
                {remaining > 1 ? `Còn ${formatVND(remaining)}` : remaining < -1 ? `Thừa ${formatVND(-remaining)}` : 'Đủ thanh toán ✓'}
              </span>
              <button onClick={() => setPayments((arr) => [...arr, { method: 'cash', amount: 0 }])} className="text-pink-600 font-medium flex items-center gap-1 text-xs"><Plus className="w-3 h-3" /> Thêm phương thức</button>
            </div>
          </div>

          <button onClick={checkout} disabled={paying || currentBranchId === 'all'}
          className="w-full mt-3 py-3 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {paying ? 'Đang xử lý...' : <><Check className="w-4 h-4" /> Hoàn tất thanh toán</>}
          </button>
          {currentBranchId === 'all' && <p className="text-xs text-center text-amber-600 mt-1">Chọn cơ sở cụ thể để thanh toán</p>}
        </div>
      </div>

      {custModal && <NewCustomerModal onClose={() => setCustModal(false)} onCreate={createCustomer} />}
    </div>);

}

function CustomerPicker({ customers, onPick, onNew }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const list = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)).slice(0, 6);
  return (
    <div className="relative">
      <button onClick={() => setOpen(true)} className="w-full flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">
        <UserPlus className="w-4 h-4" /> Chọn khách hàng
      </button>
      {open &&
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Chọn khách hàng</h3>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 mb-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên hoặc SĐT..." className="bg-transparent outline-none text-sm flex-1" />
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {list.map((c) =>
            <button key={c.id} onClick={() => {onPick(c);setOpen(false);}} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-left">
                  <Avatar src={c.avatar_url} name={c.name} size={36} color="#E879A9" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.phone} • {c.points || 0} điểm</div>
                  </div>
                </button>
            )}
              <button onClick={() => {onNew();setOpen(false);}} className="w-full flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-pink-200 text-pink-600 font-semibold text-sm">
                <Plus className="w-4 h-4" /> Thêm khách hàng mới
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}

function NewCustomerModal({ onClose, onCreate }) {
  const [f, setF] = useState({ name: '', phone: '', gender: 'female', note: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold mb-4">Khách hàng mới</h3>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Họ tên" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Số điện thoại" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option>
          </select>
          <textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Ghi chú" rows={2} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={() => f.name && f.phone ? onCreate(f) : toast.error('Nhập tên & SĐT')} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">Thêm</button>
        </div>
      </div>
    </div>);

}