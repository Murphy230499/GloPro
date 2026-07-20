'use client';
import dynamic from 'next/dynamic';
const Providers = dynamic(() => import('../../providers'), { ssr: false });
const ForgotPassword = dynamic(() => import('@/views/ForgotPassword'), { ssr: false });
export default function ClientPage() { return <Providers><ForgotPassword /></Providers>; }
