'use client';
import dynamic from 'next/dynamic';
const PublicBookingPage = dynamic(() => import('@/views/PublicBookingPage'), { ssr: false });
export default function ClientPage({ slug }) {
  return <PublicBookingPage slug={slug} />;
}
