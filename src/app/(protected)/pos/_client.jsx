'use client';
import dynamic from 'next/dynamic';
const POS = dynamic(() => import('@/views/POS'), { ssr: false });
export default function ClientPage() { return <POS />; }
