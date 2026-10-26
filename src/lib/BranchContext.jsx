'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { getSyncTenantId, resolveTenantId, hasExistingTenantData, getTenantStorageKey } from '@/lib/tenantManager';

const BranchContext = createContext({
  branches: [],
  currentBranchId: null,
  setBranch: () => {},
  currentBranch: undefined,
  loading: true,
});
export const useBranch = () => useContext(BranchContext);


export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [currentBranchId, setCurrentBranchId] = useState(() => {
    if (typeof window === 'undefined') return null;
    const key = getTenantStorageKey('glowpro_branch');
    let stored = localStorage.getItem(key) || localStorage.getItem('glowpro_branch');
    if (stored === 'all' || stored === '55e8441d-9dc0-4d16-9a72-24a88a6f9704' || stored === '37a44557-5d1c-4f18-bc45-42073d6552be' || stored === 'demo_branch') {
      localStorage.removeItem(key);
      localStorage.removeItem('glowpro_branch');
      stored = null;
    }
    if (stored) {
      if (stored.length === 24) {
        const hex = stored + '00000000';
        stored = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
        localStorage.setItem(key, stored);
      } else if (stored.length === 28 && stored.split('-').length === 5) {
        stored = stored + '00000000';
        localStorage.setItem(key, stored);
      }
    }
    return stored || null;
  });
  const [loading, setLoading] = useState(true);

  const fetchBranches = async () => {
    try {
      let tid = getSyncTenantId();
      if (!tid && typeof window !== 'undefined') {
        tid = await resolveTenantId();
      }

      let list = await base44.entities.Branch.list();
      let filtered = list.filter(b => b.id !== '00000000-0000-0000-0000-000000000000');

      // Nếu lần đầu vào salon mà chưa có bất kỳ chi nhánh nào, tự động tạo 1 chi nhánh demo
      if (filtered.length === 0) {
        try {
          const demoBranch = await base44.entities.Branch.create({
            name: 'Chi nhánh chính (Demo)',
            address: 'Số 1 Đường Hoa Lan, Phường 2, Phú Nhuận',
            phone: '0901 234 567',
            city: 'Hồ Chí Minh',
            is_active: true,
            country: 'Vietnam',
            currency: 'VND',
            language: 'vi',
            working_hours: [
              { day: 'Thứ 2', open: '08:00', close: '20:00', enabled: true },
              { day: 'Thứ 3', open: '08:00', close: '20:00', enabled: true },
              { day: 'Thứ 4', open: '08:00', close: '20:00', enabled: true },
              { day: 'Thứ 5', open: '08:00', close: '20:00', enabled: true },
              { day: 'Thứ 6', open: '08:00', close: '20:00', enabled: true },
              { day: 'Thứ 7', open: '08:00', close: '20:00', enabled: true },
              { day: 'Chủ Nhật', open: '08:00', close: '20:00', enabled: true }
            ]
          });
          if (demoBranch && demoBranch.id) {
            filtered = [demoBranch];
          }
        } catch (createErr) {
          console.warn('[BranchContext] Error creating initial demo branch:', createErr);
        }
      }

      setBranches(filtered);

      // Luôn tự động chọn 1 chi nhánh cụ thể (không bao giờ để 'all' hoặc rỗng)
      if (filtered.length > 0) {
        if (!currentBranchId || currentBranchId === 'all' || !filtered.some(b => b.id === currentBranchId)) {
          const nextBranch = filtered[0].id;
          setCurrentBranchId(nextBranch);
          if (typeof window !== 'undefined') {
            const key = getTenantStorageKey('glowpro_branch');
            localStorage.setItem(key, nextBranch);
            localStorage.setItem('glowpro_branch', nextBranch);
          }
        }
      }
    } catch (e) {
      setBranches([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBranches();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        fetchBranches();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const setBranch = (id) => {
    if (!id || id === 'all') return;
    setCurrentBranchId(id);
    if (typeof window !== 'undefined') {
      const key = getTenantStorageKey('glowpro_branch');
      localStorage.setItem(key, id);
      localStorage.setItem('glowpro_branch', id);
    }
  };

  const currentBranch = branches.find((b) => b.id === currentBranchId) || branches[0];

  return (
    <BranchContext.Provider
      value={{ branches, currentBranchId, setBranch, currentBranch, loading }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranchFilter = () => {
  const { currentBranchId, branches } = useBranch();
  const activeId = currentBranchId && currentBranchId !== 'all' ? currentBranchId : (branches[0]?.id || null);
  return activeId ? { branch_id: activeId } : {};
};