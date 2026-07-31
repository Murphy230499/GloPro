'use client';
import dynamic from 'next/dynamic';
const Providers = dynamic(() => import('../../../providers'), { ssr: false });
const SetupPassword = dynamic(() => import('@/views/SetupPassword'), { ssr: false });
export default function ClientPage() { return <Providers><SetupPassword /></Providers>; }
