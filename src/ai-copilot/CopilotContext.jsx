'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { CopilotEngine } from './CopilotEngine';

const CopilotContext = createContext(null);

const defaultCopilotState = {
  currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
  selectedCustomer: null,
  selectedInvoice: null,
  selectedAppointment: null,
  selectedEmployee: null,
  currentUser: { id: 'usr_001', name: 'Minh Thu (Chủ Salon)', role: 'owner' },
  salonBranch: { id: 'branch_main', name: 'GloPro Salon & Spa Center - Chi nhánh 1' },
  currentFilters: {},
  currentSearch: '',
  currentPermissions: ['*']
};

export function CopilotProvider({ children }) {
  const [copilotState, setCopilotState] = useState(defaultCopilotState);
  const [engine] = useState(() => new CopilotEngine());

  const updateCopilotState = (updates) => {
    setCopilotState(prev => ({ ...prev, ...updates }));
  };

  const setSelectedCustomer = (customer) => setCopilotState(prev => ({ ...prev, selectedCustomer: customer }));
  const setSelectedInvoice = (invoice) => setCopilotState(prev => ({ ...prev, selectedInvoice: invoice }));
  const setSelectedAppointment = (appointment) => setCopilotState(prev => ({ ...prev, selectedAppointment: appointment }));
  const setSelectedEmployee = (employee) => setCopilotState(prev => ({ ...prev, selectedEmployee: employee }));
  const setCurrentPage = (page) => setCopilotState(prev => ({ ...prev, currentPage: page }));

  const value = useMemo(() => ({
    copilotState,
    updateCopilotState,
    setSelectedCustomer,
    setSelectedInvoice,
    setSelectedAppointment,
    setSelectedEmployee,
    setCurrentPage,
    copilotEngine: engine
  }), [copilotState, engine]);

  return (
    <CopilotContext.Provider value={value}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const ctx = useContext(CopilotContext);
  if (!ctx) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return ctx;
}
