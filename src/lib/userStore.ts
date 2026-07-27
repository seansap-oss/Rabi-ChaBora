'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  username: string;
  passwordHash: string;
  createdAt: number;
}

export interface UserOrder {
  id: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
  createdAt: number;
}

interface UserStore {
  users: UserProfile[];
  session: { username: string; loggedIn: boolean } | null;
  userOrders: Record<string, UserOrder[]>;
  
  signUp: (username: string, password: string) => { success: boolean; error?: string };
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isLoggedIn: () => boolean;
  getUsername: () => string | null;
  
  addUserOrder: (username: string, order: UserOrder) => void;
  getUserOrders: (username: string) => UserOrder[];
  getUserTotalSpent: (username: string) => number;
  deleteUserOrder: (username: string, orderId: string) => void;
}

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: [],
      session: null,
      userOrders: {},

      signUp: (username, password) => {
        const state = get();
        if (state.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
          return { success: false, error: 'Username already taken' };
        }
        if (username.length < 2) return { success: false, error: 'Username too short' };
        if (password.length < 4) return { success: false, error: 'Password too short (min 4)' };
        
        const newUser: UserProfile = {
          username: username.toLowerCase(),
          passwordHash: hashPassword(password),
          createdAt: Date.now(),
        };
        
        set((state) => ({
          users: [...state.users, newUser],
          session: { username: newUser.username, loggedIn: true },
        }));
        
        return { success: true };
      },

      login: (username, password) => {
        const state = get();
        const user = state.users.find(
          u => u.username === username.toLowerCase() && u.passwordHash === hashPassword(password)
        );
        if (!user) return { success: false, error: 'Invalid username or password' };
        
        set({ session: { username: user.username, loggedIn: true } });
        return { success: true };
      },

      logout: () => {
        set({ session: null });
      },

      isLoggedIn: () => {
        return get().session?.loggedIn === true;
      },

      getUsername: () => {
        return get().session?.username || null;
      },

      addUserOrder: (username, order) => {
        set((state) => {
          const existing = state.userOrders[username] || [];
          return {
            userOrders: {
              ...state.userOrders,
              [username]: [order, ...existing],
            },
          };
        });
      },

      getUserOrders: (username) => {
        return get().userOrders[username] || [];
      },

      getUserTotalSpent: (username) => {
        const orders = get().userOrders[username] || [];
        return orders.reduce((sum, o) => sum + o.total, 0);
      },

      deleteUserOrder: (username, orderId) => {
        set((state) => {
          const existing = state.userOrders[username] || [];
          return {
            userOrders: {
              ...state.userOrders,
              [username]: existing.filter(o => o.id !== orderId),
            },
          };
        });
      },
    }),
    {
      name: 'cafe-users',
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
