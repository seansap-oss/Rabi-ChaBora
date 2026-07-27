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
}

interface LicenseContextType {
  features: LicenseFeatures;
  isUnlocked: (feature: keyof LicenseFeatures) => boolean;
  unlockFeature: (feature: keyof LicenseFeatures, password: string) => boolean;
  lockFeature: (feature: keyof LicenseFeatures) => void;
  getPasswordHint: (feature: keyof LicenseFeatures) => string;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

// Password map - in production, these would be hashed
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
};

// Base features that are always free
const FREE_FEATURES: (keyof LicenseFeatures)[] = ['menu', 'customerOrdering'];

export function LicenseProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<LicenseFeatures>({
    menu: true,
    customerOrdering: true,
    posDisplay: false,
    kitchenDisplay: false,
    deliveryDisplay: false,
    menuSignage: false,
    adminDashboard: false,
    menuManagement: false,
    reports: false,
  });

  // Load saved licenses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cafe-licenses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFeatures(prev => ({ ...prev, ...parsed }));
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save to localStorage whenever features change
  useEffect(() => {
    localStorage.setItem('cafe-licenses', JSON.stringify(features));
  }, [features]);

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
    if (FREE_FEATURES.includes(feature)) return; // Can't lock free features
    setFeatures(prev => ({ ...prev, [feature]: false }));
  };

  const getPasswordHint = (feature: keyof LicenseFeatures) => {
    return FEATURE_HINTS[feature];
  };

  return (
    <LicenseContext.Provider value={{ features, isUnlocked, unlockFeature, lockFeature, getPasswordHint }}>
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
