'use client';
import dynamic from 'next/dynamic';
const SettingsPage = dynamic(() => import('@/views/Settings'), { ssr: false });
export default function ClientPage() { return <SettingsPage />; }
