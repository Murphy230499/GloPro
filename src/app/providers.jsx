'use client';

import dynamic from 'next/dynamic';

// Load all client-side providers with ssr:false to prevent
// localStorage/window access during SSR build-time evaluation
const ProvidersInner = dynamic(() => import('./_providers-inner'), { ssr: false });

export default function Providers({ children }) {
  return <ProvidersInner>{children}</ProvidersInner>;
}
