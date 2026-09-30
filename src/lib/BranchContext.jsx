'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { getSyncTenantId, resolveTenantId, hasExistingTenantData, getTenantStorageKey } from '@/lib/tenantManager';

const BranchContext = createContext({
  branches: [],
  currentBranchId: 'all',
  setBranch: () => {},
  currentBranch: undefined,
  loading: true,
});
export const useBranch = () => useContext(BranchContext);


export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [currentBranchId, setCurrentBranchId] = useState(() => {
    if (typeof window === 'undefined') return 'all';
    const key = getTenantStorageKey('glowpro_branch');
    let stored = localStorage.getItem(key) || localStorage.getItem('glowpro_branch');
    // If stored branch was an old demo branch or stale, clear it
    if (stored === '55e8441d-9dc0-4d16-9a72-24a88a6f9704' || stored === '37a44557-5d1c-4f18-bc45-42073d6552be' || stored === 'demo_branch') {
      localStorage.removeItem(key);
      localStorage.removeItem('glowpro_branch');
      stored = 'all';
    }
    if (stored && stored !== 'all') {
      if (stored.length === 24) {
        const hex = stored + '00000000';
        stored = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
        localStorage.setItem(key, stored);
      } else if (stored.length === 28 && stored.split('-').length === 5) { // Recover corrupted UUID from previous bug
        stored = stored + '00000000';
        localStorage.setItem(key, stored);
      }
    }
    return stored || 'all';
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

        const hasData = await hasExistingTenantData(tid);

        if (hasData) {
          // If the account ALREADY HAS DATA, demo branch must NOT be assigned or created.
          // Clean up any mistakenly auto-created "GloPro Demo" branch for this tenant.
          const demoBranches = filtered.filter(b => b.name === 'GloPro Demo' || b.address === 'Chi nhánh Demo');
          if (demoBranches.length > 0) {
            for (const db of demoBranches) {
              try {
                await base44.entities.Branch.delete(db.id);
              } catch (delErr) {
                console.warn('[BranchContext] Error removing demo branch from existing account:', delErr);
              }
            }
            filtered = filtered.filter(b => b.name !== 'GloPro Demo' && b.address !== 'Chi nhánh Demo');
          }
        } else if (filtered.length === 0) {
          // ONLY create GloPro Demo if brand new first-time login AND absolutely no existing data
          let isFirstTime = false;
          try {
            const sessionRes = await supabase.auth.getSession();
            const user = sessionRes.data?.session?.user;
            const email = user?.email?.toLowerCase();
            if (user && email !== 'infinitystudio9969@gmail.com' && email !== 'duclivegiolinh@gmail.com' && email !== 'ducledinhqt@gmail.com' && tid !== '6cb88c32-06c6-4b95-b286-99bc8c141c79') {
              const onboardKey = `gp_onboarded_${user.id}`;
              const alreadySeen = localStorage.getItem(onboardKey);
              if (!alreadySeen) {
                isFirstTime = true;
                localStorage.setItem(onboardKey, 'true');
              }
            }
          } catch (e) {
            isFirstTime = false;
          }

          if (isFirstTime) {
            try {
              const demoBranch = await base44.entities.Branch.create({
                name: 'GloPro Demo',
                address: 'Chi nhánh Demo',
                phone: '0900 000 000',
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
              console.warn('[BranchContext] Error creating GloPro Demo branch:', createErr);
            }
          }
        }

        setBranches(filtered);
        // If stored branch ID is not found in the branches list, fallback to 'all' or first branch
        if (currentBranchId && currentBranchId !== 'all' && !filtered.some(b => b.id === currentBranchId)) {
          const nextBranch = filtered.length > 0 ? filtered[0].id : 'all';
          setCurrentBranchId(nextBranch);
          if (typeof window !== 'undefined') localStorage.setItem('glowpro_branch', nextBranch);
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
    setCurrentBranchId(id);
    if (typeof window !== 'undefined') {
      const key = getTenantStorageKey('glowpro_branch');
      localStorage.setItem(key, id);
      localStorage.setItem('glowpro_branch', id);
    }
  };

  const currentBranch = branches.find((b) => b.id === currentBranchId);

  return (
    <BranchContext.Provider
      value={{ branches, currentBranchId, setBranch, currentBranch, loading }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranchFilter = () => {
  const { currentBranchId } = useBranch();
  return currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
};