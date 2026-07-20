'use client';
import dynamic from 'next/dynamic';
const StaffPage = dynamic(() => import('@/views/Staff'), { ssr: false });
export default function ClientPage() { return <StaffPage />; }
