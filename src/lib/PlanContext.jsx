'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { PLANS, calculateProration } from './planConfig';

const STORAGE_KEY = 'glopro_subscription_state_v1';

// Default initial state: Free tier or initialized from storage
const DEFAULT_SUBSCRIPTION = {
  planId: 'free',
  status: 'active', // 'active' | 'trialing' | 'expired'
  startedAt: null,
  expiresAt: null,
  billingCycle: 'monthly', // 'monthly' | 'yearly'
  paymentMethod: null, // 'vietqr' | 'stripe'
  lastExpiredPlan: null,
};

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const [subscription, setSubscription] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SUBSCRIPTION;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check for expiration
        if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date() && parsed.planId !== 'free') {
          return {
            ...parsed,
            lastExpiredPlan: parsed.planId,
            planId: 'free',
            status: 'expired',
          };
        }
        return parsed;
      }
    } catch (e) {
      console.warn('[PlanContext] Failed to parse subscription storage:', e);
    }
    return DEFAULT_SUBSCRIPTION;
  });

  const [upgradeModalState, setUpgradeModalState] = useState({
    isOpen: false,
    featureName: '',
    requiredPlan: 'pro',
    description: '',
  });

  // Save to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
      } catch (e) {
        console.warn('[PlanContext] Failed to persist subscription:', e);
      }
    }
  }, [subscription]);

  // Periodic expiration guard (runs every 60 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (subscription.expiresAt && subscription.planId !== 'free') {
        if (new Date(subscription.expiresAt) < new Date()) {
          setSubscription(prev => ({
            ...prev,
            lastExpiredPlan: prev.planId,
            planId: 'free',
            status: 'expired',
          }));
        }
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [subscription.expiresAt, subscription.planId]);

  // Derived calculations
  const currentPlan = useMemo(() => {
    return PLANS[subscription.planId] || PLANS.free;
  }, [subscription.planId]);

  const remainingDays = useMemo(() => {
    if (subscription.planId === 'free' || !subscription.expiresAt) return 0;
    const now = new Date();
    const end = new Date(subscription.expiresAt);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [subscription.planId, subscription.expiresAt]);

  const isExpired = useMemo(() => {
    if (!subscription.expiresAt) return false;
    return new Date(subscription.expiresAt) < new Date();
  }, [subscription.expiresAt]);

  // Check if a specific feature is accessible
  const hasFeature = useCallback((featureCode) => {
    // If expired, fall back strictly to Free features
    if (isExpired && subscription.planId === 'free') {
      return (PLANS.free.features || []).includes(featureCode);
    }
    return (currentPlan.features || []).includes(featureCode);
  }, [currentPlan, isExpired, subscription.planId]);

  // Check quota for adding branches
  const canAddBranch = useCallback((currentCount) => {
    return currentCount < currentPlan.maxBranches;
  }, [currentPlan.maxBranches]);

  // Check quota for adding staff
  const canAddStaff = useCallback((currentCount) => {
    return currentCount < currentPlan.maxStaff;
  }, [currentPlan.maxStaff]);

  // Upgrade or change plan
  const upgradePlan = useCallback(({ targetPlanId, billingCycle = 'monthly', paymentMethod = 'vietqr' }) => {
    const now = new Date();
    const durationDays = billingCycle === 'yearly' ? 365 : 30;
    const expires = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const updated = {
      planId: targetPlanId,
      status: 'active',
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      billingCycle,
      paymentMethod,
      lastExpiredPlan: null,
    };

    setSubscription(updated);
    return updated;
  }, []);

  // Downgrade to Free
  const downgradeToFree = useCallback(() => {
    const updated = {
      planId: 'free',
      status: 'active',
      startedAt: null,
      expiresAt: null,
      billingCycle: 'monthly',
      paymentMethod: null,
      lastExpiredPlan: null,
    };
    setSubscription(updated);
    return updated;
  }, []);

  // Renew existing plan
  const renewPlan = useCallback(({ billingCycle = 'monthly', paymentMethod = 'vietqr' }) => {
    const now = new Date();
    const durationDays = billingCycle === 'yearly' ? 365 : 30;
    
    // If currently active and not expired, extend from existing expiresAt
    let baseDate = now;
    if (subscription.expiresAt && new Date(subscription.expiresAt) > now) {
      baseDate = new Date(subscription.expiresAt);
    }
    const newExpires = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const updated = {
      ...subscription,
      status: 'active',
      expiresAt: newExpires.toISOString(),
      billingCycle,
      paymentMethod,
      lastExpiredPlan: null,
    };

    setSubscription(updated);
    return updated;
  }, [subscription]);

  // Upsell modal controllers
  const openUpgradeModal = useCallback(({ featureName = 'Tính năng nâng cao', requiredPlan = 'pro', description = '' }) => {
    setUpgradeModalState({
      isOpen: true,
      featureName,
      requiredPlan,
      description,
    });
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const value = {
    subscription,
    plan: currentPlan,
    planId: subscription.planId,
    status: subscription.status,
    startedAt: subscription.startedAt,
    expiresAt: subscription.expiresAt,
    remainingDays,
    isExpired,
    billingCycle: subscription.billingCycle,
    paymentMethod: subscription.paymentMethod,
    lastExpiredPlan: subscription.lastExpiredPlan,
    hasFeature,
    canAddBranch,
    canAddStaff,
    upgradePlan,
    downgradeToFree,
    renewPlan,
    upgradeModalState,
    openUpgradeModal,
    closeUpgradeModal,
    calculateProration: (targetPlanId, isYearly) =>
      calculateProration({
        currentPlanId: subscription.planId,
        targetPlanId,
        expiresAt: subscription.expiresAt,
        isYearly,
      }),
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
