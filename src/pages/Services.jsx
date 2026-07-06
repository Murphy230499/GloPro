import React, { useEffect, useState } from 'react';
import { Plus, Scissors, Package, Edit3, ToggleLeft, ToggleRight, Trash2, Gift, Sparkles, Layers, Boxes, Archive, Tag, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import ServiceForm from '@/components/services/ServiceForm';
import ProductForm from '@/components/services/ProductForm';
import PackageForm from '@/components/services/PackageForm';
import TreatmentForm from '@/components/services/TreatmentForm';
import ComboForm from '@/components/services/ComboForm';
import ProductComboForm from '@/components/services/ProductComboForm';
import GroupManager from '@/components/services/GroupManager';

const TABS = [
  { v: 'service', l: 'Dịch vụ', i: Scissors, grp: 'service' },
  { v: 'product', l: 'Sản phẩm', i: Package, grp: 'product' },
  { v: 'package', l: 'Gói dịch vụ', i: Gift, grp: 'package' },
  { v: 'treatment', l: 'Liệu trình', i: Sparkles, grp: 'treatment' },
  { v: 'service_combo', l: 'Combo dịch vụ', i: Layers, grp: null },
  { v: 'product_combo', l: 'Combo sản phẩm', i: Boxes, grp: null },
  { v: 'inventory', l: 'Kho hàng', i: Archive, grp: null },
];

const ENTITY_MAP = { service: 'Service', product: 'Product', package: 'ServicePackage', treatment: 'Treatment', service_combo: 'ServiceCombo', product_combo: 'ProductCombo' };
const ADD_LABEL = { service: 'dịch vụ', product: 'sản phẩm', package: 'gói dịch vụ', treatment: 'liệu trình', service_combo: 'combo dịch vụ', product_combo: 'combo sản phẩm' };
const GROUP_LABEL = { service: 'dịch vụ', product: 'sản phẩm', package: 'gói dịch vụ', treatment: 'liệu trình' };

export default function Services() {
  const { currentBranchId } = useBranch();
  const [tab, setTab] = useState('service');
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [serviceCombos, setServiceCombos] = useState([]);
  const [productCombos, setProductCombos] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [groupModal, setGroupModal] = useState(null);

  const load = () => {
    setLoading(true);
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
      base44.entities.Service.filter(filter),
      base44.entities.Product.filter(filter),
      base44.entities.ServicePackage.filter(filter),
      base44.entities.Treatment.filter(filter),
      base44.entities.ServiceCombo.filter(filter),
      base44.entities.ProductCombo.filter(filter),
      base44.entities.ServiceGroup.filter(currentBranchId === 'all' ? {} : { branch_id: currentBranchId }),
    ]).then(([s, p, pk, t, sc, pc, g]) => {
      setServices(s);
      setProducts(p);
      setPackages(pk);
      setTreatments(t);
      setServiceCombos(sc);
      setProductCombos(pc);
      setGroups(g);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  };
  useEffect(load, [currentBranchId]);

  const save = async (data) => {
    const type = editing.type;
    const entityName = ENTITY_MAP[type];
    const payload = { ...data, branch_id: data.branch_id || (currentBranchId === 'all' ? '' : currentBranchId) };
    try {
      if (editing.id) {
        await base44.entities[entityName].update(editing.id, payload);
        toast.success('Đã cập nhật');
      } else {
        await base44.entities[entityName].create(payload);
        toast.success('Đã thêm');
      }
      setEditing(null);
      load();
    } catch (e) { toast.error('Lỗi: ' + (e.message || e)); }
  };

  const remove = async (type, id) => {
    if (!window.confirm('Xoá mục này?')) return;
    try {
      await base44.entities[ENTITY_MAP[type]].delete(id);
      toast.success('Đã xoá');
      load();
    } catch (e) { toast.error('Lỗi: ' + (e.message || e)); }
  };

  const toggleActive = async (type, item) => {
    await base44.entities[ENTITY_MAP[type]].update(item.id, { is_active: !item.is_active });
    load();
  };

  const adjustStock = async (product, delta) => {
    await base44.entities.Product.update(product.id, { stock: Math.max(0, (product.stock || 0) + delta) });
    load();
  };

  const saveMinStock = async (product, value) => {
    await base44.entities.Product.update(product.id, { min_stock: value });
    toast.success('Đã cập nhật ngưỡng cảnh báo');
    load();
  };

  const getGroups = (type) => groups.filter((g) => g.type === type);
  const getGroup = (type, gid) => getGroups(type).find((g) => g.id === gid);

  const currentTab = TABS.find((t) => t.v === tab);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dịch vụ & Sản phẩm</h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý dịch vụ, sản phẩm, gói, liệu trình, combo và kho</p>
        </div>
        <div className="flex items-center gap-2">
          {currentTab.grp && (
            <button onClick={() => setGroupModal(currentTab.grp)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50">
              <Tag className="w-4 h-4" /> Quản lý nhóm
            </button>
          )}
          {tab !== 'inventory' && (
            <button onClick={() => setEditing({ type: tab })} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">
              <Plus className="w-4 h-4" /> Thêm {ADD_LABEL[tab]}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.i;
          return (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${tab === t.v ? 'bg-primary text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
              <Icon className="w-4 h-4" /> {t.l}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" /></div>
      ) : tab === 'service' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.length === 0 ? <EmptyState text="Chưa có dịch vụ nào" /> : services.map((s) => {
            const grp = getGroup('service', s.group_id);
            return (
              <div key={s.id} className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm ${!s.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  {grp ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: (grp.color || '#94A3B8') + '1a', color: grp.color || '#94A3B8' }}>{grp.name}</span>
                  ) : <span className="text-[11px] text-slate-300">Không nhóm</span>}
                  <button onClick={() => toggleActive('service', s)}>{s.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
                </div>
                {s.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={s.image_url} alt={s.name} className="w-full h-full object-cover" /></div>}
                <div className="font-bold">{s.name}</div>
                {s.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{s.description}</div>}
                <div className="flex items-center justify-between mt-3">
                  {s.price_from > 0 ? <span className="font-bold text-pink-600">từ {formatVND(s.price_from)}</span> : <span className="font-bold text-pink-600">{formatVND(s.price)}</span>}
                  <span className="text-xs text-slate-400">{s.duration_minutes || 0} phút</span>
                </div>
                {s.cost > 0 && <div className="text-xs text-slate-400 mt-0.5">Chi phí: {formatVND(s.cost)}</div>}
                {s.accompanied_products?.length > 0 && <div className="mt-1 text-xs text-slate-400">{s.accompanied_products.length} sản phẩm đi kèm</div>}
                <div className="flex gap-1.5 mt-3">
                  <button onClick={() => setEditing({ ...s, type: 'service' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1"><Edit3 className="w-3.5 h-3.5" />Sửa</button>
                  <button onClick={() => remove('service', s.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : tab === 'product' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.length === 0 ? <EmptyState text="Chưa có sản phẩm nào" /> : products.map((p) => {
            const grp = getGroup('product', p.group_id);
            return (
              <div key={p.id} className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm ${!p.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  {grp ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: (grp.color || '#94A3B8') + '1a', color: grp.color || '#94A3B8' }}>{grp.name}</span> : <span className="text-[11px] text-slate-300">Không nhóm</span>}
                  <button onClick={() => toggleActive('product', p)}>{p.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
                </div>
                {p.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /></div>}
                <div className="font-bold">{p.name}</div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-pink-600">{formatVND(p.price)}</span>
                  <span className="text-xs text-slate-400">Tồn: {p.stock || 0}</span>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <button onClick={() => setEditing({ ...p, type: 'product' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1"><Edit3 className="w-3.5 h-3.5" />Sửa</button>
                  <button onClick={() => remove('product', p.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : tab === 'package' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {packages.length === 0 ? <EmptyState text="Chưa có gói dịch vụ nào" /> : packages.map((pk) => {
            const grp = getGroup('package', pk.group_id);
            return (
              <div key={pk.id} className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm ${!pk.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  {grp ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: (grp.color || '#94A3B8') + '1a', color: grp.color || '#94A3B8' }}>{grp.name}</span> : <span className="text-[11px] text-slate-300">Không nhóm</span>}
                  <button onClick={() => toggleActive('package', pk)}>{pk.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
                </div>
                {pk.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={pk.image_url} alt={pk.name} className="w-full h-full object-cover" /></div>}
                <div className="font-bold mt-2">{pk.name}</div>
                {pk.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{pk.description}</div>}
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-pink-600">{formatVND(pk.price)}</span>
                  <span className="text-xs text-slate-400">{pk.usage_count || 1} lần sử dụng</span>
                </div>
                {(pk.expiry_months > 0 || pk.expiry_days > 0) && (
                  <div className="text-xs text-slate-400 mt-0.5">Hạn: {pk.expiry_months > 0 ? `${pk.expiry_months} tháng ` : ''}{pk.expiry_days > 0 ? `${pk.expiry_days} ngày` : ''}</div>
                )}
                {pk.services?.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {pk.services.map((it, i) => <div key={i} className="text-xs text-slate-500">• {it.service_name}</div>)}
                  </div>
                )}
                <div className="flex gap-1.5 mt-3">
                  <button onClick={() => setEditing({ ...pk, type: 'package' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1"><Edit3 className="w-3.5 h-3.5" />Sửa</button>
                  <button onClick={() => remove('package', pk.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : tab === 'treatment' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {treatments.length === 0 ? <EmptyState text="Chưa có liệu trình nào" /> : treatments.map((t) => {
            const grp = getGroup('treatment', t.group_id);
            return (
              <div key={t.id} className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm ${!t.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  {grp ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: (grp.color || '#94A3B8') + '1a', color: grp.color || '#94A3B8' }}>{grp.name}</span> : <span className="text-[11px] text-slate-300">Không nhóm</span>}
                  <button onClick={() => toggleActive('treatment', t)}>{t.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
                </div>
                {t.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={t.image_url} alt={t.name} className="w-full h-full object-cover" /></div>}
                <div className="font-bold mt-2">{t.name}</div>
                {t.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{t.description}</div>}
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-pink-600">{formatVND(t.price)}</span>
                  {(t.expiry_months > 0 || t.expiry_days > 0) && <span className="text-xs text-slate-400">Hạn: {t.expiry_months > 0 ? `${t.expiry_months}T ` : ''}{t.expiry_days > 0 ? `${t.expiry_days}N` : ''}</span>}
                </div>
                {t.services?.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {t.services.map((it, i) => <div key={i} className="text-xs text-slate-500 flex justify-between"><span className="truncate">• {it.service_name}</span><span className="shrink-0">{it.sessions}x</span></div>)}
                  </div>
                )}
                <div className="flex gap-1.5 mt-3">
                  <button onClick={() => setEditing({ ...t, type: 'treatment' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1"><Edit3 className="w-3.5 h-3.5" />Sửa</button>
                  <button onClick={() => remove('treatment', t.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : tab === 'service_combo' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {serviceCombos.length === 0 ? <EmptyState text="Chưa có combo dịch vụ nào" /> : serviceCombos.map((c) => {
            const original = (c.items || []).reduce((sum, x) => sum + (x.price || 0), 0);
            const discount = original - (c.combo_price || 0);
            return (
              <div key={c.id} className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm ${!c.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Combo dịch vụ</span>
                  <button onClick={() => toggleActive('service_combo', c)}>{c.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
                </div>
                {c.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /></div>}
                <div className="font-bold mt-2">{c.name}</div>
                {c.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{c.description}</div>}
                <div className="mt-2 space-y-0.5">
                  {(c.items || []).map((it, i) => <div key={i} className="text-xs text-slate-500 flex justify-between"><span className="truncate">• {it.service_name}</span><span className="shrink-0">{formatVND(it.price)}</span></div>)}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-50">
                  <div className="flex items-center justify-between text-xs text-slate-400"><span>Giá gốc: <s>{formatVND(original)}</s></span>{discount > 0 && <span className="text-green-600 font-semibold">-{formatVND(discount)}</span>}</div>
                  <div className="font-bold text-pink-600 mt-1">{formatVND(c.combo_price)}</div>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <button onClick={() => setEditing({ ...c, type: 'service_combo' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1"><Edit3 className="w-3.5 h-3.5" />Sửa</button>
                  <button onClick={() => remove('service_combo', c.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : tab === 'product_combo' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {productCombos.length === 0 ? <EmptyState text="Chưa có combo sản phẩm nào" /> : productCombos.map((c) => {
            const original = (c.items || []).reduce((sum, x) => sum + (x.price || 0) * (x.qty || 1), 0);
            const discount = original - (c.combo_price || 0);
            return (
              <div key={c.id} className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm ${!c.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">Combo sản phẩm</span>
                  <button onClick={() => toggleActive('product_combo', c)}>{c.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
                </div>
                {c.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /></div>}
                <div className="font-bold mt-2">{c.name}</div>
                {c.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{c.description}</div>}
                <div className="mt-2 space-y-0.5">
                  {(c.items || []).map((it, i) => <div key={i} className="text-xs text-slate-500 flex justify-between"><span className="truncate">• {it.product_name} x{it.qty}</span><span className="shrink-0">{formatVND(it.price)}</span></div>)}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-50">
                  <div className="flex items-center justify-between text-xs text-slate-400"><span>Giá gốc: <s>{formatVND(original)}</s></span>{discount > 0 && <span className="text-green-600 font-semibold">-{formatVND(discount)}</span>}</div>
                  <div className="font-bold text-pink-600 mt-1">{formatVND(c.combo_price)}</div>
                </div>
                <div className="flex gap-1.5 mt-3">
                  <button onClick={() => setEditing({ ...c, type: 'product_combo' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1"><Edit3 className="w-3.5 h-3.5" />Sửa</button>
                  <button onClick={() => remove('product_combo', c.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Inventory */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {products.length === 0 ? <EmptyState text="Chưa có sản phẩm nào" /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Sản phẩm</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">SKU</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Đơn vị</th>
                  <th className="text-right px-4 py-3 font-medium">Tồn kho</th>
                  <th className="text-right px-4 py-3 font-medium">Ngưỡng cảnh báo</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Giá trị kho</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const lowStock = (p.stock || 0) <= (p.min_stock || 0) && p.min_stock > 0;
                  return (
                    <tr key={p.id} className={`border-t border-slate-50 ${lowStock ? 'bg-red-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{p.sku || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{p.unit || 'cái'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${lowStock ? 'text-red-500' : 'text-slate-700'}`}>{p.stock || 0}</span>
                        {lowStock && <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-red-400"><AlertTriangle className="w-3 h-3" />Thấp</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input type="number" value={p.min_stock || ''} onChange={(e) => saveMinStock(p, Number(e.target.value) || 0)} className="w-16 px-1.5 py-1 rounded-lg border border-slate-200 text-xs text-center" />
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell font-semibold">{formatVND((p.stock || 0) * (p.cost_price || 0))}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => adjustStock(p, -1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold">−</button>
                          <button onClick={() => adjustStock(p, 1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold">+</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      {editing?.type === 'service' && <ServiceForm item={editing} groups={getGroups('service')} products={products} onClose={() => setEditing(null)} onSave={save} />}
      {editing?.type === 'product' && <ProductForm item={editing} groups={getGroups('product')} onClose={() => setEditing(null)} onSave={save} />}
      {editing?.type === 'package' && <PackageForm item={editing} groups={getGroups('package')} services={services} onClose={() => setEditing(null)} onSave={save} />}
      {editing?.type === 'treatment' && <TreatmentForm item={editing} groups={getGroups('treatment')} services={services} onClose={() => setEditing(null)} onSave={save} />}
      {editing?.type === 'service_combo' && <ComboForm item={editing} services={services} onClose={() => setEditing(null)} onSave={save} />}
      {editing?.type === 'product_combo' && <ProductComboForm item={editing} products={products} onClose={() => setEditing(null)} onSave={save} />}
      {groupModal && <GroupManager type={groupModal} branchId={currentBranchId} onClose={() => setGroupModal(null)} onChanged={load} />}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-100"><p className="text-slate-400 text-sm">{text}</p></div>;
}