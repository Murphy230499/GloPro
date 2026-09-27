'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, Scissors } from 'lucide-react';
import { formatVND } from '@/lib/format';

export default function ServicePickerDropdown({
  servicesList = [],
  services = [],
  value,
  onChange,
  t,
  placeholder,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 280, openUp: false });
  const containerRef = useRef(null);

  const actualList = servicesList && servicesList.length > 0 ? servicesList : (services || []);

  const selectedServiceObj = useMemo(() => {
    return actualList.find(s => s.id === value);
  }, [actualList, value]);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setCoords({
        top: openUp ? Math.max(10, rect.top - dropdownHeight - 4) : rect.bottom + 4,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 280) - 8)),
        width: Math.max(rect.width, 280),
        openUp
      });
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (e.target.closest?.('.service-picker-portal-popup')) return;
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) updateCoords();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Group services by category
  const groupedServices = useMemo(() => {
    const groups = {};
    actualList.forEach(s => {
      const cat = (s.category || s.group || (t ? t('catalog.general_category', 'Dịch vụ') : 'Dịch vụ')).toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [actualList, t]);

  return (
    <div className="relative flex-1 min-w-0" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between pl-3 pr-2.5 py-2.5 rounded-xl border text-xs outline-none transition-all shadow-2xs ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'border-blue-500 bg-white ring-2 ring-blue-500/10 text-slate-800'
            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedServiceObj ? (
            <>
              <span className="truncate text-slate-800 font-semibold">{selectedServiceObj.name}</span>
              <span className="text-[11px] text-slate-400 shrink-0 font-normal">
                ({selectedServiceObj.duration_minutes || selectedServiceObj.duration || 30}p)
              </span>
            </>
          ) : (
            <span className="text-slate-400 truncate font-normal">
              {placeholder || (t ? t('rooms_beds.select_service', 'Chọn dịch vụ') : 'Chọn dịch vụ')}
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 stroke-[1.8] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Portal Popup Dropdown Panel */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="service-picker-portal-popup bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-72 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left font-sans"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 99999
          }}
        >
          {/* Search Header */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border-b border-slate-100 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={t ? t('catalog.search_service_placeholder', 'tìm kiếm dịch vụ...') : 'tìm kiếm dịch vụ...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs font-medium outline-none text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
              autoFocus
            />
          </div>

          {/* Service Items List */}
          <div className="overflow-y-auto p-1.5 space-y-1">
            {Object.keys(groupedServices).length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                {t ? t('common.no_results', 'Không có dịch vụ nào') : 'Không có dịch vụ nào'}
              </div>
            ) : (
              Object.entries(groupedServices).map(([category, items]) => {
                const visibleItems = items.filter(s =>
                  (s.name || '').toLowerCase().includes(search.toLowerCase())
                );
                if (visibleItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 bg-slate-50/50 rounded-md">
                      {category}
                    </div>
                    <div className="space-y-0.5">
                      {visibleItems.map(s => {
                        const isSelected = s.id === value;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              onChange?.(s.id);
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between text-left py-2 px-2.5 rounded-xl hover:bg-blue-50/80 transition-colors ${
                              isSelected ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="text-xs truncate font-medium text-slate-800">{s.name}</span>
                              <span className="text-[10px] text-slate-400">
                                {s.duration_minutes || s.duration || 30} {t ? t('appointments.settings.minutes', 'phút') : 'phút'}
                                {s.price ? ` · ${formatVND(s.price)}` : ''}
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
