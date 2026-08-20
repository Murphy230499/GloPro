'use client';
import React, { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';
import { Plus, Scissors, Package, Edit3, ToggleLeft, ToggleRight, Trash2, Gift, Sparkles, Layers, Boxes, Archive, Tag, AlertTriangle, CreditCard, RotateCcw } from 'lucide-react';
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
import PrepaidCardForm from '@/components/services/PrepaidCardForm';
import PrepaidCardView from '@/components/PrepaidCardView';
import EmptyStateSeeder from '@/components/EmptyStateSeeder';
import { seedServiceData } from '@/lib/seeders/serviceSeeder';




const ENTITY_MAP = { service: 'Service', product: 'Product', package: 'ServicePackage', treatment: 'Treatment', service_combo: 'ServiceCombo', product_combo: 'ProductCombo', prepaid_card: 'PrepaidCard' };


export default function Services() {
  const { t } = useT();
  const { currentBranchId, branches } = useBranch();
  const [tab, setTab] = useState('service');
  const TABS = [
  { v: 'service', l: t('catalog.tab_services', 'Dịch vụ'), i: Scissors, grp: 'service' },
  { v: 'product', l: t('catalog.tab_products', 'Sản phẩm'), i: Package, grp: 'product' },
  { v: 'package', l: t('catalog.tab_packages', 'Gói dịch vụ'), i: Gift, grp: 'package' },
  { v: 'treatment', l: t('catalog.tab_treatments', 'Liệu trình'), i: Sparkles, grp: 'treatment' },
  { v: 'service_combo', l: t('catalog.tab_service_combos', 'Combo dịch vụ'), i: Layers, grp: null },
  { v: 'product_combo', l: t('catalog.tab_product_combos', 'Combo sản phẩm'), i: Boxes, grp: null },
  { v: 'prepaid_card', l: t('catalog.tab_prepaid_cards', 'Thẻ tiền mặt'), i: CreditCard, grp: null }];
  const ADD_LABEL = { service: t('catalog.add_label_service', 'dịch vụ'), product: t('catalog.add_label_product', 'sản phẩm'), package: t('catalog.add_label_package', 'gói dịch vụ'), treatment: t('catalog.add_label_treatment', 'liệu trình'), service_combo: t('catalog.add_label_service_combo', 'combo dịch vụ'), product_combo: t('catalog.add_label_product_combo', 'combo sản phẩm'), prepaid_card: t('catalog.add_label_prepaid_card', 'thẻ tiền mặt') };
  const GROUP_LABEL = { service: t('catalog.group_label_service', 'dịch vụ'), product: t('catalog.group_label_product', 'sản phẩm'), package: t('catalog.group_label_package', 'gói dịch vụ'), treatment: t('catalog.group_label_treatment', 'liệu trình') };
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [serviceCombos, setServiceCombos] = useState([]);
  const [productCombos, setProductCombos] = useState([]);
  const [prepaidCards, setPrepaidCards] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [groupModal, setGroupModal] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState('');

  const load = () => {
    setLoading(true);
    const filter = currentBranchId === 'all' ? {} : { branch_ids: currentBranchId };
    Promise.all([
      base44.entities.Service.filter(filter),
      base44.entities.Product.filter(filter),
      base44.entities.ServicePackage.filter(filter),
      base44.entities.Treatment.filter(filter),
      base44.entities.ServiceCombo.filter(filter),
      base44.entities.ProductCombo.filter(filter),
      base44.entities.PrepaidCard.filter(filter),
      base44.entities.ServiceGroup.list()
    ]).then(async ([s, p, pk, t, sc, pc, gc, g]) => {
      // Auto seed if catalog is empty
      if (s.length === 0 && p.length === 0 && pk.length === 0 && t.length === 0 && sc.length === 0 && pc.length === 0 && gc.length === 0) {
        await seedServiceData(currentBranchId);
        const [s2, p2, pk2, t2, sc2, pc2, gc2, g2] = await Promise.all([
          base44.entities.Service.filter(filter),
          base44.entities.Product.filter(filter),
          base44.entities.ServicePackage.filter(filter),
          base44.entities.Treatment.filter(filter),
          base44.entities.ServiceCombo.filter(filter),
          base44.entities.ProductCombo.filter(filter),
          base44.entities.PrepaidCard.filter(filter),
          base44.entities.ServiceGroup.list()
        ]);
        setServices(s2);
        setProducts(p2);
        setPackages(pk2);
        setTreatments(t2);
        setServiceCombos(sc2);
        setProductCombos(pc2);
        setPrepaidCards(gc2);
        setGroups(g2);
      } else {
        setServices(s);
        setProducts(p);
        setPackages(pk);
        setTreatments(t);
        setServiceCombos(sc);
        setProductCombos(pc);
        setPrepaidCards(gc);
        setGroups(g);
      }
      setLoading(false);
    }).catch(() => {setLoading(false);});
  };
  useEffect(load, [currentBranchId]);

  const handleSeedServices = async () => {
    setSeeding(true);
    try {
      const result = await seedServiceData(currentBranchId, (msg) => setSeedProgress(msg || ''));
      toast.success(`Đã khôi phục: ${result.services} dịch vụ, ${result.products} sản phẩm, ${result.packages} gói, ${result.treatments} liệu trình`);
      load();
    } catch (e) {
      toast.error('Lỗi khôi phục: ' + (e.message || e));
    } finally {
      setSeeding(false);
      setSeedProgress('');
    }
  };

  const ensureValidGroupId = async (groupIdOrName, groupType) => {
    if (!groupIdOrName) return null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const bId = currentBranchId === 'all' ? '' : currentBranchId;

    try {
      // 1. If it's already a valid UUID in state
      const existingInState = groups.find(g => g.id === groupIdOrName);
      if (existingInState && uuidRegex.test(existingInState.id)) {
        return existingInState.id;
      }

      // If it is a UUID, search DB by ID
      if (uuidRegex.test(groupIdOrName)) {
        const dbMatches = await base44.entities.ServiceGroup.filter({ id: groupIdOrName });
        if (dbMatches && dbMatches.length > 0) return dbMatches[0].id;
        // If not found in DB, DO NOT create a group named with this UUID!
        return null;
      }

      // 2. Search by name in loaded state
      const nameMatchInState = groups.find(g => g.name === groupIdOrName);
      if (nameMatchInState && uuidRegex.test(nameMatchInState.id)) {
        return nameMatchInState.id;
      }

      // 3. Search database by name
      const filter = { name: groupIdOrName };
      if (bId) filter.branch_id = bId;
      const dbMatches = await base44.entities.ServiceGroup.filter(filter);
      if (dbMatches && dbMatches.length > 0) {
        return dbMatches[0].id;
      }

      // 4. Create new group in Supabase database!
      const groupName = nameMatchInState?.name || groupIdOrName;
      const newGroup = await base44.entities.ServiceGroup.create({
        name: groupName,
        type: groupType || 'service',
        color: nameMatchInState?.color || '#A78BFA',
        branch_id: bId || '00000000-0000-0000-0000-000000000000'
      });
      return newGroup.id;
    } catch (e) {
      console.warn('Could not resolve or create group_id in database:', e);
      return null;
    }
  };

  const save = async (data) => {
    const type = editing?.type || tab;
    const entityName = ENTITY_MAP[type];
    const { id, type: _t, group: _g, created_at, updated_at, created_date, updated_date, ...cleanData } = data;
    
    let groupNameStr = '';
    // Auto-resolve or create group in Supabase Database before saving!
    if (cleanData.group_id) {
      const allG = groups.length > 0 ? groups : DEFAULT_FALLBACK_GROUPS;
      const groupMatch = allG.find(g => g.id === cleanData.group_id || g.name === cleanData.group_id);
      
      if (groupMatch) {
        groupNameStr = groupMatch.name;
      } else {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(cleanData.group_id)) {
           // If it's a UUID not in local state, fetch from DB
           const fromDb = await base44.entities.ServiceGroup.filter({ id: cleanData.group_id });
           if (fromDb && fromDb.length > 0) {
             groupNameStr = fromDb[0].name;
           } else {
             // If DB also doesn't have it, don't use UUID as name
             groupNameStr = cleanData.category || cleanData.group || '';
           }
        } else {
           groupNameStr = cleanData.group_id;
        }
      }
      cleanData.group_id = await ensureValidGroupId(cleanData.group_id, type);
    }

    const finalBranchIds = 'branch_ids' in cleanData ? cleanData.branch_ids : (currentBranchId === 'all' ? [] : [currentBranchId]);
    
    // Remove old branch_id if somehow present
    if ('branch_id' in cleanData) delete cleanData.branch_id;

    const payload = {
      ...cleanData,
      category: groupNameStr || cleanData.category || '',
      branch_ids: finalBranchIds && finalBranchIds.length > 0 ? finalBranchIds : null
    };

    try {
      if (editing?.id) {
        await base44.entities[entityName].update(editing.id, payload);
        toast.success('Đã cập nhật thành công');
      } else {
        await base44.entities[entityName].create(payload);
        toast.success('Đã thêm mới thành công');
      }
      setEditing(null);
      load();
    } catch (e) {
      console.error('Save error:', e);
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  const remove = async (type, id) => {
    if (!window.confirm('Xoá mục này?')) return;
    try {
      await base44.entities[ENTITY_MAP[type]].delete(id);
      toast.success('Đã xoá');
      load();
    } catch (e) {toast.error('Lỗi: ' + (e.message || e));}
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

  const DEFAULT_FALLBACK_GROUPS = [
    { id: 'g_hair', name: 'Chăm sóc tóc', color: '#A78BFA', type: 'service' },
    { id: 'g_nail', name: 'Nail & Móng', color: '#F472B6', type: 'service' },
    { id: 'g_spa', name: 'Spa & Massage', color: '#34D399', type: 'service' },
    { id: 'g_prod', name: 'Bán lẻ sản phẩm', color: '#60A5FA', type: 'product' },
    { id: 'g_pkg', name: 'Gói tổng hợp', color: '#FBBF24', type: 'package' },
    { id: 'g_trt', name: 'Liệu trình chuyên sâu', color: '#F97316', type: 'treatment' }
  ];

  const getGroups = (type) => {
    const all = groups.length > 0 ? groups : DEFAULT_FALLBACK_GROUPS;
    const filtered = all.filter((g) => !g.type || g.type === type);
    return filtered.length > 0 ? filtered : all;
  };

  const getGroup = (type, item) => {
    if (!item) return null;
    const all = groups.length > 0 ? groups : DEFAULT_FALLBACK_GROUPS;
    
    const gid = typeof item === 'object' ? item.group_id : item;
    if (gid) {
      const matched = all.find((g) => g.id === gid);
      if (matched) return matched;
    }
    
    const gname = typeof item === 'object' ? (item.category || item.group || item.group_id) : item;
    if (gname) {
      const matched = all.find((g) => g.name === gname);
      if (matched) return matched;
      if (typeof gname === 'string' && gname.trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(gname)) {
        return { name: gname, color: '#8B5CF6' };
      }
    }
    return null;
  };

  const [draggedGroupId, setDraggedGroupId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  const handleGroupDragStart = (e, groupId) => {
    setDraggedGroupId(groupId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDrop = async (e, targetGroupId) => {
    e.preventDefault();
    if (!draggedGroupId || draggedGroupId === targetGroupId) return;

    const list = groups.filter((g) => g.type === tab).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const draggedIdx = list.findIndex((g) => g.id === draggedGroupId);
    const targetIdx = list.findIndex((g) => g.id === targetGroupId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const newList = [...list];
    const [removed] = newList.splice(draggedIdx, 1);
    newList.splice(targetIdx, 0, removed);

    const updates = newList.map((g, index) => {
      return base44.entities.ServiceGroup.update(g.id, { sort_order: index });
    });

    try {
      await Promise.all(updates);
      toast.success('Đã thay đổi thứ tự nhóm');
      load();
    } catch (err) {
      toast.error('Không thể lưu thứ tự nhóm');
    }
    setDraggedGroupId(null);
  };

  const handleItemDragStart = (e, itemId, groupId) => {
    setDraggedItem({ id: itemId, groupId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDrop = async (e, targetItemId, targetGroupId) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.groupId !== targetGroupId) {
      toast.error('Chỉ có thể đổi thứ tự trong cùng nhóm');
      return;
    }

    if (draggedItem.id === targetItemId) return;

    const entityName = ENTITY_MAP[tab];
    let itemsList = [];
    if (tab === 'service') itemsList = services;
    else if (tab === 'product') itemsList = products;
    else if (tab === 'package') itemsList = packages;
    else if (tab === 'treatment') itemsList = treatments;
    else if (tab === 'service_combo') itemsList = serviceCombos;
    else if (tab === 'product_combo') itemsList = productCombos;
    else if (tab === 'prepaid_card') itemsList = prepaidCards;

    const groupItems = itemsList
      .filter((x) => (tab === 'service_combo' || tab === 'product_combo' || tab === 'prepaid_card') ? true : (x.group_id || '') === targetGroupId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const draggedIdx = groupItems.findIndex((x) => x.id === draggedItem.id);
    const targetIdx = groupItems.findIndex((x) => x.id === targetItemId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const newList = [...groupItems];
    const [removed] = newList.splice(draggedIdx, 1);
    newList.splice(targetIdx, 0, removed);

    const updates = newList.map((item, index) => {
      return base44.entities[entityName].update(item.id, { sort_order: index });
    });

    try {
      await Promise.all(updates);
      toast.success('Đã thay đổi thứ tự');
      load();
    } catch (err) {
      toast.error('Không thể lưu thứ tự');
    }
    setDraggedItem(null);
  };

  const resolveGroupItems = (groupId) => {
    let list = [];
    if (tab === 'service') list = services;
    else if (tab === 'product') list = products;
    else if (tab === 'package') list = packages;
    else if (tab === 'treatment') list = treatments;

    return list
      .filter((x) => (x.group_id || '') === groupId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  };

  const renderItemCard = (item, groupId) => {
    if (tab === 'service') {
      const grp = getGroup('service', item);
      return (
        <div
          key={item.id}
          className={`rounded-2xl p-4 border border-slate-100 shadow-sm bg-white hover:shadow-md transition-all ${!item.is_active ? 'opacity-50' : ''}`}
        >
          <div className="flex items-start justify-between">
            {grp ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: (grp.color || '#94A3B8') + '1a', color: grp.color || '#94A3B8' }}>{grp.name}</span>
            ) : (
              <span className="text-[11px] text-slate-300">{t('catalog.no_group', 'Không nhóm')}</span>
            )}
            <button onClick={() => toggleActive('service', item)}>{item.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
          </div>
          {item.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /></div>}
          <div className="font-bold text-sm text-slate-800 truncate mt-1">{item.name}</div>
          {item.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</div>}
          <div className="flex items-center justify-between mt-3">
            {item.price_from > 0 ? <span className="font-bold text-pink-600 text-sm">từ {formatVND(item.price_from)}</span> : <span className="font-bold text-pink-600 text-sm">{formatVND(item.price)}</span>}
            <span className="text-xs text-slate-400">{item.duration_minutes || 0} {t('catalog.minutes', 'phút')}</span>
          </div>
          {item.cost > 0 && <div className="text-xs text-slate-400 mt-0.5">{t('catalog.cost_label', 'Chi phí:')} {formatVND(item.cost)}</div>}
          {item.accompanied_products?.length > 0 && <div className="mt-1 text-xs text-slate-400">{item.accompanied_products.length} {t('catalog.accompanied_products', 'sản phẩm đi kèm')}</div>}
          <div className="flex gap-1.5 mt-3">
            <button onClick={() => setEditing({ ...item, type: 'service' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"><Edit3 className="w-3.5 h-3.5" />{t('catalog.btn_edit', 'Sửa')}</button>
            <button onClick={() => remove('service', item.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      );
    }
    if (tab === 'product') {
      const grp = getGroup('product', item);
      return (
        <div
          key={item.id}
          className={`rounded-2xl p-4 border border-slate-100 shadow-sm bg-white hover:shadow-md transition-all ${!item.is_active ? 'opacity-50' : ''}`}
        >
          <div className="flex items-start justify-between">
            {grp ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: (grp.color || '#94A3B8') + '1a', color: grp.color || '#94A3B8' }}>{grp.name}</span> : <span className="text-[11px] text-slate-300">{t('catalog.no_group', 'Không nhóm')}</span>}
            <button onClick={() => toggleActive('product', item)}>{item.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
          </div>
          {item.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /></div>}
          <div className="font-bold text-sm text-slate-800 truncate mt-1">{item.name}</div>
          <div className="flex items-center justify-between mt-3">
            <span className="font-bold text-pink-600 text-sm">{formatVND(item.price)}</span>
            <span className="text-xs text-slate-400">{t('catalog.stock_label', 'Tồn:')} {item.stock || 0}</span>
          </div>
          <div className="flex gap-1.5 mt-3">
            <button onClick={() => setEditing({ ...item, type: 'product' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"><Edit3 className="w-3.5 h-3.5" />{t('catalog.btn_edit', 'Sửa')}</button>
            <button onClick={() => remove('product', item.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      );
    }
    if (tab === 'package') {
      const grp = getGroup('package', item);
      return (
        <div
          key={item.id}
          className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all ${!item.is_active ? 'opacity-50' : ''}`}
        >
          <div className="flex items-start justify-between">
            {grp ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: (grp.color || '#94A3B8') + '1a', color: grp.color || '#94A3B8' }}>{grp.name}</span> : <span className="text-[11px] text-slate-300">{t('catalog.no_group', 'Không nhóm')}</span>}
            <button onClick={() => toggleActive('package', item)}>{item.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
          </div>
          {item.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /></div>}
          <div className="font-bold mt-2 text-sm text-slate-800 truncate">{item.name}</div>
          {item.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</div>}
          <div className="flex items-center justify-between mt-3">
            <span className="font-bold text-pink-600 text-sm">{formatVND(item.price)}</span>
            <span className="text-xs text-slate-400">{item.usage_count || 1} {t('catalog.usage_times', 'lần sử dụng')}</span>
          </div>
          {(item.expiry_months > 0 || item.expiry_days > 0) && (
            <div className="text-xs text-slate-400 mt-0.5">{t('catalog.expiry_label', 'Hạn:')} {item.expiry_months > 0 ? `${item.expiry_months} ${t('catalog.months', 'tháng')} ` : ''}{item.expiry_days > 0 ? `${item.expiry_days} ${t('catalog.days', 'ngày')}` : ''}</div>
          )}
          {item.services?.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {item.services.map((it, i) => <div key={i} className="text-xs text-slate-500">• {it.service_name}</div>)}
            </div>
          )}
          <div className="flex gap-1.5 mt-3">
            <button onClick={() => setEditing({ ...item, type: 'package' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"><Edit3 className="w-3.5 h-3.5" />{t('catalog.btn_edit', 'Sửa')}</button>
            <button onClick={() => remove('package', item.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      );
    }
    if (tab === 'treatment') {
      const grp = getGroup('treatment', item);
      return (
        <div
          key={item.id}
          className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all ${!item.is_active ? 'opacity-50' : ''}`}
        >
          <div className="flex items-start justify-between">
            {grp ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: (grp.color || '#94A3B8') + '1a', color: grp.color || '#94A3B8' }}>{grp.name}</span> : <span className="text-[11px] text-slate-300">{t('catalog.no_group', 'Không nhóm')}</span>}
            <button onClick={() => toggleActive('treatment', item)}>{item.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
          </div>
          {item.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /></div>}
          <div className="font-bold mt-2 text-sm text-slate-800 truncate">{item.name}</div>
          {item.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</div>}
          <div className="flex items-center justify-between mt-3">
            <span className="font-bold text-pink-600 text-sm">{formatVND(item.price)}</span>
            {(item.expiry_months > 0 || item.expiry_days > 0) && <span className="text-xs text-slate-400">{t('catalog.expiry_label', 'Hạn:')} {item.expiry_months > 0 ? `${item.expiry_months}T ` : ''}{item.expiry_days > 0 ? `${item.expiry_days}N` : ''}</span>}
          </div>
          {item.services?.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {item.services.map((it, i) => <div key={i} className="text-xs text-slate-500 flex justify-between"><span className="truncate">• {it.service_name}</span><span className="shrink-0">{it.sessions}x</span></div>)}
            </div>
          )}
          <div className="flex gap-1.5 mt-3">
            <button onClick={() => setEditing({ ...item, type: 'treatment' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"><Edit3 className="w-3.5 h-3.5" />{t('catalog.btn_edit', 'Sửa')}</button>
            <button onClick={() => remove('treatment', item.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      );
    }
    return null;
  };

  const tabGroups = groups.filter((g) => g.type === tab).sort((a, b) => {
    if ((a.sort_order || 0) !== (b.sort_order || 0)) return (a.sort_order || 0) - (b.sort_order || 0);
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  const currentTab = TABS.find((t) => t.v === tab);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('catalog.page_title', 'Danh mục')}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('catalog.page_subtitle', 'Quản lý dịch vụ, sản phẩm, gói, liệu trình, combo, thẻ tiền mặt và kho')}</p>
        </div>
        <div className="flex items-center gap-2">
          {currentTab.grp && (
            <button 
              onClick={() => setGroupModal(currentTab.grp)} 
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              <Tag className="w-4 h-4 text-purple-600" /> {t('catalog.manage_groups', 'Quản lý nhóm')}
            </button>
          )}
          {tab !== 'inventory' && (
            <button 
              onClick={() => setEditing({ type: tab })} 
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {t('catalog.add_new', 'Thêm')} {ADD_LABEL[tab]}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
        {TABS.map((t) => {
          const Icon = t.i;
          return (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all cursor-pointer ${
                tab === t.v
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {t.l}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
      ) : (
        /* Flat non-grouped lists (service, product, package, treatment, combos, prepaid card) */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {tab === 'service' && (
            services.length === 0 ? (
              <div className="col-span-full">
                <EmptyStateSeeder
                  icon={<Scissors className="w-8 h-8 text-pink-400" />}
                  title="Chưa có dịch vụ nào"
                  description="Tạo dữ liệu mẫu gồm 10 dịch vụ, 6 sản phẩm, 2 gói dịch vụ để trải nghiệm hệ thống."
                  onSeed={handleSeedServices}
                  seeding={seeding}
                  seedProgress={seedProgress}
                  onAdd={() => setEditing({ type: tab })}
                  addLabel={`${t('catalog.add_new', 'Thêm')} ${ADD_LABEL[tab] || 'mới'}`}
                  seedLabel="Tạo dữ liệu mẫu"
                />
              </div>
            ) : (
              services
                .sort((a, b) => {
                  if ((a.sort_order || 0) !== (b.sort_order || 0)) return (a.sort_order || 0) - (b.sort_order || 0);
                  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                })
                .map((item) => renderItemCard(item, ''))
            )
          )}

          {tab === 'product' && (
            products.length === 0 ? (
              <div className="col-span-full">
                <EmptyStateSeeder
                  icon={<Scissors className="w-8 h-8 text-pink-400" />}
                  title="Chưa có sản phẩm nào"
                  description="Tạo dữ liệu mẫu gồm 10 dịch vụ, 6 sản phẩm, 2 gói dịch vụ để trải nghiệm hệ thống."
                  onSeed={handleSeedServices}
                  seeding={seeding}
                  seedProgress={seedProgress}
                  onAdd={() => setEditing({ type: tab })}
                  addLabel={`${t('catalog.add_new', 'Thêm')} ${ADD_LABEL[tab] || 'mới'}`}
                  seedLabel="Tạo dữ liệu mẫu"
                />
              </div>
            ) : (
              products
                .sort((a, b) => {
                  if ((a.sort_order || 0) !== (b.sort_order || 0)) return (a.sort_order || 0) - (b.sort_order || 0);
                  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                })
                .map((item) => renderItemCard(item, ''))
            )
          )}

          {tab === 'package' && (
            packages.length === 0 ? (
              <div className="col-span-full">
                <EmptyStateSeeder
                  icon={<Scissors className="w-8 h-8 text-pink-400" />}
                  title="Chưa có gói dịch vụ nào"
                  description="Tạo dữ liệu mẫu gồm 10 dịch vụ, 6 sản phẩm, 2 gói dịch vụ để trải nghiệm hệ thống."
                  onSeed={handleSeedServices}
                  seeding={seeding}
                  seedProgress={seedProgress}
                  onAdd={() => setEditing({ type: tab })}
                  addLabel={`${t('catalog.add_new', 'Thêm')} ${ADD_LABEL[tab] || 'mới'}`}
                  seedLabel="Tạo dữ liệu mẫu"
                />
              </div>
            ) : (
              packages
                .sort((a, b) => {
                  if ((a.sort_order || 0) !== (b.sort_order || 0)) return (a.sort_order || 0) - (b.sort_order || 0);
                  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                })
                .map((item) => renderItemCard(item, ''))
            )
          )}

          {tab === 'treatment' && (
            treatments.length === 0 ? (
              <div className="col-span-full">
                <EmptyStateSeeder
                  icon={<Scissors className="w-8 h-8 text-pink-400" />}
                  title="Chưa có liệu trình nào"
                  description="Tạo dữ liệu mẫu gồm 10 dịch vụ, 6 sản phẩm, 2 gói dịch vụ để trải nghiệm hệ thống."
                  onSeed={handleSeedServices}
                  seeding={seeding}
                  seedProgress={seedProgress}
                  onAdd={() => setEditing({ type: tab })}
                  addLabel={`${t('catalog.add_new', 'Thêm')} ${ADD_LABEL[tab] || 'mới'}`}
                  seedLabel="Tạo dữ liệu mẫu"
                />
              </div>
            ) : (
              treatments
                .sort((a, b) => {
                  if ((a.sort_order || 0) !== (b.sort_order || 0)) return (a.sort_order || 0) - (b.sort_order || 0);
                  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                })
                .map((item) => renderItemCard(item, ''))
            )
          )}

          {tab === 'service_combo' && (
            serviceCombos.length === 0 ? (
              <div className="col-span-full">
                <EmptyStateSeeder
                  icon={<Scissors className="w-8 h-8 text-pink-400" />}
                  title="Chưa có combo dịch vụ nào"
                  description="Tạo dữ liệu mẫu gồm 10 dịch vụ, 6 sản phẩm, 2 gói dịch vụ để trải nghiệm hệ thống."
                  onSeed={handleSeedServices}
                  seeding={seeding}
                  seedProgress={seedProgress}
                  onAdd={() => setEditing({ type: tab })}
                  addLabel={`${t('catalog.add_new', 'Thêm')} ${ADD_LABEL[tab] || 'mới'}`}
                  seedLabel="Tạo dữ liệu mẫu"
                />
              </div>
            ) : (
              serviceCombos
                .sort((a, b) => {
                  if ((a.sort_order || 0) !== (b.sort_order || 0)) return (a.sort_order || 0) - (b.sort_order || 0);
                  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                })
                .map((c) => {
                  const original = (c.items || []).reduce((sum, x) => sum + (x.price || 0), 0);
                  const discount = original - (c.combo_price || 0);
                  return (
                    <div
                      key={c.id}
                      className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all ${!c.is_active ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">{t('catalog.tab_service_combos', 'Combo dịch vụ')}</span>
                        <button onClick={() => toggleActive('service_combo', c)}>{c.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
                      </div>
                      {c.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /></div>}
                      <div className="font-bold mt-2 text-sm text-slate-800 truncate">{c.name}</div>
                      {c.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{c.description}</div>}
                      <div className="mt-2 space-y-0.5">
                        {(c.items || []).map((it, i) => <div key={i} className="text-xs text-slate-500 flex justify-between"><span className="truncate">• {it.service_name}</span><span className="shrink-0">{formatVND(it.price)}</span></div>)}
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-50">
                        <div className="flex items-center justify-between text-xs text-slate-400"><span>{t('catalog.original_price', 'Giá gốc:')} <s>{formatVND(original)}</s></span>{discount > 0 && <span className="text-green-600 font-semibold">-{formatVND(discount)}</span>}</div>
                        <div className="font-bold text-pink-600 mt-1 text-sm">{formatVND(c.combo_price)}</div>
                      </div>
                      <div className="flex gap-1.5 mt-3">
                        <button onClick={() => setEditing({ ...c, type: 'service_combo' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"><Edit3 className="w-3.5 h-3.5" />{t('catalog.btn_edit', 'Sửa')}</button>
                        <button onClick={() => remove('service_combo', c.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })
            )
          )}

          {tab === 'product_combo' && (
            productCombos.length === 0 ? (
              <div className="col-span-full">
                <EmptyStateSeeder
                  icon={<Scissors className="w-8 h-8 text-pink-400" />}
                  title="Chưa có combo sản phẩm nào"
                  description="Tạo dữ liệu mẫu gồm 10 dịch vụ, 6 sản phẩm, 2 gói dịch vụ để trải nghiệm hệ thống."
                  onSeed={handleSeedServices}
                  seeding={seeding}
                  seedProgress={seedProgress}
                  onAdd={() => setEditing({ type: tab })}
                  addLabel={`${t('catalog.add_new', 'Thêm')} ${ADD_LABEL[tab] || 'mới'}`}
                  seedLabel="Tạo dữ liệu mẫu"
                />
              </div>
            ) : (
              productCombos
                .sort((a, b) => {
                  if ((a.sort_order || 0) !== (b.sort_order || 0)) return (a.sort_order || 0) - (b.sort_order || 0);
                  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                })
                .map((c) => {
                  const original = (c.items || []).reduce((sum, x) => sum + (x.price || 0) * (x.qty || 1), 0);
                  const discount = original - (c.combo_price || 0);
                  return (
                    <div
                      key={c.id}
                      className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all ${!c.is_active ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">{t('catalog.tab_product_combos', 'Combo sản phẩm')}</span>
                        <button onClick={() => toggleActive('product_combo', c)}>{c.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
                      </div>
                      {c.image_url && <div className="h-24 -mx-4 mt-2 mb-2 overflow-hidden"><img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /></div>}
                      <div className="font-bold mt-2 text-sm text-slate-800 truncate">{c.name}</div>
                      {c.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{c.description}</div>}
                      <div className="mt-2 space-y-0.5">
                        {(c.items || []).map((it, i) => <div key={i} className="text-xs text-slate-500 flex justify-between"><span className="truncate">• {it.product_name} x{it.qty}</span><span className="shrink-0">{formatVND(it.price)}</span></div>)}
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-50">
                        <div className="flex items-center justify-between text-xs text-slate-400"><span>{t('catalog.original_price', 'Giá gốc:')} <s>{formatVND(original)}</s></span>{discount > 0 && <span className="text-green-600 font-semibold">-{formatVND(discount)}</span>}</div>
                        <div className="font-bold text-pink-600 mt-1 text-sm">{formatVND(c.combo_price)}</div>
                      </div>
                      <div className="flex gap-1.5 mt-3">
                        <button onClick={() => setEditing({ ...c, type: 'product_combo' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"><Edit3 className="w-3.5 h-3.5" />{t('catalog.btn_edit', 'Sửa')}</button>
                        <button onClick={() => remove('product_combo', c.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  );
                })
            )
          )}

          {tab === 'prepaid_card' && (
            prepaidCards.length === 0 ? (
              <div className="col-span-full">
                <EmptyStateSeeder
                  icon={<Scissors className="w-8 h-8 text-pink-400" />}
                  title="Chưa có thẻ tiền mặt nào"
                  description="Tạo dữ liệu mẫu gồm 10 dịch vụ, 6 sản phẩm, 2 gói dịch vụ để trải nghiệm hệ thống."
                  onSeed={handleSeedServices}
                  seeding={seeding}
                  seedProgress={seedProgress}
                  onAdd={() => setEditing({ type: tab })}
                  addLabel={`${t('catalog.add_new', 'Thêm')} ${ADD_LABEL[tab] || 'mới'}`}
                  seedLabel="Tạo dữ liệu mẫu"
                />
              </div>
            ) : (
              prepaidCards
                .sort((a, b) => {
                  if ((a.sort_order || 0) !== (b.sort_order || 0)) return (a.sort_order || 0) - (b.sort_order || 0);
                  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                })
                .map((c) => (
                  <div
                    key={c.id}
                    className={`hover:shadow-md transition-all rounded-2xl p-2 bg-white border border-slate-100 ${!c.is_active ? 'opacity-50' : ''}`}
                  >
                    <PrepaidCardView card={c} />
                    <div className="flex items-center justify-between mt-2 px-1">
                      <span className="text-xs text-slate-400">{t('catalog.sell_price_label', 'Giá bán:')} <span className="font-semibold text-pink-600">{formatVND(c.selling_price)}</span></span>
                      {c.expiry_months > 0 && <span className="text-xs text-slate-400">{t('catalog.expiry_label', 'Hạn:')} {c.expiry_months}{t('catalog.months_short', 'T')}</span>}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <button onClick={() => setEditing({ ...c, type: 'prepaid_card' })} className="flex-1 text-xs py-2 rounded-full bg-slate-100 font-medium flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"><Edit3 className="w-3.5 h-3.5" />{t('catalog.btn_edit', 'Sửa')}</button>
                      <button onClick={() => toggleActive('prepaid_card', c)} className="px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">{c.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-slate-300" />}</button>
                      <button onClick={() => remove('prepaid_card', c.id)} className="px-3 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))
            )
          )}
        </div>
      )}

      {/* Modals */}
      {editing?.type === 'service' && <ServiceForm item={editing} groups={getGroups('service')} products={products} branches={branches} onClose={() => setEditing(null)} onSave={save} />}
      {editing?.type === 'product' && <ProductForm item={editing} groups={getGroups('product')} branches={branches} onClose={() => setEditing(null)} onSave={save} />}
      {editing?.type === 'package' && <PackageForm item={editing} groups={getGroups('package')} services={services} branches={branches} onClose={() => setEditing(null)} onSave={save} />}
      {editing?.type === 'treatment' && <TreatmentForm item={editing} groups={getGroups('treatment')} services={services} branches={branches} onClose={() => setEditing(null)} onSave={save} />}
      {editing?.type === 'service_combo' && <ComboForm item={editing} services={services} branches={branches} onClose={() => setEditing(null)} onSave={save} />}
      {editing?.type === 'product_combo' && <ProductComboForm item={editing} products={products} branches={branches} onClose={() => setEditing(null)} onSave={save} />}
      {editing?.type === 'prepaid_card' && <PrepaidCardForm item={editing} branches={branches} onClose={() => setEditing(null)} onSave={save} />}
      {groupModal && <GroupManager type={groupModal} branchId={currentBranchId} onClose={() => setGroupModal(null)} onChanged={load} />}
    </div>);

}

function EmptyState({ text }) {
  return <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-100"><p className="text-slate-400 text-sm">{text}</p></div>;
}