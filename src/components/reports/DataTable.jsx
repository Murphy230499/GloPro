'use client';
import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function DataTable({
  columns = [],
  data = [],
  searchQuery = '',
  emptyText,
  onRowClick
}) {
  const t = useT();
  const actualEmptyText = emptyText || t('reports.empty_table_text', 'No report data found');
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState(() => columns.map(c => c.key));
  const [showColToggle, setShowColToggle] = useState(false);

  // Filter data by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(row => {
      return columns.some(col => {
        const val = row[col.key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, columns, searchQuery]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleColumn = (key) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const activeCols = columns.filter(c => visibleColumns.includes(c.key));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
      
      {/* Top Toolbar: Column Visibility Toggle */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
        <div className="text-slate-500 font-medium">
          {t('reports.table_showing_count', 'Showing {count} of {total} records', { count: paginatedData.length, total: sortedData.length })}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowColToggle(!showColToggle)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t('reports.customize_cols', 'Customize columns')} ({activeCols.length}/{columns.length})</span>
          </button>

          {showColToggle && (
            <div className="absolute right-0 top-9 z-20 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 w-56 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('reports.toggle_cols', 'Toggle columns')}</div>
              {columns.map(col => (
                <label key={col.key} className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:bg-slate-50 p-1.5 rounded-lg cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium text-slate-500">
              {activeCols.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`py-3.5 px-5 font-semibold text-slate-600 select-none ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-100/80 transition' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end w-full' : ''}`}>
                    <span>{col.label}</span>
                    {col.sortable !== false && (
                      <span className="text-slate-400 shrink-0">
                        {sortKey === col.key ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={activeCols.length} className="py-12 text-center text-slate-400 font-medium">
                  {actualEmptyText}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-slate-50/80 transition ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {activeCols.map(col => (
                    <td key={col.key} className={`py-3.5 px-5 font-medium text-slate-700 ${col.align === 'right' ? 'text-right' : ''}`}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        
        {/* Page Size Picker */}
        <div className="flex items-center gap-2">
          <span>{t('reports.show', 'Show')}</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value={10}>10 {t('reports.rows', 'rows')}</option>
            <option value={25}>25 {t('reports.rows', 'rows')}</option>
            <option value={50}>50 {t('reports.rows', 'rows')}</option>
            <option value={100}>100 {t('reports.rows', 'rows')}</option>
          </select>
          <span>{t('reports.per_page', 'per page')}</span>
        </div>

        {/* Page Stepper Buttons */}
        <div className="flex items-center gap-1.5 font-semibold">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold">
            {t('reports.page_of', 'Page {current} of {total}', { current: currentPage, total: totalPages })}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
