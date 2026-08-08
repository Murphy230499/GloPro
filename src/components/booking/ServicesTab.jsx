'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Minus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import { useT } from '@/lib/i18n';

function ServiceCheckbox({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
        checked ? 'bg-pink-500 border-pink-500' : 'border-slate-300 bg-white'
      }`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

function GroupCheckbox({ allChecked, someChecked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
        allChecked ? 'bg-pink-500 border-pink-500' : someChecked ? 'bg-pink-500 border-pink-500' : 'border-slate-300 bg-white'
      }`}
    >
      {allChecked ? (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : someChecked ? (
        <Minus className="w-3 h-3 text-white" />
      ) : null}
    </button>
  );
}

export default function ServicesTab({ setting, onChange, branchId }) {
  const t = useT();
  const [services, setServices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const filter = branchId && branchId !== 'all' ? { branch_id: branchId } : {};
    Promise.all([
      base44.entities.Service.list().catch(() => []),
      base44.entities.ServiceGroup?.list().catch(() => []) || Promise.resolve([]),
    ]).then(([svcs, grps]) => {
      setServices((svcs || []).filter(s => s.is_active !== false));
      setGroups(grps || []);
    }).finally(() => setLoading(false));
  }, [branchId]);

  const enabledIds = useMemo(() => setting?.enabled_service_ids || [], [setting]);
  const isEnabled = (id) => enabledIds.length === 0 || enabledIds.includes(id);

  const toggleService = (id) => {
    const allIds = services.map(s => s.id);
    let current = enabledIds.length === 0 ? [...allIds] : [...enabledIds];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onChange({ ...setting, enabled_service_ids: next.length === allIds.length ? [] : next });
  };

  // Group services by group_id / category
  const grouped = useMemo(() => {
    const map = {};
    services.forEach(s => {
      const key = s.group_id || s.category || 'Uncategorized';
      if (!map[key]) map[key] = { label: key, items: [] };
      map[key].items.push(s);
    });

    // Replace keys with group names
    const result = [];
    Object.entries(map).forEach(([key, val]) => {
      const grp = groups.find(g => g.id === key);
      result.push({ label: grp?.name || val.label, items: val.items });
    });
    return result;
  }, [services, groups]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    return grouped.map(g => ({
      ...g,
      items: g.items.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()))
    })).filter(g => g.items.length > 0);
  }, [grouped, search]);

  const toggleGroup = (items) => {
    const allIds = services.map(s => s.id);
    const groupIds = items.map(s => s.id);
    const allEnabled = groupIds.every(id => isEnabled(id));
    let current = enabledIds.length === 0 ? [...allIds] : [...enabledIds];
    let next;
    if (allEnabled) {
      next = current.filter(id => !groupIds.includes(id));
    } else {
      next = [...new Set([...current, ...groupIds])];
    }
    onChange({ ...setting, enabled_service_ids: next.length === allIds.length ? [] : next });
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-pink-100 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">{t('booking.services_custom_title', 'Customize Services')}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{t('booking.services_custom_desc', 'Select services to display on public booking page')}</p>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('booking.search_service_placeholder', 'Search services...')}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
            />
          </div>
        </div>

        {/* Service list */}
        {services.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            {t('booking.no_services', 'No services found. Add services in Catalog module.')}
          </div>
        ) : (
          <div>
            {filtered.map((group) => {
              const groupIds = group.items.map(s => s.id);
              const allEnabled = groupIds.every(id => isEnabled(id));
              const someEnabled = groupIds.some(id => isEnabled(id));

              return (
                <div key={group.label}>
                  {/* Group header */}
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                    <GroupCheckbox
                      allChecked={allEnabled}
                      someChecked={someEnabled && !allEnabled}
                      onChange={() => toggleGroup(group.items)}
                    />
                    <span className="text-sm font-semibold text-slate-700">{group.label}</span>
                    <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{group.items.length}</span>
                  </div>

                  {/* Service rows */}
                  {group.items.map((svc, i) => (
                    <div
                      key={svc.id}
                      className={`flex items-center gap-3 pl-11 pr-5 py-3 hover:bg-pink-50/40 transition-all cursor-pointer ${
                        i < group.items.length - 1 ? 'border-b border-slate-50' : ''
                      }`}
                      onClick={() => toggleService(svc.id)}
                    >
                      <ServiceCheckbox
                        checked={isEnabled(svc.id)}
                        onChange={() => toggleService(svc.id)}
                      />
                      <span className="flex-1 text-sm text-slate-700">{svc.name}</span>
                      <span className="text-xs text-slate-400 w-16 text-right">
                        {svc.duration_minutes ? t('booking.unit_mins', '{count} mins', { count: svc.duration_minutes }) : '—'}
                      </span>
                      <span className="text-xs text-slate-600 font-medium w-20 text-right">
                        {svc.price ? formatVND(svc.price) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
