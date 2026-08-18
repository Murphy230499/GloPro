'use client';
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const StaffPage = dynamic(() => import('@/views/Staff'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )
});

export default function ClientPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      }
    >
      <StaffPage />
    </Suspense>
  );
}
