'use client';
import React, { useState } from 'react';
import { Award, Scissors, Package, Users, UserSquare } from 'lucide-react';
import TopRevenueList from '@/components/TopRevenueList';
import { useT } from '@/lib/i18n';

export default function TopRevenueRankingsWidget({ tops = {}, size = 'large', tintColor = '#FF3B7A' }) {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState('services'); // 'services' | 'products' | 'staff' | 'customers'

  const isLarge = size === 'large';

  // Render dạng Full 4 bảng (khi widget chọn size Large)
  if (isLarge) {
    return (
      <div className="ios-glass-card p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tintColor}15`, color: tintColor }}>
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base md:text-lg">
              {t('dashboard.top_rankings_title', 'Bảng Xếp Hạng Top Doanh Thu')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {t('dashboard.top_rankings_sub', 'Dịch vụ, sản phẩm, nhân viên và khách hàng chi tiêu nhiều nhất')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs">
            <h4 className="font-bold text-xs md:text-sm text-slate-700 mb-3 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-pink-500" />
              {t('dashboard.top_service_rev', 'Top Dịch vụ')}
            </h4>
            <TopRevenueList items={tops.services} colorFrom="from-pink-400" colorTo="to-rose-500" emptyText={t('common.no_data', 'Chưa có dữ liệu')} />
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs">
            <h4 className="font-bold text-xs md:text-sm text-slate-700 mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              {t('dashboard.top_product_rev', 'Top Sản phẩm')}
            </h4>
            <TopRevenueList items={tops.products} colorFrom="from-emerald-400" colorTo="to-teal-500" emptyText={t('common.no_data', 'Chưa có dữ liệu')} />
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs">
            <h4 className="font-bold text-xs md:text-sm text-slate-700 mb-3 flex items-center gap-1.5">
              <UserSquare className="w-3.5 h-3.5 text-amber-500" />
              {t('dashboard.top_staff_rev', 'Top Nhân viên')}
            </h4>
            <TopRevenueList items={tops.staff} colorFrom="from-amber-400" colorTo="to-orange-500" emptyText={t('common.no_data', 'Chưa có dữ liệu')} />
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs">
            <h4 className="font-bold text-xs md:text-sm text-slate-700 mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              {t('dashboard.top_customer_rev', 'Top Khách hàng')}
            </h4>
            <TopRevenueList items={tops.customers} colorFrom="from-blue-400" colorTo="to-indigo-500" emptyText={t('common.no_data', 'Chưa có dữ liệu')} />
          </div>
        </div>
      </div>
    );
  }

  // Render dạng Tab thu gọn (khi widget chọn size Medium)
  return (
    <div className="ios-glass-card p-4 md:p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tintColor}15`, color: tintColor }}>
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">
              Top Doanh Thu Đầu Bảng
            </h3>
            <p className="text-[11px] text-slate-400">
              Bảng xếp hạng đóng góp doanh thu
            </p>
          </div>
        </div>

        {/* Tab chuyển đổi danh mục */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-2 py-1 rounded-lg transition-all ${activeTab === 'services' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'}`}
          >
            Dịch vụ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-2 py-1 rounded-lg transition-all ${activeTab === 'products' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'}`}
          >
            Sản phẩm
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-2 py-1 rounded-lg transition-all ${activeTab === 'staff' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'}`}
          >
            Thợ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-2 py-1 rounded-lg transition-all ${activeTab === 'customers' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'}`}
          >
            Khách
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[220px] pt-1">
        {activeTab === 'services' && (
          <TopRevenueList items={tops.services} colorFrom="from-pink-400" colorTo="to-rose-500" emptyText={t('common.no_data', 'Chưa có dữ liệu')} />
        )}
        {activeTab === 'products' && (
          <TopRevenueList items={tops.products} colorFrom="from-emerald-400" colorTo="to-teal-500" emptyText={t('common.no_data', 'Chưa có dữ liệu')} />
        )}
        {activeTab === 'staff' && (
          <TopRevenueList items={tops.staff} colorFrom="from-amber-400" colorTo="to-orange-500" emptyText={t('common.no_data', 'Chưa có dữ liệu')} />
        )}
        {activeTab === 'customers' && (
          <TopRevenueList items={tops.customers} colorFrom="from-blue-400" colorTo="to-indigo-500" emptyText={t('common.no_data', 'Chưa có dữ liệu')} />
        )}
      </div>
    </div>
  );
}
