'use client';
import React from 'react';
import { PackageOpen } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function EmptyCart({ subtitle }) {
  const { t } = useT();
  const defaultSubtitle = t('pos.empty_cart.subtitle', 'Chọn dịch vụ, sản phẩm hoặc gói để tạo đơn');
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <PackageOpen className="w-16 h-16 text-slate-200 mb-4" strokeWidth={1.2} />
      <p className="font-bold text-slate-400">{t('pos.ticket.empty_cart', 'Giỏ hàng trống')}</p>
      <p className="text-sm text-slate-300 mt-1 max-w-xs">{subtitle || defaultSubtitle}</p>
    </div>
  );
}