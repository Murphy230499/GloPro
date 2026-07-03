import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const BranchContext = createContext();
export const useBranch = () => useContext(BranchContext);

export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [currentBranchId, setCurrentBranchId] = useState(
    () => localStorage.getItem('glowpro_branch') || 'all'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Branch.list();
        setBranches(list);
      } catch (e) {
        setBranches([]);
      }
      setLoading(false);
    })();
  }, []);

  const setBranch = (id) => {
    setCurrentBranchId(id);
    localStorage.setItem('glowpro_branch', id);
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