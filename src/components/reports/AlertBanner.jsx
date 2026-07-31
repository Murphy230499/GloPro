'use client';
import React from 'react';
import { AlertTriangle, Package, CreditCard, BellRing } from 'lucide-react';

export default function AlertBanner({ alerts = [] }) {
  if (!alerts || !alerts.length) return null;

  const iconMap = {
    PackageAlert: Package,
    CreditCard: CreditCard,
    AlertTriangle: AlertTriangle,
    BellRing: BellRing
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => {
        const IconComp = iconMap[alert.icon] || AlertTriangle;
        return (
          <div key={idx} className="bg-amber-50/90 rounded-2xl p-4 border border-amber-200/80 shadow-2xs flex items-start gap-3 text-amber-900">
            <div className="p-2 rounded-xl bg-amber-100/80 text-amber-700 shrink-0 mt-0.5">
              <IconComp className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-900">{alert.title}</h4>
              <p className="text-xs font-medium text-amber-700/90 mt-0.5">{alert.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
