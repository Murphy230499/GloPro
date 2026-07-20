'use client';
import dynamic from 'next/dynamic';
const Appointments = dynamic(() => import('@/views/Appointments'), { ssr: false });
export default function ClientPage() { return <Appointments />; }
