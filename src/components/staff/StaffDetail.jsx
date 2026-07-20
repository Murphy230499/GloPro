'use client';
import React, { useState, useEffect } from 'react';
import { X, User, Calendar, DollarSign, Award, Percent, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import Avatar from '@/components/Avatar';
import { calculateItemCommission } from '@/lib/commissionHelper';

export default function StaffDetail({ staff, onClose }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [services, setServices] = useState([]);
  const [commissionRules, setCommissionRules] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStaffData = async () => {
      try {
        const [svcs, rules, invs, scheds, tmpls] = await Promise.all([
          base44.entities.Service.filter({ is_active: true }),
          base44.entities.StaffCommissionRule.list(),
          base44.entities.Invoice.list(),
          base44.entities.StaffSchedule.filter({ staff_id: staff.id }),
          base44.entities.ShiftTemplate.list()
        ]);
        setServices(svcs);
        setCommissionRules(rules);
        setInvoices(invs);
        setSchedules(scheds.sort((a, b) => b.date.localeCompare(a.date)));
        setTemplates(tmpls);
      } catch (e) {
        console.error('Lỗi tải dữ liệu chi tiết nhân viên:', e);
      }
      setLoading(false);
    };
    loadStaffData();
  }, [staff.id]);

  // Compute actual commissions for this staff member
  const computeCommissionsList = () => {
    const list = [];
    let totalRevenue = 0;
    let totalEarned = 0;

    invoices.forEach(inv => {
      if (inv.status !== 'paid') return;
      (inv.items || []).forEach(it => {
        if (it.staff_id === staff.id) {
          const itemPrice = it.price || 0;
          const qty = it.qty || 1;
          const revenue = itemPrice * qty;
          totalRevenue += revenue;

          // Compute using the unified helper
          const { earned, ruleLabel } = calculateItemCommission(it, commissionRules, inv.created_at || inv.date);

          totalEarned += earned;
          list.push({
            date: inv.date || '',
            invoiceCode: inv.invoice_code || '—',
            customerName: inv.customer_name || 'Khách vãng lai',
            itemName: it.name,
            itemType: it.type === 'service' ? 'Dịch vụ' : it.type === 'product' ? 'Sản phẩm' : 'Gói/Combo',
            price: itemPrice,
            qty,
            revenue,
            ruleLabel,
            earned
          });
        }
      });
    });

    return { items: list, totalRevenue, totalEarned };
  };

  const commData = computeCommissionsList();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/45 backdrop-blur-xs" onClick={onClose}>
      <div className="relative bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Block */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <Avatar src={staff.avatar_url} name={staff.full_name} size={54} color={staff.avatar_color} />
            <div>
              <h2 className="text-base font-bold text-slate-800">{staff.full_name}</h2>
              <p className="text-xs text-slate-400 capitalize font-semibold mt-0.5">{staff.role}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                  {staff.can_be_booked ? 'Nhận lịch hẹn' : 'Không nhận lịch'}
                </span>
                {staff.can_be_booked && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    Max: {staff.max_concurrent_bookings} lịch/giờ
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shadow-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-6 shrink-0 bg-white">
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === 'profile' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
          >
            <User className="w-3.5 h-3.5 inline mr-1" /> Hồ sơ & Chuyên môn
          </button>
          <button 
            onClick={() => setActiveTab('schedule')} 
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === 'schedule' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
          >
            <Calendar className="w-3.5 h-3.5 inline mr-1" /> Lịch làm việc
          </button>
          <button 
            onClick={() => setActiveTab('commission')} 
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === 'commission' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
          >
            <DollarSign className="w-3.5 h-3.5 inline mr-1" /> Doanh số & Hoa hồng
          </button>
        </div>

        {/* Tab Contents - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading ? (
            <div className="text-center py-20"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" /></div>
          ) : (
            <>
              {/* Tab 1: Profile & Specialties */}
              {activeTab === 'profile' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Số điện thoại</div>
                      <div className="text-sm font-bold text-slate-700 mt-1">{staff.phone || 'Chưa cung cấp'}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Lương cơ bản</div>
                      <div className="text-sm font-bold text-slate-700 mt-1">{formatVND(staff.base_salary || 0)}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Award className="w-4 h-4 text-purple-500" /> Mô tả chuyên môn</h3>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed">
                      {staff.specialties || 'Chưa có mô tả chuyên môn cụ thể.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-purple-500" /> Danh sách dịch vụ được phép thực hiện ({staff.service_ids?.length || 0})</h3>
                    {(!staff.service_ids || staff.service_ids.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">Chưa cấu hình dịch vụ chuyên môn cho nhân sự này.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {services.filter(s => staff.service_ids.includes(s.id)).map(s => (
                          <div key={s.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700 truncate">
                            {s.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Personal Schedule List */}
              {activeTab === 'schedule' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-slate-800 mb-2">Lịch xếp ca gần đây</h3>
                  {schedules.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">Nhân viên này chưa được xếp ca làm việc nào.</div>
                  ) : (
                    <div className="space-y-2">
                      {schedules.slice(0, 15).map(s => {
                        let label = 'Nghỉ';
                        let badgeStyle = 'bg-slate-100 text-slate-500';
                        if (s.is_off) {
                          const typeLabel = s.off_type === 'vacation' ? 'Nghỉ phép' : s.off_type === 'sick' ? 'Nghỉ ốm' : 'Nghỉ';
                          label = typeLabel;
                          badgeStyle = 'bg-red-50 text-red-600 border border-red-100';
                        } else {
                          const matched = templates.find(t => t.id === s.shift_template_id);
                          label = matched ? `${matched.name} (${matched.start_time} - ${matched.end_time})` : 'Ca làm';
                          badgeStyle = 'bg-purple-50 text-purple-700 border border-purple-100';
                        }

                        return (
                          <div key={s.id} className="flex justify-between items-center p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                            <span className="text-xs font-bold text-slate-700">{s.date.split('-').reverse().join('/')}</span>
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${badgeStyle}`}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Sales & Commission List */}
              {activeTab === 'commission' && (
                <div className="space-y-5">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng Doanh số thực hiện</div>
                      <div className="text-base font-bold text-slate-800 mt-1">{formatVND(commData.totalRevenue)}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Hoa hồng tích lũy</div>
                      <div className="text-base font-bold text-purple-600 mt-1">{formatVND(commData.totalEarned)}</div>
                    </div>
                  </div>

                  {/* List of items */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-slate-800">Lịch sử đơn hàng hoàn thành ({commData.items.length})</h3>
                    {commData.items.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">Chưa ghi nhận doanh số bán hàng nào của nhân sự này.</div>
                    ) : (
                      <div className="space-y-3">
                        {commData.items.map((item, idx) => (
                          <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-2">
                            <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
                              <span className="font-bold text-slate-400">HĐ: {item.invoiceCode}</span>
                              <span className="text-[10px] text-slate-400">{item.date.split('-').reverse().join('/')}</span>
                            </div>
                            
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-xs font-bold text-slate-800">{item.itemName}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Khách hàng: {item.customerName} • Qty: {item.qty}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-slate-700">{formatVND(item.revenue)}</div>
                                <div className="text-[10px] text-purple-500 font-bold mt-0.5">Hoa hồng: {item.ruleLabel}</div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center bg-purple-50/50 p-2 rounded-xl text-xs font-bold border border-purple-50/60 mt-1">
                              <span className="text-purple-600">Hoa hồng nhận:</span>
                              <span className="text-purple-700">{formatVND(item.earned)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
