'use client';
import dynamic from 'next/dynamic';
const Providers = dynamic(() => import('../../providers'), { ssr: false });
const Login = dynamic(() => import('@/views/Login'), { ssr: false });
export default function ClientPage() { return <Providers><Login /></Providers>; }
