import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import Avatar from '@/components/Avatar';

export default function CustomerPicker({ customers, value, onChange, onAddNew }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const selected = customers.find((c) => c.id === value);
  const filtered = customers.filter((c) =>
    !q || c.name?.toLowerCase().includes(q.toLowerCase()) || c.phone?.includes(q)
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
      >
        {selected ? (
          <>
            <Avatar src={selected.avatar_url} name={selected.name} size={28} color="#FBBF24" />
            <div className="flex-1 text-left min-w-0">
              <div className="font-semibold truncate">{selected.name}</div>
              <div className="text-xs text-slate-400 truncate">{selected.phone}</div>
            </div>
          </>
        ) : (
          <span className="text-slate-400 flex-1 text-left">— Chọn khách hàng —</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-100 shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm tên / SĐT..."
                className="flex-1 text-sm outline-none"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { onAddNew?.(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-sm text-pink-600 font-semibold"
              >
                <div className="w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">+</div>
                Khách mới
              </button>
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c.id, c.name, c.phone, c); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-sm"
                >
                  <Avatar src={c.avatar_url} name={c.name} size={28} color="#FBBF24" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-slate-400 truncate">{c.phone}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}