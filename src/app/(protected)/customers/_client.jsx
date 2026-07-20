'use client';
import dynamic from 'next/dynamic';
const Customers = dynamic(() => import('@/views/Customers'), { ssr: false });
export default function ClientPage() { return <Customers />; }
