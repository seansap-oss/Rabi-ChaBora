'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LicenseFeatures {
  menu: boolean;
  customerOrdering: boolean;
  posDisplay: boolean;
  kitchenDisplay: boolean;
  deliveryDisplay: boolean;
  menuSignage: boolean;
  adminDashboard: boolean;
  menuManagement: boolean;
  reports: boolean;
  receiptPrinter: boolean;
  waOrderConfirmation: boolean;
  waReadyNotification: boolean;
  waDeliveryConfirmation: boolean;
  waFeedbackRequest: boolean;
  waDailySalesReport: boolean;
  waMonthlySummary: boolean;
  waCustomerReviews: boolean;
  waPromotionalBroadcast: boolean;
  waReservationBooking: boolean;
  waBirthdayOffers: boolean;
}

interface LicenseContextType {
  features: LicenseFeatures;
  isUnlocked: (feature: keyof LicenseFeatures) => boolean;
  unlockFeature: (feature: keyof LicenseFeatures, password: string) => boolean;
  lockFeature: (feature: keyof LicenseFeatures) => void;
  getPasswordHint: (feature: keyof LicenseFeatures) => string;
  getActiveWhatsAppCount: () => number;
  getWhatsAppMonthlyTotal: () => number;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

const FEATURE_PASSWORDS: Record<keyof LicenseFeatures, string> = {
  menu: 'cafe2024',
  customerOrdering: 'cafe2024',
  posDisplay: 'pos123',
  kitchenDisplay: 'kitchen123',
  deliveryDisplay: 'delivery123',
  menuSignage: 'signage123',
  adminDashboard: 'admin123',
  menuManagement: 'menu123',
  reports: 'reports123',
  receiptPrinter: 'receipt123',
  waOrderConfirmation: 'wa-confirm-001',
  waReadyNotification: 'wa-ready-002',
  waDeliveryConfirmation: 'wa-delivery-005',
  waFeedbackRequest: 'wa-feedback-004',
  waDailySalesReport: 'wa-report-003',
  waMonthlySummary: 'wa-monthly-010',
  waCustomerReviews: 'wa-reviews-006',
  waPromotionalBroadcast: 'wa-promo-007',
  waReservationBooking: 'wa-booking-008',
  waBirthdayOffers: 'wa-bday-009',
};

const FEATURE_HINTS: Record<keyof LicenseFeatures, string> = {
  menu: 'Free with basic license',
  customerOrdering: 'Free with basic license',
  posDisplay: 'Unlock with POS license key',
  kitchenDisplay: 'Unlock with Kitchen license key',
  deliveryDisplay: 'Unlock with Delivery license key',
  menuSignage: 'Unlock with Signage license key',
  adminDashboard: 'Included with any paid plan',
  menuManagement: 'Included with any paid plan',
  reports: 'Unlock with Reports license key',
  receiptPrinter: 'Unlock with Receipt Printer license',
  waOrderConfirmation: '₹99/mo - Order Confirmation',
  waReadyNotification: '₹99/mo - Ready Notification',
  waDeliveryConfirmation: '₹149/mo - Delivery Confirmation',
  waFeedbackRequest: '₹99/mo - Feedback Request',
  waDailySalesReport: '₹149/mo - Daily Sales Report',
  waMonthlySummary: '₹199/mo - Monthly Summary',
  waCustomerReviews: '₹199/mo - Customer Reviews',
  waPromotionalBroadcast: '₹249/mo - Promotional Broadcast',
  waReservationBooking: '₹199/mo - Reservation Booking',
  waBirthdayOffers: '₹149/mo - Birthday Offers',
};

const WHATSAPP_PRICES: Record<string, number> = {
  waOrderConfirmation: 99,
  waReadyNotification: 99,
  waDeliveryConfirmation: 149,
  waFeedbackRequest: 99,
  waDailySalesReport: 149,
  waMonthlySummary: 199,
  waCustomerReviews: 199,
  waPromotionalBroadcast: 249,
  waReservationBooking: 199,
  waBirthdayOffers: 149,
};

const FREE_FEATURES: (keyof LicenseFeatures)[] = ['menu', 'customerOrdering'];

const DEFAULT_FEATURES: LicenseFeatures = {
  menu: true,
  customerOrdering: true,
  posDisplay: false,
  kitchenDisplay: false,
  deliveryDisplay: false,
  menuSignage: false,
  adminDashboard: false,
  menuManagement: false,
  reports: false,
  receiptPrinter: false,
  waOrderConfirmation: false,
  waReadyNotification: false,
  waDeliveryConfirmation: false,
  waFeedbackRequest: false,
  waDailySalesReport: false,
  waMonthlySummary: false,
  waCustomerReviews: false,
  waPromotionalBroadcast: false,
  waReservationBooking: false,
  waBirthdayOffers: false,
};

export function LicenseProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<LicenseFeatures>(DEFAULT_FEATURES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cafe-licenses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFeatures({ ...DEFAULT_FEATURES, ...parsed });
      } catch {
        // Invalid data, ignore
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem('cafe-licenses', JSON.stringify(features));
    }
  }, [features, loaded]);

  const isUnlocked = (feature: keyof LicenseFeatures) => {
    return features[feature] || false;
  };

  const unlockFeature = (feature: keyof LicenseFeatures, password: string): boolean => {
    if (password === FEATURE_PASSWORDS[feature]) {
      setFeatures(prev => ({ ...prev, [feature]: true }));
      return true;
    }
    return false;
  };

  const lockFeature = (feature: keyof LicenseFeatures) => {
    if (FREE_FEATURES.includes(feature)) return;
    setFeatures(prev => ({ ...prev, [feature]: false }));
  };

  const getPasswordHint = (feature: keyof LicenseFeatures) => {
    return FEATURE_HINTS[feature];
  };

  const getActiveWhatsAppCount = () => {
    const waKeys = Object.keys(WHATSAPP_PRICES) as (keyof LicenseFeatures)[];
    return waKeys.filter(k => features[k]).length;
  };

  const getWhatsAppMonthlyTotal = () => {
    const waKeys = Object.keys(WHATSAPP_PRICES) as (keyof LicenseFeatures)[];
    return waKeys.filter(k => features[k]).reduce((sum, k) => sum + (WHATSAPP_PRICES[k] || 0), 0);
  };

  return (
    <LicenseContext.Provider value={{ features, isUnlocked, unlockFeature, lockFeature, getPasswordHint, getActiveWhatsAppCount, getWhatsAppMonthlyTotal }}>
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}

export { WHATSAPP_PRICES };
