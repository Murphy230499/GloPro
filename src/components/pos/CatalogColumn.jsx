import React, { useState } from 'react';
import { Search, Scissors, ShoppingCart, Box, Clock, ChevronDown } from 'lucide-react';
import { formatVND } from '@/lib/format';

const TABS = [
  { v: 'service', l: 'Dịch vụ' },
  { v: 'product', l: 'Sản phẩm' },
  { v: 'package', l: 'Gói dịch vụ' },
];

const SERVICE_CATS = [
  { key: 'hair', label: 'Hair' },
  { key: 'barber', label: 'Barber' },
  { key: 'nail', label: 'Nails' },
  { key: 'skincare', label: 'Skincare' },
  { key: 'spa', label: 'Spa' },
  { key: 'makeup', label: 'Makeup' },
  { key: 'other', label: 'Khác' },
];

export default function CatalogColumn({ tab, setTab, search, setSearch, services, products, onAddItem }) {
  const [collapsed, setCollapsed] = useState({});

  const items = tab === 'service' ? services : tab === 'product' ? products : [];
  const filtered = items.filter((i) => i.name?.toLowerCase().includes(search.toLowerCase()));

  const grouped = {};
  filtered.forEach((item) => {
    const cat = item.category || 'other';
    (grouped[cat] = grouped[cat] || []).push(item);
  });

  const catList = tab === 'service'
    ? SERVICE_CATS.filter((c) => grouped[c.key]?.length)
    : Object.entries(grouped).map(([key, list]) => ({ key, label: key || 'Khác', list }));

  const toggleCat = (key) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-5 px-4 pt-3.5 border-b border-slate-100">
        {TABS.map((t) => (
          <button key={t.v} onClick={() => setTab(t.v)}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${tab === t.v ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {t.l}
          </button>
        ))}
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'service' ? 'Tìm dịch vụ...' : tab === 'product' ? 'Tìm sản phẩm...' : 'Tìm gói dịch vụ...'}
            className="bg-transparent outline-none text-sm flex-1" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {tab === 'package' ? (
          <div className="text-center py-16 text-slate-300">
            <Box className="w-12 h-12 mx-auto mb-3 text-slate-200" strokeWidth={1.2} />
            <p className="text-sm">Chưa có gói dịch vụ</p>
          </div>
        ) : catList.length === 0 ? (
          <div className="text-center py-16 text-slate-300 text-sm">Không tìm thấy</div>
        ) : (
          catList.map((cat) => {
            const list = grouped[cat.key] || cat.list || [];
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
                    {list.map((item) => (
                      <button key={item.id} onClick={() => onAddItem(item, tab === 'service' ? 'service' : 'product')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                            ) : tab === 'service' ? (
                              <Scissors className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ShoppingCart className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            {tab === 'service' && item.duration_minutes ? (
                              <div className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{item.duration_minutes} phút</div>
                            ) : tab === 'product' && item.stock != null ? (
                              <div className="text-xs text-slate-400">Tồn kho: {item.stock}</div>
                            ) : null}
                          </div>
                        </div>
                        <span className="font-bold text-sm text-pink-600 shrink-0">{formatVND(item.price)}</span>
                      </button>
                    ))}
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