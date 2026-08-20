'use client';
import dynamic from 'next/dynamic';

const FeedbackView = dynamic(() => import('@/views/Feedback'), { ssr: false });

export default function ClientPage() {
  return <FeedbackView />;
}
