'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem, CafeSettings, ThemeSettings, Order, DEFAULT_CAFE_SETTINGS, DEFAULT_THEME, DEFAULT_MENU_ITEMS } from './types';

interface CafeStore {
  menuItems: MenuItem[];
  cartItems: CartItem[];
  orders: Order[];
  settings: CafeSettings;
  theme: ThemeSettings;
  
  setMenuItems: (items: MenuItem[]) => void;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  
  addToCart: (item: MenuItem, quantity?: number, note?: string) => void;
  removeFromCart: (index: number) => void;
  updateCartQuantity: (index: number, quantity: number) => void;
  updateCartNote: (index: number, note: string) => void;
  clearCart: () => void;
  
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  
  updateSettings: (settings: Partial<CafeSettings>) => void;
  updateTheme: (theme: Partial<ThemeSettings>) => void;
}

export const useStore = create<CafeStore>()(
  persist(
    (set) => ({
      menuItems: DEFAULT_MENU_ITEMS,
      cartItems: [],
      orders: [],
      settings: DEFAULT_CAFE_SETTINGS,
      theme: DEFAULT_THEME,
      
      setMenuItems: (items) => set({ menuItems: items }),
      
      addMenuItem: (item) => set((state) => ({
        menuItems: [...state.menuItems, item]
      })),
      
      updateMenuItem: (id, updates) => set((state) => ({
        menuItems: state.menuItems.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      })),
      
      deleteMenuItem: (id) => set((state) => ({
        menuItems: state.menuItems.filter((item) => item.id !== id)
      })),
      
      addToCart: (item, quantity = 1, note = '') => set((state) => {
        const existingIndex = state.cartItems.findIndex(
          (cartItem) => cartItem.menuItem.id === item.id && cartItem.note === note
        );
        
        if (existingIndex !== -1) {
          const newCartItems = [...state.cartItems];
          newCartItems[existingIndex].quantity += quantity;
          return { cartItems: newCartItems };
        }
        
        return { cartItems: [...state.cartItems, { menuItem: item, quantity, note }] };
      }),
      
      removeFromCart: (index) => set((state) => ({
        cartItems: state.cartItems.filter((_, i) => i !== index)
      })),
      
      updateCartQuantity: (index, quantity) => set((state) => {
        if (quantity <= 0) {
          return { cartItems: state.cartItems.filter((_, i) => i !== index) };
        }
        const newCartItems = [...state.cartItems];
        newCartItems[index].quantity = quantity;
        return { cartItems: newCartItems };
      }),
      
      updateCartNote: (index, note) => set((state) => {
        const newCartItems = [...state.cartItems];
        newCartItems[index].note = note;
        return { cartItems: newCartItems };
      }),
      
      clearCart: () => set({ cartItems: [] }),
      
      addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
      })),
      
      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map((order) =>
          order.id === id ? { ...order, status } : order
        )
      })),
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      updateTheme: (newTheme) => set((state) => ({
        theme: { ...state.theme, ...newTheme }
      })),
    }),
    {
      name: 'cafe-store',
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
