'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check } from 'lucide-react';
import Avatar from '@/components/Avatar';

export default function StaffPickerDropdown({
  staffList = [],
  value,
  onChange,
  t,
  placeholder,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 240, openUp: false });
  const containerRef = useRef(null);

  const selectedStaffObj = useMemo(() => {
    return staffList.find(st => st.id === value);
  }, [staffList, value]);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 260;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setCoords({
        top: openUp ? Math.max(10, rect.top - dropdownHeight - 4) : rect.bottom + 4,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 240) - 8)),
        width: Math.max(rect.width, 240),
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
        if (e.target.closest?.('.staff-picker-portal-popup')) return;
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

  // Group staff by role/position
  const groupedStaff = useMemo(() => {
    const groups = {};
    staffList.forEach(st => {
      const role = st.role_name || st.position || st.role || (t ? t('nav.staff', 'Nhân viên') : 'Nhân viên');
      if (!groups[role]) groups[role] = [];
      groups[role].push(st);
    });
    return groups;
  }, [staffList, t]);

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
        <div className="flex items-center gap-2 truncate">
          {selectedStaffObj ? (
            <>
              <Avatar
                src={selectedStaffObj.avatar_url}
                name={selectedStaffObj.full_name || selectedStaffObj.name}
                size={20}
                color="#3B82F6"
              />
              <span className="truncate text-slate-800 font-medium">
                {selectedStaffObj.full_name || selectedStaffObj.name}
              </span>
            </>
          ) : (
            <span className="text-slate-400 truncate font-normal">
              {placeholder || (t ? t('rooms_beds.select_staff', 'Chọn nhân viên') : 'Chọn nhân viên')}
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 stroke-[1.8] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Portal Popup Dropdown Panel */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="staff-picker-portal-popup bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left font-sans"
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
              placeholder={t ? t('appointments.search_staff_placeholder', 'tìm kiếm nhân viên...') : 'tìm kiếm nhân viên...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs font-medium outline-none text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
              autoFocus
            />
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto p-1.5 space-y-1">
            {/* Option to clear selection */}
            <button
              type="button"
              onClick={() => {
                onChange?.('');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 text-left py-1.5 px-2.5 rounded-lg hover:bg-slate-100 text-slate-400 text-xs transition-colors ${
                !value ? 'bg-blue-50 text-blue-600 font-semibold' : ''
              }`}
            >
              <span>— {t ? t('appointments.unassigned', 'Chưa phân công') : 'Chưa phân công'} —</span>
            </button>

            {Object.keys(groupedStaff).length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                {t ? t('appointments.search_no_results', 'Không có nhân viên nào') : 'Không có nhân viên nào'}
              </div>
            ) : (
              Object.entries(groupedStaff).map(([roleName, members]) => {
                const visibleMembers = members.filter(m =>
                  (m.full_name || m.name || '').toLowerCase().includes(search.toLowerCase())
                );
                if (visibleMembers.length === 0) return null;

                return (
                  <div key={roleName} className="space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1 bg-slate-50/50 rounded-md">
                      {roleName}
                    </div>
                    <div className="space-y-0.5">
                      {visibleMembers.map(m => {
                        const isSelected = m.id === value;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              onChange?.(m.id);
                              setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between text-left py-1.5 px-2.5 rounded-xl hover:bg-blue-50/80 transition-colors ${
                              isSelected ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Avatar src={m.avatar_url} name={m.full_name || m.name} size={22} color="#3B82F6" />
                              <span className="text-xs truncate">{m.full_name || m.name}</span>
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
