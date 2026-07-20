'use client';

import dynamic from 'next/dynamic';

const Providers = dynamic(() => import('./providers'), { ssr: false });
const NotFoundInner = dynamic(() => import('./_not-found-inner'), { ssr: false });

export default function NotFound() {
  return (
    <Providers>
      <NotFoundInner />
    </Providers>
  );
}
