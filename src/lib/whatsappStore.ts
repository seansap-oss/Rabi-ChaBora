'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WhatsAppSettings {
  enabled: boolean;
  recipients: string[];
  reportTime: string;
  monthlyReportDay: number;
  orderConfirmation: boolean;
  readyNotification: boolean;
  deliveryConfirmation: boolean;
  feedbackRequest: boolean;
  dailyReport: boolean;
  monthlyReport: boolean;
  reviewRequests: boolean;
  promoBroadcast: boolean;
  bookingConfirmation: boolean;
  birthdayWishes: boolean;
  templates: {
    orderConfirmation: string;
    readyNotification: string;
    deliveryConfirmation: string;
    feedbackRequest: string;
    dailyReport: string;
    monthlyReport: string;
    reviewRequest: string;
    promoMessage: string;
    bookingConfirmation: string;
    birthdayWish: string;
  };
}

const DEFAULT_TEMPLATES = {
  orderConfirmation: 'Hi {name}! Your order #{id} is confirmed.\nItems: {items}\nTotal: {total}\nETA: 15 minutes',
  readyNotification: 'Hi {name}! Your order #{id} is ready! Come collect at counter.',
  deliveryConfirmation: 'Hi {name}! Your order #{id} has been delivered! Thank you.',
  feedbackRequest: 'Hi {name}! How was your order #{id}? Reply with a rating: 1-5',
  dailyReport: '{name} Daily Report\nDate: {id}\nTotal Sales: {total}',
  monthlyReport: '{name} Monthly Report\nTotal Sales: {total}',
  reviewRequest: 'Hi {name}! Enjoyed your order? Leave us a review!',
  promoMessage: 'Hi {name}! Check out our latest offers!',
  bookingConfirmation: 'Hi {name}! Your table is booked for {id}.',
  birthdayWish: 'Happy Birthday {name}! Here\'s a special discount for you!',
};

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = {
  enabled: false,
  recipients: [],
  reportTime: '22:00',
  monthlyReportDay: 1,
  orderConfirmation: true,
  readyNotification: true,
  deliveryConfirmation: true,
  feedbackRequest: true,
  dailyReport: true,
  monthlyReport: true,
  reviewRequests: false,
  promoBroadcast: false,
  bookingConfirmation: false,
  birthdayWishes: false,
  templates: DEFAULT_TEMPLATES,
};

export const WHATSAPP_FEATURES = [
  { id: 'orderConfirmation' as const, name: 'Order Confirmation', price: 99, description: 'Send WhatsApp when customer places order' },
  { id: 'readyNotification' as const, name: 'Ready for Pickup', price: 99, description: 'Notify customer when order is ready' },
  { id: 'deliveryConfirmation' as const, name: 'Delivery Confirmation', price: 149, description: 'Delivery person confirms via WhatsApp' },
  { id: 'feedbackRequest' as const, name: 'Feedback Request', price: 99, description: 'Ask for rating after order completion' },
  { id: 'dailyReport' as const, name: 'Daily Sales Report', price: 149, description: 'Auto-send sales summary daily' },
  { id: 'monthlyReport' as const, name: 'Monthly Summary', price: 199, description: 'Full monthly analytics report' },
  { id: 'reviewRequests' as const, name: 'Customer Reviews', price: 199, description: 'Collect and display reviews' },
  { id: 'promoBroadcast' as const, name: 'Promotional Broadcast', price: 249, description: 'Send offers to recent customers' },
  { id: 'bookingConfirmation' as const, name: 'Reservation Booking', price: 199, description: 'Auto-confirm table bookings' },
  { id: 'birthdayWishes' as const, name: 'Birthday Offers', price: 149, description: 'Auto-send birthday discounts' },
] as const;

interface WhatsAppStore {
  settings: WhatsAppSettings;
  lastAutoSend: string | null;
  lastMonthlySend: string | null;
  
  updateSettings: (settings: Partial<WhatsAppSettings>) => void;
  toggleFeature: (featureId: keyof WhatsAppSettings) => void;
  updateTemplates: (templates: Partial<WhatsAppSettings['templates']>) => void;
  addRecipient: (number: string) => void;
  removeRecipient: (number: string) => void;
  setLastAutoSend: (date: string) => void;
  setLastMonthlySend: (month: string) => void;
  isFeatureEnabled: (featureId: string) => boolean;
}

export const useWhatsAppStore = create<WhatsAppStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_WHATSAPP_SETTINGS,
      lastAutoSend: null,
      lastMonthlySend: null,

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      toggleFeature: (featureId) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [featureId]: !state.settings[featureId],
          },
        }));
      },

      updateTemplates: (templates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            templates: { ...state.settings.templates, ...templates },
          },
        }));
      },

      addRecipient: (number) => {
        set((state) => ({
          settings: {
            ...state.settings,
            recipients: [...state.settings.recipients, number],
          },
        }));
      },

      removeRecipient: (number) => {
        set((state) => ({
          settings: {
            ...state.settings,
            recipients: state.settings.recipients.filter((r) => r !== number),
          },
        }));
      },

      setLastAutoSend: (date) => {
        set({ lastAutoSend: date });
      },

      setLastMonthlySend: (month) => {
        set({ lastMonthlySend: month });
      },

      isFeatureEnabled: (featureId) => {
        const settings = get().settings;
        return (settings as unknown as Record<string, unknown>)[featureId] === true;
      },
    }),
    {
      name: 'cafe-whatsapp',
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

export function getActiveFeatureCount(settings: WhatsAppSettings): number {
  const featureKeys: (keyof WhatsAppSettings)[] = [
    'orderConfirmation', 'readyNotification', 'deliveryConfirmation', 'feedbackRequest',
    'dailyReport', 'monthlyReport', 'reviewRequests', 'promoBroadcast',
    'bookingConfirmation', 'birthdayWishes',
  ];
  return featureKeys.filter(key => settings[key] === true).length;
}

export function getWhatsAppMonthlyTotal(): number {
  const { settings } = useWhatsAppStore.getState();
  return WHATSAPP_FEATURES
    .filter(f => (settings as unknown as Record<string, unknown>)[f.id] === true)
    .reduce((sum, f) => sum + f.price, 0);
}

export function sendWhatsAppMessage(phone: string, message: string): void {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
}

export function formatOrderMessage(template: string, data: { name: string; id: string; items: string; total: string; time?: string }): string {
  return template
    .replace('{name}', data.name)
    .replace('{id}', data.id)
    .replace('{items}', data.items)
    .replace('{total}', data.total)
    .replace('{time}', data.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
}
