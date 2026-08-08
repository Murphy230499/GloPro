'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Toggle } from './PreferencesTab';
import { useT } from '@/lib/i18n';

const PAGE_SIZE = 10;

export default function EmployeesTab({ setting, onChange, branchId }) {
  const t = useT();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const ROLES = {
    manager: { label: t('booking.role_manager', 'Manager'), color: '#FF6B9D' },
    receptionist: { label: t('booking.role_receptionist', 'Receptionist'), color: '#60A5FA' },
    stylist: { label: t('booking.role_stylist', 'Hair Stylist'), color: '#A78BFA' },
    barber: { label: t('booking.role_barber', 'Barber'), color: '#34D399' },
    therapist: { label: t('booking.role_therapist', 'Spa Therapist'), color: '#FBBF24' },
    nail_tech: { label: t('booking.role_nail_tech', 'Nail Tech'), color: '#F472B6' },
    technician: { label: t('booking.role_technician', 'Technician'), color: '#F97316' },
    cashier: { label: t('booking.role_cashier', 'Cashier'), color: '#94A3B8' },
  };

  useEffect(() => {
    base44.entities.Staff.list().then(data => {
      setStaff((data || []).filter(s => s.is_active !== false));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [branchId]);

  const enabledIds = useMemo(() => setting?.enabled_staff_ids || [], [setting]);
  const isEnabled = (id) => enabledIds.length === 0 || enabledIds.includes(id);

  const toggleStaff = (id) => {
    const allIds = staff.map(s => s.id);
    let current = enabledIds.length === 0 ? [...allIds] : [...enabledIds];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onChange({ ...setting, enabled_staff_ids: next.length === allIds.length ? [] : next });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return staff;
    return staff.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
      s.role?.toLowerCase().includes(search.toLowerCase())
    );
  }, [staff, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const genId = (s, i) => s.employee_id || `ES-${String(i + 1).padStart(2, '0')}`;

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-pink-100 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-800">{t('booking.staff_list_title', 'Staff List')}</h2>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {t('booking.staff_count_unit', '{count} staff members', { count: filtered.length })}
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('booking.search_staff_placeholder', 'Search by staff code, name...')}
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-400 w-64"
          />
        </div>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 w-28 whitespace-nowrap">{t('booking.col_code', 'Staff Code')}</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{t('booking.col_name', 'Full Name')}</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{t('booking.col_role', 'Role')}</th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 w-20 whitespace-nowrap">{t('booking.col_visible', 'Visibility')}</th>
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-12 text-sm text-slate-400">
                {search ? t('booking.no_staff_search', 'No staff members found') : t('booking.no_staff_empty', 'No staff members yet. Add staff in Staff module.')}
              </td>
            </tr>
          ) : paginated.map((s, i) => (
            <tr
              key={s.id}
              className="border-b border-slate-50 hover:bg-slate-50/60 transition-all"
            >
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className="text-sm text-slate-600">{genId(s, (page - 1) * PAGE_SIZE + i)}</span>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 shrink-0 flex items-center justify-center">
                    {s.avatar_url || s.avatar
                      ? <img src={s.avatar_url || s.avatar} alt={s.name} className="w-full h-full object-cover" />
                      : <span className="text-sm font-bold text-slate-400">{s.name?.[0] || '?'}</span>
                    }
                  </div>
                  <span className="text-sm font-medium text-slate-800">{s.name}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="text-sm text-slate-500">
                  {ROLES[s.role]?.label || s.role || s.position || s.job_type || '—'}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex justify-end">
                  <Toggle
                    checked={isEnabled(s.id)}
                    onChange={() => toggleStaff(s.id)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-slate-100">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '...'
                ? <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-sm">...</span>
                : <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      page === p
                        ? 'bg-pink-500 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
            )
          }

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
