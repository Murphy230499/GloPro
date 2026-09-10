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
  currentUser: { id: 'current_user', name: 'Chủ tài khoản', role: 'owner' },
  salonBranch: { id: 'current_branch', name: 'Chi nhánh chính' },
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
