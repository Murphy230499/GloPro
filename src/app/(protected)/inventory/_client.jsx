'use client';

import dynamic from 'next/dynamic';

const InventoryView = dynamic(() => import('@/views/Inventory'), { ssr: false });

export default function InventoryClientPage() {
  return <InventoryView />;
}
