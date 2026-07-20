'use client';
import dynamic from 'next/dynamic';
const Providers = dynamic(() => import('../../providers'), { ssr: false });
const ResetPassword = dynamic(() => import('@/views/ResetPassword'), { ssr: false });
export default function ClientPage() { return <Providers><ResetPassword /></Providers>; }
