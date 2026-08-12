import { useT } from '@/lib/i18n';
import React, { useState } from 'react';
import { X, CheckSquare, ChevronDown } from 'lucide-react';
import Avatar from '@/components/Avatar';

export default function AddAdjustmentModal({ isOpen, onClose, onApply, staff }) {
  const { t } = useT();
  const [type, setType] = useState('bonus'); // 'bonus' or 'penalty'
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);

  if (!isOpen) return null;

  const groupedStaff = staff.reduce((acc, emp) => {
    const role = emp.role || t('staff.payroll.uncategorized', 'Chưa phân nhóm');
    if (!acc[role]) acc[role] = [];
    acc[role].push(emp);
    return acc;
  }, {});

  const handleToggleStaff = (id) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllStaff = () => {
    if (selectedStaffIds.length === staff.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(staff.map(s => s.id));
    }
  };

  const handleToggleStaffGroup = (members) => {
    const memberIds = members.map(m => m.id);
    const isAllSelected = memberIds.every(id => selectedStaffIds.includes(id));
    if (isAllSelected) {
      setSelectedStaffIds(prev => prev.filter(id => !memberIds.includes(id)));
    } else {
      const newIds = memberIds.filter(id => !selectedStaffIds.includes(id));
      setSelectedStaffIds(prev => [...prev, ...newIds]);
    }
  };

  const handleAmountChange = (e) => {
    // allow only numbers
    const val = e.target.value.replace(/\D/g, '');
    setAmount(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedStaffIds.length === 0) {
      alert(t('staff.payroll.err_select_staff', 'Vui lòng chọn ít nhất một nhân viên'));
      return;
    }
    if (!amount || parseInt(amount, 10) <= 0) {
      alert(t('staff.payroll.err_valid_amount', 'Vui lòng nhập số tiền hợp lệ'));
      return;
    }

    onApply({
      type,
      staffIds: selectedStaffIds,
      amount: parseInt(amount, 10),
      note
    });

    // Reset form
    setType('bonus');
    setAmount('');
    setNote('');
    setSelectedStaffIds([]);
    onClose();
  };

  const formatDisplayAmount = (val) => {
    if (!val) return '';
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-visible" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 font-sans">{t('staff.payroll.add_adj_title', 'Thêm thưởng / phạt')}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-visible space-y-4">
          
          {/* Type Selection */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-normal text-slate-500">{t('staff.payroll.adj_type', 'Loại điều chỉnh')}</label>
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-colors ${type === 'bonus' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <input type="radio" name="adjType" className="hidden" checked={type === 'bonus'} onChange={() => setType('bonus')} />
                <span className="text-xs font-semibold">{t('staff.payroll.bonus', 'Thưởng')}</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-colors ${type === 'penalty' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <input type="radio" name="adjType" className="hidden" checked={type === 'penalty'} onChange={() => setType('penalty')} />
                <span className="text-xs font-semibold">{t('staff.payroll.penalty', 'Phạt')}</span>
              </label>
            </div>
          </div>

          {/* Staff Selection */}
          <div className="space-y-1.5 relative animate-in fade-in duration-200">
            <label className="block text-[11px] font-normal text-slate-500">{t('staff.payroll.apply_for_staff', 'Áp dụng cho nhân viên')}</label>
            <button
              type="button"
              onClick={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-normal text-slate-700 focus:border-orange-500 shadow-sm"
            >
              <span className="truncate font-normal text-slate-600">
                {selectedStaffIds.length === 0 
                  ? t('staff.payroll.select_staff', 'Chọn nhân viên...') 
                  : selectedStaffIds.length === staff.length 
                    ? t('staff.payroll.all_staff', 'Tất cả nhân viên') 
                    : t('staff.payroll.selected_staff', 'Đã chọn {count} nhân viên').replace('{count}', selectedStaffIds.length)}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isStaffDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 flex flex-col max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Search Input */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border-b border-slate-100">
                  <input
                    type="text"
                    placeholder={t("staff.commission.search_staff", "tìm kiếm nhân viên...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs font-medium outline-none text-slate-700 placeholder:text-slate-400/50 placeholder:font-normal placeholder:lowercase"
                  />
                </div>
                {/* Scrollable list */}
                <div className="overflow-y-auto p-2 space-y-2">
                  {/* Select All */}
                  <button
                    type="button"
                    onClick={handleSelectAllStaff}
                    className="w-full flex items-center gap-2.5 text-left py-1.5 hover:bg-slate-50 rounded-lg transition-colors px-2"
                  >
                    <div className="shrink-0">
                      {selectedStaffIds.length === staff.length && staff.length > 0 ? (
                        <div className="w-4 h-4 rounded-md bg-orange-500 text-white flex items-center justify-center"><CheckSquare className="w-4 h-4" /></div>
                      ) : (
                        <div className="w-4 h-4 rounded-md border border-slate-300 bg-white" />
                      )}
                    </div>
                    <span className="text-xs font-normal text-slate-700">{t('staff.commission.select_all', 'Chọn tất cả')}</span>
                  </button>

                  {/* Groups and targets */}
                  {Object.entries(groupedStaff).map(([roleName, members]) => {
                    const visibleMembers = members.filter(m => m.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
                    if (visibleMembers.length === 0) return null;

                    const isGroupAllSelected = visibleMembers.every(m => selectedStaffIds.includes(m.id));

                    return (
                      <div key={roleName} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStaffGroup(visibleMembers)}
                          className="w-full flex items-center gap-2.5 text-left py-1 hover:bg-slate-50 rounded-lg transition-colors px-2"
                        >
                          <div className="shrink-0">
                            {isGroupAllSelected ? (
                              <div className="w-4 h-4 rounded-md bg-orange-500 text-white flex items-center justify-center"><CheckSquare className="w-4 h-4" /></div>
                            ) : (
                              <div className="w-4 h-4 rounded-md border border-slate-300 bg-white" />
                            )}
                          </div>
                          <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">{roleName}</span>
                        </button>
                        
                        <div className="space-y-0.5 pl-4">
                          {visibleMembers.map(m => {
                            const isSelected = selectedStaffIds.includes(m.id);
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleToggleStaff(m.id)}
                                className={`w-full flex items-center gap-2.5 text-left py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors ${isSelected ? 'bg-slate-100/60 font-medium' : ''}`}
                              >
                                <div className="shrink-0">
                                  {isSelected ? (
                                    <div className="w-4 h-4 rounded-md bg-orange-500 text-white flex items-center justify-center"><CheckSquare className="w-3.5 h-3.5" /></div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-md border border-slate-200 bg-white" />
                                  )}
                                </div>
                                <Avatar src={m.avatar_url} name={m.full_name} size={20} color={m.avatar_color} />
                                <span className="text-xs font-normal text-slate-700">{m.full_name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-normal text-slate-500">{t('staff.payroll.amount', 'Số tiền (VNĐ)')}</label>
            <div className="relative">
              <input 
                type="text" 
                value={formatDisplayAmount(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-orange-500 text-slate-700 bg-white pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">đ</span>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-normal text-slate-500">{t('staff.payroll.note_optional', 'Ghi chú (tùy chọn)')}</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("staff.payroll.enter_reason", "Nhập lý do...")}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-orange-500 text-slate-700 bg-white resize-none"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0 font-sans">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans"
          >
            {t('staff.scheduler.cancel', 'Hủy')}
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans"
          >
            {t('staff.commission.apply_btn', 'Áp dụng')}
          </button>
        </div>

      </div>
    </div>
  );
}
