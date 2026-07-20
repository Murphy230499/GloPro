'use client';
import dynamic from 'next/dynamic';
const Discounts = dynamic(() => import('@/views/Discounts'), { ssr: false });
export default function ClientPage() { return <Discounts />; }
