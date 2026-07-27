'use client';

import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useOwnerStore } from '@/lib/ownerStore';

interface OwnerGateProps {
  children: React.ReactNode;
}

export default function OwnerGate({ children }: OwnerGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const isSetup = useOwnerStore((state) => state.isSetup());
  const isLoggedIn = useOwnerStore((state) => state.isLoggedIn);
  const login = useOwnerStore((state) => state.login);
  const setupPassword = useOwnerStore((state) => state.setupPassword);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isLoggedIn) {
    return <>{children}</>;
  }

  const handleLogin = () => {
    setError('');
    if (!isSetup) {
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setupPassword(password);
      login(password);
    } else {
      const success = login(password);
      if (!success) {
        setError('Wrong password');
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-stone-800">
            {isSetup ? 'Owner Login' : 'Set Up Admin Password'}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {isSetup ? 'Enter your admin password' : 'Create a password to protect your dashboard'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg pr-12"
                placeholder={isSetup ? 'Enter password' : 'Create password (min 4)'}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isSetup && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg"
                placeholder="Confirm password"
              />
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={!password}
            className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {isSetup ? 'Login' : 'Set Password & Continue'}
          </button>
        </div>

        <div className="mt-4 bg-amber-50 rounded-xl p-3 border border-amber-100">
          <p className="text-xs text-amber-700 text-center">
            Your password is stored on this device only. All sales data is saved locally.
          </p>
        </div>
      </div>
    </div>
  );
}
