'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

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
    let stored = localStorage.getItem('glowpro_branch');
    if (stored && stored !== 'all') {
      if (stored.length === 24) {
        const hex = stored + '00000000';
        stored = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
        localStorage.setItem('glowpro_branch', stored);
      } else if (stored.length === 28 && stored.split('-').length === 5) { // Recover corrupted UUID from previous bug
        stored = stored + '00000000';
        localStorage.setItem('glowpro_branch', stored);
      }
    }
    return stored || 'all';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Branch.list();
        const filtered = list.filter(b => b.id !== '00000000-0000-0000-0000-000000000000');
        setBranches(filtered);
        // Auto-select first branch if still on 'all'
        if ((currentBranchId === 'all' || !currentBranchId) && filtered.length > 0) {
          setCurrentBranchId(filtered[0].id);
          if (typeof window !== 'undefined') localStorage.setItem('glowpro_branch', filtered[0].id);
        }
      } catch (e) {
        setBranches([]);
      }
      setLoading(false);
    })();
  }, []);

  const setBranch = (id) => {
    setCurrentBranchId(id);
    if (typeof window !== 'undefined') localStorage.setItem('glowpro_branch', id);
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