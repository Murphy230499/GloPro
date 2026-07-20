'use client';
import dynamic from 'next/dynamic';
const Invoices = dynamic(() => import('@/views/Invoices'), { ssr: false });
export default function ClientPage() { return <Invoices />; }
