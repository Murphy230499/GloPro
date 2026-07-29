'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import StaffPayrollDetailView from '@/components/staff/StaffPayrollDetailView';
import { Loader2 } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function StaffPayrollDetailRouteView({ staffId }) {
  const router = useRouter();
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  useEffect(() => {
    if (!staffId) return;

    const fetchStaff = async () => {
      setLoading(true);
      try {
        // Fetch all staff or single staff entity
        const allStaff = await base44.entities.Staff.list().catch(() => []);
        let found = (allStaff || []).find(s => String(s.id) === String(staffId));

        if (!found) {
          // Check local storage fallback
          const local = localStorage.getItem('glopro_staff');
          if (local) {
            const parsed = JSON.parse(local);
            found = parsed.find(s => String(s.id) === String(staffId));
          }
        }

        if (found) {
          // Ensure default payroll calculation attributes exist for complete display
          const normalized = {
            id: found.id,
            name: found.full_name || found.name || 'Nhân viên',
            role: found.role || 'technician',
            avatar_url: found.avatar_url || '',
            avatar_color: found.avatar_color || '#F97316',
            shifts: found.shifts || '24 Ca/ 120h',
            daysOff: found.daysOff || 2,
            salary: found.salary || 10000000,
            noServices: found.noServices || 14,
            serviceSales: found.serviceSales || 4500000,
            serviceCom: found.serviceCom || 450000,
            noTreatment: found.noTreatment || 3,
            treatmentSales: found.treatmentSales || 2000000,
            treatmentCom: found.treatmentCom || 200000,
            noPackage: found.noPackage || 2,
            packageSales: found.packageSales || 3000000,
            packageCom: found.packageCom || 150000,
            noServiceCombo: found.noServiceCombo || 1,
            serviceComboSales: found.serviceComboSales || 1500000,
            serviceComboCom: found.serviceComboCom || 75000,
            noProductCombo: found.noProductCombo || 0,
            productComboSales: found.productComboSales || 0,
            productComboCom: found.productComboCom || 0,
            noProduct: found.noProduct || 5,
            productSales: found.productSales || 1200000,
            productCom: found.productCom || 60000,
            noPrepaidCard: found.noPrepaidCard || 1,
            prepaidCardSales: found.prepaidCardSales || 2000000,
            prepaidCardCom: found.prepaidCardCom || 100000,
            requestedCom: found.requestedCom || 120000,
            overtimeCom: found.overtimeCom || 150000,
            revenueCom: found.revenueCom || 200000,
            tip: found.tip || 300000,
            bonus: found.bonus || 500000,
            penalty: found.penalty || 50000,
          };

          // Calculate total net salary
          const totalComms = normalized.serviceCom + normalized.treatmentCom + normalized.packageCom + 
            normalized.serviceComboCom + normalized.productComboCom + normalized.productCom + 
            normalized.prepaidCardCom + normalized.requestedCom + normalized.overtimeCom + normalized.revenueCom;
          
          normalized.total = normalized.salary + totalComms + normalized.bonus + normalized.tip - normalized.penalty;

          setStaffData(normalized);
        } else {
          setError('Không tìm thấy thông tin nhân viên');
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu chi tiết lương nhân viên:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [staffId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Đang tải bảng lương chi tiết...</span>
      </div>
    );
  }

  if (error || !staffData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-base font-bold text-slate-700">{error || 'Không tìm thấy dữ liệu'}</div>
        <button
          onClick={() => router.push('/staff?tab=payroll')}
          className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-colors"
        >
          Quay lại trang nhân sự
        </button>
      </div>
    );
  }

  return (
    <StaffPayrollDetailView
      staffData={staffData}
      dateRange={dateRange}
      onBack={() => router.push('/staff?tab=payroll')}
    />
  );
}
