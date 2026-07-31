'use client';
import { useParams } from 'next/navigation';
import AutomationDetailView from '@/views/AutomationDetailView';

export default function ClientPage() {
  const params = useParams();
  return <AutomationDetailView id={params?.id || 'appointment-reminder'} />;
}
