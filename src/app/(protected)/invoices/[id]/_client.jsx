'use client';
import dynamic from 'next/dynamic';
const InvoiceDetail = dynamic(() => import('@/views/InvoiceDetail'), { ssr: false });
export default function ClientPage({ invoiceId }) { return <InvoiceDetail invoiceId={invoiceId} />; }
