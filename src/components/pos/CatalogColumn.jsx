'use client';
import React, { useState } from 'react';
import { Search, Scissors, ShoppingCart, ChevronDown, Gift, Sparkles, Layers, Boxes, CreditCard, Move, GripVertical } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';

const TABS = [
  { v: 'service', l: 'Dịch vụ', i: Scissors },
  { v: 'product', l: 'Sản phẩm', i: ShoppingCart },
  { v: 'package', l: 'Gói DV', i: Gift },
  { v: 'treatment', l: 'Liệu trình', i: Sparkles },
  { v: 'service_combo', l: 'Combo DV', i: Layers },
  { v: 'product_combo', l: 'Combo SP', i: Boxes },
  { v: 'prepaid_card', l: 'Thẻ', i: CreditCard },
];

const SERVICE_CATS = [
  { key: 'hair', label: 'Hair' }, { key: 'barber', label: 'Barber' }, { key: 'nail', label: 'Nails' },
  { key: 'skincare', label: 'Skincare' }, { key: 'spa', label: 'Spa' }, { key: 'makeup', label: 'Makeup' }, { key: 'other', label: 'Khác' },
];

export default function CatalogColumn({ tab, setTab, search, setSearch, services, products, packages, treatments, serviceCombos, productCombos, prepaidCards, groups, onAddItem, onReload, activeSession }) {
  const [collapsed, setCollapsed] = useState({});
  const [isSorting, setIsSorting] = useState(false);
  const [draggedGroupId, setDraggedGroupId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  const ENTITY_MAP = {
    service: 'Service',
    product: 'Product',
    package: 'ServicePackage',
    treatment: 'Treatment',
    service_combo: 'ServiceCombo',
    product_combo: 'ProductCombo',
    prepaid_card: 'PrepaidCard'
  };

  const getItemGroupIdOrCategory = (item) => {
    if (tab === 'service' && !item.group_id && item.category) {
      return `cat_${item.category}`;
    }
    return item.group_id || '';
  };

  const handleGroupDragStart = (e, groupId) => {
    if (!groupId) return;
    setDraggedGroupId(groupId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGroupDrop = async (e, targetGroupId) => {
    e.preventDefault();
    if (!draggedGroupId || !targetGroupId || draggedGroupId === targetGroupId) return;

    const list = groups.filter((g) => g.type === tab).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const draggedIdx = list.findIndex((g) => g.id === draggedGroupId);
    const targetIdx = list.findIndex((g) => g.id === targetGroupId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const newList = [...list];
    const [removed] = newList.splice(draggedIdx, 1);
    newList.splice(targetIdx, 0, removed);

    try {
      const storedMap = {};
      newList.forEach((g, index) => {
        storedMap[g.id] = index;
      });
      localStorage.setItem(`pos_sort_order_ServiceGroup`, JSON.stringify(storedMap));
    } catch (e) {
      console.error(e);
    }

    const updates = newList.map((g, index) => {
      return base44.entities.ServiceGroup.update(g.id, { sort_order: index });
    });

    try {
      await Promise.all(updates);
      toast.success('Đã thay đổi thứ tự nhóm');
      if (onReload) onReload();
    } catch (err) {
      toast.error('Không thể lưu thứ tự nhóm');
    }
    setDraggedGroupId(null);
  };

  const handleItemDragStart = (e, itemId, item) => {
    const groupId = getItemGroupIdOrCategory(item);
    setDraggedItem({ id: itemId, groupId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDrop = async (e, targetItemId, targetItem) => {
    e.preventDefault();
    if (!draggedItem) return;

    const targetGroupId = getItemGroupIdOrCategory(targetItem);
    if (draggedItem.groupId !== targetGroupId) {
      toast.error('Chỉ có thể đổi thứ tự trong cùng nhóm');
      return;
    }

    if (draggedItem.id === targetItemId) return;

    const entityName = ENTITY_MAP[tab];
    let itemsList = getItems() || [];

    const groupItems = itemsList
      .filter((x) => (tab === 'service_combo' || tab === 'product_combo' || tab === 'prepaid_card') ? true : getItemGroupIdOrCategory(x) === targetGroupId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const draggedIdx = groupItems.findIndex((x) => x.id === draggedItem.id);
    const targetIdx = groupItems.findIndex((x) => x.id === targetItemId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const newList = [...groupItems];
    const [removed] = newList.splice(draggedIdx, 1);
    newList.splice(targetIdx, 0, removed);

    try {
      const stored = localStorage.getItem(`pos_sort_order_${entityName}`);
      const storedMap = stored ? JSON.parse(stored) : {};
      newList.forEach((item, index) => {
        storedMap[item.id] = index;
      });
      localStorage.setItem(`pos_sort_order_${entityName}`, JSON.stringify(storedMap));
    } catch (e) {
      console.error(e);
    }

    const updates = newList.map((item, index) => {
      return base44.entities[entityName].update(item.id, { sort_order: index });
    });

    try {
      await Promise.all(updates);
      toast.success('Đã thay đổi thứ tự');
      if (onReload) onReload();
    } catch (err) {
      toast.error('Không thể lưu thứ tự');
    }
    setDraggedItem(null);
  };

  const getItems = () => {
    let list = [];
    switch (tab) {
      case 'service': list = services; break;
      case 'product': list = products; break;
      case 'package': list = packages; break;
      case 'treatment': list = treatments; break;
      case 'service_combo': list = serviceCombos; break;
      case 'product_combo': list = productCombos; break;
      case 'prepaid_card': list = prepaidCards; break;
      default: list = [];
    }

    const entityName = ENTITY_MAP[tab];
    try {
      const stored = localStorage.getItem(`pos_sort_order_${entityName}`);
      if (stored) {
        const orderMap = JSON.parse(stored);
        return list.map(item => ({
          ...item,
          sort_order: orderMap[item.id] !== undefined ? orderMap[item.id] : (item.sort_order || 0)
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return list;
  };

  const items = getItems() || [];
  const sortedItems = [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const filtered = sortedItems.filter((i) => i.name?.toLowerCase().includes(search.toLowerCase()));

  const itemIcon = () => {
    switch (tab) {
      case 'service': return Scissors;
      case 'product': return ShoppingCart;
      case 'package': return Gift;
      case 'treatment': return Sparkles;
      case 'service_combo': return Layers;
      case 'product_combo': return Boxes;
      case 'prepaid_card': return CreditCard;
      default: return Scissors;
    }
  };

  const resolveGroupName = (item) => {
    if (item.group_id) {
      const g = groups?.find((g) => g.id === item.group_id);
      if (g) return g.name;
    }
    if (tab === 'service' && item.category) {
      const cat = SERVICE_CATS.find((c) => c.key === item.category);
      if (cat) return cat.label;
    }
    return null;
  };

  const grouped = {};
  filtered.forEach((item) => {
    const cat = resolveGroupName(item) || 'Khác';
    (grouped[cat] = grouped[cat] || []).push(item);
  });

  let groupOrderMap = {};
  try {
    const stored = localStorage.getItem(`pos_sort_order_ServiceGroup`);
    if (stored) groupOrderMap = JSON.parse(stored);
  } catch (e) {
    console.error(e);
  }

  const catList = Object.entries(grouped).map(([key, list]) => {
    const groupEntity = groups?.find((g) => g.name === key && g.type === tab);
    const gid = groupEntity ? groupEntity.id : '';
    const defaultOrder = groupEntity ? (groupEntity.sort_order || 0) : 9999;
    const sortOrder = (groupEntity && groupOrderMap[gid] !== undefined) ? groupOrderMap[gid] : defaultOrder;

    return {
      key,
      label: key,
      list,
      groupId: gid,
      sortOrder
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
  const toggleCat = (key) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  const handleAdd = (item) => {
    if (isSorting) return;
    
    // Early warning: special items require a customer
    const SPECIAL_TABS = ['prepaid_card', 'package', 'treatment'];
    if (SPECIAL_TABS.includes(tab) && !activeSession?.customer) {
      const labels = {
        prepaid_card: 'thẻ tiền mặt cho khách vãng lai',
        package: 'gói dịch vụ cho khách vãng lai',
        treatment: 'liệu trình cho khách vãng lai'
      };
      toast.error(`⚠️ Không thể bán ${labels[tab]}! Vui lòng chọn khách hàng trước.`);
      return;
    }
    
    const price = getItemPrice(item) || 0;
    onAddItem({ ...item, price }, tab);
  };

  const getItemPrice = (item) => {
    if (tab === 'prepaid_card') return item.selling_price || item.face_value;
    if (tab === 'package' || tab === 'treatment') return item.price;
    if (tab === 'service_combo' || tab === 'product_combo') return item.combo_price;
    return item.price;
  };

  const getItemSub = (item) => {
    if (tab === 'service') return item.duration_minutes ? `${item.duration_minutes} phút` : '';
    if (tab === 'product') return item.stock != null ? `Tồn: ${item.stock}` : '';
    if (tab === 'package') return `${item.usage_count || 1} lần dùng`;
    if (tab === 'treatment') {
      const parts = [];
      if (item.services?.length) parts.push(`${item.services.length} DV`);
      if (item.expiry_months || item.expiry_days) parts.push(`Hạn: ${item.expiry_months || 0}T ${item.expiry_days || 0}N`);
      return parts.join(' • ');
    }
    if (tab === 'service_combo') return `${item.items?.length || 0} dịch vụ`;
    if (tab === 'product_combo') return `${item.items?.length || 0} sản phẩm`;
    if (tab === 'prepaid_card') return `Mệnh giá: ${formatVND(item.face_value)}`;
    return '';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-1 px-2 pt-3 border-b border-slate-100 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.i;
          return (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`flex items-center gap-1 pb-2.5 px-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === t.v ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <Icon className="w-3.5 h-3.5" /> {t.l}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3 flex gap-2">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm..." className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <button
          onClick={() => setIsSorting(!isSorting)}
          title="Sắp xếp bảng giá"
          className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all shrink-0 relative group/btn ${isSorting ? 'bg-primary/10 border-primary text-primary shadow-xs' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
        >
          <Move className="w-4 h-4" />
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/btn:block bg-slate-800 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-50 transition-all pointer-events-none">
            Sắp xếp bảng giá
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {catList.length === 0 ? (
          <div className="text-center py-16 text-slate-300 text-sm">Không tìm thấy</div>
        ) : (
          catList.map((cat) => {
            const list = cat.list;
            const isCollapsed = collapsed[cat.key];
            return (
              <div
                key={cat.key}
                className={`mb-3 p-1.5 rounded-2xl border transition-all group ${isSorting && cat.groupId ? 'border-primary/20 bg-primary/5/10' : 'bg-slate-50/20 border-slate-100/30 hover:bg-slate-50/50'}`}
                draggable={isSorting && !!cat.groupId}
                onDragStart={(e) => handleGroupDragStart(e, cat.groupId)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleGroupDrop(e, cat.groupId)}
              >
                <button onClick={() => !isSorting && toggleCat(cat.key)}
                  className={`w-full flex items-center gap-2 mb-1.5 py-1 ${isSorting && cat.groupId ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  <h4 className="text-sm font-bold text-slate-700">{cat.label}</h4>
                  <span className="text-xs text-slate-400">({list.length})</span>
                  {isSorting && cat.groupId && <span className="text-[10px] text-primary ml-auto font-bold animate-pulse">Kéo để xếp nhóm</span>}
                </button>
                {!isCollapsed && (
                  <div className="space-y-1">
                    {list.map((item) => {
                      const Icon = itemIcon();
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleAdd(item)}
                          draggable={isSorting}
                          onDragStart={(e) => { e.stopPropagation(); handleItemDragStart(e, item.id, item); }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => { e.stopPropagation(); handleItemDrop(e, item.id, item); }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left border ${isSorting ? 'cursor-grab active:cursor-grabbing hover:border-primary/30 hover:bg-primary/5 bg-white border-dashed border-slate-200 shadow-xs' : 'cursor-pointer hover:bg-slate-50 border-transparent'}`}
                        >
                          {isSorting && <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 -ml-1 mr-0.5" />}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {tab === 'prepaid_card' ? (
                                <div className="w-full h-full p-1.5 flex flex-col justify-between relative select-none" style={{ backgroundColor: item.color || '#FF6B9D' }}>
                                  <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/20" />
                                  <div className="flex justify-between items-start w-full relative z-10 leading-none">
                                    <span className="text-[5px] text-white/50 font-bold">CARD</span>
                                    <div className="w-2.5 h-2 rounded-xs bg-yellow-400/85 shadow-xs" />
                                  </div>
                                  <div className="text-[6.5px] text-white font-bold tracking-tight truncate relative z-10 w-full leading-none">
                                    {item.name}
                                  </div>
                                </div>
                              ) : item.image_url ? (
                                <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Icon className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate text-slate-700">{item.name}</div>
                              {getItemSub(item) && <div className="text-xs text-slate-400">{getItemSub(item)}</div>}
                            </div>
                          </div>
                          <span className="font-bold text-sm text-pink-600 shrink-0">{formatVND(getItemPrice(item))}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}