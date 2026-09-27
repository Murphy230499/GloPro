'use client';
import dynamic from 'next/dynamic';
const RoomsBedsView = dynamic(() => import('@/views/RoomsBeds'), { ssr: false });
export default function ClientPage() { return <RoomsBedsView />; }
