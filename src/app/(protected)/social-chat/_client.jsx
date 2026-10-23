'use client';
import dynamic from 'next/dynamic';

const SocialChatView = dynamic(() => import('@/views/SocialChat'), { ssr: false });

export default function ClientPage() {
  return <SocialChatView />;
}
