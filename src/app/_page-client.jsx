'use client';
import dynamic from 'next/dynamic';
const Providers = dynamic(() => import('./providers'), { ssr: false });
const RootRedirect = dynamic(() => import('./_root-redirect'), { ssr: false });
export default function ClientPage() { return <Providers><RootRedirect /></Providers>; }
