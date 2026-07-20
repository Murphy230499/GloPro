'use client';
import dynamic from 'next/dynamic';
const Reports = dynamic(() => import('@/views/Reports'), { ssr: false });
export default function ClientPage() { return <Reports />; }
