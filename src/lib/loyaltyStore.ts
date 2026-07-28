'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoyaltyConfig, LoyaltyCustomer, LoyaltyStampRecord, DEFAULT_LOYALTY_CONFIG } from './types';

interface LoyaltyStore {
  config: LoyaltyConfig;
  customers: Record<string, LoyaltyCustomer>;

  updateConfig: (config: Partial<LoyaltyConfig>) => void;
  getCustomer: (phone: string) => LoyaltyCustomer | null;
  enrollCustomer: (phone: string, name: string) => LoyaltyCustomer;
  addStamp: (phone: string, orderId: string, amount: number) => { stamps: number; rewardReady: boolean };
  redeemReward: (phone: string) => boolean;
  getTopCustomers: (limit?: number) => LoyaltyCustomer[];
  getAtRiskCustomers: (days?: number) => LoyaltyCustomer[];
  getNearMissCustomers: () => LoyaltyCustomer[];
  getStats: () => { totalMembers: number; activeMembers: number; stampsToday: number; rewardsRedeemed: number; totalStamps: number };
}

export const useLoyaltyStore = create<LoyaltyStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_LOYALTY_CONFIG,
      customers: {},

      updateConfig: (newConfig) => set((state) => ({
        config: { ...state.config, ...newConfig },
      })),

      getCustomer: (phone) => {
        return get().customers[phone] || null;
      },

      enrollCustomer: (phone, name) => {
        const state = get();
        if (state.customers[phone]) return state.customers[phone];

        const customer: LoyaltyCustomer = {
          phone,
          name,
          stamps: state.config.bonusOnSignup,
          totalVisits: 0,
          totalSpent: 0,
          rewardAvailable: false,
          rewardEarnedAt: 0,
          lastVisit: 0,
          enrolledAt: Date.now(),
          history: [],
        };

        set((s) => ({
          customers: { ...s.customers, [phone]: customer },
        }));

        return customer;
      },

      addStamp: (phone, orderId, amount) => {
        const state = get();
        const config = state.config;
        let customer = state.customers[phone];

        // Auto-enroll if not exists
        if (!customer) {
          customer = get().enrollCustomer(phone, '');
        }

        // Check if category qualifies
        // (For simplicity, all orders qualify — category check happens at order level if needed)

        const newStamps = customer.stamps + 1;
        const rewardReady = newStamps >= config.stampsRequired;

        const record: LoyaltyStampRecord = {
          date: Date.now(),
          orderId,
          amount,
          stampsEarned: 1,
          rewardRedeemed: false,
        };

        const updatedCustomer: LoyaltyCustomer = {
          ...customer,
          stamps: rewardReady ? 0 : newStamps,
          totalVisits: customer.totalVisits + 1,
          totalSpent: customer.totalSpent + amount,
          rewardAvailable: rewardReady ? true : customer.rewardAvailable,
          rewardEarnedAt: rewardReady ? Date.now() : customer.rewardEarnedAt,
          lastVisit: Date.now(),
          history: [record, ...customer.history],
        };

        set((s) => ({
          customers: { ...s.customers, [phone]: updatedCustomer },
        }));

        return { stamps: updatedCustomer.stamps, rewardReady };
      },

      redeemReward: (phone) => {
        const state = get();
        const customer = state.customers[phone];
        if (!customer || !customer.rewardAvailable) return false;

        const record: LoyaltyStampRecord = {
          date: Date.now(),
          orderId: '',
          amount: 0,
          stampsEarned: 0,
          rewardRedeemed: true,
        };

        const updatedCustomer: LoyaltyCustomer = {
          ...customer,
          rewardAvailable: false,
          rewardEarnedAt: 0,
          history: [record, ...customer.history],
        };

        set((s) => ({
          customers: { ...s.customers, [phone]: updatedCustomer },
        }));

        return true;
      },

      getTopCustomers: (limit = 10) => {
        return Object.values(get().customers)
          .sort((a, b) => b.totalVisits - a.totalVisits)
          .slice(0, limit);
      },

      getAtRiskCustomers: (days = 30) => {
        const cutoff = Date.now() - days * 86400000;
        return Object.values(get().customers).filter(
          (c) => c.lastVisit > 0 && c.lastVisit < cutoff
        );
      },

      getNearMissCustomers: () => {
        const config = get().config;
        return Object.values(get().customers).filter(
          (c) => c.stamps === config.stampsRequired - 1 && !c.rewardAvailable
        );
      },

      getStats: () => {
        const customers = Object.values(get().customers);
        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date(today).getTime();

        let stampsToday = 0;
        let rewardsRedeemed = 0;
        let totalStamps = 0;

        customers.forEach((c) => {
          c.history.forEach((h) => {
            if (h.date >= todayStart) {
              stampsToday += h.stampsEarned;
              if (h.rewardRedeemed) rewardsRedeemed++;
            }
          });
          totalStamps += c.totalVisits;
        });

        const activeCutoff = Date.now() - 30 * 86400000;
        const activeMembers = customers.filter((c) => c.lastVisit >= activeCutoff).length;

        return {
          totalMembers: customers.length,
          activeMembers,
          stampsToday,
          rewardsRedeemed,
          totalStamps,
        };
      },
    }),
    {
      name: 'cafe-loyalty',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(name);
        },
      },
    }
  )
);
