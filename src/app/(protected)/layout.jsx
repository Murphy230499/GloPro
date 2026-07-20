'use client';

import dynamic from 'next/dynamic';

const Providers = dynamic(() => import('../providers'), { ssr: false });
const ProtectedLayoutInner = dynamic(() => import('./_protected-inner'), { ssr: false });

export default function ProtectedLayout({ children }) {
  return (
    <Providers>
      <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
    </Providers>
  );
}
