'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OwnerRecord {
  id: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
  orderType: string;
  createdAt: number;
}

interface OwnerStore {
  passwordHash: string | null;
  isLoggedIn: boolean;
  sales: OwnerRecord[];
  lastAutoSend: string | null;
  
  setupPassword: (password: string) => void;
  login: (password: string) => boolean;
  logout: () => void;
  isSetup: () => boolean;
  
  addSale: (record: OwnerRecord) => void;
  deleteSale: (id: string) => void;
  clearAllSales: () => void;
  getSalesByDate: (date: string) => OwnerRecord[];
  getTotalByDate: (date: string) => number;
  getGrandTotal: () => number;
  
  setLastAutoSend: (date: string) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'owner_' + Math.abs(hash).toString(36);
}

export const useOwnerStore = create<OwnerStore>()(
  persist(
    (set, get) => ({
      passwordHash: null,
      isLoggedIn: false,
      sales: [],
      lastAutoSend: null,

      setupPassword: (password) => {
        set({ passwordHash: hashPassword(password) });
      },

      login: (password) => {
        const state = get();
        if (!state.passwordHash) return false;
        if (state.passwordHash === hashPassword(password)) {
          set({ isLoggedIn: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isLoggedIn: false });
      },

      isSetup: () => {
        return get().passwordHash !== null;
      },

      addSale: (record) => {
        set((state) => ({
          sales: [record, ...state.sales],
        }));
      },

      deleteSale: (id) => {
        set((state) => ({
          sales: state.sales.filter(s => s.id !== id),
        }));
      },

      clearAllSales: () => {
        set({ sales: [] });
      },

      getSalesByDate: (date) => {
        return get().sales.filter(s => {
          const orderDate = new Date(s.createdAt).toISOString().split('T')[0];
          return orderDate === date;
        });
      },

      getTotalByDate: (date) => {
        const daySales = get().getSalesByDate(date);
        return daySales.reduce((sum, s) => sum + s.total, 0);
      },

      getGrandTotal: () => {
        return get().sales.reduce((sum, s) => sum + s.total, 0);
      },

      setLastAutoSend: (date) => {
        set({ lastAutoSend: date });
      },

      exportData: () => {
        const state = get();
        return JSON.stringify({
          sales: state.sales,
          exportedAt: new Date().toISOString(),
          totalRecords: state.sales.length,
        }, null, 2);
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          if (data.sales && Array.isArray(data.sales)) {
            set({ sales: data.sales });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'cafe-owner',
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
