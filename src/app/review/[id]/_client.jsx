'use client';
import dynamic from 'next/dynamic';
const Providers = dynamic(() => import('../../providers'), { ssr: false });
const CustomerReview = dynamic(() => import('@/views/CustomerReview'), { ssr: false });
export default function ClientPage({ reviewId }) { return <Providers><CustomerReview reviewId={reviewId} /></Providers>; }
