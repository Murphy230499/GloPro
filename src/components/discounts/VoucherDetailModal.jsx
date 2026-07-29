'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { X, Calendar, Ticket, Percent, MapPin, Tag, ShoppingCart, Clock, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { formatVND, formatDate } from '@/lib/format';
import { useBranch } from '@/lib/BranchContext';
import { base44 } from '@/api/base44Client';

const SCOPES = {
  service: 'Chỉ dịch vụ',
  product: 'Chỉ sản phẩm',
  invoice: 'Toàn hóa đơn'
};

export default function VoucherDetailModal({ voucher, usages, onClose }) {
  const { branches } = useBranch();
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    base44.entities.Customer.list().then(setCustomers).catch(() => {});
  }, []);

  // Filter usages specific to this voucher
  const voucherUsages = useMemo(() => {
    if (!voucher || !usages) return [];
    return usages.filter(u => String(u.voucher_code || u.code) === String(voucher.code));
  }, [usages, voucher]);

  if (!voucher) return null;

  const getBranchName = (id) => {
    if (!id) return 'Không xác định';
    const b = branches.find(br => String(br.id) === String(id));
    return b ? b.name : 'Không xác định';
  };

  const isSoldOut = voucher.quantity && voucherUsages.length >= voucher.quantity;
  const today = new Date().toISOString().split('T')[0];
  const isPast = voucher.expiryDate && today > voucher.expiryDate;
  const isUpcoming = voucher.startDate && today < voucher.startDate;

  let statusBadge = (
    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs px-2.5 py-1 rounded-full font-medium uppercase">
      Đang diễn ra
    </span>
  );
  if (isUpcoming) {
    statusBadge = (
      <span className="bg-blue-50 text-blue-600 border border-blue-100 text-xs px-2.5 py-1 rounded-full font-medium uppercase">
        Sắp diễn ra
      </span>
    );
  } else if (isPast) {
    statusBadge = (
      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-xs px-2.5 py-1 rounded-full font-medium uppercase">
        Đã hoàn thành
      </span>
    );
  } else if (isSoldOut) {
    statusBadge = (
      <span className="bg-amber-50 text-amber-600 border border-amber-100 text-xs px-2.5 py-1 rounded-full font-medium uppercase">
        Hết lượt
      </span>
    );
  }

  // Dashboard Metrics calculations
  const totalQuantity = voucher.quantity || null;
  const usedQuantity = voucherUsages.length;
  const unusedQuantity = totalQuantity ? totalQuantity - usedQuantity : null;
  const expiredQuantity = isPast && totalQuantity ? unusedQuantity : 0;
  
  const totalCost = voucherUsages.reduce((sum, u) => sum + (Number(u.discount_amount) || 0), 0);
  const totalRevenue = voucherUsages.reduce((sum, u) => sum + (Number(u.invoice_total) || 0), 0);

  // Calculate new vs old customers (unique)
  const uniqueCustomerIds = [...new Set(voucherUsages.map(u => u.customer_id).filter(Boolean))];
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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
              <Ticket className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-lg text-slate-800">{voucher.name || voucher.code}</h2>
              <div className="text-xs text-slate-500 font-normal mt-0.5">Mã Voucher: <span className="text-pink-600 font-normal bg-pink-50 px-1.5 py-0.5 rounded">{voucher.code}</span></div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col items-start gap-1">
              <div className="text-emerald-500 bg-emerald-100 w-8 h-8 rounded-full flex items-center justify-center mb-1"><Activity className="w-4 h-4" /></div>
              <div className="text-xs font-normal text-emerald-600">Đã sử dụng / Tổng</div>
              <div className="text-lg font-semibold text-emerald-700">{usedQuantity} <span className="text-sm font-normal opacity-70">/ {totalQuantity || '∞'}</span></div>
              <div className="text-[10px] text-emerald-600/80 mt-1 font-normal">Chưa dùng: {unusedQuantity !== null ? unusedQuantity : '—'} • Hết hạn: {expiredQuantity}</div>
            </div>
            
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex flex-col items-start gap-1">
              <div className="text-blue-500 bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mb-1"><TrendingUp className="w-4 h-4" /></div>
              <div className="text-xs font-normal text-blue-600">Doanh thu đem về</div>
              <div className="text-lg font-semibold text-blue-700">{formatVND(totalRevenue)}</div>
              <div className="text-[10px] text-blue-600/80 mt-1 font-normal">Chi phí (giảm giá): {formatVND(totalCost)}</div>
            </div>

            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 flex flex-col items-start gap-1">
              <div className="text-purple-500 bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center mb-1"><Users className="w-4 h-4" /></div>
              <div className="text-xs font-normal text-purple-600">Khách hàng mới</div>
              <div className="text-lg font-semibold text-purple-700">{newCustomerCount}</div>
              <div className="text-[10px] text-purple-600/80 mt-1 font-normal">Lần đầu sử dụng dịch vụ</div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex flex-col items-start gap-1">
              <div className="text-amber-500 bg-amber-100 w-8 h-8 rounded-full flex items-center justify-center mb-1"><Users className="w-4 h-4" /></div>
              <div className="text-xs font-normal text-amber-600">Khách hàng cũ</div>
              <div className="text-lg font-semibold text-amber-700">{returningCustomerCount}</div>
              <div className="text-[10px] text-amber-600/80 mt-1 font-normal">Khách quay lại</div>
            </div>
          </div>
          
          {/* Section 1: Voucher Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Tag className="w-4 h-4 text-slate-400" /> Thông tin voucher</h3>
              
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-slate-500 font-normal">Mức giảm:</div>
                <div className="font-normal text-slate-800">{voucher.valueType === 'percent' ? `${voucher.value}%` : formatVND(voucher.value)}</div>
                
                <div className="text-slate-500 font-normal">Phạm vi áp dụng:</div>
                <div className="font-normal text-slate-700">{SCOPES[voucher.type] || 'Toàn hóa đơn'}</div>
                
                <div className="text-slate-500 font-normal">Mục tiêu:</div>
                <div className="font-normal text-slate-700">
                  {voucher.targetAudience === 'new_customer' ? 'Khách mới' : voucher.targetAudience === 'returning_customer' ? 'Khách cũ' : 'Tất cả khách hàng'}
                </div>

                <div className="text-slate-500 font-normal">Đơn tối thiểu:</div>
                <div className="font-normal text-slate-700">{voucher.minSpend ? formatVND(voucher.minSpend) : 'Không yêu cầu'}</div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> Hiệu lực & Giới hạn</h3>
              
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-slate-500 font-normal">Thời gian:</div>
                <div className="font-normal text-slate-700">{voucher.startDate || '—'} đến {voucher.expiryDate || '—'}</div>
                
                <div className="text-slate-500 font-normal">Số lượng đã dùng:</div>
                <div className="font-normal text-slate-700">
                  <span className="text-pink-600 font-medium">{voucherUsages.length}</span> / {voucher.quantity || '∞'}
                </div>

                {voucher.isAdvancedTime && (
                  <>
                    <div className="text-slate-500 font-normal">Khung giờ:</div>
                    <div className="font-normal text-slate-700">{voucher.timeStart} - {voucher.timeEnd}</div>
                    
                    <div className="text-slate-500 font-normal">Lặp lại:</div>
                    <div className="font-normal text-slate-700">
                      {voucher.timeType === 'daily' ? 'Hàng ngày' : voucher.timeType === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Usage History */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ShoppingCart className="w-4 h-4 text-pink-500" /> Lịch sử sử dụng
            </h3>

            {voucherUsages.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400 font-normal">
                Chưa có khách hàng nào sử dụng voucher này.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm font-normal">
                  <thead className="bg-slate-50 text-slate-500 font-medium text-xs border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Khách hàng</th>
                      <th className="px-4 py-3 font-medium">Mã hóa đơn</th>
                      <th className="px-4 py-3 font-medium">Ngày sử dụng</th>
                      <th className="px-4 py-3 text-right font-medium">Chi phí (Giảm)</th>
                      <th className="px-4 py-3 text-right font-medium">Doanh thu</th>
                      <th className="px-4 py-3 font-medium">Chi nhánh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {voucherUsages.map((usage, idx) => (
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
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
