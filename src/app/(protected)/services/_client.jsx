'use client';
import dynamic from 'next/dynamic';
const Services = dynamic(() => import('@/views/Services'), { ssr: false });
export default function ClientPage() { return <Services />; }
