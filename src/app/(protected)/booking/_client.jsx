'use client';
import dynamic from 'next/dynamic';
const BookingView = dynamic(() => import('@/views/Booking'), { ssr: false });
export default function BookingClientPage() {
  return <BookingView />;
}
