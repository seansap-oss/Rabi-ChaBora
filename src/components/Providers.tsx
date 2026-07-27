'use client';

import { LicenseProvider } from '@/lib/license';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LicenseProvider>
      {children}
    </LicenseProvider>
  );
}
