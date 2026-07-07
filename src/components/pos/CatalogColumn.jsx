import React, { useState } from 'react';
import { Search, Scissors, ShoppingCart, ChevronDown, Gift, Sparkles, Layers, Boxes, CreditCard } from 'lucide-react';
import { formatVND } from '@/lib/format';

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

export default function CatalogColumn({ tab, setTab, search, setSearch, services, products, packages, treatments, serviceCombos, productCombos, prepaidCards, groups, onAddItem }) {
  const [collapsed, setCollapsed] = useState({});

  const getItems = () => {
    switch (tab) {
      case 'service': return services;
      case 'product': return products;
      case 'package': return packages;
      case 'treatment': return treatments;
      case 'service_combo': return serviceCombos;
      case 'product_combo': return productCombos;
      case 'prepaid_card': return prepaidCards;
      default: return [];
    }
  };

  const items = getItems() || [];
  const filtered = items.filter((i) => i.name?.toLowerCase().includes(search.toLowerCase()));

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

  const catList = Object.entries(grouped).map(([key, list]) => ({ key, label: key, list }));
  const toggleCat = (key) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  const handleAdd = (item) => {
    let type = 'package';
    if (tab === 'service') type = 'service';
    if (tab === 'product') type = 'product';
    onAddItem(item, type);
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

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm..." className="bg-transparent outline-none text-sm flex-1" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {catList.length === 0 ? (
          <div className="text-center py-16 text-slate-300 text-sm">Không tìm thấy</div>
        ) : (
          catList.map((cat) => {
            const list = cat.list;
            const isCollapsed = collapsed[cat.key];
            return (
              <div key={cat.key} className="mb-3">
                <button onClick={() => toggleCat(cat.key)}
                  className="w-full flex items-center gap-2 mb-1.5 py-1">
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  <h4 className="text-sm font-bold text-slate-700">{cat.label}</h4>
                  <span className="text-xs text-slate-400">({list.length})</span>
                </button>
                {!isCollapsed && (
                  <div className="space-y-1">
                    {list.map((item) => {
                      const Icon = itemIcon();
                      return (
                        <button key={item.id} onClick={() => handleAdd(item)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {item.image_url ? (
                                <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Icon className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{item.name}</div>
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