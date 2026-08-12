'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { X, Gift, MapPin, Tag, ShoppingCart, Clock, TrendingUp, Users, Activity, CheckCircle2 } from 'lucide-react';
import { formatVND, formatDate } from '@/lib/format';
import { useBranch } from '@/lib/BranchContext';
import { useT } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import Avatar from '@/components/Avatar';

const SCOPES = {
  service: 'Chỉ dịch vụ',
  product: 'Chỉ sản phẩm',
  invoice: 'Toàn hóa đơn'
};

export default function PromoDetailModal({ promo, usages, onClose }) {
  const { t } = useT();
  const { branches } = useBranch();

  const getScopeLabel = (type) => {
    if (type === 'service') return t('discounts.scope_service', 'Chỉ dịch vụ');
    if (type === 'product') return t('discounts.scope_product', 'Chỉ sản phẩm');
    return t('discounts.scope_invoice', 'Toàn hóa đơn');
  };
  const [customers, setCustomers] = useState([]);
  const [giftedList, setGiftedList] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('gifted'); // 'gifted' | 'usages'

  useEffect(() => {
    base44.entities.Customer.list().then((custList) => {
      const cList = custList || [];
      setCustomers(cList);

      try {
        const giftsMap = JSON.parse(localStorage.getItem('glopro_customer_gifts') || '{}');
        const list = [];
        Object.entries(giftsMap).forEach(([custId, items]) => {
          if (Array.isArray(items)) {
            items.forEach(g => {
              if (String(g.promo_id) === String(promo.id)) {
                const c = cList.find(x => String(x.id) === String(custId));
                list.push({
                  customer_id: custId,
                  customer_name: c ? c.name : 'Khách hàng',
                  customer_phone: c ? c.phone : '—',
                  customer_avatar: c ? c.avatar_url : null,
                  assigned_at: g.assigned_at,
                  used: !!g.used,
                  invoice_code: g.invoice_code || null
                });
              }
            });
          }
        });
        list.sort((a, b) => new Date(b.assigned_at || 0) - new Date(a.assigned_at || 0));
        setGiftedList(list);
      } catch (e) {}
    }).catch(() => {});
  }, [promo.id]);

  // Filter usages specific to this promo
  const promoUsages = useMemo(() => {
    if (!promo || !usages) return [];
    return usages.filter(u => String(u.promo_id) === String(promo.id));
  }, [usages, promo]);

  if (!promo) return null;

  const getBranchName = (id) => {
    if (!id) return 'Không xác định';
    const b = branches.find(br => String(br.id) === String(id));
    return b ? b.name : 'Không xác định';
  };

  const isSoldOut = promo.usageLimit && promoUsages.length >= promo.usageLimit;
  const today = new Date().toISOString().split('T')[0];
  const isPast = promo.expiryDate && today > promo.expiryDate;
  const isUpcoming = promo.startDate && today < promo.startDate;

  let statusBadge = (
    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs px-2.5 py-1 rounded-full font-medium uppercase">
      {t('discounts.status_ongoing', 'Đang diễn ra')}
    </span>
  );
  if (isUpcoming) {
    statusBadge = (
      <span className="bg-blue-50 text-blue-600 border border-blue-100 text-xs px-2.5 py-1 rounded-full font-medium uppercase">
        {t('discounts.status_upcoming', 'Sắp diễn ra')}
      </span>
    );
  } else if (isPast) {
    statusBadge = (
      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-xs px-2.5 py-1 rounded-full font-medium uppercase">
        {t('discounts.status_completed', 'Đã hoàn thành')}
      </span>
    );
  } else if (isSoldOut) {
    statusBadge = (
      <span className="bg-amber-50 text-amber-600 border border-amber-100 text-xs px-2.5 py-1 rounded-full font-medium uppercase">
        {t('discounts.status_sold_out', 'Hết lượt')}
      </span>
    );
  }

  // Dashboard Metrics calculations
  const totalQuantity = promo.usageLimit || null;
  const usedQuantity = promoUsages.length;
  const unusedQuantity = totalQuantity ? totalQuantity - usedQuantity : null;
  
  const totalCost = promoUsages.reduce((sum, u) => sum + (Number(u.discount_amount) || 0), 0);
  const totalRevenue = promoUsages.reduce((sum, u) => sum + (Number(u.invoice_total) || 0), 0);

  // Calculate new vs old customers (unique)
  const uniqueCustomerIds = [...new Set(promoUsages.map(u => u.customer_id).filter(Boolean))];
  let newCustomerCount = 0;
  let returningCustomerCount = 0;

  uniqueCustomerIds.forEach(id => {
    const cust = customers.find(c => String(c.id) === String(id));
    if (cust && cust.visitCount > 1) {
      returningCustomerCount++;
    } else {
      newCustomerCount++;
    }
  });

  const giftedUsedCount = giftedList.filter(g => g.used).length;
  const giftedUnusedCount = giftedList.length - giftedUsedCount;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-3xl w-full mx-3 md:mx-0 md:max-w-5xl max-h-[82vh] md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
              <Gift className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-lg text-slate-800">{promo.name}</h2>
              <div className="text-xs text-slate-500 font-normal mt-0.5">{t('discounts.type', 'Loại:')} <span className="text-pink-600 font-normal bg-pink-50 px-1.5 py-0.5 rounded">{t('discounts.gift_promo', 'CTKM Tặng khách')}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Dashboard Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-pink-50 rounded-2xl p-3.5 border border-pink-100 flex flex-col items-start gap-1">
              <div className="text-pink-500 bg-pink-100 w-7 h-7 rounded-full flex items-center justify-center mb-0.5"><Gift className="w-3.5 h-3.5" /></div>
              <div className="text-[11px] font-normal text-pink-600">{t('discounts.gifted_to_customers', 'Đã tặng cho khách')}</div>
              <div className="text-base font-semibold text-pink-700">{giftedList.length} <span className="text-xs font-normal">{t('discounts.turns', 'lượt')}</span></div>
              <div className="text-[10px] text-pink-600/80 mt-0.5 truncate font-normal">{t('discounts.used', 'Dùng:')} {giftedUsedCount} • {t('discounts.unused', 'Chưa dùng:')} {giftedUnusedCount}</div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-100 flex flex-col items-start gap-1">
              <div className="text-emerald-500 bg-emerald-100 w-7 h-7 rounded-full flex items-center justify-center mb-0.5"><Activity className="w-3.5 h-3.5" /></div>
              <div className="text-[11px] font-normal text-emerald-600">{t('discounts.pos_usage_total', 'Sử dụng POS / Tổng')}</div>
              <div className="text-base font-semibold text-emerald-700">{usedQuantity} <span className="text-xs font-normal">/ {totalQuantity || '∞'}</span></div>
              <div className="text-[10px] text-emerald-600/80 mt-0.5 truncate font-normal">{t('discounts.unused', 'Chưa dùng:')} {unusedQuantity !== null ? unusedQuantity : '—'}</div>
            </div>
            
            <div className="bg-blue-50 rounded-2xl p-3.5 border border-blue-100 flex flex-col items-start gap-1">
              <div className="text-blue-500 bg-blue-100 w-7 h-7 rounded-full flex items-center justify-center mb-0.5"><TrendingUp className="w-3.5 h-3.5" /></div>
              <div className="text-[11px] font-normal text-blue-600">{t('discounts.generated_revenue', 'Doanh thu đem về')}</div>
              <div className="text-base font-semibold text-blue-700">{formatVND(totalRevenue)}</div>
              <div className="text-[10px] text-blue-600/80 mt-0.5 truncate font-normal">{t('discounts.cost', 'Chi phí:')} {formatVND(totalCost)}</div>
            </div>

            <div className="bg-purple-50 rounded-2xl p-3.5 border border-purple-100 flex flex-col items-start gap-1">
              <div className="text-purple-500 bg-purple-100 w-7 h-7 rounded-full flex items-center justify-center mb-0.5"><Users className="w-3.5 h-3.5" /></div>
              <div className="text-[11px] font-normal text-purple-600">{t('discounts.new_customers', 'Khách hàng mới')}</div>
              <div className="text-base font-semibold text-purple-700">{newCustomerCount}</div>
              <div className="text-[10px] text-purple-600/80 mt-0.5 truncate font-normal">{t('discounts.first_time_users', 'Khách dùng lần đầu')}</div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-100 flex flex-col items-start gap-1">
              <div className="text-amber-500 bg-amber-100 w-7 h-7 rounded-full flex items-center justify-center mb-0.5"><Users className="w-3.5 h-3.5" /></div>
              <div className="text-[11px] font-normal text-amber-600">{t('discounts.returning_customers', 'Khách hàng cũ')}</div>
              <div className="text-base font-semibold text-amber-700">{returningCustomerCount}</div>
              <div className="text-[10px] text-amber-600/80 mt-0.5 truncate font-normal">{t('discounts.returning_users', 'Khách quay lại')}</div>
            </div>
          </div>
          
          {/* Section 1: Promo Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Tag className="w-4 h-4 text-slate-400" /> {t('discounts.promo_info', 'Thông tin khuyến mãi')}</h3>
              
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-slate-500 font-normal">{t('discounts.discount_level', 'Mức giảm:')}</div>
                <div className="font-normal text-slate-800">{promo.valueType === 'percent' ? `${promo.value}%` : formatVND(promo.value)}</div>
                
                <div className="text-slate-500 font-normal">{t('discounts.scope', 'Phạm vi áp dụng:')}</div>
                <div className="font-normal text-slate-700">{getScopeLabel(promo.type)}</div>
                
                <div className="text-slate-500 font-normal">{t('discounts.min_spend_label', 'Đơn tối thiểu:')}</div>
                <div className="font-normal text-slate-700">{promo.minSpend ? formatVND(promo.minSpend) : t('discounts.no_requirement', 'Không yêu cầu')}</div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {t('discounts.validity_limits', 'Hiệu lực & Giới hạn')}</h3>
              
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-slate-500 font-normal">{t('discounts.duration', 'Thời gian:')}</div>
                <div className="font-normal text-slate-700">{promo.startDate || '—'} {t('discounts.to', 'đến')} {promo.expiryDate || '—'}</div>
                
                <div className="text-slate-500 font-normal">{t('discounts.quantity_used', 'Số lượng đã dùng:')}</div>
                <div className="font-normal text-slate-700">
                  <span className="text-pink-600 font-medium">{promoUsages.length}</span> / {promo.usageLimit || '∞'}
                </div>

                {promo.isAdvancedTime && (
                  <>
                    <div className="text-slate-500 font-normal">{t('discounts.time_frame', 'Khung giờ:')}</div>
                    <div className="font-normal text-slate-700">{promo.timeStart} - {promo.timeEnd}</div>
                    
                    <div className="text-slate-500 font-normal">{t('discounts.repeat', 'Lặp lại:')}</div>
                    <div className="font-normal text-slate-700">
                      {promo.timeType === 'daily' ? t('discounts.daily', 'Hàng ngày') : promo.timeType === 'weekly' ? t('discounts.weekly', 'Hàng tuần') : t('discounts.monthly', 'Hàng tháng')}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Sub-tabs (Gifted Customers vs POS Usage) */}
          <div className="space-y-4">
            <div className="flex border-b border-slate-200 gap-6">
              <button
                onClick={() => setActiveSubTab('gifted')}
                className={`pb-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeSubTab === 'gifted'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Gift className="w-4 h-4" /> {t('discounts.gifted_list', 'Danh sách khách hàng đã tặng')} ({giftedList.length})
              </button>
              <button
                onClick={() => setActiveSubTab('usages')}
                className={`pb-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeSubTab === 'usages'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <ShoppingCart className="w-4 h-4" /> {t('discounts.pos_usage', 'Lượt sử dụng đơn hàng tại POS')} ({promoUsages.length})
              </button>
            </div>

            {/* TAB 1: GIFTED CUSTOMERS LIST */}
            {activeSubTab === 'gifted' && (
              giftedList.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400 font-normal">
                  {t('discounts.no_gifted', 'Chưa tặng khuyến mãi này cho khách hàng nào.')}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm font-normal">
                    <thead className="bg-slate-50 text-slate-500 font-normal text-xs border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-medium">{t('discounts.customer', 'Khách hàng')}</th>
                        <th className="px-4 py-3 font-medium">{t('discounts.phone', 'Số điện thoại')}</th>
                        <th className="px-4 py-3 font-medium">{t('discounts.date_gifted', 'Ngày tặng')}</th>
                        <th className="px-4 py-3 text-center font-medium">{t('discounts.usage_status', 'Trạng thái sử dụng')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {giftedList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar src={item.customer_avatar} name={item.customer_name} size={32} color="#FF6B9D" />
                              <span className="font-normal text-slate-800">{item.customer_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs font-normal">{item.customer_phone}</td>
                          <td className="px-4 py-3 text-slate-600 font-normal">{item.assigned_at ? formatDate(item.assigned_at.split('T')[0]) : '—'}</td>
                          <td className="px-4 py-3 text-center">
                            {item.used ? (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs px-2.5 py-0.5 rounded-full font-normal">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {t('discounts.used', 'Đã sử dụng')} {item.invoice_code && `(${item.invoice_code})`}
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs px-2.5 py-0.5 rounded-full font-normal">
                                {t('discounts.unused', 'Chưa sử dụng')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* TAB 2: POS USAGE HISTORY */}
            {activeSubTab === 'usages' && (
              promoUsages.length === 0 ? (
                <div className="text-center py-10 text-sm text-slate-400 font-normal">
                  {t('discounts.no_pos_usage', 'Chưa có lượt sử dụng nào tại POS cho CTKM này.')}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm font-normal">
                    <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200 font-medium">
                      <tr>
                        <th className="px-4 py-3 font-medium">{t('discounts.customer', 'Khách hàng')}</th>
                        <th className="px-4 py-3 font-medium">{t('discounts.invoice_code', 'Mã hóa đơn')}</th>
                        <th className="px-4 py-3 font-medium">{t('discounts.date_used', 'Ngày sử dụng')}</th>
                        <th className="px-4 py-3 text-right font-medium">{t('discounts.cost_discount', 'Chi phí (Giảm)')}</th>
                        <th className="px-4 py-3 text-right font-medium">{t('discounts.revenue', 'Doanh thu')}</th>
                        <th className="px-4 py-3 font-medium">{t('discounts.branch', 'Chi nhánh')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {promoUsages.map((usage, idx) => (
                        <tr key={usage.id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-normal text-slate-700">{usage.customer_name}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-normal">{usage.invoice_code}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-normal">{usage.date ? formatDate(usage.date) : '—'}</td>
                          <td className="px-4 py-3 text-right font-normal text-pink-600">
                            {formatVND(usage.discount_amount)}
                          </td>
                          <td className="px-4 py-3 text-right font-normal text-blue-600">
                            {formatVND(usage.invoice_total)}
                          </td>
                          <td className="px-4 py-3 text-slate-600 flex items-center gap-1.5 font-normal">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[120px]">{getBranchName(usage.branch_id)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
