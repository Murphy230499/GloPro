'use client';

import dynamic from 'next/dynamic';

const CashFlowView = dynamic(() => import('@/views/CashFlow'), { ssr: false });

export default function CashFlowClientPage() {
  return <CashFlowView />;
}
