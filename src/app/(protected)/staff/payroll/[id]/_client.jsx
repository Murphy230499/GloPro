'use client';
import dynamic from 'next/dynamic';

const StaffPayrollDetailRouteView = dynamic(() => import('@/views/StaffPayrollDetailRouteView'), { ssr: false });

export default function ClientPage({ staffId }) { 
  return <StaffPayrollDetailRouteView staffId={staffId} />; 
}
