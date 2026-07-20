'use client';
import dynamic from 'next/dynamic';
const Providers = dynamic(() => import('../../providers'), { ssr: false });
const Register = dynamic(() => import('@/views/Register'), { ssr: false });
export default function ClientPage() { return <Providers><Register /></Providers>; }
